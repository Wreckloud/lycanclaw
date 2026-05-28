---
title: 数据库导入大批量数据
date: 2026-05-26 14:38:27
description: 这是一篇新文章!
order: 0
publish: true
tags:
---

在开发过程中，初始化数据库、导入测试数据、恢复备份时，经常会遇到导入 `.sql` 文件的情况。导入方式可以根据文件的大小灵活变通，能节省不少时间。

小文件图省事，大文件走命令行；本地 MySQL 直接导入，Docker 里的 MySQL 通过容器执行导入。

# 小型 SQL

如果 SQL 文件内容不多，比如只是几张表结构、少量初始化数据，直接使用 IDE 或数据库 GUI 工具执行就可以。

一般来说，几 KB 到几 MB 的 SQL 文件都可以这样处理。只要 GUI 工具打开不卡、复制粘贴不会丢内容，就没必要搞得太复杂。怎么方便怎么来。

# 中大型 SQL

当 SQL 文件已经比较大，比如十几 MB、几十 MB，或者包含大量建表语句和初始化数据时，更推荐让 MySQL 客户端直接读取 SQL 文件执行。

## 本地导入

本地 MySQL 常见写法如下：

```bash
mysql -uroot -p密码 数据库名 < test.sql
```

这里的 `<` 是重定向，意思是把 `test.sql` 文件里的内容交给 `mysql` 客户端执行。

需要注意，`-p` 和密码之间不能有空格，例如：

```bash
mysql -uroot -p123456 wolf_blog < test.sql
```

如果不想把密码直接写在命令里，也可以只写 `-p`，然后根据提示输入密码：

```bash
mysql -uroot -p wolf_blog < test.sql
```

执行后终端会提示输入密码，这种方式更安全一些，也避免命令历史里留下明文密码。

如果 SQL 文件不在当前目录，需要写完整路径：

```bash
mysql -uroot -p wolf_blog < /root/sql/test.sql
```

Windows 下也可以使用路径，只是要注意路径格式为：`D:\sql\test.sql` 如果路径里有空格，最好加引号。

## Docker 环境

如果 MySQL 是运行在 Docker 容器里的，不一定要先进入容器。更常用的方式是：在宿主机执行命令，把宿主机上的 SQL 文件通过标准输入传给容器里的 mysql 客户端。

例如容器名叫 `mysql`：

```bash
docker exec -i mysql mysql -uroot -p密码 数据库名 < test.sql
```

比如：

```bash
docker exec -i mysql mysql -uroot -p123456 wolf_blog < test.sql
```

这条命令可以拆成三部分看。

`docker exec -i mysql` 表示让 Docker 在名为 `mysql` 的容器里执行命令。其中 `-i` 的作用是保持标准输入可用，这样宿主机传进来的内容才能继续交给容器里的进程。

`mysql -uroot -p123456 wolf_blog` 是在容器内部执行的 MySQL 客户端命令，意思是使用 root 用户连接 `wolf_blog` 这个数据库。

最后的 `< test.sql` 是输入重定向，由宿主机 shell 处理。平时程序默认从键盘读取输入，这个输入来源叫标准输入，也就是 `stdin`。使用 `< test.sql` 后，输入来源就不再是键盘，而是宿主机当前目录下的 `test.sql` 文件。

所以这条命令真正的执行过程可以理解成：

```
宿主机上的 test.sql
        ↓
宿主机 shell 通过 < 做输入重定向
        ↓
docker exec -i 把标准输入传进容器
        ↓
容器内的 mysql 客户端读取并执行 SQL
```

`test.sql` 文件可以放在宿主机当前目录下，不需要先复制进容器。容器里的 MySQL 客户端只是从标准输入里读到了 SQL 内容，它并不需要直接访问宿主机上的这个文件。

这种方式很适合 Docker 环境，也比较干净。因为容器和宿主机确实是相对隔离的文件系统，如果你先进容器再执行：

```bash
docker exec -it mysql bash
```

然后在容器里写：

```bash
mysql -uroot -p123456 wolf_blog < test.sql
```

那容器内部必须真的存在 `test.sql` 这个文件。否则 MySQL 找不到它。
这时你还得先把 SQL 文件复制进容器：

```bash
docker cp test.sql mysql:/tmp/test.sql
```

然后进入容器执行：

```bash
mysql -uroot -p123456 wolf_blog < /tmp/test.sql
```

多了一步复制文件的操作，维护起来更麻烦。开发和部署里，通常更推荐直接在宿主机执行 `docker exec -i ... < xxx.sql`。

## 大型 SQL

当 SQL 文件很大时，比如几十 MB 到几百 MB，甚至更大，就不能只想着“能不能执行”，还要考虑执行过程是否可控。

命令行重定向仍然是常用方式：

```bash
mysql -uroot -p 数据库名 < test.sql
```

例如：

```bash
mysql -uroot -p wolf_blog < test.sql
```

或者 Docker 环境下：

