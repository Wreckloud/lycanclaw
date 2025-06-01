---
title: Maven-项目构建工具
tags:
  - 开发工具
  - 项目管理
  - Java
  - 指南
  - 后端
  - 构建工具
categories:
  - 猎识印记-领域
excerpt: 'Maven是Java开发中最常用的构建工具, 本文将介绍Maven的基本概念, 安装, 配置, 常用命令等.'
thumbnail: img/文章封面/Maven.png
published: true
date: 2024-09-24 11:06:33
---

# Maven 简介

Maven 是 [apache 软件基金会](https://www.apache.org/) 推出的一个开源的 **管理和构建 java 项目的工具**.

> [apache 所有的开源项目](https://www.apache.org/index.html#projects-list)

Maven 基于项目对象模型 (project object model, POM) 的概念, 通过一小段描述信息 (pom.xml), 来自动 **管理** 和 **构建** java 项目.

Maven 模型由以下三大块组成:

- 项目对象模型 (Project Object Model)
- 依赖管理模型(Dependency)
- 构建生命周期/阶段(Build lifecycle & phases)
  ![](../../../../img/文章资源/maven-项目构建工具/file-20241128123533288.jpg)

### Maven 的作用

#### 依赖管理

自动下载项目依赖, 并管理这些依赖的版本.

若是没有 Maven 帮助, 我们项目中要想使用某一个 jar 包, 就需要把这个 jar 包从官方网站下载下来, 然后再导入到项目中.

![](../../../../img/文章资源/maven-项目构建工具/file-20241129131953198.jpg)

一旦涉及的 jar 包数量增多, 弊端可想而知.

当使用 Maven 来构建时, 我们只需要在 Maven 项目的 `pom.xml` 文件中, 添加一段如下图所示的配置即可实现.

![](../../../../img/文章资源/maven-项目构建工具/file-20241129132031070.jpg)

Maven 会根据配置信息的描述, 自动的去下载对应的依赖. 就可以直接在项目中使用了.

#### 标准项目构建

Maven 还提供了标准化的跨平台的自动化构建方式, 自动编译, 测试, 打包, 发布项目.

![](../../../../img/文章资源/maven-项目构建工具/file-20241129132200393.jpg)

通过 Maven 中的命令，就可以很方便的完成项目所需步骤.

#### 统一项目结构

项目结构的标准化, 使得项目更加清晰.

早期, 不同的 java 开发工具创建出的项目结构存在差异, 要想从一个开发工具转到另一个, 不是件容易的事情.

![](../../../../img/文章资源/maven-项目构建工具/file-20241128123525254.jpg)

而 Maven 提供了如图所示的一套标准 java 项目目录.

# Maven 安装

### 下载并解压 Maven:

下载 maven 官方提供的 `Binary zip archive` 压缩包  
[下载地址](https://maven.apache.org/download.cgi).

在官网下滑找到 Files 下载.

![](../../../../img/文章资源/maven-项目构建工具/file-20241128131506942.jpg)

下载后解压到一个方便管理的目录.  
由于一些兼容性和安全性问题, 路径尽量不要包含 **中文** 或 **空格**.

接下来, 以我的路径为例:

> `D:\Code\apache\apache-maven-3.9.9`

进行配置.

### 配置仓库:

仓库 (repository) 用于存储 Maven 下载的资源, 管理各种 jar 包.

我们新建一个文件夹作为 本地仓库,  
我的 本地仓库 路径设置为:

> `D:\Code\apache\maven_repo`

然后, 要让 Maven 知道这个本地仓库的位置.

#### 配置 本地仓库

来到刚刚解压的 Maven 文件夹, 进入 `conf` 目录, 打开 `settings.xml` 文件.  
在 `conf/settings.xml` 文件中找到 `<localRepository>` 标签, 在注释外添加本地仓库路径.

![](../../../../img/文章资源/maven-项目构建工具/file-20241128131925038.jpg)

> VScode 中 ctrl+f 搜索 `localRepository` 可快速定位到该标签.

我的配置如下:

```xml
<localRepository>D:\Code\apache\maven_repo</localRepository>
```

这样, Maven 下载的依赖就会放到这个文件夹下.

#### 配置 远程仓库

Maven 有 由 Maven 团队 维护的全球唯一的 中央仓库  
**([仓库地址](https://repo1.maven.org/maven2/))**.  
不过由于其在海外, 大陆访问速度较慢, 所以我们可以配置国内的 阿里云镜像 仓库, 以提升下载速度.

> 本地仓库 优先级高于 远程仓库.

配置阿里云私服, 也是在 `conf/settings.xml` 文件中配置 `<mirrors>` 标签下配置镜像仓库.

```XML
<mirror>
    <id>alimaven</id>
    <name>aliyun maven</name>
    <url>http://maven.aliyun.com/nexus/content/groups/public/</url>
    <mirrorOf>central</mirrorOf>
</mirror>
```

![](../../../../img/文章资源/maven-项目构建工具/file-20241128132250848.jpg)

[阿里云镜像仓库官方说明文档](https://developer.aliyun.com/mvn/guide)

### 配置环境变量:

[[环境变量|关于环境变量]]

{% notel red 注意! %}
错误地编辑注册表可能会损坏系统!
编辑更改注册表前请确保你知道你在做什么.
{% endnotel %}

为了能在任意目录下使用 Maven, 可以将 Maven 的 bin 目录添加到环境变量中.

打开设置, 在 关于 系统 -> 系统高级设置 中点击 `环境变量`.

![](../../../../img/文章资源/maven-项目构建工具/file-20241128132357292.jpg)

接着, 在 `系统变量` 里 点击 新建, 变量名为 `Maven_Home`, 变量值为刚刚解压后的 Maven 目录.

![](../../../../img/文章资源/maven-项目构建工具/file-20241128132401362.jpg)

完成后, 点击 `确定`.

然后在 `系统变量` 里 找到`Path`, 点击编辑.  
新建一个变量, 变量值为

```path
%Maven_Home%\bin
```

![](../../../../img/文章资源/maven-项目构建工具/file-20241128132406728.jpg)

然后依次点击 以下三个窗口的 `确定`

- 编辑环境变量
- 环境变量
- 系统属性

来保存配置.

> 注意这里的 变量值 `%Maven_Home%` 和 刚刚设置的 变量名 `Maven_Home` 要一致.  
> 例如 你把变量名设置为 `MAVEN` , 那么变量值就应该设置为 `%MAVEN%\bin` .

### 测试 Maven 是否安装成功:

```bash
mvn -v
```

返回以下内容, 表示环境变量配置成功.

![](../../../../img/文章资源/maven-项目构建工具/file-20241128132420814.jpg)

# 在 IDEA 集成 Maven

### 配置 Maven 环境

我们并不会一直在命令行中使用 Maven, 绝大部分时候我们都会在 IDEA 中集成 Maven.

可以针对当前项目配置 Maven , 不过那样每次新项目都要配置, 比较繁琐.  
直接略过, 我们来配置全局 Maven 路径.

#### 关联 IDEA 环境

如果你的 IDEA 还在项目界面, 请先关闭项目返回开始界面.
![](../../../../img/文章资源/maven-项目构建工具/file-20241128133035355.jpg)

然后在开始界面 到 `Customize` 选项卡下, 点击 `All settings...`

![](../../../../img/文章资源/maven-项目构建工具/file-20241128133049461.jpg)

在左侧选项卡中选择 `Build, Execution, Deployment`  
接着找到 `Build Tools` -> `Maven` 来配置 Maven 的全局路径等信息.

![](../../../../img/文章资源/maven-项目构建工具/file-20241128133053489.jpg)

配置完成后点击 `Apply` 应用.

#### 配置 Java 版本

接着指定这两个地方的 java 版本.

一个是运行的 JRE 版本 `Runner` , 一个是编译器的版本 `Java Compiler`
如果你的 Maven 也是 3.9.9 , 那么推荐使用 **Java 17**.

![](../../../../img/文章资源/maven-项目构建工具/file-20241128133927775.jpg)

别忘记点击 `Apply` 应用.

### 创建 Maven 项目

新建项目

然后选择 Java 项目, 在 Build tool 中选择 Maven, 然后点击下一步.

> (注意: 不同版本的 IDEA 可能会有些许差异, 我这个是 2024 版本的 IDEA)

![](../../../../img/文章资源/maven-项目构建工具/file-20241129130103782.jpg)

初次创建时, Maven 会自动下载依赖包, 请耐心等待.
创建好后, Maven 的项目结构如下所示.

![](../../../../img/文章资源/maven-项目构建工具/file-20241129133910216.jpg)

### 导入已有 Maven 项目

有时候如果已经有了一个 Maven 项目, 可以直接在 IDEA 中导入并打开它.  
导入项目的关键是找到 `pom.xml` 文件.

#### 方式一

在 IDEA 项目右侧, 找到 Maven 图标, 点击加号, 找到已有 Maven 项目的 `pom.xml` 文件, 双击即可开始导入.

![](../../../../img/文章资源/maven-项目构建工具/file-20241129130509338.jpg)

如果没看见右侧工具栏, 可以在 `View` -> `Appearance` -> `Tool windows bar` 中打开.

![](../../../../img/文章资源/maven-项目构建工具/file-20241129130524373.jpg)

#### 方式二

也可以在 IDEA 的菜单栏中选择 `File` -> `project Structure` 打开项目, 然后选择 `pom.xml` 文件.

![](../../../../img/文章资源/maven-项目构建工具/file-20241129130559414.jpg)

## 依赖管理

Maven 依赖管理是 Maven 最重要的功能之一.  
修改 `pom.xml` 文件, 加入依赖包的坐标, 即可轻松管理依赖包.

依赖有三个重要的属性, 称之为 **坐标**:

- groupId: 组织名(通常以域名反写组成)
- artifactId: 模块名
- version: 版本号
  - SNAPSHOT: 快照版本
  - RELEASE: 发行版本

坐标是 jar 资源 的唯一标识, 通过该坐标可以唯一定位资源位置.

在项目下找到 `pom.xml` 文件, 双击打开.

在 `<project>` 内, 声明 `<dependencies>` 标签, 然后在 `<dependencies>` 标签内加入依赖包的坐标.

```xml
<dependencies>
    <dependency>
        <groupId></groupId> <!-- 组织名 -->
        <artifactId></artifactId>  <!-- 模块名 -->
    </dependency>
</dependencies>
```

IDEA 会自动补全内容, 这里以 `logback-classic` 依赖为例：
在 `<groupId>` 标签内输入 `ch.qos.logback`, IDEA 便会自动补全信息.

```xml
    <dependencies>
        <dependency>
            <groupId>ch.qos.logback</groupId>
            <artifactId>logback-parent</artifactId>
            <version>1.5.8</version>
        </dependency>
    </dependencies>
```

如果 IDEA 不能自动补全, 则可以手动搜索坐标导入依赖包.

[依赖包搜索地址](https://mvnrepository.com/)

在搜索框中搜索 `logback-classic`, 找到 `logback-classic` 依赖包的坐标, 复制并粘贴到 `<dependencies>` 标签内.

![](../../../../img/文章资源/maven-项目构建工具/file-20241129134315755.jpg)

接着点击 重新加载依赖 按钮.

![](../../../../img/文章资源/maven-项目构建工具/file-20241129134325595.jpg)

等待 IDEA 自动下载依赖包,  
就能在右侧的 Maven 依赖树中看到 `logback-classic` 依赖了.

### 依赖传递

依赖具有传递性.

例如刚刚我们添加了 `logback-classic` 依赖, 它依赖了 `logback-core` 依赖.  
`logback-core` 依赖了 `slf4j-api` 依赖.

所以 Maven 会自动下载 `logback-core` 和 `slf4j-api` 依赖.  
不信你就打开刚刚的文件夹看看:

![](../../../../img/文章资源/maven-项目构建工具/file-20241129134339955.jpg)

还可以在 `pom.xml` 文件窗口的右键菜单中查看依赖树.

![](../../../../img/文章资源/maven-项目构建工具/file-20241129134349450.jpg)

### 生命周期

Maven 生命周期是为了自动化构建项目, 并提供一系列的插件来完成构建过程.

Maven 中有三套 相互独立 的生命周期:

1. clean: 清理项目
2. default: 默认构建
3. site: 生成项目报告

每套生命周期都有一系列的插件, 这些插件可以完成构建的各个阶段.

![](../../../../img/文章资源/maven-项目构建工具/file-20241129134729383.jpg)

我们只需要关注以下五个阶段:

- **clean: 清理项目**
  - clean：移除上一次构建生成的文件

* **default: 默认构建**

  - compile：编译项目源代码
  - test: 使用合适的单元测试框架运行测试（junit）
  - package：将编译后的文件打包，如：jar、war 等

* **site: 生成项目报告**
  - install：安装项目到本地仓库

在 IDEA 中, 已经集成了 Maven 的生命周期.  
需要注意的是:

> 在**同一套生命周期**中, 当运行后面的阶段时, 前面的阶段都会运行.

{% notel default fa-info 注意 JavaScript %}
例如:
当运行 package 时, 同一套生命周期的 compile, test 都会运行;
而另一套生命周期的 instal 或 clean 不会运行.
{% endnotel %}

![](../../../../img/文章资源/maven-项目构建工具/file-20241129135036689.jpg)

在此处双击 需要运行的阶段, 即可运行该阶段.

### 排除依赖

有时候我们只需要用到 `logback-classic` 依赖中的某些类, 而不需要 `logback-core` 依赖中的所有类.  
这时就可以在 `<dependency>` 标签中加入 `<exclusions>` 标签, 排除不需要的依赖.

```xml
    <dependencies>
        <dependency>
            <groupId>ch.qos.logback</groupId>
            <artifactId>logback-classic</artifactId>
            <version>1.5.8</version>

            <exclusions> <!-- 排除不需要的依赖 -->
                <exclusion>
                    <groupId>ch.qos.logback</groupId>
                    <artifactId>logback-core</artifactId>
                </exclusion>
            </exclusions>

        </dependency>
    </dependencies>
```

每次改变 pom.xml 文件, 别忘记点击按钮重新加载.

### 依赖范围

Maven 依赖默认情况下是 `compile` 范围, 即在任何(主程序, 测试程序, 打包)时候都生效.

我们可以通过 `<dependency>` 标签的 `<scope>` 标签来修改依赖范围.  
`<scope>` 标签的值有以下几种:

| scope 值 | 主程序 | 测试程序 | 打包(运行) | 注释                                     |
| -------- | ------ | -------- | ---------- | ---------------------------------------- |
| compile  | √      | √        | √          | 依赖范围默认值, 即在任何时候都生效       |
| test     | -      | √        | -          | 仅在测试程序中生效, 如 Junit             |
| provided | √      | √        | -          | 仅在编译和测试程序中生效, 如 servlet-api |
| runtime  | -      | √        | √          | 仅在运行时生效, 如 JDBC 驱动程序         |
