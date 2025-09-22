---
title: SQL 基础
date: 2025-09-05 09:12:32
description: 这是一篇新文章!
order: 0
publish: true
tags:
---

## **内连接 (`INNER JOIN`) 和 `IN` 的区别**

在 MySQL 里，`INNER JOIN` 和 `IN` 都能实现类似的筛选效果，但它们的出发点不同。

- `INNER JOIN` 是基于表连接，取两表交集。
- `IN` 是用子查询结果当过滤条件。
- 性能上：JOIN 更常用，尤其是大数据场景。
- 结果上：大多数时候一样，但要注意 `NULL`。

两者的区别主要在执行方式。`JOIN` 会让数据库优化器去做连接运算，通常更高效，尤其在数据量大的时候。而 `IN` 是先算出一个集合，再逐条比对，集合很大时可能性能较差。
另外一个细节是，`IN` 在集合里出现 `NULL` 时，可能导致结果不符合预期，因为 `NULL` 表示未知，任何和 `NULL` 的等值比较结果都是 UNKNOWN，所以可能会让你以为应该返回的行没有被查出来。

### 内连接 (`INNER JOIN`)

是表连接的写法，把两张表按照某个字段对齐，只保留交集部分的数据。

```sql
SELECT 列名
FROM 表1 a
INNER JOIN 表2 b
ON a.字段 = b.字段;
```

假设有两张表：

```sql
学生表 student(id, name)
成绩表 score(student_id, 分数)
```

查出学生的姓名和成绩：

```sql
SELECT s.name, sc.分数
FROM student s
INNER JOIN score sc
ON s.id = sc.student_id;
```

只有那些两张表都匹配到的学生才会出现。

### `IN` 子查询

是用子查询的结果当作一个集合，逐行去比对。

```sql
SELECT 列名
FROM 表1
WHERE 字段 IN (子查询);
```

它的逻辑是“只要学生的 id 出现在成绩表里，就查出来”。

同样场景，查出有成绩的学生姓名：

```sql
SELECT name
FROM student
WHERE id IN (SELECT student_id FROM score);
```

逻辑上和 inner join 相似，但写法更直观。所以能用 `JOIN` 的场景尽量用 `JOIN`，既清晰又高效；`IN` 更适合语句简单、数据量小的情况。

## **`SELECT * FROM xx FOR UPDATE`**

是在事务里锁定即将修改的行，防止并发修改导致数据不一致。它会在读取数据的同时给结果集加上 **排他锁（写锁）** ，这样其他事务就不能修改这些行，必须等你这个事务提交或回滚以后才能继续。

- 作用：保证读到的数据在事务结束前不会被别人修改。
- 应用：常见于转账、库存扣减这种场景，要先查出一行，然后再修改它，必须确保没人能在你修改过程中“抢先一步”。

举个例子，如果我们有一张账户表：

```sql
CREATE TABLE account (
  id INT PRIMARY KEY,
  name VARCHAR(20),
  balance DECIMAL(10,2)
);
```

事务 A 想给 `id=1` 的账户扣钱时，可以这样写：

```sql
START TRANSACTION;

SELECT balance
FROM account
WHERE id = 1
FOR UPDATE;

UPDATE account
SET balance = balance - 100
WHERE id = 1;

COMMIT;
```

这样一来，如果事务 B 在 A 还没提交之前也想修改 `id=1` 的账户，就会被阻塞住，等到 A 提交以后才能继续。

这里要注意两点：

- `FOR UPDATE` 必须在事务里使用才有效；
- 它依赖索引来加锁，如果查询条件没用到索引，MySQL 可能会退化为锁整张表。

## 数据库来实现乐观锁

所谓“乐观锁”，指的是在并发更新时，假设冲突不会经常发生，所以不一开始就加锁，而是在提交更新时检查数据有没有被别人改过。如果发现冲突了，就让当前操作失败或者重试。这种方式能避免频繁加锁带来的性能损耗，比较适合**读多写少**的场景。

在 MySQL 里，常见的实现方式是 **版本号机制**。在表中增加一个 `version` 字段，每次更新时带上当前的版本号，只有当版本号匹配时才会成功更新。如果更新成功，再把版本号加一。

假设有一张账户表：

```sql
CREATE TABLE account (
  id INT PRIMARY KEY,
  name VARCHAR(20),
  balance DECIMAL(10,2),
  version INT
);
```

查询时先把版本号也查出来：

```sql
SELECT balance, version
FROM account
WHERE id = 1;
```

更新时需要带上版本号：

```sql
UPDATE account
SET balance = balance - 100,
    version = version + 1
WHERE id = 1
  AND version = 5;
```

如果有另一个事务已经修改了这行数据，`version` 已经变成 6，那么这条更新语句就会失败（影响行数为 0）。程序可以检测到更新失败，然后选择重试或者提示用户。

除了版本号，也可以用 **时间戳字段** 来实现类似效果，比如 `update_time`，每次更新时检查“最后更新时间”是否还等于之前读到的值。

总结起来：乐观锁在数据库里常用 **版本号字段或时间戳** 来实现，思路是“读的时候拿到版本，更新时比对版本，不一致就说明有人改过，更新失败”。

