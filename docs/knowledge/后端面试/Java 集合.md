---
title: 'Java 集合'
date: '2025-09-29 09:31:57'
description: '这是一篇新文章!'
order: 0
publish: true
tags:
  - Java
  - 集合
  - 面试
---

# 有没有可能两个不相等的对象有相同的 `hashCode`

`hashCode` 只是把对象“映射”成一个整数，它的范围是 32 位（约 40 亿个可能值）。而对象数量理论上无限，肯定会出现不同对象算出来的 hash 值一样的情况，这就是 **哈希冲突**。

1. **数学必然性**：hash 算法是把无限多的输入压缩到有限的整数范围，不可避免有碰撞。
2. **算法设计**：即便是分布再好的哈希函数，也只是降低冲突概率，而不是消灭冲突。

例如：

```java
String a = "Aa";
String b = "BB";
System.out.println(a.hashCode()); // 2112
System.out.println(b.hashCode()); // 2112
System.out.println(a.equals(b));  // false
```

这里 `a` 和 `b` 就是**不相等的对象**，但 `hashCode` 完全一样。

JDK 的集合类会妥善处理：

- **拉链法**：同一个数组槽位里挂链表（JDK8 之后链表过长会变红黑树）。
- **开放地址法**：继续往下找空位置，直到找到为止。
- **再哈希**：换一个哈希函数再算一次，直到不冲突。

所以 `hashCode` 相等 ≠ 对象相等，还必须调用 `equals()` 确认。  
反之：如果 `equals` 相等，必须保证 `hashCode` 也相等，否则会破坏哈希表的契约，导致集合里找不到你放进去的对象。
