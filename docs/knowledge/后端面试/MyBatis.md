---
title: 'MyBatis'
date: '2025-10-15 09:30:54'
description: '这是一篇新文章!'
order: 0
publish: true
tags: 
---

# #{} 和 ${} 的区别

`#{}` 是**预编译占位**，`${}` 是**字符串拼接**。

预编译代表 SQL 会在数据库层先生成执行计划，再安全地传入参数；拼接则是直接把参数值塞进 SQL 字符串本身。

```sql
-- 使用 #{}：
SELECT * FROM t_user WHERE id = #{id}

-- 解析后：
SELECT * FROM t_user WHERE id = ?
```

```sql
-- 使用 ${}：
SELECT * FROM t_user WHERE id = ${id}

-- 若 id = 1，解析后：
SELECT * FROM t_user WHERE id = 1
```

真正的重点在于两者的使用时机。业务参数几乎一律使用 `#{}`，因为它：

- 能自动进行类型转换
- 避免 SQL 注入
- 保留执行计划缓存，效率更高

而 `${}` 主要用在这种场景：

- 表名、列名、排序字段这些**不能用 `?` 占位的结构**
- 例如动态排序、动态表名

```sql
 SELECT * FROM ${tableName} ORDER BY ${columnName}
```

如果硬把业务值用 `${}` 拼进去，那就等于**把防线全砸了**。比如：

```sql
SELECT * FROM t_user WHERE name = ${name}
```

当 `name` 是恶意字符串时，SQL 注入几乎是必然的结果。

# MyBatis 与 ORM（Hibernate / JPA）的区别

MyBatis 更偏向 **SQL 驱动**，ORM 框架更偏向 **对象模型驱动**。

MyBatis 的核心是“让开发者自己写 SQL”，它只负责帮你减少 JDBC 的重复工作；  
Hibernate / JPA 则希望“你不碰 SQL”，通过对象与表的映射自动生成 SQL。

MyBatis 的特点：

- 直接操作 SQL，开发者掌控力强
- 灵活，可精准优化性能
- 半自动映射：框架帮你封装 JDBC 过程（加载驱动、创建连接、执行语句），但 SQL 由你写
- 学习成本相对低，上手快，但需要懂 SQL

```sql
<select id="findWolfById" parameterType="int" resultType="Wolf">
    SELECT * FROM wolf WHERE id = #{id}
</select>
```

**Hibernate / JPA 的特点：**

- 完全基于对象映射，开发者关注实体，不写或少写 SQL
- 框架自动生成 SQL，维护复杂关系方便
- 开发效率高，但性能和 SQL 细节的掌控力差
- 学习曲线更陡，调优难度高

```java
Wolf wolf = entityManager.find(Wolf.class, 1);
```

这也意味着：

- MyBatis 更适合对 SQL 性能有精确要求的场景
- Hibernate / JPA 更适合结构稳定、业务模型清晰的大型项目

# MyBatis 怎么封装动态 SQL？（常见的动态 SQL 标签）

在 MyBatis 里，动态 SQL 是它区别于传统 JDBC 的一大亮点。它并不是简单的字符串拼接，而是通过 **XML 标签** 来在 SQL 语句中实现逻辑判断和灵活拼装。
面试考这题时，核心要让对方听出你知道「**为什么要这么设计**」以及「**常用标签的适用场景**」。

MyBatis 的动态 SQL 本质上是在执行前，对 Mapper 中的 SQL 进行一轮**逻辑解析**，最终生成一条完整可执行的 SQL。比如根据条件是否为空来决定是否拼接 `WHERE` 语句、遍历集合生成 `IN` 条件、选择不同分支等。

**常见的动态 SQL 标签有：**  
`<if>`、`<where>`、`<trim>`、`<set>`、`<foreach>`、`<choose>`、`<when>`、`<otherwise>`。

- `<if>`  
   最基本的条件判断标签，用来控制一段 SQL 是否生效。

```xml
  <if test="wolfName != null">
      AND wolf_name = #{wolfName}
  </if>
```

这种方式可以避免无效条件拼接，让 SQL 更加灵活。

