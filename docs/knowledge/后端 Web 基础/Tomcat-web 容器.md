---
title: Tomcat-web 容器
date: 2025-08-28 14:16:22
description: 这是一篇新文章!
order: 0
publish: false
tags:
---

念：Tomcat 是一个开源免费的轻量级 Web 服务器，是 Apache 软件基金会的核心项目，支持 Servlet/JSP 少量
JavaEE(JakartaEE)规范。
JavaEE：JavaEnterpriseEdition，Java 企业版。指 Java 企业级开发的技术规范总和。包含 13 项技术规范:
JDBC、JNDI、EJB、RMI、JSP、(Servlet)XML、JMS、Java IDL、JTS、JTA、JavaMail、JAF。
Tomcat 也被称为 Web 容器、Servlet 容器。Servlet 程序需要依赖于 Tomcat 才能运行。
官网: https://tomcat.apache.org/

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
定义一个类，实现Servlet接口（继承HttpServlet），并实现所有方法。
在Servlet类上使用awebServlet注解，配置该Servlet的访问路径。
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

在 IDEA 配置tomcat

在IDEA启动按钮的左边， EditConfigurations.. 点开， 点击 + 添加。

选择Tomcat Server 选择Loacl 进入配置面板。

然后配置确认server版本， 确认端口号。

此时还没完， 注意到界面下面有一个警告 Warning:Noartifactsmarkedfordeployment
说现在没部署任何的应用， 我们点击Deployment选项卡， 点击 + 
选择第一个 servlet-demo：war

下面的Application context:/demo
可以改也可以默认， 影响的是访问路径例如


# Servlet 执行流程

我们写好代码配置好然后启动

http:（协议）//localhost（IP号）:8080（端口号）/servlet-demo/（服务和项目地址）hello?name=Heima（资源地址）

通过url上的 表示， 找到对应的类上对应的标识。如果这是一个get请求， 他就会取找对应的doget方法（post delet 等等）

找到get方法后就执行他，并响应结果