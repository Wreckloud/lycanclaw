---
title: npm开始的JS包管理器
date: 2024-04-29 19:32:23
description: 前端开发环境必备指南：Node.js安装与npm、Yarn、pnpm包管理工具的全面对比与配置
publish: true
tags:
  - npm
  - yarn
  - pnpm
---

# 序

JavaScript 原本只是个运行在浏览器里的脚本语言，直到 Node.js 把它带到了服务器端，才真正让 JS 拥有了构建大型项目的可能。  
但一个现代项目，往往会依赖数十上百个第三方工具和库，它们之间的依赖关系极为复杂，版本、结构、安装顺序稍有差错就可能导致项目崩溃。

**手动下载解压？维护一堆文件夹？——根本不现实。**

于是，为了让开发者专注于写代码而不是折腾依赖，一个“自动化模块管理工具”就诞生了：包管理器。

它能做的事包括：

- 统一管理项目依赖（记录版本、来源）
- 自动下载安装依赖，解决嵌套依赖问题
- 保证跨平台/多人协作时的依赖一致性
- 支持发布/共享自定义模块到社区生态

如果你今天创建一个前端项目，却没有包管理器的协助，那就像是赤手空拳盖高楼。

# npm-包管理的起点

随着 Node.js 的流行，npm（Node Package Manager）在 2010 年应运而生，并作为其官方包管理器被推出，它理所当然地成为了 Node.js 生态的核心基石。

它的三大核心功能包括：

- 安装和卸载依赖
- 统一管理项目依赖关系
- 从 npm Registry 获取社区包

几乎每一个现代 JavaScript 项目中你见到的包，无论是 `axios`、`vue`、还是 `eslint`，本质上都来自 npm 提供的这一生态系统。

npm 通过一个结构清晰的机制来完成依赖管理：

- **`package.json`**：声明当前项目依赖了什么、用什么脚本启动、作者是谁…
- **`package-lock.json`**：锁定具体依赖版本，保证协作一致性
- **`node_modules/`**：将安装下来的依赖全部放进去，供项目调用

每当你执行 `npm install`，npm 就会：

1. 查阅 `package.json`
2. 下载依赖包（及其依赖的依赖）
3. 写入 `node_modules` 和 `package-lock.json`

## 安装 Node.js 与 npm

npm 是 Node.js 默认的包管理工具 会随 Node.js 一起安装。

