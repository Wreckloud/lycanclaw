---
title: 'Spring'
date: '2025-10-10 08:49:23'
description: '这是一篇新文章!'
order: 0
publish: true
tags: 
---

# 谈谈你对 Spring 的理解

Spring 本质上是一个 **轻量级、开源的 Java 企业级开发框架**，它的核心目标就是：**降低耦合、提升开发效率**。

**核心思想：IOC + AOP**

- IOC（控制反转）：对象的创建和依赖管理不再由开发者手动完成，而是交给 Spring 容器。
- AOP（面向切面）：把与业务无关的功能（如日志、事务、安全等）抽离出来，提升代码复用性和可维护性。

**广义理解：一整个生态**

Spring 不只是 `spring-framework`，它还有一整套生态：

- `Spring Framework`（IOC、AOP、MVC、Test…）
- `Spring Boot`（快速开发脚手架）
- `Spring Cloud`（微服务架构）
- `Spring Data`（数据访问）
- `Spring Security`（安全认证）
- `Spring Session`、`Spring Integration`、`Spring Cache` 等

Spring 是一个通过 IOC 和 AOP 解耦复杂系统、加速企业级开发的生态化框架。它不仅是“框架”，更像一个 **容器 + 工具箱**，帮你从底层对象管理一路撑起整个项目的骨架。

# 你用过 Spring 的哪些？Spring 框架有哪些好处？

Spring 生态非常庞大，使用时一般会接触多个模块，不同模块侧重点不同，但核心始终围绕着 **简化开发、降低耦合、提高可维护性** 展开。常用模块与功能包括：

- `Spring Framework`：IOC（依赖注入）、AOP（切面）、声明式事务、`Spring MVC`。
- `Spring Boot`：简化配置、自动装配、快速启动。
- `Spring Data`：统一的数据访问方式，常用如 `Spring Data JPA`。
- `Spring Cloud`：微服务体系下的注册、发现、负载均衡、网关等。
- 其他：`Spring Security`（安全认证）、`Spring Session`（会话管理）、`Spring Cache`（缓存）、`Spring AMQP`（消息队列整合）等。

Spring 把开发中“重复、繁琐、耦合”的部分接管掉，让开发者更专注于业务本身。它不只是一个框架，更是一整套标准化的企业开发生态

# 说一下 Spring 的 IOC 和 DI

在传统开发中，我们会手动 `new` 各种对象，再自己把依赖关系一层层“拼”起来，这种方式耦合度高、维护困难。Spring 的 IOC 和 DI，正是为了解决这个问题而生的核心机制。

IOC（Inversion of Control，控制反转）是一种**设计思想**，DI（Dependency Injection，依赖注入）是它的**具体实现方式**。

---

IOC 的核心在于“反转”对象的控制权。  
本来由我们来主动创建对象、组装依赖，现在改为交给 Spring 容器来统一管理。我们只负责定义“我需要什么”，而不是“怎么造它”。Spring 会在容器中负责对象的创建、生命周期管理和依赖关系维护。

DI 则是在对象创建的同时，**自动把它所依赖的对象注入进去**。常见的注入方式包括构造器注入、setter 注入和注解注入。比如 Controller 依赖 Service，我们不再手动 `new` Service，只需在类上标注依赖，Spring 就会自动完成装配。

这种机制带来几个直接的优势：

- **降低耦合**：对象之间不再强绑定，方便替换与重构。
- **统一管理**：生命周期和依赖关系交给容器，避免散乱在代码中。
- **便于扩展与测试**：替换实现类、编写单元测试更加灵活。

IOC 把对象的控制权交给容器，DI 让依赖自动注入，两者配合让系统更轻、更灵活，也让开发者专注于业务逻辑而非繁琐的对象管理。

# BeanFactory 和 ApplicationContext 有什么区别？

在 Spring 里，`BeanFactory` 和 `ApplicationContext` 都是 IOC 容器的核心接口，但它们并不完全一样。可以简单理解为：

- `BeanFactory` 是 Spring 容器的**基础实现**
- `ApplicationContext` 是它的**增强和扩展版本**

`BeanFactory` 负责 Spring IOC 的最基本能力：  
它能读取配置文件、创建和管理 Bean，是整个 IOC 机制的底层接口。换句话说，如果你只需要最纯粹的依赖注入功能，它就够用了。但它比较“原始”，功能也比较少，比如一些高级特性（国际化、事件机制）它并不支持。

