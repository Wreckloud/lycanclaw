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

JDBC，全称 Java DataBase Connectivity，就是一套 Java 访问数据库的标准接口。它的好处是：不管你用的是 MySQL、Oracle 还是 SQL Server，写法都差不多，省去了很多兼容性烦恼。

JDBC 本身只是一组接口和类（主要在 `java.sql` 和 `javax.sql` 这两个包里），具体怎么和数据库通信，还得靠“数据库驱动”来实现。

**数据库驱动是干嘛的？**

可以把数据库驱动理解成“翻译官”。JDBC 只管发指令，驱动负责把这些指令翻译成数据库能听懂的“语言”。每种数据库都有自己的驱动包，比如 MySQL 的 `mysql-connector-java`，用哪个数据库就加哪个驱动。

最稳定、最推荐的下载方式有两种：

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

在引入了依赖以后，JDBC 的用法其实很套路，基本流程就是：  
注册驱动 → 建立连接 → 执行 SQL → 处理结果 → 释放资源。

来看个最基础的例子：

```java
// 1. 注册驱动
Class.forName("com.mysql.jdbc.Driver");

// 2. 获取数据库连接
Connection conn = DriverManager.getConnection(
    "jdbc:mysql://localhost:3306/jdbc?useUnicode=true&characterEncoding=utf-8",
    "root", "root"
);

// 3. 创建 Statement 对象
Statement st = conn.createStatement();

// 4. 执行 SQL 查询
String sql = "select * from user where id=1";
ResultSet rs = st.executeQuery(sql);

// 5. 处理查询结果
if (rs.next()) {
    System.out.println(rs.getObject("id"));
    System.out.println(rs.getObject("username"));
    System.out.println(rs.getObject("password"));
}

// 6. 释放资源
rs.close();
st.close();
conn.close();
```

每一步其实都很直观：先加载驱动，再连数据库，写 SQL 查数据，最后别忘了把用过的资源都关掉。

## 注册驱动

注册驱动有两种写法：

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

- 真正的现代写法：

```Java
// 什么都不用写
```

是不写，其实 8.x 驱动自己会在背后完成注册，尤其是用 Maven/Gradle 管理依赖的项目里。

## 连接数据库

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

## 使用 Statement

`Statement` 是 JDBC 里用来执行 SQL 的对象。常用方法有：

- `executeUpdate(String sql)`：执行 `insert`、`update`、`delete`，返回影响的行数。
- `executeQuery(String sql)`：执行 `select`，返回查询结果集 `ResultSet`。
- `execute(String sql)`：可以执行任意 SQL，返回是否有结果集。

用法很简单，创建出来直接用，记得用完要关闭，避免资源泄漏。

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
