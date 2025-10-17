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

Spring 不只是 `spring-framework`，它还有一整套生态，但核心始终围绕着 **简化开发、降低耦合、提高可维护性** 展开。常用模块与功能包括：：

- `Spring Framework`：IOC（依赖注入）、AOP（切面）、声明式事务、`Spring MVC`。
- `Spring Boot`：简化配置、自动装配、快速启动。
- `Spring Data`：统一的数据访问方式，常用如 `Spring Data JPA`。
- `Spring Cloud`：微服务体系下的注册、发现、负载均衡、网关等。
- 其他：`Spring Security`（安全认证）、`Spring Session`（会话管理）、`Spring Cache`（缓存）、`Spring AMQP`（消息队列整合）等。

Spring 把开发中“重复、繁琐、耦合”的部分接管掉，让开发者更专注于业务本身。它不只是一个框架，更是一整套标准化的企业开发生态。

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

# Spring 中 Scope 属性（Bean 作用范围）

在 Spring 中，`Scope` 用来定义 Bean 在容器中的生命周期与共享范围。它决定了：一个 Bean 会被创建几次、在什么场景下能共用。

默认情况下，Spring 创建的 Bean 是单例（`singleton`），但在不同业务场景下，我们可以通过 `@Scope` 注解或 XML 配置灵活调整作用范围。

**1. `singleton`（默认）**

Spring 容器中只存在该 Bean 的一个实例。无论注入多少次，拿到的都是同一个对象。

适用于大多数业务组件，如 `Service`、`Dao`、工具类等。

```java
@Component
@Scope("singleton")  // 可省略，因为默认就是 singleton
public class WolfService {
    public WolfService() {
        System.out.println("WolfService 实例创建");
    }
}
```

单例 Bean 从容器启动那一刻诞生，存在于容器的单例池中，一直活到容器销毁。

### **2. `prototype`（多例）**

每次获取 Bean 时，Spring 都会**重新创建一个新对象**。  
容器仅负责创建，不负责销毁。

适用于状态不共享、需要频繁变化的对象，如一次性任务或临时计算类。

```java
@Component
@Scope("prototype")
public class Mission {
    public Mission() {
        System.out.println("新任务实例创建");
    }
}
```

多例 Bean 像“临时工”，Spring 只负责 new 出来，用完的命运要自己负责。

### **3. `request`（Web 环境）**

在一次 HTTP 请求的生命周期内，Bean 唯一；不同请求间各自独立。  
适用于与请求上下文相关的对象，如临时用户信息或请求追踪。

```java
@Component
@Scope("request")
public class RequestTracker { }
```

Request Bean 的生命跨度 = 一次 HTTP 请求的开始到结束。

### **4. `session`（Web 环境）**

同一个 Session 内共享同一个 Bean，不同用户各自持有独立实例。  
常用于存储登录状态、用户会话级缓存。

```java
@Component
@Scope("session")
public class UserSession { }
```

Session Bean 属于用户个人领地，伴随会话存在，直到退出为止。

### **5. `application`（Web 环境）**

整个 Web 应用（`ServletContext`）只存在一个 Bean。  
常用于系统级别的全局数据，如应用配置、统计信息。

```java
@Component
@Scope("application")
public class GlobalConfig { }
```

Application Bean 就像全服公告板，整个项目只有一份，随项目一同启动与关闭。

### **6. `websocket`（WebSocket 环境）**

每个 WebSocket 会话都会创建独立的 Bean。  
适用于即时通信、实时推送等场景。

```java
@Component
@Scope("websocket")
public class ChatSession { }
```

WebSocket Bean 的生命周期 = 一次实时会话。

## 注意事项

- `singleton` 是最常用、最节省资源的作用域，也是默认设置。
- `prototype` Bean 不会被 Spring 容器完整管理，尤其**销毁回调不会自动执行**。
- Web 相关作用域（如 `request`、`session`）只有在 Web 环境下才能生效。

---

## 一句话总结

`Scope` 决定了 **Bean 在容器中活多久、是否共享、谁来管理生命周期**。  
绝大多数情况下使用 `singleton` 即可；  
而其他作用域则在特定业务下提供更灵活的生命周期控制。

---

要不要我带你下一步进入“**Spring 容器如何在内部实现这些 Scope（单例池 / 原型创建 / WebContext 管理）**”这一层？  
那一步我们就能看到它的缓存逻辑、`BeanFactory`、以及为什么 `prototype` 不被销毁。

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

# 什么是“代理”：

比如你有个类 `UserService`，它有个方法 `addUser()`：

```java
public class UserService {
    public void addUser() {
        System.out.println("添加用户");
    }
}
```

正常情况下，new 这个类，调用方法就是直接干活。但如果我希望 在调用 `addUser` 之前和之后插点额外逻辑，比如：

- 打印日志
- 记录执行时间
- 做权限校验

有两个选择：

1. 把这些逻辑硬写进 `addUser` 方法（结果所有地方都得写一遍，重复又难维护）。
2. 找个“代理人”，在调用 `addUser` 的时候，这个代理人先做自己的事，再去帮你真正调用 `addUser`。

