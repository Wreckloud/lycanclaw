---
title: Maven 进阶 - 分模块设计
date: 2025-10-29 09:23:05
description: 这是一篇新文章!
order: 2
publish: true
tags:
---

在项目逐渐变大的时候，如果所有功能、实体类、配置文件都塞在一个工程里，不仅维护困难、修改风险高，复用性也几乎为零。

一个典型的单体项目结构可能是这样的：

```
src
 └── main
      └── java
           └── com.wreckloud
                ├── anno
                ├── aop
                ├── config
                ├── controller
                ├── exception
                ├── filter
                ├── interceptor
                ├── mapper
                ├── pojo / entity
                ├── service
                └── utils
      └── resources
           └── application.yml
```

上面这是一种“分包”结构，但所有代码仍在一个工程中，模块之间实际上并不独立。  
如果我们希望在其他项目中复用 `utils` 工具类或 `pojo` 实体，就不得不复制粘贴，十分低效。

Entity实体，通常和数据库中的表对应
DTO数据传输对象，通常用于程序中各层之间传递数据
VO视图对象，为前端展示数据提供的对象
POJO普通Java对象，只有属性和对应的getter和setter

因此，我们会在项目搭建初期，就根据功能或结构，提前把工程拆分成多个模块。  
这就是——**分模块设计**。

这种拆分可以有两种常见思路：

1. **按功能**：比如用户管理、订单管理、权限管理等，每个功能单独成模块；
2. **按层次结构**：比如实体类（pojo）、工具类（utils）、主业务模块（web）。

不论哪种方式，目标都是一致的：

> 让项目结构更清晰，模块职责更明确，便于独立开发、统一管理、共享资源。

更好的做法是——把这些包单独拆成模块：

- `pojo` → 单独成一个模块（专门放实体类）
- `utils` → 单独成一个模块（工具类方法库）
- 业务模块（web / management） → 作为主业务模块，依赖前两者

# 继承

当我们把项目拆成多个模块后，就会发现一个问题：  
各个模块的 `pom.xml` 里很多依赖是重复的，比如 `slf4j`、`lombok`、`mybatis` 等。  
这样不仅冗余，还容易因为版本不同步而出错。

所以，我们希望能有一个“统一依赖的中心”，让所有子模块都去继承它的依赖配置。  
这就是 Maven 的 **继承（Parent）** 机制。

> 继承简化了依赖配置，统一了管理依赖版本。

它就像 Java 中的类继承一样——子工程自动获得父工程的通用配置和依赖，不必重复书写。

## `<parent>`实现继承关系

在 Maven 中，模块之间的继承关系通过 `<parent>` 标签实现。建一个父工程，放所有共性的依赖与配置，其他模块只需继承它即可。
把案例全替换成我的 wreckloud， 或者带狼主题的案例， 但是文字描述不用特意提到狼

### 1. 创建父工程

首先，新建一个 Maven 模块，比如命名为 `wreckloud-parent`。  
这个模块不会写业务逻辑，只负责依赖和版本管理。

父工程默认的打包方式是 `jar`，但我们需要改为 `pom`，因为它并不参与实际运行。  
`pom` 打包方式告诉 Maven：

> 这个工程是一个“管理型”项目，不会生成可执行文件，只用于依赖声明。

```xml
<packaging>pom</packaging>
```

这个标签写在父工程的 `pom.xml` 顶层节点（`<project>` 内，与 `<groupId>`、`<artifactId>` 同级）。  
这样 Maven 在解析时就知道它不是普通业务模块。

常见的打包方式：

- `jar`：普通模块（Spring Boot 常用，内嵌 Tomcat）
- `war`：外部 Web 应用（需部署到 Tomcat）
- `pom`：父工程或聚合工程（仅用于依赖与版本管理）

父工程通常不会写业务代码，默认生成的 `src` 目录可以直接删除，只保留 `pom.xml`。

### 2. 在子工程中声明继承

当父工程创建好后，其他模块就可以继承它。例如你有以下几个子模块：

```xml
<parent>
    <groupId>com.itheima</groupId>
    <artifactId>tlias-parent</artifactId>
    <version>1.0-SNAPSHOT</version>
    <relativePath>../tlias-parent/pom.xml</relativePath>
</parent>
```

- `<relativePath>` 指定父工程的 `pom.xml` 相对路径；如果省略，Maven 会去本地或远程仓库查找。

子工程继承父工程后，`groupId` 可以省略，因为它默认继承父项目的组织名。父工程中声明的依赖会自动传递到子工程，省去重复引入。

### 3. 模块结构建议

为保持清晰与一致，模块应当**平级放置**、**groupId 一致**：

```
wreckloud-parent
├── wreckloud-pojo
├── wreckloud-utils
└── wreckloud-web
```

在每个子模块的 `pom.xml` 里，使用 `<parent>` 标签声明继承关系：

```xml
<parent>
    <groupId>com.wreckloud</groupId>
    <artifactId>wreckloud-parent</artifactId>
    <version>1.0-SNAPSHOT</version>
    <relativePath>../wreckloud-parent/pom.xml</relativePath>
</parent>
```

`<relativePath>` 用来指定父工程 `pom.xml` 的相对路径； 如果不写，Maven 会自动去本地或远程仓库中查找同名工程。