- `<where>`  
   自动处理 `WHERE` 关键字与多余的 `AND` / `OR`，不用手动判断是不是第一个条件。

```xml
  <where>
      <if test="wolfId != null">id = #{wolfId}</if>
      <if test="wolfName != null">AND wolf_name = #{wolfName}</if>
  </where>
```

- `<trim>`  
   类似 `<where>`，但更灵活，可以自定义前缀（如 `WHERE`、`SET`）、移除多余的前缀。

```xml
  <trim prefix="WHERE" prefixOverrides="AND | OR">
      <if test="wolfId != null">AND id = #{wolfId}</if>
      <if test="wolfName != null">AND wolf_name = #{wolfName}</if>
  </trim>
```

- `<set>`  
   多用于 `UPDATE` 语句，自动去掉多余的逗号。

```xml
  <set>
      <if test="wolfName != null">wolf_name = #{wolfName},</if>
      <if test="wolfAge != null">wolf_age = #{wolfAge}</if>
  </set>
```

- `<foreach>`  
   循环集合，常用于 `IN` 条件或批量操作。

```xml
  <foreach collection="ids" item="id" open="(" separator="," close=")">
      #{id}
  </foreach>
```

- `<choose>`、`<when>`、`<otherwise>`  
   类似 Java 的 `switch-case`，从多种条件中选择一条执行。

```xml
  <choose>
      <when test="wolfName != null">
          AND wolf_name = #{wolfName}
      </when>
      <otherwise>
          AND wolf_age > 0
      </otherwise>
  </choose>
```

这些标签组合起来，就能让 SQL 根据不同的入参自动生成不同的语句，避免冗长的字符串拼接。相比手写 SQL 拼接，动态 SQL 不仅更安全，也更便于维护。

- 动态 SQL 不是“字符串拼接”，而是“SQL 模板 + 逻辑控制”
- `if` 负责判断，`where/trim/set` 负责结构，`foreach` 负责循环，`choose` 负责分支
- 动态 SQL 让 Mapper 变得更灵活，也让项目逻辑更干净

# MyBatis 怎么实现分页？（利用插件 PageHelper）

面试要点只有两件事：

- 它是怎么做到的
- 我怎么正确用

PageHelper 的核心是基于 MyBatis 插件机制对即将执行的 SQL 做“物理分页改写”，把你本来的查询自动改写成带 `LIMIT/OFFSET`（或对应方言语法）的 SQL，再把查询结果和分页信息一并返回。

> 拦截待执行的 SQL → 按方言添加物理分页语句与参数。

PageHelper = MyBatis 插件 + SQL 改写 + 方言物理分页，对接一行 `startPage` 就能用；深分页要注意成本，必要时切换 **seek** 思路。

分页的工作原理（面试时直接说这段就够）

1. **执行前拦截**：插件拦截 MyBatis 的执行链（Executor/StatementHandler），拿到你写的原始查询。
2. **SQL 重写**：根据数据库方言把查询改写为**物理分页**（MySQL 就是 `… LIMIT ?, ?`），并绑定分页参数。
3. **继续放行**：把改写后的 SQL 交给数据库执行；必要时再执行一次统计总数的查询（框架完成）。
4. **返回包装**：把结果列表和分页元信息（页码、页大小、总条数等）交给你使用。

代码层面的最小闭环

```java
// 1) 进入分页上下文（下一条查询会被分页）
PageHelper.startPage(pageNum, pageSize);

// 2) 正常写你的 Mapper 查询（保持原样，不要自己拼 limit）
List<User> list = userMapper.queryUsers(cond);

// 3) 需要元信息就包一层
PageInfo<User> page = new PageInfo<>(list);
// page.getTotal(), page.getList(), page.getPages()...
```

和面试官常见追问，直接这么接：

- **为什么不自己写 `limit`？**  
   PageHelper 统一做方言处理与统计，避免手写分页的遗漏与重复劳动；同时能与 MyBatis 的执行链无缝衔接（改写发生在 SQL 真正发送之前）。
- **逻辑分页 vs 物理分页？**  
   逻辑分页是查全量再截取，代价高；PageHelper 做的是**物理分页**，直接在数据库层面只取所需页。
