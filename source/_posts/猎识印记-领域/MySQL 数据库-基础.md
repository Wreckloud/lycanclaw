---
title: MySQL 数据库-基础
categories:
  - 猎识印记-领域
excerpt: 这是一篇新文章!
thumbnail: /img/文章封面/defaultcover.jpg
tags:
  - 数据库
  - MySQL
  - 入门基础
published: true
date: 2025-03-01 12:52:01
---

# 数据库概述

数据库（Database）是一个有组织的数据集合，用于存储、管理和检索数据。它就像是一个电子化的文件柜，可以高效地存储和管理大量数据。

## SQL 语言分类

SQL（结构化查询语言）是操作关系型数据库的标准语言，根据功能可分为四大类：

- **数据定义语言 (DDL)**：用于定义数据库结构，如创建、修改和删除对象。
- **数据操作语言 (DML)**：用于操作数据库中的数据，执行增删改查操作。
- **数据控制语言 (DCL)**：用于管理数据库的访问权限和安全性。
- **事务控制语言 (TCL)**：用于管理事务，确保数据一致性。

掌握这些 SQL 语言类型及其命令，是高效操作 MySQL 数据库的基础。

## 数据库的分类

在数据库的世界里，主要有两种类型，各自擅长不同的领域：

**关系型数据库（RDBMS）**
数据像整齐表格，用固定结构存储，能精准关联查询，适合规则性强的业务。

- 使用表格存储数据
- 表之间通过关系关联
- 使用 SQL 语言操作
- 代表：MySQL、PostgreSQL、Oracle 等

**非关系型数据库（NoSQL）**
数据形式灵活，存储不被固定格式限制，处理海量动态数据更快。

- 灵活的数据模型
- 适合处理非结构化数据
- 代表：MongoDB、Redis 等

MySQL 就属于一个开源的关系型数据库管理系统，由瑞典 MySQL AB 公司开发，目前属于 Oracle 公司。它是最流行的关系型数据库管理系统之一，具有开源免费、性能卓越、可靠性高等特点。

# 数据库基础操作

在开始使用 MySQL 存储和管理数据之前，我们需要先掌握一些基础操作：如何创建、选择和管理数据库。这些命令是使用 MySQL 的第一步。

## `mysql` 连接数据库

在执行任何操作前，我们需要先连接到 MySQL 服务器：

```sql
mysql -u 用户名 -p
```

输入密码后，就能看到 MySQL 的欢迎界面和命令提示符 `mysql>`。

### 数据库操作语句

以下是数据库的一些常用指令:

#### `CREATE DATABASE` 创建数据库

当我们需要一个全新的数据库来存储数据时，使用 `CREATE DATABASE` 命令：

```sql
CREATE DATABASE 数据库名;
```

如果不想在已存在同名数据库时报错，可以使用：

```sql
CREATE DATABASE IF NOT EXISTS mydb;
```

#### `SHOW DATABASES` 查看数据库列表

想知道服务器上有哪些数据库？使用 `SHOW DATABASES` 命令：

```sql
SHOW DATABASES;
```

执行后，MySQL 会列出所有可用的数据库，包括我们刚创建的和系统自带的。

#### `USE` 选择数据库

创建完数据库后，要使用它就需要先选择它：

```sql
USE 数据库名;
```

选择后，命令提示符会显示 `Database changed`，表示当前正在操作这个数据库。

#### `DROP DATABASE` 删除数据库

当不再需要某个数据库时，可以将其删除（慎用！）：

```sql
DROP DATABASE 数据库名;
```

同样，可以使用条件语句 `IF EXISTS` 避免删除不存在的数据库时报错：

```sql
DROP DATABASE IF EXISTS mydb;
```

## `SELECT DATABASE()` 查看当前数据库

忘记当前正在使用哪个数据库？可以用这个命令查看：

```sql
SELECT DATABASE();
```

## 字符集与排序规则

创建数据库时，可以指定字符集和排序规则，这对存储不同语言的数据很重要：

