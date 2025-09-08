---
title: 从 JDBC 到 MyBatis 的数据库与连接池
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

![](../../public/images/文章资源/从-jdbc-到-mybatis-的数据库与连接池/file-20250902143953528.jpg)

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

# MyBatis 入门

如果说 JDBC 是最底层的数据库操作方式，那么 MyBatis 就是在它之上封装的一款优秀的 **持久层框架**。  
它的目标就是——**简化 JDBC 的开发**。

MyBatis 最初是 Apache 的一个开源项目 **iBatis**，2010 年迁移到 Google Code 并更名为 MyBatis，2013 年又迁到 GitHub 上继续维护。

> 官网地址：[MyBatis 官方文档](https://mybatis.net.cn/getting-started.html)

用 JDBC 写 SQL 虽然灵活，但免不了一些重复工作：

- 手动拼接 SQL、传参
- 手动解析 `ResultSet`、封装对象
- 配置和管理比较繁琐

MyBatis 的出现就是为了解决这些麻烦，让我们能把精力更多放在 **SQL 语句本身**。它本质上是一个 **持久层框架**，对 JDBC 进行封装，提供了 **基于接口编程** 的方式来操作数据库。

MyBatis 提供两种常见的开发方式：

1. 基于注解
2. 基于 XML 映射

下面我们就分别梳理这两种方式的具体步骤。

## 准备工作

1. **创建 Spring Boot 工程**

在 `pom.xml` 中引入相关依赖：

```xml
<dependency>
  <groupId>org.mybatis.spring.boot</groupId>
  <artifactId>mybatis-spring-boot-starter</artifactId>
  <version>3.0.3</version>
</dependency>

<dependency>
  <groupId>com.mysql</groupId>
  <artifactId>mysql-connector-j</artifactId>
  <scope>runtime</scope>
</dependency>

<dependency>
  <groupId>org.projectlombok</groupId>
  <artifactId>lombok</artifactId>
</dependency>
```

2. **准备数据库表与实体类**

数据库建表：

```sql
create table user (
    id int primary key auto_increment,
    username varchar(50),
    password varchar(50),
    name varchar(50),
    age int
);
```

实体类 `User`：

```java
@Data
public class User {
    private Integer id;
    private String username;
    private String password;
    private String name;
    private Integer age;
}
```

3. **配置 MyBatis 与数据库信息**

   在 `application.properties`：

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/tlias
spring.datasource.username=root
spring.datasource.password=root@1234
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

   # MyBatis 配置：打印 SQL
mybatis.configuration.log-impl=org.apache.ibatis.logging.stdout.StdoutImpl
```

## 基于注解的方式

注解上手快，适合简单 SQL，直接写在接口方法上。

1. **定义 Mapper 接口**

```java
    @Mapper // 启动时自动生成代理对象
    public interface UserMapper {
        @Select("select * from user")
        List<User> list();

        @Select("select * from user where id = #{id}")
        User findById(Integer id);
    }
```

- `@Mapper`：交给 Spring 管理
- `@Select`：定义 SQL
- `#{id}`：占位符，MyBatis 自动帮我们传参

2. **编写测试类**

```java
    @SpringBootTest
    public class UserMapperTest {
        @Autowired
        private UserMapper userMapper;

        @Test
        public void testList() {
            List<User> users = userMapper.list();
            users.forEach(System.out::println);
        }
    }
```

这样，一个基于注解的 MyBatis 查询功能就完成了。

## 基于 XML 的方式

当 SQL 比较复杂（多表关联、动态 SQL）时，推荐使用 XML 方式，便于维护和书写。

1. **定义 Mapper 接口**

   ```java
   @Mapper
   public interface UserMapper {
       List<User> findAll();
   }
   ```

2. **编写 XML 映射文件**

   - 在 `resources/mapper` 目录下新建 `UserMapper.xml`
   - 文件名与接口同名，namespace 与接口全限定名一致

   ```xml
   <mapper namespace="com.itheima.mapper.UserMapper">
       <select id="findAll" resultType="com.itheima.pojo.User">
           select id, username, password, name, age from user
       </select>
   </mapper>
   ```

3. **配置映射文件路径**

   在 `application.properties` 添加：

```properties
   mybatis.mapper-locations=classpath:mapper/*.xml
```

这样 MyBatis 就能扫描到 `mapper` 文件夹下的 XML 文件。

4. **测试代码**

   ```java
   @SpringBootTest
   public class UserMapperTest {
       @Autowired
       private UserMapper userMapper;

       @Test
       public void testFindAll() {
           List<User> list = userMapper.findAll();
           list.forEach(System.out::println);
       }
   }
   ```

# 数据库连接池

在实际开发中，如果每次执行 SQL 都要重新创建和销毁数据库连接，会非常消耗性能，还可能导致数据库被压垮。**数据库连接池**就是为了解决这个问题——它会提前准备好一定数量的连接放在“池子”里，需要时取出，用完再放回去。

这样做的好处：

- **连接复用**：避免频繁创建销毁，响应更快。
- **统一管理**：通过限制最大连接数，防止高并发下数据库过载。
- **自动回收**：检测并回收无效连接，降低泄漏风险。

现在主流的连接池有：

- **HikariCP**（Spring Boot 默认）
- **Druid**（阿里开源，功能强大，监控能力好）
- 其他：DBCP、C3P0 等（现代项目中较少用）

## Spring Boot 中的连接池

在 Spring Boot 项目里，无论你是用 **JDBC** 还是 **MyBatis**，其实都已经默认集成了连接池。常见情况：

- 默认使用 **HikariCP**，性能优秀，线程优化良好。
- 如果想换成 **Druid** 等其他连接池，可以通过添加依赖并修改配置来实现。

1. 引入 Druid 依赖（可选）

```xml
<dependency>
  <groupId>com.alibaba</groupId>
  <artifactId>druid</artifactId>
  <version>1.2.16</version>
</dependency>
```

2.  配置连接池参数

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/test
spring.datasource.username=root
spring.datasource.password=123456
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# 使用 Druid 作为连接池
spring.datasource.type=com.alibaba.druid.pool.DruidDataSource

# 初始连接数、最大连接数、最小空闲连接数
spring.datasource.druid.initial-size=5
spring.datasource.druid.max-active=20
spring.datasource.druid.min-idle=5
```

配置完成后，Spring Boot 会自动帮你管理连接池，无需手动操作。

## 原理演示

理解原理后，你会发现连接池的思路其实很简单：

- 用一个集合保存多个连接
- 取连接 → 用连接 → 还连接

示例（简化版）：

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

> 真实生产环境下的连接池会考虑线程安全、连接失效检测等问题，所以一般直接用成熟产品（HikariCP / Druid），而不会自己手写。

常见问题

- **连接泄漏**：忘记关闭连接会导致连接池耗尽。主流框架会帮忙管理，但自己写 JDBC 时要记得 `close()`。
- **最大连接数配置不合理**：过小会“抢不到连接”，过大会把数据库压垮，需要根据业务和服务器性能调整。
- **监控与调试**：Druid 自带监控页面，可以实时查看连接池状态，非常方便排查问题。

在现代 MyBatis / Spring Boot 项目中，连接池是默认启用且优化过的。我们只需要了解其作用和基本配置即可，除非有特殊需求，否则无需过度关注底层细节。
