---
title: '未命名'
date: '2025-11-02 10:49:56'
description: '这是一篇新文章!'
order: 0
publish: true
tags: 
---

# 反向代理怎么把前端 URL 拼到后端

## 场景设定（狼群任务系统）

- **前端访问入口**（Nginx 80 端口）：  
   `http://localhost/api/…`
- **后端服务**（Spring Boot 在 8080 端口，带统一前缀 `/admin`）：  
   `http://localhost:8080/admin/…`

目标：  
前端发 `http://localhost/api/employee/login`  
→ Nginx 转发到 `http://localhost:8080/admin/employee/login`

## 关键配置（就看这一段）

```nginx
# nginx.conf（或 conf.d/wolf.conf）
server {
    listen       80;
    server_name  localhost;

    # 把 /api/ 开头的请求转发给后端 8080，并把前缀换成 /admin/
    location /api/ {
        proxy_pass http://localhost:8080/admin/;
        # 可选：真实IP/头部、超时等按需加
        # proxy_set_header X-Real-IP $remote_addr;
        # proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

**这行最重要：**

```
location /api/ { proxy_pass http://localhost:8080/admin/; }
```

它的含义是——**把命中的 `/api/…` 这一段换成 `/admin/…`，然后转发给 8080**。

### 映射举例（直观对照表）

| 前端请求（进入 Nginx） | Nginx 转发到后端（8080） |
| ---------------------- | ------------------------ |
| `/api/employee/login`  | `/admin/employee/login`  |
| `/api/missions/1024`   | `/admin/missions/1024`   |
| `/api/upload/file`     | `/admin/upload/file`     |

拼接规则就这么简单：**把 `/api/` 切掉、换成 `/admin/`，其他路径原样跟在后面。**

---

## 为什么要“斜杠”对齐（最容易出错的地方）

Nginx 的 `proxy_pass` 在**有无结尾斜杠**时，行为不一样：

1. 有结尾斜杠（**推荐**）

```nginx
location /api/ {
    proxy_pass http://localhost:8080/admin/;  # 有 /
}
```

- 规则：用 `/admin/` **替换** `/api/` 前缀
- 结果：`/api/employee/login` → `/admin/employee/login` ✓

2. 没结尾斜杠

```nginx
location /api/ {
    proxy_pass http://localhost:8080/admin;   # 没 /
}
```

- 规则：把**整个原始 URI 直接拼到** `/admin` 后面
- 结果：`/api/employee/login` → `/admin/api/employee/login`（多了 `/api`，错！）

> 结论：**location 和 proxy_pass 两边的斜杠保持对称**，绝大多数场景用“都有斜杠”的写法就不会错。

---

## 如何快速验证（两种方法）

1. **curl 本机验证**

```bash
# 前端入口
curl -i http://localhost/api/employee/login
# 看后端日志是否收到了 /admin/employee/login
```

2. **后端日志观察**  
   在后端 `Controller` 打印 `request.getRequestURI()`，确认确实命中了 `/admin/employee/login`。

---

## 负载均衡时的写法（思路不变）

多台后端时，把目标地址换成 upstream 名称即可，**路径替换规则完全一样**：

```nginx
upstream wolf_backends {
    server 192.168.100.128:8080;
    server 192.168.100.129:8080;
    # 可选策略：
    # ip_hash;         # 同一IP落同一机器
    # least_conn;      # 优先分给连接数少的
    # server ... weight=2; # 权重
}

server {
    listen 80;
    server_name localhost;

    location /api/ {
        proxy_pass http://wolf_backends/admin/;  # 仍然保留末尾 /
    }
}
```

---

## 常见坑与排查顺序

1. **路径多了 `/api`**：多半是 `proxy_pass` 少了尾部 `/`。
2. **404**：后端根本没有这个 `/admin/...` 路由；或后端有**应用上下文**（比如 `/wolf-app`），Nginx 也要一起补上：

   ```nginx
   proxy_pass http://localhost:8080/wolf-app/admin/;
   ```

3. **跨域或被拦截**：看后端是否加了权限过滤、CORS 配置；Nginx 也可统一加跨域头部（按需）。
4. **文件/静态资源也被代理了**：给静态资源单独 `location`，或仅让 `/api/` 走代理，静态交给前端容器/静态目录。

---

## 完整最小示例（可直接用）

**后端**（Spring Boot，示意）：

```java
@RestController
@RequestMapping("/admin/employee")
public class EmployeeController {
    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody LoginDTO dto) {
        return Map.of("code", 0, "msg", "ok", "data", Map.of("token", "wolf-token"));
    }
}
```

**Nginx**：

```nginx
server {
    listen 80;
    server_name localhost;

    location /api/ {
        proxy_pass http://localhost:8080/admin/;  # 斜杠对齐
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

**前端调用**：  
`POST http://localhost/api/employee/login` → 成功代理到后端 `POST /admin/employee/login`。

---

记住一句话就够了：  
**看 location，换前缀；看 proxy_pass，定后缀；两边斜杠要对齐。**  
会读这行配置，你就能看懂任何项目的“前端 URL 是怎么拼到后端”的。

如果打开别人的项目

前端发送的请求，是如何请求到后端服务的？
前端请求地址：http://localhost/api/employee/login
后端接口地址：http://localhost:8080/admin/employee/login

nginx 反向代理，就是将前端发送的动态请求由 nginx 转发到后端服务器

是什么

```
# 反向代理，处理管理端发送的请求
location /api/
proxy_passhttp://localhost:8080/admin/;
`#proxy_passhttp://webservers/admin/;
```

会发现 nginx 里写的配置如下

用例子具体说明怎么拼接的
后端环境搭建－前后端联调
nginx 反向代理的配置方式：
server
listen 80;
server_namelocalhost;
location//api/{
proxy_passhttp://localhost:8080/admin/;#反向代理
nginx.conf

后端环境搭建－前后端联调
nginx 负载均衡的配置方式：
upstream webservers{
server 192.168.100.128:8080;
server 192.168.100.129:8080;
server
listen 80;
server_namelocalhost;
location/api/{
proxy_passhttp://webservers/admin/;#负载均衡

nginx 反向代理的好处
提高访问速度
进行负载均衡
保证后端服务安全, 前端用户不知道后端服务 ip

所谓负载均衡，就是把大量的请求按照我们指定
的方式均衡的分配给集群中的每台服务器

nginx 负载均衡策略：
名称说明
轮询默认方式
weight 权重方式，默认为 1，权重越高，被分配的客户端请求就越多
ip_hash 依据 ip 分配方式，这样每个访客可以固定访问一个后端服务
least_conn 依据最少连接方式，把请求优先分配给连接数少的后端服务

用的最多的就是前面三个

url_hash 依据 url 分配方式，这样相同的 url 会被分配到同一个后端服务
fair 依据响应时间方式，响应时间短的服务将会被优先分配
