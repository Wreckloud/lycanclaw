---
title: 网页结构骨架-HTML
date: 2023-09-17 19:02:12
description: HTML是网页的基础结构语言，定义了网页的骨架和内容。
publish: true
tags:
  - 前端基础
  - HTML
---

# HTML 定义

HTML 超文本标记语言 ———— HyperText Markup Language

> 超文本: 除了文字信息, 还可以定义图片、音频、视频等内容。比普通文本更强大。
> 标记语言: 由标签 `<标签名>` 构成的语言。

HTML 语法相对比较松散，即使多少点字符也有可能达到预期的效果。

不过为了严谨性，HTML 还是有一些默认的规则：

- HTML 标签不区分大小写，建议小写
- HTML 标签的属性值，采用单引号、双引号都可以，一般写双引号

### HTML 基本骨架

```HTML
<!DOCTYPE html> <!-- 文档类型(document type)的声明 -->
<html lang="en"> <!-- 整个HTML文档 -->

	<head><!-- 文档头部, 存放给浏览器看的信息 -->
		<meta charset="UTF-8">
		<!-- meta标签用来描述一个HTML文档的属性,关键词等 -->
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<!-- 例如 `charset="UTF-8"` 是指当前使用 "UTF-8" 编码格式.  -->
		<title>网页标题</title> <!-- 是head标签中唯一必须要包含的东西 -->
		<!-- 好的title有利于SEO优化, 好的SEO有助于在搜索引擎中优化排名 -->
	</head>

	<body> <!-- 主体,存放给用户看的信息,例如图片、文字 -->
		网页主体内容
	</body>

</html>
```

> 在 `VS Code` 中，可以按 `！+ Tab` 生成 HTML 的基本骨架.

# HTML 标签

### 标题标签

HTML 标签是预定义好的, 其都有自己的含义与效果.

h1~h6(双标签)

```html
<h1>一级标题</h1>
<h2>二级标题</h2>
<h3>三级标题</h3>
<h4>四级标题</h4>
<h5>五级标题</h5>
<h6>六级标题</h6>
```

注意不要仅仅是为了生成粗体或大号的文本而使用标题, 正确使用标题有益于 SEO.

### 文本格式化标签

| 格式          | 常规       | 缩写  |
| ------------- | ---------- | ----- |
| **加粗**      | `<strong>` | `<b>` |
| _倾斜_        | `<em>`     | `<i>` |
| <u>下划线</u> | `<ins>`    | `<u>` |
| ~~删除线~~    | `<del> `   | `<s>` |

### 字符实体

能在网页中显示预留字符

| 显示结果 | 描述   | 实体名称 |
| -------- | ------ | -------- |
|          | 空格   | `&nbsp;` |
| <        | 小于号 | `&lt;`   |
| &gt;     | 大于号 | `&gt;`   |

### 页面布局

#### 段落标签

p 标签用于定义段落：

```html
<p>这是一个段落。</p>
<p>这是另一个段落。</p>
```

#### 换行标签

br 标签用于在不产生新段落的情况下进行换行：

```html
这是第一行<br/>这是第二行
```

#### 水平线标签

hr 标签用于插入一条水平线，常用于分隔内容：

```html
<p>上面的内容</p>
<hr/>
<p>下面的内容</p>
```

```HTML
<hr color="颜色" width="宽度" size="高度" align="对齐方式 默认居中, 可取值left|right">
```

### 超链接标签

超链接是双标签,格式如下

```HTML
<a href = "超链接">显示的文本</a>

<audio src="音频路径" controls loop autoplay></audio>

<video src="视频路径" controls ></video>
```

图片`<img>`是单标签, 格式如下

```HTML
<img src="图片路径" alt="图像的替代文本" title="鼠标悬停时显示的文本" width="宽度" height="高度">
```

图片的alt属性提供了替代文本，对无障碍访问和SEO都很重要。

图片路径可以是本地也可以来自网络的url。

#### 路径表示

在引入图片、视频、音频、css 等内容时, 我们需要指定文件的路径, 而在前端开发中，路径的书写形式分为两类：

- 绝对路径
  - 绝对磁盘路径
  - 绝对网络路径

    URL（Uniform Resource Locator）是统一资源定位符的缩写，它是用于定位互联网上资源的标准化地址，能告诉浏览器在哪里可以找到特定的网页或其他在线资源。

- 相对路径
  - `./` : 当前目录(可省略)
  - `../` : 上一级目录

### 列表

1. 无序列表:

```HTML
<ul>
    <li>第一项</li>
    <li>第二项</li>
    <li>...</li>
</ul>
```

`<ul type=" ">` 可选项:

| 选项            | 描述         |
| --------------- | ------------ |
| `type="disc"`   | 实心圆(默认) |
| `type="circle"` | 空心圆       |
| `type="square"` | 小方块       |
| `type="none"`   | 不显示       |

```html
<ul style="list-style-type: disc;">
  <li>实心圆（默认）</li>
</ul>

<ul style="list-style-type: circle;">
  <li>空心圆</li>
</ul>

<ul style="list-style-type: square;">
  <li>小方块</li>
</ul>

<ul style="list-style-type: none;">
  <li>不显示</li>
</ul>
```

2. 有序列表:

```HTML
<ol>
    <li>第一步</li>
    <li>第二步</li>
    <li>...</li>
</ol>
```

`<ol type=" ">` 可选项:

| 选项         | 描述           |
| ------------ | -------------- |
| `type="1"`   | 数字标号       |
| `type="a/A"` | 大小写字母标号 |
| `type="i/I"` | 大小写罗马数字 |

> 快速生成 ul+li 布局: `ul>li*n` (根据需要的 li 数修改 n 的值)

1. 定义列表:

```HTML
<dl>
    <dt>列表标题</dt>
    <dd>列表描述1</dd>
    <dd>列表描述2</dd>
    ...
</dl>
```

### 表格

table 标签用于创建表格：

```html
<table>
  <tr>
    <th>表头1</th>
    <th>表头2</th>
  </tr>
  <tr>
    <td>行1，列1</td>
    <td>行1，列2</td>
  </tr>
  <tr>
    <td>行2，列1</td>
    <td>行2，列2</td>
  </tr>
</table>
```

th 用于表头单元格，td 用于普通单元格。

使用`border`属性可以为表格添加边框线  
跨行合并 属性值`rowspan`  
跨列合并 属性值`colspan`

> 快速生成表格结构: `table>tr*行数>td{单元格内容}`

## 表单

表单在 Web 网页中用来给用户填写信息, 填写的信息最终会保存在数据库中.

```HTML
<form action="服务器地址" method="get|post" name="表单名称"></form>
```

- 表单标签: `<form>`
- 表单属性:
  - `action` : 规定表单向何处发送表单数据, 表单提交的 URL.
  - `method` : 规定用于发送表单数据的方式, 有以下两种.
    - `GET` : 数据是拼接在 url 后面的, 如: xx?username=Tom&age=12，url 中能携带的表单数据大小是有限制的。
    - `POST` : 表单数据是在请求体（消息体）中携带的.

一个完整的表单包含三个基本元素:

- 表单标签
- 表单域
- 表单按钮

常见的表单示例:

```HTML
<body>
    <!--
    form表单属性:
        action: 表单提交的url, 往何处提交数据 . 如果不指定, 默认提交到当前页面
        method: 表单的提交方式 .
            get: 在url后面拼接表单数据, 比如: ?username=Tom&age=12 , url长度有限制 . 默认值
            post: 在消息体(请求体)中传递的, 参数大小无限制的.
    -->

    <form action="" method="get">
        用户名: <input type="text" name="username">
        年龄: <input type="text" name="age">

        <input type="submit" value="提交">
    </form>

</body>
```

### 表单元素

#### 1. input 标签

```HTML
<input type = "...">
```

| type 属性值          | 说明                |
| -------------------- | ------------------- |
| `type = "text"`      | 文本框,用于单行文本 |
| `type = "password "` | 密码框              |
| `type = "radio "`    | 单选框              |
| `type = "checkbox"`  | 多选框              |
| `type = "file"`      | 上传文件            |

- text 和 password  
  使用属性值 palceholder 能添加占位文本提示信息
- radio  
  默认单选框没有单选功能  
  使用 `name` 属性值设置相同名称能达到**单选**效果  
  使用 `checked` 属性值默认选中 (多选也可)
- file  
  添加 `multiple` 属性实现文件多选功能

#### 2. 下拉菜单

```HTML
<select>
    <option>第一项</option>
    <option>第二项</option>
    ...
</select>
```

option 中使用 selected 属性值 默认选中一个 option

#### 3. 文本域标签

```HTML
<textarea>提示文本</textarea>
```

多行输入时使用文本域.

#### 4. label 标签

**写法一:**  
label 标签包裹内容  
再设置 for 属性值,和表单控件的 id 属性值相同.

```HTML
<input type = "radio" id ="man">
<label for = "man">男</label>
```

**写法二:**
不使用属性直接包裹文字和表单控件.

```HTMl
<label><input type = "radio">女</label>
```

使用 label 标签增大表单控制范围

#### 5. 按钮

```HTML
<button type="">按钮名称</button>
```

| type 属性值 | 说明                     |
| ----------- | ------------------------ |
| submi       | 提交                     |
| reset       | 重置                     |
| button      | 默认无功能(配合 js 使用) |

## 无语义布局标签

用来布局网页,划分区域,摆放内容

- div

```HTMl
<div>div标签,独占一行</div>
```

- span

```HTMl
<span>span标签,不换行</span>
```

- HTML5 新增标签

HTML5 是 HTML 最新的修订版本, HTML5 新增了很多新的语义化标签.

| 标签                  | 说明                                                                                   |
| --------------------- | -------------------------------------------------------------------------------------- |
| `<header></header>`   | 头部                                                                                   |
| `<nav></nav>`         | 导航                                                                                   |
| `<section></section>` | 定义文档中的节, 比如章节, 页眉, 页脚                                                   |
| `<aside></aside>`     | 侧边栏                                                                                 |
| `<footer></footer>`   | 脚部                                                                                   |
| `<article></article>` | 代表一个独立的, 完整的相关内容块, 例如一篇完整的论坛帖子, 一篇博客文章, 一个用户评论等 |

#### 内联元素

常见内联元素(行内元素)

> a、b、em、i、span、strong 等

- 行内元素不会独占页面中的一整行
- 设置`width`,`height`属性无效
- 一般内联元素不包含块级元素

#### 块级元素

常见块级元素

> div、form、h1~h6、hr、p、table、ul、等

- 块元素会在页面中独占一行
- 可以设置`width`, `height`属性
- ⼀般块级元素可以包含行内元素和其他块级元
  素

#### 行内块级元素

不换行、能够识别宽高

> button、img、input 等


