---
title: spring boot原理
date: 2025-11-03 10:35:21
description: 这是一篇新文章!
order: 0
publish: true
tags:
---

# 配置优先级

在 Spring Boot 里，配置可以放在不同位置、不同格式的文件里，也可以在运行时通过命令行或 JVM 参数覆盖。理解这套优先级，是为了**在开发、测试、打包、部署各个环境中都能灵活地控制配置**，不用每次都回到 IDE 改文件。

**支持的配置文件格式（从高到低的优先级）**

Spring Boot 会按顺序读取以下三种格式，如果出现相同的配置项，前者会覆盖后者：

1. **application.properties**
2. **application.yml**
3. **application.yaml**

虽然这三种格式都能用，但实际开发里一般都会统一使用 **YAML（application.yml）**。格式清晰，层次结构更好读，也更主流。

## 其他配置方式

除了文件，Spring Boot 还支持**运行时**覆盖配置，他们的优先级比之前的更高：

- **Java 系统属性（JVM 参数）**  
   以 `-D` 开头，例如：

```
  -Dserver.port=9000
```

- **命令行参数**  
   以 `--` 开头，例如：

```
  --server.port=10010
```

这类配置的优先级比配置文件更高——因为是“临时指定”，天然应该覆盖静态文件。

**为什么要了解这套优先级？**

很多时候，你根本不想也不需要去动配置文件。

比如项目已经打成 jar（例如 `wolfpack-1.0-SNAPSHOT.jar`），你把包发给同事，他只需要：

```
java -jar wolfpack-1.0-SNAPSHOT.jar
```

结果前端突然要换端口？  
你人在休息、在外面、根本不想开 IDE？

没必要动配置文件，可以让前端自己直接运行：

```
java -jar wolfpack-1.0-SNAPSHOT.jar -Dserver.port=9999
```

临时测试、跨局域网调试、小范围联调，这种方式是最灵活的。这一整套机制，就是为了让部署更自由，不依赖 IDE。

## 打包必须的插件

要让 Spring Boot 项目能正常通过 `java -jar` 启动，**必须引入**：

```
spring-boot-maven-plugin
```

如果打包后出现：

```
xxx.jar 中没有主清单属性（no main manifest attribute）
```

十有八九是因为 **POM 没加这个插件**，导致 jar 里没有 `Main-Class`，自然无法运行。

典型配置如下：

```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
        </plugin>
    </plugins>
</build>
```

只要引入这个插件，jar 才会带上 Spring Boot 的启动器结构，才能真正跑起来。

**在 IDEA 中设置 JVM 参数与应用参数**

IDEA 默认不会显示 JVM 参数和 Program Arguments，需要手动打开。

![](../../public/images/文章资源/spring-boot原理/file-20251031095537046.jpg)

步骤如下：

1. 打开 **Run / Debug Configurations**
2. 找到你的 Spring Boot 启动项
3. 点击右上角 **Modify options**
4. 勾选以下两项：

   - **Add VM options**
   - **Program arguments**

之后：

- JVM 参数写在 **VM options**（例如 `-Dserver.port=9000`）
- 命令行参数写在 **Program arguments**（例如 `--server.port=10010`）

五种常见的配置来源，最终的优先级顺序，从低到高（后者覆盖前者）

1. **application.yaml**
2. **application.yml**
3. **application.properties**
4. **JVM 参数（-Dxxx）**
5. **命令行参数（--xxx）**

越靠近程序“启动命令”的地方，优先级越高。文件最低，命令行最高。

# Bean 管理

在 Spring 体系里，“Bean”指的就是**被 Spring 容器托管的对象**。只要一个类被纳入 IoC 容器，它的创建、管理、销毁都由 Spring 来负责，而不是你自己 `new`。

最常见的方式，就是在类上加上 `@Component` 及其衍生注解，像 `@Controller`、`@Service`、`@Repository`。  
它们的本质都是 **把类交给容器管理**。

不过，Bean 的玩法不止这点。我们平常也会主动从容器里拿 Bean，甚至控制它的作用域。下面就一步步把这些东西讲清楚。

## 获取 Bean

Spring 在项目启动时，会提前把绝大部分 Bean 创建好，放进 IoC 容器。  
如果你需要在代码里主动获取其中的某个 Bean，可以先把容器对象注入进来：

