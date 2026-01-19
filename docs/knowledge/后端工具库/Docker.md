介绍docker是啥

没docker前是怎么样的简述, 有的docker, 解决了什么问题. 

# 部署 MySQL

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

