---
title: Linux 输入输出重定向
date: 2026-05-26 17:38:46
description: 这是一篇新文章!
order: 0
publish: true
tags:
  - Linux
  - Shell
  - 命令行
---

当我们在终端里执行一个命令时，程序通常会默认连接三个通道：

- `0` `stdin` 标准输入：程序从哪里读东西，默认是键盘
- `1` `stdout` 标准输出：程序把正常结果写到哪里，默认是终端屏幕
- `2` `stderr` 标准错误：程序把错误信息写到哪里，默认也是终端屏幕

比如执行：

```bash
echo hello
```

`echo` 会把 `hello` 显示在终端上。这里的终端屏幕，就是标准输出。

再比如执行：

```bash
mysql -uroot -p123456 wolf_blog
```

进入 MySQL 客户端后，你手动输入 SQL：

```sql
SELECT * FROM user_account;
```

这时候 MySQL 客户端就是从键盘读取内容。键盘输入，就是它的标准输入。

所以默认情况下，程序的输入输出大概是这样：

```text
键盘输入 → 程序 → 终端显示
```

而所谓“重定向”，就是把这条默认路线改掉。

## `<`：输入重定向

`<` 表示输入重定向。

它的作用是：**不让程序从键盘读取输入，而是从文件读取输入。**

例如：

```bash
mysql -uroot -p123456 wolf_blog < test.sql
```

这条命令的意思是：把 `test.sql` 文件里的内容交给 MySQL 客户端执行。原本 MySQL 会等你在键盘上输入 SQL，现在它直接从 `test.sql` 里读取 SQL。

可以这样理解：

```text
普通输入：
键盘 → mysql

输入重定向：
test.sql → mysql
```

所以 SQL 文件导入经常会这样写：

```bash
mysql -uroot -p123456 wolf_blog < test.sql
```

这里要注意一点：`< test.sql` 不是 MySQL 自己处理的，而是当前 shell 处理的。

shell 会先打开当前环境下的 `test.sql` 文件，然后把它接到前面命令的标准输入上。MySQL 并不关心输入来自键盘还是文件，它只知道自己从标准输入里读到了 SQL 内容。

这也是 Docker 导入 SQL 时经常写成这样的原因：

```bash
docker exec -i mysql mysql -uroot -p123456 wolf_blog < test.sql
```

这条命令如果是在宿主机终端执行，那么 `< test.sql` 就是由宿主机 shell 处理的。它找的是宿主机当前目录下的 `test.sql`，不是容器里的文件。

这句话很关键：

```text
重定向由当前 shell 处理，文件属于当前 shell 所在的环境。
```

## `>`：输出重定向

`>` 表示输出重定向。

它的作用是：**不把正常输出显示在终端上，而是写入文件。**

例如：

```bash
echo hello > a.txt
```

执行后，终端上不会显示 `hello`，而是会把 `hello` 写入 `a.txt`。

如果 `a.txt` 不存在，会创建这个文件；如果已经存在，会覆盖原来的内容。

比如：

```bash
echo wolf > name.txt
echo cloud > name.txt
```

最后 `name.txt` 里只会剩下：

```text
cloud
```

因为第二次 `>` 覆盖了第一次的内容。

数据库导出时也经常用 `>`：

```bash
mysqldump -uroot -p123456 wolf_blog > backup.sql
```

这条命令的意思是：把 `mysqldump` 生成的 SQL 内容写入 `backup.sql` 文件。

所以导入和导出刚好是一对反方向的操作：

```bash
mysql -uroot -p123456 wolf_blog < backup.sql
```

这是导入，把文件内容交给 MySQL 执行。

```bash
mysqldump -uroot -p123456 wolf_blog > backup.sql
```

这是导出，把命令输出写成 SQL 文件。

可以简单记成：

```text
<    从文件读进来
>    向文件写出去
```

## `>>`：追加输出

`>>` 也是输出重定向，但它不会覆盖文件，而是追加到文件末尾。

例如：

```bash
echo wolf >> name.txt
echo cloud >> name.txt
```

最后 `name.txt` 里会有：

```text
wolf
cloud
```

所以 `>` 和 `>>` 的区别很简单：

```text
>     覆盖写入
>>    追加写入
```

日志记录里经常使用 `>>`，因为日志通常不希望每次都覆盖旧内容。

比如：

```bash
date >> run.log
```

每执行一次，就会把当前时间追加到 `run.log` 文件末尾。

## `2>`：错误输出重定向

