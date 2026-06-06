---
title: 第二部分-现代日期时间 API
date: 2025-08-04 11:17:40
description: 这是一篇新文章!
order: 4
publish: true
tags:
  - Java
  - 时间API
  - 标准库
---

# 现代日期时间

在 Java 8 之前，日期时间处理一直是 Java 开发中的痛点。旧的`Date`和`Calendar`类设计不合理，使用繁琐且容易出错。
为此，Java 8 引入了全新的`java.time`包，提供了更加直观、易用且线程安全的日期时间 API。

新 API 的核心类主要有：

- **LocalDate**：处理日期（年、月、日、星期）
- **LocalTime**：处理时间（时、分、秒、纳秒）
- **LocalDateTime**：同时处理日期和时间

这些类都是**不可变对象**，意味着一旦创建就不能修改，所有修改操作都会返回新的对象，这确保了线程安全性。

内容看着挺多有点吓人，不过这些日期时间 API 只要认识、查得到就行了，这里更像一本速查字典。实际开发遇到不会的，随时查文档或用 AI 生成代码就够了。

## 创建日期时间对象

创建这些对象有两种基本方式：

```java
// 方式一：获取当前系统时间
LocalDate today = LocalDate.now();         // 当前日期
LocalTime currentTime = LocalTime.now();   // 当前时间
LocalDateTime current = LocalDateTime.now(); // 当前日期时间

// 方式二：指定具体时间创建
LocalDate birthday = LocalDate.of(1999, 12, 31); // 1999年12月31日
LocalTime meetingTime = LocalTime.of(14, 30, 0); // 14:30:00
LocalDateTime deadline = LocalDateTime.of(2023, 5, 20, 23, 59, 59); // 2023年5月20日 23:59:59
```

## LocalDate 日期处理

`LocalDate`专注于处理年、月、日、星期信息，不包含时间和时区。

### 获取日期信息

```java
LocalDate today = LocalDate.now();

// 获取年、月、日信息
int year = today.getYear();              // 年份，如2024
int month = today.getMonthValue();       // 月份(1-12)
int day = today.getDayOfMonth();         // 当月第几天
int dayOfYear = today.getDayOfYear();    // 当年第几天
int dayOfWeek = today.getDayOfWeek().getValue(); // 星期几(1-7，周一到周日)

System.out.println("今天是" + year + "年" + month + "月" + day + "日，星期" + dayOfWeek);
```

### 修改日期

所有修改操作都会返回新对象，不会改变原对象：

```java
LocalDate today = LocalDate.now(); // 假设今天是2024-03-19

// 直接修改某个字段
LocalDate nextYear = today.withYear(2025);   // 2025-03-19
LocalDate nextMonth = today.withMonth(4);    // 2024-04-19

// 增加日期
LocalDate after2Years = today.plusYears(2);  // 2026-03-19
LocalDate after3Months = today.plusMonths(3); // 2024-06-19
LocalDate nextWeek = today.plusWeeks(1);     // 2024-03-26

// 减少日期
LocalDate before1Year = today.minusYears(1);  // 2023-03-19
LocalDate lastMonth = today.minusMonths(1);   // 2024-02-19
```

### 日期比较

```java
LocalDate date1 = LocalDate.of(2024, 1, 1);
LocalDate date2 = LocalDate.of(2024, 12, 31);

boolean isEqual = date1.equals(date2);     // false，判断是否相等
boolean isBefore = date1.isBefore(date2);  // true，date1是否在date2之前
boolean isAfter = date1.isAfter(date2);    // false，date1是否在date2之后
```

## LocalTime 时间处理

`LocalTime`专注于处理时、分、秒、纳秒信息，不包含日期和时区。

### 获取时间信息

```java
LocalTime now = LocalTime.now();

// 获取时、分、秒、纳秒
int hour = now.getHour();        // 小时(0-23)
int minute = now.getMinute();    // 分钟(0-59)
int second = now.getSecond();    // 秒(0-59)
int nano = now.getNano();        // 纳秒

System.out.println("当前时间是" + hour + ":" + minute + ":" + second);
```

### 修改时间

```java
LocalTime now = LocalTime.now(); // 假设现在是14:30:20

// 直接修改某个字段
LocalTime atNoon = now.withHour(12);       // 12:30:20
LocalTime noSeconds = now.withSecond(0);   // 14:30:00

// 增加时间
LocalTime after2Hours = now.plusHours(2);   // 16:30:20
LocalTime after30Mins = now.plusMinutes(30); // 15:00:20

// 减少时间
LocalTime before1Hour = now.minusHours(1);   // 13:30:20
LocalTime before15Mins = now.minusMinutes(15); // 14:15:20
```