- **深分页怎么办？**  
   MySQL 的“深分页”（`LIMIT a, b` 中的 `a` 很大）代价高，材料里也点到过这类写法；实战更建议“基于游标/主键的 seek 分页”来减负。

可直接落地的使用习惯（少而精的要点）

- **把 `startPage` 紧挨查询**：它只对**紧随其后**的一次查询生效，隔了别的查询就会被消费掉。
- **排序更稳妥**：要么在原 SQL 写 `ORDER BY`，要么使用 `PageHelper.orderBy("xxx desc")`，保证结果稳定。
- **别手写 `limit` 混用**：交给插件统一改写，避免方言/统计行为不一致。

# MyBatis 使用的设计模式

MyBatis 设计得不只是“一个持久层框架”，它内部的结构非常有模式感。面试问这个，其实是在考你对框架底层的理解程度，不是让你机械背名词。  
核心四个模式：

- **建造者** → `SqlSessionFactoryBuilder` 负责搭好“框架骨架”
- **工厂** → `SqlSessionFactory` 管理会话创建
- **代理** → `Mapper` 接口无实现，调用靠动态代理
- **模板方法** → `Executor` 规范执行流程，方便扩展

这些设计模式不是孤立存在，而是互相配合，构成了 MyBatis 轻量但高扩展性的底层架构。

### 建造者模式（Builder）

MyBatis 的整体初始化过程就是典型的建造者模式。它把复杂的配置解析过程拆成多步，通过 Builder 逐步组装出 `SqlSessionFactory`。

```java
SqlSessionFactory factory =
    new SqlSessionFactoryBuilder().build(inputStream);
```

这背后，`SqlSessionFactoryBuilder` 会读取配置文件，构建 `Configuration` 对象，再组装出完整的 `SqlSessionFactory` 实例。  
这种模式的意义在于：**构建步骤稳定，但配置灵活**。

### 工厂模式（Factory）

`SqlSessionFactory` 本身就是一个工厂类，它的职责很单纯——**创建 `SqlSession` 对象**，并屏蔽底层细节。

```java
try (SqlSession session = factory.openSession()) {
    // session 的创建由工厂完成
}
```

开发者不用关心连接池、执行器、缓存等对象的创建过程，全交给工厂封装。这就是工厂模式的典型应用场景：**集中创建、统一管理**。

### 代理模式（Proxy）

Mapper 接口没有实现类，但我们依然可以直接调用 `mapper.method()`，因为 MyBatis 利用了 **JDK 动态代理**。

```java
UserMapper mapper = session.getMapper(UserMapper.class);
mapper.selectWolf(1);
```

`getMapper` 返回的其实是代理对象，调用接口方法时，它会被代理拦截，转而执行对应的 SQL。  
代理模式的价值在于：**屏蔽实现细节，让接口像本地方法一样可用**，也是 MyBatis 核心的“无侵入”特性。

---

### 模板方法模式（Template Method）

在执行 SQL 时，MyBatis 内部通过 `Executor`（如 `BaseExecutor`、`SimpleExecutor`）定义了完整的执行流程：

1. 创建语句对象
2. 预编译与参数设置
3. 执行 SQL
4. 处理结果集

这些步骤由抽象类固定模板，具体的执行逻辑由子类扩展实现。  
这种结构的好处是：**稳定主流程，允许局部差异化**，非常适合扩展事务、缓存、插件等特性。

# MyBatis 主键回填的实现

MyBatis 中，**主键回填**的本质是：在 `INSERT` 语句执行后，将数据库自动生成的主键值取出来，再**反填到实体对象里**。  
这在保存新记录时非常常见，比如新增用户、帖子、订单后要立即拿到主键 ID 做后续操作。

MyBatis 提供了两种方式来实现这个能力：`useGeneratedKeys` 与 `<selectKey>`。

- 自增主键 → `useGeneratedKeys`，自动回填
- 自定义主键 → `<selectKey>`，先查/生成再插入

主键回填的核心 → JDBC 获取或手动查询主键 → 回写到对象属性

### `useGeneratedKeys`（最常见的方式）