- 子工程继承父工程后，`groupId` 可以省略，因为它会自动继承。
- 父工程中声明的依赖、属性、版本管理等内容，都会自动传递给子模块。

这样，每个子模块只需关注自身业务依赖，不再关心全局通用部分。

### 4. 在父工程中定义共性依赖

父工程的 `pom.xml` 主要职责就是**统一定义整个项目都会用到的依赖**，  
例如日志、工具类、Lombok、JSON 处理等：

```xml
<dependencies>
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
    </dependency>

    <dependency>
        <groupId>org.slf4j</groupId>
        <artifactId>slf4j-api</artifactId>
    </dependency>

    <dependency>
        <groupId>com.fasterxml.jackson.core</groupId>
        <artifactId>jackson-databind</artifactId>
    </dependency>
</dependencies>
```

子模块继承父工程后，这些依赖会自动生效，无需再手动添加。  
这样不仅减少了配置量，也保证了所有模块依赖版本的统一。

## `<dependencyManagement>`版本锁定

并不是所有依赖都适合直接放进父工程的 `<dependencies>`。  
有些依赖只会在个别模块中用到，比如 JWT、Redis、WebSocket、Mail 等，这些依赖如果直接写进父工程，就会被所有模块一并引入，既浪费又容易引发版本冲突。

因此，Maven 提供了 `<dependencyManagement>` 标签，用于**在父工程中统一管理依赖的版本号**。  
它只负责“版本声明”，不会主动让子模块引入依赖。

- `<dependencies>` = 直接继承；
- `<dependencyManagement>` = 版本约束。

例如，当需要将 `jjwt` 从 `0.9.1` 升级为 `1.0.0` 时，只需改动一处——父工程的版本声明；所有使用该依赖的子模块都会自动使用最新版本。

#### 1. 父工程统一声明版本

在父工程 `wreckloud-parent` 的 `pom.xml` 中加入如下配置：

```xml
<dependencyManagement>
    <dependencies>
        <!-- JWT 令牌 -->
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt</artifactId>
            <version>0.9.1</version>
        </dependency>

        <!-- Redis 客户端 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-redis</artifactId>
            <version>3.2.4</version>
        </dependency>
    </dependencies>
</dependencyManagement>
```

`<dependencyManagement>` 的作用是集中定义版本号，让整个项目的依赖版本保持一致。它不会主动引入依赖，只是告诉子工程：如果你用到这些库，统一按这里的版本来。

#### 2. 子工程按需引入依赖

当某个子模块需要这些依赖时，只需在自己的 `pom.xml` 里声明即可，不必再写 `<version>`：

```xml
<dependencies>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt</artifactId>
    </dependency>
</dependencies>
```

子模块在构建时，Maven 会自动从父工程的 `<dependencyManagement>` 中读取对应的版本信息。  
这样既能保持灵活，又能防止版本不统一。

# `<Modules>` 聚合

当项目被拆分成多个模块后，如果我们直接在 Maven 面板中执行 `package`，比如只打业务主包 `wreckloud-web`，往往会发现：

```
构建失败，提示找不到 `wreckloud-utils` 或 `wreckloud-pojo` 等依赖。
```

这是因为 Maven 默认只会构建当前模块，而这些依赖模块还没有被打包。要成功构建，就得按依赖顺序手动打包每个子模块，十分麻烦。

这时，就该轮到 聚合（Modules）登场了。

聚合的作用，就是让 Maven 一次性构建所有相关模块，不再需要你手动关心依赖顺序。

聚合工程（Aggregator Project）指的是一个没有业务逻辑、只有一个 `pom.xml` 的工程，它的唯一作用，就是把多个模块组织成一个整体来统一构建。

通常我们会让“父工程”同时兼任“聚合工程”，既负责依赖管理（继承），又负责构建调度（聚合）。

> 继承解决依赖统一，聚合解决构建顺序。

## 配置聚合关系

在父工程（`wreckloud-parent`）的 `pom.xml` 中，使用 `<modules>` 标签配置要聚合的模块：

```xml
<!-- 聚合模块配置 -->
<modules>
    <module>../wreckloud-pojo</module>
    <module>../wreckloud-utils</module>
    <module>../wreckloud-web</module>
</modules>
```

每个 `<module>` 标签都指向一个子工程的相对路径。Maven 会根据这些配置，自动识别模块间的依赖关系，并在执行构建命令时**按依赖顺序自动打包**。

## 聚合的使用

配置好聚合后，你会发现：

- Maven 面板变得干净有序，所有子模块都折叠到父工程下；
- 执行一次 `package`，Maven 会依次打包所有模块；
- 不再需要手动构建 `pojo`、`utils`、`web` 等模块。

这样一来，整个项目的构建流程就变成了“一键式”：

```
wreckloud-parent
├── wreckloud-pojo
├── wreckloud-utils
└── wreckloud-web
```

在 `wreckloud-parent` 上双击 `package`，Maven 会自动：

1. 先构建 `wreckloud-pojo`
2. 再构建 `wreckloud-utils`
3. 最后构建 `wreckloud-web`

所有依赖自动处理，无需手动操作。
