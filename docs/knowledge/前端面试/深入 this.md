---
title: 深入 this
date: 2025-06-16 11:01:55
description: 这是一篇新文章!
publish: true
tags:
  - Javascript
---

`this` 是 JavaScript 中一个运行时绑定的关键字，它的指向是在**函数调用时**根据调用方式动态确定的。这种机制使得它在不同上下文中表现各异。

# 如何确认 this 的值

要判断 `this` 的值，首先得看当前是否处于严格模式。
JavaScript 默认为非严格模式，开启严格模式可以使用 `'use strict'`：

- 为整个脚本开启严格模式，将 `'use strict'` 写在 JS 文件**最前面**，前面不能有任何其他语句或注释

```js{1}
'use strict';

// 整个文件都处于严格模式
function test() {
  console.log(this); // undefined
}
```

- 或者只为函数体开启严格模式，写在函数内第一行

```js{2}
function test() {
  'use strict';
  console.log(this); // undefined
}
```

在实际使用中，函数的调用方式决定了 `this` 的指向。

**非严格模式下**，`this` 总是指向一个对象（通常是全局对象）。
**严格模式下**，`this` 可以是任意值，比如在某些调用方式下为 `undefined`。

### 全局执行环境

无论是否使用严格模式，在全局作用域中使用 `this`，它都指向全局对象（在浏览器中即 `window`）：

```js
console.log(this); // 浏览器中为 window
```

### 普通函数调用

这是最容易出错的一类调用方式。直接调用函数时，`this` 的值受严格模式影响：

- 非严格模式下：`this` 为全局对象（浏览器中是 `window`）
- 严格模式下：`this` 是 `undefined`

例如：

```js
'use strict';
function test() {
  console.log(this);
}
test(); // undefined
```

### 对象方法调用

当函数作为对象的一个属性被调用时，`this` 指向该对象本身，也就是“谁调用，this 就指向谁”。

```js
const obj = {
  name: 'wolf',
  speak() {
    console.log(this.name);
  }
};

obj.speak(); // 输出 "wolf"
```

这种方式是最直观的，容易理解，但要警惕将方法单独提取出来使用时 `this` 可能发生变化。

```js
const fn = obj.speak;
fn(); // 报错或 undefined
```

虽然 `fn` 是 `obj.speak` 的引用，但一旦它**脱离了 obj 独立调用**，就成了普通函数调用。
因此 `this` 就不再指向 `obj`，而是根据严格模式决定（要么是 `window`，要么是 `undefined`）。

# 如何指定 this 的值

虽然 `this` 默认的绑定方式取决于调用方式，但我们可以通过一些显式手段来手动指定 `this` 的值。
这些手段分为以下两类:

## 调用时指定

这两种方式属于**立即执行 + 显式绑定 this**，本质上是用指定的对象调用函数。

### `call`

```js
func.call(thisArg, arg1, arg2, ...)
```

使用 `call` 可以用某个对象显式地调用函数，同时传入若干参数：

```js
function say(greeting) {
  console.log(`${greeting}, I am ${this.name}`);
}

const wolf = { name: '狼' };

say.call(wolf, '你好'); // 你好, I am 狼
```

### `apply`

```js
func.apply(thisArg, [argsArray])
```

`apply` 和 `call` 类似，但第二个参数是**数组形式**：

```js
say.apply(wolf, ['早上好']); // 早上好, I am 狼
```

这两个方法在**函数重用、借用其他对象方法**场景中非常常见。区别仅在于传参形式。

## 创建时指定

### `bind`

与 `call` / `apply` 不同，`bind` 并不会立即执行函数，而是**返回一个绑定了 this 的新函数**。适合延迟调用或用在回调中：

```js
const boundSay = say.bind(wolf, '嘿');
boundSay(); // 嘿, I am 狼
```

这种方式在事件监听、定时器、柯里化中很常见。例如：

```js
function speak() {
  console.log(this.name);
}
const fox = { name: '狐狸' };
const bound = speak.bind(fox);
setTimeout(bound, 1000); // 1秒后输出 狐狸
```

### 箭头函数中的 `this`

箭头函数是 `this` 绑定的一种特殊情况：它不会创建自己的 `this`，而是捕获其外层作用域的 `this`。
这特性在需要保持上下文时非常有用。