```sql
CREATE DATABASE mydb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

- `utf8mb4` 字符集支持所有 Unicode 字符（包括 Emoji 表情）
- `utf8mb4_unicode_ci` 是一种不区分大小写的排序规则

已创建的数据库也可以修改其属性：

```sql
ALTER DATABASE mydb CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
```

# 表的基本操作

数据库创建好后，我们需要创建表来存储具体的数据。表就像一个个电子表格，由行和列组成，每列代表一个字段，每行代表一条记录。

一个表由以下部分组成：

- 表名：唯一标识一个表
- 字段：表中的列，每个字段有特定的数据类型
- 记录：表中的行，存储具体数据
- 约束：确保数据满足特定规则的条件

## 数据类型概览

MySQL 支持多种数据类型，选择合适的数据类型能提高性能并节省存储空间：

#### 数值类型

- `INT`：整数类型，如 1, 100, -10
- `DECIMAL(M,D)`：精确小数，如 DECIMAL(5,2) 可存储 -999.99 到 999.99
- `FLOAT`/`DOUBLE`：浮点数，适合科学计算

#### 字符串类型

- `CHAR(N)`：固定长度字符串，最多 255 个字符
- `VARCHAR(N)`：可变长度字符串，最大 65535 个字符
- `TEXT`：长文本数据，适合存储文章内容

#### 日期和时间类型

- `DATE`：日期，格式为 'YYYY-MM-DD'
- `TIME`：时间，格式为 'HH:MM:SS'
- `DATETIME`：日期和时间的组合，'YYYY-MM-DD HH:MM:SS'
- `TIMESTAMP`：时间戳，会自动更新

#### 其他类型

- `ENUM`：枚举类型，只能有一个指定的值
- `BOOL`/`BOOLEAN`：布尔值，实际上是 TINYINT(1)
- `BLOB`：二进制数据，如图片、文件等

## 表操作语句

### `CREATE TABLE` 创建表

使用`CREATE TABLE`语句创建表：

```sql
CREATE TABLE 表名 (
    列名1 数据类型 [约束],
    列名2 数据类型 [约束],
    ...
    [表级约束]
);
```

例如，创建一个简单的学生表：

```sql
CREATE TABLE students (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    age INT,
    gender CHAR(1),
    email VARCHAR(100) UNIQUE,
    enrollment_date DATE
);
```

### 常用约束类型

约束用于限制表中的数据，确保数据的准确性和可靠性：

- `PRIMARY KEY`：主键，唯一标识表中的每条记录
- `FOREIGN KEY`：外键，关联另一个表的主键
- `NOT NULL`：字段不能为空
- `UNIQUE`：字段值必须唯一
- `DEFAULT`：设置默认值
- `CHECK`：检查字段值是否满足条件
- `AUTO_INCREMENT`：自动增长，通常用于 ID 列

### `DESCRIBE` 查看表结构

想查看已创建表的结构？使用`DESCRIBE`或`SHOW COLUMNS`：

```sql
DESCRIBE 表名;
```

或

```sql
SHOW COLUMNS FROM 表名;
```

### `ALTER TABLE` 修改表结构

随着业务需求变化，我们经常需要修改表结构：

**添加列**

```sql
ALTER TABLE 表名 ADD COLUMN 列名 数据类型 [约束];
```

例如，给学生表添加一个地址列：

```sql
ALTER TABLE students ADD COLUMN address VARCHAR(200);
```

**修改列**

```sql
ALTER TABLE 表名 MODIFY COLUMN 列名 新数据类型 [新约束];
```

例如，将邮箱列扩展长度：

```sql
ALTER TABLE students MODIFY COLUMN email VARCHAR(150);
```

**删除列**

```sql
ALTER TABLE 表名 DROP COLUMN 列名;
```

例如，删除地址列：

```sql
ALTER TABLE students DROP COLUMN address;
```

**重命名表**

```sql
RENAME TABLE 旧表名 TO 新表名;
```

或

```sql
ALTER TABLE 旧表名 RENAME TO 新表名;
```

### `DROP TABLE` 删除表

当表不再需要时，可以将其删除（谨慎操作！）：

```sql
DROP TABLE 表名;
```

为避免错误，可以使用条件判断：

```sql
DROP TABLE IF EXISTS 表名;
```

### `TRUNCATE TABLE` 截断表

如果只想删除表中的所有数据，但保留表结构，可以使用`TRUNCATE`：

```sql
TRUNCATE TABLE 表名;
```

这比`DELETE FROM 表名`更高效，因为它重置自增值并直接释放存储空间。

### 复制表结构

有时候我们需要创建一个与现有表结构相同的新表：

```sql
CREATE TABLE 新表名 LIKE 原表名;
```

如果还想复制数据：

```sql
CREATE TABLE 新表名 SELECT * FROM 原表名;
```

# 数据操作语言

就是用来对数据进行增、删、改、查的语言。

## `INSERT` 插入数据

向表中添加新记录，就像往笔记本上写入新内容一样简单。

**基本语法**

```sql
INSERT INTO 表名 (列1, 列2, ...) VALUES (值1, 值2, ...);
```

例如，向学生表添加一条记录：

```sql
INSERT INTO students (name, age, gender, email, enrollment_date)
VALUES ('张三', 20, 'M', 'zhangsan@example.com', '2023-09-01');
```

注意：

- 如果是自增列（如 id），可以不指定
- 值的类型和顺序必须与列的类型和顺序匹配
- 字符串和日期需要用单引号括起来

**一次插入多条记录**

```sql
INSERT INTO 表名 (列1, 列2, ...) VALUES
(记录1值1, 记录1值2, ...),
(记录2值1, 记录2值2, ...),
...;
```

例如：

```sql
INSERT INTO students (name, age, gender) VALUES
('李四', 21, 'M'),
('王五', 19, 'F'),
('赵六', 22, 'M');
```

**从其他表插入数据**

```sql
INSERT INTO 目标表 (列1, 列2, ...)
SELECT 列1, 列2, ... FROM 源表 [WHERE 条件];
```

## `UPDATE` 更新数据

当信息需要修改时，可以使用 UPDATE 语句更新记录。

**基本语法**

```sql
UPDATE 表名 SET 列1 = 值1, 列2 = 值2, ... [WHERE 条件];
```

例如，更新张三的年龄：

```sql
UPDATE students SET age = 21 WHERE name = '张三';
```

⚠️ **重要提醒**：如果不加 WHERE 条件，会更新表中所有记录！所以在执行 UPDATE 前，建议先用 SELECT 测试 WHERE 条件。

**更新多个表的数据**

```sql
UPDATE 表1, 表2, ...
SET 表1.列 = 值, 表2.列 = 值, ...
WHERE 条件;
```

## `DELETE` 删除数据

当不再需要某些记录时，可以删除它们。

**基本语法**

```sql
DELETE FROM 表名 [WHERE 条件];
```

例如，删除某个学生的记录：

```sql
DELETE FROM students WHERE name = '赵六';
```

⚠️ **再次警告**：不加 WHERE 条件会删除表中所有记录！执行 DELETE 前先用 SELECT 验证条件。

**DELETE 与 TRUNCATE 的区别**

- `DELETE`：可以有条件地删除部分记录，会记录日志，可以回滚
- `TRUNCATE`：删除全部数据，不记录日志，不可回滚，但速度更快

## `SELECT` 查询数据

查询是数据库最常用的操作，允许我们从表中提取需要的信息。

**基本语法**

```sql
SELECT 列1, 列2, ... FROM 表名 [WHERE 条件];
```

**查询所有列**

```sql
SELECT * FROM 表名;
```

例如，查看所有学生信息：

```sql
SELECT * FROM students;
```

**查询特定列**

```sql
SELECT name, age FROM students;
```

**使用别名**

可以给列或表起别名，使结果更易读：

```sql
SELECT name AS 姓名, age AS 年龄 FROM students AS s;
```

## `SELECT` 进阶操作

### 基本 WHERE 条件

WHERE 子句用于筛选符合条件的记录：

```sql
-- 等于
SELECT * FROM students WHERE age = 20;

