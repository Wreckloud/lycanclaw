---
title: SSM注解与XML对照实践
date: 2025-09-29 16:07:46
description: 这是一篇新文章!
order: 0
publish: true
tags:
---

# 序

SSM 是一个组合式的后端解决方案，由

- **Spring**
- **SpringMVC**
- **MyBatis**

三个框架组成。

Spring 管理 Bean 和事务，SpringMVC 处理请求和响应，MyBatis 负责执行 SQL 和映射结果。  
这三者搭在一起，就能从接收 HTTP 请求，到访问数据库，再到返回数据，形成完整的闭环。

相比早期单纯用 Servlet/JSP 的项目，SSM 有两个显著好处：

- **开发效率更高**：不用手动管理对象和事务，减少大量重复样板代码
- **结构更清晰**：控制器、业务、数据访问分层明确，便于维护和扩展

虽然现在企业项目更多使用 Spring Boot，它进一步简化了配置，让 SSM 的搭建过程自动化了，但理解 SSM 仍然重要：  
它能帮助看清 Spring Boot 背后的原理，遇到问题时也能回退到最底层去排查。

我们以一张 `wolf` 表为例，搭建一个最小的 SSM 项目，实现增删改查接口：

- `GET /wolf/list`
- `POST /wolf/add`
- `PUT /wolf/update`
- `DELETE /wolf/delete/{id}`

整个过程会分别用注解写法和 XML 写法完成，按步骤展开，观察它们的异同。  
大体顺序是：

```
配置入口 → 接通数据库 → 加上事务 → 打开 MVC → 编写实体和 Mapper → 实现 Service 和 Controller → 最后验证结果。
```

# 准备工作

在动手前，先把最基本的环境和约定定下来。做到这些，就足够支撑后面的完整增删改查流程。

### 开发环境与依赖

以 JDK 17 + Tomcat 8.5 为例，数据库选 MySQL 8。  
核心依赖只需要以下几个，能跑通主线即可：

```xml
<dependencies>
  <!-- Spring 核心容器 -->
  <dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-context</artifactId>
    <version>5.3.30</version>
  </dependency>

  <!-- SpringMVC，处理请求与响应 -->
  <dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-webmvc</artifactId>
    <version>5.3.30</version>
  </dependency>

  <!-- MyBatis 核心 -->
  <dependency>
    <groupId>org.mybatis</groupId>
    <artifactId>mybatis</artifactId>
    <version>3.5.15</version>
  </dependency>

  <!-- Spring 与 MyBatis 的整合 -->
  <dependency>
    <groupId>org.mybatis</groupId>
    <artifactId>mybatis-spring</artifactId>
    <version>2.1.2</version>
  </dependency>

  <!-- 数据库连接池（Druid） -->
  <dependency>
    <groupId>com.alibaba</groupId>
    <artifactId>druid</artifactId>
    <version>1.2.20</version>
  </dependency>

  <!-- MySQL 驱动 -->
  <dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
    <version>8.0.33</version>
  </dependency>

  <!-- JSON 序列化，返回对象时自动转成 JSON -->
  <dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
    <version>2.17.2</version>
  </dependency>
</dependencies>
```

别的日志框架、测试框架（如 Lombok、JUnit）虽然常用，但不是主线，不在这里展开。

### 数据库与表的约定

新建数据库 `ssm_db`，其中有一张 `wolf` 表，记录狼群成员信息。先建立数据库，再在其中创建 `wolf` 表：

```sql
-- 创建数据库
CREATE DATABASE ssm_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 切换到该库
USE ssm_db;

-- 创建 wolf 表
CREATE TABLE wolf (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  age INT,
  email VARCHAR(100),
  created_time DATETIME,
  updated_time DATETIME
);
```

这一张表就足够覆盖增删改查的常见场景。

### 项目分层约定

后文的所有代码与说明，都默认按这一分层展开：

- **controller**：接收 HTTP 请求，返回 JSON 数据
- **service**：承载业务逻辑与事务控制
- **mapper**：声明与数据库交互的方法
- **db**：底层数据库表，`wolf`

分层明确，便于后续把同一功能点用两种配置方式横向对比。

# 入口与容器

一个 Web 项目要能跑起来，首先要把“入口”装好。  
用户的请求进入 Tomcat 后，要有一个统一的分发器接住——这就是 **DispatcherServlet**。  
它负责把请求交给 SpringMVC 处理，然后再一层层下去到 Service 和 Mapper。

在 SSM 里，这个入口有两种常见写法：

### 注解写法

从 Servlet 3.0 开始，`web.xml` 可以不再是必需文件。
甚至在现代的 Spring Boot 项目里，`@SpringBootApplication` 启动类会自动完成 DispatcherServlet 的注册，用脚手架甚至自带启动类，无需手动配置。

