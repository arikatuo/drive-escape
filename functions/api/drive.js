function jsonResp(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return jsonResp({});
  if (request.method !== "POST") return jsonResp({ error: "Method Not Allowed" }, 405);
  if (!env.AMAP_KEY) return jsonResp({ error: "AMAP_KEY is not configured" }, 500);

  const body = await request.json();
  const { origin, destinations = [], cityAdcode = "" } = body || {};
  if (!origin || !Array.isArray(destinations) || destinations.length === 0) return jsonResp({});

  // Keep the cache key short to stay within KV key length limits.
  const cacheKey = `drive:${origin}:${cityAdcode}`;
  const cached = await env.DRIVE_CACHE?.get(cacheKey);
  if (cached) return jsonResp(JSON.parse(cached));

  const BATCH = 100;
  const results = {};

  for (let i = 0; i < destinations.length; i += BATCH) {
    const batch = destinations.slice(i, i + BATCH);
    const destStr = batch.join("|");
    const apiUrl = `https://restapi.amap.com/v3/distance?origins=${origin}&destinations=${destStr}&type=1&key=${env.AMAP_KEY}`;
    const res = await fetch(apiUrl);
    const data = await res.json();
    if (data.status !== "1") {
      if (data.infocode === "10003" || data.infocode === "10004") {
        return jsonResp({ error: "quota_exceeded", fallback: true }, 200);
      }
      continue;
    }

    (data.results || []).forEach((r, seq) => {
      // AMap destination_id starts from 1.
      const rawIdx = parseInt(r.destination_id || "0", 10) - 1;
      const idx = Number.isFinite(rawIdx) && rawIdx >= 0 ? rawIdx : seq;
      if (idx < 0 || idx >= batch.length) return;
      const duration = parseInt(r.duration || "0", 10);
      const distance = parseInt(r.distance || "0", 10);
      results[batch[idx]] = {
        duration: Math.round(duration / 60),
        distance: Math.round(distance / 1000)
      };
    });
  }

  if (env.DRIVE_CACHE) {
    await env.DRIVE_CACHE.put(cacheKey, JSON.stringify(results), {
      expirationTtl: 60 * 60 * 24 * 7
    });
  }

  return jsonResp(results);
}