这第二种方式，就是 **“代理”**，比如我们用接口来定义一套业务标准：

```java
public interface UserService {
    void addUser(String name);
    void deleteUser(Long id);
}
```

```java
public class UserServiceImpl implements UserService {
    @Override
    public void addUser(String name) {
        System.out.println("【业务】添加用户：" + name);
    }

    @Override
    public void deleteUser(Long id) {
        System.out.println("【业务】删除用户：" + id);
    }
}
```

## 静态代理

所谓“静态代理”，就是 **你自己写一个代理类**，它和目标类实现同样的接口，然后在每个方法里包一层“前后增强逻辑”。

思路：

- 代理类实现同一接口；
- 内部持有目标对象；
- 每个方法里：
  1.  前置增强（如日志、权限）
  2.  调用目标对象的真实方法
  3.  后置增强（如耗时统计）

```java
public class UserServiceProxy implements UserService {
    private final UserService target;

    public UserServiceProxy(UserService target) {
        this.target = target;
    }

    // 你想统一加的横切逻辑，单独封装几个私有方法更清晰
    private void checkPermission() {
        System.out.println("【切面·权限】检查通过");
    }
    private void logBefore(String method, Object... args) {
        System.out.println("【切面·日志】调用 " + method + " 参数：" + java.util.Arrays.toString(args));
    }
    private void logAfter(String method, long costMs) {
        System.out.println("【切面·日志】" + method + " 耗时：" + costMs + " ms");
    }

    @Override
    public void addUser(String name) {
        long start = System.currentTimeMillis();
        try {
            checkPermission();
            logBefore("addUser", name);
            target.addUser(name);                  // → 转调真实业务
        } finally {
            logAfter("addUser", System.currentTimeMillis() - start);
        }
    }

    @Override
    public void deleteUser(Long id) {
        long start = System.currentTimeMillis();
        try {
            checkPermission();
            logBefore("deleteUser", id);
            target.deleteUser(id);                 // → 转调真实业务
        } finally {
            logAfter("deleteUser", System.currentTimeMillis() - start);
        }
    }
}
```

**怎么用：**

```java
public class App {
    public static void main(String[] args) {
        UserService target = new UserServiceImpl();
        UserService proxy  = new UserServiceProxy(target); // 用代理把目标包起来

        proxy.addUser("Alice");
        proxy.deleteUser(1001L);
    }
}
```

写了一个 `UserServiceProxy`，包在真实业务外面。好处是清晰直观，坏处是：

- 接口一旦有很多方法，代理类也得一个个写；
- 如果有多个类要增强，就得重复造很多代理。

## JDK 动态代理

动态代理的本质就是：**把“代理逻辑”集中在一个地方写一次，让 JDK 在运行时帮你自动生成代理对象**。

思路：

- 写一个 `InvocationHandler`，负责在方法调用时插入增强逻辑；
- 用 JDK 提供的 `Proxy.newProxyInstance()` 创建代理对象；
- 不用再一个接口写一个代理类。

```java
import java.lang.reflect.*;

public class LogTimeHandler implements InvocationHandler {
    private final Object target;

    public LogTimeHandler(Object target) {
        this.target = target;
    }

    private void checkPermission() {
        System.out.println("【切面·权限】检查通过");
    }
    private void logBefore(Method method, Object[] args) {
        System.out.println("【切面·日志】调用 " + method.getName() + " 参数：" + java.util.Arrays.toString(args));
    }
    private void logAfter(Method method, long costMs) {
        System.out.println("【切面·日志】" + method.getName() + " 耗时：" + costMs + " ms");
    }

    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        long start = System.currentTimeMillis();
        try {
            checkPermission();
            logBefore(method, args);
            // 反射调用真实方法
            return method.invoke(target, args);
        } finally {
            logAfter(method, System.currentTimeMillis() - start);
        }
    }
}
```

**怎么用：**

```java
public class AppDynamic {
    public static void main(String[] args) {
        UserService target = new UserServiceImpl();

        UserService proxy = (UserService) Proxy.newProxyInstance(
                target.getClass().getClassLoader(),
                new Class<?>[]{UserService.class},          // 这里必须有接口
                new LogTimeHandler(target)
        );

        proxy.addUser("Bob");
        proxy.deleteUser(2002L);
    }
}
```

对比一下就明白了：

- 静态代理：**一个接口 = 至少写一个代理类**，接口方法多就都得实现；
- 动态代理：**一个 Handler 就够**，任何实现了这个接口的目标对象都能复用这套“前后增强”。

# 聊一下 Spring AOP

Spring Framework 的 AOP（Aspect Oriented Programming，面向切面编程）是一种把“横切关注点”从业务逻辑中剥离出来的思想。
比如权限校验、日志记录、事务管理这些功能，不属于核心业务，但又会反复出现在各个地方。AOP 的作用就是把这类重复逻辑横向抽取，集中写在一个地方，再在需要的时候“切入”核心业务中。

