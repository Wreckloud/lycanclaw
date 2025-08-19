---
title: JUnit-单元测试插件
date: 2024-11-29 15:21:40
description: 这是一篇新文章!
publish: true
tags:
---

# 单元测试

是针对最小功能单元（通常是方法）编写测试代码，验证其正确性。  
在没有引出单元测试之前，我们常常是把测试代码塞进 `main` 的，这种传统做法问题明显：

- 与业务代码混在一起，难维护
- 无法自动化，一个失败可能“拖累全局”
- 没有统一报告，结果全靠肉眼判断

这正是引入 **JUnit** 的动机。JUnit 是 Java 常用的单元测试框架，IDEA 已内置支持。使用它可以：

- 为每个方法编写独立的测试，用例彼此不干扰
- 通过断言自动判断结果，生成清晰的测试报告
- 一键运行全部测试，适合自动化和持续集成

## 需求与步骤

**需求**：某系统有多个业务方法，使用 JUnit 为它们编写测试，验证正确性。

**步骤**（现代 IDEA 已集成 JUnit，不必手动导 jar）：

1. 为被测类创建**对应测试类**（通常放在 `src/test/java`，命名 `被测类名 + Test`）。
2. 为每个业务方法编写**测试方法**：**公开、无参数、无返回值**，并标注 `@Test`。
3. 在测试方法中**调用被测方法并观察/断言结果**。
4. 运行测试：通过为绿色，失败为红色，并展示报告。

```java
// src/main/java/com/example/StringUtil.java
package com.example;

public class StringUtil {

    // 打印名字长度（这里先不做空值判断，留给测试暴露）
    public static void printNumber(String name) {
        System.out.println("名字长度是：" + name.length());
    }

    // 求字符串的最大索引：空或空串时返回 -1
    public static int getMaxIndex(String data) {
        if (data == null || data.isEmpty()) return -1;
        return data.length() - 1;
    }
}
```

测试类（`@Test` 标注 + 方法签名要求），测试类要求公开、无参、无返回值。

```java
// src/test/java/com/example/StringUtilTest.java
package com.example;

import org.junit.jupiter.api.Test;            // JUnit 5
import static org.junit.jupiter.api.Assertions.*; // 断言可稍后再加，这里先演示调用

public class StringUtilTest {

    @Test
    public void testPrintNumber() {
        // 这行会触发 NPE：借此观察到问题
        StringUtil.printNumber(null);
        StringUtil.printNumber("");
        StringUtil.printNumber("影牙");
    }

    @Test
    public void testGetMaxIndex() {
        System.out.println(StringUtil.getMaxIndex(null));  // -1
        System.out.println(StringUtil.getMaxIndex(""));    // -1
        System.out.println(StringUtil.getMaxIndex("影牙狼")); // 2
    }
}
```

运行后，`testPrintNumber()` 会因为 `null` 触发 `NullPointerException`，问题明确：被测方法缺少空值处理。

然后我们就能够按测试反馈修正被测代码：

```java
public static void printNumber(String name) {
    if (name == null) {
        System.out.println("参数不能为 null");
        return;
    }
    System.out.println("名字长度是：" + name.length());
}
```

再次运行，`testPrintNumber()` 不再抛异常；到这里，**JUnit 引入目标已达成**：

- 会写 `@Test`
- 会建测试类/方法
- 能用测试暴露问题并驱动修复

> 后续只需在测试方法中引入**断言**（`assertEquals`、`assertThrows` 等），就能让判断自动化，减少肉眼观察。这一块放到“快速上手”里再细化即可。

## 断言

`println` 只能“看个热闹”，判断对错还是要靠人。断言能通过设定的规则**自动判定通过/失败**并产出清晰报告。

**被测代码（同前）**

```java
package com.example;

public class StringUtil {
    public static int getMaxIndex(String s) {
        if (s == null || s.isEmpty()) return -1;
        return s.length() - 1;
    }
}
```

**测试代码（使用断言替代 println）**

```java
package com.example;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class StringUtilTest {

    @Test
    void getMaxIndex_cases() {
        int i1 = StringUtil.getMaxIndex(null);
        assertEquals(-1, i1, "null 应返回 -1");

        int i2 = StringUtil.getMaxIndex("");
        assertEquals(-1, i2, "空串应返回 -1");

        int i3 = StringUtil.getMaxIndex("影牙狼"); // 长度 3 → 最大索引 2
        assertEquals(2, i3, "最大索引不正确");
    }
}
```

## 常用断言方法

| 断言方法                                   | 作用                  |
| ------------------------------------------ | --------------------- |
| `assertEquals(expected, actual)`           | 验证两个值是否相等    |
| `assertNotEquals(unexpected, actual)`      | 验证两个值是否不相等  |
| `assertTrue(condition)`                    | 验证条件是否为 true   |
| `assertFalse(condition)`                   | 验证条件是否为 false  |
| `assertNull(actual)`                       | 验证对象是否为 null   |
| `assertNotNull(actual)`                    | 验证对象是否不为 null |
| `assertSame(expected, actual)`             | 验证是否同一对象      |
| `assertThrows(exceptionClass, executable)` | 验证是否抛出指定异常  |

> 所有断言方法都有一个可选的消息参数，用于测试失败时提供更清晰的错误信息。

## 生命周期

- **JUnit 5**：`@BeforeEach` / `@AfterEach`（每个测试前后），`@BeforeAll` / `@AfterAll`（整类前后一次；需 `static`）。
- **JUnit 4 对照**：`@Before` / `@After`，`@BeforeClass` / `@AfterClass`。

```java
import org.junit.jupiter.api.*;

class LifeCycleDemo {

    @BeforeAll
    static void initAll() { /* 建立连接等昂贵准备 */ }

    @BeforeEach
    void init() { /* 每例重置状态 */ }

    @Test
    void case1() { /* ... */ }

    @AfterEach
    void tearDown() { /* 每例清理 */ }

    @AfterAll
    static void tearDownAll() { /* 关闭连接等 */ }
}
```

> 常见场景：用 `@BeforeEach` 准备对象/测试数据；用 `@AfterEach` 清理。其余按需添加即可。

| 注解          | 执行时机                   | 适用场景                   |
| ------------- | -------------------------- | -------------------------- |
| `@BeforeEach` | 每个测试方法前             | 重置测试环境、准备测试数据 |
| `@AfterEach`  | 每个测试方法后             | 清理资源、恢复环境         |
| `@BeforeAll`  | 所有测试方法前(仅执行一次) | 全局资源初始化、昂贵操作   |
| `@AfterAll`   | 所有测试方法后(仅执行一次) | 释放共享资源、清理环境     |
