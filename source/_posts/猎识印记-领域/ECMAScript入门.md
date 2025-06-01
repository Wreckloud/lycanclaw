---
title: ECMAScript入门
tags:
  - 前端
  - JavaScript
  - 入门基础
categories:
  - 猎识印记-领域
excerpt: ECMAScript 是定义脚本语言的规范, 而 JavaScript 是遵循 ECMAScript 规范实现的一种编程语言.
thumbnail: img/文章封面/ECMAScript封面.JPG
published: false
date: 2024-04-19 17:48:52
---

# ECMAScript 概述

ECMAScript 是定义脚本语言的规范, 而 JavaScript 是遵循 ECMAScript 规范实现的一种编程语言.

ECMAScript 好比是一本书的目录, 而 JavaScript 是这本书的具体内容.

#### ES6 和 JavaScript 有什么区别？

ES6(ECMAScript 2015)是 ECMAScript 规范的第六个版本, 而 JavaScript 是基于 ECMAScript 规范实现的编程语言.

ES6 可以被看作是 JavaScript 的一个重要的版本更新.

# 变量和常量

### 变量(Variable)

是用于存储数据的名称(标识符), 变量可以是任何类型, 如 "数值、字符串" 等.

```ES6
let str = "字符串"
let num = 100
```

变量可以重新赋值

> ES6 不区分整型和浮点型, 所有数字都使用 `number类型` 来表示

### 常量(Constant)

是一个固定的值, 在程序运行中常量的值保持不变

```ES6
const PI = 3.14
```

### 如何选择使用 let 或 const

1. 默认使用 const.
2. 当其需求为可变时, 使用 let 进行可变声明.

# 数据类型

### 字符串 string

字符串类型用于存储字符序列

#### 常用方法

- `length` 字符串长度
- `toLowerCase` / `toUpperCase` 转小写/转大写
- `字符串[索引]` 返回索引处的字符

- `[...字符串]` 字符串转为字符数组
- `parseInt("1234")` 字符串转 int

- `replaceALL("目标字符串","替换成的字符串")` 替换全部字符串替换
- `replacece("目标字符串","替换成的字符串")`替换一个字符串替换

#### 模板字符串

```ES6
`姓名:${this.name} 年龄:${this.age}`
```

### 数值 number

用于存储数字, 可以表示整数、浮点数

### 布尔类型 boolean

布尔类型只能取两个值,true(真) 和 false(假)

### 函数 function

函数是一段**可重复执行的代码块**，可以接收输入参数并返回一个值或执行某些操作.

```ES6
// 定义一个计算两数之和的函数
function add(a, b) {
  return a + b
}

console.log("add", add(1, 2))

// 匿名函数
let sub = function(x,y) {
  return x-y
}

console.log(sub(1, 2))

// 箭头函数
let plus = (a,b) => {
  return a+b
}

console.log(plus(1, 2))

// 隐式返回
let minus = (a,b) => a-b

let double = n => 2n
```

### 数组 array

数组是一种**有序集合**, 可以包含不同类型的元素，并且数组的长度是**可变的**.

```ES6
let str = ["a","b","c","b"] //定义了一个包含4个字符串的数组

let arr = ["1","3.14","a"]
```

#### 常用方法

- `push(元素1,元素2)` 向数组**末尾**添加一个或多个元素(用逗号隔开元素), 并返回**修改后数组的长度**
- `unshift(元素1,元素2)` 向数组**开头**添加一个或多个元素, 并返回修**改后数组的长度**
- `pop()` 删除数组**最后一个**元素, 并返回被删除元素删
- `shift()` 除数组中**第一个**元素, 并返回被删除元素
- `splice(要删除元素的索引位置, 要删除的元素数量)` 删除元素, 并返回包含被删除元素的数组

- `reverse()` 反转数组中元素的顺序
- `sort()` 数组中的元素按照首字母顺序排序

使用 `sort()` 排序数组 [5,20,13,1,4] ,由于只比较首字母的缘故, 会得到 [1,13,20,4,5] 的结果.