-- 大于、小于
SELECT * FROM students WHERE age > 20;
SELECT * FROM students WHERE age <= 19;

-- 范围
SELECT * FROM students WHERE age BETWEEN 18 AND 22;

-- 多个条件（AND, OR）
SELECT * FROM students WHERE gender = 'F' AND age < 20;
SELECT * FROM students WHERE age < 18 OR age > 22;

-- IN条件（多个可能值）
SELECT * FROM students WHERE name IN ('张三', '李四', '王五');

-- 模糊匹配
SELECT * FROM students WHERE name LIKE '张%';  -- 以"张"开头
SELECT * FROM students WHERE email LIKE '%@gmail.com';  -- 以"@gmail.com"结尾
SELECT * FROM students WHERE name LIKE '张_';  -- "张"后面只有一个字符
```

### `DISTINCT` 去除重复行

```sql
SELECT DISTINCT gender FROM students;
```

### `LIMIT` 限制结果数量

```sql
SELECT * FROM students LIMIT 5;    -- 仅返回前5条
SELECT * FROM students LIMIT 5, 10; -- 跳过前5条，返回接下来的10条
```

### `ORDER BY` 排序结果

使用 `ORDER BY` 对结果进行排序：

```sql
-- 升序排列（默认）
SELECT * FROM students ORDER BY age;
SELECT * FROM students ORDER BY age ASC;

-- 降序排列
SELECT * FROM students ORDER BY age DESC;

