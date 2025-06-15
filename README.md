# LycanClaw 个人博客

基于VitePress构建的个人博客网站，专注于前端技术分享和个人随笔。本文档介绍项目特点与结构，帮助开发者快速了解系统。

## 项目特点

- 🚀 **高性能**：基于VitePress构建，享受Vue 3和Vite带来的极速开发与访问体验
- 📱 **响应式设计**：针对桌面、平板和移动设备优化的UI，流畅适配各种屏幕
- 🌙 **暗黑模式**：无缝支持明亮与暗黑主题切换，提升阅读体验
- 📊 **数据统计**：内置访问统计、字数统计和内容分析功能
- 🖼️ **交互增强**：粒子特效、图片缩放、文章轮播等丰富交互体验
- 🏷️ **内容组织**：标签系统和分类功能，多维度整合文章内容
- 💬 **评论系统**：集成Waline，支持实时展示最新评论
- ⚡ **优化性能**：组件按需加载、代码分割、资源预加载等优化手段

## 项目结构

```
docs/
  ├── .vitepress/               # VitePress配置目录
  │   ├── config/               # 配置文件目录
  │   │   ├── navbar.ts         # 导航栏配置
  │   │   ├── sidebar.ts        # 侧边栏配置
  │   │   └── recommended-posts.js # 推荐文章配置
  │   ├── theme/                # 主题定制目录
  │   │   ├── components/       # 组件目录
  │   │   │   ├── home/         # 首页组件
  │   │   │   │   ├── EncourageWidget.vue    # 催更组件
  │   │   │   │   ├── RecentComments.vue     # 最新评论组件
  │   │   │   │   ├── RecommendedReading.vue # 推荐阅读组件
  │   │   │   │   └── StatsPanel.vue         # 数据统计面板
  │   │   │   └── global/       # 全局组件
  │   │   ├── styles/           # 样式文件
  │   │   ├── utils/            # 工具函数
  │   │   └── index.ts          # 主题入口文件
  │   └── config.ts             # VitePress主配置文件
  ├── public/                   # 静态资源目录
  ├── thoughts/                 # 随想文章目录
  └── knowledge/                # 知识笔记目录
```

## 核心组件详解

### 首页组件

#### 1. EncourageWidget.vue

催更组件，支持用户点击催促更新。

**特点**：
- 粒子特效动画
- 点击次数本地存储
- 触摸和鼠标事件优化
- 防抖与节流处理
- 悬停提示与自动隐藏
- 会话级点击追踪

```js
// 使用示例
<encourage-widget 
  :post-count="stats.currentMonthPosts" 
  :animated-count="stats.animatedCurrentMonthPosts"
/>
```

#### 2. RecommendedReading.vue

推荐阅读轮播组件，展示精选文章。

**特点**：
- 响应式轮播布局
- 自适应多种文章数量(1-5篇)
- 自动轮播与手动控制
- 触摸滑动支持
- 键盘导航支持
- 渐变遮罩效果
- 基于进度比例的滚动控制

```js
// 配置推荐文章
// config/recommended-posts.js
export const recommendedPosts = [
  '/thoughts/article-1.html',
  '/thoughts/article-2.html'
]
```

#### 3. StatsPanel.vue

数据统计面板，展示博客各项统计数据。

**特点**：
- 文章数量统计
- 本月更新统计
- 总字数统计
- 数字滚动动画
- 交叉观察器触发动画
- 自适应布局
- 本地数据缓存

#### 4. RecentComments.vue

最新评论组件，显示站点最近评论。

**特点**：
- 异步数据加载状态管理
- 骨架屏加载效果
- 滚动监听
- 渐变遮罩
- 评论自动格式化
- 错误处理与重试机制

### 工具与优化

#### 使用VueUse库

项目大量使用VueUse库提供的组合式API函数：

```js
import { 
  useLocalStorage,      // 本地存储持久化
  useThrottleFn,        // 函数节流
  useDebounceFn,        // 函数防抖
  useWindowSize,        // 响应式窗口尺寸
  useIntersectionObserver, // 元素可见性监测
  useEventListener,     // 事件监听器
  useIntervalFn,        // 定时器封装
  useScroll,            // 滚动位置追踪
  useAsyncState         // 异步状态管理
} from '@vueuse/core'
```

#### 性能优化手段

- **组件按需加载**：使用`defineAsyncComponent`实现组件懒加载
- **防抖与节流**：对频繁触发的事件进行优化
- **CSS动画性能**：使用transform和opacity属性实现高性能动画
- **条件渲染**：仅在必要时渲染复杂组件
- **局部状态更新**：避免不必要的组件重渲染
- **资源预加载**：预加载关键资源提升体验

## 移动设备兼容性

为确保在移动设备上的良好体验，特别优化了以下内容：

- **触摸事件支持**：所有交互组件支持触摸事件
- **视口适配**：自动调整布局适应小屏设备
- **性能优化**：减少移动设备上的计算负担
- **可访问性**：适当的按钮大小和间距，提升易用性

## 开发指南

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### 添加新组件提示

添加新的首页组件时：

1. 在`docs/.vitepress/theme/components/home/`目录下创建组件
2. 合理使用VueUse库中的工具函数
3. 遵循现有动画和交互模式，使用`useIntersectionObserver`检测可见性
4. 添加响应式设计，使用媒体查询适配不同设备
5. 实现适当的加载态、错误态和空态处理

## 许可证

MIT 