配合比较函数 `(a,b) => a-b`, 实现数字排序:

```ES6
arr.sort((a,b) => a-b)
```

- `filter()` 筛选符合条件的元素

例如, 筛选值大于 12 的元素

```ES6
arr.filter((n) => n>12)
```

#### 数组的 for 循环遍历

```ES6
for (let item of arr){
  console.log(item)
}
```

```ES6
arr.forEach((value,index) => {console.log(value,index)})
```

### set

Set 是一种特殊的数据结构, 用于存储**无序且唯一**的值的集合.

```ES6
let number = new Set([1, 2, 3, 4, 5]) //定义了一个包含5个"不重复"的整数的集合

//错误示范
let numbers = new Set([1, 2, 3, 4, 5, 5])
```

#### 常用方法

- `add('元素')` 向 Set 集合中添加新的元素
- `delete('元素')` 从 Set 集合中删除元素
- `clear()` 清空 Set 集合
- `has('元素')` 检查 Set 集合是否包含指定元素

- `size` 获取 Set 集合的大小
- `Array.from(set集合)` 将 Set 集合 转换为 数组

- 使用扩展运算符`...`将 Set 集合 转换为 数组

```ES6
 let arr = [...Set集合]
```

扩展运算符可用于展开可迭代对象(如数组、字符串等)

例如

```ES6
 let str = '一个字符串'
 console.log(str) // ['一','个','字','符','串',]
```

- 将 数组 转换为 Set 集合

```ES6
let numberArr = [1, 2, 3, 3, 2, 1]
let numberSet = new Set(numberArr)

// 输出为 [1,2,3]
```

利用 Set 集合 特性, 可实现数组去重

#### Set 集合的 for 循环遍历

```ES6
for (let item of set){
  console.log(item)
}
```

```ES6
arr.forEach((value,index) => {console.log(value,index)})
```

### 对象 object

对象是一种**复合的数据类型**, 可以通过键值对的方式存储多个值.

```ES6
//定义了一个包含姓名、年龄和体重的对象

let boy = {
  name: "David",
  age: 28,
  weight: 70.5
}
```

#### 常用方法

- 向对象中添加新的属性 `对象.新属性 = 值`

```ES6
boy.height = 175
```

在对象中, 每个键都是唯一的, 当使用相同的键再次赋值时, 会替换原来键对应的值.

- 删除属性 `delete 对象.属性`
- 清空对象 `对象 = {}`
- 检查对象是否包含指定属性 `"属性" in 对象`

- 获取对象的属性数量 `Object.keys(person).length`

```ES6
let person = {
  name: "张三",
  gender: "男",
}

//Object.keys() 用于获取对象属性名(key)的数组
console.log(Object.keys(person)) // 输出为数组, ["name","gender"]

console.log(Object.keys(person).length)
```

除了 `Object.keys(数组)` 取对象的属性名, 输出为数组, 还有:

```ES6
console.log(Object.values(对象)) // 取对象的值输出为数组

console.log(Object.entries(对象)) // 取对象的键值对输出为数组
```

- 将对象转换为数组 `Object.entries(对象)`

#### 对象的 for 循环遍历

```ES6
for (let key in 对象) {
  console.log(key, 对象[key])
}
```

```ES6
Object.enties(对象).forEach(
  ([key, value]) => {
  console.log(key, value)
  }
)
```

### map

map 是一种特殊的数据结构,用于存储**键值对**的有序集合.

```ES6
//定义了一个包含姓名、年龄和体重的map
let girl = new Map([
  ["name", "Luna"],
  ["age", 20],
  ["weight", 50.5]
])
```

> Map 相对于对象提供了更灵活、有序、高效的键值对存储和操作方式,当需要在大量键值对中快速查找或删除特定键值对时, Map 比对象更高效
> Map 提供了一些便捷的方法来操作键值对, 如: `get()`、`set()`、`delete()`
> Map 提供了一些便捷的迭代方法, 如: `forEach()`、`keys()`、`values()`、`entries()`

