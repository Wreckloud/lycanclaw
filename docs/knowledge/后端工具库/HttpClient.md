---
title: 'HttpClient'
date: '2025-11-11 14:53:37'
description: '这是一篇新文章!'
order: 0
publish: true
tags: 
---

## HttpClient 介绍与作用

**HttpClient** 是 Apache 提供的一个功能完善的 HTTP 协议客户端编程工具包，能让 Java 程序主动发送 HTTP 请求、接收响应数据。  
它的定位不是“服务器”，而是一个“客户端请求发起者”。

![](../../public/images/文章资源/httpclient/file-20251111145449576.jpg)

> **核心作用**：让 Java 程序去访问其他 Web 服务，主动发起请求并处理返回结果。

**为什么要用 Java 发送请求？**

我们平时写的 Web 项目，大多是由 **前端 → Java 服务端** 发请求，然后返回响应。  
但在很多业务场景下，Java 程序本身也需要 **向外部第三方服务器发送请求**，因为：

某些服务（如短信、支付、地图定位等）我们自己没有权限直接实现，只能通过官方平台提供的接口调用来实现功能。

比如：

- 地图定位功能 → 调用百度、高德开放 API
- 短信验证 → 调用运营商短信网关
- 微信登录、支付 → 调用微信开放平台接口

这时，Java 代码就必须扮演「客户端」的角色，构造 HTTP 请求、携带参数，去调用这些第三方接口。

**示例：百度地图地理编码服务**

百度地图提供了一个**地理编码接口**，根据地址换取经纬度：

```
https://api.map.baidu.com/geocoding/v3/?address=北京市海淀区上地十街10号&output=json&ak=已申请的访问密钥
```

我们打开浏览器访问这条 URL，就能看到百度返回的 JSON 数据。

![](../../public/images/文章资源/httpclient/file-20251111145826796.jpg)

而如果想在 Java 程序中实现同样的效果，就要通过 **HttpClient** 来发送请求：

1. 构造请求地址与参数
2. 发送 HTTP 请求
3. 接收并解析响应数据

# 使用方法

在 Java 项目中使用 HttpClient 时，很多第三方 SDK（例如阿里云、微信、百度等）都会自动引入它作为底层依赖。如果没有，也可以单独添加一份，方便自己直接发 HTTP 请求：

```xml
<dependency>
  <groupId>org.apache.httpcomponents</groupId>
  <artifactId>httpclient</artifactId>
  <version>4.5.13</version>
</dependency>
```

我们平时在浏览器中访问网站，会经历：

1. 构造 URL
2. 发出请求
3. 等待并接收响应

在 Java 中用 HttpClient 的流程完全类似：

1. 创建 HttpClient 对象（相当于打开浏览器）
2. 创建请求对象（决定要访问的接口与方式：GET 或 POST）
3. 执行请求、获取响应
4. 读取响应体内容
5. 关闭连接释放资源

整体逻辑很像“浏览器自动化”，只是由 Java 代码来完成。

## GET 请求示例

目标：通过 HttpClient 调用 `/user/shop/status`接口（GET），拿到营业状态。

```java
public class HttpGetExample {

    public static void main(String[] args) throws Exception {
        // 1. 创建 HttpClient 对象（相当于打开浏览器）
        CloseableHttpClient httpClient = HttpClients.createDefault();

        // 2. 构造 GET 请求对象，指定要访问的接口地址
        // `HttpGet` 表示这是一次 GET 请求；
        HttpGet httpGet = new HttpGet("http://localhost:8080/user/shop/status");

        // 3. 发送请求并获取响应
        CloseableHttpResponse response = httpClient.execute(httpGet);

        // 4. 解析响应内容
        String result = EntityUtils.toString(response.getEntity(), "UTF-8");
        System.out.println("接口响应内容：" + result);

        // 5. 关闭连接
        response.close();
        httpClient.close();
    }
}
```

`EntityUtils.toString()` 将返回的响应数据转成字符串；最后记得关闭连接，避免资源泄露。

## POST 请求示例

目标：通过 HttpClient 调用 管理端登录 `/admin/employee/login`（POST JSON），需要在请求体中带上账号和密码。

```java
public class HttpPostExample {

    public static void main(String[] args) throws Exception {
        // 1. 创建 HttpClient 对象
        CloseableHttpClient httpClient = HttpClients.createDefault();

        // 2. 构造 POST 请求对象
        HttpPost httpPost = new HttpPost("http://localhost:8080/admin/employee/login");

        // 3. 设置请求体（JSON 格式）
        String json = "{\"username\":\"admin\",\"password\":\"123456\"}";
        StringEntity entity = new StringEntity(json, ContentType.APPLICATION_JSON);
        httpPost.setEntity(entity);

        // 4. 发送请求并获取响应
        CloseableHttpResponse response = httpClient.execute(httpPost);
        String result = EntityUtils.toString(response.getEntity(), "UTF-8");
        System.out.println("接口响应内容：" + result);

        // 5. 关闭连接
        response.close();
        httpClient.close();
    }
}
```

登录接口需要请求体，所以我们使用 `StringEntity` 携带 JSON 数据；`ContentType.APPLICATION_JSON` 告诉服务端我们发送的是 JSON 格式；最后读取响应内容即可。

# 封装 HttpClient 工具类

