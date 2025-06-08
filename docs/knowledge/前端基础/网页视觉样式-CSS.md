---
title: 网页视觉样式-CSS
date: '2023-09-17 19:02:12'
description: CSS 让网页变得美观，它定义了网页的样式和布局。
publish: true
tags:
  - 前端基础
  - CSS3
---

# CSS 核心概念

层叠样式表(Casading Style Sheets) 控制网页外观，用于美化 HTML 内容。核心功能：**定义元素的颜色、大小、布局等视觉样式**。

CSS 的基本结构由选择器、属性和属性值组成：

```css
选择器 {
  属性: 值;  /* 声明块 */
}
```

- **选择器**：定位要修饰的 HTML 元素（如标签名/类名/#ID）
- **属性**：要修改的样式类型（如 `color`/`font-size`）
- **值**：样式的具体设定（如 `red`/`16px`）

特性：每个样式由**键值对**构成（属性:值），多个样式用分号隔开

### 三种引入方式

#### 1. 内部样式表

在 HTML 文件 `<head>` 内通过 `<style>` 标签编写

```html
<head>
  <style>
    p { color: blue; }  /* 只作用于当前页面 */
  </style>
</head>
```

适用场景：单个页面简单调试

#### 2. 外部样式表（最常用）

CSS 独立存为 `.css` 文件，通过 `<link>` 引入

```html
<head>
  <!-- rel和href必填 -->
  <link rel="stylesheet" href="样式文件路径.css">
</head>
```

优势：多页面共享样式，便于维护

#### 3. 行内样式

直接在 HTML 标签的 `style` 属性写样式

```html
<p style="color:red; margin:10px">文字</p>
```

使用场景：配合 JS 动态修改样式
缺陷：样式与结构混杂，难以批量修改

# CSS 选择器

通过选择器定位网页元素，为指定元素添加样式规则。

## 基础选择器（必会四件套）

### 通配符选择器 - 全员匹配

- **符号**：`*`
- **作用**：选中页面所有元素（慎用，性能消耗大）
- **典型场景**：基础样式重置

```css
* {
  margin: 0;     /* 清除默认外边距 */
  padding: 0;    /* 清除默认内边距 */
}
```

### 标签选择器 - 批量操作

- **写法**：直接使用标签名（如`p`/`div`）
- **特点**：影响所有同类标签
- **适用场景**：统一基础样式

```css
p {
  text-indent: 2em;  /* 段落首行缩进 */
  line-height: 1.6;  /* 文字行间距 */
}
```

### 类选择器 - 精准控制（最常用）

- **符号**：`.`开头（如`.header`）
- **使用流程**：
  1. 定义样式
  2. 添加类名
- **优势**：可重复使用、支持多类名

```HTML
<style>
/* 定义类选择器 */
.color {
    color:red;
}

.size {
    font-size: 50px;
}
</style>

<!-- 使用类选择器 -->
<!-- 一个类能给多个标签使用 -->
<div class="color">这是div标签1</div>
<!-- 用空格隔开多个类名 -->
<div class="color size">这是div标签2</div>
```

### ID 选择器 - 唯一标识

- **符号**：`#`开头（如`#main-nav`）
- **重要规则**：
  - 全页面唯一，不能重复
  - 主要配合 JavaScript 操作

```HTML
<style>
    /* 定义id选择器 */
    #red{
        color:red;
    }
</style>

<!-- 使用id选择器 -->
<div id="red">这是 div 标签</div>
```

## 复合选择器

### 后代选择器

- **符号**：空格（如`ul li`）
- **作用**：选中嵌套结构中所有符合的子元素

### 子代选择器

- **符号**：`>`（如`ul > li`）
- **特点**：只选择直接（最近的）的子元素

```html
<!-- 后代 vs 子代选择器对比示例 -->
<style>
  /* 后代选择器：选中.nav下所有层级的a标签 */
  .nav a {
    color: red;  /* 所有导航链接变红 */
  }

  /* 子代选择器：只选中.nav的直接子级a标签 */
  .nav > a {
    font-size: 20px;  /* 仅一级导航放大 */
  }
</style>

<!-- 导航结构 -->
<div class="nav">
  <a href="#">一级导航</a>          <!-- 同时应用两个样式 -->
  <div class="sub-nav">
    <a href="#">二级导航</a>       <!-- 仅文字变红 -->
  </div>
  <a href="#">另一个一级导航</a>    <!-- 同时应用两个样式 -->
</div>
```

### 并集选择器

- **符号**：逗号（如`h1, h2, .title`）
- **作用**：同时给多个元素相同样式

```css
/* 统一标题样式 */
h1, h2, .section-title {
  font-family: '微软雅黑';
}
```