##### 常用方法

- 向 Map 集合中添加新的元素 `set('键','键值')`

> 在 Map 集合中, 每个键都是唯一的, 当使用相同的键再次调用 `set()` 方法时, 会替换原来键对应的值.

- 删除元素 `delete('元素')`
- 检查 Map 集合是否包含指定元素 `has('元素')`
- 获取 Map 集合的大小 `size()`
- `clear()` 清空 Map 集合

- 将 Map 集合转换为数组 `Array.from(Map集合)`
- 使用扩展运算符`...`将 Map 集合 转换为 数组

```ES6
 let arr = [...Map集合]
```

#### map 集合的 for 循环遍历

`[key, value]` 就是一种解构语法, 解构可以从数组或对象中提取值并赋给变量.  
将 Map 集合中的键值对解构为 key 和 value 两个变量.

```ES6
for (let [key, value] of person) {
console.log(key, value)
}
```

```ES6
person.forEach(
  (value, key) => {
  console.log(key, value)
  }
)
```

### 类 class

类是一种蓝图或模板，用于**创建具有相同属性和方法的**对象.  
命名时 类 的首字母大写.

```ES6
class Person {
  //若在类中没有显式声明属性, 但在构造函数或方法中引用了未声明的属性, 会自动将其视为实例属性

  name
  age

  //构造函数 用于初始化属性
  constructor(name, age) {
    this.name = name
    this.age = age
  }

  //方法 返回个人信息
  info() {
    console.log("姓名", this.name, "年龄", this.age)
  }
}

// 新建对象
const person = new Person("张三", 22)

//调用info()方法
person.info()
```

# 私有属性

私有属性是指仅在类内部可访问和操作的属性, 外部无法直接访问和修改.

```ES6
class Person{
  #name
}
```

定义私有属性时, 在变量前添加 `#`

```ES6
get web(){
  return this.#name
}

set web(value){
  this.#web = value
}
```

# 继承

继承 extends .被继承的类称为 **父类**.继承的类称为 **子类**.

子类不但能调用父类的方法, 而且还能拥有自己的方法.  
子类在调用时, 使用 `super(父类属性)` 调用父类属性.

例如

```ES6
// 定义一个父类
class Fater{
  name
  gender

  constructor(name, gender){
    this.name = name
    this.gender = gender
  }

  sleep(){
    return `${this.name} 睡觉中...`
  }
}

// 定义一个子类
class Son extends Father{ // 子类继承父类
  age // 子类特有属性

  constructor(name, gender, age){
    super(name, gender) // 调用父类属性

    this.age = age
  }

  eat(){
    return `${this.name} 吃饭中...`
  }
}

let son = new Son("儿子", "男", "22")

console.log(son.eat())
console.log(son.sleep()) // 子类不仅可以有自己的方法, 还能随时调用父类的方法
```

# 解构

可以从数组或对象中提取值并赋给变量.

### 数组解构

将数组 `[1,2]` 的值分别赋给 `x` ,`y`

```ES6
let [x, y] = [1 ,2]
```

只需要将想赋值的变量放到对应的位置上即可.  
同理的, 将数组 `[1,2,3]` 最后一个值赋给变量 `c` :

```ES6
let [ , , c] = [1,2,3]
```

配合使用扩展运算符`...`将其 转换为 数组 , 然后赋给变量.  
例如:

```ES6
let [A, ...B] = [1, 2, 3, 4, 5, 6]
```

这样, `A` 的值为 `1`. `B` 的值为 数组 `[2,3,4,5,6]`

> 注意: 扩展运算符 `...` 解构必须放到最后, 否则会报错.

反过来, 两个变量解构一个值时, 只会有第一个变量得到这个值.  
例如:

```ES6
let [e,f] = [100] // e = 100, f = undefined
```

这时我们可以给予变量默认值.

```ES6
let [e,f = 200] = [100] // e = 100, f = 200
```

要注意的是, 给予默认值的优先级较低, 若通过解构再赋值, 默认值会被覆盖.