Spring 提供了 `AbstractAnnotationConfigDispatcherServletInitializer`，继承它就能完成 DispatcherServlet 的注册。

这里有两个容器需要区分：

- **Root 容器**：管理数据源、事务、MyBatis 等后端组件
- **MVC 容器**：管理 Controller、视图解析器、消息转换器

写法如下：

```java
public class AppInitializer extends AbstractAnnotationConfigDispatcherServletInitializer {

    // Root 容器：负责后端组件
    @Override
    protected Class<?>[] getRootConfigClasses() {
        return new Class[]{ RootConfig.class };
    }

    // MVC 容器：负责 Web 层
    @Override
    protected Class<?>[] getServletConfigClasses() {
        return new Class[]{ WebMvcConfig.class };
    }

    // DispatcherServlet 拦截所有请求
    @Override
    protected String[] getServletMappings() {
        return new String[]{ "/" };
    }
}
```

只要把这个类放在 **源码根目录的包下**，更推荐新建一个 `config` 包，把配置类集中放那里，Tomcat 启动时就会自动加载它。

```
src/main/java
 └─ com
     └─ wreckloud
         ├─ controller
         ├─ service
         ├─ mapper
         └─ config      ← 放 AppInitializer、RootConfig、WebMvcConfig
```

### XML 写法

如果不用注解写法，就要依赖 `web.xml` 来配置 DispatcherServlet。这种方式最直观，能一眼看到加载了哪些配置文件。

新建 Web 项目时，`web.xml` 通常会自动生成，位置在 **`src/main/webapp/WEB-INF/`** 目录下。它是 Web 应用的部署描述文件，Tomcat 启动时只会从这里读取。

一个常见的配置如下：

```xml
<!-- DispatcherServlet：SpringMVC 的入口，所有请求都会先交给它 -->
<servlet>
  <servlet-name>springmvc</servlet-name>
  <servlet-class>org.springframework.web.servlet.DispatcherServlet</servlet-class>

  <!-- contextConfigLocation：告诉 DispatcherServlet 从哪些配置文件加载 Bean -->
  <init-param>
    <param-name>contextConfigLocation</param-name>
    <param-value>
      classpath:springmvc.xml,      <!-- 管 Controller 和 MVC 配置 -->
      classpath:spring-mybatis.xml, <!-- 管数据源和 MyBatis -->
      classpath:spring-tx.xml       <!-- 管事务 -->
    </param-value>
  </init-param>

  <!-- Tomcat 启动时立刻加载这个 Servlet -->
  <load-on-startup>1</load-on-startup>
</servlet>

<!-- 映射路径：拦截所有请求交给 DispatcherServlet 处理 -->
<servlet-mapping>
  <servlet-name>springmvc</servlet-name>
  <url-pattern>/</url-pattern>
</servlet-mapping>
```

一般还会顺带加一个字符编码过滤器，放在所有过滤器的最前面，避免请求参数出现中文乱码：

```xml
<!-- 过滤器：统一设置请求和响应的编码为 UTF-8 -->
<filter>
  <filter-name>characterEncodingFilter</filter-name>
  <filter-class>org.springframework.web.filter.CharacterEncodingFilter</filter-class>
  <init-param>
    <param-name>encoding</param-name>
    <param-value>UTF-8</param-value>
  </init-param>
  <init-param>
    <param-name>forceEncoding</param-name>
    <param-value>true</param-value>
  </init-param>
</filter>

<!-- 让过滤器作用于所有请求 -->
<filter-mapping>
  <filter-name>characterEncodingFilter</filter-name>
  <url-pattern>/*</url-pattern>
</filter-mapping>
```

在这种写法里，DispatcherServlet 只是“入口”，真正的配置文件在 **`src/main/resources/`** 下，由它去加载以下这些配置文件：

- `springmvc.xml`  只放 Controller 和 MVC 相关配置
- `spring-mybatis.xml`  只放数据源和 MyBatis 配置
- `spring-tx.xml`  只放事务管理

这种分工方式更接近早期团队开发的习惯：谁负责哪一层，就维护对应的 XML 文件。小项目完全可以合并成一个 `applicationContext.xml`，但拆分能让结构更清晰。

到这里，项目的“门”就装上了。接下来就是接通数据库和 MyBatis，让数据能流动。

# 数据源与 MyBatis

入口有了，但容器只是个空壳。要让它真正活起来，还得把数据库接上，数据才能在各层之间流动。

这里会涉及几个关键角色：

