---
title: JUnit-单元测试插件
tags:
  - 开发工具
  - Java
  - 测试
categories:
  - 猎识印记-领域
excerpt: 'JUnit 是最流行的 Java 测试框架之一, 提供了一些功能, 方便程序进行单元测试.'
thumbnail: /img/文章封面/JUnit.jpg
published: true
date: 2024-11-29 15:21:40
---

# 单元测试

测试是一种用来促进鉴定软件的正确性, 完整性, 安全性和质量的过程, 测试分为四个阶段.

1). 单元测试

- 介绍：对软件的基本组成单位进行测试，最小测试单位。
- 目的：检验软件基本组成单位的正确性。
- 测试人员：开发人员

  2). 集成测试

- 介绍：将已分别通过测试的单元，按设计要求组合成系统或子系统，再进行的测试。
- 目的：检查单元之间的协作是否正确。
- 测试人员：开发人员

  3). 系统测试

- 介绍：对已经集成好的软件系统进行彻底的测试。
- 目的：验证软件系统的正确性、性能是否满足指定的要求。
- 测试人员：测试人员

  4). 验收测试

- 介绍：交付测试，是针对用户需求、业务流程进行的正式的测试。
- 目的：验证软件系统是否满足验收标准。
- 测试人员：客户/需求方

### 常见测试方法

测试方法有以下三种: 白盒测试、黑盒测试 及 灰盒测试.

1). 白盒测试

清楚软件内部结构, 代码逻辑.
用于验证代码, 逻辑正确性.

2). 黑盒测试

不清楚软件内部结构, 代码逻辑.
用于验证软件的功能, 兼容性, 验收测试等方面.

3). 灰盒测试

结合了白盒测试和黑盒测试的特点, 既关注软件的内部结构又考虑外部表现 (功能).

# JUnit 入门

JUnit 是最流行的 Java 测试框架之一, 提供了一些功能, 方便程序进行单元测试.

之前学习 Java 的过程中, 我们都是在 main 方法中进行测试.
这种方式虽然可以进行测试, 但是有一些弊端:

1. 测试代码与源代码未分开，难维护。
2. 一个方法测试失败，影响后面方法。
3. 无法自动化测试，得到测试报告。

而如果我们使用了 **JUnit 单元测试** 框架进行测试，将会有以下优势:

1. 测试代码与源代码分开，便于维护。
2. 可根据需要进行自动化测试。
3. 可自动分析测试结果，产出测试报告。

要想使用 JUnit 测试程序, 方法也十分简单, 只需要在`pom.xml`中, 引入 JUnit 的依赖:

```XML
<!--Junit单元测试依赖-->
<dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter</artifactId>
    <version>5.9.1</version>
    <scope>test</scope>
</dependency>
```

接着, 在 `test/java` 目录下, 创建测试类, 并编写对应的测试方法, 并在方法上声明 `@Test` 注解.

```Java
@Test
public void testGetAge(){
    Integer age = new UserService().getAge("110002200505091218");
    System.out.println(age);
}
```

**注意：**

- 测试类的命名规范为：XxxxTest
- 测试方法的命名规定为：public void xxx(){...}

# 断言

单元测试运行不报错, 并不能表示代码逻辑正确.

JUnit 提供了一些辅助方法, 用来帮我们确定被测试的方法是否按照预期的效果正常工作, 这种方式称为**断言**。

| 断言方法                                                          | 描述                                       |
| ----------------------------------------------------------------- | ------------------------------------------ |
| `assertEquals(Object 期望值, Object 实际值, String 错误提示信息)` | 检查两个值是否相等，不相等就报错。         |
| `assertNotEquals(Object 期望值, Object 实际值, String msg)`       | 检查两个值是否不相等，相等就报错。         |
| `assertNull(Object 实际值, String 错误提示信息)`                  | 检查对象是否为 null，不为 null，就报错。   |
| `assertNotNull(Object 实际值, String 错误提示信息)`               | 检查对象是否不为 null，为 null，就报错。   |
| `assertTrue(boolean 条件, String 错误提示信息)`                   | 检查条件是否为 true，不为 true，就报错。   |
| `assertFalse(boolean 条件, String 错误提示信息)`                  | 检查条件是否为 false，不为 false，就报错。 |
| `assertSame(Object 期望值, Object 实际值, String 错误提示信息)`   | 检查两个对象引用是否相等，不相等，就报错。 |

