---
title: Docker
date: 2026-05-12 20:17:08
description: 这是一篇新文章!
order: 0
publish: true
tags:
---

写项目时，代码能跑起来只是第一步，真正麻烦的往往是部署。

Docker 主要解决的就是这类环境问题。它可以把程序运行需要的环境整理成一套相对独立的东西，让项目换到别的机器上时，也能尽量保持一致的运行方式。
想要理解 Docker，先抓住三个概念就够了：

- **容器** ：可以理解成一个轻量的运行空间。比如一个 MySQL 容器里就跑着 MySQL，一个 Redis 容器里就跑着 Redis。

- **镜像**：是创建容器的模板。比如有了 MySQL 镜像，就可以根据它启动出一个 MySQL 容器。

- **镜像仓库** ：就是存放镜像的地方。Docker 官方的镜像仓库是 Docker Hub，里面可以找到 MySQL、Redis、Nginx 等常见软件的官方镜像。

镜像用来创建容器，容器用来运行服务，镜像仓库用来保存和下载镜像。

# 使用 Docker 部署 MySQL

在开始操作之前，有一点需要先强调：学习 Docker 部署，最好直接使用 Linux 环境。
Docker 本身是更偏向 Linux 下的容器化技术。在 Windows 或 macOS 上使用 Docker 时，底层通常也要借助 Linux 虚拟化环境来运行。为了减少这些额外干扰，后面的示例统一以 Linux 虚拟机 为环境进行演示。

Docker 的安装方式可以参考官方文档。学习阶段也可以使用 [get.docker.com](get.docker.com) 提供的安装脚本快速安装：

```bash
curl -fsSL https://get.docker.com | bash
```

安装完成后，启动 Docker：

```bash
systemctl start docker
```

设置 Docker 开机自启：

```bash
systemctl enable docker
```

可以通过下面的命令检查 Docker 是否安装成功：

```bash
docker -v
```

如果虚拟机里原本已经安装了 MySQL，需要先停掉原来的 MySQL 服务，避免占用 `3306` 端口。然后执行下面的命令，就可以通过 Docker 启动一个 MySQL 容器：

```bash
docker run -d \
  --name mysql \
  -p 3306:3306 \
  -e TZ=Asia/Shanghai \
  -e MYSQL_ROOT_PASSWORD=123456 \
  mysql:8.0
```

这条命令会做几件事：从镜像启动一个 MySQL 容器，把容器的 `3306` 端口映射到虚拟机的 `3306` 端口，并设置 MySQL 的 root 密码。

如果本地没有 `mysql:8.0` 镜像，Docker 会自动从镜像仓库下载。也可以先手动拉取镜像：

```bash
docker pull mysql:8.0
```

如果服务器不能联网，也可以提前准备好镜像文件，再通过离线方式导入：

```bash
docker load -i mysql.tar
```

启动完成后，可以查看正在运行的容器：

```bash
docker ps
```

如果能看到名为 `mysql` 的容器，并且状态为 `Up`，就说明 MySQL 已经通过 Docker 跑起来了。

如果连接不上 MySQL，还要检查服务器防火墙是否放行了 `3306` 端口。学习环境中也可以临时关闭防火墙：

```bash
systemctl stop firewalld
```

如果希望重启后防火墙也不自动启动：

```bash
systemctl disable firewalld
```

不过关闭防火墙只适合本地虚拟机或学习环境。真正的服务器更推荐开放指定端口，而不是直接把防火墙关掉。

到这里，先通过部署 MySQL 感受一下 Docker 的使用方式：原本需要手动安装和配置的服务，现在可以通过一条 `docker run` 命令启动起来。

接下来会把刚刚用到的这些 Docker 指令拆开说明，包括镜像下载、容器创建、端口映射、环境变量设置和容器查看等内容。先知道它们大概在做什么就行。

# 常用命令

前面通过 `docker run` 快速启动了一个 MySQL 容器，但这条命令背后其实涉及镜像下载、容器创建、端口映射、环境变量配置等多个动作。

接下来就把常用命令拆开看。先从镜像下载开始。

## docker pull

`docker pull` 用来从镜像仓库中下载镜像。

比如下载 MySQL 8.0 镜像，可以执行：

```bash
docker pull mysql:8.0
```

