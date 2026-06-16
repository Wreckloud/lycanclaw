# LycanClaw 前后端接口设计草案（V1）

本文用于前后端分离阶段的接口约定，先保证前端可平滑迁移，后续再逐步替换现有第三方能力。

## 1. 设计目标

- 前端组件层不改：继续只通过 `docs/.vitepress/theme/utils/*Api.ts` 调用数据。
- 后端可渐进接入：先提供网关形态接口，再逐步替换评论、音乐、推荐。
- 保留静态兜底：构建期 `public/*.json` 仍可作为降级来源。

## 2. API 基础约定

- Base URL：`/api`
- Content-Type：`application/json`
- 时间格式：ISO8601（UTC），前端统一转本地展示。

统一响应包结构：

```json
{
  "code": 0,
  "message": "ok",
  "data": {},
  "requestId": "trace-id"
}
```

- `code=0` 表示成功，非 0 表示业务错误。
- 建议错误码分段：
  - `1xxx` 参数错误
  - `2xxx` 认证授权
  - `3xxx` 外部依赖失败（网易云/Waline 等）
  - `5xxx` 服务内部错误

## 3. 模块与接口

## 3.1 评论模块（兼容 Waline 迁移）

- `GET /api/comments/recent?limit=5`
  - 用于首页最新评论组件
- `GET /api/comments/count?path=/thoughts/xxx.html`
  - 用于文章评论数展示
- `POST /api/comments`
  - 发布评论（后续可接审核/敏感词）

返回字段建议：

```json
{
  "id": "cmt_123",
  "path": "/thoughts/xxx.html",
  "nick": "Wreckloud",
  "content": "....",
  "createdAt": "2026-05-13T10:00:00Z"
}
```

## 3.2 音乐模块（自建代理与可播校验）

- `GET /api/music/weekly?limit=10`
  - 返回周听榜基础信息
- `GET /api/music/tracks/{trackId}`
  - 返回歌曲详情 + 可播放地址
- `GET /api/music/tracks/{trackId}/playable`
  - 仅返回可播状态（前端可快速判定）
- `POST /api/music/play-records`（可选）
  - 上报播放事件，用于后续推荐

返回字段建议：

```json
{
  "trackId": "123456",
  "name": "Song Name",
  "artist": "Artist",
  "cover": "https://...",
  "playUrl": "https://...",
  "playable": true,
  "source": "netease"
}
```

> 说明：必须遵循版权与平台规则，不做越权播放。

## 3.3 随想文章与 Tag 模块

- `GET /api/thoughts/tags`
  - 返回标签列表及计数
- `GET /api/thoughts?tag=xxx&page=1&pageSize=10`
  - 随想列表筛选（服务端分页）
- `GET /api/thoughts/{slug}`
  - 单篇详情（可选，后续若改 SSR/API 化时使用）

`/thoughts/tags` 示例：

```json
{
  "items": [
    { "tag": "反省日志", "count": 12 },
    { "tag": "三次元见闻录", "count": 9 }
  ]
}
```

## 3.4 统计模块（热力图/阅读量）

- `GET /api/stats/contributions/daily?days=365`
  - 每日贡献热力图数据（`add + del`）
- `GET /api/stats/pageview?path=/thoughts/xxx.html`
  - 获取文章阅读量
- `POST /api/stats/pageview`
  - 上报阅读行为（防刷策略后端实现）

热力图数据示例：

```json
{
  "metric": "additions_plus_deletions",
  "days": 365,
  "scope": ["docs/thoughts", "docs/knowledge", "docs/.vitepress/theme"],
  "data": [
    { "date": "2026-05-13", "additions": 120, "deletions": 40, "total": 160 }
  ]
}
```

## 3.5 推荐阅读模块

- `GET /api/recommendations?path=/thoughts/xxx.html&limit=5`
  - 返回相关文章推荐

V1 推荐策略建议（后端实现）：

- 标签相似度（权重最高）
- 时间衰减（近期略加权）
- 内容相似度（标题 + 摘要关键词）

## 4. 前端迁移策略（不破坏现有页面）

1. 保留当前静态 JSON 方案，新增后端接口并行。
2. `utils/*Api.ts` 增加“后端优先 + 静态兜底”策略。
3. 接口稳定后逐个关闭第三方源依赖。

## 5. 后端项目建议（Java + MySQL）

- 技术栈：Spring Boot 3 + MySQL 8 + MyBatis-Plus + Flyway + Redis（可选）
- 目录建议：
  - `api`（Controller/DTO）
  - `app`（Service）
  - `domain`（Entity/Repository）
  - `infra`（第三方适配：网易云/Waline）
- 非功能：
  - 接口限流（评论/播放）
  - 统一日志 + traceId
  - 基础鉴权（管理端）