这种方式是依赖数据库的主键自增机制（如 MySQL 的 `AUTO_INCREMENT`）。  
在 Mapper XML 中，直接在 `<insert>` 标签上配置两个属性：

```xml
<insert id="addWolf" parameterType="Wolf"
        useGeneratedKeys="true" keyProperty="id">
    INSERT INTO wolf (wolf_name, wolf_age)
    VALUES (#{wolfName}, #{wolfAge})
</insert>
```

- `useGeneratedKeys="true"` 表示启用 JDBC 的 `getGeneratedKeys` 方法，自动获取自增主键。
- `keyProperty="id"` 告诉 MyBatis 主键要回填到实体类的哪个属性上。

执行后：

```java
Wolf wolf = new Wolf();
wolf.setWolfName("Shadow");
wolf.setWolfAge(7);
wolfMapper.addWolf(wolf);
System.out.println(wolf.getId());  // ✅ 已被自动回填
```

这一方式简单直接，推荐在主键为自增 ID 时使用。

### `<selectKey>`（适用于非自增主键）

有些数据库不支持 `getGeneratedKeys`，或者主键生成策略是雪花 ID、序列、UUID，这时可以通过 `<selectKey>` 手动查询或生成主键，再回填。

```xml
<insert id="addWolfWithSeq" parameterType="Wolf">
    <selectKey keyProperty="id" order="BEFORE" resultType="int">
        SELECT NEXTVAL('wolf_seq')
    </selectKey>
    INSERT INTO wolf (id, wolf_name, wolf_age)
    VALUES (#{id}, #{wolfName}, #{wolfAge})
</insert>
```

- `keyProperty`：指定回填的字段。
- `order="BEFORE"`：表示在执行 INSERT 之前先执行 `selectKey` 语句。  
   （也可以用 `AFTER`，适用于某些返回主键的数据库）
- `resultType`：指定返回的主键类型。

这种方式更灵活，适合自定义主键生成策略，比如雪花算法、数据库序列等。

# MyBatis 一级缓存与二级缓存的区别

MyBatis 之所以性能不错，很大一部分来自它自带的缓存机制。**一级缓存**和**二级缓存**的区别，本质是缓存作用范围不同、触发时机不同。  
面试考这题，就是想听你说出这几个关键词：**范围、共享、失效机制、开启方式**。

- 一级缓存 → Session 级别，默认开启，事务内缓存查询结果
- 二级缓存 → Factory 级别，需手动开启，跨 Session 共享

任何写操作都会让缓存失效

### 一级缓存：`SqlSession` 级别（默认开启）

一级缓存存在于 `SqlSession` 对象的生命周期内。  
当在同一个 `SqlSession` 里执行**相同的查询**时，MyBatis 会优先从缓存中取结果，而不是再查数据库。

```java
SqlSession session = factory.openSession();
UserMapper mapper = session.getMapper(UserMapper.class);

User wolf1 = mapper.findById(1);
User wolf2 = mapper.findById(1);   // ✅ 命中一级缓存，不再查库
```

**特点：**

- 作用范围仅限当前 `SqlSession`。
- 默认开启，不需要额外配置。
- 当 `SqlSession` 被 `commit` / `close` / `clearCache` 后，缓存失效。
- 只要查询条件和 SQL 完全一致，就会命中。

一级缓存的意义在于：**减少同一事务内重复查询数据库的次数**。

### 二级缓存：`SqlSessionFactory` 级别（需手动开启）

二级缓存的范围更大，属于 **跨 SqlSession 共享** 的缓存。  
它以 Mapper 的 namespace 为单位，不同的 `SqlSession` 也能共享缓存数据。

```xml
<!-- Mapper XML 顶部开启二级缓存 -->
<cache/>
```

```java
// 第一次查询
try (SqlSession s1 = factory.openSession()) {
    UserMapper m1 = s1.getMapper(UserMapper.class);
    m1.findById(1);  // ❗第一次查数据库，结果写入二级缓存
}

// 第二次查询（不同 Session）
try (SqlSession s2 = factory.openSession()) {
    UserMapper m2 = s2.getMapper(UserMapper.class);
    m2.findById(1);  // ✅ 命中二级缓存，不查数据库
}
```

