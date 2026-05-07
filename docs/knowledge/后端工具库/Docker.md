介绍docker是啥

没docker前是怎么样的简述, 有的docker, 解决了什么问题. 
不过要简述, 这里只是引入.

什么是容器
什么是镜像

镜像仓库, 介绍官方的镜像仓库


# 部署 MySQL

docker通常是基于Linux的容器化技术(说人话)
, 在macos或者windows上, 都是虚拟了一个linux子系统, 总之是想说最好的时间方式还是用linux

具体的安装步骤, 来自get.docer.com可以找得到

(代码块以及描述, 展示正确的安装)

这下面是我之前残留的笔记, 不知道有没有用, 你看着筛选重组吧, 注意主线就行

关闭防火墙的指令`是啥 ` 
为什么要关闭防火墙, 关闭记得重启

先停掉虚拟机中的MySQL，确保你的虚拟机已经安装Docker，且网络开通的情况下，执行下面命令即可安装MySQL
docker run -d \-name mysql \-p 3306:3306 1
-e TZ=Asia/Shanghai \
-e MYSQL_R00T_PASSWORD=123 \mysql

两种方式下载

自动从网络下载

离线安装
docker load 

# 常用命令

下面就是介绍几个重要的命令

### docker pull

用来从仓库中下载镜像

(展示一个完整的真实的可运行的命令)

也是要文字介绍一下, 把官方的链接, 可以省略不写的规则也说清楚

还有一个问题要说明, 在国内环境难免会遇到网络问题, 帮我把问题和用镜像站解决也说明

引出与docker pull 有关的两个
docker images

docker rmi (名字或id)

### docker run ()

同样的介绍

sudo docker ps

但发现问题, 会阻塞控制台
通用的方式加个-d (解释清楚)
后续日志不会打印控制台了

再介绍一点, 其实实际使用中可以直接使用docker run , 镜像不存在会自动拉取, 然后再运行

再介绍一个 -p 