从技术实现上看，Spring AOP 底层是通过动态代理来完成的：

- 如果目标类实现了接口，就采用 JDK 动态代理；
- 如果没有实现接口，就使用 CGLIB 生成子类代理。

当我们写好增强逻辑（Advice）后，需要通过配置（XML 或注解）告诉 Spring，让它在容器初始化时把增强逻辑和目标对象结合起来，最终交给代理对象去执行。
这意味着，我们写业务代码时，根本不需要关心这些切面逻辑，Spring 会在合适的时机自动织入。

# AOP 的配置

AOP 的配置主要分三步：

1. **开启 AOP 功能**：在配置类上使用 `@EnableAspectJAutoProxy`。
2. **定义切面类**：用 `@Aspect` + `@Component` 标记，并通过 `@Before`、`@After`、`@Around` 编写增强逻辑。
3. **指定切入点**：通过切入点表达式（如 `execution(...)`）来匹配目标方法。

Spring 会在运行时自动生成代理对象，在方法执行前后织入这些增强逻辑，实现像日志、权限、事务等功能。

1. **开启 AOP 功能**

在启动类或配置类上加上 `@EnableAspectJAutoProxy`。

```java
@SpringBootApplication
@EnableAspectJAutoProxy    // 开启 AOP 自动代理
public class DemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}
```

2. **定义业务类**

比如我们有一个简单的业务类 `UserService`

```java
@Service
public class UserService {

    public void addUser(String name) {
        System.out.println("【业务】添加用户：" + name);
    }
}
```

3. **定义切面类**

使用 `@Aspect` + `@Component`，写增强逻辑。  
`@Before` 和 `@After` 就是方法执行前后织入。

```java
@Aspect
@Component
public class LogAspect {

    @Before("execution(* com.example.demo.UserService.addUser(..))")
    public void beforeAddUser() {
        System.out.println("【AOP】调用前：记录日志 + 权限校验");
    }

    @After("execution(* com.example.demo.UserService.addUser(..))")
    public void afterAddUser() {
        System.out.println("【AOP】调用后：统计耗时");
    }
}
```

4. **测试调用**

```java
@RestController
public class TestController {

    @Autowired
    private UserService userService;

    @GetMapping("/add")
    public void add() {
        userService.addUser("Alice");
    }
}
```

访问 `http://localhost:8080/add`  
控制台输出 👇

```
【AOP】调用前：记录日志 + 权限校验
【业务】添加用户：Alice
【AOP】调用后：统计耗时
```

### AOP 的常见应用场景

1. **事务管理**：最典型的例子就是通过 `@Transactional` 注解来控制事务，这其实就是 AOP 的一个切面实现。Spring 在方法调用前后自动开启、提交或回滚事务，不需要在业务代码中手动写。
2. **权限控制**：在方法调用前切入验证逻辑，统一管理接口访问权限。
3. **日志记录**：对方法调用过程进行记录，包括执行时间、调用参数、异常信息等，常用来做接口埋点。
4. **动态数据源切换**：在进入不同方法时，自动切换到对应的数据源，而不必在每个方法里写切换逻辑。

### AOP 的几个核心术语

- **切面（Aspect）**：一类要统一处理的逻辑，比如日志、事务、权限。
- **通知（Advice）**：切面里真正要干的事，比如“调用前打印日志”。
- **切入点（Pointcut）**：规则，告诉 AOP 这些逻辑要插在哪些方法上。
- **连接点（JoinPoint）**：具体命中的那个方法执行点。

Spring AOP 的织入过程是在运行时完成的，也就是说，当我们调用一个被增强的方法时，底层代理对象会先执行切面逻辑（通知），再调用目标方法。这个过程是透明的，不需要我们改动原有的业务实现。

### AOP 的目的

AOP 的核心价值在于：  
让“与核心业务无关”的逻辑和“核心业务代码”彻底分离。  
开发者在写业务时专注写主逻辑，像日志、事务、权限这类通用功能，由切面统一维护。这不仅提高了可复用性，还让代码更清晰，后期维护也更容易。

换句话说，AOP 是 Spring 的一根“骨架”，它贯穿于框架的很多能力里。无论是事务注解还是权限控制，本质都是切面机制的实际应用。

# Spring AOP 有什么作用？你哪些地方使用了 AOP？

Spring AOP 的核心价值在于：  
**将与业务无关、但会在多个地方重复出现的横切逻辑抽离出来集中处理**，避免在业务方法中不断编写相同的代码，从而达到代码解耦、提升可维护性的目的。

这些“横切逻辑”通常包括：

- 日志记录
- 权限控制
- 统一异常处理
- 接口性能统计
- 声明式事务

AOP 通过运行时动态代理的方式，在方法调用前后自动织入这些逻辑，开发者只需要关注业务本身。

## 常见应用场景与示例

### 1. 日志记录

这是 AOP 最常见的使用场景之一。在接口调用的前后自动输出日志，而不需要在每个方法里重复编写。

