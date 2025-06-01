---
title: Http协议 简介
categories:
  - 猎识印记-领域
excerpt: 'Hypertext Transfer Protocol（超文本传输协议）, 规定了浏览器和服务器之间互相通信的规则.'
thumbnail: /img/文章封面/HTTP.png
tags:
  - 计算机基础
  - 网络协议
  - Web开发
published: true
date: 2024-12-01 16:14:24
---

# HTTP 概述

![](../../../../img/文章资源/http协议-简介/file-20241202103720114.jpg)

HTTP 是一种基于请求-响应模型的无状态、文本格式的通信协议, 用于规范互联网上客户端与服务器之间的数据交换.

- HTTP 基于 TCP/IP 协议: 面向连接, 安全.
- HTTP 基于请求-响应模型: 一次请求对应一次次响应.
- HTTP 是无状态协议: 服务器不会保存客户端的状态信息, 每一次 请求-响应 都是独立的.

> HTTP 的无状态使访问速度快, 但多次请求无法共享数据.

在浏览器中 按下 `F12` 打开开发者工具, 再点击 `Network(网络)` 就可清晰地查看到 http 协议的数据传输格式:

![](../../../../img/文章资源/http协议-简介/file-20241202152358248.jpg)

浏览器向服务器进行请求时, 服务器按照固定的格式进行解析.
服务器向浏览器进行响应时, 浏览器按照固定的格式进行解析.

这种固定格式, 就是 HTTP 规定, 接下来将会介绍请求和响应数据的具体格式内容.

### HTTP 请求协议

**请求协议**: 浏览器将数据以请求格式发送到服务器. 包括：**请求行、请求头 、请求体**
请求方式主要有两种:

**.1) GET:**

请求参数在请求行中, 没有请求体, 安全性较低. GET 请求大小是受限的.

![](../../../../img/文章资源/http协议-简介/file-20241202153136920.jpg)

- 请求行: 请求数据第一行(请求方法(GET)、资源路径、协议)

```HTTP
GET(方式为GET) /brand/findAll?name=OPPO&status=1(资源路径) HTTP/1.1(协议)
```

{% notel default fa-info GET 的请求参数 %}
请求行的资源路径包含了 GET 的请求参数.
例如图中的请求:

> 请求路径：/brand/findAll
> 请求参数：name=OPPO&status=1

GET的请求参数是以 `key=value` 形式出现
多个请求参数之间使用`&`连接
请求路径和请求参数之间使用`?`连接
{% endnotel %}


- 请求头: 第二行开始, 格式为键值对 key: value.
  在请求头设置浏览器的一些自身信息和想要响应的形式, 这样服务器在收到信息后，就知道做什么了.

常见的 HTTP 请求头有:

| 请求头          | 含义                                                                                                                             |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Host            | 表示请求的主机名                                                                                                                 |
| User-Agent      | 浏览器版本。 例如：Chrome 浏览器的标识类似 Mozilla/5.0 ...Chrome/79 ，IE 浏览器的标识类似 Mozilla/5.0 (Windows NT ...)like Gecko |
| Accept          | 表示浏览器能接收的资源类型，如 text/*，image/*或者*/*表示所有；                                                                  |
| Accept-Language | 表示浏览器偏好的语言，服务器可以据此返回不同语言的网页；                                                                         |
| Accept-Encoding | 表示浏览器可以支持的压缩类型，例如 gzip, deflate 等。                                                                            |
| Content-Type    | 请求主体的数据类型                                                                                                               |
| Content-Length  | 数据主体的大小（单位：字节）                                                                                                     |

- 请求体: POST 请求时, 存放请求参数(GET 请求没有请求体, GET 请求的请求参数在请求行中).

**.2) POST:**

请求参数在请求体中, 安全性较高. POST 请求大小不受限制.

### HTTP 响应协议

响应协议就是响应数据的格式.  
HTTP 响应与请求类似, 由三部分组成:

- 响应行: 响应数据第一行 (协议版本、状态码、状态描述)
- 响应头: 第二行开始, 格式为键值对 key: value.
- 响应体: 响应内容, 如 HTML 页面, 图片, 文件等.

状态码大类别主要有:

- 1xx: 响应中-临时状态码, 表示请求已被服务器接收, 继续处理.
- 2xx: 成功状态码, 表示请求已成功被服务器接收.
- 3xx: 重定向状态码, 表示请求需要进一步的操作, 如需跳转.
- 4xx: 客户端错误状态码, 如请求了不存在的页面, 服务器无法响应.
- 5xx: 服务器错误状态码, 如服务器内程序抛出异常.

最常见的响应状态码有:

| 状态码                      | 描述                            |
| --------------------------- | ------------------------------- |
| 200 `OK`                    | 客户端请求成功.                 |
| 404 `Not Found`             | 服务器找不到客户端所请求的资源. |
| 500 `Internal Server Error` | 服务器内部错误, 无法完成请求.   |

### HTTP 解析

HTTP 解析是指把 HTTP 请求和响应数据解析成可读的格式, 方便人类阅读.  
而 Tomcat 就是一个 HTTP 解析器, 可以把 HTTP 请求和响应数据解析成 HTML 页面, 方便浏览器显示.

#### Tomcat 简介

Web 服务器 用于托管网站内容, 也可以处理客户端的请求, 并返回相应的响应.

