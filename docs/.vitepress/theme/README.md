# LycanClaw 主题定制指南

本文档介绍了 LycanClaw 网站的主题定制内容和维护方法，同时为Vue初学者提供基础指导。

## 目录结构

```
docs/.vitepress/theme/
├── components/           # 自定义组件
│   ├── ArticleMetadata.vue  # 文章元数据组件
│   ├── DataPanel.vue     # 页脚数据面板组件 
│   ├── MyLayout.vue      # 自定义布局组件
│   ├── PostList.vue      # 博客列表组件
│   └── PostTitle.vue     # 文章标题组件
├── styles/              # 样式文件
│   ├── index.css        # 样式入口
│   └── var.css          # 主题变量
├── index.js             # 主题入口
└── utils/              # 工具函数
    └── wordCount.js    # 字数统计工具
```


## 自定义组件详解

### ArticleMetadata

在文章标题下方显示字数和阅读时间。

**关键特性**：
- 监听路由变化重新计算字数
- 使用computed属性处理日期格式化
- 浏览器环境检测防止SSR错误

**用法**：在Markdown文件的H1标题下方会自动显示。

### DataPanel

页脚组件，显示网站运行时间、访问统计和一言API内容。

**关键特性**：
- 计时器实时更新
- 不蒜子访问统计
- 一言API内容获取
- 条件渲染(仅在无侧边栏时显示)

### PostList

显示博客文章列表，过滤和排序 `thoughts` 目录下的文章。

**关键特性**：
- 异步获取文章数据
- 文章摘要提取
- 字数统计和阅读时间计算
- 标签显示

**用法**：在Markdown文件中使用 `<PostList />` 标签。

### PostTitle

显示文章标题和元数据。

**关键特性**：
- 条件渲染元数据组件
- 使用渐变色标题样式

## 样式指南

### VitePress中的CSS变量

VitePress提供了许多CSS变量用于主题定制：

- `--vp-c-brand`: 品牌颜色系列
- `--vp-c-text`: 文本颜色系列
- `--vp-c-bg`: 背景颜色系列
- `--vp-c-divider`: 分割线颜色

### 样式封装选项

项目使用`<style scoped>`实现样式封装，防止样式冲突：

```vue
<style scoped>
/* 样式仅应用于当前组件 */
</style>
```

## 添加新文章

要添加新的博客文章，只需按照以下步骤操作：

1. 在 `docs/thoughts/` 目录下创建新的 Markdown 文件
2. 确保添加正确的 frontmatter 信息，例如：

```markdown
---
title: 文章标题
description: 文章描述
date: '2024-07-26 11:45:14'
publish: true
tags: ['标签1', '标签2']
---

# 文章标题

文章内容...
```

3. 文章将自动被加载到博客列表中

> **注意**：如果要在文章中指定摘要，可以在希望作为摘要的内容后添加 `<!-- more -->` 标记。

## 开发自定义组件

### 创建新组件

1. 在`docs/.vitepress/theme/components/`目录下创建新的`.vue`文件
2. 使用`<script setup>`编写组件逻辑
3. 在`<template>`中编写HTML模板
4. 使用`<style scoped>`添加组件样式

### 注册组件

全局组件需要在`docs/.vitepress/theme/index.js`中注册：

```js
import MyComponent from './components/MyComponent.vue'

export default {
  enhanceApp({ app }) {
    app.component('MyComponent', MyComponent)
  }
}
```

### 使用组件

在Markdown文件中直接使用组件：

```markdown
# 页面标题

<MyComponent />

其他内容...
```

## 文章数据生成

博客数据通过构建时脚本自动生成为静态 JSON 文件，最近进行了性能优化：

1. **增量更新**：只在文件变化时重新生成数据
2. **错误处理**：添加错误捕获机制
3. **建立缓存**：比较文件修改时间
4. 生成步骤：
   - 扫描 `thoughts/` 目录下的所有Markdown文件
   - 解析frontmatter和内容
   - 提取摘要(优先使用`<!-- more -->`标记)
   - 按日期排序(从新到旧)
   - 生成 `public/posts.json` 文件

然后，PostList组件会在客户端通过fetch请求加载这个JSON文件。

## Vue开发最佳实践

1. **响应式数据管理**：
   - 使用`ref()`处理简单值
   - 使用`reactive()`处理对象
   - 避免直接修改响应式对象的属性

2. **组件设计**：
   - 保持组件职责单一
   - 通过props和emits进行父子组件通信
   - 使用provide/inject进行深层组件通信

3. **性能优化**：
   - 使用`computed`缓存计算结果
   - 使用`v-memo`减少不必要的重渲染
   - 大型列表使用虚拟滚动

4. **浏览器环境检测**：
   ```js
   const isBrowser = typeof window !== 'undefined'
   
   onMounted(() => {
     if (!isBrowser) return
     // 浏览器端代码...
   })
   ```

## 后续优化方向

1. 添加文章分类和标签筛选功能
2. 添加文章目录和搜索功能
3. 支持更多的frontmatter选项，如封面图像
4. 添加文章评论功能

## 性能优化

### 组件按需加载

本站使用Vue的`defineAsyncComponent`实现组件按需加载，提高首屏加载速度：

```js
// 在theme/index.js中
import { defineAsyncComponent } from 'vue';

// 使用异步组件实现按需加载
const AsyncPostList = defineAsyncComponent(() => import('./components/PostList.vue'));
const AsyncDataPanel = defineAsyncComponent(() => import('./components/DataPanel.vue'));

// 注册全局组件
app.component('PostList', AsyncPostList);
app.component('DataPanel', AsyncDataPanel);
```

按需加载的优势：
- 减少首屏加载时间和初始包体积
- 只在需要时才加载组件代码
- 提高用户体验，特别是在移动设备上
- 优化网站性能评分

### 文章数据生成

博客数据通过构建时脚本自动生成为静态 JSON 文件，最近进行了性能优化：

1. **增量更新**：只在文件变化时重新生成数据
2. **错误处理**：添加错误捕获机制
3. **建立缓存**：比较文件修改时间
4. 生成步骤：
   - 扫描 `thoughts/` 目录下的所有Markdown文件
   - 解析frontmatter和内容
   - 提取摘要(优先使用`<!-- more -->`标记)
   - 按日期排序(从新到旧)
   - 生成 `public/posts.json` 文件

然后，PostList组件会在客户端通过fetch请求加载这个JSON文件。