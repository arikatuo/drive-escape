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

- Cloudflare Pages 项目里的 `AMAP_KEY` 运行时变量
- Cloudflare Pages 项目里的 `DRIVE_CACHE` KV 绑定（可选但推荐）
- [hsr_stations.json](/F:/driveescape/repo/data/hsr_stations.json)
- [hsr_matrix.json](/F:/driveescape/repo/data/hsr_matrix.json)

如果不补高铁数据，高铁模式不会返回有效结果。

## 配置说明

1. 创建 Cloudflare KV（可选但推荐，开启后可减少 API 调用）。

```bash
wrangler kv:namespace create "DRIVE_CACHE"
wrangler kv:namespace create "DRIVE_CACHE" --preview
```

2. 在 Cloudflare Pages 项目中添加 KV 绑定：

- Binding 名称：`DRIVE_CACHE`
- 绑定到你创建的 namespace

3. 在 Cloudflare Pages 项目中添加运行时变量：

- 变量名：`AMAP_KEY`
- 变量值：你的高德 Key

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

- Pages 已配置 `AMAP_KEY`
- Pages（可选）已绑定 `DRIVE_CACHE`
- `data/hsr_stations.json` 与 `data/hsr_matrix.json` 已准备完毕

## 开源协议

MIT