```java
@Aspect
@Component
public class LogAspect {

    @Before("execution(* com.example.demo.controller.*.*(..))")
    public void logBefore(JoinPoint joinPoint) {
        String method = joinPoint.getSignature().toShortString();
        System.out.println("【AOP】开始调用接口：" + method);
    }

    @After("execution(* com.example.demo.controller.*.*(..))")
    public void logAfter(JoinPoint joinPoint) {
        String method = joinPoint.getSignature().toShortString();
        System.out.println("【AOP】接口调用结束：" + method);
    }
}
```

上面的切面会匹配 controller 包下所有方法。在方法调用时，AOP 会先执行 `logBefore`，再执行目标方法，最后执行 `logAfter`。这样，所有接口的调用过程都能统一记录，而不需要手动写日志。

### 2. 权限控制

通过自定义注解结合 AOP，可以在方法执行前统一进行权限校验。

定义注解

```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireLogin {}
```

定义切面

```java
@Aspect
@Component
public class AuthAspect {

    @Before("@annotation(com.example.demo.annotation.RequireLogin)")
    public void checkLogin() {
        System.out.println("【AOP】检查登录状态");
        // 可以在这里抛异常，阻止未登录用户访问
    }
}
```

使用注解

```java
@RestController
public class UserController {

    @RequireLogin
    @GetMapping("/info")
    public String getUserInfo() {
        return "用户信息";
    }
}
```

当访问 `/info` 时，AOP 会先执行权限校验逻辑，再调用实际的接口方法。这种方式的好处是权限校验集中管理，不需要在每个方法里重复编写。

### 3. 事务管理

Spring 声明式事务本质上也是基于 AOP 实现的。  
当方法加上 `@Transactional` 后，Spring 会为其生成代理对象，在方法执行前后自动开启、提交或回滚事务。

```java
@Service
public class AccountService {

    @Transactional
    public void transfer(String from, String to, double amount) {
        // 转账逻辑
        // 如果中间出现异常，Spring 会自动回滚
    }
}
```

这种方式不需要开发者手动管理事务边界，提升了代码整洁度和可靠性。

### 4. 接口性能统计

除了日志和权限，还可以用 AOP 统计接口执行耗时，为后续的性能优化提供依据。

```java
@Aspect
@Component
public class TimeAspect {

    @Around("execution(* com.example.demo.service.*.*(..))")
    public Object recordTime(ProceedingJoinPoint joinPoint) throws Throwable {
        long start = System.currentTimeMillis();
        Object result = joinPoint.proceed();
        long end = System.currentTimeMillis();
        System.out.println("【AOP】方法 " + joinPoint.getSignature().getName() + " 执行耗时：" + (end - start) + " ms");
        return result;
    }
}
```

`@Around` 通知可以在方法执行前后都加入逻辑，因此非常适合这种性能统计类场景。

# Spring AOP 和 AspectJ AOP 的区别

Spring AOP 和 AspectJ 都是 AOP 思想的实现，但它们的 **织入方式、使用范围和适用场景** 并不相同。

- **Spring AOP**：基于动态代理（JDK / CGLIB），在**运行时**织入。只能增强 Spring 容器中的 Bean，轻量、易上手。
- **AspectJ AOP**：基于字节码操作，可在**编译期 / 类加载期 / 运行时**织入，不依赖 Spring，功能更强大。

Spring AOP 的优点是集成简单、零侵入，非常适合业务层面的通用功能增强，比如统一日志记录、权限控制、事务管理等。
而 AspectJ 功能更强，但配置复杂，更适合底层框架开发或对性能、控制粒度要求很高的场景。

# AOP 原理（源码）

Spring AOP 本质上就是在对象实例化完成后，通过 **后置处理器** 判断这个对象是否需要被切面增强，如果需要，就**为它创建代理对象**，然后**执行时通过拦截器链完成增强逻辑**。

更具体地说，源码大致是这样走的：

1. **收集切面**  
   Spring 在容器启动时，会遍历所有的 Bean，找到标注了 `@Aspect` 的类，把这些类中标注了通知（如 `@Before`、`@Around`）的方法拿出来，封装成 `Advisor`（增强器），保存下来。
2. **实例化目标 Bean 后的拦截**  
   当容器在创建某个目标 Bean 时，实例化结束后会进入一个非常关键的扩展点——`postProcessorAfterInitialization`。  
   这一步里，Spring 会判断这个 Bean 是否符合某些 `Advisor` 的切入规则，如果匹配，就不直接返回原始对象，而是——

- 创建代理对象（JDK 动态代理 / CGLIB 代理）
- 把这个代理对象放进容器

3. **增强器转换为拦截器链**  
   Spring 会把所有匹配的 `Advisor` 转换成 `MethodInterceptor` 拦截器，按照顺序放进拦截器链里。
4. **方法调用时执行拦截器**  
   以后调用这个 Bean 的方法时，其实是在调用代理对象的方法。代理对象会先走拦截器链，再执行目标方法。  
   通知（`@Before`、`@After`、`@Around`）的逻辑就插在这里，实现增强。