`ApplicationContext` 是在 `BeanFactory` 之上扩展出来的更完整的容器实现，除了具备 `BeanFactory` 的所有功能，还内置了许多企业级项目中常用的特性，例如：

- 国际化支持（MessageSource）
- 事件发布机制（ApplicationEvent）
- 资源访问接口（统一加载配置文件、外部资源）
- 自动注册 BeanPostProcessor（无需手动注册）
- 支持 AOP、注解扫描等高级特性

简单来说，`BeanFactory` 更轻量，适合资源极其有限或特殊场景；而 `ApplicationContext` 是我们日常开发中几乎唯一使用的容器，开箱即用，功能齐全。

# Spring 中 Scope 属性（Bean 作用范围）

在 Spring 中，`Scope` 用来定义 **Bean 在容器中的生命周期和可见范围**。换句话说，同一个 Bean 被创建几次、在什么场景下共享，都是由 Scope 决定的。

默认情况下，Spring 创建的 Bean 是单例的，但在不同业务场景下，我们可以通过 `@Scope` 注解或 XML 配置，灵活调整作用范围。

常见的 Scope 类型如下：

- **`singleton`（默认）**  
   Spring 容器中只存在该 Bean 的一个实例。无论获取多少次，拿到的都是同一个对象。  
   适用于大多数业务组件，如 Service、Dao、工具类等。
- **`prototype`**  
   每次获取 Bean 时，Spring 都会重新创建一个新的实例。  
   适用于状态不共享、需要频繁变化的对象，比如某些自定义任务实例。
- **`request`**（Web 环境）  
   在一次 HTTP 请求的生命周期内，Bean 是唯一的；但不同请求会创建新的 Bean。  
   适合与请求上下文相关的对象。
- **`session`**（Web 环境）  
   在同一个 Session 中共享同一个 Bean，不同 Session 各自持有自己的 Bean。  
   适用于用户会话级别的数据。
- **`application`**（Web 环境）  
   整个 Web 应用共享一个 Bean，生命周期与 ServletContext 一致。
- **`websocket`**（WebSocket 环境）  
   每个 WebSocket 会话创建一个 Bean，适用于实时通信场景。

需要注意的是：

- `singleton` 是最常用的，也是 Spring 的默认 Scope。
- `prototype` Bean 不会被容器完整管理（如销毁回调需要开发者自行处理）。
- 其他作用域多用于 Web 环境中，需要有对应上下文支持。

Scope 决定了 Bean 在容器中的“活多久、被共享几次”。大多数情况下使用 `singleton` 即可，而其他 Scope 则在特定场景下发挥作用，让 Bean 的生命周期更贴合业务逻辑。

# Spring 创建对象的方式有哪些

在 Spring 中，Bean 的创建不仅仅局限于“new 一个对象”这么简单。Spring 容器为我们提供了多种灵活的实例化方式，以便应对不同的业务和技术场景。

这些方式本质上都是由 Spring 容器接管对象的创建过程，开发者只需声明 **“怎么造”**，不必手动管理生命周期。

### 1. 构造器实例化（最常用）

这是最常见也是最直接的一种方式。Spring 通过调用类的构造方法来创建对象。  
如果类只有一个无参构造器，Spring 会自动推断；也可以通过配置选择有参构造器。

```java
@Component
public class Wolf {
    public Wolf() {
        System.out.println("Wolf 被构造了！");
    }
}
```

这种方式简单、清晰，适合大多数 Bean。

### 2. 静态工厂方法实例化

当无法直接通过构造器创建对象时（比如第三方类没有公开构造器），可以通过静态工厂方法交给 Spring 来调用。

```java
public class WolfFactory {
    public static Wolf createWolf() {
        return new Wolf();
    }
}
```

```xml
<bean id="wolf" class="com.wreckloud.WolfFactory" factory-method="createWolf"/>
```

这种方式适合需要通过工具类或第三方工厂方法创建对象的情况。

### 3. 实例工厂方法实例化

与静态工厂类似，但调用的是工厂对象的实例方法，而不是静态方法。

```java
public class WolfFactory {
    public Wolf buildWolf() {
        return new Wolf();
    }
}
```

```xml
<bean id="wolfFactory" class="com.wreckloud.WolfFactory"/>
<bean id="wolf" factory-bean="wolfFactory" factory-method="buildWolf"/>
```

