# 从零开始创建Servlet+JSP员工管理系统

## 📋 项目概述

**目标**：使用IDEA + Tomcat 11 + MySQL创建一个员工管理系统
**技术栈**：Jakarta EE (Servlet 6.0) + JSP + MySQL + Maven + Bootstrap
**主要功能**：用户登录、员工信息查询、数据展示

---

## 🛠️ 环境准备

### 必需软件清单
- [ ] IntelliJ IDEA 2022.1+
- [x] JDK 11或更高版本
- [x] Apache Tomcat 11.0.0
- [x] MySQL 8.0+
- [x] Apache Maven 3.6+

### 验证环境
```bash
java -version    # 确认JDK版本
mvn -version     # 确认Maven版本
```

---

## 📝 第一步：创建Maven Web项目

### 1.1 新建项目
1. **打开IDEA** → `File` → `New` → `Project`
2. **选择项目类型**：
   - 左侧选择 `Maven Archetype`
   - Archetype: `org.apache.maven.archetypes:maven-archetype-webapp`
   - GroupId: `com.gxa`
   - ArtifactId: `servlet-jsp-demo`
   - Version: `1.0-SNAPSHOT`

### 1.2 配置项目结构
创建完成后，项目结构应该是：
```
servlet-jsp-demo/
├── pom.xml
└── src/
    └── main/
        ├── java/           # Java源代码目录
        ├── resources/      # 资源文件目录
        └── webapp/         # Web资源目录
            ├── WEB-INF/
            │   └── web.xml
            └── index.jsp
```

**技术要点**：
- **Maven Archetype**：项目模板，`maven-archetype-webapp`是标准的Web应用模板
- **GroupId**：组织标识符，通常使用域名倒序
- **ArtifactId**：项目名称，构件标识符

---

## 📝 第二步：配置Maven依赖

### 2.1 编辑pom.xml
将以下内容替换到`pom.xml`：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <groupId>com.gxa</groupId>
    <artifactId>servlet-jsp-demo</artifactId>
    <version>1.0-SNAPSHOT</version>
    <packaging>war</packaging>
    
    <properties>
        <maven.compiler.source>11</maven.compiler.source>
        <maven.compiler.target>11</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <jakarta.version>6.0.0</jakarta.version>
        <mysql.version>8.0.33</mysql.version>
    </properties>
    
    <dependencies>
        <!-- Jakarta Servlet API (Tomcat 11兼容) -->
        <dependency>
            <groupId>jakarta.servlet</groupId>
            <artifactId>jakarta.servlet-api</artifactId>
            <version>${jakarta.version}</version>
            <scope>provided</scope>
        </dependency>
        
        <!-- Jakarta JSP API -->
        <dependency>
            <groupId>jakarta.servlet.jsp</groupId>
            <artifactId>jakarta.servlet.jsp-api</artifactId>
            <version>3.1.1</version>
            <scope>provided</scope>
        </dependency>
        
        <!-- JSTL (JSP标准标签库) -->
        <dependency>
            <groupId>jakarta.servlet.jsp.jstl</groupId>
            <artifactId>jakarta.servlet.jsp.jstl-api</artifactId>
            <version>3.0.0</version>
        </dependency>
        
        <dependency>
            <groupId>org.glassfish.web</groupId>
            <artifactId>jakarta.servlet.jsp.jstl</artifactId>
            <version>3.0.1</version>
        </dependency>
        
        <!-- MySQL驱动 -->
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
            <version>${mysql.version}</version>
        </dependency>
        
        <!-- 数据库连接池 -->
        <dependency>
            <groupId>com.alibaba</groupId>
            <artifactId>druid</artifactId>
            <version>1.2.23</version>
        </dependency>
        
        <!-- Lombok (简化Java代码) -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <version>1.18.30</version>
            <scope>provided</scope>
        </dependency>
    </dependencies>
    
    <build>
        <finalName>servlet-jsp-demo</finalName>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.11.0</version>
                <configuration>
                    <source>11</source>
                    <target>11</target>
                </configuration>
            </plugin>
            
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-war-plugin</artifactId>
                <version>3.4.0</version>
            </plugin>
        </plugins>
    </build>
