---
title: SpringBootWeb-企业级框架
categories:
  - 猎识印记-领域
excerpt: 'Spring Boot是简化Spring应用开发的框架，本文介绍其基本概念和快速入门案例，帮助读者理解企业级Java开发的基础框架。'
thumbnail: /img/文章封面/SpringBoot.png
tags:
  - 后端
  - Java
  - SpringBoot
published: true
date: 2024-12-01 16:27:02
---

# SpringBootWeb 简介

那么, 什么是 Spring?
官网写着: Spring makes Java simple.

Spring 官网: [https://spring.io](https://spring.io)

Spring 的官方提供很多开源的项目, 发展到今天, 已经形成了一种开发生态圈.
Spring 提供了若干个子项目, 每个项目用于完成特定的功能. 而我们在项目开发时, 一般会偏向于选择这一套 spring 家族的技术, 来解决对应领域的问题.
我们称这一套技术为**spring 全家桶**.

![](../../../../img/文章资源/springbootweb-企业级框架/file-20241201163032365.jpg)

SpringFramework 就是 Spring 家族旗下这么多的技术，最基础、最核心的技术. 其他的 spring 家族的技术, 都是基于 SpringFramework 的.

那这东西这么好, 为什么不用 SpringFramework 而是使用 **springboot** ?
主要是因为:

- 配置繁琐
- 入门难度大

spring 官方推荐我们从另外一个项目开始学习，那就是目前最火爆的 SpringBoot。 通过 springboot 就可以快速的帮我们构建应用程序.

接下来, 用一个简单的入门案例来试试吧!

# 入门案例

需求: 基于 SpringBoot 的方式开发一个 web 应用，浏览器发起请求 `/hello` 后，给浏览器返回字符串 "Hello xxx ~".

### 开发步骤

第 1 步：创建 SpringBoot 工程，并勾选 Web 开发相关依赖
第 2 步：定义 HelloController 类，添加方法 hello，并添加注解

**1). 创建 SpringBoot 工程（需要联网）**

基于 Spring 官方骨架，创建 SpringBoot 工程。

![](../../../../img/文章资源/springbootweb-企业级框架/file-20241202143143930.jpg)

基本信息描述完毕之后, 勾选 web 开发相关依赖.
点击 Create 之后, 就会联网创建这个 SpringBoot 工程, 创建好之后, 结构如下:

![](../../../../img/文章资源/springbootweb-企业级框架/file-20241202145203301.jpg)

**注意：在联网创建过程中，会下载相关资源(请耐心等待)**

由于spring官网并不在国内, 如果遇到下载失败等网络问题, 可以尝试更换为阿里云镜像.
(一般来说不会遇到, 因此不需要配置.)

![](../../../../img/文章资源/springbootweb-企业级框架/file-20241202145824794.jpg)

使用阿里云提供的脚手架, 将网址：https://start.aliyun.com 填入其中.
接着正常创建即可.

**2). 定义 HelloController 类，添加方法 hello，并添加注解**

在 `src\main\java\com.example.xxx\` 下新建一个类：`HelloController`

HelloController 中的内容，具体如下：

```Java
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController //标识当前类是一个请求处理类
public class HelloController {

    @RequestMapping("/hello") //标识请求路径
    public String hello(String name){
        System.out.println("HelloController ... hello: " + name);
        return "Hello " + name;
    }

}
```

**3). 运行测试**

运行 SpringBoot 自动生成的引导类 (标识有`@SpringBootApplication`注解的类)
打开浏览器，输入 `http://localhost:8080/hello?name=Wreckloud

![](../../../../img/文章资源/springbootweb-企业级框架/file-20241202145642753.jpg)


### 案例分析

SpringBoot 如此方便, 这全靠我们刚刚勾选下载的 Spring web **起步依赖** .
在右侧的 Maven 面板中, 就能清晰地看见这些依赖:

![](../../../../img/文章资源/springbootweb-企业级框架/file-20241202151204936.jpg)

web 开发的 **起步依赖** 是 `spring-boot-starter-web`.
而`spring-boot-starter-web`依赖, 又依赖了`spring-boot-starter-tomcat`.
由于 maven 的依赖传递特性, 那么在我们创建的 springboot 项目中也就已经有了 tomcat 的依赖, 也就是内嵌的 tomcat.

![](../../../../img/文章资源/springbootweb-企业级框架/file-20241202151032203.jpg)


而我们运行引导类中的 main 方法, 其实启动的就是 springboot 中内嵌的 Tomcat 服务器.  而我们所开发的项目, 也会自动的部署在该 tomcat 服务器中, 并占用 8080 端口号 .