这种方式适合当 Bean 的创建需要依赖某个已经存在的工厂对象时使用。

### 4. 实现 `FactoryBean` 接口

如果创建过程本身较复杂，比如需要动态代理或集成第三方对象，可以实现 `FactoryBean` 接口，把 Bean 的生成逻辑写在 `getObject()` 中。

```java
public class WolfProxyFactory implements FactoryBean<Wolf> {
    @Override
    public Wolf getObject() {
        // 可以在这里做增强或代理
        return new Wolf();
    }
    @Override
    public Class<?> getObjectType() {
        return Wolf.class;
    }
}
```

这种方式常用于整合第三方组件、AOP 代理、动态对象创建等高级场景。

Spring 提供了多种创建对象的方式，从最简单的构造器，到灵活的工厂方法，再到可扩展的 `FactoryBean`，满足从普通 Bean 到复杂组件的各种需求。

# Spring Bean 是线程安全的吗？

默认情况下，Spring 管理的 Bean 是 **`singleton` 单例** 的，也就是说整个应用容器中只有一个实例，多个线程会共享这个对象。

这意味着：**Spring 本身并不会保证线程安全**，是否安全，取决于这个 Bean 自己的实现。

单例 Bean 在高并发场景下，最大的隐患就是“共享状态”带来的线程安全问题。  
比如：

```java
@Component
public class WolfPack {
    private int count = 0;

    public void addWolf() {
        count++;
    }

    public int getCount() {
        return count;
    }
}
```

如果多个线程同时调用 `addWolf()`，`count` 变量就可能出现竞态条件，导致结果不一致。  
这是因为这个 `WolfPack` 实例在整个容器中只有一个，所有线程都在操作同一个字段。

所以对于单例 Bean：

- 如果 Bean 是 **无状态** 的（不依赖成员变量），例如纯工具类或 Service 层只调用数据库，那么它是线程安全的。
- 如果 Bean 是 **有状态** 的（包含可变字段），就可能出现并发问题，需要开发者自己确保线程安全，比如：
  - 不共享可变状态
  - 使用局部变量代替成员变量
  - 加锁或使用线程安全的数据结构

另外，如果确实不希望 Bean 在多个线程间共享，还可以将 Scope 改为 `prototype`，让每次获取都生成一个新对象。但这也会带来额外的资源消耗，需要根据业务场景权衡。

Spring 不会自动保证 Bean 的线程安全。单例 Bean 是共享的，无状态可以安全使用，有状态则需自行保证同步或避免共享状态。

# BeanFactory 和 FactoryBean 的区别

虽然名字很像，但 `BeanFactory` 和 `FactoryBean` 在 Spring 体系中扮演的角色完全不同。  
一个是 **容器的核心接口**，负责“管理 Bean”；另一个则是 **一个特殊的 Bean**，负责“生产 Bean”。

`BeanFactory` 是整个 Spring IOC 容器的**顶层接口**，它定义了 Bean 的基本管理方式。  
它的职责非常明确：

- 读取配置
- 维护 Bean 的定义与生命周期
- 按需创建和返回 Bean 实例

换句话说，`BeanFactory` 是**Spring 自己的工厂**，你问它要一个 Bean，它就根据配置去造一个给你。

`FactoryBean` 则是一种**特殊的 Bean**。  
它本身不是你真正想要的业务对象，而是一个“工厂类”。  
当你向容器要这个 Bean 时，Spring 实际返回的是 `FactoryBean` 的 `getObject()` 方法中创建的对象。

它的作用主要在于应对一些 Bean 创建过程非常复杂的情况，比如：

- 动态代理对象
- 整合第三方组件
- 自定义 Bean 生成逻辑

通过 `FactoryBean`，你可以把复杂的创建逻辑封装起来，对外表现得就像一个普通 Bean。

| 项目     | BeanFactory                          | FactoryBean                                    |
| -------- | ------------------------------------ | ---------------------------------------------- |
| 类型     | Spring 容器顶层接口                  | 特殊类型的 Bean                                |
| 作用     | 管理和创建所有 Bean                  | 自定义复杂 Bean 的创建逻辑                     |
| 返回对象 | 直接返回 Bean 实例                   | 返回 `getObject()` 生成的对象                  |
| 应用场景 | IOC 核心，几乎所有 Bean 都通过它管理 | 第三方集成、动态代理、定制实例化过程等高级场景 |