`setTimeout`、事件处理器等**延迟执行的函数**很常见。用普通函数写，很容易丢失原本的 `this` 指向，因为它的 `this` 会根据“谁调用它”而变化。

先看个反例（普通函数）：

```js
const wolf = {
  name: '维克罗德',
  say() {
    setTimeout(function () {
      console.log(this.name); // ❌ undefined
    }, 1000);
  }
};

wolf.say();
```

实际上输出 `undefined`，因为那个匿名函数是被 `setTimeout` 调用的，它的 `this` 默认指向全局对象（严格模式下是 `undefined`），根本不是 `wolf`。

```js
const wolf = {
  name: '维克罗德',
  eat() {
    setTimeout(() => {
      console.log(this.name); // "维克罗德"
    }, 1000);
  }
};

wolf.eat();
```

这次输出正确，因为箭头函数没有自己的 `this`，它**继承了 `say()` 方法中的上下文**，也就是 `wolf`。

### 番外-柯里化

“**柯里化（Currying）**”，听起来像是什么咒术，其实它只是函数式编程里一个**常用的技巧**：  
**把一个多参数函数，转换成一系列只接受一个参数的函数**。

例如：

**普通函数**

```js
function add(a, b) {
  return a + b;
}
add(1, 2); // 3
```

**柯里化后**

```js
function curryAdd(a) {
  return function(b) {
    return a + b;
  };
}
curryAdd(1)(2); // 3
```

看清楚了吧？原来 `add(1, 2)` 现在变成了 `curryAdd(1)(2)`，先喂一个参数，返回一个新函数，再喂一个参数，才得到结果。

因为这种写法可以**提前固定一部分参数**，在某些场景下特别实用，比如：

**提前绑定参数**

```js
function greet(greeting, name) {
  return `${greeting}, ${name}`;
}

// 柯里化后
function curryGreet(greeting) {
  return function(name) {
    return `${greeting}, ${name}`;
  };
}

const sayHi = curryGreet('Hi');
sayHi('狼'); // Hi, 狼
sayHi('狐'); // Hi, 狐
```

我们提前固定了 `greeting` 为 `'Hi'`，之后只需要输入名字就能复用这个打招呼的函数。这种写法非常适合**生成模板函数、处理配置参数、做函数组合式开发**。

> **柯里化 ≠ bind**

虽然 `bind` 也能提前绑定参数，但 `bind` 还能绑定 `this`，而柯里化更偏向函数的参数控制，属于函数式领域的思路。

```js
function add(a, b) {
  return a + b;
}

const addOne = add.bind(null, 1);
console.log(addOne(2)); // 3

// 等价的柯里化
function curryAdd(a) {
  return function(b) {
    return a + b;
  };
}
const addOne2 = curryAdd(1);
console.log(addOne2(2)); // 3
```

# 手写 call

实现一个 `myCall` 方法，使其行为和原生 `Function.prototype.call` 一致：  
可以指定函数执行时的 `this`，并传递参数。

**目标**

```js
function func(a, b) {
  console.log(this.name)
  return a + b
}

const person = { name: 'wolf' }
const res = func.myCall(person, 2, 8)
console.log('返回值为：', res) // wolf, 返回值为：10
```

1. 将方法挂在函数原型上

所有函数都是 `Function` 的实例，因此可在其原型对象上添加方法：

```js
Function.prototype.myCall = function () {
  // ...
}
```

这一步的核心是：**函数都可以访问这个方法**，因为 `func instanceof Function === true`。

2. 把当前函数（this）临时挂到传入对象上

我们需要让传入的对象调用这个函数，才能改变 `this` 指向：

```js
Function.prototype.myCall = function (thisArg) {
  thisArg.fn = this // 将当前函数作为属性赋给传入对象
}
```

例子中 `this` 指的是函数外的调用者 `func`，而 `thisArg` 是调用时传递的参数 `person`，所以我们临时执行的是 `person.fn()`。

3. 支持传参

调用 `call` 时，我们可能会传入多个参数，需要传进去给函数：

```js
Function.prototype.myCall = function (thisArg, ...args) {
  thisArg.fn = this
  const result = thisArg.fn(...args)
  delete thisArg.fn
  return result
}
```

- 用剩余参数 `...args` 接收函数参数
- 展开调用 `fn(...args)`
- 调用后删除临时属性，防止污染原对象

