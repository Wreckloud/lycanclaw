---
title: AOP 面向切面编程
date: 2025-10-28 20:06:03
description: 这是一篇新文章!
order: 0
publish: true
tags:
---

**AOP**（Aspect Oriented Programming，面向切面编程）是一种在不改变原有业务代码的前提下，为特定方法统一织入“附加功能”的编程思想。

AOP 就是为了:

- 减少冗余代码
- 无侵入增强功能
- 提高开发效率
- 统一维护、方便扩展

它的本质，就是**把分散在各处的重复逻辑抽取出来，集中书写，然后在程序运行时自动“切入”到目标方法中执行**。  
常见的应用场景有：日志记录、性能统计、权限校验、异常处理等。

**场景示例：统计接口耗时**

假设我们有一个业务类 `EmpServiceImpl`，里面有多个方法。为了统计执行耗时，我们不得不在每个方法前后都写一段计时代码：

```java
public List<Dept> list() {
    long beginTime = System.currentTimeMillis();
    List<Dept> deptList = deptMapper.list();
    long endTime = System.currentTimeMillis();
    log.info("执行耗时：{}ms", endTime - beginTime);
    return deptList;
}

public void delete(Integer id) {
    long beginTime = System.currentTimeMillis();
    deptMapper.delete(id);
    long endTime = System.currentTimeMillis();
    log.info("执行耗时：{}ms", endTime - beginTime);
}

public Dept getById(Integer id) {
    long beginTime = System.currentTimeMillis();
    Dept dept = deptMapper.getById(id);
    long endTime = System.currentTimeMillis();
    log.info("执行耗时：{}ms", endTime - beginTime);
    return dept;
}
```

这里不必纠结代码细节，重点是：**重复的逻辑出现在每个业务方法中**。

**用 AOP 统一处理**

AOP 允许我们把这段统计耗时的逻辑抽到一个“切面类”里，集中处理：

```java
@Slf4j
@Aspect
@Component
public class RecordTimeAspect {

    @Around("execution(* com.wreckloud.service.impl.EmpServiceImpl.*(..))")
    public Object recordTime(ProceedingJoinPoint pjp) throws Throwable {
        long beginTime = System.currentTimeMillis();
        Object result = pjp.proceed();  // 执行原方法
        long endTime = System.currentTimeMillis();
        log.info("执行耗时：{}ms", endTime - beginTime);
        return result;
    }
}
```

这样一来，所有匹配的方法（如 `list`、`delete`、`getById`）都会自动执行耗时统计逻辑，无需在每个方法里重复编写相同的代码。

# AOP 快速入门

在刚刚的耗时统计案例中，如果要真正让 AOP 跑起来，其实只要走三步：**引依赖 → 写切面 → 加注解**。  
这部分的重点是看清楚“流程”，不必在意代码细节。

## 1. 引入依赖

首先，在 `pom.xml` 中加入 AOP 相关依赖，让 Spring Boot 支持 AOP 功能：

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-aop</artifactId>
</dependency>
```

## 2. 编写切面类

AOP 的核心，就是把“公共逻辑”抽离出来集中处理。  
在这里，我们把“统计接口耗时”这件事，单独放在一个切面类中统一实现，而不再分散写在每个业务方法里。

这一步其实就干三件事：**写一个类 → 标记它是切面 → 把要做的事写进去**。

```java
@Slf4j
@Aspect
@Component
public class RecordTimeAspect {