实际项目中如果多次需要发 HTTP 请求（调用第三方接口、微信 API、百度地图等），我们不可能每次都重新写一段 GET / POST。  
这时可以封装一个工具类，统一请求逻辑、超时配置和异常处理。

HttpClient 使用步骤其实很固定：

1. 创建 HttpClient 对象
2. 创建请求（GET 或 POST）
3. 设置请求参数或请求体
4. 执行请求，获取响应对象
5. 解析响应数据
6. 关闭资源

我们把这些通用逻辑提炼出来，写成 `HttpClientUtil`，以后项目中直接调用即可。

```java
/**
 * Http 工具类 - 简化 GET / POST 请求
 */
public class HttpClientUtil {

    // 统一超时时间（毫秒）
    private static final int TIMEOUT = 5000;

    /**
     * 构造通用的请求配置（连接超时 / 读取超时）
     */
    private static RequestConfig buildConfig() {
        return RequestConfig.custom()
                .setConnectTimeout(TIMEOUT)
                .setSocketTimeout(TIMEOUT)
                .setConnectionRequestTimeout(TIMEOUT)
                .build();
    }

    /**
     * GET 请求（带可选参数）
     */
    public static String doGet(String url, Map<String, String> params) {
        String result = "";
        // 1. 创建 HttpClient
        try (CloseableHttpClient httpClient = HttpClients.createDefault()) {

            // 2. 拼接参数
            URIBuilder builder = new URIBuilder(url);
            if (params != null) {
                for (String key : params.keySet()) {
                    builder.addParameter(key, params.get(key));
                }
            }
            URI uri = builder.build();

            // 3. 创建 GET 请求
            HttpGet httpGet = new HttpGet(uri);
            httpGet.setConfig(buildConfig());

            // 4. 执行请求
            try (CloseableHttpResponse response = httpClient.execute(httpGet)) {
                // 判断状态码是否为200
                if (response.getStatusLine().getStatusCode() == 200) {
                    result = EntityUtils.toString(response.getEntity(), "UTF-8");
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return result;
    }

    /**
     * POST 请求（表单方式）
     */
    public static String doPost(String url, Map<String, String> params) {
        String result = "";
        try (CloseableHttpClient httpClient = HttpClients.createDefault()) {

            HttpPost httpPost = new HttpPost(url);
            httpPost.setConfig(buildConfig());

            // 1. 封装表单参数
            if (params != null) {
                List<NameValuePair> list = new ArrayList<>();
                for (Map.Entry<String, String> entry : params.entrySet()) {
                    list.add(new BasicNameValuePair(entry.getKey(), entry.getValue()));
                }
                httpPost.setEntity(new UrlEncodedFormEntity(list, "UTF-8"));
            }

            // 2. 发送请求并读取结果
            try (CloseableHttpResponse response = httpClient.execute(httpPost)) {
                result = EntityUtils.toString(response.getEntity(), "UTF-8");
            }

        } catch (IOException e) {
            e.printStackTrace();
        }

        return result;
    }

    /**
     * POST 请求（JSON 方式）
     */
    public static String doPostJson(String url, Map<String, String> paramMap) {
        String result = "";
        try (CloseableHttpClient httpClient = HttpClients.createDefault()) {

            HttpPost httpPost = new HttpPost(url);
            httpPost.setConfig(buildConfig());

            // 1. 构造 JSON 字符串
            if (paramMap != null) {
                JSONObject json = new JSONObject();
                for (Map.Entry<String, String> entry : paramMap.entrySet()) {
                    json.put(entry.getKey(), entry.getValue());
                }

                // 设置请求体与类型
                StringEntity entity = new StringEntity(json.toString(), "UTF-8");
                entity.setContentType("application/json;charset=UTF-8");
                httpPost.setEntity(entity);
            }

            // 2. 发送请求
            try (CloseableHttpResponse response = httpClient.execute(httpPost)) {
                result = EntityUtils.toString(response.getEntity(), "UTF-8");
            }

        } catch (IOException e) {
            e.printStackTrace();
        }

        return result;
    }
}
```

1. **`buildConfig()`**  
   设置了统一超时时间，避免网络延迟或无响应导致程序卡死。
2. **`doGet()`**

   - 自动拼接参数（用 `URIBuilder` 自动编码，防止中文乱码）
   - 适合调用无鉴权的公开接口，如百度地图查询等。

3. **`doPost()`**

   - 以表单形式提交（`application/x-www-form-urlencoded`），常用于登录等接口。

4. **`doPostJson()`**

   - 用 JSON 作为请求体（`application/json`），是现代接口主流方式。

5. **资源释放**

   - 所有网络资源都在 try-with-resources 中自动关闭，避免内存泄露。

示例用法:

```java
// GET 请求
Map<String, String> getParams = new HashMap<>();
getParams.put("address", "北京市海淀区上地十街10号");
getParams.put("output", "json");
getParams.put("ak", "你的百度AK");
String result1 = HttpClientUtil.doGet("https://api.map.baidu.com/geocoding/v3/", getParams);
System.out.println(result1);

// POST 请求
Map<String, String> loginParams = new HashMap<>();
loginParams.put("username", "admin");
loginParams.put("password", "123456");
String result2 = HttpClientUtil.doPostJson("http://localhost:8080/admin/employee/login", loginParams);
System.out.println(result2);
```