</project>
```

### 2.2 刷新Maven依赖
- 右键项目 → `Maven` → `Reload project`
- 或点击右侧Maven面板的刷新按钮

**技术要点**：
- **Jakarta EE vs Java EE**：从Java EE 8开始，Oracle将Java EE移交给Eclipse基金会，重命名为Jakarta EE
- **scope=provided**：表示容器(Tomcat)会提供这些依赖，打包时不包含
- **Druid**：阿里巴巴开源的数据库连接池，性能优秀
- **Lombok**：通过注解自动生成getter/setter等样板代码

---

## 📝 第三步：配置Tomcat服务器

### 3.1 添加Tomcat Server
1. **File** → **Settings** → **Build, Execution, Deployment** → **Application Servers**
2. 点击 **"+"** → 选择 **Tomcat Server**
3. **Tomcat Home**: 选择您的Tomcat 11安装目录
4. 点击 **OK**

### 3.2 创建运行配置
1. **Run** → **Edit Configurations**
2. 点击 **"+"** → **Tomcat Server** → **Local**
3. 配置信息：
   - **Name**: `Tomcat 11 - servlet-jsp-demo`
   - **Application server**: 选择刚添加的Tomcat 11
   - **JRE**: 选择JDK 11+
   - **HTTP port**: 8080
   - **JMX port**: 1099

### 3.3 配置部署
1. 切换到 **Deployment** 选项卡
2. 点击 **"+"** → **Artifact** → 选择 `servlet-jsp-demo:war exploded`
3. **Application context**: `/servlet-jsp-demo`

**技术要点**：
- **war vs war exploded**：exploded是解压版本，便于开发调试
- **Application context**：Web应用的访问路径，影响URL结构

---

## 📝 第四步：创建数据库

### 4.1 创建数据库脚本
在项目根目录创建 `database_init.sql`：

```sql
-- 创建数据库
CREATE DATABASE IF NOT EXISTS jdbc_demo DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE jdbc_demo;

-- 创建部门表
CREATE TABLE IF NOT EXISTS dept (
    deptno INT PRIMARY KEY,
    dname VARCHAR(50) NOT NULL COMMENT '部门名称',
    loc VARCHAR(50) COMMENT '部门位置'
);

-- 创建员工表
CREATE TABLE IF NOT EXISTS emp (
    empno INT PRIMARY KEY,
    ename VARCHAR(50) NOT NULL COMMENT '员工姓名',
    job VARCHAR(50) COMMENT '职位',
    mgr INT COMMENT '上级编号',
    hiredate DATE COMMENT '入职日期',
    sal DECIMAL(10,2) COMMENT '薪资',
    comm DECIMAL(10,2) COMMENT '奖金',
    deptno INT COMMENT '部门编号',
    FOREIGN KEY (deptno) REFERENCES dept(deptno)
);

-- 创建用户表
CREATE TABLE IF NOT EXISTS user (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(100) NOT NULL COMMENT '密码',
    salt VARCHAR(50) COMMENT '盐值'
);

-- 插入测试数据
INSERT INTO dept (deptno, dname, loc) VALUES
(10, '财务部', '北京'),
(20, '研发部', '上海'),
(30, '销售部', '广州'),
(40, '人事部', '深圳');

INSERT INTO emp (empno, ename, job, mgr, hiredate, sal, comm, deptno) VALUES
(7369, '张三', '程序员', 7902, '2023-01-15', 8000.00, 500.00, 20),
(7499, '李四', '销售员', 7698, '2023-02-20', 6000.00, 300.00, 30),
(7566, '王五', '经理', 7839, '2023-04-01', 12000.00, NULL, 20),
(7698, '赵六', '经理', 7839, '2023-06-01', 11000.00, NULL, 30),
(7839, '钱七', '总裁', NULL, '2023-01-01', 50000.00, NULL, 10);

