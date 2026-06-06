---
title: record 记录类
date: 2026-05-21 16:00:35
description: 这是一篇新文章!
order: 0
publish: true
tags:
  - Java
  - record
  - 语法特性
---

在 Java 中，我们经常会写一些“只负责装数据”的类。

比如接口响应对象、错误信息对象、VO、DTO 等。这些类通常没有复杂业务逻辑，主要作用只是保存几组数据，并在不同层之间传递。

如果使用传统 `class` 编写这类对象，往往需要手动编写字段、构造方法、访问方法，以及 `toString()`、`equals()`、`hashCode()` 等方法。哪怕使用 Lombok，本质上也只是借助注解减少这些模板代码。

从 Java 16 开始，`record` 成为正式特性。它是 Java 官方提供的一种简洁数据类写法，适合用来定义“创建后主要用于读取”的数据对象。

简单来说，`record` 可以理解为一种更轻量的数据载体类。

```java
public record ApiError(String code, String message) {
}
```

这段代码定义了一个记录类 `ApiError`，其中包含两个数据：

```java
String code
String message
```

它大致等价于下面这种传统写法：

```java
public final class ApiError {

    private final String code;
    private final String message;

    public ApiError(String code, String message) {
        this.code = code;
        this.message = message;
    }

    public String code() {
        return code;
    }

    public String message() {
        return message;
    }

    // 编译器还会自动生成 equals、hashCode、toString
}
```

可以看到，`record` 并不是普通 `class` 的简单替换，而是 Java 专门为“数据对象”准备的一种语法。它会根据声明内容，自动生成一组常用代码。

## 基本写法

`record` 最明显的特点是：**在类名后面直接声明这个对象包含哪些数据**。

例如：

```java
public record ApiResponse<T>(
        boolean success,
        T data,
        ApiError error
) {
}
```

这里的：

```java
boolean success
T data
ApiError error
```

叫做 record 的组成部分，也可以理解为这个对象携带的几项数据。编译器会根据这些内容自动生成对应字段：

```java
private final boolean success;
private final T data;
private final ApiError error;
```

同时还会自动生成完整构造方法：

```java
public ApiResponse(boolean success, T data, ApiError error)
```

所以创建对象时，可以直接写：

```java
ApiResponse<String> response = new ApiResponse<>(true, "ok", null);
```

这就是 record 的核心用法：**声明时写出数据结构，Java 自动补齐常见的数据类代码**。

## record 的自动生成

需要注意的是，`record` 自动生成的访问方法不是传统的 `getXxx()`，而是直接使用字段名作为方法名。

例如：

```java
response.success();
response.data();
response.error();
```

因为 `record` 更强调“这个对象由哪些数据组成”，所以它的方法使用了更直接的点号。

还有一点需要强调的是：`record` 不会生成 setter 方法，因此其默认是不可变的。record 中声明的字段本质上是 `final` 的，对象创建完成后，字段值就不能再被修改。

例如：

```java
ApiError error = new ApiError("USER_NOT_FOUND", "用户不存在");
```

创建之后，不能再这样修改：

```java
error.setMessage("新的错误信息");
```

这也是它和普通 JavaBean 最大的区别之一。普通 JavaBean 通常是：

```java
User user = new User();
user.setUsername("wolf");
user.setPassword("123456");
```

而 record 更倾向于：

```java
UserLoginDTO dto = new UserLoginDTO("wolf", "123456");
```

也就是说，record 更适合“创建时确定数据，之后只读取”的对象。

结合统一响应体来看，`record` 就比较合适。

比如：

```java
@Schema(description = "统一响应结构")
public record ApiResponse<T>(

        @Schema(description = "是否成功", example = "true")
        boolean success,

        @Schema(description = "业务数据")
        T data,

        @Schema(description = "错误信息，成功时为 null")
        ApiError error

) {

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, data, null);
    }

    public static <T> ApiResponse<T> fail(String code, String message) {
        return new ApiResponse<>(false, null, new ApiError(code, message));
    }
}
```

这个类的作用是统一后端接口的返回格式。

成功时返回：

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