- **数据库配置**：账号、密码、URL 等写在 `db.properties`，放在 `src/main/resources/` 下，方便统一管理。
- **数据源（连接池）**：维护和复用数据库连接，避免每次执行 SQL 都重新建连接。
- **SqlSessionFactory**：MyBatis 的核心工厂，决定 SQL 怎么跑、结果怎么映射。
- **Mapper**：接口和 SQL 映射文件，负责把 Java 方法和数据库语句对上号。

无论是那种方式，只要同一套键名（驱动、URL、用户名、密码）在绝大多数项目都适用，只需替换具体值即可，方便在开发、测试、线上环境之间切换不同的连接参数。

```properties
# src/main/resources/db.properties
jdbc.driver=com.mysql.cj.jdbc.Driver
jdbc.url=jdbc:mysql://localhost:3306/ssm_db?useSSL=false&serverTimezone=UTC&characterEncoding=utf8
jdbc.username=root
jdbc.password=你的密码
```

> 在 MySQL 5.x 及更早版本，驱动类是 `com.mysql.jdbc.Driver`；  
> 从 MySQL 8.0 开始，驱动类换成了 `com.mysql.cj.jdbc.Driver`。

接下来，就分别看看用 **注解** 和 **XML** 两种方式，怎么把这些角色串起来。

### 注解方式

在传统 SSM 项目里，常见做法是在 `config` 包下单独建一个配置类，比如 `DataSourceConfig`。它承担三件事：

1. 从 `db.properties` 里读取数据库连接信息
2. 建立一个数据源（连接池，用 Druid 或 HikariCP 都可以）
3. 配置 MyBatis 的工厂（`SqlSessionFactory`），告诉它去哪里找 Mapper

**配置入口**

```java
@Configuration
@PropertySource("classpath:db.properties")   // 从类路径载入数据库参数
@MapperScan("com.wreckloud.mapper")          // 为该包下的接口生成 Mapper 代理
public class DataSourceConfig { }
```

`@MapperScan` 会自动扫描包下的接口，让它们变成可调用的 Mapper 代理，省去了逐个注册的麻烦。

接着在 DataSourceConfig 类里配置数据源（连接池）

```java
@Bean
public DataSource dataSource(Environment env) {
    var ds = new com.alibaba.druid.pool.DruidDataSource();
    ds.setDriverClassName(env.getProperty("jdbc.driver"));
    ds.setUrl(env.getProperty("jdbc.url"));
    ds.setUsername(env.getProperty("jdbc.username"));
    ds.setPassword(env.getProperty("jdbc.password"));
    return ds;
}
```

连接的创建与销毁成本很高，连接池负责复用连接，不需要每次都新建和销毁。后续所有对数据库的访问都会走这里提供的 `DataSource`。

继续在 DataSourceConfig 类配置 MyBatis 运行工厂（SqlSessionFactory）

```java
@Bean
public SqlSessionFactory sqlSessionFactory(DataSource ds) throws Exception {
    var fb = new org.mybatis.spring.SqlSessionFactoryBean();
    fb.setDataSource(ds);                                     // 用哪个数据源
    fb.setConfigLocation(new ClassPathResource("mybatis.cfg.xml")); // MyBatis 全局配置
    fb.setMapperLocations(new org.springframework.core.io.support
            .PathMatchingResourcePatternResolver()
            .getResources("classpath:/mapper/*.xml"));        // SQL 映射文件
    fb.setTypeAliasesPackage("com.wreckloud.entity");         // 实体类别名
    return fb.getObject();
}
```

`SqlSessionFactory` 是 MyBatis 的“大脑”。它负责：

- 连接池交给谁
- 全局行为怎么设定
- SQL 写在哪个位置

Mapper 接口就是通过它生成的 `SqlSession` 来跑 SQL，并把结果组装成实体类。

### XML 方式

如果走 XML 路子，这些配置都会写在 `spring-mybatis.xml` 里，一般放在 `src/main/resources/` 下：

```xml
<!-- 读取数据库配置 -->
<context:property-placeholder location="classpath:db.properties"/>

<!-- 数据源：负责维护数据库连接 -->
<bean id="dataSource" class="com.alibaba.druid.pool.DruidDataSource">
    <property name="driverClassName" value="${jdbc.driver}"/>
    <property name="url" value="${jdbc.url}"/>
    <property name="username" value="${jdbc.username}"/>
    <property name="password" value="${jdbc.password}"/>
</bean>

<!-- MyBatis 的核心工厂：绑定数据源，加载配置与 SQL 映射 -->
<bean id="sqlSessionFactory" class="org.mybatis.spring.SqlSessionFactoryBean">
    <property name="dataSource" ref="dataSource"/>
    <property name="configLocation" value="classpath:mybatis.cfg.xml"/>
    <property name="mapperLocations" value="classpath:/mapper/*.xml"/>
    <property name="typeAliasesPackage" value="com.wreckloud.entity"/>
</bean>
```