Tomcat 是一个开源的 Web 服务器软件, 由 Sun 公司开发, 是 Apache HTTP 服务器的一种替代品.  
[Tomcat 官网](https://tomcat.apache.org/)  
Tomcat 作为 Web 服务器, 它可以将 HTTP 请求转换为 servlet 请求, 并调用 servlet 程序处理请求, 然后将 servlet 的响应转换为 HTTP 响应返回给客户端.  
Tomcat 还可以提供静态内容, 如 HTML, CSS, JavaScript 文件, 图片等.

> Java 语言的三大分支
>
> - Java SE(Standard Edition): Java 标准版.
> - Java ME(Micro Edition): Java 微型版.
> - Java EE(Enterprise Edition): Java 企业版.
>   其中, Java EE 包含 JDBC, JSP, XML, Servlet 等 13 项规范.

Tomcat 支持 JavaEE 中 Servlet/JSP 等 少量规范, 因此 Tomcat 被称为轻量级的 Web 容器, Servlet 容器.  
Servlet 程序需要依赖于 Tomcat 才能运行.

在 Spring Boot 中, 内嵌了 Tomcat 作为 Web 服务器, 可以直接使用.

# 请求与响应

BS 架构: (Browser-Server) 是一种客户端-服务器架构, 客户端只需要浏览器即可访问, 应用程序的逻辑和数据都存储在服务器端.

> CS 架构: (Client-Server) 是一种服务器-客户端架构, 需要特别的客户端才可以访问到服务器.

在 BS 架构中, 客户端向服务器发送请求, 服务器处理请求并返回响应.

HTTP 协议规定了客户端和服务器之间通信的规则.  
在 SpringBoot 中, 前端控制器 DispatcherServlet 会解析 HTTP 请求, 并将请求封装到一个请求对象中.  
这个对象称之为 `HttpServletRequest`.

在 Servlet 中可以借助另一个对象 `HttpServletRequest` 来设置响应参数.

这里总结两个对象:

- `HttpServletRequest`: 客户端请求对象, 封装客户端请求信息.
- `HttpServletResponse`: 服务器响应对象, 封装服务器响应信息.

### 请求

传统方式:

```java
@RestController
public class RequestController {
    @RequestMapping("/simpleParam")
    public String simpleParam(HttpServletRequest request) {
        // 获取请求参数
        String name = request.getParameter("name");
        String ageStr = request.getParameter("age");

        int age = Integer.parseInt(ageStr);
        System.out.println(name+":"+age);
        return "OK";
    }
}
```

SpringBoot 方式:

```java
@RestController
public class RequestController {
    @RequestMapping("/simpleParam")
    public String simpleParam(String name,Integer age) {

        System.out.println(name+":"+age);
        return "OK";
    }
}
```

这就是请求映射路径

- `@RequestMapping()`

当此注解写在类上时, 就可作为路径的前缀.

1. ### HTTP 概述

1. #### 介绍

**HTTP**：Hyper Text Transfer Protocol(超文本传输协议)，规定了浏览器与服务器之间数据传输的规则。

- http 是互联网上应用最为广泛的一种网络协议
- http 协议要求：浏览器在向服务器发送请求数据时，或是服务器在向浏览器发送响应数据时，都必须按照固定的格式进行数据传输

如果想知道 http 协议的数据传输格式有哪些，可以打开浏览器，点击`F12`打开开发者工具，点击`Network(网络)`来查看

![](https://heuqqdmbyk.feishu.cn/space/api/box/stream/download/asynccode/?code=ODVkNzZlY2I1ODk5MWM4N2Y5NDA4YTcyNWJmMjQwMDJfMEljNXBHSU9sQ1dweFdOQkttUFhQZ2Q1VzNxcEVCckxfVG9rZW46RTZjeGJHMjllb3V3THl4eFFiVmNRRmhHblpmXzE3MzMwNDI1Mjc6MTczMzA0NjEyN19WNA)

浏览器向服务器进行请求时，服务器按照固定的格式进行解析：

![](https://heuqqdmbyk.feishu.cn/space/api/box/stream/download/asynccode/?code=YWNmNDEwY2U1NzUyMGQ3MDg4ZjQxODU5YmY1MjdmZTlfZVFLbjNJUUttbk9nWW1sRXdCOXNwM3d2bmo0Vk1oSW9fVG9rZW46Wlp3T2JhWGpHb0JRcjd4MkF6bWNkVG41bnRoXzE3MzMwNDI1Mjc6MTczMzA0NjEyN19WNA)

服务器向浏览器进行响应时，浏览器按照固定的格式进行解析：

![](https://heuqqdmbyk.feishu.cn/space/api/box/stream/download/asynccode/?code=OWMwMGUzOWFhZTUyNGI0NWIxY2Y4MTNlNzM3NWIyYjdfTDRzTDk1TjNYcFo5c3RvMmVqbGVLd1JNNGdVcWRnNTlfVG9rZW46VWZZRGJxb1kwb2Z5cVl4RGRyNmM4UzFEbktmXzE3MzMwNDI1Mjc6MTczMzA0NjEyN19WNA)

而我们学习 HTTP 协议，就是来学习请求和响应数据的具体格式内容。

2. #### 特点

我们刚才初步认识了 HTTP 协议，那么我们在看看 HTTP 协议有哪些特点：

- **基于 TCP 协议:** 面向连接，安全

> TCP 是一种面向连接的(建立连接之前是需要经过三次握手)、可靠的、基于字节流的传输层通信协议，在数据传输方面更安全

- **基于请求-响应模型:** 一次请求对应一次响应（先请求后响应）

> 请求和响应是一一对应关系，没有请求，就没有响应

- **HTTP 协议是无状态协议:** 对于数据没有记忆能力。每次请求-响应都是独立的

> 无状态指的是客户端发送 HTTP 请求给服务端之后，服务端根据请求响应数据，响应完后，不会记录任何信息。
>
> - 缺点: 多次请求间不能共享数据
> - 优点: 速度快
>
> - 请求之间无法共享数据会引发的问题：
>
>   - 如：京东购物。加入购物车和去购物车结算是两次请求
>   - 由于 HTTP 协议的无状态特性，加入购物车请求响应结束后，并未记录加入购物车是何商品
>   - 发起去购物车结算的请求后，因为无法获取哪些商品加入了购物车，会导致此次请求无法正确展示数据
>
> - 具体使用的时候，我们发现京东是可以正常展示数据的，原因是 Java 早已考虑到这个问题，并提出了使用会话技术(Cookie、Session)来解决这个问题。具体如何来做，我们后面课程中会讲到。

刚才提到 HTTP 协议是规定了请求和响应数据的格式，那具体的格式是什么呢? 接下来，我们就来详细剖析。

HTTP 协议又分为：请求协议和响应协议

2. ### HTTP 请求协议

1. #### 介绍

- **请求协议：**浏览器将数据以请求格式发送到服务器。包括：**请求行、请求头 、请求体**

- **GET 方式的请求协议：**

![](https://heuqqdmbyk.feishu.cn/space/api/box/stream/download/asynccode/?code=MWIyNTA2MTczOGQ1OWI0ODAyYWI4NTA5NzMyYTNjMjNfdVlMSktwYWVjUTRWYzRnWDNmQWxKNUM2MDNzdDNEMHpfVG9rZW46WEpzSmJIMFBQbzFhR3V4MGwxeWNYdnlwblFkXzE3MzMwNDI1Mjc6MTczMzA0NjEyN19WNA)

- **请求行**(以上图中红色部分) ：HTTP 请求中的第一行数据。由：`请求方式`、`资源路径`、`协议/版本`组成（之间使用空格分隔）
  - 请求方式：GET
  - 资源路径：/brand/findAll?name=OPPO&status=1
    - 请求路径：/brand/findAll
    - 请求参数：name=OPPO&status=1
      - 请求参数是以 key=value 形式出现
      - 多个请求参数之间使用`&`连接
    - 请求路径和请求参数之间使用`?`连接
  - 协议/版本：HTTP/1.1
- **请求头**(以上图中黄色部分) ：第二行开始，上图黄色部分内容就是请求头。格式为 key: value 形式
  - http 是个无状态的协议，所以在请求头设置浏览器的一些自身信息和想要响应的形式。这样服务器在收到信息后，就可以知道是谁，想干什么了
  - 常见的 HTTP 请求头有:
    | | |
    | --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
    | 请求头 | 含义 |
    | Host | 表示请求的主机名 |
    | User-Agent | 浏览器版本。 例如：Chrome 浏览器的标识类似 Mozilla/5.0 ...Chrome/79 ，IE 浏览器的标识类似 Mozilla/5.0 (Windows NT ...)like Gecko |
    | Accept | 表示浏览器能接收的资源类型，如 text/*，image/*或者*/*表示所有； |
    | Accept-Language | 表示浏览器偏好的语言，服务器可以据此返回不同语言的网页； |
    | Accept-Encoding | 表示浏览器可以支持的压缩类型，例如 gzip, deflate 等。 |
    | Content-Type | 请求主体的数据类型 |
    | Content-Length | 数据主体的大小（单位：字节） |

> 举例说明：服务端可以根据请求头中的内容来获取客户端的相关信息，有了这些信息服务端就可以处理不同的业务需求。
>
> 比如:
>
> - 不同浏览器解析 HTML 和 CSS 标签的结果会有不一致，所以就会导致相同的代码在不同的浏览器会出现不同的效果
> - 服务端根据客户端请求头中的数据获取到客户端的浏览器类型，就可以根据不同的浏览器设置不同的代码来达到一致的效果（这就是我们常说的浏览器兼容问题）

- 请求体 ：存储请求参数
  - GET 请求的请求参数在请求行中，故不需要设置请求体

**POST 方式的请求协议：**

![](https://heuqqdmbyk.feishu.cn/space/api/box/stream/download/asynccode/?code=YTBhZDM4MjQ3Mjg3NzViNzQ3MjQ5NjIwMTkyZWI5ZjRfYmRSWHpDNU5mY0lXN1RpN0thZXVuY2dVY3pVdkFsUk9fVG9rZW46T1J4bWJtWlJWb0szMXl4blVOb2NkNlpKbkFnXzE3MzMwNDI1Mjc6MTczMzA0NjEyN19WNA)

- **请求行**(以上图中红色部分)：包含请求方式、资源路径、协议/版本
  - 请求方式：POST
  - 资源路径：/brand
  - 协议/版本：HTTP/1.1
- **请求头**(以上图中黄色部分)
- **请求体**(以上图中绿色部分) ：存储请求参数
  - 请求体和请求头之间是有一个空行隔开（作用：用于标记请求头结束）

GET 请求和 POST 请求的区别：

|              |                                                                |                      |
| ------------ | -------------------------------------------------------------- | -------------------- |
| **区别方式** | **GET 请求**                                                   | **POST 请求**        |
| 请求参数     | 请求参数在请求行中。<br/>例：/brand/findAll?name=OPPO&status=1 | 请求参数在请求体中   |
| 请求参数长度 | 请求参数长度有限制(浏览器不同限制也不同)                       | 请求参数长度没有限制 |
| 安全性       | 安全性低。原因：请求参数暴露在浏览器地址栏中。                 | 安全性相对高         |

2. #### 获取请求数据

Web 服务器（Tomcat）对 HTTP 协议的请求数据进行解析，并进行了封装(HttpServletRequest)，并在调用 Controller 方法的时候传递给了该方法。这样，就使得程序员不必直接对协议进行操作，让 Web 开发更加便捷。

![](https://heuqqdmbyk.feishu.cn/space/api/box/stream/download/asynccode/?code=YTIyYTBkMWZmYzM3NTFlYjIxNTVmZDJjNmMyMWE4NmZfa3VqRktYaWtFcUt0RWZoSWF3RWx6QVY2WFNXcjBwUXJfVG9rZW46SzFwdGJzMnEzb3dhZkJ4c2xKRmNGWkd2blZmXzE3MzMwNDI1Mjc6MTczMzA0NjEyN19WNA)

代码演示如下：

```Java
@RestController
public class RequestController {

    /**
     * 请求路径 http://localhost:8080/request?name=Tom&age=18
     * @param request
     * @return
     */
    @RequestMapping("/request")
    public String request(HttpServletRequest request){
        //1.获取请求参数 name, age
        String name = request.getParameter("name");
        String age = request.getParameter("age");
        System.out.println("name = " + name + ", age = " + age);

        //2.获取请求路径
        String uri = request.getRequestURI();
        String url = request.getRequestURL().toString();
        System.out.println("uri = " + uri);
        System.out.println("url = " + url);

        //3.获取请求方式
        String method = request.getMethod();
        System.out.println("method = " + method);

        //4.获取请求头
        String header = request.getHeader("User-Agent");
        System.out.println("header = " + header);
        return "request success";
    }

}
```

最终输出内容如下所示：

![](https://heuqqdmbyk.feishu.cn/space/api/box/stream/download/asynccode/?code=NjFkYTExNzNjNjIwYTQyMDcyZjRlZDM3YjFjOTI4ZmJfMXRIVHpPUEJUZmdrTW52aXIxaFphR25ud0V3VVRiTXRfVG9rZW46TW9TamJQNnlHb0l2NWd4cGVlYmM0a3JYbkIyXzE3MzMwNDI1Mjc6MTczMzA0NjEyN19WNA)

3. ### HTTP 响应协议

1. #### 格式介绍

- 响应协议：服务器将数据以响应格式返回给浏览器。包括：**响应行 、响应头 、响应体**

![](https://heuqqdmbyk.feishu.cn/space/api/box/stream/download/asynccode/?code=OTVmZmVjNzMxNjhjNjZlZjg2YTZlN2JhYjRmNjUzZWFfTHJpYjhJQnI2TWJyOW5EaldOMHFjOXhxVXNOdHVxYkxfVG9rZW46RjRCbGJWMVA2b1V0TmR4ODVHWmNEbktabktlXzE3MzMwNDI1Mjc6MTczMzA0NjEyN19WNA)

- 响应行(以上图中红色部分)：响应数据的第一行。响应行由`协议及版本`、`响应状态码`、`状态码描述`组成
  - 协议/版本：HTTP/1.1
  - 响应状态码：200
  - 状态码描述：OK
- 响应头(以上图中黄色部分)：响应数据的第二行开始。格式为 key：value 形式

  - http 是个无状态的协议，所以可以在请求头和响应头中设置一些信息和想要执行的动作，这样，对方在收到信息后，就可以知道你是谁，你想干什么
  - 常见的 HTTP 响应头有:

  ```Java
  Content-Type：表示该响应内容的类型，例如text/html，image/jpeg ；

  Content-Length：表示该响应内容的长度（字节数）；

  Content-Encoding：表示该响应压缩算法，例如gzip ；

  Cache-Control：指示客户端应如何缓存，例如max-age=300表示可以最多缓存300秒 ;

  Set-Cookie: 告诉浏览器为当前页面所在的域设置cookie ;
  ```

- 响应体(以上图中绿色部分)： 响应数据的最后一部分。存储响应的数据
  - 响应体和响应头之间有一个空行隔开（作用：用于标记响应头结束）

2. #### 响应状态码

|            |                                                                                                         |
| ---------- | ------------------------------------------------------------------------------------------------------- |
| 状态码分类 | 说明                                                                                                    |
| 1xx        | 响应中 --- 临时状态码。表示请求已经接受，告诉客户端应该继续请求或者如果已经完成则忽略                   |
| 2xx        | 成功 --- 表示请求已经被成功接收，处理已完成                                                             |
| 3xx        | 重定向 --- 重定向到其它地方，让客户端再发起一个请求以完成整个处理                                       |
| 4xx        | 客户端错误 --- 处理发生错误，责任在客户端，如：客户端的请求一个不存在的资源，客户端未被授权，禁止访问等 |
| 5xx        | 服务器端错误 --- 处理发生错误，责任在服务端，如：服务端抛出异常，路由出错，HTTP 版本不支持等            |

关于响应状态码，我们先主要认识三个状态码，其余的等后期用到了再去掌握：

- `200 ok` 客户端请求成功
- `404 Not Found` 请求资源不存在
- `500 Internal Server Error` 服务端发生不可预期的错误

3. #### 设置响应数据

Web 服务器对 HTTP 协议的响应数据进行了封装(HttpServletResponse)，并在调用 Controller 方法的时候传递给了该方法。这样，就使得程序员不必直接对协议进行操作，让 Web 开发更加便捷。

![](https://heuqqdmbyk.feishu.cn/space/api/box/stream/download/asynccode/?code=YmMwMjMxNDc2ZDAyYmM3ODlkOTc1YWIxZjk3M2I0YzhfYzU3RThneUVPNVpjdWlZZDFzZzhkRmZ2V0E3S0xxWjZfVG9rZW46UU9kdGJBc210b2pSakR4UFBjQmNQQ29ZbmxiXzE3MzMwNDI1Mjc6MTczMzA0NjEyN19WNA)

代码演示：

```Java
package com.itheima;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@RestController
public class ResponseController {

    @RequestMapping("/response")
    public void response(HttpServletResponse response) throws IOException {
        //1.设置响应状态码
        response.setStatus(401);
        //2.设置响应头
        response.setHeader("name","itcast");
        //3.设置响应体
        response.setContentType("text/html;charset=utf-8");
        response.setCharacterEncoding("utf-8");
        response.getWriter().write("<h1>hello response</h1>");
    }

    @RequestMapping("/response2")
    public ResponseEntity<String> response2(HttpServletResponse response) throws IOException {
        return ResponseEntity
                .status(401)
                .header("name","itcast")
                .body("<h1>hello response</h1>");
    }

}
```

浏览器访问测试：

![](https://heuqqdmbyk.feishu.cn/space/api/box/stream/download/asynccode/?code=ODYyYzNmNDQ2NTQ5ZGE1ZjI5N2I3MGRjZWQxYjg4NGZfd0VFSk5qcUtEYjB0WVpGMDZSbzJFVlFRZDBNcmpVM3pfVG9rZW46UEFmM2J3d1pCbzNBdEt4cHBZQ2NIMWZTbnBoXzE3MzMwNDI1Mjc6MTczMzA0NjEyN19WNA)

响应状态码 和 响应头如果没有特殊要求的话，通常不手动设定。服务器会根据请求处理的逻辑，自动设置响应状态码和响应头。
