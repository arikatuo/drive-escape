# 🚗 Drive Escape — Mainland China AMap Fork

This fork is migrating `drive-escape` to a Mainland China oriented stack based on AMap + Cloudflare Pages Functions.

**Live Demo** → [drive-escape.pomodiary.com](https://drive-escape.pomodiary.com)

**Author** → [@benshandebiao](https://x.com/benshandebiao)

🌐 [简体中文](./README_ZH.md) | [繁體中文](./README_TW.md) | [日本語](./README_JA.md)

---

## Features

- 🔍 Mainland city search via AMap place search API
- 🗺️ District boundaries loaded from AMap district API
- 🚗 `car` mode via AMap distance matrix
- 🏍 `moto` mode reuses car data and marks results as approximate
- 🚲 `bike` mode via AMap bicycling API
- 🚄 `hsr` mode scaffolded with offline station/matrix data + AMap transfer routing
- ⏱️ Dynamic time limit slider from 1 to 12 hours
- ☁️ Cloudflare Pages Functions + KV cache ready

## Tech Stack

| Component | Solution |
|-----------|----------|
| Map rendering | Leaflet + OpenStreetMap |
| China boundaries | AMap District API |
| Driving time | AMap Distance / Bicycling API |
| City search | AMap Place Search API |
| Cache | Cloudflare KV |
| HSR mode | Offline JSON matrix + AMap transfer routing |
| Hosting | Cloudflare Pages + Functions |

## Status

Current implementation status in this fork:

- Mainland search / district loading / car-bike-moto API flow is wired in
- HSR API route and front-end path are wired in
- `data/hsr_stations.json` and `data/hsr_matrix.json` are placeholders and must be filled before HSR can work
- `wrangler.toml` contains placeholder KV IDs and must be updated before deployment

## Required Configuration

Before running or deploying this fork, configure the following:

1. Create Cloudflare KV namespaces.

```bash
wrangler kv:namespace create "DRIVE_CACHE"
wrangler kv:namespace create "DRIVE_CACHE" --preview
```

2. Put the returned IDs into [wrangler.toml](/F:/driveescape/repo/wrangler.toml).

3. Configure the AMap key.

```bash
wrangler secret put AMAP_KEY
```

4. Prepare HSR data files.

- [hsr_stations.json](/F:/driveescape/repo/data/hsr_stations.json): station metadata
- [hsr_matrix.json](/F:/driveescape/repo/data/hsr_matrix.json): station-to-station shortest travel minutes

5. Deploy with Pages Functions support enabled.

## Run Locally

```bash
git clone https://github.com/arikatuo/drive-escape.git
cd drive-escape
python3 -m http.server 8080
# note: /api/* functions and AMAP_KEY are not available in plain static hosting
```

For real function testing, use Cloudflare local dev:

```bash
wrangler pages dev .
```

## Deploy

```bash
wrangler pages deploy . --project-name drive-escape
```

## License

MIT
