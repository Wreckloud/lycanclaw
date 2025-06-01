---
title: 成长-个人博客搭建记录
tags:
  - 攻略
  - 网站
  - hexo
categories:
  - 啸月嗷声-成长
excerpt: '这是我的第一篇博客文章! 介绍了github+hexo网页部署,以及Redefine主题配置指南.'
thumbnail: /img/文章封面/Wolf.png
published: true
date: 2023-09-17 13:50:59
---

# 安装 Hexo

## 安装 git 和 node.js

由于 Hexo 是基于 Node.js 驱动的一款博客框架, 所以安装 NodeJS.

[下载 node.js](https://nodejs.org/en/)

为了能把 hexo 部署到 github 仓库, 还需要安装 git.

[下载 git](https://git-scm.com/downloads)

安装之后可以输入以下命令查看是否安装成功:

```bash
git --version
node -v
npm -v
```

> npm（Node Package Manager, Node 包管理器）是 Node.js 的默认包管理工具.

![](../../../img/文章资源/hello-websites/file-20241225135656753.jpg)

## 安装 hexo

环境准备好了就可使用 npm 开始安装 Hexo 了, 在命令行输入执行如下命令:

```bash
npm install -g hexo-cli
```

可能会出现下载缓慢的情况, 可以尝试使用国内镜像源.  
[如何更改 npm 源?](../../_posts/Node-js的安装和配置.md)

待到安装完成后, 在一处新建文件夹作为博客的根目录.  
 然后进入这个文件夹并右键空白处, 选择 "Open git bash here" 打开 git 命令行, 接着依次输入以下命令:

```bash
hexo init Blog # 创建新的 Hexo 博客项目, 文件夹名为 Blog.
cd Blog # 进入博客目录.
npm install # 安装 Hexo 所需的依赖包.
```

这样就完成了 Hexo 的安装, 并创建了一个新的博客项目.
运行以下命令启动本地服务器:

```bash
hexo server
```

启动本地服务器后, 就可访问 http://localhost:4000 看到博客效果.

# 更换主题

Hexo 官方主题站点: [https://hexo.io/themes/](https://hexo.io/themes/)  
(可能需要科学上网)

这里推荐我使用的主题 Redefine, 它很简洁, 功能也很强大.

[Redefine 官方 GitHub 页](https://github.com/EvanNotFound/hexo-theme-redefine)  
[Redefine 主题配置指南](https://redefine-docs.ohevan.com/)

将下载的主题文件夹放到**博客根目录**下的 `themes` 文件夹下, 并修改**根目录**下博客配置文件 `_config.yml` 中的 `theme` 选项为 `主题文件夹名称`.

![](../../../img/文章资源/hello-websites/file-20241225135707412.jpg)

此外, 在 `_config.yml` 还有许多其他配置选项, 如网站标题, 网站描述等.  
都可以根据自己的喜好进行修改.

可以随时运行以下命令来在本地服务器 (http://localhost:4000) 预览博客效果:

```bash
hexo s
```

# 部署到 GitHub Pages

## 创建 GitHub 仓库

首先, 你需要有一个 GitHub 账号, 并创建一个新的仓库.

点击 Start project 或者下面的 new repository 建立一个新的仓库，注意 Github 仅能使用一个同  
名仓库的代码托管一个静态站点，这里注意仓库名一定要是：
用户名.github.io

## 配置 SSH 密钥

为了能将本地仓库推送到 GitHub 仓库, 需要使用 git 配置 SSH 密钥.  
继续在 git bash 中输入以下命令:

```bash
# 设置 Git 的全局用户名和邮箱.
git config --global user.name "用户名"
git config --global user.email "邮箱地址"

# 生成 SSH 密钥对, 用于连接 GitHub 仓库.
ssh-keygen -t rsa -C '上面的邮箱'
```

接着按照提示, 按三次回车便可在指定的目录下生成 `id_rsa` 和 `id_rsa.pub` 两个文件.

也可以使用 cat 命令查看密钥对内容:

```bash
cat ~/.ssh/id_rsa.pub
```

验证 SSH 密钥是否成功配置:

```bash
ssh -T git@github.com
```

如果出现 `Hi username! You've successfully authenticated, but GitHub does not provide shell access.` 字样, 则说明 SSH 密钥配置成功.

将内容复制到 GitHub 仓库的 SSH and GPG keys 页面,  
依次点击:

> 头像>Settings>SSH and GPG keys>New SSH key

将刚刚的密钥粘贴到 Key 文本框中, 随后点击 Add SSH key 按钮.

## 推送本地仓库到 GitHub

接着回到 博客根目录下的 `_config.yml` 配置文件配置参数.
拉到文件末尾, 填上以下配置.

```yml
deploy:
  type: git
  repo: https://github.com:用户名/用户名.github.io.git
  branch: master
```

例如, 我的 Github 用户名是 Wreckloud, 则配置如下:

![](../../../img/文章资源/hello-websites/file-20241225135716745.jpg)

最后,需要安装 `hexo-deployer-git` 插件, 运行以下命令:

```bash
npm install hexo-deployer-git --save
```

然后, 运行以下命令将本地仓库推送到 GitHub 仓库:

```bash
hexo g    # 先生成
hexo d    # 接着部署到Github上
```

等待部署完成后, 就可以在浏览器中访问 `https://用户名.github.io` 访问你的博客了.

# 写文章并上传

新建文章:

```bash
hexo new "文章标题"
```

生成的文件会在 `source/_posts` 文件夹下.

文章是 Markdown 格式的, 编辑器推荐使用 Visual Studio Code, 它有丰富的插件支持 Markdown 语法高亮和自动补全.

[markdown 语法](https://markdown.com.cn/basic-syntax/)  
[Visual Studio Code 官网](https://code.visualstudio.com/download)

文章保存后, 生成并部署到 Github 上, 我比较常用的命令是:

```bash
hexo g -d # 生成并部署到Github上
```

# 其他配置

## 文章属性自定义

Hexo 官方文档中有关于文章属性的详细介绍, 这里只介绍一些常用的属性:

```yml
title: 文章标题
date: 2023-09-17 13:50:59
tags:
    - "标签1"
    - "标签2"
categories: "分类"
excerpt: "文章摘要"
thumbnail: "文章缩略图"
```

{% notel default 文章属性自定义 %}
**文章时效性**
expires: 2023-08-31 23:59:59
**置顶文章:**  
sticky: 值 (值越大,顶置文章越靠前)
**首页摘要:**  
excerpt: "这是文章摘要"
**文章缩略图:**
thumbnail: "图片链接"
**文章头图:**  
banner: "图片链接"
cover: "图片链接"
{% endnotel %}

### 文章模块

此外,主题作者还加入了一些方便的模块让笔记更好看

例如 提示块, 选项卡等.
具体查看官网说明: [redefine 写作模块](https://redefine-docs.ohevan.com/zh/modules/notes)

方便自己随取随用的版本: [[常用物件存放处]]

## hexo 快速指令

1. 创建一篇文章

```bash
$ hexo new "My New Post"
```

2. 运行网页

```bash
$ hexo server
# 可以简写为
$ hexo s
```

3. 修改网页内容后重新生成网页

```bash
$ hexo g
```

4. 部署到 github 的仓库

```bash
$ hexo d
```

[关于 hexo 的更多信息](https://hexo.io/)  
 [关于 hexo+github 仓库搭建博客](https://moren5483.github.io/2022/07/17/github/)

> 希望能在这里留下一些有意思的东西!
