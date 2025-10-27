---
title: 'springMVC'
date: '2025-10-20 16:27:29'
description: '这是一篇新文章!'
order: 0
publish: true
tags: 
---

# SpringMVC 请求流程

SpringMVC 的核心是 **`DispatcherServlet` 作为前端控制器**，它负责把请求分发给对应的 Controller，再把处理结果渲染回页面。整个流程大致分为五步。

当客户端发起请求时，会先被 DispatcherServlet 拦截；它根据 HandlerMapping 找到能处理这个请求的 Handler，再通过 HandlerAdapter 去调用 Controller 中的方法，执行后返回 ModelAndView，最后交给视图解析器完成页面渲染并响应给客户端。

- **入口：DispatcherServlet 拦截请求**
- **映射：HandlerMapping 找到对应的处理器**
- **执行：HandlerAdapter 调用 Controller 方法，返回 ModelAndView**
- **解析：ViewResolver 把逻辑视图名解析成真正的视图**
- **渲染：渲染页面并返回给浏览器**

拦截 → 映射 → 执行 → 解析 → 渲染，这就是 SpringMVC 处理请求的基本流程。

# 了解 springmvc 中常见组件

SpringMVC 的核心运行依赖一组内置组件，每个组件都在请求处理链上承担不同职责，绝大部分都在 `DispatcherServlet` 初始化时完成装配。实际面试中，不需要把所有组件都背下来，重点掌握其中常用的几个就够了。

- **MultipartResolver**：文件上传解析器，处理多部分表单请求（如文件上传）。
- **LocaleResolver**：国际化解析器，用于根据请求信息确定语言和区域。
- **ThemeResolver**：主题解析器，一般较少用。
- **HandlerMapping**：用于保存“请求 URL → 对应处理器（Controller）”的映射关系。
- **HandlerAdapter**：处理器适配器，通过反射调用目标处理器方法。
- **HandlerExceptionResolver**：异常解析器，用于统一处理控制器执行过程中的异常。
- **RequestToViewNameTranslator**：把请求转换为视图名，较少用。
- **FlashMapManager**：在重定向后临时保存数据，避免 request 信息丢失。

在这些组件中，实际开发和面试重点是：

- **HandlerMapping**（定位处理器）
- **HandlerAdapter**（执行处理器）
- **HandlerExceptionResolver**（异常处理）
- **MultipartResolver**（文件上传）

其他组件只需知道作用场景即可。

# 了解 springmvc 异常是怎么处理的？

SpringMVC 在请求执行过程中，如果出现异常，会交给 `DispatcherServlet` 来统一处理。它会遍历系统中配置的所有异常解析器（`HandlerExceptionResolver`），找到能处理该异常的解析器，再由解析器返回相应的视图或响应内容。

SpringMVC 内置了三种常用的异常解析器：

- **ExceptionHandlerExceptionResolver**：  
   处理标注了 `@ExceptionHandler` 的方法。开发者可以在 Controller 中自定义异常处理逻辑，是最常用的方式。
- **ResponseStatusExceptionResolver**：  
   处理标注了 `@ResponseStatus` 的异常类，通过 HTTP 状态码来返回结果，比如 404、500 等。
- **DefaultHandlerExceptionResolver**：  
   处理一些 SpringMVC 预定义的标准异常，比如参数类型不匹配、请求方式不支持等。

实际面试中重点记住：

- SpringMVC 通过 **遍历解析器链**来定位能处理异常的解析器。
- 一般项目中主要依赖 `@ExceptionHandler`（局部） 或全局异常处理类（配合 `@ControllerAdvice`）。

# 拦截器与过滤器？

过滤器（Filter）和拦截器（Interceptor）都能实现请求拦截，但它们处于不同的执行阶段，也依赖不同的机制。

- **过滤器** 是 Servlet 规范的一部分，需要 Web 容器支持，在请求进入 SpringMVC 之前就会生效。
- **拦截器** 是 SpringMVC 提供的机制，不依赖容器，只能拦截到到达 Controller 层的请求。

两者的对比核心在于：

**运行时机**：

- 过滤器 → 在进入 `DispatcherServlet` 之前
- 拦截器 → 进入 Controller 前后（可以控制方法调用前后和完成时机）

**拦截范围**：

- 过滤器 → 能拦截所有资源，包括静态资源
- 拦截器 → 只能拦截映射到 Controller 的请求

**使用场景**（面试常问）：