### 时间比较

```java
LocalTime time1 = LocalTime.of(9, 0);  // 9:00
LocalTime time2 = LocalTime.of(18, 0); // 18:00

boolean isEqual = time1.equals(time2);     // false
boolean isBefore = time1.isBefore(time2);  // true
boolean isAfter = time1.isAfter(time2);    // false
```

## LocalDateTime 日期时间处理

`LocalDateTime`结合了`LocalDate`和`LocalTime`的功能，可以同时处理日期和时间信息。

### 获取和修改信息

`LocalDateTime`包含了`LocalDate`和`LocalTime`的所有方法，因此可以获取或修改任何日期时间字段：

```java
LocalDateTime now = LocalDateTime.now();

// 获取日期时间信息
int year = now.getYear();
int month = now.getMonthValue();
int day = now.getDayOfMonth();
int hour = now.getHour();
int minute = now.getMinute();

// 修改信息
LocalDateTime tomorrow = now.plusDays(1);
LocalDateTime lastWeek = now.minusWeeks(1);
LocalDateTime christmas = now.withMonth(12).withDayOfMonth(25);
```

## 类型转换

`LocalDateTime`可以方便地转换为`LocalDate`或`LocalTime`，反之亦然：

```java
LocalDateTime now = LocalDateTime.now();

// LocalDateTime → LocalDate 和 LocalTime
LocalDate date = now.toLocalDate();  // 提取日期部分
LocalTime time = now.toLocalTime();  // 提取时间部分

// LocalDate + LocalTime → LocalDateTime
LocalDateTime combined = LocalDateTime.of(date, time); // 重新合并
```

这种转换特性非常实用，比如当你需要单独处理日期或时间部分时，可以先提取出来，处理完再合并回去。

# 时区处理

前面介绍的`LocalDate`、`LocalTime`和`LocalDateTime`都不包含时区信息。在处理国际业务或需要考虑不同地区时间差异时，我们需要使用带时区的日期时间 API。

**什么是时区？**

由于地球自转，世界各地的日出、日落时间不同，人们将地球划分为 24 个时区。各个国家和地区根据其地理位置采用不同的标准时间：

- **世界标准时间(UTC)**：作为全球时间协调的基准
- **中国标准时间**：UTC+8 小时，也就是比世界标准时间快 8 小时

## ZoneId 时区标识

`ZoneId`是 Java 中表示时区的核心类，它有三种主要表示方式：

1. 洲名/城市名：`Asia/Shanghai`、`Asia/Chongqing`
2. 国家名/城市名：`America/New_York`
3. 偏移量：`UTC+8`

```java
// 1. 以洲名/城市名表示
ZoneId shanghai = ZoneId.of("Asia/Shanghai");

// 2. 以国家/城市名表示
ZoneId newYork = ZoneId.of("America/New_York");

// 3. 以UTC偏移量表示
ZoneId utcPlus8 = ZoneId.of("UTC+8");
```

获取时区信息非常简单：

```java
// 获取系统默认时区
ZoneId defaultZone = ZoneId.systemDefault();
System.out.println("当前系统时区：" + defaultZone);  // 例如输出：Asia/Shanghai

// 查看Java支持的所有时区
Set<String> allZones = ZoneId.getAvailableZoneIds();
System.out.println("Java支持" + allZones.size() + "个时区");  // 大约600个时区
```

## ZonedDateTime 带时区的日期时间

`ZonedDateTime`是`LocalDateTime`的增强版，它不仅知道"几点几分"，还知道"在哪个时区的几点几分"。

### 创建对象

```java
// 获取当前系统时区的日期时间
ZonedDateTime now = ZonedDateTime.now();
System.out.println(now);  // 输出：2024-03-19T15:30:45.123+08:00[Asia/Shanghai]

// 获取特定时区的当前时间
ZonedDateTime newYorkNow = ZonedDateTime.now(ZoneId.of("America/New_York"));
System.out.println("纽约现在是：" + newYorkNow);
```

从输出格式可以看出，`ZonedDateTime`包含了完整信息：日期、时间、偏移量和时区 ID。

### 在时区之间转换

跨时区业务的一大痛点是时区转换，而`ZonedDateTime`让这变得异常简单：

```java
// 东京现在的时间
ZonedDateTime tokyoTime = ZonedDateTime.now(ZoneId.of("Asia/Tokyo"));

// 将东京时间转换为纽约时间（同一时刻，不同时区的表示）
ZonedDateTime sameTimeInNY = tokyoTime.withZoneSameInstant(ZoneId.of("America/New_York"));
System.out.println("东京：" + tokyoTime.getHour() + "点");
System.out.println("纽约：" + sameTimeInNY.getHour() + "点");
```