```Java
package com.itheima;

import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

public class UserServiceTest {

    @Test
    public void testGetAge2(){
        Integer age = new UserService().getAge("110002200505091218");
        Assertions.assertNotEquals(18, age, "两个值相等");
//        String s1 = new String("Hello");
//        String s2 = "Hello";
//        Assertions.assertSame(s1, s2, "不是同一个对象引用");
    }

    @Test
    public void testGetGender2(){
        String gender = new UserService().getGender("612429198904201611");
        Assertions.assertEquals("男", gender);
    }
}
```

# 注解

在 JUnit 中还提供了一些注解，还增强其功能，常见的注解有以下几个：

| 注解           | 说明                                                  | 备注     |
| -------------- | ----------------------------------------------------- | -------- |
| `@Test`        | 测试类中的方法用它修饰才能成为测试方法，才能启动执行  | 单元测试 |
| `@DisplayName` | 指定测试类、测试方法显示的名称 （默认为类名、方法名） |          |

这类方法通常用于资源准备工作和释放, 以及环境清理工作.

| 注解          | 说明                                                                 | 备注                 |
| ------------- | -------------------------------------------------------------------- | -------------------- |
| `@BeforeEach` | 用来修饰一个实例方法，该方法会在**每一个**测试方法执行之前执行一次。 | 初始化资源(准备工作) |
| `@AfterEach`  | 用来修饰一个实例方法，该方法会在**每一个**测试方法执行之后执行一次。 | 释放资源(清理工作)   |
| `@BeforeAll`  | 用来修饰一个静态方法，该方法会在**所有**测试方法之前只执行一次。     | 初始化资源(准备工作) |
| `@AfterAll`   | 用来修饰一个静态方法，该方法会在**所有**测试方法之后只执行一次。     | 释放资源(清理工作)   |

```Java
public class UserServiceTest {

    @BeforeEach
    public void testBefore(){
        System.out.println("before...");
    }

    @AfterEach
    public void testAfter(){
        System.out.println("after...");
    }

    @BeforeAll //该方法必须被static修饰
    public static void testBeforeAll(){
        System.out.println("before all ...");
    }

    @AfterAll //该方法必须被static修饰
    public static void testAfterAll(){
        System.out.println("after all...");
    }

    @Test
    public void testGetAge(){
        Integer age = new UserService().getAge("110002200505091218");
        System.out.println(age);
    }

    @Test
    public void testGetGender(){
        String gender = new UserService().getGender("612429198904201611");
        System.out.println(gender);
    }
 }
```

输出结果如下:

![](../../../../img/文章资源/junit-单元测试插件/file-20241130151132882.jpg)

这类方法一般用作批量参数测试:

| 注解                 | 说明                                                            | 备注                             |
| -------------------- | --------------------------------------------------------------- | -------------------------------- |
| `@ParameterizedTest` | 参数化测试的注解 (可以让单个测试运行多次，每次运行时仅参数不同) | 用了该注解，就不需要@Test 注解了 |
| `@ValueSource`       | 参数化测试的参数来源，赋予测试方法参数                          | 与参数化测试注解配合使用         |
两个注解通常配合使用.

```Java
package com.itheima;

import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

@DisplayName("测试-学生业务操作")
public class UserServiceTest {

    @DisplayName("测试-获取年龄")
    @Test
    public void testGetAge(){
        Integer age = new UserService().getAge("110002200505091218");
        System.out.println(age);
    }

    @DisplayName("测试-获取性别")
    @Test
    public void testGetGender(){
        String gender = new UserService().getGender("612429198904201611");
        System.out.println(gender);
    }

    @DisplayName("测试-获取性别3")
    @ParameterizedTest
    @ValueSource(strings = {"612429198904201611","612429198904201631","612429198904201626"})
    public void testGetGender3(String idcard){
        String gender = new UserService().getGender(idcard);
         System.out.println(gender);
    }
}
```

测试结果

![](../../../../img/文章资源/junit-单元测试插件/file-20241130152449637.jpg)

# 企业开发规范

编写测试方法时, 除了常规需要测试, 还要尽可能的覆盖业务方法中所有可能的情况 (尤其是边界值).

例如:
* null值
* 空值
* 非法值
等.