`BeanFactory` 是 Spring 自己的“总工厂”，负责管理所有 Bean；而 `FactoryBean` 是你写给 Spring 用的“小工厂”，用来自定义某个 Bean 的生产过程。

# 说一下 @Resource 和 @Autowired 的区别

在 Spring 中，`@Resource` 和 `@Autowired` 都可以完成依赖注入，看起来功能相似，但它们的来源和注入逻辑并不一样。理解这两者的区别，有助于在实际项目中选择合适的注解，避免注入冲突。

首先，从来源上就有差别：

- `@Resource` 来自 **JDK 标准**（JSR-250），不依赖 Spring，本身属于 Java EE 规范。
- `@Autowired` 是 **Spring 提供的注解**，只有在 Spring 环境下才有效。

其次，在注入规则上，它们的行为也不同：

- `@Autowired` 的注入逻辑是 **先按类型（byType）** 找 Bean，如果有多个，再按照名称（byName）匹配；如果依然找不到，会抛出异常（除非设置 `required = false`）。

```java
  @Autowired
  private WolfService wolfService;
```

- `@Resource` 的注入逻辑则是 **优先按名称（byName）** 查找 Bean，如果没找到，再按类型（byType）查找。  
   如果指定了 `name` 属性，就只会按照这个名字找，找不到直接报错。

```java
  @Resource(name = "wolfService")
  private WolfService service;
```

再者，它们的扩展能力也不一样：

- `@Autowired` 可以搭配 `@Qualifier` 精确指定 Bean，支持更灵活的组合。
- `@Resource` 本身就带有 `name` 和 `type` 属性，适合简单明确的注入场景。

`@Autowired` 更灵活，适合 Spring 环境下的复杂场景；`@Resource` 更标准，适合注入逻辑简单、命名明确的情况。实际开发中，使用 `@Autowired` 搭配 `@Qualifier` 是最常见的做法。

# Spring Bean 的生命周期（特别重要）

Spring Bean 的生命周期，是面试中出现频率非常高的核心知识点之一。  
掌握它，不仅有助于理解 Spring 是如何管理对象的，也能帮助我们在合适的“节点”介入，完成自定义初始化或增强逻辑。

简单来说，一个 Bean 从诞生到销毁，大致会经历

```
定义 → 加载 → 实例化 → 初始化 → 使用 → 销毁
```

这几个阶段。

1. **读取 Bean 定义**：  
   Spring 启动时先解析配置（XML、注解等），将 Bean 的元信息加载成 `BeanDefinition`。
2. **实例化 Bean**：  
   容器通过反射创建对象，但此时只是“壳子”，属性还没有注入。
3. **依赖注入**：  
   容器将 Bean 所依赖的其他 Bean 注入进去，完成装配。
4. **初始化前置处理**：  
   如果 Bean 实现了 `BeanPostProcessor`，会调用 `postProcessBeforeInitialization()`，允许开发者在 Bean 初始化前做增强。
5. **初始化**：

   - 如果实现了 `InitializingBean` 接口，调用 `afterPropertiesSet()` 方法；
   - 或者配置了 `init-method`，Spring 会在这里执行初始化逻辑。

6. **初始化后置处理**：  
   再次调用 `BeanPostProcessor` 的 `postProcessAfterInitialization()`，此时 Bean 已经可以被 AOP 代理增强。
7. **使用阶段**：  
   Bean 准备就绪，供业务代码正常使用。
8. **销毁前清理**：  
   当容器关闭时，如果实现了 `DisposableBean` 接口，会执行 `destroy()`；  
   如果配置了 `destroy-method`，也会在这里调用，完成资源释放等清理动作。

# Spring Bean 的常见注入方式

Spring 通过 IOC 容器来统一管理对象的依赖关系，而“注入方式”决定了容器**在什么时候、用什么形式**把依赖塞进 Bean 里。  
这部分是实际开发中非常常用、也很容易在面试中被追问的知识点。

### Setter 方法注入（最基础、最直观）

Spring 会在 Bean 创建完成后，通过调用 setter 方法为其属性赋值。这是最传统的一种注入方式，常见于 XML 配置或简单场景。

```java
@Component
public class Wolf {
    private Prey prey;

    public void setPrey(Prey prey) {
        this.prey = prey;
    }
}
```

```java
@Component
public class Prey {}
```