```java
@Autowired
private ApplicationContext applicationContext;
```

`ApplicationContext` 就像“狼窝的地图”，手里有它，容器里的 Bean 想拿哪个都行。

#### 根据名称获取

```java
Object getBean(String name)
```

名称默认是类名首字母小写，例如 `userService`。

#### 根据类型获取

```java
<T> T getBean(Class<T> requiredType)
```

最常用、最安全，也最推荐。

#### 名称 + 类型

```java
<T> T getBean(String name, Class<T> requiredType)
```

一般只有名字相同、类型多实现时才需要。

你会发现，不管用哪种方式拿到的 Bean，拿出来的对象都是同一个地址——这也是因为 Spring 默认采用 **单例模式（singleton）**。

如果你想可视化查看容器中到底有哪些 Bean，可以在 IDEA 中启用 Actuator 面板（高版本需要安装依赖后刷新一下）。

## Bean 的作用域

Spring 默认把所有 Bean 都当成 **单例（singleton）**。也就是说：

> 项目启动时创建一次，整个应用共享这一份。

不过如果场景需要，也可以指定其它作用域。常见作用域如下：

#### singleton

- 容器中只有一份实例
- 启动时创建
- 整个应用共享
- 适用于绝大多数业务 Bean

#### prototype

- **每次获取都会 new 一个新的对象**
- 不在启动时初始化，只有使用时才创建
- 适合非常轻量、且每次都需要独立状态的 Bean

对应写法：

```java
@Scope("prototype")
@Component
public class WolfTask { ... }
```

### Web 环境中生效的作用域

- **request**：每个 HTTP 请求创建一个新实例
- **session**：每个会话创建一个新实例
- **application**：整个 Web 应用生命周期一份实例

这些一般在 Controller 层才可能用到，但实际开发中非常少见，了解即可。

# 延迟初始化

默认情况下，singleton Bean 会在 **项目启动时统一创建**。

如果项目启动慢，其中一部分原因就是 Spring 在初始化大量 Bean——但大多数时候它们根本不需要提前加载。

可以使用 `@Lazy` （Lazy Init）来控制：

```java
@Lazy
@Component
public class WolfService { ... }
```

效果就是：

> 不在启动时创建，只在第一次使用时才实例化。

但也正因为 Spring 启动足够快、业务 Bean 数量也不大，所以延迟加载在实际项目中使用得不多。

# 循环依赖

在 Spring 的 IoC 容器中，循环依赖指的是：**A 依赖 B，而 B 又依赖 A**，两个 Bean 互相引用，最终形成一个环。  
常见的循环结构例如：

```
ServiceA → ServiceB → ServiceA
```

在早期版本的 Spring Boot（2.5 及以前），Spring 会尝试“三级缓存”机制来帮你解决这种问题；  
但从 **Spring Boot 2.6+** 开始，官方默认 **禁止循环依赖**，并在启动时直接报错。

Spring Boot 会给出比较明确的提示，大致像这样：

```
Description:
The dependencies of some of the beans in the application context form a cycle...

Action:
Circular references are discouraged and have been prohibited by default.
Update your application to remove the dependency cycle.
As a last resort, you may set 'spring.main.allow-circular-references=true'
```

意思很直接：你的代码写出了循环依赖，默认不允许，你最好把结构重新设计。

循环依赖的出现往往意味着：

- 某个类承担了不应该承担的职责
- Service 之间逻辑耦合过重
- 业务分层不清晰
- 该抽离的公共组件没有抽离

重构方向可以从：

- 把共同逻辑抽成独立的工具类或 service
- 让其中一方只依赖接口，而不是依赖具体实现
- 优化业务流程，让依赖方向只保持“单向流动”

这些方式都能从根本上消除循环依赖，而不是靠配置“硬抗”。

常见的解决方式如下：

### 配置方式

如果项目实在动不了，可以在配置文件里临时允许循环依赖：

```yaml
spring.main.allow-circular-references=true
```

但这属于“强行打开安全锁”的方式，不建议长期依赖。官方明确强调：循环依赖本身说明你的代码设计有问题。

### 注解方式