- 过滤器：统一编码设置、跨域处理、安全校验等。
- 拦截器：权限验证、Token 校验、黑名单控制、接口风控等。

简单说，过滤器更底层、范围更广；拦截器更灵活，适合业务层面控制。  
很多项目里两者是**结合使用**的。

# spring 的父子容器？

在 `Spring + SpringMVC` 的环境中，会存在两个独立的 Spring 容器：

- **父容器**：由监听器加载（通常是 `ContextLoaderListener`），主要负责管理 Service、Dao 层等业务 Bean。
- **子容器**：由 `DispatcherServlet` 加载，主要管理 Controller 层的 Bean。

父子容器之间是单向可见的：  
子容器可以访问父容器中的 Bean，但父容器无法访问子容器中的 Bean。两者的 `properties` 配置也相互独立，互不干扰。

这种设计的意义在于：

- 保持业务逻辑与表现层的解耦；
- 支持多个 `DispatcherServlet` 共享同一个父容器；
- 保证 Controller 层不污染核心业务 Bean 的生命周期。

# springmvc 中常见注解

SpringMVC 提供了一系列注解来简化请求的映射与参数绑定，大部分都直接围绕 **请求路径** 和 **数据传递** 展开。实际项目中，`@RequestMapping`、`@RequestBody`、`@ResponseBody` 和 `@RestController` 是最常用的组合。

在面试中，清楚它们各自的职责和常用搭配即可。

- **@RequestMapping**：  
   用于映射请求路径到控制器方法上，可指定 URL、请求方式、请求头等信息，是最基础的请求映射注解。
- **@RequestBody**：  
   用于把请求体中的 JSON/XML 数据直接绑定到方法参数对象上，常用于 POST 接口。
- **@PathVariable**：  
   把 URL 路径中的变量绑定到方法参数上，例如 `/user/{id}`。
- **@RequestParam**：  
   把请求参数（通常是 `?key=value`）绑定到方法参数上，可以设置是否必填和默认值。
- **@ResponseBody**：  
   把方法返回值直接写入响应体，而不是解析为视图。常用于前后端分离接口。
- **@RestController**：  
   是 `@Controller + @ResponseBody` 的组合，常用于 RESTful 接口开发。
- **@RequestHeader**：  
   用于绑定请求头中的信息到方法参数，比如 `token`、`User-Agent` 等。

掌握这些注解的使用场景，就能覆盖绝大多数 Web 接口开发需求。

要继续下一题吗？👉 “springmvc 源码（组件初始化与请求处理）”

# springmvc 源码

SpringMVC 的底层流程可以拆成三个关键阶段：**父子容器的形成**、**组件初始化与数据收集**、**请求处理**。这三步串起来，就是整个 SpringMVC 的核心运行机制。

在项目启动时，监听器会先加载 **父容器**，Servlet 生命周期方法再加载 **子容器**，并完成父子容器的关联。随后框架会完成组件初始化与数据收集，例如扫描请求路径和 Controller 的映射关系，并准备好处理请求的各个组件。

1. **父子容器的形成**

   - 父容器在监听器中初始化，子容器在 `DispatcherServlet` 初始化时创建并与父容器绑定。
   - 子容器可以访问父容器的 Bean，父容器无法访问子容器的 Bean。

2. **数据收集与组件初始化**

   - 部分组件（如 `HandlerMapping`）需要在容器启动时收集请求与处理器的映射信息。
   - 这种收集逻辑是在实现 `InitializingBean` 接口的 `afterPropertiesSet` 方法中完成的。
   - 九大组件会在 `DispatcherServlet` 的 `onRefresh` 阶段完成初始化：  
      `initStrategies` 会从 IoC 容器中查找对应组件，找不到就使用默认实现。

3. **请求处理流程**

   - 请求进入 `DispatcherServlet` 后，会按以下调用链执行：

```
HttpServlet → HttpServletBean → FrameworkServlet → DispatcherServlet → doService → doDispatch
```

- 在 `doDispatch` 方法中完成：
  - 找到处理器（HandlerMapping）
  - 适配处理器（HandlerAdapter）
  - 执行目标方法
  - 视图解析与渲染

掌握这三个阶段，已经可以覆盖大多数“SpringMVC 源码”类的面试问题。  
如果面试官再深入，可以提到 `DispatcherServlet` 作为前端控制器，`initStrategies` 和 `doDispatch` 是源码中最关键的两个入口方法。