```bash
docker exec -i mysql mysql -uroot -p密码 数据库名 < test.sql
```

例如：

```bash
docker exec -i mysql mysql -uroot -p123456 wolf_blog < test.sql
```

不过大文件导入时，如果直接在普通终端里执行，一旦 SSH 断开、终端关闭，导入可能会中断。所以在服务器上执行大文件导入时，最好配合 `screen`、`tmux` 这类工具，保证任务不会因为连接断开而直接死掉。

还有一种写法是进入 MySQL 客户端后使用 `source`：

```sql
source /root/sql/test.sql;
```

或者：

```sql
\. /root/sql/test.sql
```

`source` 的作用是让 MySQL 客户端读取指定 SQL 文件并执行。它不是 SQL 标准语句，而是 MySQL 客户端提供的命令。

这个方式适合你已经进入 MySQL 客户端，想手动执行某个 SQL 文件的场景。例如：

```bash
mysql -uroot -p wolf_blog
```

进入后执行：

```sql
source /root/sql/test.sql;
```

但要注意，`source` 读取的是 **MySQL 客户端所在环境能访问到的文件路径**。

如果你是在宿主机上运行 mysql 客户端，那么路径就是宿主机路径。

如果你是进入 Docker 容器内部后运行 mysql 客户端，那么路径就是容器内部路径。宿主机上的 `test.sql` 不会自动出现在容器里。

所以在 Docker 场景下，`source` 并不一定比重定向方便。多数情况下，还是这条更直接：

```bash
docker exec -i mysql mysql -uroot -p123456 wolf_blog < test.sql
```

## 导入优化

如果 SQL 文件很大，导入慢、失败、卡住，通常不是单纯换一条命令就能解决的。更重要的是 SQL 文件本身的组织方式和数据库约束。

导入大量数据前，可以临时关闭外键检查：

```sql
SET foreign_key_checks = 0;
```

导入完成后再开启：

```sql
SET foreign_key_checks = 1;
```

这样可以减少导入过程中反复检查外键带来的开销。但这有一个前提：你要确认导入的数据本身是完整的，不能因为关闭外键检查就把脏数据塞进去。否则后面排错会像在黑森林里找一根掉毛，费劲得很。

如果 SQL 文件特别大，也可以拆成多个文件。比较常见的拆分方式是：

```text
01_schema.sql      表结构
02_base_data.sql   基础字典数据、初始化配置
03_mock_data.sql   开发或测试用数据
04_index.sql       索引、约束、补充结构
```

这样拆分后，执行顺序更清楚，也方便定位问题。比如表结构没问题，但测试数据导入失败，就不需要从头重跑全部脚本。

如果是大量 `INSERT` 语句，也可以尽量使用批量插入，而不是一条数据一条 `INSERT`。

不太推荐的写法：

```sql
INSERT INTO user_account (id, username) VALUES (1, 'wolf');
INSERT INTO user_account (id, username) VALUES (2, 'cloud');
INSERT INTO user_account (id, username) VALUES (3, 'rain');
```

更推荐的写法：

```sql
INSERT INTO user_account (id, username) VALUES
(1, 'wolf'),
(2, 'cloud'),
(3, 'rain');
```

批量插入可以减少 SQL 解析和提交次数，导入大量数据时会明显更快。

不过单条 SQL 也不能无限大。如果一次插入的数据特别多，可能会碰到 `max_allowed_packet` 限制。这时就需要按合适的批次拆分，比如每几百条或几千条合并成一条 `INSERT`。

# Docker 自动初始化 SQL

MySQL 官方镜像支持在容器第一次启动时自动执行初始化脚本。只要把 `.sql` 文件挂载到容器的这个目录：

```text
/docker-entrypoint-initdb.d
```

容器初始化数据库时，就会自动执行里面的 SQL 文件。

例如：

```bash
docker run -d \
  --name mysql \
  -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=123456 \
  -e MYSQL_DATABASE=wolf_blog \
  -v /root/mysql/init:/docker-entrypoint-initdb.d \
  mysql:8
```

如果宿主机 `/root/mysql/init` 目录下有：

```text
01_schema.sql
02_data.sql
```

MySQL 容器第一次创建数据目录时，会按文件名顺序执行这些脚本。

这个方式很适合项目初始化，比如部署环境第一次启动时自动建库、建表、导入基础数据。

但这里有一个很重要的坑：**这些初始化脚本只会在 MySQL 数据目录为空、容器第一次初始化时执行。**

如果容器之前已经启动过，数据目录里已经有数据库文件，那么你后来再往 `/docker-entrypoint-initdb.d` 里放 SQL 文件，也不会自动执行。

这种情况下，如果想重新触发初始化，通常需要删除旧容器和旧数据卷，再重新创建。比如开发环境里可以这样处理：

```bash
docker rm -f mysql
docker volume rm mysql_data
```

或者如果你使用的是绑定挂载，就需要清理对应的数据目录。

但生产环境不要随便删数据卷。那不是初始化，那是把数据库一爪子拍没了。
