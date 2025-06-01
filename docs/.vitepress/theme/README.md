# LycanClaw 主题定制指南

本文档介绍了 LycanClaw 网站的主题定制内容和维护方法。

## 目录结构

```
docs/.vitepress/theme/
├── components/           # 自定义组件
│   ├── ArticleMetadata.vue  # 文章元数据组件
│   └── PostList.vue       # 博客列表组件
├── styles/              # 样式文件
│   ├── index.css        # 样式入口
│   └── var.css          # 主题变量
└── index.js             # 主题入口
```

## 自定义组件

### ArticleMetadata

在文章标题下方显示字数和阅读时间。

用法：在 Markdown 文件的 H1 标题下方会自动显示。

### PostList

显示博客文章列表，过滤和排序 `thoughts` 目录下的文章。

用法：在 Markdown 文件中使用 `<PostList />` 标签。

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

## 自定义样式

主题样式在 `styles/var.css` 文件中定义，您可以修改此文件来自定义网站的外观。

主要颜色变量：

- `--vp-c-brand-1`: 主要品牌颜色
- `--vp-c-brand-2`: 次要品牌颜色
- `--vp-c-brand-3`: 辅助品牌颜色

## 文章数据生成

博客数据通过构建时脚本自动生成为静态 JSON 文件：

1. 在构建过程中，VitePress 会扫描 `thoughts/` 目录下的所有 Markdown 文件
2. 解析每个文件的 frontmatter 和内容
3. 提取摘要（优先使用 `<!-- more -->` 标记前的内容，否则使用第一段落）
4. 按日期排序（从新到旧）
5. 生成 `public/posts.json` 文件

然后，PostList 组件会在客户端通过 fetch 请求加载这个 JSON 文件，确保完全浏览器兼容性。

## 后续优化方向

1. 添加文章分类和标签筛选功能
2. 添加文章目录和搜索功能
3. 支持更多的 frontmatter 选项，如封面图像 