这段代码展示了同一时刻在两个时区的不同表现形式，非常适合处理国际会议时间等场景。

### 日期时间操作

`ZonedDateTime`保留了`LocalDateTime`的所有便捷操作，并自动处理时区问题：

```java
ZonedDateTime meeting = ZonedDateTime.now();

// 计算一周后的会议时间
ZonedDateTime nextMeeting = meeting.plusWeeks(1);

// 调整为当天上午10点的会议
ZonedDateTime morningMeeting = meeting.withHour(10).withMinute(0).withSecond(0);

// 查看这个时间在伦敦是几点
ZonedDateTime londonTime = morningMeeting.withZoneSameInstant(ZoneId.of("Europe/London"));
System.out.println("伦敦对应时间：" + londonTime);
```

# Instant 精确时间戳

Instant 类是 Java 8 引入的时间 API，它代表时间线上的一个精确时刻，本质上是一个高精度的时间戳。它的内部实现由两部分组成：

- 从 1970-01-01 00:00:00 UTC（Unix 纪元）开始累计的**秒数**
- 不足一秒的**纳秒部分**

这种设计让 Instant 能够提供纳秒级的时间精度，非常适合需要高精确度时间测量的场景。

### 创建 Instant 对象

最常用的方式是获取当前时间点：

```java
// 获取当前时刻的Instant对象（世界标准时间）
Instant now = Instant.now();
System.out.println(now);  // 输出格式：2023-07-15T08:45:30.123456789Z
```

### 获取时间信息

从 Instant 对象中可以轻松获取时间组成部分：

```java
Instant now = Instant.now();
// 获取从Unix纪元开始的总秒数
long seconds = now.getEpochSecond();
System.out.println("总秒数：" + seconds);

// 获取不足一秒的纳秒部分
int nanos = now.getNano();
System.out.println("纳秒部分：" + nanos);
```

### 时间计算

Instant 提供了丰富的时间计算方法：

```java
Instant now = Instant.now();
// 增加时间
Instant future = now.plusSeconds(60)      // 增加60秒
                    .plusMillis(500)      // 再增加500毫秒
                    .plusNanos(1000);     // 再增加1000纳秒

// 减少时间
Instant past = now.minusSeconds(60)       // 减少60秒
                  .minusMillis(500)       // 再减少500毫秒
                  .minusNanos(1000);      // 再减少1000纳秒
```

### 时间比较

可以方便地进行时间先后比较：

```java
Instant time1 = Instant.now();
// 模拟一些耗时操作
Thread.sleep(100);
Instant time2 = Instant.now();

// 比较两个时间点
boolean isAfter = time2.isAfter(time1);    // true
boolean isBefore = time1.isBefore(time2);  // true
boolean isEqual = time1.equals(time2);     // false

// 计算时间差（以毫秒为单位）
long durationMillis = time2.toEpochMilli() - time1.toEpochMilli();
System.out.println("操作耗时：" + durationMillis + "毫秒");
```

无论是性能分析、用户操作记录，还是其他需要高精度时间测量的场景，Instant 都是更现代、更可靠的选择。

# DateTimeFormatter 日期时间格式化

Java 8 之后，日期时间的格式化和解析终于变得优雅又安全了。`DateTimeFormatter` 就是专门为了解决老版 `SimpleDateFormat` 线程不安全、用起来别扭的问题。

### 创建格式化对象

想自定义日期时间的显示格式？直接用 `ofPattern` 静态方法搞定：

```java
DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
```

这样就能定义出你想要的格式模板。

### 格式化时间对象

假设我们有一个当前时间的 `LocalDateTime` 对象：

```java
LocalDateTime now = LocalDateTime.now();
```

要把它格式化成字符串，有两种常用写法，任选其一。

**写法一：格式化器.format(时间对象)**

```java
String str1 = dtf.format(now);
System.out.println(str1); // 2024-07-01 15:30:00
```

**写法二：时间对象.format(格式化器)**

```java
String str2 = now.format(dtf);
System.out.println(str2); // 2024-07-01 15:30:00
```

推荐用第二种，更直观。

### 字符串转时间对象

有字符串想转成 `LocalDateTime`？用 `parse` 方法：

```java
String dateStr = "2023-11-11 11:11:11";
// 定义模板
DateTimeFormatter dtf2 = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

LocalDateTime ldt2 = LocalDateTime.parse(dateStr, dtf2);
System.out.println(ldt2); // 2023-11-11T11:11:11
```