-- 插入用户数据 (密码：123456)
INSERT INTO user (username, password, salt) VALUES
('admin', 'e10adc3949ba59abbe56e057f20f883e', 'test'),
('zhangsan', 'e10adc3949ba59abbe56e057f20f883e', 'test');
```

### 4.2 执行数据库脚本
使用MySQL客户端执行上述脚本

**技术要点**：
- **utf8mb4**：支持完整的UTF-8字符集，包括emoji
- **外键约束**：保证数据完整性
- **MD5加密**：简单的密码加密方式（生产环境建议使用更安全的方式）

---

## 📝 第五步：创建项目包结构

### 5.1 创建包目录
在 `src/main/java` 下创建以下包结构：
```
com.gxa/
├── entity/     # 实体类
├── dao/        # 数据访问层
├── service/    # 业务逻辑层
├── controller/ # 控制层
└── utils/      # 工具类
```

**技术要点**：
- **分层架构**：controller → service → dao，职责分离
- **包命名规范**：使用小写字母，避免使用Java关键字

---

## 📝 第六步：创建数据库连接配置

### 6.1 创建配置文件
在 `src/main/resources` 下创建 `jdbc.properties`：

```properties
# 数据库配置
jdbc.driver=com.mysql.cj.jdbc.Driver
jdbc.url=jdbc:mysql://localhost:3306/jdbc_demo?useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true
jdbc.username=root
jdbc.password=root

# 连接池配置
jdbc.initialSize=5
jdbc.maxActive=20
jdbc.maxWait=60000
jdbc.minIdle=5
```

### 6.2 创建数据库工具类
在 `com.gxa.utils` 包下创建 `JdbcUtils.java`：

```java
package com.gxa.utils;

import com.alibaba.druid.pool.DruidDataSource;
import com.alibaba.druid.pool.DruidDataSourceFactory;

import java.io.InputStream;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.Properties;

/**
 * 数据库连接工具类
 */
public class JdbcUtils {
    private static DruidDataSource dataSource;
    
    static {
        try {
            // 加载配置文件
            Properties props = new Properties();
            InputStream is = JdbcUtils.class.getClassLoader()
                    .getResourceAsStream("jdbc.properties");
            props.load(is);
            
            // 创建数据源
            dataSource = (DruidDataSource) DruidDataSourceFactory
                    .createDataSource(props);
                    
        } catch (Exception e) {
            throw new RuntimeException("数据库连接池初始化失败", e);
        }
    }
    
    /**
     * 获取数据库连接
     */
    public static Connection getConnection() throws SQLException {
        return dataSource.getConnection();
    }
    
