# 🚗 周末自驾逃离计划中国大陆版

这是基于原始 `drive-escape` 改造的中国大陆版 fork，核心路线是 `高德 API + Cloudflare Pages Functions + KV`。

**在线体验** → [drive-escape.pomodiary.com](https://drive-escape.pomodiary.com)

**作者** → [@benshandebiao](https://x.com/benshandebiao)

🌐 [English](./README_EN.md) | [繁體中文](./README_TW.md) | [日本語](./README_JA.md)

## 功能

- 🔍 使用高德地点搜索进行大陆城市检索
- 🗺️ 使用高德行政区划 API 加载区县边界
- 🚗 汽车模式使用高德距离矩阵
- 🏍 摩托模式复用汽车结果，并标注为近似值
- 🚲 自行车模式使用高德骑行接口
- 🚄 高铁模式已接好接口骨架，依赖离线站点和站间时长数据
- ⏱️ 支持 1 到 12 小时动态时间范围
- ☁️ 预留 Cloudflare KV 缓存层

## 技术栈

| 组件 | 方案 |
|------|------|
| 地图渲染 | Leaflet + OpenStreetMap |
| 中国区划 | 高德行政区划 API |
| 路线时间 | 高德距离矩阵 / 骑行 API |
| 城市搜索 | 高德地点搜索 API |
| 缓存 | Cloudflare KV |
| 高铁模式 | 离线矩阵 + 高德接驳 |
| 部署 | Cloudflare Pages + Functions |

## 当前状态

这个 fork 当前已经完成：

- 中国大陆城市搜索接入
- 中国大陆区划加载接入
- `car / moto / bike / hsr` 前端状态和接口链路接入
- `geo / search / drive / bike / transit` Functions 落地

当前仍需你补充：

- [wrangler.toml](/F:/driveescape/repo/wrangler.toml) 里的 KV namespace ID
- Cloudflare Secret `AMAP_KEY`
- [hsr_stations.json](/F:/driveescape/repo/data/hsr_stations.json)
- [hsr_matrix.json](/F:/driveescape/repo/data/hsr_matrix.json)

如果不补高铁数据，高铁模式不会返回有效结果。

## 配置说明

1. 创建 Cloudflare KV。

```bash
wrangler kv:namespace create "DRIVE_CACHE"
wrangler kv:namespace create "DRIVE_CACHE" --preview
```

2. 把返回的 `id` 和 `preview_id` 写入 [wrangler.toml](/F:/driveescape/repo/wrangler.toml)。

3. 配置高德 Key。

```bash
wrangler secret put AMAP_KEY
```

4. 准备高铁静态数据。

- [hsr_stations.json](/F:/driveescape/repo/data/hsr_stations.json)：高铁站基础信息
- [hsr_matrix.json](/F:/driveescape/repo/data/hsr_matrix.json)：站间最短耗时矩阵

5. 使用 Cloudflare 本地开发或线上环境测试 Functions。

## 本地运行

```bash
git clone https://github.com/arikatuo/drive-escape.git
cd drive-escape
python3 -m http.server 8080
```

注意：仅静态 HTTP 服务无法提供 `/api/*` 和 `AMAP_KEY`，只能看前端页面。要联调 Functions，请使用：

```bash
wrangler pages dev .
```

## 部署

```bash
wrangler pages deploy . --project-name drive-escape
```

部署前请确认：

- `wrangler.toml` 已填好 KV ID
- `AMAP_KEY` 已写入 secret
- `data/hsr_stations.json` 与 `data/hsr_matrix.json` 已准备完毕

## 开源协议

MIT