Spring AOP 的原理就是：

1. 启动时把切面方法封装成增强器
2. Bean 创建后通过后置处理器判断是否要增强，匹配的就创建代理对象，把增强器转成拦截器链，
3. 最后执行时按顺序织入增强逻辑。

这一整套流程用的是动态代理（JDK 或 CGLIB）来实现的。

# AOP 中常见的通知类型

好，主子，这一题我们讲的是——

# AOP 中常见的通知类型

Spring AOP 的“通知”就是我们写在切面里、在特定时机执行的**增强逻辑**。它和目标方法的关系，就像是在不同的时间点插了钩子，来实现“织入”。

AOP 通知一共五种：`Before` 前置、`After` 后置、`AfterReturning` 返回、`AfterThrowing` 异常、`Around` 环绕。

1. **前置通知（Before）**  
   在目标方法调用之前执行。  
   常用于权限校验、日志记录、参数校验这类“前置动作”。

   ```java
   @Before("execution(* com.wreckloud.wolfpack..*(..))")
   public void before() {
       System.out.println("🐺 前置通知：目标方法即将执行");
   }
   ```

2. **后置通知（After）**  
   不管目标方法是否抛异常，方法执行结束后都会调用。  
   一般用于**清理资源**、**统一收尾**的场景。

   ```java
   @After("execution(* com.wreckloud.wolfpack..*(..))")
   public void after() {
       System.out.println("🐺 后置通知：方法结束了");
   }
   ```

3. **返回通知（AfterReturning）**  
   只有当目标方法**正常返回**时才会调用。  
   适合处理**结果加工**或**后续逻辑衔接**。

   ```java
   @AfterReturning("execution(* com.wreckloud.wolfpack..*(..))")
   public void afterReturning() {
       System.out.println("🐺 返回通知：成功返回结果");
   }
   ```

4. **异常通知（AfterThrowing）**  
   当目标方法抛出异常时执行。  
   一般用于**异常日志**、**报警**、**事务回滚处理**。

   ```java
   @AfterThrowing("execution(* com.wreckloud.wolfpack..*(..))")
   public void afterThrowing() {
       System.out.println("🐺 异常通知：目标方法抛异常了");
   }
   ```

5. **环绕通知（Around）**  
   是最强的通知类型，可以在方法**前后**都插逻辑，还能决定目标方法是否执行。  
   像一个“壳”，把原方法包起来。

   ```java
   @Around("execution(* com.wreckloud.wolfpack..*(..))")
   public Object around(ProceedingJoinPoint pjp) throws Throwable {
       System.out.println("🐺 环绕通知：前");
       Object result = pjp.proceed(); // 继续执行目标方法
       System.out.println("🐺 环绕通知：后");
       return result;
   }
   ```

# 说说你在 Spring 中用到的常见注解

好，主子，这一题我们整理的是——

# 说说你在 Spring 中用到的常见注解

在实际开发中，最常用的 Spring 注解可以分成三类来记：

1. **Bean 定义与组件扫描相关**
2. **依赖注入与作用范围相关**
3. **AOP / 配置 / 事务控制相关**

第一类是 `@Component`、`@Service`、`@Controller` 这种用来声明 Bean；  
第二类是 `@Autowired`、`@Resource`、`@Value` 控制注入和作用域；  
第三类就是 AOP 和事务相关，比如 `@Transactional`、`@Aspect`、`@Before` 等。

这些基本上就覆盖了日常 Spring Boot 项目 80% 的开发场景。

### ① Bean 定义与组件扫描

这些注解是告诉 Spring 哪些类要交给容器管理、作为 Bean 使用：

- `@Component`：最基础的组件注解，标记一个类交给 Spring 容器管理。
- `@Service`：语义上标记业务层（Service）的组件。
- `@Repository`：语义上标记持久层（DAO）的组件。
- `@Controller` / `@RestController`：标记控制层，`@RestController` 相当于 `@Controller + @ResponseBody`。
- `@Bean`：一般写在 `@Configuration` 类中，用来声明一个 Bean 的创建逻辑。
- `@Configuration`：声明一个配置类（相当于以前 XML 的 `<beans>` 配置）。

```java
@Service
public class WolfMissionService {
    public void howling() {
        System.out.println("任务执行中...");
    }
}
```

### ② 依赖注入与作用范围

这些注解让 Spring 帮我们自动装配依赖、控制 Bean 生命周期：

- `@Autowired`：按类型自动注入依赖，找不到或多个时会再按名称匹配。
- `@Resource`：JDK 自带，优先按名称注入，找不到再按类型（更严格）。
- `@Qualifier`：配合 `@Autowired` 使用，指定注入的 Bean 名称。
- `@Value`：给字段注入简单值或配置文件里的内容。
- `@Scope`：设置 Bean 的作用域，比如 `singleton`、`prototype`。
- `@Lazy`：懒加载，等真正使用时再初始化 Bean。