### 伪类选择器

- **符号**：`:`开头
- **典型应用**：
  - `:hover` 鼠标悬停
  - `:active` 点击瞬间
  - `:nth-child(n)` 选择第 n 个元素

```html
<style>
  /* 鼠标悬停时变色 */
  .box:hover {
    background: lightblue;  /* 悬停背景变浅蓝 */
  }

  /* 点击按钮时改变文字颜色 */
  .btn:active {
    color: white;  /* 按住按钮时文字变白 */
  }

  /* 选中第二个列表项 */
  li:nth-child(2) {
    font-weight: bold;  /* 第二个列表项加粗 */
  }
</style>

<div class="box" style="padding:20px;border:1px solid">
  鼠标移上来试试
</div>

<!-- 点击效果示例 -->
<button class="btn" style="background:green;padding:10px">
  点击按住查看效果
</button>

<!-- 定位子元素示例 -->
<ul>
  <li>普通列表项</li>
  <li>我是加粗的第二项</li>  <!-- 自动加粗 -->
  <li>普通列表项</li>
</ul>
```

# CSS 三大核心特性

CSS 能化简代码/定位问题,并解决问题

### 继承性

子元素自动继承父元素的**文字相关属性**

```html
<style>
  body {
    font-family: '微软雅黑';  /* 所有子元素默认继承该字体 */
    color: #333;            /* 默认文字颜色 */
  }
</style>
<p>这段文字自动使用body的字体和颜色</p>
```

**注意**：盒模型属性（width/margin 等）不可继承，需手动设置

### 层叠性

**核心原则**：

1. **相同属性** → 后写的覆盖先写的
2. **不同属性** → 自动合并效果

```html
<style>
  .box {
    color: red;    /* 将被下面的同属性覆盖 */
    margin: 10px;  /* 保留生效 */
  }
  .special {
    color: blue;   /* 最终文字颜色 */
    padding: 20px; /* 新增属性 */
  }
</style>
<div class="box special">同时应用两个类的样式</div>
```

### 优先级

当多个样式冲突时，按以下规则生效：

1. **ID 选择器** > **类选择器** > **标签选择器**
2. `!important` 强制最高优先级（慎用）
3. **更具体的选择器** > 简单选择器

```html
<html>
<head>
    <style>
        /* 基础选择器优先级对比 */
        div { color: black; }            /* 标签选择器 - 权重1 → 未生效 */
        .text { color: blue; }           /* 类选择器 - 权重10 → 未生效 */
        #target { color: green; }        /* ID选择器 - 权重100 → 生效 */

        /* 复合选择器权重累加 */
        .box .content { color: purple; } /* 10+10=20 → 未生效 */
        #main .text { color: orange; }   /* 100+10=110 → 生效 */

        /* !important暴力模式 */
        .important-text {
            color: pink !important; /* 无视所有规则 */
        }
    </style>
</head>
<body>
    <!-- 测试案例1：ID vs 类 vs 标签 -->
    <div id="target" class="text">这个文字显示绿色</div>
    <!-- ID选择器胜出 -->

    <!-- 测试案例2：复合选择器权重计算 -->
    <div id="main">
        <div class="box">
            <p class="content text">这个文字显示橙色）</p>
        </div>
    </div>
    <!-- #main .text 权重110  .box .content 权重20 -->

    <!-- 测试案例3：!important 终极对决 -->
    <div id="special"
         class="important-text"
         style="color: red"> <!-- 行内样式权重1000 → 被!important覆盖 -->
        这个文字显示粉色
    </div>
    <!-- !important最高优先级 -->
</body>
</html>
```

### 标签的显示模式

布局页面的时候, 根据需求选择合适的标签显示模式摆放内容.

| 类型         | 特点                     | 常见标签               | 支持设置的样式   |
| ------------ | ------------------------ | ---------------------- | ---------------- |
| **块元素**   | 独占一行，宽度撑满父容器 | `div`/`h1`/`p`/`ul`    | 宽高、边距全生效 |
| **行内元素** | 同行显示，宽高由内容决定 | `span`/`a`/`em`        | 宽高不生效       |
| **行内块**   | 同行显示且可设宽高       | `img`/`input`/`button` | 宽高、边距全生效 |

使用属性 `display` 可以转换模式。

```html
<style>
  /* 行内转块级 */
  a.nav-link {
    display: block;     /* 让链接独占一行 */
    width: 200px;      /* 此时可设置宽度 */
  }

  /* 块级转行内块 */
  div.gallery {
    display: inline-block;  /* 并排显示 */
    margin: 10px;           /* 边距生效 */
  }
</style>
```
