---
title: Swagger
date: 2025-11-02 11:23:42
description: 这是一篇新文章!
order: 0
publish: true
tags:
---

在实际开发过程中，仅靠口头描述或临时备注，很难让接口信息保持清晰一致。Swagger 的作用，就是让接口在代码层面自描述，通过规范化标注自动生成接口文档，并支持在线调试页面。

按照 Swagger 规范为接口补充信息（路径、参数、返回、说明），就可以自动生成**接口文档**与**在线调试页面**。

[swagger 官网](https://swagger.io/)

## 使用方式

### 引入依赖

在 Java MVC / Spring Boot 项目中，常配合 **Knife4j** 使用，它在 Swagger 的基础上提供了更友好的 UI 展示与增强功能。

首先，引入 Knife4j 的依赖：

```xml
<dependency>
  <groupId>com.github.xiaoymin</groupId>
  <artifactId>knife4j-spring-boot-starter</artifactId>
  <version>3.0.2</version>
</dependency>
```

Maven 会自动下载对应的 Swagger 组件，无需单独再导入 `swagger2` 依赖。

### 编写配置类

Knife4j 需要注册一个 `Docket` Bean 来告诉框架：

要扫描哪些包？接口信息如何展示？文档标题是什么？

一般建议把配置类统一放在一个包下管理，例如我的 `com.wreckloud.config` 包下，新建一个 `SwaggerConfig` 类。

```java
@Configuration
public class SwaggerConfig {

    @Bean
    public Docket docket() {
        ApiInfo apiInfo = new ApiInfoBuilder()
                .title("狼群任务系统接口文档")
                .description("接口文档 - 提供狼群内部任务系统的API说明与调试页面")
                .version("1.0")
                .build();

        return new Docket(DocumentationType.SWAGGER_2)
                .apiInfo(apiInfo)
                // 指定要扫描的 Controller 包路径
                .select()
                .apis(RequestHandlerSelectors.basePackage("com.wreckloud.wolfpack.controller"))
                .paths(PathSelectors.any())
                .build();
    }
}
```

- `@Configuration`：告诉 Spring 这是一个配置类。
- `Docket`：Swagger 的核心配置对象，用于定义文档内容。
- `.apis()`：指定要扫描的 Controller 包，通常只扫描业务接口，不扫描内部组件。
- `.apiInfo()`：定义文档标题、描述、版本信息等。

### 访问与使用

Knife4j Starter 已经内置静态资源映射，不需要手动配置。

启动项目后，直接访问：

```
http://localhost:8080/doc.html
```

就能看到接口文档首页。

## 常用注解

### @Api

标注在 Controller 上，用来说明这个接口模块是做什么的。  
用于界面上显示分组、说明业务范围。

```java
@Api(tags = "狼群任务管理接口")
@RestController
@RequestMapping("/mission")
public class MissionController {
}
```

不过 `tags` 比 `value` 更推荐。tags 最终展示在 Knife4j 列表分组更清晰。

### @ApiOperation

标注在 Controller 的方法上，用来说明具体接口的用途 / 功能点是什么。

```java
@ApiOperation("发布新任务")
@PostMapping
public Result publish(@RequestBody MissionDTO missionDTO){
    ...
}
```

简单一句话，告诉前端 “这个接口到底做什么”。

### @ApiModel

标注在实体类 / DTO / VO 上，用来说明这个对象的结构，用来做数据模型描述。

```java
@ApiModel("任务发布请求数据模型")
public class MissionDTO {
    @ApiModelProperty("任务标题")
    private String title;

    @ApiModelProperty("任务描述")
    private String content;
}
```

这个注解一般写在“请求接收对象”与“返回对象”中，是 Swagger 模型面板最常出现的部分。

### @ApiModelProperty

标注在字段上，用来说明这个字段的含义、示例、是否必填。

```java
@ApiModel("狼任务数据返回模型")
public class MissionVO {

    @ApiModelProperty(value="任务ID", example="1024")
    private Long id;

    @ApiModelProperty(value="发布者名称", example="AlphaWolf")
    private String sender;

    @ApiModelProperty(value="任务当前状态", example="PENDING")
    private String status;
}
```

字段示例（example）能显著提升文档可读性。企业开发最吐槽的就是“字段名看不懂”。
