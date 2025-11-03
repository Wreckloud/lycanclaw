---
title: '未命名'
date: '2025-11-02 10:49:56'
description: '这是一篇新文章!'
order: 0
publish: true
tags: 
---

# 反向代理

在实际开发中，前端项目与后端服务往往运行在不同端口：

- 前端：`localhost:80`（Nginx）
- 后端：`localhost:8080`（Spring Boot）

这时，前端直接请求后端接口会遇到跨域问题。  
反向代理（Reverse Proxy） 的作用，就是让 Nginx 作为中间层，接收前端请求后**转发给后端**，让前端只与 Nginx 打交道。

反向代理还能：

- **解决跨域**  
   浏览器只看到 `localhost:80`，但 Nginx 实际帮我们转发到 `localhost:8080`。
- **统一入口**  
   所有请求都先经过 Nginx，可以在这里加鉴权、缓存、限流等功能。
- **隐藏后端地址**  
   外部访问不到真实服务端口，提升安全性。

目标：  
前端发出

```
http://localhost/api/employee/login
```

→ 由 Nginx 转发到

```
http://localhost:8080/admin/employee/login
```

## 配置文件

Nginx 的主配置文件通常位于：

- Windows 安装版：`nginx/conf/nginx.conf`
- Linux 一般位于：`/etc/nginx/nginx.conf` 或 `conf.d/*.conf`

我们可以在主配置文件中直接添加，也可以在 `conf.d` 目录下新建一个独立文件（例如 `wolf.conf`）。

```nginx
# nginx.conf（或 conf.d/wolf.conf）
server {
    listen       80;
    server_name  localhost;

    # 把 /api/ 开头的请求转发到后端 8080，并替换前缀为 /admin/
    location /api/ {
        proxy_pass http://localhost:8080/admin/;
        # 可选配置
        # proxy_set_header X-Real-IP $remote_addr;
        # proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

这行是关键：

```
location /api/ { proxy_pass http://localhost:8080/admin/; }
```

意思是：

任何以 `/api/` 开头的请求，Nginx 都会把 `/api/` 换成 `/admin/`，再转发到 8080 端口。

例如

| 前端访问（进入 Nginx） | 实际转发（到后端）      |
| ---------------------- | ----------------------- |
| `/api/employee/login`  | `/admin/employee/login` |

把 `/api/` 切掉，换成 `/admin/`，其余部分原样保留。Nginx 的 `proxy_pass` 在结尾带不带 `/`，行为完全不同。

推荐写法：结尾都有斜杠

```nginx
location /api/ {
    proxy_pass http://localhost:8080/admin/;
}
```

- 替换规则：用 `/admin/` 替换 `/api/`
- 实际效果：`/api/employee/login` → `/admin/employee/login`

错误写法：proxy_pass 没有斜杠

```nginx
location /api/ {
    proxy_pass http://localhost:8080/admin;
}
```

- 拼接规则：原路径直接拼在 `/admin` 后面
- 实际效果：`/api/employee/login` → `/admin/api/employee/login`（多了 `/api`）

因此，最安全的习惯是：**`location` 与 `proxy_pass` 两边都带斜杠。**

# 负载均衡

在生产环境里，一台后端服务器往往扛不住大量请求。这时候我们会部署**多台后端实例**（比如两台 Spring Boot 服务），让它们分摊压力。  
Nginx 就是前面的“调度者”，决定每个请求要交给哪一台后端。

只要后端有多台机器，就用 `upstream` 把它们定义成一个“后端组”，然后在 `proxy_pass` 里使用组名即可：

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

Nginx 提供多种调度策略，最常用的就是**轮询、权重、ip_hash**。

| 策略名称         | 含义                                   | 使用场景             |
| ---------------- | -------------------------------------- | -------------------- |
| **轮询（默认）** | 每个请求依次分配到各个服务器，平均分配 | 最常见，默认方式     |
| **weight 权重**  | 通过 `weight` 设置不同机器分配比例     | 一台机器性能更强时用 |
| **ip_hash**      | 根据客户端 IP 固定分配后端             | 需要保持用户会话时用 |
| **least_conn**   | 优先分配给当前连接最少的机器           | 连接数不均时效果好   |
| **url_hash**     | 相同 URL 总是发到同一台机器            | 用于缓存类项目       |
| **fair**         | 响应快的机器优先                       | 第三方模块，了解即可 |

### 轮询（默认）

Nginx 默认使用轮询调度，不写策略时自动启用。

```nginx
upstream wolf_backends {
    server 192.168.100.128:8080;
    server 192.168.100.129:8080;
}
```

分配效果：

```
请求1 → 128
请求2 → 129
请求3 → 128
请求4 → 129
```

就像狼群轮流接单，**最公平也最简单**。

### weight 权重

某些机器更强、CPU 更多，就可以多分一点请求。

```nginx
upstream wolf_backends {
    server 192.168.100.128:8080 weight=3;
    server 192.168.100.129:8080 weight=1;
}
```

分配比例大约是 **3:1**。  
128 比 129 多分配三倍请求，适合资源不均的情况。

### ip_hash

有时候我们希望同一个用户始终访问同一台后端，比如登录状态存在 session 里，这时就用 `ip_hash`。

```nginx
upstream wolf_backends {
    ip_hash;
    server 192.168.100.128:8080;
    server 192.168.100.129:8080;
}
```

这样：

- 用户 A（IP 相同）→ 永远访问 128
- 用户 B → 永远访问 129

可以保证“会话粘性”，防止登录状态丢失。

### least_conn（了解）

当有些连接长时间保持时，用这个策略更公平——谁忙得少就给谁。

```nginx
upstream wolf_backends {
    least_conn;
    server 192.168.100.128:8080;
    server 192.168.100.129:8080;
}
```