**特点：**

- 作用范围是整个 `SqlSessionFactory`。
- 不同 `SqlSession` 可以共享缓存。
- 需要显式在 Mapper XML 中开启 `<cache/>`。
- 对象必须实现 `Serializable`。
- 更新（C/U/D）操作会清空对应 namespace 的二级缓存。

二级缓存的意义在于：**减少多用户、多事务环境下的重复查询，提高整体性能**。

### 失效与刷新机制

无论一级还是二级缓存，都会在出现以下情况时失效：

- 执行了 `INSERT`、`UPDATE`、`DELETE` 操作
- `commit`、`rollback`、`clearCache`
- 查询条件不同（缓存 key 不一样）

# MyBatis 的实现原理（源码层面）

面试这一题时，考官通常想听到的就是：**从调用 Mapper 接口 → 到 SQL 执行 → 到结果返回，这中间 MyBatis 究竟做了什么**。  
回答时只要能清楚、有逻辑地讲出执行流程 + 核心类结构 + 设计目的，就已经是很好的答案了。

| 阶段     | 关键组件                                     | 主要职责                             |
| -------- | -------------------------------------------- | ------------------------------------ |
| 配置加载 | `SqlSessionFactoryBuilder` / `Configuration` | 解析配置、映射 SQL、初始化框架       |
| 会话管理 | `SqlSessionFactory` / `SqlSession`           | 提供执行上下文                       |
| 映射代理 | MapperProxy（JDK Proxy）                     | 拦截接口调用，找到对应 SQL           |
| 执行调度 | `Executor` + 各 Handler                      | 参数绑定、预编译、执行 SQL、封装结果 |
| 缓存机制 | 一级/二级缓存                                | 提升性能，减少重复查询               |
| 插件机制 | Interceptor 拦截器链                         | 扩展执行过程（分页、审计、SQL 改写） |
| 结果返回 | ResultSetHandler                             | 结果对象映射、事务收尾、资源释放     |

MyBatis 的源码逻辑可以概括为：

> **解析配置 → Mapper 代理 → Executor 执行链 → Handler 参数与结果处理 → 缓存与插件扩展 → 返回结果。**

## 配置阶段：构建 Configuration

当应用启动时，MyBatis 会先加载配置文件 `mybatis-config.xml`，解析其中的环境信息、插件配置、Mapper 映射文件，并最终构建出一个全局的 `Configuration` 对象。  
这个过程由 `SqlSessionFactoryBuilder` 主导，对应的是建造者模式。

```java
SqlSessionFactory factory =
    new SqlSessionFactoryBuilder().build(inputStream);
```

- 解析全局配置文件
- 读取 Mapper XML，解析 SQL、参数类型、返回类型
- 封装成 `MappedStatement` 存入 `Configuration`
- 初始化事务管理器、数据源、插件链等

这一步的产物就是 `SqlSessionFactory`，是后面所有会话的“母体”。

---

## 会话阶段：创建 SqlSession

开发者调用 `factory.openSession()` 时，MyBatis 会根据 `Configuration` 生成一个 `DefaultSqlSession` 对象，并绑定一个 `Executor`（执行器）。

```java
SqlSession session = factory.openSession();
```

- `SqlSession` 提供最上层 API（select / insert / update / delete）
- `Executor` 决定执行策略（SimpleExecutor、ReuseExecutor、BatchExecutor）
- 这里还挂载了一级缓存

这一步的作用，是搭建好执行 SQL 所需的上下文环境。

---

## 映射阶段：Mapper 动态代理

当调用 `session.getMapper(UserMapper.class)` 时，MyBatis 使用 **JDK 动态代理** 创建了一个 Mapper 接口的代理对象。

```java
UserMapper mapper = session.getMapper(UserMapper.class);
User wolf = mapper.findById(1);
```

- 代理对象拦截方法调用
- 根据 `Mapper 接口 + 方法名` 拼接唯一 ID
- 在 `Configuration` 中找到对应的 `MappedStatement`
- 准备交给执行器处理

