function jsonResp(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}

function normalizeKeywords(input) {
  return (input || "")
    .trim()
    .replace(/市辖区$/, "")
    .replace(/特别行政区$/, "")
    .replace(/自治区$/, "")
    .replace(/自治州$/, "")
    .replace(/地区$/, "")
    .replace(/盟$/, "")
    .trim();
}

function pickDistrictRoot(districts) {
  if (!Array.isArray(districts) || !districts.length) return null;
  const root = districts[0];
  if (!Array.isArray(root.districts) || !root.districts.length) return root;

  const directMunicipalities = new Set(["110000", "120000", "310000", "500000"]);
  if (directMunicipalities.has(String(root.adcode))) {
    const cityNode = root.districts[0];
    if (cityNode?.districts?.length) {
      return {
        ...cityNode,
        parent: { adcode: root.adcode, name: root.name },
        province: root
      };
    }
  }
  return root;
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return jsonResp({});
  const url = new URL(request.url);
  const rawKeywords = (url.searchParams.get("keywords") || "").trim();
  const level = url.searchParams.get("level") || "district";

  if (!rawKeywords) return jsonResp({ error: "invalid keywords" }, 400);
  if (!env.AMAP_KEY) return jsonResp({ error: "AMAP_KEY is not configured" }, 500);

  const keywords = normalizeKeywords(rawKeywords);
  const cacheKey = `geo:${keywords}:${level}`;
  const cached = await env.DRIVE_CACHE?.get(cacheKey);
  if (cached) return jsonResp(JSON.parse(cached));

  try {
    const target = `https://restapi.amap.com/v3/config/district?keywords=${encodeURIComponent(keywords)}&subdistrict=2&extensions=all&key=${env.AMAP_KEY}`;
    const res = await fetch(target);
    const data = await res.json();
    if (data.status !== "1" || !data.districts?.length) {
      return jsonResp({ error: "AMap district query failed" }, 502);
    }

    const city = pickDistrictRoot(data.districts);
    if (!city) return jsonResp({ error: "No district data found" }, 404);

    const result = {
      city,
      districts: city.districts || [],
      province: city.province || null
    };

    if (env.DRIVE_CACHE) {
      await env.DRIVE_CACHE.put(cacheKey, JSON.stringify(result), {
        expirationTtl: 60 * 60 * 24 * 30
      });
    }
    return jsonResp(result);
  } catch (e) {
    return jsonResp({ error: e.message }, 502);
  }
}