只要格式模板和字符串内容对得上，解析就很丝滑。

### 常用格式符号

在自定义日期时间格式时，最关键的是搞懂每个字母代表什么。下面这些符号，基本能覆盖绝大多数场景：

| 符号      | 作用/含义                       | 示例输出          |
| --------- | ------------------------------- | ----------------- |
| yyyy / yy | 年（四位/两位）                 | 2024 / 24         |
| MM / M    | 月（两位/不补零）               | 07 / 7            |
| dd / d    | 日（两位/不补零）               | 05 / 5            |
| HH / H    | 小时（24 小时制，两位/不补零）  | 09 / 9            |
| hh / h    | 小时（12 小时制，两位/不补零）  | 03 / 3            |
| mm / m    | 分钟（两位/不补零）             | 04 / 4            |
| ss / s    | 秒（两位/不补零）               | 09 / 9            |
| SSS       | 毫秒（三位）                    | 235               |
| a         | 上下午标记                      | AM / PM           |
| E / EEEE  | 星期（缩写/全称，英文）         | Tue / Tuesday     |
| G         | 公元/纪元                       | AD / BC           |
| D / w     | 一年中的第几天/第几周           | 189 / 27          |
| z / Z / X | 时区缩写/偏移（RFC822/ISO8601） | CST / +0800 / +08 |
| '字符串'  | 文字原样输出（单引号包裹）      | '年' → 年         |

比如你想要“2024 年 07 月 05 日 18:30:15”这种格式，可以这样写：

```java
DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy年MM月dd日 HH:mm:ss");
```

如果想加上星期几：

```java
DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd EEEE");
```

输出就是：2024-07-05 星期五

# Period & Duration 计算时间间隔

在实际开发中，经常需要计算两个时间点之间相差多少天、多少月、多少年，或者精确到小时、分钟、秒。Java 8 提供了两个专门的类来搞定这件事：

- **Period**：专注于“日期”间隔（年、月、日）
- **Duration**：专注于“时间”间隔（天、小时、分钟、秒、毫秒、纳秒）

### Period 日期差

Period 适合用来比较两个 LocalDate（只关心年月日，不管具体时分秒）。

**用法很简单，先用 between 得到 Period 对象：**

```java
LocalDate start = LocalDate.of(2020, 1, 1);
LocalDate end = LocalDate.of(2024, 7, 5);
Period period = Period.between(start, end);
```

**然后可以分别获取年、月、天的差值：**

```java
int years = period.getYears();   // 相差几年
int months = period.getMonths(); // 相差几个月（不含年）
int days = period.getDays();     // 相差几天（不含年和月）
```

比如上面例子，years=4，months=6，days=4。

### Duration 时间差

Duration 适合用来比较两个时间点，支持 LocalTime、LocalDateTime、Instant 等类型。

同样，先用 between 得到 Duration 对象：

```java
LocalDateTime start = LocalDateTime.of(2024, 7, 5, 8, 0, 0);
LocalDateTime end = LocalDateTime.of(2024, 7, 5, 18, 30, 0);
Duration duration = Duration.between(start, end);
```

然后可以直接获取各种单位的间隔：

```java
long hours = duration.toHours();     // 相差多少小时
long minutes = duration.toMinutes(); // 相差多少分钟
long seconds = duration.toSeconds(); // 相差多少秒
```

如果你想要更细的单位，比如毫秒、纳秒，也有对应方法：

```java
long millis = duration.toMillis(); // 毫秒
long nanos = duration.toNanos();   // 纳秒
```

**场景案例：距离下班还有多久**

比如现在是 17:20:15，下班时间是 18:30:00，想输出“1 小时 9 分 45 秒”：

```java
LocalTime now = LocalTime.of(17, 20, 15);
LocalTime offWork = LocalTime.of(18, 30, 0);
Duration duration = Duration.between(now, offWork);

long hours = duration.toHoursPart();
long minutes = duration.toMinutesPart();
long seconds = duration.toSecondsPart();

System.out.println(hours + "小时" + minutes + "分" + seconds + "秒");
```

输出效果：  
`1小时9分45秒`

- `toHours()` 得到的是“总小时数”，比如 1 小时 9 分 45 秒会变成 1（不足 1 小时不算）。
- `toHoursPart()`、`toMinutesPart()`、`toSecondsPart()` 得到的是“分段剩余”，比如 1 小时 9 分 45 秒，分别是 1、9、45。

这样写，日常生活里的“倒计时”需求就能一行代码解决，非常直观！