## **MySQL 常见函数与聚合函数**

在面试里，函数常常考察“能不能灵活写 SQL”。常用的分为三类：类型转换、字符串处理、日期处理。除此之外还有聚合函数。

**类型转换函数**  
最常见的是 `CAST(expr AS type)`，可以把字段或表达式转成指定类型。比如：

```sql
SELECT CAST('123' AS SIGNED);   -- 转成整数
```

**字符串函数**  
面试里经常让你举几个。常见的有：

| 函数                    | 作用       | 示例                        |
| ----------------------- | ---------- | --------------------------- |
| `LOWER(str)`            | 转小写     | `LOWER('Wolf') → wolf`      |
| `UPPER(str)`            | 转大写     | `UPPER('wolf') → WOLF`      |
| `CONCAT(a, b, ...)`     | 拼接字符串 | `CONCAT('狼', '王') → 狼王` |
| `SUBSTR(str, pos, len)` | 截取子串   | `SUBSTR('WOLF', 2, 2) → OL` |

例子：

```sql
SELECT CONCAT(UPPER(name), '狼') FROM student;
```

**日期函数**  
处理日期时间是常见考点。

| 函数                        | 作用         | 示例                                    |
| --------------------------- | ------------ | --------------------------------------- |
| `STR_TO_DATE(str, format)`  | 字符串转日期 | `STR_TO_DATE('2025-09-05', '%Y-%m-%d')` |
| `DATE_FORMAT(date, format)` | 日期转字符串 | `DATE_FORMAT(NOW(), '%Y年%m月%d日')`    |

例子：

```sql
SELECT STR_TO_DATE('2025-09-05', '%Y-%m-%d');
SELECT DATE_FORMAT(NOW(), '%Y年%m月%d日');
```

**聚合函数**  
就是对一组数据做统计。最常考的五个：

| 函数       | 作用     | 示例                    |
| ---------- | -------- | ----------------------- |
| `COUNT(*)` | 统计数量 | `COUNT(*) → 学生总数`   |
| `AVG(col)` | 平均值   | `AVG(score) → 平均成绩` |
| `MAX(col)` | 最大值   | `MAX(score) → 最高分`   |
| `MIN(col)` | 最小值   | `MIN(score) → 最低分`   |
| `SUM(col)` | 求和     | `SUM(score) → 总分`     |

例子：

```sql
SELECT COUNT(*), AVG(score), MAX(score), MIN(score), SUM(score)
FROM score;
```

## **CHAR 与 VARCHAR 的区别**

在 MySQL 里，`CHAR` 和 `VARCHAR` 都用来存储字符串，但它们在存储方式和使用场景上有明显不同。

- `CHAR`：定长、速度快、但浪费空间。
- `VARCHAR`：变长、节省空间、但速度稍慢。

**存储方式**  
`CHAR(n)` 是定长字符串，不管实际存的字符有多少，都会占满 n 个字节，不足的会用空格填充。  
`VARCHAR(n)` 是变长字符串，只会占用实际字符的长度，再加 1~2 个字节记录长度。

举例：`CHAR(10)` 存 `'wolf'` 时，实际存储长度是 10 个字符（后面补空格）；  
`VARCHAR(10)` 存 `'wolf'` 时，实际存储长度是 4+1=5 个字节。

**查询效率**  
因为 `CHAR` 长度固定，所以读取时定位更快；`VARCHAR` 长度不固定，需要额外处理长度信息，读取速度略慢。

**适用场景**  
`CHAR` 适合存储长度固定的数据，比如身份证号、MD5 值、性别等。  
`VARCHAR` 更适合存储长度变化较大的字段，比如用户名、文章标题等。

## MySQL 分页时 LIMIT 的优化

在 MySQL 里，分页常用的写法是：

```sql
SELECT *
FROM student
ORDER BY id
LIMIT 10 OFFSET 10000;
```

这条语句的含义是：跳过前 10000 行，取 10 行。但 MySQL 的执行方式是：

1. 先扫描并取出前 10010 行
2. 再丢掉前 10000 行，只保留最后 10 行。

这意味着 **偏移量越大，查询就越慢** ，优化的核心思路就是利用索引定位数据，避免无谓扫描。

### 基于索引的条件过滤

如果有连续的主键或索引，可以用 `id > 上一次的最大值` 来替代 offset，这样能避免大量的扫描和丢弃。

```sql
SELECT *
FROM student
WHERE id > 10000
ORDER BY id
LIMIT 10;
```

MySQL 会利用 `id` 这个索引直接定位到“大于 10000 的第一个位置”，然后往后顺序取 10 行，不需要从 `id=1` 开始逐行数到 10000。

### 子查询 + JOIN

子查询 就是“一个查询的结果，拿来当作另一个查询的输入”。括号里的就是子查询，它先执行，把结果交给外层查询。

先用子查询快速定位，只查出第 10001 到 10010 这 10 行的 id。这一步很快，因为只拿主键，不管其它列。再回到 student 表里取完整的数据。