    /**
     * 关闭连接
     */
    public static void close(Connection conn) {
        if (conn != null) {
            try {
                conn.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
    }
}
```

**技术要点**：
- **连接池**：复用数据库连接，提高性能
- **静态代码块**：类加载时执行，初始化数据源
- **异常处理**：将检查异常转换为运行时异常

---

## 📝 第七步：创建实体类

### 7.1 创建User实体
在 `com.gxa.entity` 包下创建 `User.java`：

```java
package com.gxa.entity;

import lombok.Data;

/**
 * 用户实体类
 */
@Data
public class User {
    private Integer id;
    private String username;
    private String password;
    private String salt;
    
    public User() {}
    
    public User(String username, String password) {
        this.username = username;
        this.password = password;
    }
}
```

### 7.2 创建Dept实体
在 `com.gxa.entity` 包下创建 `Dept.java`：

```java
package com.gxa.entity;

import lombok.Data;

/**
 * 部门实体类
 */
@Data
public class Dept {
    private Integer deptno;
    private String dname;
    private String loc;
    
    public Dept() {}
    
    public Dept(Integer deptno, String dname, String loc) {
        this.deptno = deptno;
        this.dname = dname;
        this.loc = loc;
    }
    
    @Override
    public String toString() {
        return this.dname;
    }
}
```

### 7.3 创建Emp实体
在 `com.gxa.entity` 包下创建 `Emp.java`：

```java
package com.gxa.entity;

import lombok.Data;
import java.util.Date;

/**
 * 员工实体类
 */
@Data
public class Emp {
    private Integer empno;
    private String ename;
    private String job;
    private Integer mgr;
    private Date hiredate;
    private Double sal;
    private Double comm;
    private Dept dept;  // 关联部门对象
    
    public Emp() {}
    
    public Emp(Integer empno, String ename, String job, Double sal) {
        this.empno = empno;
        this.ename = ename;
        this.job = job;
        this.sal = sal;
    }
}
```

**技术要点**：
- **@Data注解**：Lombok自动生成getter/setter/toString等方法
- **关联对象**：Emp包含Dept对象，体现表之间的关系
- **重载构造器**：提供多种实例化方式

---

## 📝 第八步：创建DAO层

### 8.1 创建UserDao接口
在 `com.gxa.dao` 包下创建 `UserDao.java`：

```java
package com.gxa.dao;

import com.gxa.entity.User;

/**
 * 用户数据访问接口
 */
public interface UserDao {
    /**
     * 根据用户名和密码查询用户
     */
    User findByUsernameAndPassword(String username, String password);
    
    /**
     * 根据用户名查询用户
     */
    User findByUsername(String username);
}
```

### 8.2 创建UserDao实现类
在 `com.gxa.dao.impl` 包下创建 `UserDaoImpl.java`：

```java
package com.gxa.dao.impl;

import com.gxa.dao.UserDao;
import com.gxa.entity.User;
import com.gxa.utils.JdbcUtils;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

/**
 * 用户数据访问实现类
 */
public class UserDaoImpl implements UserDao {
    
    @Override
    public User findByUsernameAndPassword(String username, String password) {
        String sql = "SELECT * FROM user WHERE username = ? AND password = ?";
        Connection conn = null;
        PreparedStatement pst = null;
        ResultSet rs = null;
        
        try {
            conn = JdbcUtils.getConnection();
            pst = conn.prepareStatement(sql);
            pst.setString(1, username);
            pst.setString(2, password);
            rs = pst.executeQuery();
            
            if (rs.next()) {
                User user = new User();
                user.setId(rs.getInt("id"));
                user.setUsername(rs.getString("username"));
                user.setPassword(rs.getString("password"));
                user.setSalt(rs.getString("salt"));
                return user;
            }
        } catch (SQLException e) {
            e.printStackTrace();
        } finally {
            // 关闭资源
            closeResources(rs, pst, conn);
        }
        return null;
    }
    
    @Override
    public User findByUsername(String username) {
        String sql = "SELECT * FROM user WHERE username = ?";
        Connection conn = null;
        PreparedStatement pst = null;
        ResultSet rs = null;
        
        try {
            conn = JdbcUtils.getConnection();
            pst = conn.prepareStatement(sql);
            pst.setString(1, username);
            rs = pst.executeQuery();
            
            if (rs.next()) {
                User user = new User();
                user.setId(rs.getInt("id"));
                user.setUsername(rs.getString("username"));
                user.setPassword(rs.getString("password"));
                user.setSalt(rs.getString("salt"));
                return user;
            }
        } catch (SQLException e) {
            e.printStackTrace();
        } finally {
            closeResources(rs, pst, conn);
        }
        return null;
    }
    
    /**
     * 关闭数据库资源
     */
    private void closeResources(ResultSet rs, PreparedStatement pst, Connection conn) {
        if (rs != null) {
            try { rs.close(); } catch (SQLException e) { e.printStackTrace(); }
        }
        if (pst != null) {
            try { pst.close(); } catch (SQLException e) { e.printStackTrace(); }
        }
        if (conn != null) {
            try { conn.close(); } catch (SQLException e) { e.printStackTrace(); }
        }
    }
}
```

**技术要点**：
- **PreparedStatement**：预编译SQL，防止SQL注入
- **资源管理**：使用finally块确保资源释放
- **异常处理**：记录异常信息，保证程序健壮性

---

## 📝 第九步：创建Service层

### 9.1 创建UserService接口
在 `com.gxa.service` 包下创建 `UserService.java`：

```java
package com.gxa.service;

import com.gxa.entity.User;

/**
 * 用户业务逻辑接口
 */
public interface UserService {
    /**
     * 用户登录
     * @param username 用户名
     * @param password 密码
     * @return 登录成功返回用户对象，失败返回null
     */
    User login(String username, String password);
}
```

### 9.2 创建密码工具类
在 `com.gxa.utils` 包下创建 `Md5Utils.java`：

```java
package com.gxa.utils;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * MD5加密工具类
 */
public class Md5Utils {
    
    /**
     * MD5加密
     */
    public static String md5(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] digest = md.digest(input.getBytes());
            
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b & 0xff));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("MD5加密失败", e);
        }
    }
    
    /**
     * 验证密码
     */
    public static boolean verify(String input, String md5Hash) {
        return md5(input).equals(md5Hash);
    }
}
```

### 9.3 创建UserService实现类
在 `com.gxa.service.impl` 包下创建 `UserServiceImpl.java`：

```java
package com.gxa.service.impl;

