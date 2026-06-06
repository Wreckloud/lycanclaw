---
title: 'MyBatis'
date: '2025-10-15 09:30:54'
description: '这是一篇新文章!'
order: 0
publish: true
tags:
  - MyBatis
  - 面试
  - ORM
---

# #{} 和 ${} 的区别

`#` 是 MyBatis 中的**预编译占位符**，底层对应 JDBC 的 `PreparedStatement`。  
执行前会把 `#{}` 替换为 `?`，再通过 `set` 方法安全赋值。  
这样既能让 SQL 被缓存、执行更快，也能有效防止 SQL 注入（因为参数不会参与 SQL 结构拼接）。

相比之下，`${}` 是**字符串直接替换**，相当于简单拼接。  
它不参与预编译，因此**只能用于拼接 SQL 结构**（如表名、列名、ORDER BY 字段、LIMIT 参数等），  
若直接用来接收用户输入，会造成注入风险。

# MyBatis 与 ORM 的区别

**MyBatis** 是一种“半自动化”的持久层框架。开发者需要自己编写 SQL 语句，MyBatis 负责管理 JDBC 的底层操作（连接、执行、结果映射等）。  
这样做虽然比全自动的 Hibernate 略繁琐，但**控制权在开发者手上**，SQL 可调优、可精细化定制，特别适合业务逻辑复杂、性能要求高、SQL 灵活多变的场景。

**Hibernate / JPA** 则属于“全自动化”ORM 框架。它能根据实体类结构自动生成 SQL，让开发者更专注于面向对象编程，但对 SQL 控制较弱、调优不便，适合结构稳定、增删改查占主导的场景。

因此：

- MyBatis 追求 **“灵活与可控”**；
- Hibernate 追求 **“省力与抽象”**。

大多数企业最终选择 MyBatis，是因为它**平衡了效率与掌控**——既简化了 JDBC，又保留了对 SQL 的主导权。

# MyBatis 动态 SQL 标签

MyBatis 的 **动态 SQL**，本质是让 SQL 能像 Java 逻辑一样“动起来”，但不再用字符串拼接，而是通过 XML 标签来控制拼接逻辑。  
它的目的有两个：

1. 减少 if-else 拼字符串的冗余，让 SQL 逻辑更清晰；
2. 根据实际条件动态生成 SQL，既灵活又高效。

常见的标签包括：

- `<if>`：按条件拼接 SQL；
- `<where>` / `<trim>`：智能地补 WHERE、去掉多余 AND；
- `<set>`：动态更新时拼接 SET；
- `<foreach>`：实现批量 IN 查询或批量插入；
- `<choose>` / `<when>` / `<otherwise>`：实现多分支逻辑。

### 1. `<if>` 条件判断

```xml
<select id="findWolf" resultType="Wolf">
  SELECT * FROM wolf
  <where>
    <if test="name != null and name != ''">
      wolf_name = #{name}
    </if>
    <if test="age != null">
      AND wolf_age = #{age}
    </if>
  </where>
</select>
```

有条件时拼接对应语句，没有时自动忽略。  
搭配 `<where>` 可自动处理多余的 `AND`。

### 2. `<set>` 动态更新字段

```xml
<update id="updateWolf">
  UPDATE wolf
  <set>
    <if test="name != null"> wolf_name = #{name}, </if>
    <if test="age != null"> wolf_age = #{age}, </if>
    <if test="color != null"> color = #{color} </if>
  </set>
  WHERE id = #{id}
</update>
```

`<set>` 会自动去掉最后多余的 `,`，避免拼接错误。

### 3. `<foreach>` 批量操作

```xml
<delete id="deleteByIds">
  DELETE FROM wolf WHERE id IN
  <foreach collection="idList" item="id" open="(" separator="," close=")">
    #{id}
  </foreach>
</delete>
```

自动拼接成 `IN (1,2,3,4)`，常用于批量删除、查询或插入。

### 4. `<choose>` 分支逻辑

```xml
<select id="findWolfSmart" resultType="Wolf">
  SELECT * FROM wolf
  <where>
    <choose>
      <when test="name != null">
        wolf_name = #{name}
      </when>
      <when test="age != null">
        wolf_age = #{age}
      </when>
      <otherwise>
        color = 'grey'
      </otherwise>
    </choose>
  </where>
</select>
```

相当于 Java 的 `switch ... case ... default`。只会匹配第一个满足的条件，避免多重判断。

### 5. `<trim>` 灵活控制前后缀

```xml
<select id="findWolfTrim" resultType="Wolf">
  SELECT * FROM wolf
  <trim prefix="WHERE" prefixOverrides="AND |OR ">
    <if test="name != null"> AND wolf_name = #{name} </if>
    <if test="age != null"> AND wolf_age = #{age} </if>
  </trim>
</select>
```