这里的 `mysql:8.0` 表示镜像名称和版本号，其中 `mysql` 是镜像名，`8.0` 是镜像标签，也就是常说的 tag。

如果不写版本号，Docker 默认会拉取 `latest` 标签：

```bash
docker pull mysql
```

它等价于：

```bash
docker pull mysql:latest
```

不过实际使用时，通常更推荐写清楚版本号。好处是版本更明确，后面重新部署时也更容易保持一致。否则直接使用 `latest`，可能会因为镜像版本变化导致环境不稳定。

MySQL 这类常见镜像可以在 [Docker Hub](https://hub.docker.com/) 上找到。Docker Hub 是 Docker 官方提供的镜像仓库，里面有很多常用软件的官方镜像，比如 MySQL、Redis、Nginx、OpenJDK 等。

另外，镜像名称还有一些省略规则。比如：

```bash
docker pull mysql:8.0
```

完整写法其实可以理解为：

```bash
docker pull docker.io/library/mysql:8.0
```

其中：

- `docker.io` 表示默认使用 Docker Hub。
- `library` 表示官方镜像所在的默认命名空间。
- `mysql` 是镜像名称。
- `8.0` 是镜像标签。

所以我们平时拉取官方镜像时，一般直接写：

```bash
docker pull mysql:8.0
```

就够了。

在国内网络环境下，使用 `docker pull` 时可能会遇到下载很慢、连接超时、拉取失败等问题。比较常见的处理方式是给 Docker 配置镜像加速地址，也就是让 Docker 优先从镜像站拉取内容。

Docker 官方文档也说明，Linux 常规安装下 Docker 守护进程的配置文件一般位于 `/etc/docker/daemon.json`，可以通过这个 JSON 配置文件集中管理 Docker daemon 的配置。([Docker Documentation][1])

可以编辑这个文件：

```bash
vi /etc/docker/daemon.json
```

写入类似配置：

```json
{
  "registry-mirrors": [
    "https://你的镜像站地址"
  ]
}
```

保存后重新加载配置，并重启 Docker：

```bash
systemctl daemon-reload
systemctl restart docker
```

镜像站地址也可能会失效，不同网络环境下可用情况也不一样。

国内 Docker Hub 镜像源近几年变化比较频繁，有些旧的加速地址已经不能稳定使用，所以笔记里不建议死记某一个固定地址。遇到拉取失败时，再根据当前可用的镜像站进行替换。([比邻][2])

### docker images

镜像下载完成后，可以使用下面的命令查看本机已有镜像：

```bash
docker images
```

### docker rmi

如果某个镜像不再需要，可以通过 `docker rmi` 删除：

```bash
docker rmi mysql:8.0
```

也可以根据镜像 ID 删除：

```bash
docker rmi 镜像ID
```

[1]: https://docs.docker.com/engine/daemon/?utm_source=chatgpt.com "Docker daemon configuration overview"
[2]: https://eastondev.com/blog/en/posts/dev/20251217-docker-mirror-guide-2025/?utm_source=chatgpt.com "Best Docker Registry Mirror China 2026: Fix Pull Timeout in 5 ..."

## docker run

`docker run` 用来**根据镜像创建并运行容器**。

```bash
docker run mysql:8.0
```

这条命令表示使用 `mysql:8.0` 这个镜像创建并启动一个容器。先看一个更简单的例子，这里可以换成 Nginx：

```bash
docker run nginx
```

执行后，Docker 会基于 `nginx` 镜像启动一个容器。
如果本机没有这个镜像，Docker 会先自动从镜像仓库中拉取镜像，然后再创建并运行容器。

也就是说，下面两步：

```bash
docker pull nginx
docker run nginx
```

在很多情况下可以简化成一步：

```bash
docker run nginx
```

如果镜像不存在，Docker 会自动下载；如果镜像已经存在，就会直接使用本地镜像创建容器。

### -d 容器后台运行

不过，直接执行 `docker run nginx` 时，会发现一个问题：**当前控制台被容器占用了**。

这时控制台会一直显示容器运行过程中的输出，不能继续输入其他命令。对于数据库、Nginx 这类长期运行的服务来说，这显然不太方便。

所以实际使用时，通常会加上 `-d` 参数：

```bash
docker run -d nginx
```

`-d` 是 `detach` 的意思，表示让容器在后台运行。
这样启动容器后，控制台不会被阻塞，可以继续执行其他命令。相应地，容器后续产生的日志也不会直接打印在当前控制台中。

### docker ps

容器启动后，可以使用 `docker ps` 查看正在运行的容器：

```bash
docker ps
```

有些 Linux 环境中，如果当前用户没有直接操作 Docker 的权限，需要在前面加上 `sudo`：

```bash
sudo docker ps
```

执行后大概会看到类似结果：

```bash
CONTAINER ID   IMAGE     COMMAND                  CREATED          STATUS          PORTS     NAMES
a1b2c3d4e5f6   nginx     "/docker-entrypoint.…"   10 seconds ago   Up 9 seconds    80/tcp    bold_wolf
```

| 字段           | 说明                                                         |
| -------------- | ------------------------------------------------------------ |
| `CONTAINER ID` | 容器 ID，可以用来操作这个容器。                              |
| `IMAGE`        | 该容器使用的镜像。                                           |
| `COMMAND`      | 容器启动时执行的命令，初学阶段不用太细看。                   |
| `CREATED`      | 容器创建时间。                                               |
| `STATUS`       | 容器当前状态，例如 `Up` 表示正在运行。                       |
| `PORTS`        | 容器暴露或映射的端口。                                       |
| `NAMES`        | 容器名称。默认情况下 Docker 会随机生成，后面也可以手动指定。 |

至此 `docker run` 最基本的理解就是：

```bash
docker run 镜像名
```

它会根据指定镜像创建并运行一个新的容器。
如果镜像不存在，Docker 会先尝试自动拉取镜像；如果镜像已经存在，就直接使用本地镜像。

#### -p 端口映射

前面虽然已经通过 `docker run -d nginx` 启动了一个 Nginx 容器，但这时直接访问宿主机的端口，不一定能访问到容器里的 Nginx 服务。

因为默认情况下，容器网络和宿主机网络是隔离的。
Nginx 在容器内部监听的是 `80` 端口，但宿主机并不会自动把自己的 `80` 端口转发给这个容器。

这时就需要使用 `-p` 参数进行端口映射：

```bash id="tjfoww"
docker run -d -p 80:80 nginx
```

`-p` 用来把宿主机端口和容器端口绑定起来，基本格式是：

```bash id="t13uq9"
-p 宿主机端口:容器内端口
```

注意顺序是 **先外后内**。
前面的端口是宿主机端口，也就是外部访问时使用的端口；后面的端口是容器内部服务实际监听的端口。

所以这条命令表示把宿主机的 `80` 端口映射到容器内部的 `80` 端口。这样访问宿主机的 `80` 端口时，请求就会被转发到 Nginx 容器中。

如果不想占用宿主机的 `80` 端口，也可以换成其他端口，比如：

```bash id="2x3wr8"
docker run -d -p 8080:80 nginx
```

这表示把宿主机的 `8080` 端口映射到容器内部的 `80` 端口。
此时访问宿主机的 `8080` 端口，实际访问到的就是容器里的 Nginx 服务。

也就是：

```bash id="16pwfo"
访问宿主机 8080 端口 → 转发到容器内部 80 端口
```

所以，`-p` 的作用就是给容器里的服务开一个“外部入口”。
容器内部服务监听哪个端口，就把宿主机的某个端口映射到它上面。这样宿主机或外部机器才能正常访问容器中的服务。

#### -v 挂载卷

除了端口映射，`docker run` 中还有一个很重要的参数是 `-v`。

`-v` 用来把宿主机中的目录或 Docker 管理的存储卷，挂载到容器内部。这样容器内产生的数据就可以保存到容器外部，避免容器删除后数据一起丢失。

例如 MySQL 容器中的数据默认保存在容器内部。如果没有挂载卷，删除容器后，这些数据也会跟着消失。为了让数据持久化保存，可以把 MySQL 的数据目录挂载出来。

`-v` 的基本格式是：

```bash id="h0d9ir"
-v 宿主机目录:容器内目录
```

例如：

```bash id="klb2rq"
docker run -d \
  --name mysql \
  -p 3306:3306 \
  -v /data/mysql:/var/lib/mysql \
  -e MYSQL_ROOT_PASSWORD=123456 \
  mysql:8.0
```

这条命令中：

```bash id="zi5y89"
-v /data/mysql:/var/lib/mysql
```

表示把宿主机的 `/data/mysql` 目录挂载到容器内部的 `/var/lib/mysql` 目录。MySQL 写入的数据，最终会保存在宿主机的 `/data/mysql` 中。

这种直接指定宿主机目录的方式，叫做**绑定挂载**。

除了绑定挂载，也可以使用 Docker 自己管理的存储卷，也就是 **volume**：

```bash id="4z4c4g"
-v mysql-data:/var/lib/mysql
```

例如：

```bash id="94rzc5"
docker run -d \
  --name mysql \
  -p 3306:3306 \
  -v mysql-data:/var/lib/mysql \
  -e MYSQL_ROOT_PASSWORD=123456 \
  mysql:8.0
```

这里的 `mysql-data` 不是宿主机上的具体路径，而是 Docker 创建并管理的一个命名卷。
这种方式叫做**命名卷挂载**。

两种方式可以简单这样区分：

| 挂载方式   | 写法                       | 说明                     |
| ---------- | -------------------------- | ------------------------ |
| 绑定挂载   | `-v 宿主机目录:容器内目录` | 明确指定宿主机中的目录。 |
| 命名卷挂载 | `-v 卷名:容器内目录`       | 由 Docker 管理存储位置。 |

如果想查看当前已有的 volume，可以使用：

```bash id="5pjad1"
docker volume list
```

删除指定 volume：

```bash id="83kag5"
docker volume rm mysql-data
```

`rm` 也可以写成完整形式：

```bash id="gu6aja"
docker volume remove mysql-data
```

如果想清理没有被容器使用的 volume，可以使用：

```bash id="65y5fq"
docker volume prune -a
```

不过清理 volume 前要确认里面没有需要保留的数据。对于 MySQL 这类服务，卷里往往保存着数据库文件，别手快乱删。

#### -e 环境变量

`-e` 用来给容器传递环境变量。

有些镜像在启动时需要通过环境变量完成初始化配置。比如 MySQL 容器启动时，就可以通过 `MYSQL_ROOT_PASSWORD` 设置 root 用户密码：

```bash id="0s6ke4"
docker run -d \
  --name mysql \
  -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=123456 \
  mysql:8.0
```

这里的：

```bash id="6c7haj"
-e MYSQL_ROOT_PASSWORD=123456
```

就是把 `MYSQL_ROOT_PASSWORD` 这个环境变量传给容器。MySQL 镜像启动时会读取它，并用它设置 root 密码。

#### --name 指定容器名称

`--name` 用来给容器指定名称。

如果不写 `--name`，Docker 会自动生成一个随机名称。虽然也能用，但不方便记。

例如：

```bash id="8b9cuo"
docker run -d --name mysql mysql:8.0
```

这样创建出来的容器名称就是 `mysql`。

后面使用 `docker ps` 查看容器时，可以在 `NAMES` 字段中看到这个名字。操作容器时，容器名和容器 ID 都可以使用：

```bash id="80okqb"
docker stop mysql
docker start mysql
```

相比容器 ID，名字的可读性更高，实际使用时也更方便。

#### -it 交互式运行容器

`-it` 通常用于让控制台进入容器，获得一个可交互的命令环境。

它一般会和 `--rm` 一起使用：

```bash id="vq7my3"
docker run -it --rm ubuntu bash
```

这里的：

```bash id="bkagez"
-it
```

表示以交互方式运行容器。

```bash id="84qzjt"
--rm
```

表示容器停止后自动删除。

这类命令一般用于临时测试、临时进入某个 Linux 环境，或者快速验证一些命令。因为加了 `--rm`，容器退出后会自动清理，不会留下没用的容器。

#### --restart 重启策略

`--restart` 用来配置容器的重启策略。

比如希望容器异常停止后自动重启，可以写：

```bash id="w7h4sh"
docker run -d \
  --name nginx \
  --restart always \
  nginx
```

常见参数可以简单记这几个：

| 参数             | 说明                         |
| ---------------- | ---------------------------- |
| `no`             | 默认值，不自动重启容器。     |
| `always`         | 容器停止后总是自动重启。     |
| `unless-stopped` | 除非手动停止，否则自动重启。 |
| `on-failure`     | 只有容器异常退出时才重启。   |

对于 MySQL、Redis、Nginx 这类长期运行的服务，比较常见的是：

```bash id="9u9eyv"
--restart always
```

或者：

```bash id="ulsz14"
--restart unless-stopped
```

### 容器启停

启动已经存在的容器：

```bash id="vthrv2"
docker start 容器ID或容器名
```

停止正在运行的容器：

```bash id="ubxxan"
docker stop 容器ID或容器名
```

例如：

```bash id="mpdkts"
docker stop mysql
docker start mysql
```

如果想查看正在运行的容器：

```bash id="5dh0ts"
docker ps
```

如果想查看所有容器，包括已经停止的容器：

```bash id="v55m6y"
docker ps -a
```

正常使用 `docker start` 和 `docker stop` 启停容器时，之前配置好的端口映射、挂载卷、环境变量等信息不会丢失。它们属于这个容器的创建配置，会跟着容器保存下来。

### 查看容器详细信息

如果忘记某个容器当初配置了哪些端口映射、挂载卷或环境变量，可以使用 `docker inspect` 查看详细信息：

```bash id="b2eau3"
docker inspect 容器ID或容器名
```

例如：

```bash id="uv5ukf"
docker inspect mysql
```

这个命令返回的内容很多，里面会包含容器的网络、端口、挂载卷、环境变量等详细配置。

### 创建但不立即运行容器

`docker create` 和 `docker run` 很像，都可以根据镜像创建容器。

区别是：`docker create` 只创建容器，不会立即启动。

```bash id="wjp39r"
docker create --name nginx nginx
```

创建后如果想运行它，再使用：

```bash id="da6d9k"
docker start nginx
```

而 `docker run` 可以理解成：

```bash id="cfc97j"
docker create + docker start
```

也就是创建并启动。

### 查看容器日志

容器在后台运行后，日志不会直接打印在当前控制台。
如果想查看容器日志，可以使用：

```bash id="vdjeao"
docker logs 容器ID或容器名
```

例如：

```bash id="fq6s50"
docker logs mysql
```

如果想持续查看日志变化，可以加上 `-f`：

```bash id="wvih3w"
docker logs -f mysql
```

这里的 `-f` 表示持续跟随日志输出，适合排查服务启动失败、运行报错等问题。

### 删除容器

如果某个容器不再需要，可以使用 `docker rm` 删除：

```bash id="8wixg0"
docker rm 容器ID或容器名
```

例如：

```bash id="3nngyn"
docker rm mysql
```

如果容器还在运行，直接删除会失败。
这时可以先停止容器：

```bash id="msnztm"
docker stop mysql
docker rm mysql
```

也可以使用 `-f` 强制删除：

```bash id="c0amct"
docker rm -f mysql
```

这里要注意区分：

```bash id="eh5jn9"
docker rm
```

删除的是容器。

```bash id="mb4d65"
docker rmi
```

删除的是镜像。

容器是由镜像创建出来的运行实例，二者不是一个东西。

### 进入容器执行命令

每个容器看起来都像一个相对独立的运行环境。
如果想在容器内部执行 Linux 命令，可以使用 `docker exec`。

比如查看容器内部的进程：

```bash id="y9bqio"
docker exec mysql ps -ef
```

如果想进入正在运行的容器内部，获得一个交互式命令环境，可以使用：

```bash id="04794u"
docker exec -it mysql bash
```

有些精简镜像里可能没有 `bash`，这时可以尝试使用 `sh`：

```bash id="bp2ty9"
docker exec -it mysql sh
```

进入容器后，就可以像在 Linux 终端里一样执行命令。

比如查看容器内的系统版本信息：

```bash id="vqhwz1"
cat /etc/os-release
```

如果不想进入容器，也可以直接执行：

```bash id="8qsc66"
docker exec mysql cat /etc/os-release
```

`docker exec` 适合临时查看容器内部状态、排查问题，或者执行少量维护命令。真正长期运行的服务配置，还是应该尽量写在 `docker run` 参数、挂载文件或后续的 Docker Compose 配置中。
