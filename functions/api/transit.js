import HSR_STATIONS from "../../data/hsr_stations.json";
import HSR_MATRIX from "../../data/hsr_matrix.json";

function jsonResp(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}

function haversine(lng1, lat1, lng2, lat2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearbyStations(lng, lat, stations, n) {
  return stations
    .map(s => ({ ...s, dist: haversine(lng, lat, s.lng, s.lat) }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, n);
}

async function getTransfer(env, from, to, cache) {
  const key = `transfer:${from}:${to}`;
  if (cache[key] != null) return cache[key];
  const kvVal = await env.DRIVE_CACHE?.get(key);
  if (kvVal) {
    cache[key] = parseInt(kvVal, 10);
    return cache[key];
  }

  const res = await fetch(`https://restapi.amap.com/v3/direction/driving?origin=${from}&destination=${to}&key=${env.AMAP_KEY}`);
  const data = await res.json();
  const duration = parseInt(data.route?.paths?.[0]?.duration || "1800", 10);
  const minutes = Math.round(duration / 60);

  if (env.DRIVE_CACHE) {
    await env.DRIVE_CACHE.put(key, String(minutes), {
      expirationTtl: 60 * 60 * 24 * 30
    });
  }

  cache[key] = minutes;
  return minutes;
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== "POST") return jsonResp({ error: "Method Not Allowed" }, 405);
  if (!env.AMAP_KEY) return jsonResp({ error: "AMAP_KEY is not configured" }, 500);

  const body = await request.json();
  const { originLng, originLat, districts = [] } = body || {};
  if (!originLng || !originLat || !Array.isArray(districts) || districts.length === 0) return jsonResp({});
  if (!Array.isArray(HSR_STATIONS) || !HSR_STATIONS.length) return jsonResp({});

  const originStations = findNearbyStations(originLng, originLat, HSR_STATIONS, 3);
  const transferCache = {};
  const results = {};

  for (const dist of districts) {
    const destStations = findNearbyStations(dist.lng, dist.lat, HSR_STATIONS, 2);
    let bestTime = Infinity;
    let bestBreakdown = null;

    for (const oSt of originStations) {
      for (const dSt of destStations) {
        const trainTime = HSR_MATRIX[`${oSt.id}_${dSt.id}`];
        if (!trainTime) continue;

        const toStation = await getTransfer(env, `${originLng},${originLat}`, `${oSt.lng},${oSt.lat}`, transferCache);
        const fromStation = await getTransfer(env, `${dSt.lng},${dSt.lat}`, `${dist.lng},${dist.lat}`, transferCache);
        const totalTime = toStation + trainTime + fromStation;

        if (totalTime < bestTime) {
          bestTime = totalTime;
          bestBreakdown = {
            toStation,
            trainTime,
            fromStation,
            oSt: oSt.name,
            dSt: dSt.name
          };
        }
      }
    }

    if (bestTime !== Infinity) {
      results[dist.adcode] = {
        time: Math.round((bestTime / 60) * 10) / 10,
        breakdown: bestBreakdown
      };
    }
  }

  return jsonResp(results);
}