`<trim>` 是 `<where>` 的加强版，可以自定义前后缀，更灵活。

# MyBatis 插件原理

MyBatis 插件通过 **动态代理** 包装四大核心对象，MyBatis 的插件只能拦截这四种核心对象的方法：

- `Executor`（SQL 的统一执行入口）
- `StatementHandler`（负责生成/准备最终要执行的 SQL）
- `ParameterHandler`（参数安全地绑定到占位符`?`上）
- `ResultSetHandler`（把结果集映射成对象）

在执行方法时“插队”执行我们自定义的逻辑。插件是基于 **责任链模式**，执行时会层层调用每个代理对象的 `intercept()` 方法。  
我们实现插件时只需：

1. 实现 `Interceptor` 接口；
2. 使用 `@Intercepts` 和 `@Signature` 标明拦截目标；
3. 注册到 MyBatis 配置中。

这使得开发者能在不修改源码的情况下，对 SQL 执行过程进行灵活扩展。

插件靠动态代理包四大对象，拦方法、做逻辑、再放行。比如分页插件就是拦 `StatementHandler`，在 SQL 发出去前，偷偷在后面拼上 `LIMIT`。

插件要实现 `Interceptor` 接口，写一个 `intercept` 方法：

```java
@Intercepts({
    @Signature(
        type = StatementHandler.class,     // 拦截目标对象类型
        method = "prepare",                // 拦截目标方法
        args = {Connection.class, Integer.class}  // 方法参数
    )
})
public class MyPlugin implements Interceptor {

    // 真正的拦截逻辑
    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        Object target = invocation.getTarget(); // 被拦截对象
        Method method = invocation.getMethod(); // 被拦截方法
        Object[] args = invocation.getArgs();   // 参数

        System.out.println("插件介入: " + method.getName());

        // 执行原方法（放行）
        return invocation.proceed();
    }

    // 插件包装逻辑（生成代理对象）
    @Override
    public Object plugin(Object target) {
        return Plugin.wrap(target, this);
    }

    // 插件参数（可从配置文件中读取）
    @Override
    public void setProperties(Properties properties) {
        System.out.println("插件参数：" + properties);
    }
}
```

| 方法              | 功能                               |
| ----------------- | ---------------------------------- |
| `intercept()`     | 拦截目标方法，执行增强逻辑（核心） |
| `plugin()`        | 为目标对象创建代理（决定是否拦截） |
| `setProperties()` | 读取插件参数（来自配置）           |

MyBatis 初始化时会调用 `Plugin.wrap()` 给目标对象包一层代理。执行时先过你这关，再去干原来的事。

# MyBatis 怎么实现分页？

PageHelper 的核心是靠 MyBatis **插件拦截** `StatementHandler.prepare(...)`，把一条“原始查询 SQL”自动改造成“统计总数 + 只查当页数据”。

1. 生成一条 **count SQL**：`select count(*) from (原SQL) t` → 拿到总记录数；
2. 改写 **原 SQL**：在末尾拼接数据库方言的分页片段（如 MySQL 的 `limit ?, ?`）。

我们只需在查询前声明 `PageHelper.startPage(pageNum, pageSize)`，再执行原查询，最后 `new PageInfo<>(list)` 就能同时拿到列表和总数。
记住，它只作用于紧随其后的那次查询，排序用 `orderBy()` 更安全。

```java
@GetMapping("/wolves")
public PageInfo<Wolf> list(@RequestParam int pageNum, @RequestParam int pageSize) {
    PageHelper.startPage(pageNum, pageSize);   // ① 声明“我要分页”
    PageHelper.orderBy("wolf_age desc");       // ②（可选）安全地加 ORDER BY
    List<Wolf> list = wolfMapper.selectAll();  // ③ 执行“正常查询”
    return new PageInfo<>(list);               // ④ 封装：数据 + 总数 + 页码信息
}
```

Mapper：

```xml
<select id="selectAll" resultType="Wolf">
  SELECT id, wolf_name, wolf_age, color FROM wolf
</select>
```

# MyBatis 主键回填的实现

插入成功后，把数据库生成的主键（通常是自增 id）“回填”到你的 Java 对象里（如 `wolf.setId(...)` 已有值）。

1. **JDBC 原生回填**（推荐，MySQL 常用）：`useGeneratedKeys + keyProperty`
2. **显式查询主键**（跨库通用/有序列的库）：`<selectKey>`（如 Oracle sequence、部分场景下的 PG）

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
System.out.println(wolf.getId());  // 已被自动回填
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