这里其实和注解方式做的事一模一样：

- 一个 Bean 管数据库连接（`dataSource`）。
- 一个 Bean 让 MyBatis 知道去哪找全局配置、SQL 映射、以及实体类别名（`sqlSessionFactory`）。

唯一的区别，就是 **Spring 的配置是写在 XML 里还是写在注解里**。SQL 部分依旧可以放在 `mapper/*.xml` 文件中，位置一般也是 `resources/mapper/`。

### 下划线与驼峰

数据库表里常见的字段名是下划线风格，比如 `created_time`、`updated_time`；  
而 Java 代码里的变量名通常写成驼峰风格：`createdTime`、`updatedTime`。

这两套规则天生对不上，如果什么都不配，MyBatis 查出来的结果就会全是 `null`。  
要么手写一堆 `<resultMap>` 去逐个对应字段，要么就让 MyBatis 自动帮忙转换。

最简单的办法，就是在 **`src/main/resources/`** 的配置下， `mybatis.cfg.xml` 里打开这个开关：

```xml
<configuration>
  <settings>
    <!-- 自动把 wolf_name → wolfName, created_time → createdTime -->
    <setting name="mapUnderscoreToCamelCase" value="true"/>
  </settings>
</configuration>
```

这行配置一旦加上，表结构和实体类就能自然对上号。无论是注解方式还是 XML 方式，都依赖这个全局规则。

### 项目结构速览（目录与配置落点）

为了让手头的文件各归其位，可以先对照一遍最小化目录结构。只要把关键文件放对地方，SSM 的主线就能顺畅跑起来：

```
src/
 └─ main/
     ├─ java/
     │   └─ com/wreckloud/
     │       ├─ controller/           # 放 `WolfController`
     │       ├─ service/              # 放 `WolfService` 接口与 `WolfServiceImpl`
     │       ├─ mapper/               # 放 `WolfMapper` 接口
     │       └─ config/               # 放 `AppInitializer`、`RootConfig`、`WebMvcConfig`、`DataSourceConfig`、`TxConfig`
     ├─ resources/
     │   ├─ mapper/                   # 放 MyBatis XML：`WolfMapper.xml`
     │   ├─ db.properties             # 数据库连接参数
     │   ├─ mybatis.cfg.xml           # MyBatis 全局配置（含驼峰转换）
     │   ├─ springmvc.xml             # MVC 相关配置（XML 路线）
     │   ├─ spring-mybatis.xml        # 数据源与 MyBatis（XML 路线）
     │   └─ spring-tx.xml             # 事务与 AOP（XML 路线）
     └─ webapp/
         └─ WEB-INF/
             └─ web.xml               # 走 XML 路线时的入口（注解路线可省略）
```

- 采用“注解路线”时，`config` 包内的配置类会在容器启动时生效；
- 采用“XML 路线”时，`web.xml` 指向 `springmvc.xml` / `spring-mybatis.xml` / `spring-tx.xml`，由它们完成同等职责；
- Mapper 的接口与 XML 一一对应：接口放在 `java/.../mapper`，SQL 放在 `resources/mapper`，`SqlSessionFactory` 会把它们对上号；
- 全局只需一个 `mybatis.cfg.xml` 来打开驼峰转换，避免 `<resultMap>` 的重复映射工作。

# 事务

一个业务往往不止一条 SQL。比如新增一只狼：

1. 在 `wolf` 表里插入基本信息；
2. 在 `log` 表里插一条记录，写明“新增了一只狼”。

如果第二步失败，但第一步已经落库，就会留下“只有狼，没有日志”的脏数据。  
**事务要保证的，就是要么两步都成功，要么两步都撤销**。

事务放在 **Service 层**。这是业务的边界：

- Controller 只负责接收请求，像门卫，不开关阀门；
- Mapper 只管执行单条 SQL，不知道全局业务；
- **Service 才是业务边界**：进入方法时开事务，正常结束就提交，报错就回滚。

在这里还有一个惯例：

- **读操作** → 默认只读，不开写事务；
- **写操作** → 显式声明“遇到异常就回滚”，否则很容易留下不完整的数据。

### 注解方式

要让事务生效，得先交给 Spring 一个“事务管理器”，再在业务边界打上 `@Transactional`。

```java
// TxConfig：放在 config 包，交给 Root 容器加载
@Configuration
@EnableTransactionManagement
public class TxConfig {
    @Bean
    public PlatformTransactionManager txManager(DataSource ds) {
        return new org.springframework.jdbc.datasource.DataSourceTransactionManager(ds);
    }
}
```