```java
@Autowired
private WolfMissionService wolfMissionService;

@Value("${wolf.king.name}")
private String wolfName;
```

### ③ AOP / 事务 / 配置控制

这些是实际项目里常见的增强功能：

- `@Transactional`：声明式事务，常用于 Service 层。
- `@Aspect`：声明一个切面类。
- `@Before`、`@After`、`@Around` 等：定义 AOP 通知逻辑。
- `@EnableAspectJAutoProxy`：开启基于注解的 AOP 功能。
- `@Import`：动态导入配置或类。
- `@Primary`：多个 Bean 冲突时，优先选这个。

```java
@Transactional
public void executeMission() {
    wolfMissionService.howling();
}
```

# Spring 中事务的传播特性

在实际项目里，一个事务方法里调用另一个事务方法时，Spring 用“传播特性”来决定它们**怎么相处**：  
是共用一个事务，还是开新的，还是干脆不进事务。

Spring 一共 7 种传播行为，但重点其实就 3 种常用的，剩下的是补充边角。

## 最常用的三种

### `REQUIRED`（默认）

如果外面有事务，就跟着一起走；如果外面没有，就自己开一个。

> —— 绝大多数业务都用这个。

```java
@Transactional(propagation = Propagation.REQUIRED)
public void hunt() {}
```

### `REQUIRES_NEW`

不管外面有没有，都**自己开一个新的**事务，外面的会被挂起。

> —— 常用在**日志、记录、补偿**这种不想受主流程影响的地方。

```java
@Transactional(propagation = Propagation.REQUIRES_NEW)
public void saveLog() {}
```

### `NESTED`

如果外面有事务，就在里面再开一层“嵌套事务”；外面没有，就跟 `REQUIRED` 一样开一个。

> —— 用在**子流程出错时只回滚自己、不影响外层**的场景。

```java
@Transactional(propagation = Propagation.NESTED)
public void subAction() {}
```

## 其他四种

| 类型            | 行为                           |
| --------------- | ------------------------------ |
| `SUPPORTS`      | 有事务就加入，没有就非事务执行 |
| `MANDATORY`     | 必须在事务中运行，否则报错     |
| `NOT_SUPPORTED` | 有事务就挂起，不进事务         |
| `NEVER`         | 有事务就直接报错               |

# Spring 事务失效的常见情况

事务写了不一定就生效。Spring 的声明式事务是基于 AOP 代理实现的，很多时候**不是事务出了问题，而是触发事务的时机不对**。  
总结下来，常见失效场景主要有以下几类。

## 1. 异常类型不匹配

Spring 默认只对 `RuntimeException` 和 `Error` 进行回滚。  
如果你抛的是受检异常（比如 `IOException`），事务默认不会回滚。

如果需要自定义异常类型触发回滚，就要显式声明：

```java
@Transactional(rollbackFor = Exception.class)
public void updateWolfInfo() throws Exception {
    throw new Exception("异常不会被默认回滚");
}
```

## 2. 异常被捕获了

如果你在事务方法内部 try-catch 了异常，而且没再往外抛，Spring 感知不到异常，自然不会回滚。

```java
@Transactional
public void save() {
    try {
        // 出错了
    } catch (Exception e) {
        // 吃掉了异常
    }
    // 事务不会回滚
}
```

如果确实需要捕获，也要手动抛出或标记事务状态。

## 3. 方法是 `final` 修饰的

Spring AOP 是通过代理来织入事务的，如果方法被 `final` 修饰，就无法被子类重写，也就没法生成代理增强，事务自然不生效。

这一点在使用 CGLIB 代理时尤其要注意。

## 4. 同类方法内调用

这是很多人踩过的坑。

如果你在一个类的非事务方法中，调用了这个类的另一个有 `@Transactional` 的方法，Spring 不会走代理，而是直接调用了原方法，导致事务不生效。

```java
public class WolfService {

    public void outer() {
        inner(); // 直接调用，事务不会生效
    }

    @Transactional
    public void inner() {}
}
```

正确做法通常有三种：

- 把事务方法拆出去，交给另一个 Bean 调用；
- 注入自己（`@Autowired` 自己），通过代理对象调用；
- 使用 `AopContext.currentProxy()` 获取代理对象再调用。

## 5. 事务方法不是 public

Spring 的事务默认只对 `public` 方法生效，如果方法是 `private` 或 `protected`，也会导致事务不触发。

虽然也可以通过配置代理机制绕过，但通常这是设计问题，应当保持事务方法的 public 可见性。

# Spring 容器启动过程（源码级）

Spring 启动过程本质上就是：  
构建 BeanFactory → 解析配置注册 BeanDefinition → 初始化核心组件 → 注册后置处理器 → 创建 Bean → AOP 织入 → 发布事件。  
Bean 真正的实例化和依赖注入，其实发生在**最后一步**。

## 1. 容器初始化：构造 BeanFactory

Spring 启动最开始，会先构造一个 `BeanFactory`（实际上是 `DefaultListableBeanFactory`）。  
它是整个容器的心脏，所有的 Bean 都会在这里被注册、创建、管理。