这一步实现了“接口无实现类也能调用 SQL”。

---

## 执行阶段：Executor 调度

拿到 MappedStatement 后，MyBatis 的 `Executor` 负责驱动整个执行链：

```java
executor.query(mappedStatement, parameter, rowBounds, resultHandler);
```

内部流程非常明确：

1. 创建 `StatementHandler`（根据 Statement 类型决定使用什么 handler）
2. `ParameterHandler` 完成 `#{}` 占位符绑定
3. 预编译 SQL
4. 执行查询或更新
5. `ResultSetHandler` 封装结果对象

👉 这一层实际上就是对 JDBC 的一层优雅封装 + 插件拦截点。

---

## 缓存阶段：一级 & 二级缓存

在执行 SQL 前，`Executor` 会先查缓存：

- **一级缓存**：`SqlSession` 级别，默认开启
- **二级缓存**：`SqlSessionFactory` 级别，需显式 `<cache/>` 开启

查询命中缓存 → 直接返回结果；  
没命中 → 执行 SQL 并写入缓存。

👉 缓存机制让重复查询不再打数据库。

---

## 插件机制：拦截四大对象

MyBatis 的强大扩展性来自它的插件机制。  
拦截器可以介入：

- `Executor`
- `StatementHandler`
- `ParameterHandler`
- `ResultSetHandler`

比如 PageHelper 分页插件，就是拦截 `StatementHandler` 改写 SQL。

👉 这一步体现了框架的“插拔式”设计理念。

---

## 结果封装与资源释放

执行完成后：

- `ResultSetHandler` 根据 ResultMap 规则封装对象
- 写入缓存（如开启二级缓存）
- SqlSession 关闭时，清空一级缓存、释放连接、提交或回滚事务。

# MyBatis 插件原理

MyBatis 的插件，本质就是在 SQL 执行链的**关键节点插钩子**。  
它不会改核心流程，只是用 **动态代理** 把原来的对象“包一层”，在方法执行前后加自己的逻辑。

当 MyBatis 创建执行组件时，比如 `StatementHandler`，它会依次经过插件链，每个插件都能决定：  
“我要不要拦这个方法，要的话做点什么，不要的话直接放行”。

插件只能动四个核心对象的手脚：

- `Executor`（控制 SQL 执行过程）
- `StatementHandler`（SQL 准备与执行）
- `ParameterHandler`（参数处理）
- `ResultSetHandler`（结果映射）

插件靠动态代理包四大对象，拦方法、做逻辑、再放行。比如分页插件就是拦 `StatementHandler`，在 SQL 发出去前，偷偷在后面拼上 `LIMIT`。

## 插件的样子

插件要实现 `Interceptor` 接口，写一个 `intercept` 方法：

```java
@Override
public Object intercept(Invocation invocation) throws Throwable {
    // 这里可以改 SQL、做日志、审计……
    return invocation.proceed(); // 放行
}
```

MyBatis 初始化时会调用 `Plugin.wrap()` 给目标对象包一层代理。  
执行时先过你这关，再去干原来的事。

---

## 什么时候用

这个机制适合所有“**横切**”的逻辑，比如：

- 分页
- SQL 审计 / 改写
- 参数脱敏
- 结果集处理

不用去改 Mapper，也不用碰框架源码，一层插件就能搞定。

# Xml 映射文件与 Dao 接口的工作原理

MyBatis 的 Mapper（也就是 Dao 接口）和 XML 映射文件，其实是一对“方法签名”与 “SQL” 的映射关系。  
框架的核心逻辑就是通过这个映射，在你调用接口方法时，**精准定位要执行的 SQL**。

> 核心机制：方法 → SQL ID → MappedStatement

MyBatis 是靠 “接口名 + 方法名” 精准映射 XML 中的 SQL。调用 Mapper 接口 → 代理拦截 → 找 MappedStatement → 执行 SQL。方法不能重载，因为 key 会冲突。

当你写了一个 Dao 接口，比如：

```java
public interface WolfMapper {
    Wolf findById(int id);
}
```

对应的 XML 文件大概长这样：