```sql
SELECT s.*
FROM student s
JOIN (
  SELECT id
  FROM student
  ORDER BY id
  LIMIT 10000, 10
) t ON s.id = t.id;
```

这种方式比直接 offset 更高效，因为只取需要的主键行，再去查具体数据。

### 尽量使用覆盖索引

覆盖索引意味着“答案全在目录里”，避免回表能减少一次磁盘 IO，查询效率会更高。如果查询的列都能从索引里拿到，就能避免回表，提高速度。

什么是 **回表** 与 **覆盖索引**

在 MySQL 里，查询通常会先通过索引定位行，再去数据表里取完整的数据，这个过程就叫 **回表**。

> 就像查字典时，目录只告诉你“wolf 在第 300 页”，你还得翻到正文才能看到解释。

如果查询的字段都包含在索引里，就不需要回表，直接从索引返回结果，这种情况称为 **覆盖索引**。

> 类比字典：就像目录上除了页码，还顺带写了“wolf：意为狼”，不用再翻正文就能拿到答案。

- 一般操作回表：假设在 `student(name)` 上有单列索引。

```sql
SELECT score
FROM student
WHERE name = 'wolf';
```

因为 `score` 不在索引里，只能先用索引找到行，再去表里取 `score` ，这个行为就是回表，是我们执行 SQL 的一般操作。

- 覆盖索引优化：如果在 `(name, score)` 上建了复合索引：

建索引的语法是 `CREATE INDEX 索引名称 ON 表(列...)`。

```sql
CREATE INDEX idx_name_age ON student(name, age);
```

这个 `ON` 就是告诉 MySQL：在 `(name, score)` 上建了复合索引。

然后再执行查询语句时：

```sql
SELECT score
FROM student
WHERE name = 'wolf';
```

这时查询的列 `name` 和 `score` 已经全部包含在索引里，结果可以直接从索引中得到，不需要回表，这就是 **覆盖索引**。

不过，就像字典的目录不会把所有释义都写上去，否则反而冗余，索引也一样，只给“必要的列”加就行。这样既能提高效率，又避免索引过大带来的写入开销。

## **`UNION` 与 `UNION ALL` 的区别**

在 MySQL 里，`UNION` 和 `UNION ALL` 都可以把多条查询的结果合并到一起展示，但它们在去重和性能上有明显差别。

- `UNION`：合并结果并去重，安全但慢。
- `UNION ALL`：合并结果不去重，快，常用。

如果确定结果不会有重复，或者就需要保留重复记录，那么优先用 `UNION ALL`。

**UNION**

会把结果集合并后自动 **去重**。这意味着如果两条查询里有重复的行，只会保留一份。

```sql
SELECT name FROM classA
UNION
SELECT name FROM classB;
```

如果 `classA` 和 `classB` 里都有人叫 “wolf”，结果里只会出现一次。

因为要做去重，MySQL 内部会先把结果排序或建临时表来检查重复，所以性能上会稍慢一些。

**UNION ALL**

则是直接合并结果，不会做任何去重。

```sql
SELECT name FROM classA
UNION ALL
SELECT name FROM classB;
```

如果两张表里都有 “wolf”，结果里会出现两次。

因为不需要去重，执行速度比 `UNION` 快。

## **行列转换**

在 MySQL 里，“行列转换”指的是把表里的行数据转成列来展示，或者反过来把多列合并成多行。
行转列常用 `CASE WHEN`，列转行常用 `UNION ALL`。

**行转列**

最常见的方式是用 **`CASE WHEN` + 聚合函数**。  
比如有一张成绩表：

```sql
student_id | course | score
-----------+--------+------
1          | 数学    | 90
1          | 英语    | 85
2          | 数学    | 80
2          | 英语    | 88
```

如果想把它变成这样：

```sql
student_id | 数学 | 英语
-----------+------+-----
1          | 90   | 85
2          | 80   | 88
```

SQL 可以写成：

```sql
SELECT student_id,
       MAX(CASE WHEN course = '数学' THEN score END) AS 数学,
       MAX(CASE WHEN course = '英语' THEN score END) AS 英语
FROM score
GROUP BY student_id;
```

这里的 `CASE WHEN` 相当于“条件判断”，只在符合时才取值，否则为 NULL，再用 `MAX` 把这一列汇总出来。

**列转行**

列转行则是反过来，把多列拆成多行。  
MySQL 里常用 **`UNION ALL`** 来实现。  
假设有一张学生表：

```sql
id | name | 数学 | 英语
---+------+----+----
1  | 张三 | 90 | 85
2  | 李四 | 80 | 88
```

想拆成：

```sql
id | name | course | score
---+------+--------+------
1  | 张三 | 数学   | 90
1  | 张三 | 英语   | 85
2  | 李四 | 数学   | 80
2  | 李四 | 英语   | 88
```

SQL 写法：

```sql
SELECT id, name, '数学' AS course, 数学 AS score
FROM student
UNION ALL
SELECT id, name, '英语', 英语
FROM student;
```

`UNION ALL` 的作用就是把多条查询结果拼在一起，每条查询负责“转”一列。