---

## 2. 解析配置类，注册 BeanDefinition

接着，Spring 会解析配置：

- 注解类（`@Configuration`、`@ComponentScan`、`@Import`、`@Bean`）
- 或 XML 配置

解析的结果就是 `BeanDefinition`：**Bean 的元数据**，记录了类名、作用域、是否懒加载、依赖等。  
Spring 把这些 BeanDefinition 注册到 BeanFactory 的内部 Map 里，**此时还没真正创建对象**。

---

## 3. 准备基础设施组件

在 ApplicationContext 层面，Spring 还会初始化一些核心组件：

- `MessageSource`（国际化）
- `ApplicationEventMulticaster`（事件机制）
- `ApplicationListener`（事件监听）

这些是 ApplicationContext 比 BeanFactory “更重”的地方。

---

## 4. 注册 BeanPostProcessor

在真正创建 Bean 之前，Spring 会先注册一批**后置处理器**：

- `AutowiredAnnotationBeanPostProcessor`（处理 `@Autowired`、`@Value`）
- `CommonAnnotationBeanPostProcessor`（处理 `@Resource`、`@PostConstruct`）
- 以及用户自己定义的 BeanPostProcessor

这些处理器是后面 Bean 生命周期中**增强**的关键钩子。

---

## 5. 实例化非懒加载单例 Bean

容器启动最后一个阶段，就是创建非懒加载的单例 Bean：

1. 遍历 BeanDefinition
2. 通过反射实例化对象
3. 属性注入（依赖注入）
4. 执行 Aware 接口
5. 调用 `BeanPostProcessor` 的 before/after
6. 调用初始化方法（`InitializingBean` / `@PostConstruct`）
7. 如果有 AOP 匹配，在这里创建代理对象
8. 放入单例池（`singletonObjects`）

---

## 6. 发布事件，启动完成

当所有单例 Bean 创建完成后，Spring 会：

- 调用所有 `Lifecycle` Bean 的 `start()` 方法
- 发布 `ContextRefreshedEvent` 事件
- 容器启动流程结束，进入可用状态。

# Spring 中用到了哪些设计模式

Spring 框架底层用到了很多经典设计模式，这也是它能够“高度解耦、可扩展”的关键。面试里这题经常用来判断你对框架的理解深不深。

Spring 用设计模式搭建了整个框架骨架：  
BeanFactory 是工厂，单例节省资源，代理实现 AOP，观察者做事件，模板封装流程，责任链支撑 MVC。  
每一种模式都对应了一个明确的功能点。

## 1. 简单工厂模式（Simple Factory）

Spring 的 `BeanFactory` 本质就是一个简单工厂。  
你给它一个 Bean 名称，它就帮你返回对应的 Bean 实例，隐藏了具体的创建细节。

```java
Bean wolf = beanFactory.getBean("wolf");
```

**作用**：集中管理对象的创建，避免到处 `new`。

## 2. 工厂方法模式（Factory Method）

`FactoryBean` 是工厂方法模式的直接体现。  
Spring 不止能帮你托管对象，还能让你**自定义对象的创建逻辑**。

```java
public class WolfFactoryBean implements FactoryBean<Wolf> {
    public Wolf getObject() {
        return new Wolf();
    }
}
```

**作用**：灵活扩展 Bean 的构造方式，适配复杂场景。

## 3. 单例模式（Singleton）

Spring 默认创建的 Bean 都是单例的。  
容器中只有一份实例，所有地方都复用这一份，节省内存、方便统一管理。

```java
@Scope("singleton")
public class WolfService {}
```

**作用**：降低对象的创建成本，保持全局唯一性。

## 4. 代理模式（Proxy）

Spring AOP 的底层核心。  
通过 JDK 动态代理或 CGLIB，为目标对象生成代理类，在调用方法时织入增强逻辑。

```java
@Transactional
public void hunt() {}
```

**作用**：在不修改业务代码的前提下，增加额外功能（如事务、日志、安全控制）。

## 5. 观察者模式（Observer）

Spring 的事件机制（`ApplicationEvent`、`ApplicationListener`）就是典型的观察者。  
容器发布事件，监听器响应，实现解耦通信。

```java
applicationContext.publishEvent(new WolfEvent(this));
```

**作用**：让对象之间通过事件解耦，提升可扩展性。

## 6. 模板方法模式（Template Method）

Spring 的 `JdbcTemplate`、`RedisTemplate`、`KafkaTemplate` 都体现了模板方法。  
固定流程封装在模板中，具体步骤留给开发者实现或配置。

```java
jdbcTemplate.queryForObject("select * from wolf", ...);
```

**作用**：复用固定流程，减少重复代码。

## 7. 责任链模式（Chain of Responsibility）

Spring MVC 的 `HandlerExecutionChain` 就是一条责任链。  
一次请求会依次经过一串拦截器，每个拦截器都可以处理或放行请求。

**作用**：把复杂的请求处理拆成一连串独立步骤，方便扩展与维护。

