NestJS 的核心味道与 Spring Boot 很一致：依赖注入 + 模块化 + Controller/Service 分层。只是语言从 Java 换成 TypeScript，生态从 Maven/Gradle 换成 npm/yarn。

- `@Controller` ≈ `@Controller()`：声明控制器
- `@Service` ≈ `@Injectable()`：声明可注入的服务
- `@Autowired` ≈ 构造器注入：依赖注入方式不同，但思想一致
- `application.yml` ≈ `.env`：配置来源不同，但本质都是“运行时配置”
- Maven 多模块 ≈ Yarn Workspace Monorepo：一个仓库里多个包/应用

## 3）快速启动

先装依赖 → 再 build 内部包 → 再配 env → 再启动

从公司 git 仓库克隆下包后

### 3.1 安装依赖

这一步相当于 Maven 的下载依赖与构建准备。

```bash
cd globox-backend
yarn install
yarn workspace @globox/core build
```

这个项目是 Monorepo，`@globox/core` 类似 Java 多模块里的 `common`。没 build 就等价于：你 `common` 模块没打 jar，业务模块当然引用不到。

## 4）配置环境变量（等价于 Spring Boot 的 application.yml）

创建本地配置文件（不要提交 Git）：

```bash
# Windows PowerShell
copy apps\demo-api\.env.example apps\demo-api\.env

# Mac/Linux
cp apps/demo-api/.env.example apps/demo-api/.env
```

你至少要改这些：

```bash
DB_PASSWORD=你的MySQL密码
DB_DATABASE=globox_demo
REDIS_PASSWORD=
```

- `.env`：本地私密配置，不提交
- `.env.example`：模板，提交给团队用

## 5）数据库初始化：TypeORM 的同步策略怎么理解

开发环境常见两种方式：

- `synchronize: true`：根据实体自动同步表结构（快，但只建议开发用）
- Migration：生产可控（慢一点，但靠谱）

当前项目如果启用了 `synchronize: true`，你只需要保证：

- 数据库能连上
- 数据库名存在（例如 `globox_demo`）

## 6）启动项目（相当于跑 Spring Boot main）

```bash
# 热重载（类似 DevTools）
yarn workspace demo-api start:dev

# 不热重载
yarn workspace demo-api start
```

看到类似日志就算成功：

```bash
🚀 Demo API is running at http://localhost:3000/api
```

## 7）验证接口（最小闭环）

- 浏览器访问：`http://localhost:3000/api`
- curl：

```bash
curl http://localhost:3000/api
```

或者使用常见的 api 调用工具

## 8）常见问题速查（把“现象 → 原因 → 一条命令解决”写清楚）

### Q1：`Cannot find module '@globox/core'`

原因：内部包没 build。
解决：

```bash
yarn workspace @globox/core build
```

### Q2：`Access denied for user 'root'@'localhost'`

原因通常是 `.env` 密码不对 / MySQL 没启动 / 库不存在。
你只需要按顺序排查：

```bash
mysql -u root -p
SHOW DATABASES LIKE 'globox_demo';
```

### Q3：Redis 连接失败

先确认 Redis 活着，再谈密码：

```bash
redis-cli ping
```

### Q4：端口占用 `EADDRINUSE :::3000`

改 `.env`：

```bash
PORT=3001
```

### Q5：TypeScript 编译错误

核心心态：**这就是编译期报错，跟 Java 一样，别慌**。
缺类型包就装：

```bash
yarn add -D @types/node
```

## 9）项目结构速览（用“看一眼就懂”的树）

- `packages/core`：共享包（类似 common）
- `apps/demo-api`：应用（类似业务服务）
- `main.ts`：启动入口（类似 Application.java）
- `app.module.ts`：主模块（类似 Spring 的配置/启动装配中心）

## 10）附录：命令对照（简短就够）

- `yarn install` ≈ `mvn install`（下载依赖）
- `yarn workspace xxx build` ≈ 构建某个模块
- `start:dev` ≈ DevTools 热重载开发模式
