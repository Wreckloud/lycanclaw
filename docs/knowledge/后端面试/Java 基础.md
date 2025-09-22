---
title: 'Java 基础'
date: '2025-09-15 08:46:30'
description: '这是一篇新文章!'
order: 0
publish: true
tags: 
---

# **String、StringBuffer、StringBuilder 的区别**

这三者都能表示字符串，但设计目的完全不同。

在 JDK 8 及之前，它们都用 `char[]` 存储字符；
从 JDK 9 开始改成 `byte[] + coder` 的组合，以节省内存，因为大部分字符串只用到单字节编码。三个类都是 `final` 修饰，不能被继承。

- **String**：不可变，内部字符数组被 `final` 修饰。任何修改都会创建新对象，让引用指向新地址。

```java
// String：每次拼接都会创建新对象
String s1 = "wolf";
s1 = s1 + " pack";  // 实际生成了新的字符串对象
```

> 但注意 `final` 只限制**指针不变**，限制不了指向对象的内容。`String` 通过**不外泄引用**与**防御性拷贝**确保没有任何代码能拿到内部数组去改；

- **StringBuffer**：可变，所有方法加 `synchronized`，保证线程安全。

```java
// StringBuffer：线程安全
StringBuffer sbf = new StringBuffer("wolf");
sbf.append(" pack"); // 修改原对象
```

- **StringBuilder**：可变，但没有加锁，线程不安全，性能更高。

```java
// StringBuilder：性能最佳（单线程）
StringBuilder sbd = new StringBuilder("wolf");
sbd.append(" howl");
```

这种不可变设计让 `String` 更适合作为哈希表键值，因为内容不会变化；同时也保证线程安全，但频繁修改时会产生大量临时对象，性能较差。