然后在 Service 层写业务逻辑：

```java
// WolfService：读默认只读；写时显式回滚
@Service
@Transactional(readOnly = true) // 类级默认：查询型方法不开写事务
public class WolfService {

    @Resource private WolfMapper wolfMapper;

    public List<Wolf> list() {              // 读：沿用只读
        return wolfMapper.findAll();
    }

    @Transactional(rollbackFor = Exception.class)
    public void add(Wolf w) {               // 写：遇到任何 Exception 都回滚
        wolfMapper.insert(w);
        // 这里再做其它写操作，任何一步抛异常，整体回滚
    }
}
```

要点其实就两句：

- **`@EnableTransactionManagement`** → 开开关，让 Spring 接管事务；
- **`@Transactional`** → 画边界，正常提交，异常回滚。

### XML 方式

XML 的路子也是两步：**先声明事务管理器**，再把事务规则织到 Service 层。

```xml
<!-- spring-tx.xml：放在 resources 下 -->

<!-- 事务管理器：交给 Spring 统一管控事务边界 -->
<bean id="transactionManager"
      class="org.springframework.jdbc.datasource.DataSourceTransactionManager">
  <property name="dataSource" ref="dataSource"/>
</bean>

<!-- 按方法名约定事务规则 -->
<tx:advice id="txAdvice" transaction-manager="transactionManager">
  <tx:attributes>
    <tx:method name="add*"    rollback-for="java.lang.Exception"/> <!-- 新增失败就回滚 -->
    <tx:method name="update*" rollback-for="java.lang.Exception"/> <!-- 更新失败就回滚 -->
    <tx:method name="delete*" rollback-for="java.lang.Exception"/> <!-- 删除失败就回滚 -->
    <tx:method name="*" read-only="true"/>                         <!-- 其它默认只读 -->
  </tx:attributes>
</tx:advice>

<!-- AOP：把这些规则织到 service 包下的实现类 -->
<aop:config>
  <aop:pointcut id="svc" expression="execution(* com.wreckloud.service..*.*(..))"/>
  <aop:advisor advice-ref="txAdvice" pointcut-ref="svc"/>
</aop:config>
```

这里的思路可以拆成三句：

- **谁来管**：`transactionManager` 绑定到数据源；
- **管谁**：`aop:pointcut` 指定 service 层的方法；
- **怎么管**：规则里写死“新增/更新/删除出错回滚，其余只读”。

# MVC 只做一件事

前面数据源和事务都准备好了，但如果没有 MVC 层，外部请求根本进不到 Service。打开 MVC 层就是为了：

> 让 Controller 起作用，接收请求并把返回值变成 JSON。

SpringMVC 自带消息转换器链，只要类路径里有 **Jackson**（常用 `jackson-databind` 依赖），`@RestController` 或 `@ResponseBody` 返回的对象就会被自动序列化为 JSON。

这就是为什么在接口项目里，不需要自己拼 JSON 字符串。如果 Jackson 不在依赖里，Spring 只会把对象 `toString()`，那结果就很尴尬了。

### 打开 MVC

MVC 的配置入口和前面数据源、事务一样，也分注解和 XML 两条路。

**注解方式**：  
在 `config` 包下建一个 `WebMvcConfig` 配置类，让 Root 容器在启动时加载它。

```java
@Configuration
@EnableWebMvc
@ComponentScan("com.wreckloud.controller") // 扫描 controller 包
public class WebMvcConfig { }
```

`@EnableWebMvc` 相当于 XML 里的 `<mvc:annotation-driven/>`，会自动注册好一堆 MVC 必备组件（包括 JSON 转换器）。

**XML 方式**：  
在 `springmvc.xml`（放在 `resources/` 下）写：

```xml
<context:component-scan base-package="com.wreckloud.controller"/>
<mvc:annotation-driven/>
```

Spring 启动时 `DispatcherServlet` 会加载这个 XML，从而完成 Controller 扫描与 JSON 转换器的注册。

这两种写法效果相同：MVC 容器被打开，Controller 能被发现，返回值能自动序列化为 JSON。

### 视图解析器与静态资源

打开 MVC 之后，默认返回 JSON 已经能工作，因为消息转换器（Jackson）会自动接管。但如果不是纯接口项目，还要考虑另外两类情况：

- **渲染 JSP 页面**

控制器方法返回 `"index"` 这种字符串时，SpringMVC 并不知道该去哪找页面。  
这时需要一个 **视图解析器** 来拼完整路径，比如 `/WEB-INF/views/index.jsp`：