`@Lazy` 的作用是延迟注入，使用 @Lazy 打破死锁，让 Spring 不在构造 Bean 时立即尝试注入依赖，从而避免两个 Bean 同时等待对方创建完成。

```java
@Service
public class ServiceA {

    @Lazy
    @Autowired
    private ServiceB serviceB;

    public void add() {
        serviceB.getById();
    }
}
```

只要在循环链路中的一端加上 `@Lazy`，就能让 Spring 先完成 Bean 的生命周期，再在后续调用中注入真正的对象。

它能解决问题，但原理其实就是：  
延迟其中一个 Bean 的依赖查找，避免创建阶段出现“你等我、我等你”的死局。

# 第三方 Bean 的管理

平时我们用 `@Component`、`@Service`、`@Controller` 就能把类交给 Spring 管理，但这些注解只对**你自己写的类**有效。

如果是外部框架提供的类、工具类，比如 Dom4j、FastJSON、HttpClient 等第三方库，它们不在你的源码包路径下，Spring 的组件扫描也扫描不到，自然不可能自动托管。

例如你想让 `SAXReader` 变成一个 Bean，但它是 Dom4j 提供的工具类，你没法去它的源码上加注解，这时候硬要 `@Autowired` 注入，肯定报红、报空指针。

想让一个“第三方类”被 Spring 托管，应该主动注册，而不是靠扫描。

Spring 提供了专门的方式：`@Configuration + @Bean`

### 配置类方式

```java
@Configuration
public class CommonConfig {

    @Bean
    public SAXReader saxReader() {
        return new SAXReader();
    }
}
```

这样 `saxReader()` 返回的对象就会被加入到 Spring 容器中，你在任何地方都可以，推荐：

```java
@Autowired
private SAXReader saxReader;
```

它就能正常注入，而不会报空指针。

## 启动类中写 @Bean

虽然也可以这么写，但不推荐：

```java
@SpringBootApplication
public class App {
    @Bean
    public SAXReader saxReader() {
        return new SAXReader();
    }
}
```

这种方式不够清晰，也容易让启动类变得越来越臃肿。  
实际开发中，更推荐将第三方 Bean 都放在专门的配置类中，分类管理。

## @Bean 的命名规则

Bean 的名称默认就是 **方法名**，例如：

```java
@Bean
public SAXReader saxReader() { ... }
```

最终 Bean 名字就是 `"saxReader"`。

当然你也可以手动指定：

```java
@Bean(name = "xmlReader")
public SAXReader saxReader() { ... }
```

这样注入时就可以：

```java
@Autowired
@Qualifier("xmlReader")
private SAXReader reader;
```

**如果第三方 Bean 需要其它 Bean 依赖？**

Spring 会自动帮你注入，它的方式非常自然：

```java
@Bean
public WolfParser wolfParser(SAXReader saxReader) {
    return new WolfParser(saxReader);
}
```

只要方法参数上写 Bean 的类型，Spring 就会从容器里找到对应的 Bean 并注入进去。

不用你 `new`，不用你传参，也不用你写任何额外代码。这也是 Spring 配置方式比“手动创建工具类”更优雅的地方。

# 自动装配的源码主线

理解自动装配的原理，最好的方式就是沿着源码主线“顺藤摸瓜”——从入口注解开始，一直追踪到自动配置类的加载点。Spring Boot 功能再多，最终都要回到这一条主线。

## `@SpringBootApplication`

是自动装配的入口，所有 Spring Boot 项目都会在启动类上加这个注解：

```java
@SpringBootApplication
public class SpringbootWebConfigApplication {
    public static void main(String[] args) {
        SpringApplication.run(SpringbootWebConfigApplication.class, args);
    }
}
```

点进去会发现它其实是一个**复合注解**，内部包含三个关键注解：

1. `@SpringBootConfiguration`：本质上等价于 `@Configuration`，说明当前类是一个配置类，可以声明 Bean。
2. `@ComponentScan`：负责扫描当前包及其子包，把标注了 `@Component`、`@Service`、`@Controller` 等注解的类自动注册成 Bean。
3. `@EnableAutoConfiguration`（最关键）：Spring Boot 自动装配机制的真正入口。

理解自动装配，就是理解这个注解。

## `@EnableAutoConfiguration`

