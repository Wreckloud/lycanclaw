---
title: Tomcat-web 容器
date: 2025-08-28 14:16:22
description: 这是一篇新文章!
order: 0
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

### 启动与关闭

- **Windows**：通过 `.bat` 脚本启动或关闭。
  - 启动：双击 `bin/startup.bat`
  - 正常关闭：执行 `bin/shutdown.bat` 或在运行窗口中按 `Ctrl + C`
  - 强制关闭：直接关闭命令行窗口（不推荐，可能导致未释放端口）
- **Linux / macOS**：使用对应的 `.sh` 脚本。
  - 启动：`bin/startup.sh`
  - 关闭：`bin/shutdown.sh`

### 部署项目

Tomcat 默认会监控 `webapps/` 目录：

- 将打包好的 `war` 文件放入 `webapps/` 中，Tomcat 会在启动时自动解压并部署。
- 也可以直接放置一个项目目录，效果相同。

---

这样就把“下载、安装、启动、关闭、部署”完整串起来了：逻辑自然、文字连贯，同时保留了 Windows / Linux 的区别。

🐺 要不要我在这部分再补一个“目录结构速览”（bin/conf/webapps/logs/lib 各做什么）？那样整篇会更有连贯性。

在 [Tomcat 官网下载](https://tomcat.apache.org/download-90.cgi) 提供了所有版本的下载和文档，是获取最新信息的最佳入口。

基本使用
下载：官网下载，地址 https://tomcat.apache.org/download-90.cgi
安装：绿色版，直接解压即可
卸载：直接删除目录即可
启动：双击 bin/startup.bat
关闭：
A 直接 × 掉运行窗口：强制关闭
Abin/shutdown.bat：正常关闭
Ctrl+C：正常关闭
部署项目：将项目放置在 webapps 目录下，即部署完成

windows 是 。bat Linux 是 sh

### 配置 Tomcat

刚刚启动时，控制台显示一堆乱码， 我们打开 conf， 找到 logginng。pr 配置文件。 控制台日志编码配置：
49java.util.logging.ConsoleHandler.level = FINE
50java.util.logging.ConsoleHandler.formatter = org.apache.juli.oneLineFormatter
51java.util.logging.ConsoleHandler.encodingUTYGBK

把原先的编码格式转换成 UTF-8.

当启动一个 tomcat 之后， 又启动新的 comtat， 就会报错
Caused by:java.net.BindException:AAddress alreadyin use:bind
lethod

很多情况 我们可能不像现在一样， 知道是谁在占用端口，我们可以修改新程序的端口占用，同样是在 conf 文件夹下， 找到 server

<Connectorport="8080"protocOl="HTTP/1.1"
connectionTimeout="2o0oo"
redirectPort="8443"/>

把这里 8080 改成其他的， 然后保存， 就行。

不过， 我们也可以想办法找到这个程序， 将他终止掉：

打开 cmd， 输入被占用的 8080：

netstat-anofindstr8080

TCP0.0.0.0:80800.0.0.0:0LISTENING36880
TCP10.254.2.9:54720183.47.100.43:8080ESTABLISHED7688
TCP10.254.2.9:54781183.47.117.195:8080CLOSE_WAIT7688
TCP[::]:8080[::]:0LISTENING36880

这么一大堆， 我们只需要看第一个， 看到这个 36880， 他就是 PID 进程 id， 然后在任务管理器种找打他就可以结束了。

# Servlet

Tomcat 我们也称为 Servlet

什么是 Servlet?
ServLet 是运行在 Web 服务器中的小型 java 程序，是 Java 提供的一门动态 web 资源开发技术。通常通过 HTTP 协议接收和响应来自于客
户端的请求。
：Servlet 是 JavaEE 规范之一，其实就是一个接口（定义 Servlet 需实现 Servlet 接口或 继承 HttpServlet），并由 web 服务器运
行 Servlet.

需求：使用 Servlet 开发一个 Web 应用，浏览器发起请求/hello 之后，给浏览器返回一个字符串"HelloXxx"。

步骤

准备：创建 maven 项目（设置打包方式为 war），

```
<packaging>war</packaging>
```

导入 Servlet 坐标（provided）

```
<dependency>
<groupId>javax.servlet</groupId>
<artifactId>javax.servlet-api</artifactId>
<version>4.0.1</version>
<scope>provided</scope>主程序、测试程序可用，不参与打包
</dependency>
```

开发：
定义一个类，实现 Servlet 接口（继承 HttpServlet），并实现所有方法。
在 Servlet 类上使用 awebServlet 注解，配置该 Servlet 的访问路径。

```
public class HelloServlet extends HttpServlet {
@Override
protected void doGet(HttpServletRequest req，HttpServletRequest resp）{
String name =req·getParameter("name")；//接收请求参数
String respMsg = "<h1>Hello,"+name +"~</h1>"；
resp.getWriter(）.write(respMsg)；//响应结果
```

- HttpServletRequest 请求对象是什么
- HttpServletRequest 相应对象是什么

在 IDEA 配置 tomcat

在 IDEA 启动按钮的左边， EditConfigurations.. 点开， 点击 + 添加。

选择 Tomcat Server 选择 Loacl 进入配置面板。

然后配置确认 server 版本， 确认端口号。

此时还没完， 注意到界面下面有一个警告 Warning:Noartifactsmarkedfordeployment
说现在没部署任何的应用， 我们点击 Deployment 选项卡， 点击 +
选择第一个 servlet-demo：war

下面的 Application context:/demo
可以改也可以默认， 影响的是访问路径例如

# Servlet 执行流程

我们写好代码配置好然后启动

http:（协议）//localhost（IP 号）:8080（端口号）/servlet-demo/（服务和项目地址）hello?name=Heima（资源地址）

通过 url 上的 表示， 找到对应的类上对应的标识。如果这是一个 get 请求， 他就会取找对应的 doget 方法（post delet 等等）

找到 get 方法后就执行他，并响应结果