```java
@Bean
public InternalResourceViewResolver viewResolver() {
    var vr = new InternalResourceViewResolver();
    vr.setPrefix("/WEB-INF/views/");
    vr.setSuffix(".jsp");
    return vr;
}
```

或者在 `springmvc.xml` 里写一个同样的 `<bean>`。

- **访问静态资源**

SpringMVC 默认会拦截所有请求，连 `/static/wolf.png` 这种图片地址也会交给 DispatcherServlet，结果就是 404。  
所以要单独声明：`/static/**` 这样的路径直接去找文件，不要交给 MVC：

注解方式：

```java
  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
      registry.addResourceHandler("/static/**")
              .addResourceLocations("/static/");
  }
```

XML 方式：

```xml
  <mvc:resources mapping="/static/**" location="/static/"/>
```

### 测试 Controller 验证

有了 MVC 配置，就可以写一个最小的控制器来验证整个链路。通常会把它放在 `src/main/java/com/wreckloud/controller/` 包下。

```java
@RestController               // 等价于 @Controller + @ResponseBody
@RequestMapping("/wolf")      // 一级路径
public class WolfController {

    @GetMapping("/list")      // 完整路径 = /wolf/list
    public List<String> list() {
        return List.of("White Wolf", "Grey Wolf");
    }
}
```

- `@RestController`：告诉 Spring 这是一个接口类，返回值不用解析 JSP，直接写入响应体。
- `@RequestMapping("/wolf")`：确定控制器的基础路径。

先使用一些测试数据，返回值是 `List<String>`，Spring 会调用消息转换器（Jackson）把它转成 JSON 数组。

启动 Tomcat 后，访问：

```
http://localhost:8080/项目名/wolf/list
```

返回：

```json
["White Wolf","Grey Wolf"]
```

如果页面返回的是空白或对象 `toString()` 的结果，多半是缺少 `jackson-databind` 依赖；  
如果报 404，多半是路径写错，或者 Controller 没被扫描到。

# 实体与 Mapper

数据库接通、MVC 打开之后，就该让 SQL 出口和 Java 入口对上号了。  
这一步有两个角色：**实体类**（封装一行数据）和 **Mapper**（定义查询方法 + SQL 映射）。

建一个 `Wolf` 实体类，对应表 `wolf(id, name, email, age, created_time, updated_time)`：

```java
@Data
public class Wolf {
    private Long id;
    private String name;
    private String email;
    private Integer age;
    private LocalDateTime createdTime; // created_time
    private LocalDateTime updatedTime; // updated_time
}
```

注意：数据库字段是下划线命名，Java 用驼峰命名。前面已经在 `mybatis.cfg.xml` 里开了  
`mapUnderscoreToCamelCase`，这才能自动对上，否则字段会一直是 null。

### Mapper

- **注解写法**

```java
@Mapper
public interface WolfMapper {
    @Select("SELECT id, name, age, email, created_time, updated_time FROM wolf")
    List<Wolf> findAll();
}
```

好处是一眼能看到 SQL，适合简单查询。

- **XML 写法（复杂语句更友好）**  
   接口只声明方法：

```java
public interface WolfMapper {
    List<Wolf> findAll();
}
```

SQL 写在 `resources/mapper/WolfMapper.xml`：

```xml
<mapper namespace="com.wreckloud.mapper.WolfMapper">
  <select id="findAll" resultType="com.wreckloud.entity.Wolf">
    SELECT id, name, age, email, created_time, updated_time FROM wolf
  </select>
</mapper>
```

好处是支持 `<if>`、`<foreach>` 等动态 SQL，更适合复杂场景。

### 最小自检

写好 Mapper 之后，不必急着上 Controller，可以先在 Service 层打一个“试探”：

```java
@Service
public class WolfServiceProbe {

    @Resource
    private WolfMapper wolfMapper;

    public void probe() {
        var list = wolfMapper.findAll();
        System.out.println("查到几只狼：" + list.size());
    }
}
```

启动项目，如果控制台能正常打印数据，就说明：

- 数据源连通；
- Mapper 扫描生效；
- 实体字段能对上表字段。

进一步验证事务：在写方法里插入数据后故意抛出异常，看看是否回滚。

# Service 层

在“实体与 Mapper”打好基础后，下一步要把“能查到数据”升级为“能承载业务”：把对 `wolf` 的一次完整操作封装进 Service，并用事务划定边界。

Mapper 只是 SQL 的出口，能帮你查到数据，但它对业务一无所知。  
Service 才是“业务边界”，负责把一次完整操作包起来，并决定事务策略。

### Service 层