import com.gxa.dao.UserDao;
import com.gxa.dao.impl.UserDaoImpl;
import com.gxa.entity.User;
import com.gxa.service.UserService;
import com.gxa.utils.Md5Utils;

/**
 * 用户业务逻辑实现类
 */
public class UserServiceImpl implements UserService {
    
    private UserDao userDao = new UserDaoImpl();
    
    @Override
    public User login(String username, String password) {
        // 1. 参数验证
        if (username == null || username.trim().isEmpty() ||
            password == null || password.trim().isEmpty()) {
            return null;
        }
        
        // 2. 密码加密
        String md5Password = Md5Utils.md5(password);
        
        // 3. 查询用户
        User user = userDao.findByUsernameAndPassword(username, md5Password);
        
        return user;
    }
}
```

**技术要点**：
- **业务逻辑分离**：Service层处理业务规则，DAO层只处理数据访问
- **参数验证**：在业务层进行输入参数的合法性检查
- **密码安全**：使用MD5加密存储密码

---

## 📝 第十步：创建Controller层

### 10.1 创建LoginController
在 `com.gxa.controller` 包下创建 `LoginController.java`：

```java
package com.gxa.controller;

import com.gxa.entity.User;
import com.gxa.service.UserService;
import com.gxa.service.impl.UserServiceImpl;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;

/**
 * 登录控制器
 */
@WebServlet("/login")
public class LoginController extends HttpServlet {
    