```xml
<mapper namespace="com.wreckloud.wolfpack.mapper.WolfMapper">
    <select id="findById" parameterType="int" resultType="Wolf">
        SELECT * FROM wolf WHERE id = #{id}
    </select>
</mapper>
```

调用 `mapper.findById(1)` 时，MyBatis 会走这样一条线：

1. `getMapper(WolfMapper.class)` → 返回 JDK 动态代理对象
2. 代理对象拦截 `findById` 调用
3. 取全限定名 + 方法名：

```
com.wreckloud.wolfpack.mapper.WolfMapper.findById
```

4. 去 `Configuration` 中找到对应的 `MappedStatement`（在加载 XML 时已经存进去）
5. 从 MappedStatement 中拿到 SQL，执行，返回结果

没有实现类，全靠动态代理 + ID 定位 SQL。

## 为什么不能方法重载

因为 MyBatis 识别 SQL 的方式就是：

```
namespace（接口名） + 方法名
```

如果你在接口里写两个方法：

```java
Wolf findById(int id);
Wolf findById(String name);
```

两者在 MyBatis 里都会映射成

```
com.wreckloud.wolfpack.mapper.WolfMapper.findById
```

会产生冲突，根本找不到对应 SQL。  
所以 —— **方法不能重载**，除非你人为给不同 SQL 分配不同 ID 名称，比如 `findById` 和 `findByName`。

## namespace 的重要性

XML 的 `namespace` 必须和接口的全类名完全一致，这样代理在查找 MappedStatement 时才能匹配成功。  
这也是为什么面试里常问“为什么必须同名”的原因——因为这就是 MyBatis 识别 SQL 的 key。

# 批量插入在 MyBatis 里怎么做

这题只需要抓住两条主线：**一条 SQL 拼多行值**，和 **多条 SQL 走批处理执行器**。两种方式各自适用，回答时把“怎么写”“何时用”“风险点”说清楚就行。

- **怎么选**：中小批量 →`<foreach>` 多值插入；大批量/长批次 →`ExecutorType.BATCH` 聚合执行。
- **怎么稳**：控制单批规模，必要时分批 `commit()`；遇到“包过大”，优先**缩批**，其次再考虑调 `max_allowed_packet`。

## 用 `<foreach>` 把一条 `INSERT` 拼成多值（适合中小批量）

思路是：SQL 只写一次 `INSERT INTO ... VALUES`，把待插入的数据在 `VALUES` 段用 `<foreach>` 展开为多组值。MyBatis 在发往数据库前先把 XML 模板渲染成一条完整 SQL，再执行。

```xml
<!-- Mapper 方法 -->
void addForEach(@Param("userList") List<User> user);

<!-- XML -->
<insert id="addForEach" parameterType="list">
  INSERT INTO t_user(user_name, pwd, salt)
  VALUES
  <foreach collection="userList" item="u" separator=",">
    (#{u.username}, #{u.pwd}, #{u.salt})
  </foreach>
</insert>
```

这种方式足够直观，但要注意一个硬限制：
当拼出的 SQL 过大（例如一次塞太多值），会触发 MySQL 的 `max_allowed_packet` 上限并报 `PacketTooBigException`。实务上要么**控制每批数量**，要么在数据库侧**调大该阈值**后再用。

---

## 用 `ExecutorType.BATCH` 走批处理执行（适合大批量、长批次）

思路是：仍然调用**单条插入**的 Mapper 方法，但把 `SqlSession` 打开为 **批处理模式**，由 MyBatis 聚合多次执行、按批提交，减少网络往返与事务开销。

```java
// 1) 打开批处理会话（可按需关闭自动提交）
SqlSession sqlSession = sqlSessionFactory.openSession(ExecutorType.BATCH, false);
UserMapper mapper = sqlSession.getMapper(UserMapper.class);

// 2) 循环塞入批处理；按固定步长分批提交，避免内存/包大小问题
for (int i = 0; i < userList.size(); i++) {
    mapper.add(userList.get(i));       // 单条 insert 映射
    if (i % 1000 == 0) sqlSession.commit();
}
sqlSession.commit();
```