```xml
<bean id="wolf" class="com.wreckloud.Wolf">
    <property name="prey" ref="prey"/>
</bean>
```

优点是简单直观，便于在不修改构造器的情况下添加依赖；缺点是依赖未注入前对象处于“不完整状态”。

### 2. 构造器注入（推荐）

通过构造方法传入依赖，在 Bean 创建的同时完成注入。  
这种方式更符合“依赖不可或缺”的设计，尤其在需要注入多个依赖时，代码结构更清晰。

```java
@Component
public class Wolf {
    private final Prey prey;

    @Autowired
    public Wolf(Prey prey) {
        this.prey = prey;
    }
}
```

这种方式的优势是依赖关系更明确，注入完成后对象就是“完整”的；缺点是依赖太多时构造器参数可能变得冗长。

### 3. 字段注入（最常用但不推荐）

使用 `@Autowired` 或 `@Resource` 直接标注在成员变量上，Spring 会在实例化后通过反射进行注入。

```java
@Component
public class Wolf {
    @Autowired
    private Prey prey;
}
```

优点是写法最简洁，代码量少；  
缺点是可测试性较差，不利于解耦，也不便于构建单元测试或替换依赖，因此在大型项目中通常推荐构造器注入。

### 4. P 命名空间注入 / SpEL 注入（了解）

- **P 命名空间注入** 是 XML 配置中的一种简化写法，本质上还是 setter 注入。
- **SpEL（Spring Expression Language）** 注入支持更灵活的表达式，例如动态值、系统属性、Bean 引用等。

```xml
<bean id="wolf" class="com.wreckloud.Wolf" p:prey-ref="prey"/>
<bean id="wolfName" class="java.lang.String" value="#{systemProperties['user.name']}"/>
```

### 5. 接口回调注入（特殊场景）

如果 Bean 实现了 Spring 提供的一些感知接口，例如 `ApplicationContextAware`、`BeanFactoryAware`，容器也会在合适的生命周期点自动注入这些上下文对象。

```java
@Component
public class Wolf implements ApplicationContextAware {
    @Override
    public void setApplicationContext(ApplicationContext context) {
        // 这里能拿到容器本身
    }
}
```

这种方式多用于框架封装、特殊场景，不建议在普通业务代码中使用。

Setter 注入灵活、构造器注入规范、字段注入便捷但不推荐滥用。实际开发中，**构造器注入 + 注解** 是主流做法，而 SpEL 和回调注入则适用于特殊场景。

# Spring 的循环依赖（特别重要）

循环依赖，指的是 **两个或多个 Bean 在创建时互相依赖**，如果没有机制处理，就会造成“死循环”，导致 Bean 无法完成实例化。

**什么是循环依赖**

比如：

```java
@Component
public class Wolf {
    @Autowired
    private Hunter hunter;
}

@Component
public class Hunter {
    @Autowired
    private Wolf wolf;
}
```

当 Spring 创建 `Wolf` 时，发现它依赖 `Hunter`，又去创建 `Hunter`；但 `Hunter` 又依赖 `Wolf`，此时如果没有缓存机制，就会无限套娃。

**Spring 的三级缓存机制**

Spring 之所以能解决循环依赖，靠的是在 Bean 生命周期的不同阶段，**“提前暴露”** 对象引用。容器内部维护了三层缓存：

## 三级缓存与循环依赖（高频考点）

在单例 Bean 的创建过程中，Spring 会借助三级缓存来解决循环依赖问题：

- **一级缓存**：存放完整的单例 Bean。
- **二级缓存**：存放早期暴露的 Bean 实例（已创建但未完全初始化）。
- **三级缓存**：存放 Bean 工厂，用于创建 AOP 代理。

正因为这三级缓存的存在，A 与 B 即使互相依赖，也能在生命周期中被正确组装起来。这是 Spring 的一个重要机制。

```
实例化 → 属性注入 → 初始化前（before） → 初始化（init）
→ 初始化后（after） → 使用 → 销毁前（destroy）
```

这三层缓存的存在，让 Spring 能够在对象还没完全准备好之前，就把“引用”先给出去，避免陷入死循环。

## 创建过程的关键步骤

