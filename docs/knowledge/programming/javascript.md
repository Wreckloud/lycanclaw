---
title: JavaScript基础
description: JavaScript语言基础知识笔记
---

# JavaScript基础知识

这是关于JavaScript基础知识的笔记。

## 变量和数据类型

JavaScript有以下基本数据类型：

- String（字符串）
- Number（数字）
- Boolean（布尔值）
- null（空值）
- undefined（未定义）
- Symbol（符号，ES6新增）
- BigInt（大整数，ES2020新增）

## 函数

JavaScript中的函数定义示例：

```javascript
// 函数声明
function sayHello(name) {
  return `你好，${name}！`;
}

// 箭头函数
const greet = (name) => {
  return `欢迎，${name}！`;
};
```

## 对象

JavaScript中的对象示例：

```javascript
const person = {
  name: '张三',
  age: 25,
  greet() {
    return `我是${this.name}，今年${this.age}岁。`;
  }
};
``` 