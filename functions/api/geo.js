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
  const url = new URL(request.url);
  const keywords = (url.searchParams.get("keywords") || "").trim();
  const level = url.searchParams.get("level") || "district";

  if (!keywords) return jsonResp({ error: "invalid keywords" }, 400);
  if (!env.AMAP_KEY) return jsonResp({ error: "AMAP_KEY is not configured" }, 500);

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

    const city = data.districts[0];
    const result = {
      city,
      districts: city.districts || []
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
