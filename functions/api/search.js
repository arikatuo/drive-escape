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

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return jsonResp({});
  const url = new URL(request.url);
  const keywords = (url.searchParams.get("keywords") || "").trim();

  if (!keywords) return jsonResp([]);
  if (!env.AMAP_KEY) return jsonResp({ error: "AMAP_KEY is not configured" }, 500);

  const apiUrl = `https://restapi.amap.com/v3/place/text?keywords=${encodeURIComponent(keywords)}&types=城市&key=${env.AMAP_KEY}&output=json`;
  const res = await fetch(apiUrl);
  const data = await res.json();

  const pois = (data.pois || [])
    .filter(p => ["city", "district", "biz_area"].includes(p.typecode) || /市|区|县|州|盟/.test(p.name || ""))
    .filter(p => p.location && p.location.includes(","))
    .map(p => {
      const [lon, lat] = p.location.split(",");
      return {
        display_name: p.name,
        address: p.address || "",
        lon,
        lat,
        adcode: p.adcode || "",
        country_code: "cn"
      };
    })
    .slice(0, 8);

  return jsonResp(pois);
}
