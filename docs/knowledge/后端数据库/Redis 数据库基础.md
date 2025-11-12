---
title: 'Redis'
date: '2025-11-09 11:15:57'
description: '这是一篇新文章!'
order: 0
publish: true
tags: 
---

# Redis 入门

Redis 是一个**基于内存**的 key-value 结构数据库。  
它的 value 类型很丰富（String / Hash / List / Set / ZSet 等），所以也常被称为**结构化的 NoSQL 非关系型数据库**。

```rust
商品_10001:name -> "黑森林巧克力蛋糕"
商品_10001:price -> "39.9"
商品_10001:sellCount -> 5321

rank:hot_goods -> zset [ (score=5321, 商品_10001), (score=5003, 商品_20012), ... ]
```

因为是内存级读写，所以速度非常快，非常适合存**热点数据**：  
热点商品、资讯、排行榜、新闻流……这些高频读写的东西，用 Redis 能极大减少 DB 压力。

官网：[https://redis.io](https://redis.io/)

## Redis 启动与停止

在 Windows 环境下，Redis 安装目录中通常会包含 `redis-server.exe`。  
直接执行它，就可以启动 Redis 服务：

![](../../public/images/文章资源/redis-数据库基础/file-20251110152519950.jpg)
启动后控制台会显示版本、端口等相关信息，当看到服务成功运行并监听端口时，表示启动完成。  
Redis 默认端口为 **6379**。

停止 Redis 服务时，可以直接在当前运行窗口按下 `Ctrl + C` 结束，也可以直接关闭窗口。

## 设置 Redis 密码

如果需要给 Redis 增加访问密码，需要修改配置文件 `redis.windows.conf`：

1. 编辑配置文件 `redis.windows.conf`，加入/修改：

![](../../public/images/文章资源/redis-数据库基础/file-20251110152628526.jpg)

2. **在 CMD 中用该配置文件启动服务**（关键）：

```bash
redis-server.exe redis.windows.conf
```

3. 之后客户端需要带密码连接：

```bash
redis-cli.exe -a 123456
# 或先连再授权
AUTH 123456
```

> 说明：`#` 是注释；修改配置后需按上述命令**携带配置文件重启**服务，密码才会生效。

# 常用数据类型

Redis 存储的数据都以 **key-value** 结构存在，key 始终为字符串类型。而 value 则可以使用不同的数据结构进行存储。Redis 最常使用的五种数据类型如下：

![](../../public/images/文章资源/redis-数据库基础/file-20251109202441517.jpg)

- 字符串（String）：最基础、最常用的数据结构
- 哈希（Hash）：类似 Java 中的 HashMap，用于存储对象结构
- 列表（List）：有序结构，允许重复元素
- 集合（Set）：无序结构，不允许重复元素
- 有序集合（Sorted Set / ZSet）：集合中的每个元素都有对应 score，用 score 升序排序，不允许重复元素

这五种结构是 Redis 使用中最核心的知识点，也是日常开发中使用频率最高的部分。同样的数据，有没有更合适的数据类型去表达，是 Redis 使用效率以及可维护性差异的关键。

接下来 Redis 的常用命令，大体上无非是“存值、取值、修改值”三大方向，在不同数据类型下有不同指令组合。

### 字符串（String）

字符串是 Redis 最基础、最常用的数据类型，可以存储普通文本、数字、JSON、序列化后的对象等内容。  
开发中大量缓存数据都是以 String 形式存储。

**GET**

```bash
GET key
GET userName   # 获取userName的值（区分大小写）
```

GET 用于读取指定 key 的字符串内容，如果 key 不存在，会返回 nil。

**SET**

```bash
SET key value
SET userName "wreckloud"   # 设置userName的字符串内容为 wreckloud
```

SET 用来设置指令 key 的 value。如果 key 已存在，会直接覆盖原值。

**SETEX**

```bash
SETEX key seconds value
SETEX loginCode 60 "8734"   # 设置值为 8734 的lginCode验证码有效期为60秒
```

SETEX 与 SET 基本一致，但额外指定过期时间（单位为秒）。适合临时数据、验证码、临时证明类数据。

**SETNX**

```bash
SETNX key value
SETNX lock "1"   # 只有在lock不存在时才设置成功
```

SETNX 只有在 key 不存在时才会进行设置，存在时返回失败。常用于“分布式锁”初级实现、或只允许一次赋值场景。

好，这个我知道你要的精度、表达密度、落点。  
我继续保持你刚刚 String 那一段的风格一致性，继续整理 Hash 部分。

### 哈希（Hash）

Hash 是一个 string 类型的 `field -> value` 映射表，非常适合存储对象结构（如：用户信息、商品信息）。  
相比直接把对象序列化成 String 存储，Hash 可以局部字段读取、修改，效率更高，也更节省空间。

![](../../public/images/文章资源/redis-数据库基础/file-20251110140655448.jpg)

**HSET**

```bash
HSET key field value
HSET user:1001 name "wreckloud"   # 给用户1001设置 name 字段为 wreckloud
```

HSET 用来设置指定哈希表 key 中某个 field 的值。如果该 field 不存在则新增，存在则覆盖。

**HGET**

```bash
HGET key field
HGET user:1001 name   # 获取用户1001的name字段
```

HGET 用来获取指定哈希表 key 中某个 field 的值。如果 field 不存在，返回 nil。

**HDEL**

```bash
HDEL key field
HDEL user:1001 name   # 删除用户1001中的name字段
```

HDEL 用来删除哈希表中指定字段，不影响其它字段。

**HKEYS**

```bash
HKEYS key
HKEYS user:1001   # 返回所有字段名，例如 name / age / gender ...
```

用于获取哈希表所有字段名称，常用于调试、数据结构确认。

**HVALS**

```bash
HVALS key
HVALS user:1001   # 返回所有字段的值
```

用于获取哈希表所有 value 值。

**HGETALL**

```bash
HGETALL key
HGETALL user:1001   # 一次性返回所有field-value键值对
```

HGETALL 会把哈希表所有字段及对应值一起返回，适合需要同时读取完整对象的场景。

### 列表（List）

List 是一个按照插入顺序排序的字符串列表，允许重复元素。  
常用于：消息队列、评论列表、时间序列记录、最新动态流等存储场景。

![](../../public/images/文章资源/redis-数据库基础/file-20251110140709180.jpg)

**LPUSH**

```bash
LPUSH key value1 [value2 ...]
LPUSH commentList "hello" "world"   # 从左侧依次插入 hello、world
```

将一个或多个元素插入到列表头部（左侧）。列表越早插入的元素会被挤到后面。

**RPOP**

```bash
RPOP key
RPOP commentList   # 移除并返回列表最右侧的元素
```

从列表右侧弹出一个元素，并返回该元素。  
常用于“队列模式”中消费数据。

**LRANGE**

```bash
LRANGE key start stop
LRANGE commentList 0 -1   # 获取整个列表所有元素
```

返回指定范围内的元素列表。  
`0` 表示列表第一个元素，`-1` 表示最后一个元素。  
这个命令是日常调试、查看内容使用率非常高的命令。

**LLEN**

```bash
LLEN key
LLEN commentList   # 获取列表的长度（元素个数）
```

返回列表中的元素数量，用于判断队列是否还有待处理数据、流量大小、分页前置判断等场景。

### 集合（Set）

Set 是 string 类型元素组成的**无序集合**，集合元素必须唯一，不允许重复。  
常用于：标签、唯一性校验、去重集合处理等。

![](../../public/images/文章资源/redis-数据库基础/file-20251110140626305.jpg)

**SADD**

```bash
SADD key member1 [member2 ...]
SADD tags "java" "backend" "cloud"   # 向集合添加多个标签元素
```

向集合中加入一个或多个成员，重复元素会被自动忽略。

**SMEMBERS**

```bash
SMEMBERS key
SMEMBERS tags   # 返回当前集合中所有成员
```

返回集合中所有元素，由于集合无序，因此返回顺序不固定。

**SCARD**

```bash
SCARD key
SCARD tags   # 获取集合元素数量
```

返回集合中的成员数量，可用于数量统计、限制策略判断。

**SINTER**

```bash
SINTER key1 key2 ...
SINTER tagsA tagsB   # 返回两个集合的交集
```

求多个集合之间的**交集**，常用于取公共用户、共同标签、共同关注等场景。

**SUNION**

```bash
SUNION key1 key2 ...
SUNION tagsA tagsB   # 返回两个集合的并集
```

求多个集合的**并集**，可以用来聚合同类标签、汇总元素来源。

**SREM**

```bash
SREM key member1 [member2 ...]
SREM tags "java"   # 删除集合中指定元素
```

从集合中移除指定成员，不影响其他 member。

### 有序集合（Sorted Set / ZSet）

ZSet 是 string 类型的有序集合，不允许重复成员。  
每个成员都会绑定一个 double 类型的 score，根据 score 从小到大排序。  
常用于：排行榜、热门内容排序、延迟任务队列等。

**ZADD**

```bash
ZADD key score1 member1 [score2 member2 ...]
ZADD hotRank 5321 "goods_1001" 4800 "goods_2001"   # 将带分数的成员加入到有序集合
```

向有序集合添加一个或多个成员，并为每个成员设置对应分数。如果 member 已存在，会更新对应 score。

**ZRANGE**

```bash
ZRANGE key start stop [WITHSCORES]
ZRANGE hotRank 0 -1 WITHSCORES   # 返回所有成员及分数
```

根据指定索引区间，返回有序集合成员列表。  
`0` 表示最小分数的成员起始位置，`-1` 表示最后一个元素。  
使用 `WITHSCORES` 可以同时返回 score 值。

**ZINCRBY**

```bash
ZINCRBY key increment member
ZINCRBY hotRank 100 "goods_1001"   # goods_1001 的分数增加 100
```

将指定成员的 score 增加指定 increment 值，用于排行榜更新、计数、热点值递增等场景。

**ZREM**

```bash
ZREM key member [member ...]
ZREM hotRank "goods_2001"   # 移除指定成员
```

从 ZSet 中移除一个或多个成员。

### 通用命令（不区分数据类型）

这些命令对所有类型的 key 都通用。

**KEYS**

```bash
KEYS pattern
KEYS A*   # 查找所有以A开头的key
```

用于匹配查找符合 pattern 的 key。  
例如 `*` 表示全部，`A*` 表示以 A 开头。但在生产环境严谨使用 `*` 大范围匹配，因为 Redis 可能存有大量 key，大范围 KEYS 会阻塞服务。

**EXISTS**

```bash
EXISTS key
EXISTS loginCode   # 检查key是否存在
```

判断指定 key 是否存在。返回结果为 0 / 1。  
该命令不支持通配符。

**TYPE**

```bash
TYPE key
TYPE user:1001   # 返回当前key对应的value类型
```

返回指定 key 对应的数据类型，例如 string / hash / list / set / zset。

**DEL**

```bash
DEL key
DEL user:1001   # 删除指定key
```

用于删除一个或多个 key。存在则删除，不存在则忽略。

**RENAME**

```bash
RENAME key newKey
RENAME user:1001 user:profile:1001   # 修改key名称
```

对指定 key 进行重命名。

**PING**

```bash
PING
PING   # 测试连接是否正常，正常返回PONG
```

用于测试 Redis 服务连通性是否正常。

**EXPIRE**

```bash
EXPIRE key seconds
EXPIRE loginCode 60   # 设置loginCode这个key 60秒后自动过期
```

为指定 key 设置有效时间（单位：秒）。

**TTL**

```bash
TTL key
TTL loginCode   # 查看剩余生存时间
```

查看 key 的剩余过期时间，单位为秒。

- -1：该 key 永不过期
- -2：该 key 不存在 或 已经过期

好了，这一段我也帮你整理成可直接放笔记里的正式表达。  
语言保持统一风格，结构清晰、利于记忆。

# Redis 的 Java 客户端

Java 中访问 Redis 有多种客户端实现，它们本质上都是 Redis 的操作 API：

- **Jedis**
- **Lettuce**
- **Spring Data Redis**（在 Spring 体系中最常用）

其中 Spring Data Redis 是 Spring 官方维护的 Redis 访问框架，对底层客户端做了进一步封装。在 Spring Boot 项目中，几乎都会直接使用 Spring Data Redis 简化 Redis 操作。

Spring Data Redis 使用步骤如下

### 1.引入 Maven 依赖

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
```

### 2.配置 Redis 连接信息

```yaml
spring:
  redis:
    host: localhost
    port: 6379
    password: 123456
```

Spring 连接 Redis 的方式与连接 MySQL 的概念相同，都是配置数据源连接参数。

### 3.配置 RedisTemplate（可选）

Spring Boot 默认会自动创建 `RedisTemplate`，但默认 key 采用 JDK 序列化，可读性较差。通常会自定义一个，至少将 key 的序列化器修改为 `StringRedisSerializer`。

```java
@Slf4j
@Configuration
public class RedisConfiguration {

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory){
        log.info("初始化 RedisTemplate ...");

        RedisTemplate<String, Object> redisTemplate = new RedisTemplate<>();
        // 设置 key 序列化方式为字符串，避免出现一堆不可读的字节序列
        redisTemplate.setKeySerializer(new StringRedisSerializer());
        // 设置 value 序列化方式（可选，这里先默认，用时再具体指定）
        // redisTemplate.setValueSerializer(new GenericJackson2JsonRedisSerializer());

        // 设置连接工厂
        redisTemplate.setConnectionFactory(connectionFactory);
        return redisTemplate;
    }
}
```

### 4.使用 RedisTemplate 操作 Redis

之后在业务层中，直接注入 `RedisTemplate` 就可以进行数据读写。

```java
@Autowired
private RedisTemplate redisTemplate;
```

后面执行 set / get 等操作时，就可以直接通过 redisTemplate 完成。

# SpringData Redis 使用

示例默认使用：

```java
@Autowired
private StringRedisTemplate stringRedisTemplate;