    private UserService userService = new UserServiceImpl();
    
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) 
            throws ServletException, IOException {
        // GET请求转发给POST处理
        doPost(req, resp);
    }
    
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) 
            throws ServletException, IOException {
        
        // 设置请求编码
        req.setCharacterEncoding("UTF-8");
        resp.setContentType("text/html;charset=UTF-8");
        
        // 获取请求参数
        String username = req.getParameter("username");
        String password = req.getParameter("password");
        
        System.out.println("登录尝试: " + username + " / " + password);
        
        // 调用业务逻辑
        User user = userService.login(username, password);
        
        if (user != null) {
            // 登录成功
            HttpSession session = req.getSession();
            session.setAttribute("user", user);
            
            // 重定向到主页
            resp.sendRedirect(req.getContextPath() + "/main.jsp");
        } else {
            // 登录失败
            req.setAttribute("errorMsg", "用户名或密码错误！");
            req.getRequestDispatcher("/login.jsp").forward(req, resp);
        }
    }
}
```

**技术要点**：
- **@WebServlet注解**：Servlet 3.0+的新特性，替代web.xml配置
- **字符编码**：处理中文乱码问题
- **Session管理**：保存用户登录状态
- **重定向vs转发**：redirect用于成功跳转，forward用于错误回显

---

## 📝 第十一步：创建JSP页面

### 11.1 创建登录页面
将 `src/main/webapp/index.jsp` 替换为：

```jsp
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>用户登录</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
        }
        .login-card {
            background: white;
            border-radius: 15px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.1);
            padding: 2rem;
            width: 100%;
            max-width: 400px;
        }
        .login-header {
            text-align: center;
            margin-bottom: 2rem;
        }
        .login-header h2 {
            color: #333;
            font-weight: 600;
        }
        .error-msg {
            color: #dc3545;
            font-size: 0.9em;
            margin-top: 0.5rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="row justify-content-center">
            <div class="col-md-6">
                <div class="login-card">
                    <div class="login-header">
                        <h2>员工管理系统</h2>
                        <p class="text-muted">请输入您的登录信息</p>
                    </div>
                    
                    <form action="login" method="post">
                        <div class="mb-3">
                            <label for="username" class="form-label">用户名</label>
                            <input type="text" class="form-control" id="username" 
                                   name="username" required placeholder="请输入用户名">
                        </div>
                        
                        <div class="mb-3">
                            <label for="password" class="form-label">密码</label>
                            <input type="password" class="form-control" id="password" 
                                   name="password" required placeholder="请输入密码">
                        </div>
                        
                        <div class="mb-3 form-check">
                            <input type="checkbox" class="form-check-input" id="remember">
                            <label class="form-check-label" for="remember">记住我</label>
                        </div>
                        
                        <button type="submit" class="btn btn-primary w-100">登录</button>
                        
                        <% if(request.getAttribute("errorMsg") != null) { %>
                            <div class="error-msg text-center">
                                <%= request.getAttribute("errorMsg") %>
                            </div>
                        <% } %>
                    </form>
                    
                    <div class="text-center mt-3">
                        <small class="text-muted">
                            测试账号：admin / 123456
                        </small>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
```

### 11.2 创建主页面
在 `src/main/webapp` 下创建 `main.jsp`：

```jsp
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ page import="com.gxa.entity.User" %>
<%
    User user = (User) session.getAttribute("user");
    if (user == null) {
        response.sendRedirect("index.jsp");
        return;
    }
%>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>员工管理系统 - 主页</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        .sidebar {
            min-height: 100vh;
            background: #343a40;
        }
        .sidebar .nav-link {
            color: #fff;
            border-radius: 5px;
            margin: 2px 0;
        }
        .sidebar .nav-link:hover {
            background: #495057;
            color: #fff;
        }
        .sidebar .nav-link.active {
            background: #007bff;
            color: #fff;
        }
        .main-content {
            padding: 2rem;
        }
        .welcome-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 15px;
            padding: 2rem;
            margin-bottom: 2rem;
        }
    </style>
</head>
<body>
    <div class="container-fluid">
        <div class="row">
            <!-- 侧边栏 -->
            <div class="col-md-2 sidebar">
                <div class="p-3">
                    <h5 class="text-white">员工管理系统</h5>
                    <hr class="text-white">
                    <nav class="nav flex-column">
                        <a class="nav-link active" href="#dashboard">
                            <i class="bi bi-speedometer2"></i> 控制台
                        </a>
                        <a class="nav-link" href="emp/list">
                            <i class="bi bi-people"></i> 员工管理
                        </a>
                        <a class="nav-link" href="#reports">
                            <i class="bi bi-graph-up"></i> 报表统计
                        </a>
                        <a class="nav-link" href="#settings">
                            <i class="bi bi-gear"></i> 系统设置
                        </a>
                        <hr class="text-white">
                        <a class="nav-link" href="logout">
                            <i class="bi bi-box-arrow-right"></i> 退出登录
                        </a>
                    </nav>
                </div>
            </div>
            
            <!-- 主内容区 -->
            <div class="col-md-10 main-content">
                <div class="welcome-card">
                    <h2>欢迎回来，<%= user.getUsername() %>！</h2>
                    <p>今天是 <%= new java.util.Date() %></p>
                </div>
                
                <div class="row">
                    <div class="col-md-3">
                        <div class="card text-white bg-primary">
                            <div class="card-body">
                                <h5 class="card-title">员工总数</h5>
                                <h2>156</h2>
                                <p class="card-text">当前在职员工数量</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-3">
                        <div class="card text-white bg-success">
                            <div class="card-body">
                                <h5 class="card-title">部门数量</h5>
                                <h2>8</h2>
                                <p class="card-text">公司部门总数</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-3">
                        <div class="card text-white bg-warning">
                            <div class="card-body">
                                <h5 class="card-title">本月新增</h5>
                                <h2>12</h2>
                                <p class="card-text">本月新入职员工</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-3">
                        <div class="card text-white bg-danger">
                            <div class="card-body">
                                <h5 class="card-title">待审批</h5>
                                <h2>5</h2>
                                <p class="card-text">待处理申请数量</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="row mt-4">
                    <div class="col-md-8">
                        <div class="card">
                            <div class="card-header">
                                <h5>最近动态</h5>
                            </div>
                            <div class="card-body">
                                <ul class="list-group list-group-flush">
                                    <li class="list-group-item">张三 提交了请假申请</li>
                                    <li class="list-group-item">李四 完成了项目交付</li>
                                    <li class="list-group-item">王五 更新了个人信息</li>
                                    <li class="list-group-item">赵六 申请了加班</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-header">
                                <h5>快捷操作</h5>
                            </div>
                            <div class="card-body">
                                <div class="d-grid gap-2">
                                    <button class="btn btn-outline-primary">添加员工</button>
                                    <button class="btn btn-outline-success">生成报表</button>
                                    <button class="btn btn-outline-info">导出数据</button>
                                    <button class="btn btn-outline-warning">系统备份</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