前面提到，程序有两种输出：

```text
1    stdout    标准输出，正常结果
2    stderr    标准错误，错误信息
```

默认情况下，它们都会显示在终端上，所以很多时候我们感觉不到区别。

但实际上，正常输出和错误输出是两条不同的通道。

`>` 默认重定向的是标准输出，也就是编号 `1`。

所以：

```bash
command > out.log
```

其实等价于：

```bash
command 1> out.log
```

如果想把错误信息单独写入文件，就要用 `2>`：

```bash
mysql -uroot -p123456 wolf_blog < test.sql > import.log 2> error.log
```

这条命令的意思是：

```text
正常输出写入 import.log
错误输出写入 error.log
```

这样导入大 SQL 时，如果失败了，错误信息会单独保存在 `error.log` 里，更方便排查。

如果只想记录错误，也可以写：

```bash
mysql -uroot -p123456 wolf_blog < test.sql 2> error.log
```

这时正常输出仍然显示在终端，错误输出会写入 `error.log`。

## `2>&1`：合并正常输出和错误输出

有时候不想分两个文件，只想把正常输出和错误输出都写进同一个日志文件。

这时可以写：

```bash
mysql -uroot -p123456 wolf_blog < test.sql > import.log 2>&1
```

这里的 `2>&1` 意思是：把标准错误 `2` 重定向到标准输出 `1` 当前指向的位置。

前面已经写了：

```bash
> import.log
```

这表示标准输出已经写到 `import.log` 里了。

后面的：

```bash
2>&1
```

表示错误输出也跟着写到标准输出所在的位置，也就是 `import.log`。

所以整条命令的效果是：

```text
正常输出 → import.log
错误输出 → import.log
```

这个写法顺序很重要。常用写法是：

```bash
command > log.txt 2>&1
```

意思是先把标准输出指向 `log.txt`，再把标准错误也指向标准输出当前所在的位置。

先记住这个常用格式就够了：

```bash
命令 > 日志文件 2>&1
```

它表示：正常输出和错误输出都写进同一个日志文件。

## `|`：管道

管道符 `|` 的作用是：**把前一个命令的标准输出，交给后一个命令当标准输入。**

例如：

```bash
cat test.sql | mysql -uroot -p123456 wolf_blog
```

这条命令的过程是：

```text
cat test.sql 输出文件内容
        ↓
通过管道 |
        ↓
mysql 把这些内容当作输入执行
```

所以它也能导入 SQL。

不过，如果只是单纯把一个文件交给命令执行，更推荐使用输入重定向：

```bash
mysql -uroot -p123456 wolf_blog < test.sql
```

因为没有必要先 `cat` 一次。

管道更适合多个命令组合处理。

比如查看日志时：

```bash
cat app.log | grep ERROR
```

意思是把 `app.log` 的内容交给 `grep`，过滤出包含 `ERROR` 的行。

如果继续统计错误行数，可以写：

```bash
cat app.log | grep ERROR | wc -l
```

这条命令的过程是：

```text
读取 app.log
        ↓
过滤包含 ERROR 的行
        ↓
统计行数
```

也就是统计日志里有多少行错误信息。

## 重定向和管道的区别

重定向和管道都和输入输出有关，但它们解决的问题不同。

重定向主要处理命令和文件之间的关系：

```text
命令 ↔ 文件
```

管道主要处理命令和命令之间的关系：

```text
命令 ↔ 命令
```

例如：

```bash
mysql -uroot -p123456 wolf_blog < test.sql
```

这是把文件内容作为命令输入。

```bash
mysqldump -uroot -p123456 wolf_blog > backup.sql
```

这是把命令输出写入文件。

```bash
cat app.log | grep ERROR
```

这是把一个命令的输出交给另一个命令。

所以可以简单记成：

```text
重定向：改变命令从哪里读、往哪里写
管道：把一个命令的输出交给另一个命令
```

## 常用场景

导入 SQL：

```bash
mysql -uroot -p123456 wolf_blog < test.sql
```

导出数据库：

```bash
mysqldump -uroot -p123456 wolf_blog > backup.sql
```

追加日志：

```bash
echo "start import" >> import.log
```

只保存错误信息：

```bash
mysql -uroot -p123456 wolf_blog < test.sql 2> error.log
```

正常输出和错误输出都保存：

```bash
mysql -uroot -p123456 wolf_blog < test.sql > import.log 2>&1
```

过滤日志：

```bash
cat app.log | grep ERROR
```
