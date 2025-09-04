---
title: JDBC-数据库连接池
date: 2025-07-14 09:17:54
description: 这是一篇新文章!
order: 0
publish: true
tags:
  - 数据库
---

# JDBC 入门

在 Java 中操作数据库的方式有很多，而最底层、最核心的一种就是 **JDBC**。  
JDBC（**Java DataBase Connectivity**）是由 Sun 公司制定的一套 **统一规范**，主要体现在 `java.sql` 和 `javax.sql` 这两个包中。本质上，它只是一组定义了如何操作关系型数据库的 **接口 API**。

接口本身不带实现，各大数据库厂商（如 MySQL、Oracle、SQL Server）会根据这套规范提供各自的 **驱动 jar 包**。

所以，开发者写的 JDBC 程序只是调用接口，真正与数据库打交道、执行 SQL 的工作，其实是由 **驱动包中的实现类**来完成的。

![](../../public/images/文章资源/jdbc-数据库连接池/file-20250902143953528.jpg)

换句话说：

- Sun 定义了规范；
- 驱动厂商提供实现；
- 我们调用接口，驱动来“翻译”并执行。

既然驱动如此关键，下面就看看获取驱动的两种最稳定方式：

1. **Maven/Gradle 依赖管理**  
   如果你的项目用 Maven 或 Gradle 管理依赖，直接在 `pom.xml` 或 `build.gradle` 里添加依赖即可，自动从中央仓库下载，安全又省心。  
   Maven 示例：

```xml
<dependency>
  <groupId>mysql</groupId>
  <artifactId>mysql-connector-java</artifactId>
  <version>8.0.33</version>
</dependency>
```

Gradle 示例：

```groovy
implementation 'mysql:mysql-connector-java:8.0.33'
```

这样不用手动下载，版本也能随时切换。

