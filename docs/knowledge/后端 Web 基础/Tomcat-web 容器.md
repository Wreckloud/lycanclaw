---
title: Tomcat-web 容器
date: 2025-08-28 14:16:22
description: 这是一篇新文章!
order: 2
publish: true
tags:
---

当我们谈到 Java Web 开发，第一个绕不开的就是 **Tomcat**。  
它是由 Apache 基金会维护的开源软件，定位是 **轻量级 Web 服务器**，更准确地说，是一个 **Servlet/JSP 容器**。

在 Web 世界里，服务器的职责并不相同：

- **Web 服务器**（如 Nginx、Apache httpd）：偏重于提供静态资源，例如 HTML、CSS、图片文件。
- **应用服务器**（如 JBoss/WildFly、GlassFish）：完整实现 Jakarta EE （Java EE）规范，功能齐全，能处理事务、消息、远程调用等复杂企业需求。

而 Tomcat 处于两者之间，**只实现 Jakarta EE 中最核心的 Servlet/JSP 部分**。它不追求“大而全”，而是专注于让 Java Web 程序能跑起来。

所以我们称 Tomcat 为 Servlet 容器。它的工作方式很直接：

1. 接收浏览器发来的 HTTP 请求；
2. 根据请求找到对应的 Servlet 程序，并调用其中的方法；
3. 将结果再封装为 HTTP 响应返回给浏览器。

Servlet 程序离开 Tomcat，就无法单独运行。

Tomcat 只实现了 Servlet 与 JSP，足够支持大部分 Web 开发需求。不过其他如 EJB、JMS、JTA 等，需要更重型的应用服务器才能用。

这使它保持了轻量、简单、易用的特性。

# Tomcat 基本使用

Tomcat 的使用非常简单，它是一个“解压即用”的软件，不需要复杂的安装过程。

### 下载与安装

