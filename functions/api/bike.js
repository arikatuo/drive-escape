function jsonResp(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}

async function parallelLimit(tasks, limit = 5) {
  const results = new Array(tasks.length);
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const taskIndex = index++;
      results[taskIndex] = await tasks[taskIndex]();
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return results;
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return jsonResp({});
  if (request.method !== "POST") return jsonResp({ error: "Method Not Allowed" }, 405);
  if (!env.AMAP_KEY) return jsonResp({ error: "AMAP_KEY is not configured" }, 500);

  const body = await request.json();
  const { origin, destinations = [] } = body || {};
  if (!origin || !Array.isArray(destinations) || destinations.length === 0) return jsonResp({});

  const tasks = destinations.map(dest => async () => {
    const cacheKey = `bike:${origin}:${dest}`;
    const cached = await env.DRIVE_CACHE?.get(cacheKey);
    if (cached) return [dest, JSON.parse(cached)];

    const apiUrl = `https://restapi.amap.com/v4/direction/bicycling?origin=${origin}&destination=${dest}&key=${env.AMAP_KEY}`;
    const res = await fetch(apiUrl);
    const data = await res.json();
    const path = data.data?.paths?.[0];
    const result = {
      duration: Math.round(parseInt(path?.duration || "0", 10) / 60),
      distance: Math.round(parseInt(path?.distance || "0", 10) / 1000)
    };

    if (env.DRIVE_CACHE) {
      await env.DRIVE_CACHE.put(cacheKey, JSON.stringify(result), {
        expirationTtl: 60 * 60 * 24 * 7
      });
    }

    return [dest, result];
  });

  const entries = await parallelLimit(tasks, 5);
  return jsonResp(Object.fromEntries(entries));
}