他是真正触发自动装配的注解，点进 `@EnableAutoConfiguration` 会看到两个关键东西：

1. `@AutoConfigurationPackage` ：用于导入“自动配置包”的基础路径。
2. `@Import(AutoConfigurationImportSelector.class)`：这才是整个自动装配体系的“核心引擎”。

这里的 AutoConfigurationImportSelector 会负责：

- 读取自动配置类清单
- 挑选满足条件的配置类
- 将它们注册到 IoC 容器

当 Spring Boot 启动时，它会执行 AutoConfigurationImportSelector 的逻辑。

它会去读取一个非常重要的配置文件：

`META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`

里面列出了所有可能的自动配置类，例如：

```
org.springframework.boot.autoconfigure.web.servlet.WebMvcAutoConfiguration
org.springframework.boot.autoconfigure.jackson.JacksonAutoConfiguration
org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration
...
```

在 Spring Boot 2.7+ 和 Spring Boot 3 中，这个文件取代了老版本的 `spring.factories`。

换句话说：

> **这些配置类就是 Spring Boot 帮你“自动完成”的所有配置。**

你会在清单里看到上百个配置类，但 Spring Boot 不会把它们全部加载进容器。真正决定哪些自动配置类加载的关键在于：

**各种条件注解（@Conditional 系列）**

常见的有：

- `@ConditionalOnClass`：类路径里有某个类时生效
- `@ConditionalOnMissingBean`：容器里没有这个 Bean 时才生效
- `@ConditionalOnProperty`：配置文件中有特定属性时生效
- `@ConditionalOnWebApplication`：当前是 Web 环境才生效
- …

也就是说：

> Spring Boot 会“按需装配”。  
> 满足条件 → 自动装配类生效  
> 不满足条件 → 自动装配类跳过

例如，你没有引入 Spring Web，那 WebMvcAutoConfiguration 就不会生效。

## 通过源码追主线（阅读技巧）

第一次看源码时，最大的难点不是“看不懂”，而是“找不到入口”。  
其实主线非常明确：

1. 找入口

从 `@SpringBootApplication` 进去，如下所示：

```
@SpringBootApplication
 ├── @SpringBootConfiguration
 ├── @ComponentScan
 └── @EnableAutoConfiguration   ← 自动装配关键入口
```

2. 找触发点

`@EnableAutoConfiguration` → `@Import(AutoConfigurationImportSelector.class)`

3. 找自动配置列表

AutoConfiguration.imports （或旧版 spring.factories）

4. 找配置是否生效

看自动配置类内部的 `@ConditionalOnXxx` 注解

只要沿着这 4 步走，Spring Boot 的自动装配机制就能完全看清楚。

# Spring Boot 快速启动的原理

Spring Framework 是一套强大但“重配置”的框架，稍微搭个 Web 项目就要写 XML、引好多依赖，还得做 Bean 配置。  
Spring Boot 的出现，就是为了让这些步骤尽可能自动化，做到真正的“开箱即用”。

它之所以能做到这种“极速启动体验”，核心来自两个机制：

- **起步依赖（Starter）**
- **自动装配（Auto Configuration）**

这两者加起来，就构成了 Spring Boot 的“快”。

## 起步依赖（Starter）

在传统的 Spring 项目里，你想用 Web 功能，需要引入：

- Spring Web
- Servlet API
- Jackson
- Logging
- Validation  
   …等等一堆依赖。

手写的话体验就像在做“配方表”，遗漏一个都要排查半天。

Spring Boot 的做法则是：

> **给你一个 starter，让它替你打包好所有必需依赖。**