    @Around("execution(* com.wreckloud.service.impl.DeptServiceImpl.*(..))")
    public Object recordTime(ProceedingJoinPoint pjp) throws Throwable {
        long beginTime = System.currentTimeMillis();
        
        Object result = pjp.proceed();  // 调用原始方法
        
        long endTime = System.currentTimeMillis();
        log.info("执行耗时：{}ms", endTime - beginTime);
        return result;
    }
}
```

标记上一些注解让切面生效：

- `@Aspect`：声明这个类是“切面”，让 AOP 能识别它。
- `@Around(...)`：指定哪些方法需要被这个切面增强

# 核心概念

AOP 并不是凭空织逻辑的，它依赖一整套“术语”来描述切面是怎么嵌进业务方法的。  
记清这几个词，就能看懂 AOP 的整个流程。

## 连接点（JoinPoint）

连接点就是 **AOP 能够介入的那些位置**。  
在 Spring AOP 中，它指的基本就是「方法的执行过程」，并且隐含了方法名、参数、目标类等上下文信息。

```java
// AOP 能接入的方法（例如 list()）
public List<Dept> list() {
    return deptMapper.list();
}
```

## 切入点（Pointcut）

连接点虽然很多，但我们不可能都去增强，所以要通过“切入点”筛选出目标方法。  
切入点通过表达式来定义，比如我们前面用的：

```java
@Around("execution(* com.wreckloud.service.impl.DeptServiceImpl.*(..))")
```

这句表达式就代表——**DeptServiceImpl 中所有方法**都将被这个切面增强。

## 通知（Advice）

“通知”就是要执行的那段**公共逻辑**。比如统计耗时：

```java
@Around("execution(...)")
public Object recordTime(ProceedingJoinPoint pjp) throws Throwable {
    long start = System.currentTimeMillis();
    Object result = pjp.proceed();
    long end = System.currentTimeMillis();
    log.info("耗时：{}ms", end - start);
    return result;
}
```

通知可以定义在方法前、方法后，或者包裹整个过程（环绕）。

## 切面（Aspect）

切面就是 **“通知 + 切入点” 的组合**，相当于一个独立的“增强规则模块”。

```java
@Slf4j
@Aspect
@Component
public class RecordTimeAspect {
    // 通知 + 切入点
}
```

一个切面类可以写多段通知，也可以复用不同的切入点表达式。

## 目标对象（Target）与代理对象（Proxy）

- **Target**：被增强的业务对象，比如 `DeptServiceImpl`。
- **Proxy**：Spring AOP 生成的代理对象，对外暴露的就是它。  
   调用方法时，实际是先进入代理，再由代理决定是否织入通知。

# 通知

通知，是 AOP 真正执行的“增强逻辑”。  
当目标方法被调用时，AOP 会根据设定的通知类型，决定**在什么时机**把这些逻辑织入进去，比如方法前、方法后，或者前后都包一层。

## 通知类型

Spring AOP 按执行时机区分，有五种常见通知。  
**`@Around` 是最灵活的一种**，其余四种则各自对应不同的触发时机。

| 注解              | 触发时机                   | 特点                                             |
| ----------------- | -------------------------- | ------------------------------------------------ |
| `@Around`         | 方法前后                   | 能完全控制方法执行，**必须手动调用 `proceed()`** |
| `@Before`         | 方法执行前                 | 常用于前置处理，如日志、鉴权                     |
| `@After`          | 方法执行后（无论是否异常） | 类似 finally 块                                  |
| `@AfterReturning` | 方法正常返回后             | 有异常就不会触发                                 |
| `@AfterThrowing`  | 方法抛出异常时             | 专门处理异常场景                                 |

```java
@Around("execution(* com.wreckloud.service.impl.DeptServiceImpl.*(..))")
public Object recordTime(ProceedingJoinPoint pjp) throws Throwable {
    long start = System.currentTimeMillis();
    Object result = pjp.proceed(); // 继续执行原方法
    long end = System.currentTimeMillis();
    log.info("耗时：{}ms", end - start);
    return result;
}
```

环绕通知掌控力最强，不仅能在前后织逻辑，还能决定目标方法是否放行。其他四种通知则无需手动调用 `proceed()`，Spring 会自动完成调用过程。

## 通知执行顺序

当多个切面都命中同一个方法时，AOP 有一套默认的执行顺序。

不同切面类中，**类名字母顺序靠前的通知**会先执行（方法前），而方法执行完成后则会**反过来**——靠前的最后执行。就像一层层“套进去”，再一层层“倒出来”。

如果想手动控制顺序，可以用 `@Order` 注解指定优先级：

```java
@Order(1) // 数字越小优先级越高
@Aspect
@Component
public class FirstAspect { ... }
```

数字小的切面会最先进入，也会最后收尾。  
这在日志、权限、事务等多切面并存时非常有用。

明白了，主子。  
咱们这部分既不能像上次那样太“教科书式”——一条条列太干；  
也不能像刚才那样整成大段文字——一眼望过去全是字，劝退。

# 切入点表达式

切入点表达式的作用，其实就一句话：**决定哪些方法要被 AOP 增强**。  
它不负责逻辑，只负责“挑方法”。

## execution 匹配

最常用的一种写法是 `execution`，它根据方法签名来判断是否匹配。  
格式是这样的：

```
execution(访问修饰符? 返回值 包名.类名.? 方法名(参数) throws异常?)
```

`?部分` 都是可省略的。  
比如这一句，就能让 AOP 拦下 `DeptServiceImpl` 的所有方法：

```java
@Around("execution(* com.wreckloud.service.impl.DeptServiceImpl.*(..))")
public Object recordTime(ProceedingJoinPoint pjp) throws Throwable {
    long start = System.currentTimeMillis();
    Object result = pjp.proceed();
    long end = System.currentTimeMillis();
    log.info("耗时：{}ms", end - start);
    return result;
}
```

- `*` 可以通配任意返回值、方法名或包名的一部分
- `..` 可以通配多级包路径和任意参数

多个表达式可以用 `&&`、`||`、`!` 组合，比如：

```java
@Pointcut("execution(* com.wreckloud..DeptServiceImpl.list(..)) || execution(* com.wreckloud..DeptServiceImpl.getById(..))")
public void pt() {}
```

匹配范围越精准，后期维护就越省力。

## annotation 匹配

如果方法分散不规律，还一堆名字不好匹配的，那 `@annotation` 就比 `execution` 更干净。  
这种方式直接**根据注解**来匹配目标方法。

比如先定义一个注解：

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface Log {}
```

