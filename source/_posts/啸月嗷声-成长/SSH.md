---
title: SSH
date: 2025-05-31 09:39:31
published: false
tags:
categories: 
excerpt: "这是一篇新文章!"
thumbnail: "/img/文章封面/defaultcover.jpg"
---

# 🛠️ SSH 使用要点笔记（适用于 GitHub）

## 🔑 1. 什么是 SSH？

- SSH（Secure Shell）是一种**加密通信协议**
- 用于**安全登录远程服务器或代码托管平台（如 GitHub）**
- **作用：免密登录、安全通信、身份验证**

---

## 🧬 2. SSH 密钥对构成

- 一对钥匙：**私钥（private key）+ 公钥（public key）**
  - 私钥保存在本地：`~/.ssh/id_ed25519`
  - 公钥上传到 GitHub：`~/.ssh/id_ed25519.pub`

---

## 🛠️ 3. 常用 SSH 命令

### ✅ 生成新密钥

```bash
ssh-keygen -t ed25519 -C "你的邮箱"
```

连续按回车即可。

### 📋 查看公钥内容（复制上传用）

```bash
cat ~/.ssh/id_ed25519.pub
```

### 🧪 测试连接 GitHub

```bash
ssh -T git@github.com
```

正常提示如下：

```bash
Hi Wreckloud! You've successfully authenticated...
```

---

## 🖥️ 4. 多设备 / 换电脑怎么办？

- 新设备需要**重新生成 SSH 密钥**
- 或者**复制原来的私钥（谨慎！）**
- 每台设备都要将其公钥添加到 GitHub（一个账号支持多个）

---

## 📂 5. SSH 配置文件（推荐！）

路径：`~/.ssh/config`，示例内容：

```bash
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519
```

好处：

- 免得你手动指定 key，方便切换多个 GitHub 账号或多把钥匙

---

## ⚠️ 6. 注意事项

- **私钥千万不能泄露！**（别传网盘、别 QQ 微信发）
- GitHub 只识别**你添加的公钥**
- 每次 push 时，Git 会用私钥签名 → GitHub 用你上传的公钥验证身份

---

## 🧠 总结一句话：

> SSH 就是一把**数字钥匙**，私钥在你手里，公钥交给 GitHub，验证你是谁，帮你**安全免密地提交代码**。