```

**技术要点**：
- **JSP表达式**：`<%= %>` 输出Java表达式的值
- **Session验证**：检查用户是否已登录
- **Bootstrap框架**：快速构建响应式UI
- **响应式设计**：适配不同屏幕尺寸

---

## 📝 第十二步：测试和部署

### 12.1 编译项目
1. 在IDEA中点击 **Build** → **Rebuild Project**
2. 确保没有编译错误

### 12.2 启动服务器
1. 点击运行按钮或按 `Shift + F10`
2. 等待Tomcat启动完成

### 12.3 测试应用
1. 在浏览器中访问：`http://localhost:8080/servlet-jsp-demo/`
2. 使用测试账号登录：`admin` / `123456`
3. 验证登录功能是否正常

### 12.4 常见问题排查
1. **404错误**：检查URL路径和部署配置
2. **500错误**：查看IDEA控制台和Tomcat日志
3. **数据库连接失败**：检查MySQL服务和配置文件
4. **编码问题**：确保所有文件使用UTF-8编码

---

## 🎯 项目扩展建议

### 阶段一：基础功能完善
- [ ] 添加员工列表查询功能
- [ ] 实现员工信息的增删改
- [ ] 添加分页功能
- [ ] 实现高级搜索

### 阶段二：功能增强
- [ ] 添加文件上传功能（头像上传）
- [ ] 实现数据导入导出（Excel）
- [ ] 添加日志记录功能
- [ ] 实现权限控制

### 阶段三：技术升级
- [ ] 使用Spring Framework
- [ ] 整合MyBatis
- [ ] 前后端分离（Vue.js + RESTful API）
- [ ] 添加Redis缓存

---

## 📚 技术要点总结

### Web开发核心概念
1. **MVC架构**：Model-View-Controller分离关注点
2. **请求处理流程**：浏览器 → Servlet → Service → DAO → 数据库
3. **会话管理**：使用Session保持用户状态
4. **数据绑定**：请求参数与Java对象的映射

### 数据库设计原则
1. **范式化设计**：减少数据冗余
2. **外键约束**：保证数据完整性
3. **索引优化**：提高查询性能
4. **连接池管理**：提高数据库访问效率

### 安全考虑
1. **SQL注入防护**：使用PreparedStatement
2. **密码加密**：不存储明文密码
3. **XSS防护**：过滤用户输入
4. **CSRF保护**：验证请求来源

### 性能优化
1. **数据库连接池**：减少连接开销
2. **静态资源CDN**：提高加载速度
3. **缓存机制**：减少数据库访问
4. **代码优化**：减少不必要的对象创建

---

## 🚀 开始你的编程之旅！

现在你已经有了完整的指南，可以开始动手实践了！记住：
- **理论结合实践**：边学边做，加深理解
- **错误是成长的机会**：遇到问题时仔细分析日志
- **持续改进**：完成基础功能后不断优化和扩展
- **文档记录**：记录开发过程中的问题和解决方案

祝你编程愉快！🎉 