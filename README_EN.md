# 🚗 Drive Escape - Mainland China AMap Fork

This fork is migrating the original project to an AMap based Mainland China workflow.

**Live Demo** → [drive-escape.pomodiary.com](https://drive-escape.pomodiary.com)

**Author** → [@benshandebiao](https://x.com/benshandebiao)
🌐 [简体中文](./README_ZH.md) | [繁體中文](./README_TW.md) | [日本語](./README_JA.md)

## Features

- 🔍 Mainland city search via AMap
- 🗺️ District boundaries via AMap district API
- 🚗 Car mode via AMap distance matrix
- 🏍 Moto mode reusing car data
- 🚲 Bike mode via AMap bicycling API
- 🚄 HSR mode scaffold via offline matrix + AMap transfers
- ⏱️ Adjustable 1-12 hour range
- ☁️ Cloudflare KV ready

## Tech Stack

| Component | Solution |
|-----------|----------|
| Map | Leaflet + OpenStreetMap |
| China Boundaries | AMap District API |
| Driving Time | AMap Distance / Bicycling API |
| City Search | AMap Place Search API |
| Cache | Cloudflare KV |
| HSR | Offline JSON matrix + AMap transfer routing |
| Hosting | Cloudflare Pages + Functions |

## Configuration

Required before deployment:

1. Create KV namespaces.

```bash
wrangler kv:namespace create "DRIVE_CACHE"
wrangler kv:namespace create "DRIVE_CACHE" --preview
```

2. Update [wrangler.toml](/F:/driveescape/repo/wrangler.toml) with the returned IDs.

3. Set the AMap key.

```bash
wrangler secret put AMAP_KEY
```

4. Fill the placeholder data files:

- [hsr_stations.json](/F:/driveescape/repo/data/hsr_stations.json)
- [hsr_matrix.json](/F:/driveescape/repo/data/hsr_matrix.json)

## Run Locally

```bash
git clone https://github.com/arikatuo/drive-escape.git
cd drive-escape
python3 -m http.server 8080
```

Static hosting alone will not provide `/api/*` functions. For real local testing, run:

```bash
wrangler pages dev .
```

## Deploy

```bash
wrangler pages deploy . --project-name drive-escape
```

## License

MIT