@Autowired
private RedisTemplate<String, Object> redisTemplate;
```

- 纯字符串/计数：更推荐 `StringRedisTemplate`（key/value 都是 String）。
- 存对象：使用 `RedisTemplate<String, Object>`（建议 JSON 序列化）。
- 统一写法：先取 `ops = xxxTemplate.opsForValue()/opsForHash()` 等，再调用方法。

## ValueOperations（String）

**set/get**

```java
opsForValue().set(String key, String value)
stringRedisTemplate.opsForValue().set("login:captcha:188****1234", "8734")  // 写入验证码
```

写入字符串值。若 key 已存在会覆盖。可配合 `expire` 设置存活时间。

```java
opsForValue().get(String key)
stringRedisTemplate.opsForValue().get("login:captcha:188****1234")  // 读取验证码
```

读取字符串值。不存在返回 `null`。

**setIfAbsent（SETNX）**

```java
opsForValue().setIfAbsent(String key, String value)
stringRedisTemplate.opsForValue().setIfAbsent("lock:order:1001", "1")  // 仅在不存在时写入
```

仅当 key 不存在时写入（原子）。常用于简单分布式锁或“一次性初始化”。

**increment / decrement**

```java
opsForValue().increment(String key) / increment(key, long delta) / decrement(key)
stringRedisTemplate.opsForValue().increment("pv:home")  // 访问量+1
```

原子自增/自减（字符串数值）。适合计数器、限流滑动窗口等。

**multiSet / multiGet**

```java
opsForValue().multiSet(Map<String, String> m) / multiGet(Collection<String> keys)
stringRedisTemplate.opsForValue().multiSet(Map.of("k1","v1","k2","v2"))  // 批量写
```

批量写/读，减少网络往返。注意批量 get 返回 List，缺失位置为 null。

过期控制：

```java
stringRedisTemplate.expire("login:captcha:188****1234", Duration.ofSeconds(60));
```

或写入时使用 `set(key, val, timeout)` 的重载。

## HashOperations（Hash）

**put/get**

```java
opsForHash().put(String key, Object field, Object value)
redisTemplate.opsForHash().put("user:1001", "name", "wreckloud")  // 写入/覆盖字段
```

设置（或覆盖）某个 field 的值。不存在则创建。

```java
opsForHash().get(String key, Object field)
redisTemplate.opsForHash().get("user:1001", "name")  // 读取单个字段
```

获取指定 field 值。不存在返回 null。

**putAll**

```java
opsForHash().putAll(String key, Map<?, ?> map)
redisTemplate.opsForHash().putAll("user:1001", Map.of("name","wreckloud","age",23))  // 批量写
```

一次性写入多个字段，适合初始化对象。

**entries / keys / values**

```java
opsForHash().entries(String key) / keys(key) / values(key)
redisTemplate.opsForHash().entries("user:1001")  // 读取完整对象（field->value 映射）
```

读取哈希所有字段与值/仅字段/仅值。调试与全量读常用。

#### **delete**

```java
opsForHash().delete(String key, Object... fields)
redisTemplate.opsForHash().delete("user:1001", "age")  // 删除字段
```

删除一个或多个字段，不影响其他字段。

> 将 `hashKey` 设置为 String 序列化，`hashValue` 设为 JSON 更利于可读与跨语言。

## ListOperations（List）

**leftPush / rightPush**

```java
opsForList().leftPush(String key, Object value) / rightPush(key, value)
redisTemplate.opsForList().leftPush("comment:post:2001", "hello")  // 左侧入队
```

按两端插入元素，允许重复。可组合实现队列（LPUSH + RPOP）或栈（LPUSH + LPOP）。

**leftPop / rightPop**

```java
opsForList().leftPop(String key) / rightPop(key)
redisTemplate.opsForList().rightPop("comment:post:2001")  // 右侧出队
```

从两端弹出并返回一个元素。阻塞版可用 `rightPop(key, timeout)`。

**range**

```java
opsForList().range(String key, long start, long end)
redisTemplate.opsForList().range("comment:post:2001", 0, -1)  // 获取全量列表
```

根据下标区间读取元素列表。`0` 为首元素，`-1` 为最后一个。

**size**

```java
opsForList().size(String key)
redisTemplate.opsForList().size("comment:post:2001")  // 列表长度
```

获取列表长度。可用于分页或队列剩余任务判断。

> 进阶：可用 `rightPopAndLeftPush(src, dst)` 实现安全转移/工作队列模式。

## SetOperations（Set）

**add**

```java
opsForSet().add(String key, Object... values)
redisTemplate.opsForSet().add("tags:user:1001", "java", "backend")  // 添加去重元素
```

新增一个或多个成员，自动去重。

**members**

```java
opsForSet().members(String key)
redisTemplate.opsForSet().members("tags:user:1001")  // 获取全部成员
```

获取整个集合（无序）。

**remove**

```java
opsForSet().remove(String key, Object... values)
redisTemplate.opsForSet().remove("tags:user:1001", "java")  // 移除成员
```

从集合中删除指定成员。

**intersect / union**

```java
opsForSet().intersect(String key, String otherKey) / union(key, otherKey)
redisTemplate.opsForSet().intersect("tags:A", "tags:B")  // 交集
```

计算交集/并集。也有 `intersectAndStore/unionAndStore` 将结果存到新 key。

**size**

```java
opsForSet().size(String key)
redisTemplate.opsForSet().size("tags:user:1001")  // 基数统计
```

返回集合元素个数。

## ZSetOperations（ZSet）

**add**

```java
opsForZSet().add(String key, Object value, double score)
redisTemplate.opsForZSet().add("rank:hot", "goods_1001", 5321)  // 加入带分数的成员
```

新增成员及分数；已存在则分数会被更新。

**range / rangeWithScores**

```java
opsForZSet().range(String key, long start, long end)
redisTemplate.opsForZSet().range("rank:hot", 0, -1)  // 按分数升序取成员
```

按下标区间返回成员（`0` 开始，`-1` 末尾）。  
需要分数时用 `rangeWithScores`；倒序用 `reverseRange` / `reverseRangeWithScores`。

**incrementScore**

```java
opsForZSet().incrementScore(String key, Object value, double delta)
redisTemplate.opsForZSet().incrementScore("rank:hot", "goods_1001", 100)  // 分数自增
```

对成员分数进行累加，常用于排行榜更新、热度统计。

**score / rank / reverseRank**

```java
opsForZSet().score(String key, Object value)
redisTemplate.opsForZSet().score("rank:hot", "goods_1001")  // 查询成员分数
```

获取成员分数与排名（`rank` 升序名次，`reverseRank` 倒序名次）。

**remove**

```java
opsForZSet().remove(String key, Object... values)
redisTemplate.opsForZSet().remove("rank:hot", "goods_2001")  // 移除成员
```

删除一个或多个成员。

## 通用操作（配合模板本身）

**expire / ttl**

```java
xxxTemplate.expire(String key, Duration timeout)
stringRedisTemplate.expire("login:captcha:188****1234", Duration.ofSeconds(60))  // 过期
```

设置过期时间；TTL 需用底层连接或命令接口（或在命令行查看）。

**delete / hasKey**

```java
xxxTemplate.delete(String key)
xxxTemplate.hasKey(String key)
```

删除/判断 key 是否存在（底层对 DEL/EXISTS 的封装）。
