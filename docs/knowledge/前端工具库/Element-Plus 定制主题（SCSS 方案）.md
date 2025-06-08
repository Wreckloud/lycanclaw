---
title: Element-Plus 定制主题（SCSS 方案）
date: '2025-06-07 17:19:28'
description: 这是一篇新文章!
publish: true
tags:
---

默认样式用得不顺眼？想调调主色、字体、边距？

Element Plus 本身是用 SCSS 写的，所以我们可以通过「覆盖 SCSS 变量」的方式来定制样式，而且方式比较“干净”，不需要手动改组件源码。

Element Plus 的样式编译过程大概是：

1. 它的 SCSS 文件会使用 `!default` 声明变量（这是 SCSS 的机制）
2. 只要你**先声明**了同名变量，它就会优先用你的
3. 然后再编译出最终的样式

所以我们只要“插队”写在前面，就能覆盖官方默认值。

## 1. 安装依赖

Element Plus 的样式基于 SCSS，所以你得先装 SCSS 编译器，不然样式根本跑不动。

```bash
pnpm add -D sass
```

这一步是让你的 Vite/webpack 项目能识别 `.scss` 文件。

## 2. 准备定制样式文件

我们需要创建一份自己的变量定义文件，位置可随意，只要你能导入就行。这里建议：

```
src/styles/element/index.scss
```

内容示例（可以只改你需要的那几个变量）：

```scss
/* 只需要重写你需要的即可 */
@forward 'element-plus/theme-chalk/src/common/var.scss' with (
  $colors: (
    'primary': (
      // 主色
      'base': #27ba9b,
    ),
    'success': (
      // 成功色
      'base': #1dc779,
    ),
    'warning': (
      // 警告色
      'base': #ffb302,
    ),
    'danger': (
      // 危险色
      'base': #e26237,
    ),
    'error': (
      // 错误色
      'base': #cf4444,
    ),
  )
)
```

想看所有变量有哪些？
打开 node_modules/element-plus/theme-chalk/src/common/var.scss

## 3. 告诉 Element 用你这份 SCSS

Element Plus 提供了「全量引入 + SCSS 变量覆盖」的方式。你需要把它们样式的入口换掉，让它走你的自定义变量。

**方法一（推荐）：使用官方提供的 SCSS 入口**

在你的主入口中这样写：

```javascript{9-10,19-21,20-23,30-37}
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
// 导入对应包
import ElementPlus from 'unplugin-element-plus/vite'
export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [
	    ElementPlusResolver({
		    importStyle: 'sass' // 这里要改成sass
		  })
	    ],
    }),
    // 按需定制主题配置
    ElementPlus({
      useSource: true,
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        // 自动导入定制化样式文件进行样式覆盖
        additionalData: `@use "@/styles/element/index.scss" as *;`
      }
    }
  }
})
```

**方法二：全量引入**

或者如果你是全量引入：

```ts
import '@/styles/element/index.scss'
import 'element-plus/theme-chalk/index.css'
```

但要注意：样式覆盖一定要写在前面，后引入 Element 样式才能吃掉你的变量！

# 让定制更方便维护

建议你按模块拆分变量，比如这样：

```
styles/
  └── element/
        ├── colors.scss
        ├── border.scss
        ├── typography.scss
        └── index.scss  // 全部汇总
```

`index.scss`：

```scss
@import './colors.scss';
@import './border.scss';
@import './typography.scss';
```

这种结构比一个文件塞一堆变量更清爽、也更方便以后维护。