方法上标注它：

```java
@Log
public void doSomething() { ... }
```

然后写切入点：

```java
@Pointcut("@annotation(com.wreckloud.anno.Log)")
public void logPointcut() {}

@Before("logPointcut()")
public void before() {
    log.info("before");
}
```

只要打了这个标记，就会织入逻辑；没打的，一律不动。

## 抽取切入点

如果在一个切面类里写多个通知，不必每次都重复 `execution` 或 `@annotation`。  
可以用 `@Pointcut` 抽出来，**逻辑和范围分开**，干净又好维护：

```java
@Pointcut("execution(* com.wreckloud.service.impl.DeptServiceImpl.*(..))")
public void pt() {}

@Around("pt()")
public Object recordTime(ProceedingJoinPoint joinPoint) throws Throwable {
    long start = System.currentTimeMillis();
    Object result = joinPoint.proceed();
    long end = System.currentTimeMillis();
    log.info("耗时：{}ms", end - start);
    return result;
}
```

后面再加其他通知，只要直接引用 `pt()` 就行了。

# 连接点

AOP 不只是能“切进去”，它还能**拿到被切方法的上下文信息**。  
这些信息都封装在 `JoinPoint` 里，比如目标类名、方法名、参数……只要你想查，一般都能查到。

Spring 中提供了两个相关对象：

- 在 `@Around` 通知中，用 `ProceedingJoinPoint`（它能放行原始方法）。
- 在其他四种通知中，用 `JoinPoint`（`ProceedingJoinPoint` 是它的子类）。

这两个对象本质一样，区别只在能不能 `proceed()`。

## 获取目标信息

以下代码展示了常用的四个信息获取方式：

```java
@Before("pt()")
public void before(JoinPoint joinPoint) {

    // 1. 目标类名
    String className = joinPoint.getTarget().getClass().getName();
    log.info("className = {}", className);

    // 2. 方法签名
    Signature signature = joinPoint.getSignature();

    // 3. 方法名
    String methodName = signature.getName();
    log.info("methodName = {}", methodName);

    // 4. 方法参数
    Object[] args = joinPoint.getArgs();
    log.info("args = {}", Arrays.toString(args));
}
```

这些信息在做日志记录、权限校验、接口监控时非常有用。  
比如你完全可以在切面里打出调用来源、方法名、入参等内容，形成统一的审计日志。

## 获取返回值与异常

如果你使用的是环绕通知，还能在执行目标方法后，直接拿到返回值或处理异常：

```java
@Around("pt()")
public Object around(ProceedingJoinPoint joinPoint) throws Throwable {
    Object result = null;
    try {
        result = joinPoint.proceed(); // 执行目标方法
        log.info("result = {}", result);
    } catch (Throwable ex) {
        log.error("出现异常", ex);
        throw ex;
    }
    return result;
}
```

在这里，`proceed()` 既是执行点，也是拿返回值的入口。

`JoinPoint` 本身不复杂，但它是 AOP 的关键接口之一。  
**“连接点”就像你伸进去抓信息的那只爪子**，能抓到类、方法、参数，也能顺便接住异常。  
知道这点之后，写日志、做监控、做权限判断，全都变得顺手很多。
