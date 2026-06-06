---
title: 'Spring Task-定时任务'
date: '2025-11-21 14:45:07'
description: '这是一篇新文章!'
order: 0
publish: true
tags:
  - SpringTask
  - 定时任务
  - Spring
---

场景引入和问题引出

比如下单了不支付, 这个商品会被占住, 导致其他用户不能买. 这种商品的还不算严重, 例如高铁 一直占住位置不给钱 一个位置亏损就比较严重了

解决方法是设置一个定时取消

Spring Task 介绍
Spring Task是Spring框架提供的任务调度工具，可以按照约定的时间自动执行某个代码逻辑。
定位：定时任务框架

适合单体项目, 就像一个闹钟

超时订单只是比较常见的,除此之外信用卡银行卡还贷的么个月的呀 只要是需要定时处理的场景都可以使用Spring Task

以上都是引入, 接下来详细介绍

# cron表达式

cron表达式
cron表达式其实就是一个字符串，通过cron表达式可以定义任务触发的时间

构成规则：分为6或7个域，由空格分隔开，每个域代表一个含义
<·
每个域的含义分别为：秒、分钟、小时、日、月、周、年(可选)注意：SpringTask定时任务框架不支持年份字段，只有6个域, 不支持年

只支持这六个yu

列举一些简单常用的通配符号

列入 0 0 9 12 12 ?
12月12日上午9点整对应的cron表达式为：

cron表达式在线生成器：https://cron.qqe2.com/

进阶的表达还是有点复杂了解即可, 



### 入门案例
求说明：
每隔5秒，在idta控制台打印一次日志：【执行定时任务{当前时间}]

Spring Task使用步骤:
（已存在）
①导入maven坐标 spring-context
这个依赖是在springbootstarter下集成的

②启动类上添加注解 @EnableScheduling 开启任务调度③自定义定时任务类，并打上@Component注解
④ 类中定义方法， 方法上加上@Scheduled(cron ="0/5 **** ?")启动项目测试

因此最重要的两个注解就是 @EnableScheduling和@Scheduled