1. 访问[Node.js 官网](https://nodejs.org/)
2. 选择适合的版本：

   - LTS 版本：稳定可靠，推荐用于生产环境
   - Current 版本：包含最新特性，可能不够稳定

3. 下载并按照提示完成安装
4. 验证安装是否成功：

```bash
node -v  # 显示Node.js版本
npm -v   # 显示npm版本
```

## 配置 npm

默认情况下，npm 从国外服务器拉包，这对国内网络来说不太友好——懂的都懂。  
除了魔法上网之外，好在国内有稳定的镜像源，比如淘宝源（现在叫 npmmirror），只需一条命令就能提速整个开发体验。

先看看你现在用的是哪家源：

```bash
npm get registry
```

如果还指向官方源，那就切换一下：

```bash
npm config set registry https://registry.npmmirror.com/
```

这条命令会把 npm 的下载地址指向国内镜像，装包会快得多。

## npm 常用指令

### 初始化项目

万事起头难，先从建个配置文件开始。  
执行：

```bash
npm init -y
```

就能一键生成 `package.json`，快速开局。你也可以不用 `-y`，选择手动填写作者、版本、描述等信息，适合正式项目。

### 安装依赖

npm 的核心命令就是装包，记住这几个就够用了：

- **普通依赖**（项目运行时需要的）：

```bash
npm install axios
```

- **开发依赖**（开发时需要，运行时不需要）：

```bash
npm install webpack --save-dev
```

简写就是 `-D`，这个大家用得很多。

- **安装所有依赖**（比如你拉了个别人的项目）：

```bash
npm install
```

会根据 `package.json` 自动下载全部依赖。

- **全局安装**（命令行工具专用，比如 nodemon、vite 等）：

```bash
npm install nodemon -g
```

### 卸载依赖

不需要的包就别留着吃灰了，删掉：

- 删除本地依赖：

  ```bash
  npm uninstall axios
  ```

- 删除全局依赖：

  ```bash
  npm uninstall nodemon -g
  ```

这两个其实就是 `install` 的反向命令，习惯性写成 `rm` 也可以：`npm rm express`。

### 执行脚本

项目里常见的一些命令，比如启动开发环境、打包发布，没必要每次手敲。  
你可以把它们写进 `package.json` 的 `scripts` 字段里，

比如默认配置了这样一条：

```json
"scripts": {
  "dev": "vite"
}
```

然后就能直接执行：

```bash
npm run dev
```

你也可以用其他名字，比如 `start`，那就执行 `npm run start`。  
后期还可以写多个指令拼接，比如用 `&&` 执行一连串操作。

### 查看依赖

项目跑出问题了？不确定装了哪个包？用 `ls`：

```bash
npm list --depth=0
```

默认会把所有子依赖列出来，很乱，带上 `--depth=0` 只看顶层依赖就清爽多了。

### 更新依赖

想升级包但又不想破坏版本兼容？这时候就要用更新命令：

- 自动更新到兼容范围内的最新版本：
  ```bash
  npm update lodash
  ```
- 直接上最新版（小心破坏兼容）：
  ```bash
  npm install express@latest
  ```

以上这几组命令，是使用 npm 避不开的核心指令集。不需要一口气记住全部，但只要理解它们之间的“装—卸—跑—管”的逻辑关系，操作自然就顺手了。

随着项目变得庞大、依赖树变得复杂，npm 在安装速度、依赖结构、锁文件一致性等方面暴露出了明显短板：安装慢、生成大量冗余依赖、在不同机器上容易出现“我的装得和你不一样”的情况。
尽管 npm 在之后不断改进，推出了缓存机制和 `npm ci` 这类优化命令，但还是无法从根本上解决这些痛点。正是在这种背景下，Yarn 和 pnpm 这样的替代品开始崭露头角。

# yarn-优化工具

2016 年，Facebook 内部工程师们终于受够了 npm 安装慢、版本不一致等问题，决定自研一个更可靠、更快的包管理器——Yarn 就此诞生。
它在发布初期就迅速引起了 JavaScript 社区的关注，并成为许多大型项目的默认工具。

Yarn 的设计初衷是：**“让依赖安装变得快速、确定、可重复。”**

为此它带来了几项关键优化：

- **离线缓存机制**：装过的包会被缓存下来，下一次就不需要联网下载，提升了速度；
- **更可靠的锁定文件（`yarn.lock`）**：确保不同人安装出来的依赖版本完全一致；
- **更扁平的依赖结构**：尽量把所有依赖都安装在项目根目录，避免深层嵌套导致的“地狱结构”。

虽然 Yarn 相比 npm 提供了不少优势，但也有一些不可忽视的遗留问题：

- **依赖仍是扁平结构**：所有包统一堆在根目录的 `node_modules/` 中，容易冲突、冗余。
- **磁盘占用高**：缓存机制虽加快了安装速度，但缓存 + 扁平结构导致重复存储，占用空间严重。
- **缓存不易清理**：即便清除缓存或锁文件，有时依然会遇到依赖错乱的问题。

## 安装 yarn

### 安装 Yarn（通过 npm）

```bash
npm install -g yarn
```

安装完后，检查版本确认成功：

```bash
yarn --version
```

### 设置全局路径

为避免全局包混乱，手动指定 Yarn 的全局安装路径。这样能保证你的包安装在固定位置，便于管理：

```bash
yarn config set global-folder "%LOCALAPPDATA%\Yarn\Data\global"
yarn config set prefix "%LOCALAPPDATA%\Yarn"
```

> 注意：这只影响 Yarn 的全局包路径，不影响项目中的依赖安装。

### 配置国内镜像

如果已经全局设置过 npm 镜像，那么 Yarn 和 pnpm 一般会跟着走，不设置也能用；
以防万一，在此留下指定镜像的路径：

```bash
yarn config set registry https://registry.npmmirror.com/
```

安装完 Yarn 后，建议 先配置路径和镜像源，避免后续出现莫名其妙的全局包丢失或下载超时问题。

## yarn 常用指令

对开发者来说，Yarn 是一个比 npm 更快、更稳定的升级版本，基本可以直接替代 npm 使用。  
Yarn 提供了类似 npm 的命令结构，因此 只需将 `npm` 替换成 `yarn`，就能实现无痛上手：

| 功能     | npm 命令              | Yarn 命令           |
| -------- | --------------------- | ------------------- |
| 运行脚本 | `npm run dev`         | `npm run dev`       |
| 安装依赖 | `npm install`         | `yarn install`      |
| 添加依赖 | `npm install axios`   | `yarn add axios`    |
| 移除依赖 | `npm uninstall axios` | `yarn remove axios` |

> `yarn dev` 省略了 `run`，更简洁。

总的来说，Yarn 曾是 JavaScript 包管理的“黄金标准”，但随着项目规模膨胀，尤其是 **monorepo（单仓多包）** 模式流行，依赖管理愈发复杂，Yarn 的架构已难以胜任更高效的场景。
正是在这个时候，pnpm 出场了。

# pnpm-逻辑革新

pnpm 并没有在 npm 或 Yarn 的旧有逻辑上打补丁，而是从根本上改写了包管理的底层思路。

它采用了一种更“极端”的依赖安装方式：  
**不复制、不平铺、只链接。**

pnpm 会将所有依赖包下载后统一存入一个全局缓存目录，并通过 **硬链接** 的方式，把它们“指向”各个项目的 `node_modules/`。也就是说：  
多个项目如果依赖同一个包，它们用的其实是同一个文件，只是硬链接到各自目录中而已。

优势很直接：

- **更省空间**：共用缓存，不像 Yarn 每项目复制一份。
- **更快安装**：已有依赖秒链接，连下载都省了。

pnpm 抛弃了 Yarn 的扁平依赖，改用**严格隔离**：  
你只能访问自己声明的依赖，其他的用不了，错了就报错。彻底杜绝“幽灵依赖”。

为此，它构建了一个**符号链接组成的虚拟 node_modules**，既隔离模块，又兼容 Node.js 的加载逻辑。

> 总结一句：**共享速度，隔离干净，结构精准。**

在 monorepo 项目下，它比谁都快，谁都稳，谁都干净。

## 安装与配置 pnpm

### 安装 pnpm（通过 npm）

```bash
npm install -g pnpm
```

安装完成后，检查版本以确认成功：

```bash
pnpm --version
```

### 配置国内镜像源

pnpm 也是 默认读取 `.npmrc` 的 registry 配置，也就是说如果已经全局设置过 `npm config set registry`，那么 它们都会跟着用；

同样留一个以防万一的指令：

```bash
pnpm config set registry https://registry.npmmirror.com/
```

### 设置本地存储路径

默认情况下，pnpm 会将依赖集中缓存到用户目录。你也可以手动指定缓存路径，便于统一管理：

```bash
pnpm config set store-dir D:\.pnpm-store
```

> 注意：这不是安装目录，而是依赖缓存位置，pnpm 通过软链接机制高效共享依赖。

## pnpm 常用指令

pnpm 的命令结构**兼容 npm，但使用体验更接近 Yarn**。  
你几乎可以无脑把原来的 `npm` 命令替换为 `pnpm` 来用，且获得更快、更稳的表现：

| 功能     | npm 命令              | pnpm 命令           |
| -------- | --------------------- | ------------------- |
| 安装依赖 | `npm install`         | `pnpm install`      |
| 添加依赖 | `npm install axios`   | `pnpm add axios`    |
| 移除依赖 | `npm uninstall axios` | `pnpm remove axios` |

> 和 Yarn 一样，`pnpm dev`、`pnpm build` 等脚本命令可以省略 `run`，更简洁。

总之，**pnpm 保留了 npm 的学习成本，又继承了 Yarn 的好习惯**，还能做到两者都做不到的依赖结构优化。

# 末

到这里，JavaScript 包管理器的发展脉络就比较清晰了：
npm 是生态奠基者，胜在稳健、兼容性好；
Yarn 是阶段性救火队员，修补了早期 npm 的一些痛点；
pnpm 则是重新思考后的结构重建，用更极致的方式解决了空间冗余、依赖污染等底层问题。

那么在实际项目中该怎么选？

小项目或脚本，npm 完全够用；想提速、省空间、跨包管理，首选 pnpm；团队协作别忘了锁版本统一，防止环境不一致坑死你。

不管选择哪一套方案，选得合适、用得清楚，才是构建稳定工程的关键。