2. **MySQL 官方网站**  
   如果你需要手动下载 jar 包，建议直接去 MySQL 官网：[MySQL Connector/J 官方下载页](https://dev.mysql.com/downloads/connector/j/)

选择对应版本，下载 Platform Independent 的 zip 包，解压后里面就有 `mysql-connector-java-x.x.xx.jar` 文件。

## 使用 JDBC

在引入了依赖以后，JDBC 的用法套路固定，基本流程就是：

```
注册驱动 → 建立连接 → 执行 SQL → 处理结果 → 释放资源。
```

来看个最基础的示例：

```java
// 1. 注册驱动
Class.forName("com.mysql.cj.jdbc.Driver");

// 2. 获取数据库连接
Connection conn = DriverManager.getConnection(
    "jdbc:mysql://localhost:3306/jdbc?useUnicode=true&characterEncoding=utf-8",
    "root", "root"
);

// 3. 创建 PreparedStatement 对象（使用 ? 占位符）
String sql = "select * from user where id = ?";
PreparedStatement ps = conn.prepareStatement(sql);
ps.setInt(1, 1); // 设置第 1 个占位符的值

// 4. 执行 SQL 查询
ResultSet rs = ps.executeQuery();

// 5. 处理查询结果
if (rs.next()) {
    System.out.println(rs.getInt("id"));
    System.out.println(rs.getString("username"));
    System.out.println(rs.getString("password"));
}

// 6. 释放资源
rs.close();
ps.close();
conn.close();
```

先加载驱动，再连数据库，写 SQL 查数据，最后别忘了把用过的资源都关掉。

### 注册驱动

注册驱动的方式如下：

- 传统写法（过时，不推荐）：

  ```java
  DriverManager.registerDriver(new com.mysql.jdbc.Driver());
  ```

  这种方式容易导致驱动被注册两次，还强依赖具体驱动类，不够灵活。

- 一般写法：

```java
// MySQL 5.x 老版本常见写法
Class.forName("com.mysql.jdbc.Driver");

// MySQL 8.x 之后的正确类名
Class.forName("com.mysql.cj.jdbc.Driver");
```

这种方式用类加载机制自动注册驱动，简单又解耦。写了能确保驱动一定被加载，不会翻车。

- 现代写法：

不过在使用 Maven/Gradle 的项目中，其实可以什么都不写，驱动会通过 **SPI 机制** 自动注册。但写上 `Class.forName(...)` 更直观、也更保险。

### 连接数据库

获取连接的标准写法是：

```java
Connection conn = DriverManager.getConnection(
    "jdbc:mysql://localhost:3306/db_demo?useSSL=false&serverTimezone=UTC",
    "root", "password"
);
```

URL 结构一般是：

```
jdbc:数据库类型://IP:端口/数据库名?参数
```

以 MySQL 为例，不同版本的连接 URL 写法略有区别，下面是两个常见版本的示例：

**MySQL 5.1 常用连接写法：**

```java
String url = "jdbc:mysql://localhost:3306/db_demo?useUnicode=true&characterEncoding=utf-8";
```

这种写法适用于 MySQL 5.x，参数主要用于设置字符集，保证中文不乱码。

**MySQL 8.0 常用连接写法：**

```java
String url = "jdbc:mysql://localhost:3306/db_demo?useSSL=false&serverTimezone=UTC&characterEncoding=utf-8";
```

MySQL 8.x 之后，官方要求加上 `serverTimezone`（时区）参数，否则容易报错。`useSSL=false` 用于关闭 SSL 警告，`characterEncoding=utf-8` 依然是设置字符集。

### 使用 PreparedStatement

`PreparedStatement` 是 JDBC 中推荐使用的 SQL 执行对象。常用方法有：

- `executeUpdate()`：执行 `insert`、`update`、`delete`，返回影响的行数
- `executeQuery()`：执行 `select`，返回结果集 `ResultSet`

```java
String sql = "select * from user where id = ?";
PreparedStatement ps = conn.prepareStatement(sql);
ps.setInt(1, 1); // 设置第 1 个 ? 占位符的值

ResultSet rs = ps.executeQuery();
while (rs.next()) {
    System.out.println(rs.getInt("id"));
    System.out.println(rs.getString("username"));
    System.out.println(rs.getString("password"));
}
```

先准备 SQL 模板，再绑定参数，最后执行并处理结果。

## API 详解

以上我们已经跑通了一个最基础的 JDBC 流程。不过光会“用”还不够，如果想写得更稳、更灵活，就需要对几个核心 API 的作用和细节有更清楚的认识。

### DriverManager

`DriverManager`（驱动管理器）在 JDBC 中主要承担两个职责：

- 注册驱动：负责“登记”有哪些数据库驱动
- 获取连接：帮我们“要一条通道”去连数据库

**注册驱动**

驱动是厂商提供的 jar 包（比如 `mysql-connector-java`）。JDBC 要用它，就得先告诉 DriverManager：  
“我这里有个 MySQL 驱动，记住它！”

传统做法是直接写：

```java
DriverManager.registerDriver(new com.mysql.cj.jdbc.Driver());
```

意思就是：手动注册。但这样写麻烦，而且可能导致重复注册。

于是更常见的写法是：

```java
Class.forName("com.mysql.cj.jdbc.Driver");
```

这行代码不是在“创建对象”，而是在“加载类”。当驱动类被加载时，它里面的 **静态代码块** 会自动调用 传统的写法，帮你完成注册。

再往现代一点（MySQL 8.x + Maven/Gradle），连这行都可以直接不写，因为 jar 包里用了 **SPI 机制**。  
SPI 就像一个“自动登记簿”，只要驱动 jar 在 classpath 里，JVM 启动时就能发现并注册，不用我们管。

**获取连接**

驱动注册完了，接下来我们就能向 DriverManager 要一条通道（Connection）：

```java
Connection conn = DriverManager.getConnection(url, user, password);
```

- **url**：告诉它你要连哪个数据库。
- **user / password**：数据库用户名和密码。

url 的写法有规律：

```
jdbc:mysql://ip地址:端口号/数据库名?参数
```

举例：

- 最完整写法：

```
  jdbc:mysql://localhost:3306/test?useSSL=false&serverTimezone=UTC
```

- 如果数据库就在本机，端口是默认的 3306，还能写成简洁版：

```
  jdbc:mysql:///test
```

### Connection & Statement

在 JDBC 里，**Connection** 表示一次数据库连接。它不仅仅是“通道”，还负责帮我们创建各种执行 SQL 的对象。通过 Connection 可以获得执行 SQL 的对象：

常见的有两种：

1. **Statement**：用于执行普通 SQL
2. **PreparedStatement**：用于执行预编译 SQL（推荐）

```java
// 普通执行对象
Statement st = conn.createStatement();

// 预编译执行对象
PreparedStatement ps = conn.prepareStatement("select * from user where id=?");
```

`Statement` 适合写一些简单的 SQL 直接执行，常见方法有：

- `executeUpdate(sql)`：执行 `insert`、`update`、`delete` 等更新操作，返回受影响的行数
- `executeQuery(sql)`：执行 `select` 查询，返回 `ResultSet` 结果集

示例：

```java
Statement st = conn.createStatement();
ResultSet rs = st.executeQuery("select * from user");
```

### ResultSet

执行查询语句后，返回的结果会被封装在 `ResultSet` 对象中。你可以把它理解为一个“数据表游标”，用来逐行读取查询结果。

常用方法：

**`next()`**：将光标移动到下一行，并判断是否还有数据。

- 返回 `true`：当前位置有效，有数据。
- 返回 `false`：没有更多数据。

**`getXxx(...)`**：获取当前行的字段值。

- 可以通过 **列名** 获取（推荐）。
- 也可以通过 **列的编号** 获取（从 1 开始计数）。

例如模拟根据用户名和密码查询用户信息

```java
String sql = "select * from user where username=? and password=?";
PreparedStatement ps = conn.prepareStatement(sql);
ps.setString(1, "wolf");
ps.setString(2, "123456");

ResultSet rs = ps.executeQuery();

// 遍历结果集
while (rs.next()) {
    // 通过列名获取
    int id = rs.getInt("id");
    String username = rs.getString("username");
    String password = rs.getString("password");
    String name = rs.getString("name");
    int age = rs.getInt("age");

    User user = new User(id, username, password, name, age);
    System.out.println(user);
}
```

这样我们就能把查询结果一行行取出，封装成 Java 对象，完成模拟登录的操作。

### PreparedStatement

`PreparedStatement` 的作用是：**预编译 SQL 语句并执行**。  
它相比 `Statement` 的最大优势有两个：

1. **安全**：能防止 SQL 注入
2. **高效**：SQL 会被预编译和缓存，性能更好

所谓 SQL 注入，就是攻击者通过构造特殊输入，改变了原本 SQL 的语义。

举个例子：

如果直接把表单数据拼接进 SQL：

```java
String sql = "select * from emp where username='" + uname +
             "' and password='" + pass + "'";
```

正常情况下，输入 `uname=wolf`，`pass=123456`，SQL 是安全的：

```sql
select * from emp where username='wolf' and password='123456'
```

但黑客可能输入：

```
uname = wolf
pass = ' or '1'='1
```

拼接后变成：

```sql
select * from emp where username='wolf' and password='' or '1'='1'
```

由于 `'1'='1'` 永远为真，这样不论密码是什么都能“登录成功”。  
这就是典型的 SQL 注入攻击。

**PreparedStatement 如何防注入？**

用 `PreparedStatement` 时，SQL 里不再直接拼接字符串，而是用 `?` 占位：

```java
PreparedStatement ps = conn.prepareStatement(
    "select * from emp where username=? and password=?"
);
ps.setString(1, uname);
ps.setString(2, pass);
ResultSet rs = ps.executeQuery();
```

这样做的关键是：

- **SQL 模板会先被编译**
- **参数会被当作纯粹的值绑定进去**（即使输入里带 `'or '1'='1` 这样的内容，也只会被当成普通字符串处理）

底层会自动转义特殊字符，因此无法再篡改 SQL 逻辑。

**性能优势**

除了安全性，`PreparedStatement` 还有性能优势。

普通 SQL 每次执行的过程：

```sql
delete from emp where id=1;
delete from emp where id=2;
delete from emp where id=3;
```

1. 语法检查
2. 优化 SQL
3. 编译 SQL

每一条 SQL 都要走一遍完整流程，即使只是参数不同。

PreparedStatement 的执行过程：

```sql
delete from emp where id=?;
```

1. 第一次执行时编译 SQL 模板
2. 后续只需要传不同参数，直接复用编译结果

只需要编译一次，之后循环传入不同参数即可。这种方式在批量执行时效率更高。

# 数据库连接池

在实际开发中，频繁创建和销毁数据库连接不仅慢，还容易拖垮数据库。数据库连接池就是为了解决这个问题——它会提前帮你创建好一批连接，放在“池子”里，谁需要谁来拿，用完再还回去。这样一来，既省时高效，又能避免资源浪费。

**核心优点：**

- 连接复用，响应更快
- 统一管理最大连接数，防止数据库被高并发压垮
- 自动检测和回收无效连接，减少连接泄漏风险

现在主流的连接池有 DBCP、C3P0、Druid、HikariCP 等，实际开发中用得最多的还是 Druid 和 HikariCP，配置简单，性能也很不错。

## 使用连接池

**1. 引入依赖**

```xml
<dependency>
  <groupId>com.alibaba</groupId>
  <artifactId>druid</artifactId>
  <version>1.2.16</version>
</dependency>
```

**2. 配置参数**

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/test
spring.datasource.username=root
spring.datasource.password=123456
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
spring.datasource.type=com.alibaba.druid.pool.DruidDataSource
spring.datasource.druid.initial-size=5
spring.datasource.druid.max-active=20
spring.datasource.druid.min-idle=5
```

这些参数控制初始连接数、最大连接数、最小空闲连接数等，按需调整。

**3. 直接用就好**

配置好后，Spring Boot 会自动帮你管理连接池。你只需要像平时一样用 JDBC 或 MyBatis 操作数据库，底层的连接池机制都帮你搞定了。

## 原理演示

理解原理后，其实手写一个最简单的连接池也不难。思路就是：用一个集合提前存好一批连接，需要时取出来，用完再放回去。

下面是一个极简版的手写连接池示例：

```java
public class SimpleConnectionPool {
    private List<Connection> pool = new ArrayList<>();

    // 初始化时创建固定数量的连接
    public SimpleConnectionPool(int size) throws Exception {
        for (int i = 0; i < size; i++) {
            Connection conn = DriverManager.getConnection(
                "jdbc:mysql://localhost:3306/test", "root", "123456"
            );
            pool.add(conn);
        }
    }

    // 获取连接
    public Connection getConnection() {
        if (pool.isEmpty()) throw new RuntimeException("连接已用完");
        return pool.remove(0);
    }

    // 归还连接
    public void returnConnection(Connection conn) {
        pool.add(conn);
    }
}
```

**用法示例：**

```java
SimpleConnectionPool pool = new SimpleConnectionPool(5);
Connection conn = pool.getConnection();
// ... 用完后
pool.returnConnection(conn);
```

当然，实际生产环境下的连接池要考虑线程安全、连接失效检测、最大最小连接数等问题，建议直接用成熟的第三方连接池。

## 常见问题和避坑建议

- **连接泄漏**：忘记关闭连接会导致连接池耗尽。主流框架会自动帮你释放资源，但自己写原生 JDBC 时一定要记得手动关闭。
- **最大连接数设置不合理**：太小会导致高并发时“抢不到连接”，太大又可能把数据库压垮。建议根据实际业务量和数据库性能合理设置。
- **连接池监控**：Druid 自带监控页面，可以实时查看连接池状态，排查问题很方便。

数据库连接池是后端开发的“标配”，让数据库访问变得又快又稳。入门阶段建议直接用主流框架自带的连接池，后续有需要再根据项目实际情况做优化和调整。
