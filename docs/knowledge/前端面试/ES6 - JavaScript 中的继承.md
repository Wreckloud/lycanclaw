---
title: ES6 Class-JavaScript 中的继承
date: 2025-06-18 11:10:59
description: 这是一篇新文章!
publish: true
tags:
  - Javascript
---

继承是面向对象中的核心概念，它允许**子类复用父类的属性和方法**，从而避免重复代码，提升代码的结构性与扩展性。

在 ES6 以前，JavaScript 是基于原型链来实现继承的。ES6 引入了 `class` 关键字，使继承的语法更加清晰易懂。

# `class` 的核心语法

类（`class`）是用于创建对象的模板，本质上是语法糖，底层依然基于原型（`prototype`）实现。

```js
class Person {
  // 公有属性
  age = 18; // 支持默认值
  name;

  // 构造函数
  constructor(name) {
    this.name = name;
  }

  // 公有方法
  sayHi() {
    console.log(`你好，我叫：${this.name}`);
  }
}
```

类的构造函数（`constructor`）用于创建实例时初始化属性，方法则直接定义在类体内。

> 在方法中动态添加属性（如 `this.foods = []`）虽然可行，但不推荐。因为这些属性无法从类定义中一眼看出，不利于维护和阅读。

实例化对象如下：

```js
const p = new Person('狼');
p.sayHi(); // 输出：你好，我叫：狼
```

# `class` 实现继承

在 ES6 中，类与类之间的继承通过 `extends` 和 `super` 实现。

- `extends`：用于声明一个类继承自另一个类
- `super`：在子类中调用父类的构造函数或方法

来看一个简单的继承示例：

```js
class Person {
  constructor(name) {
    this.name = name;
  }

  sayHi() {
    console.log(`你好，我是 ${this.name}`);
  }
}

class Student extends Person {
  constructor(name, age) {
    super(name); // 调用父类构造函数，必须写在最前面
    this.age = age;
  }
}

const s = new Student('小狼', 20);
s.sayHi(); // 输出：你好，我是 小狼
```

这里，`Student` 类继承自 `Person`，调用 `super(name)` 就相当于执行了 `Person` 的构造逻辑。必须先执行 `super()`，才能在子类构造函数中使用 `this`。

> 子类实例不仅能访问自己的属性，也能使用父类定义的方法。

### 方法重写与扩展

子类可以定义和父类同名的方法，来**重写**父类的实现：

```js
class Student extends Person {
  sayHi() {
    console.log(`我是学生 ${this.name}`);
  }
}

const s = new Student('小狼');
s.sayHi(); // 输出：我是学生 小狼
```

如果希望**在保留父类逻辑的基础上扩展功能**，可以用 `super.方法名()` 调用父类方法：

```js
class Student extends Person {
  sayHi() {
    super.sayHi();           // 调用父类的 sayHi
    console.log('我拓展了父类的方法！');
  }
}

const s = new Student('小狼');
s.sayHi();
// 输出：
// 你好，我是 小狼
// 我拓展了父类的方法！
```

这种“先调用父类 → 再加一点自己的逻辑”的写法，在实际开发中非常常见。

### 字段初始化顺序（理解）

当你涉及到继承时，类中字段的初始化顺序如下：

1. 父类字段初始化
2. 父类构造函数执行
3. 子类字段初始化
4. 子类构造函数执行

字段初始化顺序对有些设计场景（如属性覆盖、父类依赖字段等）有一定影响。掌握这个顺序能帮助你排查一些诡异的问题，但对入门而言只需理解即可。

# 静态属性与私有属性

在类中定义的属性和方法，默认都是**公有的**，但 ES6 也支持通过不同语法定义静态成员和私有成员。

### `static` - 静态

- 静态成员只能通过**类本身访问**
- **不能通过实例访问**

```js
class Test {
  static staticProp = '这是静态属性';

  static staticMethod() {
    console.log('这是静态方法');
  }

  info() {
    // 只能通过类名访问
    console.log(Test.staticProp);
    Test.staticMethod();
  }
}

Test.staticMethod(); // ✅
const t = new Test();
// t.staticMethod(); // ❌ 报错：不是函数
```

### `#` - 私有

- 使用 `#前缀` 定义私有成员
- 只能在类内部访问，外部访问会报错

```js
class Test {
  #secret = '狼的秘密';

  #saySecret() {
    console.log(this.#secret);
  }

  info() {
    this.#saySecret(); // ✅ 可访问
  }
}

const t = new Test();
// t.#secret;      // ❌ 报错
// t.#saySecret(); // ❌ 报错
```

> 一些浏览器控制台会为了方便测试自动显示私有成员，但**这并不意味着外部可以合法访问它们**。
