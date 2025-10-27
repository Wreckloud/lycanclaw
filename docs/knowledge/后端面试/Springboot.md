---
title: 'Springboot'
date: '2025-10-24 08:55:12'
description: '这是一篇新文章!'
order: 0
publish: true
tags: 
---

# 你是怎么理解 Spring Boot 的？

Spring Boot 本质上不是新技术，而是在 Spring Framework 之上做的**快速开发与部署的整合框架**。  
它的核心目标，是“约定大于配置”，帮我们**减少繁琐的 XML 配置**，让项目能**开箱即用**、迅速启动。

在传统 Spring 中，一个简单的功能往往要自己配 Bean、写配置、集成第三方依赖；  
而在 Spring Boot 中，很多这些步骤都被“自动装配”接管，只需要**导入依赖 + 注解**，就能直接运行。

面试里重点是能说出它的作用和价值：

- 简化配置
- 提高开发效率
- 内嵌 Web 容器，独立运行
- 提供 Starter 依赖体系，一键集成常用组件

Spring Boot 是 Spring 的提效利器，让开发更轻、部署更快、集成更稳。

# Spring Boot 自动装配原理

Spring Boot 启动时，会自动**加载依赖的 jar 包**，然后在每个 jar 包下查找 `META-INF/spring.factories` 文件。  
这个文件里记录着一堆自动装配类，Spring Boot 会根据它来自动注册和初始化组件。

1. **启动时加载所有依赖**  
   读取 classpath 下所有 jar 包。
2. **定位 spring.factories**  
   找到 `spring.factories`，读取其中 `EnableAutoConfiguration` 对应的自动配置类列表。
3. **按条件生效**  
   每个自动配置类都有条件注解（如 `@ConditionalOnClass`、`@ConditionalOnMissingBean` 等）。  
   只有满足条件的，才会真正装配进容器中。
4. **最终注册 Bean**  
   满足条件的配置类会被加载，Spring 容器中就多了一批“你没写但已经帮你配好”的 Bean。

自动装配 = 找配置 → 读配置 → 按条件生效 → 注册 Bean”

# 【进阶】Spring Boot 如何自定义 Starter

Spring Boot 的 Starter 其实就是**一套约定好自动装配规则的依赖包**，让项目一引用就能自动完成初始化配置。  
我们也可以自定义 Starter，把常用功能封装好给别的项目用，这在企业项目里很常见。

整个过程的核心逻辑是：**写好配置类 → 加上自动装配注解 → 注册进 `spring.factories`**。

1. **新建 Starter 工程，导入依赖**  
   这一步就像建一个普通模块，准备好你希望封装的功能代码。
2. **编写配置类 + 条件注解**  
   配置类上使用 `@Configuration` 表明它是 Spring 配置；  
   使用 `@ConditionalOnClass` 等条件注解，保证“只有导入对应依赖时”才生效，避免无谓加载。
3. **自动装配**  
   在这个配置类里，写上需要交给 Spring 管理的 Bean，  
   然后用 `@EnableConfigurationProperties` 或其他方式完成装配。
4. **注册 spring.factories**  
   在 `resources/META-INF/` 目录下创建 `spring.factories` 文件，  
   把你的自动配置类写进去，Spring Boot 启动时就能自动发现并加载它。
5. **打包发布**  
   Starter 本质上就是一个 jar 包，  
   打包发布后，在其他项目中直接引入依赖即可实现“零配置”接入。

换句话说，自定义 Starter 的重点就是把**原本散落在项目里的配置逻辑集中封装**，  
让别人引入一个依赖，就能像用官方 Starter 一样用上你的功能。

# Spring Boot 核心注解与启动流程

Spring Boot 能“一行 main 方法跑起来”，背后靠的就是几个核心注解和启动机制的组合拳。  
这些注解看似简单，但每个都扮演着关键角色。

`@SpringBootApplication` 是启动的根，`run()` 是引擎的开关，自动装配是灵魂，让 Spring Boot 真正实现了“零配置”启动。

### @SpringBootApplication

这是 Spring Boot 的**总开关**，相当于把三个注解合并在一起使用：

- `@SpringBootConfiguration`：声明这是一个 Spring Boot 配置类，等价于传统的 `@Configuration`。
- `@EnableAutoConfiguration`：启用自动装配，扫描 classpath 下所有依赖 jar 中的 `spring.factories`，完成 Bean 注册。
- `@ComponentScan`：开启包扫描，让项目自己的 Bean 能被自动发现并注入。

所以，当我们在主启动类上写 `@SpringBootApplication` 时，Spring Boot 实际已经自动完成了**配置加载 + Bean 注册 + 包扫描**三件事。

### run 方法的启动过程

调用 `SpringApplication.run(...)` 是 Spring Boot 应用的起点。整个启动分为两大步骤：

1. **创建 Spring 容器**  
   根据应用类型（Web / 非 Web），创建对应的上下文环境，并加载自动配置类。
2. **启动 Web 容器**  
   如果是 Web 应用，会自动启动内嵌的 Apache Tomcat（或其他容器），完成监听与服务准备。

这套机制保证了我们不再需要手动去配置 servlet、容器、监听器等内容。一个 `main` 方法，就能让应用跑起来。