例如：

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```

你只引入这一条，它就会通过 Maven 的“依赖传递”机制，把底层所有必备库都带上。

这就是 starter 的核心价值：  
**让开发者专注业务，而不是纠结依赖版本和组合。**

所以，当你引入一个 starter、项目瞬间能跑起来时，是它帮你把那一堆原本需要自己填的依赖清单全都准备好了。

## 自动装配（Auto Configuration）

如果说「起步依赖」解决的是“需要哪些依赖？”，那么「自动装配」解决的是：

**“这些依赖要怎么正确配置？”**

传统 Spring 的方式是：

- 自己定义 Bean
- 自己写 XML 或 Java 配置类
- 自己处理各种组件之间的配置关系

而 Spring Boot 的理念是：

> **你只要引 starter，我就自动帮你创建好常用组件。**

启动时，Spring Boot 会扫描一系列“自动配置类”，这些类里包含了大量 `@Bean` 方法——比如 MVC、Jackson、DataSource、Redis 连接池等。

也就是说：

- 你引入了 Web Starter？  
   → 自动帮你配好 `DispatcherServlet`、JSON 序列化等。
- 你引入了 DataSource Starter？  
   → 自动帮你创建数据源、事务管理器。
- 你不用写一行配置，项目就能正常启动，这就是它的底层能力。

自动装配真正让 Spring Boot 从“一个框架”变成“一个开箱即用的工程模板”。

# 条件注解

自动装配之所以不会把所有配置类“一股脑塞进容器”，靠的就是 **@Conditional 系列注解**。  
它们的整体作用可以概括成一句话：

> **只有满足条件时，相关 Bean / 配置类 才会被注册到 Spring 容器中。**  
> 不满足条件 → 自动跳过。

这套机制让 Spring Boot 能够做到“按需加载”，避免无意义的 Bean 初始化，也避免不必要的依赖冲突，是决定自动装配是否生效的关键。

## 条件注解的基本机制

所有条件注解的祖先都是 `@Conditional`。它允许开发者在“类级别”或“方法级别”设置判断条件：

- **标在类上**：整个配置类是否生效
- **标在方法上**：某个具体 Bean 是否生效

几乎所有自动配置类都依赖这套注解体系。

## 常用的条件注解

Spring Boot 内置了大量 `@ConditionalOnXxx` 注解，常见且最重要的如下：

### `@ConditionalOnClass`

**条件：classpath 中存在指定的类**  
常用于判断某个功能是否可用。

例如：

```java
@Bean
@ConditionalOnClass(name = "io.jsonwebtoken.Jwts")
public HeaderParser headerParser() {
    return new HeaderParser();
}
```

如果项目没引入 `jjwt` 这个库，那么这个 Bean 根本不会注册。

这也是为什么：

- 引入 Web 场景才会自动装配 MVC
- 引入 Jackson 才会自动配置 JSON 转换器

因为这些功能都有对应的 Class 条件。

### `@ConditionalOnMissingBean`

**条件：容器中不存在某个 Bean**

例如：

```java
@Bean
@ConditionalOnMissingBean
public HeaderParser headerParser() {
    return new HeaderParser();
}
```

如果你自己已经声明了一个 HeaderParser，那么自动装配会尊重你的写法，不会覆盖。

> 这使得 Spring Boot 自动配置具备“可覆盖、可重写”的能力。

### `@ConditionalOnProperty`

**条件：配置文件中存在指定属性，并且值匹配**

示例：

```java
@Bean
@ConditionalOnProperty(name = "wolf.enabled", havingValue = "true")
public WolfService wolfService() {
    return new WolfService();
}
```

当 `application.yml` 中写了：

```yaml
wolf:
  enabled: true
```

自动配置才会生效。

如果没有写，或者值不匹配，Spring Boot 会自动跳过。

这让自动配置具备了“开关能力”。

### 其它常见的条件注解

- `@ConditionalOnBean`  
   某个 Bean 存在时才生效
- `@ConditionalOnMissingClass`  
   classpath 中不存在某类
- `@ConditionalOnWebApplication`  
   当前是 Web 环境时才生效
- `@ConditionalOnExpression`  
   SpEL 表达式成立时才生效

它们的逻辑都一样：  
**根据环境判断是否加载特定配置。**

## 条件注解的核心思想

这部分是理解自动装配的关键逻辑，可以直接记住三点：

1. **满足条件 → 加载 Bean / 配置类**
2. **不满足条件 → 直接跳过，不报错**
3. **通过自动配置 + 条件判断，让功能按需启用**

例如：

- 项目 classpath 中存在 Jackson → 自动配置 JSON
- 项目没有引入 Redis → Redis 自动配置类不会生效
- 你自己写了一个 DataSource → Spring Boot 就不会再给你配第二个
- 配置文件里没写某个属性 → 自动配置对应功能不会打开

换句话说：

> **Spring Boot 的“智能”和“自动”，九成来自这些条件注解。**