```ES6
let [e= 200,f ] = [100] // e = 100, f = undefined
```

快速交换变量的值

```ES6
let X = 10,Y = 2;
[X,Y]=[Y,X]
```

### 对象解构

定义一个对象

```ES6
let person = {
  name = "张三"
  gender = "男"
  age = 22
}
```

解构对象, 获取属性值

```ES6
const {name,gender,age} = person

console.log(name) // 输出 张三
console.log(gender) // 输出 男
console.log(age) // 输出 22
```

设置默认值, 也能给不存在的属性赋默认值.

```ES6
let {name = "李四"} = person

let {hight = 175} = person // 给不存在的属性赋默认值
```

重命名解构值

```ES6
let {name:userName } = person // 将 name 重命名为 userName
```

扩展运算符`...`将其 转换为 对象

```ES6
const {name,...rest} = person

console.log(name) // 输出 张三
console.log(rest) // 输出 {gender: "男", age: 22}
```

# 承诺 Promise

> 异步操作 是指在程序执行过程中, 某个操作不会立即返回结果, 而是需要一段时间的等待.
>
> 例如用户登陆时, 需要一段等待的时间, 不会立即返回结果.

Promise 对象有三种状态:

1. pending (进行中) - 初始状态
2. fulfilled (已成功)
3. rejected (已失败)

当创建一个 Promise 对象时, 它的初始状态为 `pending`, 表示异步执行还未完成.  
当异步执行成功时, 会调用 resolve 函数把 Promise 对象的状态改变为 `fulfilled`, 可通过 then 方法来获取异步操作的结果.  
当异步执行异常时, 会调用 reject 函数把 Promise 对象的状态更改为 `rejected`, 可通过 catch 方法来处理错误.

结合三元运算, 例如:

```ES6
const myPromise = new Promise((resolve, reject) => {
    // 异步操作
    true ? resolve('已成功') : reject('已失败');
});
```

这里, `resolve('已成功')` 被调用时, 它会将字符串 `'已成功'` 设置为 Promise 的解析值.  
但是, 这个值并不会立即被输出到控制台.

输出发生在你使用 .then() 方法时.

```ES6
myPromise
    .then((value) => {
        // 当 promise 被成功 resolve 时执行
        console.log(value); // 这里输出: Promise is fulfilled.
    })
    .catch((error) => {
        // 当 promise 被 reject 时执行
        console.log(error);
    });
```

`.catch()` 方法来添加失败情况的回调函数.  
使用 `.finally` , 无论是成功还是失败都会执行, 可用于输出日志.

## Fetch

fetch 是基于 Promise 的 api, 它可以发送 http 请求并接收服务器返回的响应数据  
fetch 返回的是一个 Promise 对象

> API(Application Programming Interface) 中文通常翻译为 `"应用程序编程接口"`.
>
> API 是一组预定义的函数, 协议和工具. 用于构建软件应用.

# 模块化开发

不同的模块之间可以通过使用 `export` 关键字将代码导出为模块,其他模块可以使用 `import` 关键字导入该模块.

使用 `export` 导出多个变量或函数:

```ES6
//index.js
let num  = 22
let name = 张三

let eat = () => {
  return "好饿!"
}

export{ num, name, eat }
```

使用 `import` 从 index.js 文件中导入 num,name,eat 变量/函数,  
使用 `as` 重定义别名

```ES6
import { num as age, name, eat } from './index.js'

console.log(age)
console.log(name)
console.log(eat())
```

使用 `default` 将一个对象作为整体导出, 导出的对象包含 num,name,eat 三个属性

```ES6
//index.js
let num  = 22
let name = 张三

let eat = () => {
  return "好饿!"
}

export default { num, name, eat }
```

```HTML
<script type="module"> // 添加 type="module"
    import obj from "./index.js"

    console.log(obj.num)
    console.log(obj.name)
    console.log(obj.eat())
</script>
```

另外, `* as` 与 `default` 功能上等价.
