---
title: 'Springboot'
date: '2025-10-24 08:55:12'
description: '这是一篇新文章!'
order: 0
publish: true
tags:
  - SpringBoot
  - 面试
  - 自动配置
---

# 你是怎么理解 Spring Boot 的？

Spring Boot 不是一门新技术，而是对 Spring 的封装与增强，目的是降低配置成本、加快项目的启动和部署。它通过内嵌容器、起步依赖和自动装配，让开发者能更快地搭建可运行的应用，而不必花大量时间在繁琐的配置上。

这种“约定优于配置”的设计理念，让团队能更专注于业务开发，而不是框架本身。

# Spring Boot 自动装配原理

Spring Boot 的自动装配本质上是通过 **读取依赖包中的配置文件**，在启动时**按需向容器注册 Bean**。

当应用启动时，Spring Boot 会扫描所有依赖包下的 `META-INF/spring.factories` 文件，读取其中配置的自动配置类列表（`EnableAutoConfiguration`），然后判断这些自动配置类的生效条件。如果条件满足，就把对应的组件自动注册进 Spring 容器中，无需手动配置。

这背后的关键机制：

- 启动时扫描 `spring.factories`
- 加载 `EnableAutoConfiguration` 对应的自动配置类
- 通过条件注解判断是否生效
- 满足条件则向容器中注册组件

这种“按需装配”的机制，让开发者只需引入依赖，Spring Boot 就能完成自动配置，大大减少了样板代码和 XML 配置。

# Spring Boot 核心注解与启动流程

### @SpringBootApplication

`@SpringBootApplication` 是 Spring Boot 项目的入口注解，标记该类为主启动类，并开启自动配置功能。它是一个组合注解，内部集成了以下三个核心注解：

- `@SpringBootConfiguration`：标记当前类是一个配置类，相当于 Spring 的 `@Configuration`。
- `@EnableAutoConfiguration`：开启自动装配，扫描依赖包下的 `spring.factories` 文件，并把满足条件的自动配置类加载进容器。
- `@ComponentScan`：开启包扫描，自动加载当前包及其子包下的组件。

应用启动时，`SpringApplication.run(...)` 会以这个类为入口，完成应用上下文的创建、自动装配和 Web 容器的启动。这也是 Spring Boot 项目不再需要大量 XML 配置的根本原因。

### run 方法的启动过程

Spring Boot 应用是通过 `SpringApplication.run()` 启动的。这个方法的核心作用就是**创建并启动 Spring 容器**，以及**启动 Web 服务器**（如果是 Web 项目）。

启动过程包含两个关键步骤：

- **创建 Spring 容器**：根据应用类型（普通应用或 Web 应用）来创建合适的 ApplicationContext，例如 `AnnotationConfigServletWebServerApplicationContext`。
- **启动 Web 容器**：如果是 Web 应用，会进一步启动内嵌的 Web 容器（如 Tomcat），完成项目的对外服务能力。

这两个步骤完成后，自动装配和组件扫描也会在这个阶段完成，整个应用就进入可运行状态。
