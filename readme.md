# LycanClaw

LycanClaw 是我的个人内容站，用来长期整理技术笔记、项目记录、随笔文章和个人创作。

最初基于 hexo 搭建，在我进一步学习之后又改用 VitePress 写了一些vue的组件，这次应该算得上第三次升级了。博客的核心目标仍然让我保持继续使用 Markdown 写作，并通过 Git 自动发布到线上。这次我打算真正让博客拥有后端，而非纯静态，逐步补齐部署、评论、阅读统计和媒体展示等能力。

## 项目定位

这个站点主要承担几类内容：

- 技术学习笔记
- 项目开发记录
- 个人随笔与长期思考
- 画作、设定和创作内容展示

## 当前技术栈

前端与内容构建：

- VitePress
- Markdown
- 自定义主题组件
- 构建前数据生成脚本

当前动态能力：

- 评论
- 阅读量统计

这些动态能力目前仍可以先沿用现有方案，后续再逐步迁移到更可控的服务中。

## Theme 架构规范

### 目标

- 在不改变现有功能的前提下，降低维护成本
- 明确组件职责边界（layout、content、section、common、utils）
- 非必要不新增全局组件注册

### 目录约定

- `docs/.vitepress/theme/components/`
  - `MyLayout.vue`：页面级布局编排
  - `PostList.vue`、`PostTitle.vue`、`Comment.vue`、`DataPanel.vue`：核心内容组件
  - `home/`：首页专用区块
  - `about/`：关于页专用区块
  - `common/`：跨页面复用组件
- `docs/.vitepress/theme/utils/`
  - 运行时服务：`audioService`、`audioManager`
  - 音乐数据服务：`musicApi`（网易云接口聚合与解析）
  - API 封装：`commentApi`、`pageViewApi`
  - API 响应解析：`apiResponseParsers`
  - 内容数据层：`contentData`
  - 首页统计计算：`homeAnalytics`
  - 纯工具：`contentMetrics`
- `docs/.vitepress/theme/setup/`
  - `registerGlobalComponents`：集中管理全局组件与运行时注入
  - `runtimeEffects`：路由副作用、预加载与首页高度同步
  - `useImageZoom`：图片缩放初始化与路由切换重挂载
- `docs/.vitepress/theme/styles/`
  - 全局样式与修复样式

### 开发规则

- 页面专用组件优先局部 import，不默认全局注册
- 仅当 Markdown 直接使用时才做全局组件注册
- 重复逻辑统一提取到 `utils/`，避免复制粘贴
- 网络请求统一放在 `utils/*Api.ts` 内封装
- 动画和 DOM 生命周期逻辑放在组件内部 `onMounted/onBeforeUnmount`

### 当前基线

- 当前构建可通过（VitePress `1.6.3`）
- 已清理一批失效脚本和未引用文件
- 文章字数/阅读时长逻辑已收敛到 `utils/contentMetrics.js`
- 首页数据读取、筛选、统计已从组件内联逻辑收敛到 `contentData + homeAnalytics`
- 音乐相关组件已改为统一调用 `musicApi`，便于后续切换到自建 API
- `.gitignore` 已覆盖 Obsidian 元数据目录，避免误提交本地笔记配置

### 下一步清理方向

- 补充 ESLint 规则，优先拦截未使用导入和死代码
- 统一音乐相关组件（`HomeMusicPlayer` / `SimpleMusicPlayer` / `GlobalMusicPlayer`）的共享逻辑
- 逐步收敛首页组件中的动画触发器与 `setTimeout` 调度逻辑

## 时间显示规范

为避免各组件重复手写日期解析，时间显示统一由 `docs/.vitepress/theme/utils/time.js` 负责。

### 场景规则

- 文章详情元信息：显示绝对时间到秒（`YYYY年MM月DD日 HH:mm:ss`）
- 文章列表页：显示绝对日期（`YYYY年MM月DD日`）
- 首页推荐：显示简短日期（`MM月DD日`）
- 近期动态：`1-6天` 显示 `X天前`，`7-13天` 显示 `1周前`，更久显示绝对日期
- 最新评论：`1-6天` 显示 `X天前`，之后按 `X周前` 递进，超过 1 个月后显示绝对日期
- 任何跨年的绝对日期都必须显示年份（例如 `2025年07月08日`）

### 统一工具

- `parseDateInput(input)`：统一解析 frontmatter 与 API 返回的日期
- `formatDateCn(input, { withYear, withTime })`：绝对时间格式化
- `formatMonthDayCn(input)`：简短日期格式化
- `formatRelativeTimeCn(input, options)`：相对时间格式化
  - 支持 `maxRelativeWeeks`，用于限制最多显示到几周前（例如近期动态只显示 `1周前`）
- `timeDisplayPolicy.js`：统一管理“近期动态/最新评论”等时间展示策略，组件只调用封装方法

### 代码约束

- 组件内不再新增手写 `formatDate`、`new Date(string)` 解析逻辑
- 日期排序前先调用 `parseDateInput`，避免跨浏览器解析差异

## 维护检查

- `pnpm run build`：验证数据生成 + VitePress 构建完整链路

## Git 忽略约定

- 已忽略 Obsidian 元数据目录：`.obsidian/`、`**/.obsidian/`、`.trash/`
- 构建产物与缓存不入库：`docs/.vitepress/cache/`、`docs/.vitepress/dist/`
