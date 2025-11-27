---
title: 'MyBatis Plus'
date: '2025-11-24 20:31:26'
description: '这是一篇新文章!'
order: 0
publish: true
tags: 
---
MyBatisPlus（简称 MP）是一个 MyBatis 的增强工具，在 MyBatis 的基础上只做增强不做改变，为简化开发、提高效率而生。

Mybatis持久层框架XML映射文件或注解编写SQL语句查询结果与对象自动映射存储过程以及高级映射
MybatisPlus不影响原有Mybatis所有功能提供单表的CRUD操作代码生成器分页插件

使用方法

引I入MybatisPlus的起步依赖
MyBatisPlus官方提供了starter，其中集成了Mybatis和MybatisPlus的所有功能，并且实现了自动装配效果。
因此我们可以用MybatisPlus的starter代替Mybatis的starter:

```<!--MybatisPlus--><dependency>
<groupId>com.baomidou</groupId>
<artifactId>mybatis-plus-boot-starter</artifactId><version>3.5.3.2</version>
</dependency>
```

定义Mapper
自定义的Mapper继承MybatisPlus提供的BaseMapper接口:
```
public interface UserMapper extends BaseMapper<User> {
```
常见注解
MyBatisPlus通过扫描实体类，并基于反射获取实体类信息作为数据库表信息。

类名驼峰转下划线作为表名
名为id的字段作为主键
变量名驼峰转下划线作为表的字段名

以上是一些默认的规则, 如果遇到不一样的情况也有解决方法

MybatisPlus中比较常用的几个注解如下：
’@TableName：用来指定表名

因为数据库中的对象不仅仅只有表, view
table
dict
procedure
function
在命名时, 习惯这样:
fun._
tb_-
...

