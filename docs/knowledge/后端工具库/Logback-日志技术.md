---
title: Logback-日志技术
date: 2025-09-01 09:24:20
description: 这是一篇新文章!
order: 0
publish: true
tags:
---

在项目开发中，日志是必不可少的。它能记录系统运行时的重要信息：谁在操作数据、用户的访问行为、系统出错时的现场。
相比 `System.out.println()` 这种原始输出，日志框架提供了更灵活、更专业的方案。

目前常见的日志框架有：

- **JUL**（`java.util.logging`，JDK 自带）
- **Log4j**
- **Logback**

问题在于：这些框架的 API 各不相同，如果换一个框架，就要改动大量代码。

我们都知道，接口可以用来统一规则。为了解决这个痛点，业界引入了 **日志接口** 的概念：

- **Commons Logging (JCL)** —— Java 早期常用的接口；
- **SLF4J** —— 现代主流接口，设计更合理。

**接口 + 实现** 的模式就此形成：

- 开发时依赖 **接口（如 SLF4J）**，保证代码统一；
- 运行时由 **具体框架（如 Logback）** 提供实现。

因此，主流组合就是：**SLF4J + Logback**。  
换句话说， 现代程序员在用的 Logback 是基于 slf4j 的日志规范实现的框架。

## Logback 入门

[Logback](https://logback.qos.ch/)
是 **SLF4J 的原生实现**，性能优异，配置灵活，是目前 Java 项目中使用最广的日志框架之一。

Logback 分为三个模块：

- **logback-core**  
   基础模块，其他两个模块都依赖它，必不可少。
- **logback-classic**  
   实现了 SLF4J API，是开发者日常使用的核心模块，也必须引入。
- **logback-access**  
   用于和 Servlet 容器（如 Tomcat、Jetty）集成，记录 HTTP 访问日志。属于可选模块。

因此，在常规 Java 项目中，最少需要整合 **slf4j-api + logback-core + logback-classic**。

# 入门示例

**需求**：在控制台输出程序运行过程中的信息。

#### 1. 引入依赖

如果没有用 Maven，可以手动导入 `slf4j-api`、`logback-core`、`logback-classic` 三个 jar 包。  
在实际项目中推荐使用 Maven，配置如下：

```xml
<dependency>
    <groupId>org.slf4j</groupId>
    <artifactId>slf4j-api</artifactId>
    <version>1.7.36</version>
</dependency>
<dependency>
    <groupId>ch.qos.logback</groupId>
    <artifactId>logback-core</artifactId>
    <version>1.2.11</version>
</dependency>
<dependency>
    <groupId>ch.qos.logback</groupId>
    <artifactId>logback-classic</artifactId>
    <version>1.2.11</version>
</dependency>
```

#### 2. 配置文件

在 `src/main/resources` 下创建 `logback.xml`，这是 Logback 的核心配置文件（必须存在于 classpath 中）。

#### 3. 使用 Logger

通过 `LoggerFactory` 创建 Logger 对象，然后就可以打印日志：

```java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Test {
    private static final Logger LOGGER = LoggerFactory.getLogger(Test.class);

    public static void main(String[] args) {
        try {
            LOGGER.info("除法开始了...");
            int c = div(10, 2);
            LOGGER.info("除法执行成功。结果 c = {}", c);
        } catch (Exception e) {
            LOGGER.error("除法执行失败: {}", e.getMessage());
        }
    }

    private static int div(int a, int b) {
        LOGGER.debug("参数 a = {}", a);
        LOGGER.debug("参数 b = {}", b);
        return a / b;
    }
}
```

运行结果示例：

```
2024-03-29 15:22:15 [INFO ] Test.main - 除法开始了...
2024-03-29 15:22:15 [DEBUG] Test.main - 参数 a = 10
2024-03-29 15:22:15 [DEBUG] Test.main - 参数 b = 2
2024-03-29 15:22:15 [INFO ] Test.main - 除法执行成功。结果 c = 5
```

通过配置文件可以决定日志写到哪里（控制台、文件等），以及输出哪些级别的日志。

# 日志级别

在日志系统中，**级别**用来区分信息的重要性。不同的级别会决定日志是否被记录下来。常见的日志级别（从低到高）如下：

| 级别  | 说明                               | 常见用途           |
| ----- | ---------------------------------- | ------------------ |
| trace | 最详细的追踪信息，记录程序运行轨迹 | 几乎不用           |
| debug | 调试信息，帮助开发者排查问题       | 方法参数、变量值   |
| info  | 程序运行的重要信息                 | 连接成功、关键流程 |
| warn  | 警告信息，可能会引发问题           | 配置缺失、性能风险 |
| error | 错误信息，程序出错时必须记录       | 异常、崩溃         |

- **错误必须打 `error`**，这是诊断问题的依据。
- **关键流程打 `info`**，便于观察系统状态。
- **细节调试用 `debug`**，上线后可以关闭。

日志文件如果什么都打印，会变得庞大且杂乱。通过设置日志级别，可以只保留有价值的信息。

例如在 `logback.xml` 中配置：

```xml
<root level="info">
    <appender-ref ref="CONSOLE"/>
    <appender-ref ref="FILE"/>
</root>
```

表示只记录 **info 及以上** 的日志，而 `debug`、`trace` 将被忽略。

Logback 还提供了两个特殊级别：

- `all` —— 打印所有日志
- `off` —— 关闭所有日志

因此，如果想临时关闭日志，只需要把配置改为：

```xml
<root level="off">
    <appender-ref ref="CONSOLE"/>
    <appender-ref ref="FILE"/>
</root>
```