`ExecutorType.BATCH` 的关键点在**执行器**：它把多次 insert 聚合、延迟真正下发，配合“每 N 条提交一次”的节律更稳妥。这一写法与分批 `commit()` 的示例在讲义里给了完整片段，可直接复用。

# 一对一 / 一对多 在 MyBatis 里的正确写法与心法

MyBatis 的“关系映射”靠 `resultMap` 把主对象与其关联对象的列做**精确对应**。

- **一对一**用 `<association>`，**一对多**用 `<collection>`，都写在主 `resultMap` 里，对应子对象/集合的字段逐一映射。
- 懒加载只对这两种关联生效，按需触发 SQL。

## 一对一（`<association>`）：把“证件”装进“人”

适合“一个人只有一张证件”这类场景。关键是把从表的列映射到主对象的一个嵌套属性。

```xml
<resultMap id="personMap" type="com.gxa.entity.Person">
  <id     column="person_id"  property="id"/>
  <result column="person_name" property="name"/>

  <!-- 一对一 -->
  <association property="card" javaType="com.gxa.entity.IdCard">
    <id     column="card_id" property="id"/>
    <result column="fzjg"    property="fzjg"/>
  </association>
</resultMap>
```

- `<association>` 指定**目标属性**（`property="card"`）与其**Java 类型**；
- 内部再写该子对象的字段映射；
- 这样查询主表时，可一次性把子对象装好（联查或分步查由你的 SQL 决定）。示例结构与讲义一致。

---

## 一对多（`<collection>`）：把“员工列表”装进“部门”

适合“一个部门多个员工”这类场景。关键是把子表的多行映射为主对象的一个 `List`。

```xml
<!-- 一对多，集合类型与元素类型都要说明 -->
<collection property="emps" javaType="list" ofType="com.gxa.entity.Emp">
  <id     column="emp_id"   property="id"/>
  <result column="emp_name" property="name"/>
  <result column="gender"   property="gender"/>
  <result column="status"   property="status"/>
</collection>
```

- `<collection>` 指定集合落在**哪个属性**（`property="emps"`），以及集合元素的**Java 类型**；
- 内部是元素对象的字段映射。示例与讲义一致。

---

## 延迟加载的补充（只对关联与集合生效）

MyBatis 仅对 `association` / `collection` 支持懒加载；在 `mybatis-config.xml` 里开启 `lazyLoadingEnabled` 后，访问到关联属性时才触发对应 SQL。讲义明确写了“association=一对一，collection=一对多，并可懒加载”。

# MyBatis 是否支持延迟加载？如果支持，它的实现原理是什么？

MyBatis 支持延迟加载/懒加载，但它只作用于两类关联关系：

- 一对一（`association`）
- 一对多（`collection`）

通过 CGLIB 代理对象拦截属性访问 → 触发延迟查询 → 回填真实数据。
也就是说，只有当你在 `resultMap` 中使用了这两种关联映射，并开启了全局开关，MyBatis 才会真正启用懒加载逻辑。

## 开启方式

懒加载默认是关闭的，需要在 `mybatis-config.xml` 中配置：

```xml
<settings>
    <setting name="lazyLoadingEnabled" value="true"/>
</settings>
```

一旦开启，在第一次查询主对象时，MyBatis 不会立即去查关联表的数据，而是只查主表。

---

## 实现原理

MyBatis 的懒加载依赖 **CGLIB 生成目标对象的代理** 来实现：

1. 查询主对象时，MyBatis 会给它的关联属性（`association` / `collection`）设置一个代理对象，而不是立刻赋真实值；
2. 当你第一次调用 `a.getB()`（访问关联属性）时，代理会进入拦截逻辑；
3. 拦截器发现 `B` 还没有被加载，就会执行之前准备好的关联 SQL；
4. 查出 `B` 后，通过 `a.setB(b)` 把真实对象填回去；
5. 再把结果返回给调用者。

这整个过程对开发者是无感的，就像正常访问对象属性一样。

---

## 延迟加载的意义

- 减少不必要的 SQL 查询
- 控制查询时机，避免一次性加载大量数据
- 提高复杂对象映射的灵活性
