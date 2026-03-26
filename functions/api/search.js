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

function parseCenter(center) {
  const [lon, lat] = String(center || "").split(",");
  if (!lon || !lat) return null;
  return { lon, lat };
}

function normalizeLabel(value) {
  return Array.isArray(value) ? value.filter(Boolean).join("") : (value || "");
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return jsonResp({});
  const url = new URL(request.url);
  const keywords = normalizeKeywords((url.searchParams.get("keywords") || "").trim());

  if (!keywords) return jsonResp([]);
  if (!env.AMAP_KEY) return jsonResp({ error: "AMAP_KEY is not configured" }, 500);

  const districtUrl = `https://restapi.amap.com/v3/config/district?keywords=${encodeURIComponent(keywords)}&subdistrict=0&extensions=base&key=${env.AMAP_KEY}`;
  const districtRes = await fetch(districtUrl);
  const districtData = await districtRes.json();

  const districtHits = (districtData.districts || [])
    .filter(d => d.center && d.level && ["city", "district", "province"].includes(d.level))
    .map(d => {
      const center = parseCenter(d.center);
      if (!center) return null;
      const cityLabel = normalizeLabel(d.cityname);
      const provinceName = normalizeLabel(d.pname);
      const provinceCity = d.level === "district"
        ? `${provinceName}${cityLabel}`.trim()
        : d.level === "city"
        ? provinceName
        : "";
      return {
        display_name: d.name,
        province_city: provinceCity,
        address: d.level === "province" ? "省级行政区" : d.level === "city" ? "城市" : "区县",
        lon: center.lon,
        lat: center.lat,
        adcode: d.adcode || "",
        country_code: "cn",
        level: d.level
      };
    })
    .filter(Boolean);

  if (districtHits.length) {
    return jsonResp(districtHits.slice(0, 8));
  }

  const placeUrl = `https://restapi.amap.com/v3/place/text?keywords=${encodeURIComponent(keywords)}&types=地名地址信息|商务住宅|政府机构及社会团体&key=${env.AMAP_KEY}&output=json&citylimit=false`;
  const placeRes = await fetch(placeUrl);
  const placeData = await placeRes.json();

  const pois = (placeData.pois || [])
    .filter(p => p.location && p.location.includes(","))
    .filter(p => p.cityname || p.adname || /市|区|县|州|盟/.test(p.name || ""))
    .map(p => {
      const center = parseCenter(p.location);
      if (!center) return null;
      return {
        display_name: p.cityname || p.name,
        province_city: [p.pname, p.cityname].filter(Boolean).join(""),
        address: [p.pname, p.cityname, p.adname].filter(Boolean).join(" "),
        lon: center.lon,
        lat: center.lat,
        adcode: p.adcode || "",
        country_code: "cn",
        level: p.cityname ? "city" : "district"
      };
    })
    .filter(Boolean);

  const deduped = [];
  const seen = new Set();
  for (const item of pois) {
    const key = `${item.display_name}:${item.adcode}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
    if (deduped.length >= 8) break;
  }

  return jsonResp(deduped);
}