# Spring 事务实现方式

Spring 支持两种事务控制方式：**编程式事务**和**声明式事务**。  
它们的区别不在于“能不能实现”，而在于**事务逻辑放在哪里、谁来控制**。

## 1. 编程式事务

这种方式下，事务的开启、提交、回滚，全都由开发者自己在代码里写。

Spring 提供了 `PlatformTransactionManager` 和 `TransactionTemplate` 这样的 API。

```java
@Transactional
public class WolfService {
    @Autowired
    private PlatformTransactionManager transactionManager;

    public void hunt() {
        DefaultTransactionDefinition def = new DefaultTransactionDefinition();
        TransactionStatus status = transactionManager.getTransaction(def);
        try {
            // 业务逻辑
            transactionManager.commit(status);
        } catch (Exception e) {
            transactionManager.rollback(status);
        }
    }
}
```

**特点**：

- 控制精确灵活；
- 事务边界清晰；
- 但代码冗长、侵入性强，维护成本高。

适合对事务有特殊控制要求的场景，比如多数据源或自定义回滚策略。

---

## 2. 声明式事务（推荐）

这种方式更常用，也就是我们平时加个 `@Transactional` 就能控制事务。

它的核心是基于 **AOP 代理机制**：  
在方法调用时自动完成事务的开启、提交和异常回滚，无需手动写逻辑。

```java
@Service
public class WolfService {

    @Transactional(rollbackFor = Exception.class)
    public void hunt() {
        // 业务逻辑
    }
}
```

**特点**：

- 非侵入式，不影响业务代码；
- 适用于大多数场景；
- 依赖 AOP 代理，注意事务失效问题。

---

## 3. 底层实现机制

无论哪种方式，Spring 的事务最终都交给 `PlatformTransactionManager` 来管理。  
区别在于：

- 编程式：你手动调用 `getTransaction`、`commit`、`rollback`；
- 声明式：AOP 帮你自动完成这一步。

AOP 的事务增强器会在方法执行前开启事务，执行成功后提交，出现异常则回滚。  
这就是 `@Transactional` 能“无感”生效的根本原因。

---

## 一句话总结

> Spring 的事务实现方式分为编程式和声明式。  
> 编程式事务自己控制开启和回滚，灵活但麻烦；  
> 声明式事务通过 AOP 自动完成，是最常用的方式。  
> 底层最终都交给 `PlatformTransactionManager` 来做具体的事务操作。

# IOC 的工作原理（源码）

IOC（控制反转）是 Spring Framework 的核心机制之一。  
所谓 “控制反转”，就是把对象的创建和依赖关系的管理交给 Spring 容器来完成，而不是在业务代码里手动 `new`。

## 1. 收集 Bean 定义信息

容器启动后，首先会扫描配置类或 XML，把所有需要托管的 Bean 的信息解析成 `BeanDefinition`。

`BeanDefinition` 里记录了：

- Bean 的类型（class）
- 是否单例
- 是否懒加载
- 依赖的其他 Bean
- 初始化和销毁方法等

这些元信息会被缓存到一个 `ConcurrentHashMap` 中（BeanDefinitionMap）。

---

## 2. 创建 Bean 对象

当容器准备就绪，或外部第一次请求 Bean 时，会按照 `BeanDefinition` 的信息开始创建对象：

1. 实例化（反射调用构造器）；
2. 属性注入（依赖注入，包括 `@Autowired`、`@Resource`）；
3. 执行 Aware 接口（如果实现了，比如 `ApplicationContextAware`）；
4. 调用 BeanPostProcessor 的 `before` 增强；
5. 调用初始化方法（`@PostConstruct` / `afterPropertiesSet`）；
6. 再次调用 BeanPostProcessor 的 `after` 增强；
7. 最终放进单例池（`singletonObjects`）中。

> 注意：这里 IOC 只是负责 “对象的创建与依赖管理”，而 AOP 是在这之后织入的。

---

## 3. 使用三级缓存解决循环依赖

当 A 依赖 B，B 又依赖 A 时，IOC 会用三级缓存提前暴露一个“未完成的 Bean”引用，避免死循环。

三级缓存分别是：

- 一级：`singletonObjects` —— 完成生命周期的 Bean；
- 二级：`earlySingletonObjects` —— 半成品 Bean；
- 三级：`singletonFactories` —— 可以创建 Bean 的工厂对象。

这个机制保证了依赖注入能正常完成。

---

## 4. 依赖注入的完成

所有 Bean 创建完成后，Spring 已经完成了：

- Bean 之间的依赖装配
- 生命周期方法的调用
- 单例 Bean 的缓存

从这一刻起，业务代码再也不用 `new` 对象，直接通过容器拿。

---

## 一句话总结

> IOC 的本质是：容器在启动时解析 BeanDefinition → 按需或预先实例化 Bean → 处理依赖关系 → 放入单例池 → 提供统一管理。  
> 它通过三级缓存解决循环依赖，通过反射与注解实现自动注入，是整个框架的基石。