例如
@TableName ("tb_user")public class User {


·@Tableld：用来指定表中的主键字段信息·

@TableId( value="id", type= IdType,AUTo )private Long id;

IdType枚举:
AUTO:数据库自增长
INPUT: 通过set方法自行输入
ASSIGN_ID: 分配 ID, 接口IdentifierGenerator的方法nextld来生成 id，默认实现类为DefaultldentifierGenerator雪花算法


@TableField：用来指定表中的普通字段信息

最常用的是不一致

@TableField("username")private String name;@TableField("is_married")private Boolean isMarried;@TableField("^order*")private Integer order;@TableField(exist = false)private String address;
使用@TableField的常见场景：成员变量名与数据库字段名不一致成员变量名以is开头，且是布尔值成员变量名与数据库关键字冲突成员变量不是数据库字段

常见配置
MyBatisPlus的配置项继承了MyBatis原生配置和一些自己特有的配置。例如:

```
mybatis-plus:
type-aliases-package: com.itheima.mp.domain.po # 别名扫描包
mapper-locations: "classpath*:/mapper/**/*.xml" # Mapper.xml 文件地址， 默认值configuration:
map-underscore-to-camel-case：true # 是否开启下划线和驼峰的映射cache-enabled：false # 是否开启二级缓存
global-config:db-config:
id-type：assign_id # id为雪花算法生成
update-strategy：not_null # 更新策略：只更新非空字段
```


yBatisPlus使用的基本流程是什么？①引入起步依赖
②自定义Mapper基于BaseMapper
③在实体类上添加注解声明表信息
④在application.yml中根据需要添加配置

# 核心功能

### 条件构造器

MyBatisPlus支持各种复杂的where条件，可以满足日常开发的所有需求。

![](../../public/images/文章资源/mybatis-plus/file-20251125101133648.jpg)

基于QueryWrapper的查询
需求：
①查询出名字中带o的，存款大于等于1oo0元的人的id、username、info、balance字段

sql select id, username, info, balance from user where username like '%o%' and balance >= 1000
mp是这样的

```
/创建条件构造器
QueryWrapper<User> queryWrapper = new QueryWrapper<>();/ /查询的列
queryWrapper.select( ..columns: "id", "username","info", "balance");//查询条件：名字带^o^的
queryWrapper.like( column: "username", val: "o") ;
//查询条件：存款大于等于1000元
queryWrapper.ge( column: "balance", val: 1000) ;
/ /查询
I
List<User> userList = userMapper.selectList(queryWrapper);//输出
for (User user : userList)
System.out.println (user)
```

②更新用户名为jack的用户的余额为2000

```
User user = new User();
user.setBalance (2000) ;
QueryWrapper<User> queryWrapper = new QueryWrapper<>();queryWrapper.eq( column: "username", val: "jack") ;
userMapper.update (user, queryWrapper) ;
```


基于UpdateWrapper的更新
需求：更新id为1,2,4的用户的余额，扣200
UPDATE user
SET blance = balance - 200
WHERE id in (1, 2, 4)


UpdateWrapper<User> updateWrapper = new UpdateWrapper<>();
//自定义更新的语句，设置的是set
set balance = balance - 200
updateWrapper.setSql( setSql: "balance = balance - 200") ;
/ /id 为^1,2,4^的用户 ---where id in (1,2,4)
updateWrapper.in( column: "id", .values: 1, 2, 4) ;
userMapper.update( entity: null, updateWrapper)

在Java代码中硬编码方式写死了数据库表的字段名，不够灵活优雅；可以代替为：LambdaQueryWrapper和LambdaUpdateWrapper

Lambda

/创建条件构造器
LambdaQueryWrapper<User> lambdaQueryWrapper = new LambdaQueryWrapper<>() ;/ /查询的列
lambdaQueryWrapper.select (User::getId, User::getUsername, User::getInfo, User::getBalance) ;//查询条件：名字带^o^的
lambdaQueryWrapper.like (User::getUsername, val: "o") ;
//查询条件：存款大于等于1000元
lambdaQueryWrapper.ge (User::getBalance, val: 1000) ;
/ /查询
List<User> userList = userMapper.selectList (lambdaQueryWrapper) ;//输出
for (User user : userList) {
System.out.println(user) ;

QueryWrapper和LambdaQueryWrapper通常用来构建select、delete、update的where条件部分
UpdateWrapper和LambdaUpdateWrapper通常只有在set语句比较特殊才使用
尽量使用LambdaQueryWrapper和LambdaUpdateWrapper，避免硬编码


# 自定义sql

前面是写在service层, 不符合规范.

我们可以利用MyBatisPlus的Wrapper来构建复杂的Where条件，然后自己定义SQL语句中剩下的部分。
update id="updateBalanceByIds">
UPDATE user
SET balance = balance - #{amount}
WHERE id IN
<foreach collection="ids" separator="," item="id" open="(" close="")">#{id}
</foreach></update>

由mp构建

们可以利用MyBatisPlus的Wrapper来构建复杂的Where条件，然后自已定义SQL语句中剩下的部分。①基于Wrapper构建where条件
List<Long> ids = List.of(1l, 2l, 4L);int amount = 200;
//1．构建条件
LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<User>() .in(User::getId, ids) ;//2.自定义SQL方法调用
userMapper.updateBalanceByWrapper(wrapper, amount) ;
②在mapper方法参数中用Param注解声明wrapper变量名称，必须是ew；自定义sQL，并使用Wrapper条件或在注解上写与拼接即可
@Update("update user set balance = balance - #{amount} ${ew.customSqlSegment)")
void updateBalanceByWrapper(@Param("amount") int amount, @Param("ew") LambdaQueryWrapper<User> queryWrapper) ;

以当前案例来说，我们可以这样写：
*更新id为1，2，4的用户的余额，扣200*/
@Test
public void testcustomwrapper(){//1、构造更新条件对象
Querywrapper<User> queryWrapper = new Querywrapper<>O);querywrapper.in("id", 1, 2, 4);
//2、更新；调用自定义的更新方法，传入更新数值与查询条件对象userMapper.updateBalanceByWrapper(200, querywrapper) ;
在 UserMapper 中添加如下方法：
@Update("UPDATE user SET balance = balance - #{amount3 ${ew.customSqlSegment}"I
void updateBalanceByWrapper(@Param("amount") int amount, @Param("ew") Querywrapper<User> queryWrapper);
注意：上述的执行语句中 ew 及 customSqlSegment 都不能修改;
1、queryWrapper 查询条件对象相当于对要执行的语句进行了语句的拼接
2、${ew.customSqISegment} 可以使用在注解中，也可以使用在 Mapper.xml文件中进行SQL语句的拼接