前往 [Tomcat 9 下载页](https://tomcat.apache.org/download-90.cgi)，在页面中找到 **Binary Distributions（二进制发行版）** 区域，这是下载入口。

![](../../public/images/文章资源/tomcat-web-容器/file-20250830125426982.jpg)

在该区域的 **Core** 分类下，会列出几种不同的分发格式，直接聚焦我们需要的文件：

- **`zip`** —— 通用压缩包，适合 Windows、macOS、Linux，下载后解压即可使用。
- **`tar.gz`** —— Linux/macOS 常用的压缩格式。

通常推荐选择 **`zip` 包**，方便“绿色版”直接解压使用。如果需要安装为服务运行，可以使用 **Windows Installer**。

如果你需要下载不同版本（例如 Tomcat 8、Tomcat 10），可以在 [Tomcat 官网首页](https://tomcat.apache.org/) 的 **Download** 菜单下找到对应版本的入口：

- [Tomcat 10](https://tomcat.apache.org/download-10.cgi)（支持 Jakarta 命名空间，适配 Spring Boot 3 等新框架）
- [Tomcat 8](https://tomcat.apache.org/download-80.cgi)（老版本，适配较旧的 Servlet/JSP 规范）
- [Tomcat Archive](https://archive.apache.org/dist/tomcat/)（历史归档，包含所有已发布的旧版本）

好 🐺，我帮你把 **启动与关闭** 和 **部署项目** 合并整理成一个部分，表达更连贯、读起来不卡：

## 启动、关闭与部署

Tomcat 是“解压即用”的软件，启动和关闭都依赖于 `bin` 目录下的脚本文件。

**Windows 平台**：使用 `.bat` 脚本。

- 启动：双击 `bin/startup.bat`
- 正常关闭：执行 `bin/shutdown.bat`，或在运行窗口中按下 `Ctrl + C`
- 强制关闭：直接关闭命令行窗口（可能导致端口未释放）

**Linux / macOS 平台**：使用 `.sh` 脚本。

- 启动：`bin/startup.sh`
- 关闭：`bin/shutdown.sh`

项目部署后，Tomcat 默认会监控 `webapps/` 目录，：

- **部署 war 包**：将打包好的 `xxx.war` 文件放入 `webapps/` 中，Tomcat 启动时会自动解压并加载。
- **部署目录**：也可以直接将项目目录放入 `webapps/`，效果与 war 包相同。

无论采用哪种方式，只要 Tomcat 成功启动，对应的项目就能通过浏览器访问。

## 配置 Tomcat

- 乱码问题

第一次启动 Tomcat 时，控制台输出一般都会出现中文乱码，通常是日志编码设置不对。
在 `conf/logging.properties` 中，将以下配置行的编码设置为 UTF‑8：

```properties
java.util.logging.ConsoleHandler.encoding = UTF-8
```

这样控制台输出（尤其是中文）就会正常显示，不再乱码。

- 端口占用

若启动 Tomcat 后出现如下错误：

```
java.net.BindException: Address already in use
```

那是因为默认监听的端口（通常是 8080）已被其他程序占用，或者之前的 Tomcat 实例未正常关闭。解决方式有两种：

1. **终止占用端口的进程**  
   Windows 上使用命令查看占用情况，并记下 PID：

   ```bash
   netstat -ano | find "8080"
   ```

   然后打开任务管理器找到该 PID 并结束它。

2. **修改监听端口**  
   打开 `conf/server.xml`，找到 Connector 配置，例如：

   ```xml
   <Connector port="8080" protocol="HTTP/1.1"
              connectionTimeout="20000"
              redirectPort="8443" />
   ```

   将 `port="8080"` 改为如 `9090` 的其他端口，保存文件后重启 Tomcat 即可。

## Servlet 入门

**Servlet** 是运行在 Web 服务器中的小型 Java 程序，是 Java 提供的一种 **动态 Web 资源开发技术**。  
它的工作方式：通过 HTTP 协议接收客户端请求 → 在服务器端处理 → 再返回响应。

在规范层面上，Servlet 属于 **Jakarta EE（原 Java EE）** 的一部分。本质上它只是一个接口：

- 开发者可以 **实现 `Servlet` 接口**，或更常见的是 **继承 `HttpServlet` 类**。
- Servlet 的运行需要依赖 Web 容器（如 Tomcat），容器负责管理 Servlet 的生命周期和调用。

总之，Servlet 不能单独运行，必须交给 Tomcat 这样的容器来调度。

### 实现一个 Servlet

**需求**：编写一个 Servlet，当浏览器访问 `/hello` 时，返回 `"Hello, xxx"`。

#### 1. 创建 Maven 项目

在 `pom.xml` 中设置打包方式为 `war`：

```xml
<packaging>war</packaging>
```

#### 2. 引入依赖

在依赖中添加 Servlet API（provided 范围，不会打进包里，运行时由容器提供）：

```xml
<dependency>
    <groupId>javax.servlet</groupId>
    <artifactId>javax.servlet-api</artifactId>
    <version>4.0.1</version>
    <scope>provided</scope>
</dependency>
```

#### 3. 编写 Servlet 类

定义一个类继承 `HttpServlet`，重写 `doGet` 方法，并通过注解映射访问路径：

```java
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

@WebServlet("/hello")
public class HelloServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String name = req.getParameter("name"); // 获取请求参数
        String respMsg = "<h1>Hello, " + name + " ~</h1>";
        resp.setContentType("text/html;charset=UTF-8");
        resp.getWriter().write(respMsg); // 写出响应
    }
}
```

在 Servlet 中最常接触的两个对象：

- **`HttpServletRequest`**：请求对象，封装了客户端发来的请求数据（如参数、请求头、URL 等）。
- **`HttpServletResponse`**：响应对象，封装了服务器返回给客户端的数据（如状态码、响应头、响应体）。

容器在调用 `doGet` 或 `doPost` 方法时，会自动把这两个对象传递给你。

### 在 IDEA 中配置 Tomcat

1. 打开 **Edit Configurations** → 点击 **+** → 选择 **Tomcat Server → Local**。
2. 配置 Tomcat 目录、版本和端口号。
3. 切换到 **Deployment** 选项卡，点击 **+** 添加要部署的模块（如 `servlet-demo:war`）。
4. **Application context** 默认为 `/demo`，可以修改，这会影响访问路径：

   - `/demo/hello` → 访问上面编写的 `HelloServlet`。

## Servlet 执行流程

当我们完成代码编写、配置并启动 Tomcat 后，就可以在浏览器中访问 Servlet。  
例如：

```
http://localhost:8080/servlet-demo/hello?name=Wreckloud
```

这个 URL 可以拆解为：

- `http` → 使用的协议
- `localhost` → 服务器地址（本机）
- `8080` → Tomcat 默认端口
- `/servlet-demo` → Web 应用的上下文路径（Application Context）
- `/hello` → Servlet 的访问路径（由 `@WebServlet("/hello")` 指定）
- `?name=Wreckloud` → 请求参数

### 容器的处理过程

1. **Tomcat 接收请求**  
   浏览器发送请求后，Tomcat 作为 Servlet 容器会先接收并解析请求。
2. **定位 Servlet**  
   容器根据 URL 中的访问路径（如 `/hello`），找到对应的 Servlet 类。
3. **调用方法**

   - 如果请求方式是 **GET**，容器会调用该类的 `doGet()` 方法。
   - 如果请求方式是 **POST**，则调用 `doPost()` 方法。
   - 其他如 DELETE、PUT 等，对应调用 `doDelete()`、`doPut()`。

4. **执行逻辑并生成响应**  
   Servlet 方法内部会处理请求数据，并通过 `HttpServletResponse` 对象将结果写回。
5. **Tomcat 返回响应**  
   容器将响应数据封装成标准的 HTTP 响应报文，返回给浏览器。

一句话概括：

```
浏览器请求 → Tomcat 接收并解析 → 找到目标 Servlet → 调用相应方法(doGet/doPost...) → 返回响应
```