在 SSM 里通常会这样写。这里依然坚持“注解与 XML 思路一致，只是落点不同”的原则：注解把规则写在类/方法上，XML 则把规则写在配置里。

```java
public interface WolfService {
    List<Wolf> findAll();
}
```

```java
@Service
@Transactional(readOnly = true) // 默认所有方法只读
public class WolfServiceImpl implements WolfService {

    @Resource private WolfMapper wolfMapper;

    @Override
    public List<Wolf> findAll() {
        return wolfMapper.findAll();
    }
}
```

Controller 只管接收请求，不该关心数据库开关；Mapper 只管跑 SQL，也不知道业务的全貌。  
只有 Service 才能说清楚：“这一段代码是一件完整的事”。

所以习惯是：类级别设成只读，表示查询不会开写事务；  
而真正的写操作，比如新增或更新，就在方法上显式加上：

```Java
@Transactional(rollbackFor = Exception.class)
public void addWolf(Wolf wolf) { … }
```

这样一旦中途出错，前面做过的数据库修改就会被一起撤销。

如果用 XML 的方式，等效的事务规则已经在前文的 `spring-tx.xml` 里通过 `<tx:advice>` + `<aop:advisor>` 织入到 `service` 包下的方法，它与这里的注解写法只是在“配置位置”不同，执行效果一致。

# Controller 层与验证

到这里，数据能查、事务能管，最后一步就是把它**暴露成一个接口**，让外部能通过 HTTP 访问到 `wolf` 数据。

这里同样有“注解 vs XML”的分工：注解在类上标注 `@RestController`/`@RequestMapping`；XML 则在 `springmvc.xml` 中通过 `<context:component-scan>` 与 `<mvc:annotation-driven/>` 让这些注解生效，二者目标一致。

```java
@RestController
@RequestMapping("/wolf")
public class WolfController {

    @Resource private WolfService wolfService;

    @GetMapping("/list")
    public List<Wolf> list() {
        return wolfService.findAll();
    }
}
```

这里用了 `@RestController`，意味着所有方法的返回值都会直接写到响应体里，不再经过视图解析器。  
因此返回一个 `List<Wolf>`，Spring 就会交给 Jackson，把它序列化为 JSON。

Controller 要保持“薄”——  
不做事务控制，也不写 SQL，只做三件事：

- **路由**：把 URL `/wolf/list` 映射到方法；
- **参数绑定**：后续可以接收查询参数或表单参数；
- **结果返回**：把 Service 给的对象交还给前端。

这样分工清楚：Controller 像“门面”，Service 是“车间”，Mapper 是“工具”。请求从外面进来，一路传下去，最后再把结果带回来。下面做两次最小验证：一次是“只读查询”的链路验证；一次是“写入 + 回滚”的事务验证。

### 访问路径（只读链路自检）

最后一步就是确认“只读接口”能不能被访问到。  
在 Tomcat 里，默认的规则是：**应用上下文路径 = war 包名**。

- 如果打出来的包叫 `ssm-demo.war`，访问：

```
http://localhost:8080/ssm-demo/wolf/list
```

- 如果在 IDE 里手动配置了 context path，比如 `/wolfpack`，访问：

```
http://localhost:8080/wolfpack/wolf/list
```

能看到 JSON 数组，说明“只读链路”已通——**Controller → Service（只读） → Mapper → DB**。

### 事务回滚自检（写入链路）

为了确认事务规则生效，可以在 `WolfServiceImpl` 里临时加一个写方法：先插入，再故意抛异常。

```java
@Transactional(rollbackFor = Exception.class)
public void addWolfAndFail(Wolf wolf) {
    wolfMapper.insert(wolf);  // 第一步：写入
    if (true) throw new RuntimeException("故意触发异常");
}
```

- 调用该方法后，检查库里是否没有新增数据；
- 若没有，说明“写入链路 + 回滚”生效——**Controller → Service（写入、异常） → 事务回滚 → DB 不变**。

> 小提示：生产代码不要保留故障注入，仅用于本地/测试环境的验证。

# 完整 CRUD 实现（注解与 XML）

前文已经跑通只读与回滚链路。下面给出最小、可直接落地的 CRUD 代码，仍然围绕 `wolf`：

- GET `/wolf/list`
- POST `/wolf/add`
- PUT `/wolf/update`
- DELETE `/wolf/delete/{id}`

无论选择注解还是 XML，目标与行为一致；注解把意图写在代码上，XML 把意图写在配置里。

### Mapper：注解写法