失败时返回：

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "用户不存在"
  }
}
```

这里的 `ApiResponse<T>` 是一个统一外壳。

- `success` 表示接口是否处理成功。
- `data` 表示成功时真正返回给前端的业务数据。
- `error` 表示失败时的错误信息。

这样就可以做到：外层响应格式统一，里面的业务数据灵活变化。

`record` 和 Lombok 的关系也要分清楚。

Java 16 之后，record 可以替代 Lombok 的一部分使用场景，但不能完全替代 Lombok。

如果一个类只是单纯装数据，并且创建后不需要修改字段，那么 record 很适合。

例如：

```java
public record ApiError(
        String code,
        String message
) {
}
```

这种类用 record 很清爽。

以前可能要写：

```java
@Data
@AllArgsConstructor
public class ApiError {
    private String code;
    private String message;
}
```

现在用 record 就可以少依赖 Lombok，也少写很多模板代码。

## record 的适用场景

`record` 适合用来定义简单、稳定、创建后主要用于读取的数据对象。

比如：

```java
public record ApiError(
        String code,
        String message
) {
}
```

如果用普通 `class` 写同样的内容，就需要额外编写字段、构造方法、访问方法等模板代码：

```java
public class ApiError {

    private String code;
    private String message;

    public ApiError(String code, String message) {
        this.code = code;
        this.message = message;
    }

    public String getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }
}
```

如果这个类只是用来保存错误码和错误信息，那么 `record` 明显更简洁。

因此，像下面这些偏“数据传递”的对象，就比较适合使用 `record`：

- ApiResponse
- ApiError
- UserVO
- LoginVO
- PageResult
- 简单 DTO

它们的共同点是：对象创建后，主要是被读取，而不是被反复修改。

### record 不适合的场景

`record` 默认不可变，不提供 setter，也不适合依赖无参构造后再逐个字段赋值的场景。因此，数据库实体类通常不建议直接使用 `record`。

例如：

```java
@TableName("user")
@Data
public class UserEntity {
    private Long id;
    private String username;
    private String password;
}
```

这类对象经常需要配合 MyBatis-Plus、JPA 等持久层框架使用。框架在处理实体对象时，通常会涉及无参构造、setter 赋值、反射映射、字段自动填充、逻辑删除等操作。

这些需求和 `record` 的设计方向并不一致。

所以，像下面这些对象一般更适合继续使用普通 `class`：

- 数据库 Entity
- 需要 setter 的对象
- 需要无参构造的对象
- 需要框架反射赋值的对象
- 包含复杂业务状态变化的对象

判断时可以抓住一个问题：

> 这个对象创建后，是主要读取，还是还要频繁修改？

如果主要读取，可以考虑 `record`。

如果需要修改字段、交给框架赋值，或者承载复杂状态变化，就优先使用普通 `class`。

### record 和 Lombok 的关系

`record` 不能完全替代 Lombok。

例如以前可能会这样写：

```java
@Data
@AllArgsConstructor
public class ApiError {
    private String code;
    private String message;
}
```

如果这个类不需要 setter，就可以改成：

```java
public record ApiError(
        String code,
        String message
) {
}
```

这种场景下，`record` 可以减少对 Lombok 的依赖。

但 Lombok 还有很多其他用途，例如：

- @Getter/@Setter：生成 getter/Setter 方法，用于读取属性值
- @NoArgsConstructor/@AllArgsConstructor：生成无参构造方法/包含所有字段的构造方法
- @Builder：生成建造者模式代码，适合参数较多时构造对象
- @RequiredArgsConstructor：为 `final` 字段或 `@NonNull` 字段生成构造方法，常用于构造器注入
- @Slf4j：自动生成日志对象 log，方便输出日志

这些并不是 `record` 要解决的问题。

比如在 Spring 中，`@RequiredArgsConstructor` 常用于构造器注入：

```java
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserMapper userMapper;
}
```

这种 Service 类不是数据载体，自然不该用 `record` 替代。

所以可以简单记：

1. 简单、稳定、只读的数据对象 → record
2. 需要 setter、无参构造、框架赋值、复杂状态变化 → class
3. 减少部分数据类模板代码 → record 可以替代一部分 Lombok
4. 日志、构造器注入、Builder 等功能 → 仍然是 Lombok 的使用场景

对当前的 `ApiResponse<T>` 来说，它只是描述一次接口响应结果，创建后不需要再修改，所以用 `record` 是合适的。
