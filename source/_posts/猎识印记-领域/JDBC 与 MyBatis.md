---
title: 后端-JDBC与MyBatis框架
categories:
  - 猎识印记-领域
excerpt: 这是一篇新文章!
thumbnail: /img/文章封面/defaultcover.jpg
tags:
  - 后端
  - Java
  - 数据库
published: true
date: 2025-03-03 17:01:22
---

JDBC 是使用 Java 语言操作关系型数据库的一套 API

![](../../../../img/文章资源/jdbc-与-mybatis/file-20250303170335836.jpg)

sun公司官方定义的一套操作所有关系型数据库的规范，即接口。
各个数据库厂商去实现这套接口，提供数据库驱动jar包。
我们可以使用这套接口（JDBC）编程，真正执行的代码是驱动jar包中的实现类。

### 入门程序

需求：基于JDBc程序，执行update语句（update user set age =25 where id =1)

步骤：
* 准备工作：创建一个Maven项目，引入依赖；并准备数据库表 user。
* 代码实现：编写JDBC程序，操作数据库。

以下是一个完整的 JDBC 示例代码，用于执行 `UPDATE` 语句（例如：`update user set age =25 where id =1`）。代码中包含了 Maven 项目的依赖引入和数据库表的创建步骤。

### 1. 项目准备工作
#### 1.1 创建 Maven 项目
在 IntelliJ IDEA 或 Eclipse 中创建一个 Maven 项目。确保项目结构如下：

```
src
├── main
│   ├── java
│   │   └── com.example
│   │       └── Main.java
│   └── resources
├── pom.xml
```

#### 1.2 引入依赖
在 `pom.xml` 中添加 MySQL JDBC 驱动依赖：

```xml
<dependencies>
    <!-- MySQL Connector -->
    <dependency>
        <groupId>mysql</groupId>
        <artifactId>mysql-connector-java</artifactId>
        <version>8.0.32</version>
    </dependency>
</dependencies>
```

#### 1.3 准备数据库表
确保有以下数据库表 `user`：

```sql
CREATE TABLE user (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50),
    age INT
);
```

如果需要，可以在 MySQL 中运行以下命令（假设数据库名为 `test`）：

```sql
CREATE DATABASE test;

USE test;

CREATE TABLE user (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50),
    age INT
);
```

### 2. 代码实现
#### 2.1 编写 JDBC 程序
在 `Main.java` 中编写以下代码：

```java
package com.example;

import java.sql.*;

public class Main {
    // 数据库连接信息
    private static final String URL = "jdbc:mysql://localhost:3306/test";
    private static final String USER = "root"; // 替换为你的 MySQL 用户名
    private static final String PASSWORD = "password"; // 替换为你的 MySQL 密码

    public static void main(String[] args) {
        // 连接数据库并执行更新操作
        try (Connection conn = DriverManager.getConnection(URL, USER, PASSWORD)) {
            // 创建 SQL 更新语句
            String sql = "UPDATE user SET age = ? WHERE id = ?";
            
            // 使用 PreparedStatement 执行更新
            try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
                // 设置参数值
                pstmt.setInt(1, 25); // 设置 age =25
                pstmt.setInt(2, 1);  // 设置 id=1
                
                // 执行更新
                int rowsUpdated = pstmt.executeUpdate();
                System.out.println("受影响的行数: " + rowsUpdated);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}
```

### 3. 代码说明
1. **数据库连接**：使用 `DriverManager.getConnection` 方法连接到 MySQL 数据库。
2. **SQL 语句**：使用 `PreparedStatement` 预编译 SQL 语句，防止 SQL 注入。
3. **参数绑定**：使用 `setInt` 方法绑定 `age` 和 `id` 的值。
4. **执行更新**：调用 `executeUpdate` 方法执行更新操作，返回受影响的行数。

### 4. 运行程序
1. 确保 MySQL 服务器已启动，并且有 `test` 数据库。
2. 在 `Main.java` 中运行程序，控制台会输出受影响的行数。

### 5. 注意事项
- 确保 MySQL 驱动版本与数据库版本匹配。
- 如果需要，可在 `pom.xml` 中调整 MySQL 驱动版本。
- 如果使用其他数据库（如 PostgreSQL 或 Oracle），请修改数据库连接 URL 和驱动依赖。

希望这段代码对你有帮助！如果需要进一步优化或修改，请告诉我。