1. Spring 创建 A 时，先在一级缓存查找，没有，进入实例化流程。
2. 实例化 A 后，还没注入属性，就把它的“工厂”放进三级缓存。
3. 给 A 注入依赖时发现需要 B，于是开始创建 B。
4. 创建 B 的过程中也需要 A，此时再次查找缓存。
5. 发现 A 正在创建中，就会通过三级缓存拿到 A 的早期引用（可能已被 AOP 代理），放入二级缓存，并注入给 B。
6. B 创建完成放入一级缓存，A 再完成属性注入，也进入一级缓存，循环依赖就此解开。

## 为什么是三级缓存，而不是两级？

表面上，两级缓存似乎也能完成循环依赖，但在实际中，还涉及 AOP。  
当 A 被代理时，容器需要一个“工厂”来返回**代理对象**而不是原始对象，这就是三级缓存存在的意义：  
它在实例化完成前就能**暴露代理对象**，确保注入的是最终可用的 Bean。

Spring 靠 **三级缓存 + 早期引用机制** 解决了单例 Bean 的循环依赖问题，其中三级缓存的关键价值在于能提前暴露 AOP 代理对象。这是 Spring IOC 的一个经典设计，也是面试高频考点之一。

# 聊一下 Spring AOP

Spring Framework 的 AOP（Aspect Oriented Programming，面向切面编程）是一种把“横切关注点”从业务逻辑中剥离出来的思想。
比如权限校验、日志记录、事务管理这些功能，不属于核心业务，但又会反复出现在各个地方。AOP 的作用就是把这类重复逻辑横向抽取，集中写在一个地方，再在需要的时候“切入”核心业务中。

从技术实现上看，Spring AOP 底层是通过动态代理来完成的：

- 如果目标类实现了接口，就采用 JDK 动态代理；
- 如果没有实现接口，就使用 CGLIB 生成子类代理。

当我们写好增强逻辑（Advice）后，需要通过配置（XML 或注解）告诉 Spring，让它在容器初始化时把增强逻辑和目标对象结合起来，最终交给代理对象去执行。这意味着，我们写业务代码时，根本不需要关心这些切面逻辑，Spring 会在合适的时机自动织入。

### AOP 的常见应用场景

1. **事务管理**：最典型的例子就是通过 `@Transactional` 注解来控制事务，这其实就是 AOP 的一个切面实现。Spring 在方法调用前后自动开启、提交或回滚事务，不需要在业务代码中手动写。
2. **权限控制**：在方法调用前切入验证逻辑，统一管理接口访问权限。
3. **日志记录**：对方法调用过程进行记录，包括执行时间、调用参数、异常信息等，常用来做接口埋点。
4. **动态数据源切换**：在进入不同方法时，自动切换到对应的数据源，而不必在每个方法里写切换逻辑。

---

### AOP 的几个核心术语

- **切面（Aspect）**：对某个特定关注点的封装，比如“日志切面”、“事务切面”。
- **通知（Advice）**：切面里具体的增强逻辑。
- **切入点（Pointcut）**：定义增强逻辑应该“织入”到哪些目标方法上。
- **连接点（JoinPoint）**：程序运行中可以被 AOP 拦截的具体执行点（比如一个方法的调用）。

Spring AOP 的织入过程是在运行时完成的，也就是说，当我们调用一个被增强的方法时，底层代理对象会先执行切面逻辑（通知），再调用目标方法。这个过程是透明的，不需要我们改动原有的业务实现。

---

### AOP 的目的

AOP 的核心价值在于：  
让“与核心业务无关”的逻辑和“核心业务代码”彻底分离。  
开发者在写业务时专注写主逻辑，像日志、事务、权限这类通用功能，由切面统一维护。这不仅提高了可复用性，还让代码更清晰，后期维护也更容易。

---

换句话说，AOP 是 Spring 的一根“骨架”，它贯穿于框架的很多能力里。无论是事务注解还是权限控制，本质都是切面机制的实际应用。掌握了 AOP，就等于掌握了 Spring 的一大核心。

# Spring AOP 是什么？AOP 的配置？AOP 常见术语（切面、通知、切入点、连接点）

# Spring AOP 有什么作用？你哪些地方使用了 AOP？

# Spring AOP 和 AspectJ AOP 的区别

# AOP 原理（源码）

# AOP 中常见的通知类型

# 说说你在 Spring 中用到的常见注解

# Spring 中事务的传播特性

# Spring 事务失效的常见情况

# Spring 容器启动过程（源码级）

# Spring 中用到了哪些设计模式

# Spring 事务实现方式

# IOC 的工作原理（源码）