-- 多列排序
SELECT * FROM students ORDER BY gender, age DESC;
```

### `GROUP BY` 分组查询

GROUP BY 可以将数据分组并进行统计：

```sql
-- 计算每个性别的人数
SELECT gender, COUNT(*) AS 人数 FROM students GROUP BY gender;

-- 计算每个性别的平均年龄
SELECT gender, AVG(age) AS 平均年龄 FROM students GROUP BY gender;
```

### `HAVING` 分组过滤

HAVING 用于对分组后的结果进行过滤，类似于 WHERE，但可以使用聚合函数：

```sql
-- 筛选出人数超过5人的性别
SELECT gender, COUNT(*) AS 人数
FROM students
GROUP BY gender
HAVING 人数 > 5;

-- 筛选出平均年龄大于20岁的班级
SELECT class_id, AVG(age) AS 平均年龄
FROM students
GROUP BY class_id
HAVING 平均年龄 > 20;
```

# 数据查询进阶

这部分将介绍更复杂的查询技巧，掌握这些技巧可以让我们从数据库中提取更有价值的信息。

## `JOIN` 多表连接

实际应用中，数据通常分布在多个表中。连接查询可以将多个表的数据组合在一起。

### 表关系的基本概念

在学习连接之前，先了解表之间的关系：

- 一对一：一个学生只有一份详细资料
- 一对多：一个班级有多个学生
- 多对多：一个学生可以选多门课，一门课也可以被多个学生选择

### 多种连接类型

**内连接 (INNER JOIN)**

只返回两个表中都匹配的行：

```sql
SELECT s.name, c.class_name
FROM students s
INNER JOIN classes c ON s.class_id = c.id;
```

**左连接 (LEFT JOIN)**

返回左表的所有行，以及右表中匹配的行：

```sql
SELECT s.name, c.class_name
FROM students s
LEFT JOIN classes c ON s.class_id = c.id;
```

即使学生没有班级，也会显示，班级名为 NULL。

**右连接 (RIGHT JOIN)**

返回右表的所有行，以及左表中匹配的行：

```sql
SELECT s.name, c.class_name
FROM students s
RIGHT JOIN classes c ON s.class_id = c.id;
```

即使班级没有学生，也会显示。

**全连接 (FULL JOIN)**

MySQL 不直接支持 FULL JOIN，但可以用 UNION 组合 LEFT JOIN 和 RIGHT JOIN：

```sql
SELECT s.name, c.class_name
FROM students s
LEFT JOIN classes c ON s.class_id = c.id
UNION
SELECT s.name, c.class_name
FROM students s
RIGHT JOIN classes c ON s.class_id = c.id
WHERE s.name IS NULL;
```

例如，
连接三个表查询学生、班级和课程信息：

```sql
SELECT s.name, c.class_name, cs.course_name
FROM students s
JOIN classes c ON s.class_id = c.id
JOIN student_courses sc ON s.id = sc.student_id
JOIN courses cs ON sc.course_id = cs.id;
```

## `UNION` 组合查询结果

`UNION` 用于合并多个 SELECT 语句的结果：

```sql
SELECT name, email FROM students
UNION
SELECT name, email FROM teachers;
```

注意：

- 合并的列数必须相同
- 对应列的数据类型应兼容
- `UNION` 会自动去重，`UNION ALL` 则保留重复行

## `SUBQUERY` 子查询

子查询是嵌套在另一个查询中的 SELECT 语句。

**WHERE 子句中的子查询**

查找年龄大于平均年龄的学生：

```sql
SELECT name, age
FROM students
WHERE age > (SELECT AVG(age) FROM students);
```

**FROM 子句中的子查询**

将子查询结果作为一个临时表：

```sql
SELECT t.gender, AVG(t.avg_age) as overall_avg
FROM (
    SELECT class_id, gender, AVG(age) as avg_age
    FROM students
    GROUP BY class_id, gender
) t
GROUP BY t.gender;
```

**SELECT 子句中的子查询**

在列表达式中使用子查询：

```sql
SELECT
    name,
    age,
    (SELECT AVG(age) FROM students) as avg_age,
    age - (SELECT AVG(age) FROM students) as diff_from_avg
FROM students;
```

## 常用函数

### 字符串函数

```sql
-- 连接字符串
SELECT CONCAT(first_name, ' ', last_name) AS full_name FROM students;

-- 转换大小写
SELECT UPPER(name), LOWER(email) FROM students;

-- 截取字符串
SELECT SUBSTRING(name, 1, 3) FROM students; -- 从第1个字符开始，截取3个字符

-- 去除空格
SELECT TRIM(name) FROM students; -- 去除两端空格
```
