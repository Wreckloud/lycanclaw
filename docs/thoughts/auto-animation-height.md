---
title: 自动高度过渡动画
description: 我们在做 height 从 0 到自动高度动画的时候经常会碰到障碍，该问题很久有人在 github 上提过这 issues，但一直没有得到有效解答。
date: '2024-07-26 11:45:14'
author: '友人A'
cover: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1000'
publish: fasle
---

# 自动高度过渡动画

我们在做 height 从 0 到自动高度动画的时候经常会碰到障碍，该问题很久有人在 github 上提过这 issues，但一直没有得到有效解答。[https://github.com/w3c/csswg-drafts/issues/626](https://github.com/w3c/csswg-drafts/issues/626) 为此广大的程序员目前有以下几种解决方案：

## 1. 使用 max-height 代替 height

这是最常见的解决方法，设置一个足够大的 max-height 值，然后在其上做动画：

```css
.element {
  overflow: hidden;
  max-height: 0;
  transition: max-height 0.3s ease;
}

.element.active {
  max-height: 500px; /* 设置一个足够大的值 */
}
```

**问题**：这种方法的缺陷是需要预先知道内容的大致高度，且实际过渡时间会因为 max-height 值过大而导致动画不够平滑。

## 2. 使用 transform: scaleY() 方法

通过变换来实现高度动画：

```css
.element {
  transform-origin: top;
  transform: scaleY(0);
  transition: transform 0.3s ease;
}

.element.active {
  transform: scaleY(1);
}
```

**问题**：这种方法可能会导致子元素内容也被缩放，不是真正的高度过渡。

## 3. 使用 JavaScript 计算高度

这是最精确的方法，使用 JavaScript 计算实际高度并设置：

```javascript
function toggleElement(element) {
  const isCollapsed = element.classList.contains('collapsed');
  
  if (isCollapsed) {
    // 展开
    const height = element.scrollHeight;
    element.style.height = '0';
    // 强制重绘
    element.offsetHeight;
    element.style.height = height + 'px';
    element.classList.remove('collapsed');
  } else {
    // 收起
    element.style.height = element.scrollHeight + 'px';
    // 强制重绘
    element.offsetHeight;
    element.style.height = '0';
    element.classList.add('collapsed');
  }
}
```

**问题**：需要JavaScript配合，不是纯CSS解决方案。

## 4. 使用 grid-template-rows 动画

这是一种较新的方法：

```css
.container {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.3s;
}

.container.open {
  grid-template-rows: 1fr;
}

.content {
  overflow: hidden;
}
```

**优点**：这种方法可以实现真正的从0到auto的过渡，且是纯CSS实现。

## 结论

目前来看，最理想的解决方案是：
1. 对于简单场景，使用 max-height 方法，尽量精确估计最大高度
2. 对于精确动画，使用 JavaScript 计算实际高度
3. 对于现代浏览器，可以考虑使用 grid-template-rows 方法

随着 CSS 标准的不断发展，将来可能会有更好的原生解决方案。 