```java
@Mapper
public interface WolfMapper {
    @Select("SELECT id, name, age, email, created_time, updated_time FROM wolf")
    List<Wolf> findAll();

    @Insert("INSERT INTO wolf (name, age, email, created_time, updated_time) VALUES (#{name}, #{age}, #{email}, NOW(), NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(Wolf wolf);

    @Update("UPDATE wolf SET name = #{name}, age = #{age}, email = #{email}, updated_time = NOW() WHERE id = #{id}")
    int update(Wolf wolf);

    @Delete("DELETE FROM wolf WHERE id = #{id}")
    int deleteById(@Param("id") Long id);
}
```

### Mapper：XML 写法

接口：

```java
public interface WolfMapper {
    List<Wolf> findAll();
    int insert(Wolf wolf);
    int update(Wolf wolf);
    int deleteById(Long id);
}
```

`resources/mapper/WolfMapper.xml`：

```xml
<mapper namespace="com.wreckloud.mapper.WolfMapper">
  <select id="findAll" resultType="com.wreckloud.entity.Wolf">
    SELECT id, name, age, email, created_time, updated_time FROM wolf
  </select>

  <insert id="insert" parameterType="com.wreckloud.entity.Wolf" useGeneratedKeys="true" keyProperty="id">
    INSERT INTO wolf (name, age, email, created_time, updated_time)
    VALUES (#{name}, #{age}, #{email}, NOW(), NOW())
  </insert>

  <update id="update" parameterType="com.wreckloud.entity.Wolf">
    UPDATE wolf
    SET name = #{name}, age = #{age}, email = #{email}, updated_time = NOW()
    WHERE id = #{id}
  </update>

  <delete id="deleteById" parameterType="long">
    DELETE FROM wolf WHERE id = #{id}
  </delete>
</mapper>
```

说明：我们已在 `mybatis.cfg.xml` 打开 `mapUnderscoreToCamelCase`，字段能自动与 `Wolf` 的驼峰属性对上。

### Service：事务边界

接口：

```java
public interface WolfService {
    List<Wolf> findAll();
    void add(Wolf wolf);
    void update(Wolf wolf);
    void deleteById(Long id);
}
```

实现（注解事务；XML 事务见前文 `spring-tx.xml` 的 `<tx:advice>` 配置）：

```java
@Service
@Transactional(readOnly = true)
public class WolfServiceImpl implements WolfService {

    @Resource private WolfMapper wolfMapper;

    @Override
    public List<Wolf> findAll() { return wolfMapper.findAll(); }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void add(Wolf wolf) { wolfMapper.insert(wolf); }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void update(Wolf wolf) { wolfMapper.update(wolf); }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteById(Long id) { wolfMapper.deleteById(id); }
}
```

### Controller：路由与参数绑定

```java
@RestController
@RequestMapping("/wolf")
public class WolfController {

    @Resource private WolfService wolfService;

    @GetMapping("/list")
    public List<Wolf> list() { return wolfService.findAll(); }

    @PostMapping("/add")
    public String add(@RequestBody Wolf wolf) { wolfService.add(wolf); return "OK"; }

    @PutMapping("/update")
    public String update(@RequestBody Wolf wolf) { wolfService.update(wolf); return "OK"; }

    @DeleteMapping("/delete/{id}")
    public String delete(@PathVariable Long id) { wolfService.deleteById(id); return "OK"; }
}
```

- 若使用表单提交，也可去掉 `@RequestBody`，按表单字段名自动绑定到 `Wolf`；
- 返回体可替换为统一响应结构，这里为最小可用实现。

### cURL 自检

把 `项目名` 替换为实际上下文路径：

```bash
curl -s http://localhost:8080/项目名/wolf/list
```

```bash
curl -s -X POST http://localhost:8080/项目名/wolf/add \
  -H "Content-Type: application/json" \
  -d '{"name":"Snow Wolf","age":3,"email":"snow@wolf.com"}'
```

```bash
curl -s -X PUT http://localhost:8080/项目名/wolf/update \
  -H "Content-Type: application/json" \
  -d '{"id":1,"name":"Snow Wolf","age":4,"email":"snow@wolf.com"}'
```

```bash
curl -s -X DELETE http://localhost:8080/项目名/wolf/delete/1
```

最后说明：注解与 XML 在这四个接口上的差异只在“配置承载处”，运行路径完全一致。

### 小结与链路小图示

到这里，整个闭环已经完成：只读链路与写入链路（含回滚）都已验证。

```
只读：浏览器 → Controller → Service（readOnly） → Mapper → DB
写入：浏览器 → Controller → Service（write） → 事务管理器 → Mapper → DB
异常：浏览器 → Controller → Service（write 抛异常） → 事务回滚 → DB（不变）
```

从这里出发，可以在 `wolf` 的上下文里继续扩展：分页查询、条件过滤、批量插入、以及更复杂的事务边界。
