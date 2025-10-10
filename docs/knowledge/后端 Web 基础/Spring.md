---
title: '未命名 1'
date: '2025-09-25 09:10:12'
description: '这是一篇新文章!'
order: 0
publish: true
tags: 
---
新增员工
员工基本信息（表：emp）
员工工作经历信息（表：emp_expr）
ControllerServiceMapper
SQL:
1.接收请求参数（员工信息）1.保存员工基本信息1.insert into emp(.
2.调用service方法values (...);
2.批量保存员工的工作经insert into
3.响应结果历信息emp_expr
values(.)，（...)；


步骤：
1．完成准备工作，引入实体类EmpExpr及对应的Mapper接口、XML映射文件，及接收请求参数的实体类
2.保存员工的基本信息
3．批量保存员工的工作经历信息

(我不想写详细步骤了)
保存员工基本信息
···EmpControllerEmp5erviceImpl
@PostMappingpublic void save(Emp emp）{
public Result save(@RequestBody Emp emp){//1.补全基础属性
log.info("请求参数emp:{}"，emp）;emp.setCreateTime(LocalDateTime.now ));
empService save(emp);emp.setUpdateTime(LocalDateTime.now();
return Result.success();//2.保存员工基本信息
empMapper.insert(emp);
EmpMapper
@Options(useGeneratedKeys = true，keyProperty ="id"）//主键返回
@Insert("insert into emp(username, name, gender, phone, job, salary, image, entry_date, dept_id, create_time, update_time)
values （#{username},#{name},#{gender},#{phone},#{job},#{salary},#{image},#{entryDate},#{deptId},#{createTime},#{updateTime}）")
void insert(Emp emp);

这里有一个需要注意的
我们id一般都是设置为null, 让其能够自动增长. 
但是这里我们还需要提前知道id,因为待会需要拿到这个id来获取这个对象的经历.

这里介绍@Options

在mapper层设置
@Options(useGeneratedKeys = true,keyProperty
@Insert（"insert into emp values （null,#{username},#{password},#{e},#{gender}
"#{entryDate},#{deptId},#{createTime},#{updateTime})")
void insert(Emp emp);

就能在sever的实现类
Integer id = emp.getId();
中拿到了


3．批量保存员工的工作经历信息

批量保存员工工作经历
工作经历+绿加工作经历List<EmpExpr>动态SQL：<foreach>
删球
时间 2021-11-06至2022-11-05删除insert into emp_expr(...）values (?,?,？,?,?)，(?,?,?,?,?)，,(?,?,?,？,？)
EmpExprMapper . java
public void insertBatch(List<EmpExpr> exprList);

<foreach>属性说明：
1.collection:集合名称
2.item：集合遍历出来的元素/项
3.separator：每一次遍历使用的分隔符
4.open：遍历开始前拼接的片段
5.close：遍历结束后拼接的片段