4. 使用 `Symbol` 调优

原生 `call` 支持 `null` 和 `undefined` 被自动绑定为 `window`（非严格模式下）：

```js
Function.prototype.myCall = function (thisArg, ...args) {
  const fnKey = Symbol() // 创建唯一键名，防止属性覆盖
  // 不写做 this.key ，会把 key 当作字符串字面量。
  thisArg[fnKey] = this  // 而我们需要用 obj[key] 才能把变量 key 的值当作属性名
  const result = thisArg[fnKey](...args)
  delete thisArg[fnKey]
  return result
}
```

- 使用 `Symbol` 创建唯一键名，避免与原对象属性冲突，提升调用安全性和健壮性。

**完整实现示例**

```js
Function.prototype.myCall = function (thisArg, ...args) {
  thisArg = (thisArg === null || thisArg === undefined)
    ? window
    : Object(thisArg) // 安全健壮地支持所有类型的 `thisArg` 传入

  const fnKey = Symbol()
  thisArg[fnKey] = this
  const result = thisArg[fnKey](...args)
  delete thisArg[fnKey]
  return result
}
```

# 手写 apply

`apply` 和 `call` 最大区别是：`apply` 第二个参数是参数数组（或类数组），而 `call` 是逐个传参。

我们可以借鉴 `myCall` 代码，区别只在于参数传递方式。

```js{7-8}
Function.prototype.myApply = function(thisArg, argsArray) {
  thisArg = (thisArg === null || thisArg === undefined) ? window : Object(thisArg)

  const fnKey = Symbol()
  thisArg[fnKey] = this

  // argsArray 可能为 null 或 undefined，调用时要做判断
  const result = argsArray ? thisArg[fnKey](...argsArray) : thisArg[fnKey]()

  delete thisArg[fnKey]
  return result
}
```

# 手写 bind

`bind` 不像 `call`/`apply`，它不是立刻调用，而是给你一个“绑定了 this 和参数”的新函数，等你以后调用它时才真正执行。

1. **预设参数（柯里化）**  
   绑定时可以传参数，调用新函数时也可以传参数，两个参数会拼接起来。比如：

   ```js
   function f(a, b) { console.log(this.name, a, b) }
   const bound = f.bind(obj, 1)  // 绑定this和第一个参数
   bound(2)  // 输出 obj.name 1 2
   ```

先不考虑 `new` 的写法

```js
Function.prototype.myBind = function(thisArg, ...bindArgs) {
  const self = this; // 保存调用 bind 的函数

  return function(...callArgs) {
    // 调用原函数，this 指向 thisArg，参数是绑定参数 + 调用参数
    return self.apply(thisArg, [...bindArgs, ...callArgs]);
  }
}

```

2. **处理 new 调用**  
   如果用 `new` 调用绑定函数，绑定的 `this` 会失效，`this` 指向新实例，而不是绑定对象。这点比较玄学，但必须实现。

```js{6-8}
Function.prototype.myBind = function(thisArg, ...bindArgs) {
  const self = this;

  function boundFn(...callArgs) {
    // 判断是否用 new 调用
    const isNew = this instanceof boundFn;
    // 如果 new 调用，this 指向实例，否则指向绑定的 thisArg
    const context = isNew ? this : thisArg;
    return self.apply(context, [...bindArgs, ...callArgs]);
  }

  return boundFn;
}

```

3. **修复原型链**  
   返回的新函数会继承原函数的 `prototype`，防止 `new` 出错。

```js{10-11}
Function.prototype.myBind = function(thisArg, ...bindArgs) {
  const self = this;

  function boundFn(...callArgs) {
    const isNew = this instanceof boundFn;
    const context = isNew ? this : thisArg;
    return self.apply(context, [...bindArgs, ...callArgs]);
  }

  // 继承原函数的 prototype
  boundFn.prototype = Object.create(self.prototype);

  return boundFn;
}
```

**完整实现示例**

```js
Function.prototype.myBind = function(thisArg, ...bindArgs) {
  const self = this
  function boundFn(...callArgs) {
    const isNew = this instanceof boundFn
    const context = isNew ? this : thisArg
    return self.apply(context, [...bindArgs, ...callArgs])
  }
  boundFn.prototype = Object.create(this.prototype)
  return boundFn
}
```
