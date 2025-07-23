---
title: Java入门-面向对象【下篇】
date: 2025-07-08 15:57:13
description: 这是一篇新文章!
order: 3
publish: true
tags:
---

# final 关键字

final 关键字在 Java 中表示"最终的"或"不可改变的"，它可以用来限制类、方法和变量的行为。

## 修饰类

当一个类被 final 修饰时，它成为"最终类"，其核心特点是不能被继承：

```java
public final class SecurityClass {
    // 这个类不能被继承
}
```

这在设计安全性要求高的类时非常有用，比如 Java 标准库中的 String 和 Math 类都是 final 的，防止被恶意继承和修改。

## 修饰方法

final 修饰的方法称为"最终方法"，它不能被子类重写：

```java
public class Parent {
    public final void secureMethod() {
        // 这个方法不能被子类重写
    }
}
```

这种设计适用于那些算法固定、不希望被子类修改的核心方法，既保证了安全性，也便于编译器优化。

## 修饰变量

final 修饰的变量本质上是一个"常量"，一旦赋值后就不能再修改。这种限制根据变量类型的不同，有几种不同的应用场景：

### 修饰局部变量

局部变量（方法内部定义的变量）使用 final 修饰后，只能被赋值一次：

```java
public void test() {
    final int a = 12;  // 直接初始化
    // a = 15;  // 错误！final变量不能再次赋值

    final int b;  // 声明时可以不初始化
    b = 20;       // 第一次赋值正常
    // b = 30;    // 错误！不能再次赋值
}
```

### 修饰成员变量

成员变量按照它们的作用域，可以分为静态成员变量和实例成员变量：

**静态（static）成员变量**

这种组合创建了真正的"常量"，必须在声明时或静态代码块中初始化：

```java
// 声明时初始化
public static final double PI = 3.14159;

// 或在静态代码块中初始化
public static final double E;
static {
    E = 2.71828;
}
```

**实例成员变量**

这种变量必须在以下位置之一完成初始化：

- 声明时直接赋值
- 实例代码块中赋值
- 所有构造方法中赋值

```java
public class Person {
    private final String id;  // 一旦设置不可更改的身份证号

    public Person(String id) {
        this.id = id;  // 构造器中初始化
    }

    public void changeId(String newId) {
        // this.id = newId;  // 错误！不能修改final变量
    }
}
```

## 常量

使用`static final`组合修饰的变量称为"常量"，通常用大写字母命名，多个单词间用下划线连接：

```java
public class Constants {
    public static final String DATABASE_URL = "jdbc:mysql://localhost:3306/mydb";
    public static final int MAX_CONNECTIONS = 100;
    public static final double TAX_RATE = 0.17;
}
```

使用常量而非硬编码的数值（魔法数字）有三大好处：

- **提高可读性**：`TAX_RATE`比`0.17`更能表达意图
- **便于维护**：修改一处即可全局生效
- **不影响性能**：编译器会直接将常量引用替换为其值（称为"宏替换"）

```java
// 使用魔法数字
if (orderAmount > 1000) {  // 什么是1000？为什么是这个数？
    discount = orderAmount * 0.1;  // 0.1又代表什么？
}

// 使用常量
if (orderAmount > Constants.ORDER_DISCOUNT_THRESHOLD) {
    discount = orderAmount * Constants.VIP_DISCOUNT_RATE;
}
```

final 关键字是 Java 安全编程的重要工具，合理使用可以创建更安全、更清晰的代码结构。无论是防止继承、方法重写，还是创建不可变数据，final 都能帮助我们定义清晰的边界。

# 抽象类

有时候，我们只想定义一个"框架"或"骨架"，而不关心具体实现细节。抽象类就是为这种需求而生的——它介于普通类和接口之间的一种特殊类型。

> 抽象类就像一张"设计图"，描述了大致结构，但留下了一些细节等待子类来完成。

抽象类使用`abstract`关键字修饰，本质上是一种特殊的类，它可以包含：

- 抽象方法（没有实现的方法）
- 普通方法（有具体实现的方法）
- 成员变量、构造器等普通类的所有元素

```java
// 交通工具抽象类
public abstract class Vehicle {
    private String brand;     // 品牌
    private String color;     // 颜色
    protected int speed;      // 速度

    // 普通方法
    public String getInfo() {
        return brand + " " + color + " 交通工具";
    }

    // 抽象方法 - 没有方法体，必须由子类实现
    public abstract void move();
}
```

### 抽象的意义

让我们以交通工具为例，深入理解抽象类的价值：

**普通父类的局限**：假设我们用普通类设计`Vehicle`基类：

```java
// 普通父类
public class Vehicle {
    private String brand;
    private String color;

    public void move() {
        // 怎么实现？开？飞？划？
        // 无法提供通用实现
    }
}
```

这里的`move()`方法面临困境：汽车需要在路上行驶，飞机需要在空中飞行，船需要在水上航行，父类无法提供一个适用于所有子类的实现。

**如果使用接口**：

```java
// 接口方式
public interface Movable {
    void move();
    // 接口不能包含交通工具共有的品牌、颜色等属性
}
```

接口解决了"必须实现"的问题，但它不能包含交通工具的共同属性和方法。

**抽象类的优势**：

```java
// 抽象类方案
public abstract class Vehicle {
    // 共享的属性
    private String brand;
    private String color;
    protected int speed;

    // 共享的行为
    public void honk() {
        System.out.println("发出喇叭声！");
    }

    // 必须由子类实现的行为
    public abstract void move();
}
```

抽象类让我们能够：

1. 定义共享的属性（brand, color, speed）
2. 提供共享的行为实现（honk）
3. 强制子类实现特定方法（move）

> 在 IDEA 中，实现抽象方法可以使用快捷键: Alt + 回车

子类实现示例：

```java
// 汽车
public class Car extends Vehicle {
    private int wheels;

    @Override
    public void move() {
        System.out.println("汽车在公路上行驶，速度：" + speed + "km/h");
    }
}

// 飞机
public class Airplane extends Vehicle {
    private int wingspan;

    @Override
    public void move() {
        System.out.println("飞机在空中飞行，高度：10000米，速度：" + speed + "km/h");
    }
}
```

## 抽象类的关键特性

抽象类有几个重要特点：

1. **不能被实例化**：不能使用`new`创建抽象类对象

   ```java
   // Vehicle v = new Vehicle();  // 错误！抽象类不能实例化
   ```

2. **必须被继承**：抽象类的价值在于被子类继承并实现其抽象方法

   ```java
   // 船类必须实现move()方法
   public class Boat extends Vehicle {
       @Override
       public void move() {
           System.out.println("船在水上航行");
       }
   }
   ```

3. **多态使用**：可以用抽象类类型引用指向子类对象

   ```java
   Vehicle v = new Car();
   v.move();  // 输出：汽车在公路上行驶，速度：80km/h
   ```

4. **子类责任**：子类必须实现所有抽象方法，否则子类也必须声明为抽象类

## 模板方法设计模式

抽象类的一个典型应用是"模板方法"设计模式，它解决了这样一个问题：**一个操作中有些步骤是固定的，有些步骤是变化的**。

例如，我们可以把"驾驶交通工具"抽象为一个通用流程：

```java
public abstract class VehicleOperation {
    // 模板方法：定义驾驶流程
    public final void operate() {
        startEngine();        // 固定：启动引擎
        move();               // 变化：移动（不同交通工具方式不同）
        shutDownEngine();     // 固定：关闭引擎
    }

    // 固定实现
    private void startEngine() {
        System.out.println("启动引擎");
    }

    private void shutDownEngine() {
        System.out.println("关闭引擎");
    }

    // 变化部分：由子类实现
    protected abstract void move();
}
```

不同交通工具只需实现自己特有的移动方式：

```java
// 汽车操作
public class CarOperation extends VehicleOperation {
    @Override
    protected void move() {
        System.out.println("汽车在道路上行驶");
    }
}

// 飞机操作
public class AirplaneOperation extends VehicleOperation {
    @Override
    protected void move() {
        System.out.println("飞机在空中飞行");
    }
}
```

使用时，流程始终一致，但具体移动步骤会根据交通工具不同而变化：

```java
// 操作汽车
VehicleOperation carOp = new CarOperation();
carOp.operate();
// 输出：启动引擎 → 汽车在道路上行驶 → 关闭引擎

// 操作飞机
VehicleOperation airOp = new AirplaneOperation();
airOp.operate();
// 输出：启动引擎 → 飞机在空中飞行 → 关闭引擎
```

模板方法的核心优势在于：
它把不变的部分固定下来，把变化的部分交给子类实现，既保证了整体流程的一致性，又提供了定制化的灵活性。
这种设计模式在 Java 标准库中被广泛应用，例如集合框架中的排序功能。

# static 静态

你有没有想过，为什么我们可以直接使用 `Math.PI` 而不需要先创建一个 Math 对象？
Java 里的 `static` 是"静态"的意思，用它修饰的东西，不归某个对象所有，而是归整个类。

## static 修饰变量

在 Java 中，静态变量是用 `static` 关键字修饰的变量，它属于类而非对象。
先说变量。Java 的成员变量有两种：

**实例变量（没有 `static`）**

实例变量属于某个对象，每个对象一份。必须先创建对象（new）之后才能访问。

```java
public class Student {
    int age; // 实例变量
}
```

**类变量（有 `static`）**

类变量属于类本身，全体对象共用一份。**不需要 new 对象，就能访问。**

```java
public class Student {
    static String schoolName; // 类变量
}
```

怎么访问？

```java
Student.schoolName = "中学"; // 推荐：类名.变量
new Student().schoolName = "改学校"; // 不推荐，但语法允许 对象.变量
```

类变量只有一份，共享；实例变量每个对象一份，独立。

## static 修饰方法

方法也分两类：

**实例方法（没 static）**

实例方法依附于对象，调用前必须先 `new`。它既能访问实例变量，也能访问类变量，并支持使用 `this` 引用当前对象。

```java
public class Demo {
    public void sayHello() {
        System.out.println("Hello from object.");
    }

    public static void main(String[] args) {
        Demo d = new Demo();
        d.sayHello(); // 调用实例方法
    }
}
```

**类方法（有 static）**

类方法属于类本身，不依赖具体对象，因此无需 `new` 就能调用。它无法访问实例变量，也不能使用 `this`。

```java
public class Demo {
    public static void printHelp() {
        System.out.println("静态方法，用类名调用");
    }

    public static void main(String[] args) {
        Demo.printHelp(); // 推荐：用类名调用
        new Demo().printHelp(); // 不推荐：也能调用，但违背设计初衷
    }
}
```

类方法适合做"工具函数"——执行一段逻辑，但不依赖某个对象的状态。

# 工具类

静态特性最常见的应用就是创建工具类。想一想，你不会为了用一次计算器就买一个新的吧？

> 工具类是一种只包含静态方法和静态常量的类，用于提供通用功能，而不需要创建实例。

## 工具类的标准写法

工具类的标准设计有三个关键点：

1. 所有方法都是静态的
2. 构造器私有化（防止创建实例）
3. 类名通常以"Util"、"Helper"或"Tools"结尾

```java
public class MathUtil {
    // 私有构造器，禁止创建实例
    private MathUtil() {
        throw new UnsupportedOperationException("工具类不能实例化");
    }

    // 静态方法
    public static int add(int a, int b) {
        return a + b;
    }

    public static int max(int a, int b) {
        return (a > b) ? a : b;
    }

    // 静态常量
    public static final double PI = 3.14159;
}
```

使用时直接通过类名调用：

```java
int sum = MathUtil.add(5, 3);
double area = MathUtil.PI * radius * radius;
```

Java 标准库中有很多工具类，如`Math`、`Arrays`、`Collections`等，它们都遵循这种设计模式。

# 单例设计模式

你有没有想过，为什么电脑里只能打开一个任务管理器？无论你点击多少次，系统都只会显示同一个窗口？
这就是**单例模式**的应用！

> 单例模式确保一个类在整个应用中只有一个实例，并提供一个全局访问点。

## 为什么需要单例？

某些类创建多个实例会导致问题或资源浪费：

- 数据库连接池：维护多个会消耗过多资源
- 系统设置：应用中只需要一份配置信息
- 线程池：集中管理线程资源更高效
- 日志记录器：统一记录日志避免冲突

## 如何实现单例？

实现单例模式有三个关键步骤：

1. **把构造器私有化**（防止外部直接 new 对象）
2. **定义一个类变量**存储这个唯一的对象
3. **提供一个公共的静态方法**返回这个对象

```java
public class DatabaseManager {
    // 1. 私有静态变量，持有唯一实例
    private static DatabaseManager instance = new DatabaseManager();

    // 2. 私有构造器，防止外部创建实例
    private DatabaseManager() {
        System.out.println("初始化数据库连接...");
    }

    // 3. 公共静态方法，提供全局访问点
    public static DatabaseManager getInstance() {
        return instance;
    }

    // 业务方法
    public void executeQuery(String sql) {
        System.out.println("执行SQL: " + sql);
    }
}
```

使用时：

```java
// 获取唯一实例
DatabaseManager db1 = DatabaseManager.getInstance();
DatabaseManager db2 = DatabaseManager.getInstance();

// db1和db2是同一个对象引用！
db1.executeQuery("SELECT * FROM users");
System.out.println(db1 == db2);  // 输出：true
```

## 单例的实现方式

单例模式有两种主要实现方式：

### 饿汉式单例

特点：类加载时就创建实例，**不管你用不用，我都先创建好了等你来拿**。

```java
public class EagerSingleton {
    // 在类加载时就创建实例
    private static final EagerSingleton INSTANCE = new EagerSingleton();

    private EagerSingleton() {}

    public static EagerSingleton getInstance() {
        return INSTANCE;  // 直接返回已创建好的实例
    }
}
```

优点：实现简单，线程安全
缺点：不管是否需要，都会创建实例，可能造成资源浪费

### 懒汉式单例

特点：第一次使用时才创建对象，**需要时才创建，不需要不创建**。

```java
public class LazySingleton {
    // 一开始不创建实例
    private static LazySingleton instance;

    private LazySingleton() {}

    public static LazySingleton getInstance() {
        // 第一次调用时才创建实例
        if (instance == null) {
            instance = new LazySingleton();
        }
        return instance;
    }
}
```

优点：延迟加载，节省资源
缺点：基础版本在多线程环境下不安全

单例模式是 Java 中最简单也最常用的设计模式之一，合理使用可以有效控制资源并提高程序性能。

# static 静态

你有没有想过，为什么我们可以直接使用 `Math.PI` 而不需要先创建一个 Math 对象？
Java 里的 `static` 是“静态”的意思，用它修饰的东西，不归某个对象所有，而是归整个类。

### static 修饰变量

在 Java 中，静态变量是用 `static` 关键字修饰的变量，它属于类而非对象。

先说变量。Java 的成员变量有两种：

**实例变量（没有 `static`）**

实例变量属于某个对象，每个对象一份。必须先创建对象（new）之后才能访问。

```java
public class Student {
    int age; // 实例变量
}
```

**类变量（有 `static`）**

类变量属于类本身，全体对象共用一份。**不需要 new 对象，就能访问。**

```java
public class Student {
    static String schoolName; // 类变量
}
```

怎么访问？

```java
Student.schoolName = "中学"; // 推荐：类名.变量
new Student().schoolName = "改学校"; // 不推荐，但语法允许 对象.变量
```

类变量只有一份，共享；实例变量每个对象一份，独立。

### static 修饰方法

方法也分两类：

**实例方法（没 static）**

实例方法依附于对象，调用前必须先 `new`。它既能访问实例变量，也能访问类变量，并支持使用 `this` 引用当前对象。

```java
public class Demo {
    public void sayHello() {
        System.out.println("Hello from object.");
    }

    public static void main(String[] args) {
        Demo d = new Demo();
        d.sayHello(); // 调用实例方法
    }
}
```

**类方法（有 static）**

类方法属于类本身，不依赖具体对象，因此无需 `new` 就能调用。它无法访问实例变量，也不能使用 `this`。

```java
public class Demo {
    public static void printHelp() {
        System.out.println("静态方法，用类名调用");
    }

    public static void main(String[] args) {
        Demo.printHelp(); // 推荐：用类名调用
        new Demo().printHelp(); // 不推荐：也能调用，但违背设计初衷
    }
}
```

类方法适合做“工具函数”——执行一段逻辑，但不依赖某个对象的状态。

# 工具类

静态特性最常见的应用就是创建工具类。想一想，你不会为了用一次计算器就买一个新的吧？

工具类是用来封装某一领域的通用方法的类，这些方法通常不需要对象状态，只是纯粹的功能服务，所以一般都设计成静态的。

工具类的标准写法:

```java
public class MathUtil {
    private MathUtil() {} // 构造器私有，禁止创建对象

    public static int add(int a, int b) {
        return a + b;
    }
}
```

用法：

```java
int sum = MathUtil.add(3, 5);
```

## 单例设计模式

你有没有想过，为什么电脑里只能打开一个任务管理器？无论你点击多少次，系统都只会显示同一个窗口？
这就是**单例模式**的应用！单例模式解决的问题很简单：**确保一个类只能产生一个对象**。

设计模式就像是编程世界的"食谱"，针对常见问题提供最佳解决方案。单例模式就是其中一种，它确保某个类在整个应用中只有**一个**实例。

想象一下，如果任务管理器可以打开多个，每个都在监控系统资源，那会多浪费内存啊！

**如何实现单例？**

实现单例模式有三个关键步骤：

1. **把构造器私有化**（防止别人直接 new 对象）
2. **定义一个类变量**存储这个唯一的对象
3. **提供一个公共的静态方法**返回这个对象

```java
public class A {
    // 使用静态变量记录唯一对象
    private static A a = new A();

    // 构造器私有化，外部无法new
    private A() {
        System.out.println("A()");
    }

    // 提供静态方法返回唯一对象
    public static A getInstance() {
        return a;
    }
}
```

使用时：

```java
// 获取唯一实例
A instance1 = A.getInstance();
A instance2 = A.getInstance();

// instance1和instance2是同一个对象！
```

## 常见实现方式

单例模式有两种主要实现方式：

### 饿汉式单例

特点：类加载时就创建好对象，**不管你用不用，我都先创建好了等你来拿**。

```java
public class EagerSingleton {
    // 在类加载时就创建实例
    private static EagerSingleton instance = new EagerSingleton();

    private EagerSingleton() {}

    public static EagerSingleton getInstance() {
        return instance;  // 直接返回已创建好的实例
    }
}
```

### 懒汉式单例

特点：第一次使用时才创建对象，**需要的时候才创建，不需要不创建**。

```java
public class LazySingleton {
    // 一开始不创建实例
    private static LazySingleton instance;

    private LazySingleton() {}

    public static LazySingleton getInstance() {
        // 第一次调用时才创建实例
        if (instance == null) {
            instance = new LazySingleton();
        }
        return instance;
    }
}
```

这些对象创建和管理成本较高，且全局只需要一个实例，使用单例可以节省系统资源。

> IDEA 快捷技巧:  
> 选中代码后按 `Alt + Enter` 可以快速生成变量  
> 在表达式后输入 `.var` 再按回车，也能达到同样效果

### 代码块

代码块就像是特殊的"迷你方法"，它不需要被调用，代码块会在对象或类被创建、加载时，提前执行一些初始化逻辑。

Java 中有两种主要的代码块：

**静态代码块 `static {}`**

- 类加载的时候执行（整个程序生命周期中**只执行一次**）
- 常用来初始化类变量

```java
public class Demo {
    static {
        System.out.println("类加载：初始化数据库连接池");
    }
}
```

**实例代码块 `{}`**

- 每次创建对象时执行，**先于构造器执行**。
- 用来初始化一些所有构造器共用的逻辑。

```java
public class Demo {
    {
        System.out.println("创建对象前执行：统一初始化流程");
    }

    public Demo() {
        System.out.println("构造器执行");
    }
}
```

执行顺序是：

> 静态代码块（只一次） → 实例代码块（每次） → 构造器（每次）

来看一个更完整的执行顺序示例：

```java
public class CodeBlock {
    // 静态成员变量
    public static int num = 100;

    // 普通成员变量
    public int num2 = 10;

    // 构造方法
    public CodeBlock() {
        System.out.println("num2 = " + num2);
        System.out.println("执行构造方法");
    }

    public void func() {
        System.out.println("普通方法");
    }

    // 构造代码块
    {
        System.out.println("num2的初始值: " + num2);
        num2 = 20;  // 修改成员变量值
        System.out.println("执行构造代码块");
    }

    // 静态代码块
    static {
        System.out.println("num的初始值: " + num);
        num++;  // 修改静态变量值
        System.out.println("执行静态代码块");
    }
}
```

测试执行顺序：

```java
public class CodeBlockDemo {
    public static void main(String[] args) {
        System.out.println("num = " + CodeBlock.num);  // 不创建对象，只访问静态变量
        System.out.println("再次访问 num = " + CodeBlock.num);
        System.out.println("======================");
        CodeBlock cb1 = new CodeBlock();  // 创建第一个对象
        cb1.func();
        System.out.println("======================");
        CodeBlock cb2 = new CodeBlock();  // 创建第二个对象
        cb2.func();
    }
}
```

运行结果：

```
num的初始值: 100
执行静态代码块
num = 101          // 静态代码块执行后，num值已增加
再次访问 num = 101  // 只执行一次静态代码块
======================
num2的初始值: 10
执行构造代码块
num2 = 20        // 构造代码块修改了num2的值
执行构造方法
普通方法
======================
num2的初始值: 10  // 第二个对象，重新开始
执行构造代码块
num2 = 20
执行构造方法
普通方法
```

类加载和对象创建的完整流程如下：

1. 类加载
   - 静态成员变量初始化
   - 静态代码块执行（只执行一次）
2. 对象创建
   - 普通成员变量初始化
   - 构造代码块执行（每个对象都会执行）
   - 构造方法执行

#### 静态代码块案例

看一个实际的例子：设计一个交通信号灯类，要求信号灯之间有顺序关联。

```java
public class TrafficLight {
    private String label;          // 灯的颜色标签
    private TrafficLight nextLight; // 下一个亮的灯

    // 私有构造方法
    private TrafficLight(String label) {
        this.label = label;
    }

    // 预定义的三种灯
    public static final TrafficLight RED;
    public static final TrafficLight YELLOW;
    public static final TrafficLight GREEN;

    // 使用静态代码块初始化对象并设置它们之间的关系
    static {
        RED = new TrafficLight("红");
        YELLOW = new TrafficLight("黄");
        GREEN = new TrafficLight("绿");

        // 设置灯的切换顺序：红→绿→黄→红...
        RED.nextLight = GREEN;
        GREEN.nextLight = YELLOW;
        YELLOW.nextLight = RED;
    }

    public String getLabel() {
        return label;
    }

    public TrafficLight getNextLight() {
        return nextLight;
    }
}
```

使用这个类：

```java
public static void main(String[] args) {
    // 模拟信号灯切换
    TrafficLight current = TrafficLight.RED;

    for (int i = 0; i < 10; i++) {
        System.out.println("当前是" + current.getLabel() + "灯");
        current = current.getNextLight();  // 切换到下一个灯
    }
}
```

这个例子展示了静态代码块的强大之处：它不仅创建了对象，还在类加载时就建立了对象之间的关联，确保了系统状态的一致性和完整性。

# 接口

包饺子时，我们需要制作饺子皮，关键在于"擀平面团"这个动作，而不是具体用什么工具。
擀饺子皮可以用擀面杖、酒瓶，甚至保温杯，只要能把面团擀平即可。

这就是接口的精髓：定义"做什么"（如擀平面团），而不关心"怎么做"（用什么工具擀）。

**为什么需要接口？**

在面向对象编程中，你会发现一个大问题：**耦合**。

什么是耦合？简单说，就是两个模块（类、方法等）之间相互依赖的程度。耦合越高，修改一个模块就越可能影响到其他模块，代码就越难维护。

![](../../public/images/文章资源/java入门-面向对象【上篇】/file-20250626172103820.jpg)

上图中，类 A 直接依赖于类 B，这是高耦合的设计。如果 B 的实现发生变化，A 也必须跟着修改。

接口就是专门用来解决这个问题的！

### 接口的基本概念

接口（Interface）是一种类似于 class 的类型，但它只定义方法的"长相"（签名），不定义具体实现。
接口使用`interface`关键字定义：

```java
public interface Rollable {
    // 接口中的常量（默认是public static final）
    String DESCRIPTION = "可以滚动的物体";

    // 接口中的抽象方法（默认是public abstract）
    void roll(); // 只有方法声明，没有方法体
}
```

接口中可以包含：

- 常量：默认是`public static final`，可以省略不写
- 抽象方法：默认是`public abstract`，可以省略不写

接口就像是一份"契约"，实现这个接口的类必须遵守这份契约，提供所有接口中定义的方法。

回到擀饺子皮的例子，重点在于"擀"这个动作，而不是用什么工具。"擀"就是接口中的方法，具体用擀面杖、酒瓶、还是保温杯来擀，是接口实现类要考虑的事情。

通过引入接口，我们可以将 A 与具体实现解耦：

![](../../public/images/文章资源/java入门-面向对象【上篇】/file-20250626172112970.jpg)

类 A 不再直接依赖具体类，而是依赖于"Rollable"接口（定义了 roll()方法）。类 B、C、D 都实现了这个接口。这样 A 只需要知道"能滚动"这个能力，而不关心具体是哪个类实现了这个能力。

类通过`implements`关键字实现接口：

```java
public class Ball implements Rollable {
    @Override
    public void roll() {
        System.out.println("球在滚动");
    }
}
```

一个类可以同时实现多个接口：

```java
public class Ball implements Rollable, Bounceable, Colorful {
    @Override
    public void roll() {
        System.out.println("球在滚动");
    }

    @Override
    public void bounce() {
        System.out.println("球在弹跳");
    }

    @Override
    public void showColor() {
        System.out.println("这是一个红色的球");
    }
}
```

注意：

- 接口不能创建对象，只能被类实现
- 实现接口的类必须重写接口中所有的抽象方法，除非该类是抽象类
- 一个类可以实现多个接口，弥补 Java 单继承的局限性
- 接口也可以继承其他接口，使用 extends 关键字

这种设计方式让我们可以"面向接口编程"，而不是"面向实现编程"，提高了代码的灵活性和可维护性。

## 接口的好处

接口有两个主要优势：

### 弥补类单继承的不足

Java 类只能单继承，但可以实现多个接口，让一个对象拥有更多角色和能力：

```java
public class Student extends People implements Driver, Doctor {
    // 一个学生类继承了People类，同时实现了Driver和Doctor接口
    // 既是人，又能开车，还会看病
}

// 使用时可以有多种角色
People s1 = new Student();  // 作为人
Driver d1 = new Student();  // 作为司机
Doctor d2 = new Student();  // 作为医生
```

### 支持面向接口编程

接口让我们可以"面向接口编程"而不是"面向实现编程"，提高灵活性：

```java
// 定义接口
public interface Driver {
    void drive();
}

// 不同类实现同一接口
public class Teacher implements Driver {
    @Override
    public void drive() {
        System.out.println("老师开车去学校");
    }
}

public class Student implements Driver {
    @Override
    public void drive() {
        System.out.println("学生开车去旅游");
    }
}

// 使用时根据需要灵活选择实现类
Driver d1 = new Teacher();  // 选择老师实现
Driver d2 = new Student();  // 选择学生实现
```

面向接口编程是软件开发中流行的开发模式，能更灵活地实现解耦合。这样可以轻松替换具体实现，而不影响调用方代码，大大提高了程序的可维护性和扩展性。

### 依赖注入

依赖注入（Dependency Injection）是一种让类不再自己创建依赖对象，而是接收外部传入依赖的设计模式。这种方式有效降低了类之间的耦合度。

依赖注入有几种常见方式：

#### 1. 构造函数注入

通过构造函数传入依赖对象：

```java
public Order(Product product, int amount, Coupon coupon) {
    this.product = product;
    this.amount = amount;
    this.coupon = coupon; // 通过构造函数注入优惠券
}
```

使用时：

```java
// 创建具体的优惠券
Coupon coupon = new PriceDiscountCoupon(9000, 1000); // 满9000减1000

// 将优惠券注入到订单中
Order order = new Order(product, 2, coupon);
```

这种方式的优点是：创建对象的那一刻，所有必需的依赖就到位了，对象状态完整。适用于依赖不会变化的场景。

#### 2. Setter 注入

通过 setter 方法传入依赖对象：

```java
public void setCoupon(Coupon coupon) {
    this.coupon = coupon;
}
```

使用时：

```java
Order order = new Order(product, 2, null); // 先创建订单，暂不设置优惠券

// 后续根据条件设置不同的优惠券
if (isVip) {
    Coupon vipCoupon = new RateDiscountCoupon(0, 85); // 直接85折
    order.setCoupon(vipCoupon);
} else if (total >= 9000) {
    Coupon normalCoupon = new PriceDiscountCoupon(9000, 1000);
    order.setCoupon(normalCoupon);
}
```

这种方式的优点是：灵活性高，可以在对象创建后动态替换依赖。适用于依赖可能变化的场景。

### 接口分离原则

接口分离原则（Interface Segregation Principle）是一个重要的设计原则：一个接口应该只包含客户端需要的方法，不应该强迫客户端依赖它不用的方法。

通俗地说：接口应该小而精，专注于一个特定的功能领域，而不是大而全。

比如我们定义一个事件监听的接口：

```java
public interface EventListener {
    void onClick();      // 处理用户鼠标点击
    void onKeyDown(String key);  // 处理用户按下键盘
    void onChange();     // 监控用户输入内容变化
}
```

问题来了：如果一个类只需要处理鼠标点击，但不关心键盘和输入变化，使用这个接口就必须实现所有方法：

```java
public class PackageEventListener implements EventListener {
    @Override
    public void onClick() {
        System.out.println("展开包中的文件");
    }

    @Override
    public void onKeyDown(String key) {
        // 空实现，浪费代码
    }

    @Override
    public void onChange() {
        // 空实现，浪费代码
    }
}
```

遵循接口分离原则，应该将接口拆分：

```java
public interface MouseEventListener {
    void onClick();
}

public interface KeyEventListener {
    void onKeyDown(String key);
}

public interface InputChangeListener {
    void onChange();
}
```

这样，类就可以只实现它需要的接口：

```java
public class PackageEventListener implements MouseEventListener {
    @Override
    public void onClick() {
        System.out.println("展开包中的文件");
    }
}
```

### 多接口实现

Java 中一个类可以同时实现多个接口，这是 Java 实现"多继承"的方式：

```java
public class FileExplorer implements MouseEventListener, KeyEventListener {
    @Override
    public void onClick() {
        System.out.println("选中文件");
    }

    @Override
    public void onKeyDown(String key) {
        if ("Delete".equals(key)) {
            System.out.println("删除文件");
        }
    }
}
```

接口也可以继承其他接口，甚至可以多继承：

```java
public interface FullEventListener extends MouseEventListener, KeyEventListener, InputChangeListener {
    // 可以添加新的方法
    void onDoubleClick();
}
```

### 接口的特性演进(了解)

随着 Java 的发展，接口的功能逐渐增强，打破了"只能有方法声明"的传统限制：

- **常量**：接口中可以定义常量（默认是`public static final`）

  ```java
  public interface MathConstants {
      double PI = 3.14159265354979323846; // 等价于public static final double PI
  }
  ```

- **静态方法**：Java 8 开始，接口可以有静态方法实现

  ```java
  public interface Shape {
      double PI = 3.14159265354979323846;

      static double calculateCircumference(double radius) {
          return 2 * PI * radius;
      }
  }
  ```

- **默认方法**：Java 8 开始，接口可以提供默认实现

  ```java
  public interface Greetable {
      default void greet() {
          System.out.println("Hello!");
      }

      void greetBy(String name); // 仍需子类实现
  }
  ```

这些新特性使接口更加灵活，但也模糊了接口和抽象类的界限。在实际应用中，还是应该遵循"接口定义协议，抽象类提供部分实现"的原则。

# 内部类

内部类就是定义在另一个类内部的类。就像人体内有心脏，电脑里有 CPU，当一个类包含另一个完整的组件，且这个组件不需要单独设计时，就可以使用内部类。

```java
public class Computer {
    // 电脑类中包含CPU这个完整的组件
    public class CPU {
        // CPU的属性和方法
    }
}
```

Java 中的内部类主要有四种类型：

- 成员内部类：定义在类中方法外的内部类
- 静态内部类：使用 static 修饰的内部类
- 局部内部类：定义在方法中的内部类
- 匿名内部类：没有名字的内部类（重点）

## 成员内部类

成员内部类就像类的一个普通成员，类似于成员变量或成员方法。它没有 static 修饰，属于外部类的对象。

**创建成员内部类对象**

创建成员内部类对象的语法有些特别：

```java
// 语法：外部类名.内部类名 对象名 = new 外部类名().new 内部类名();
Outer.Inner in = new Outer().new Inner();
```

一个简单的例子：

```java
// 外部类
public class Outer {
    // 成员内部类
    public class Inner {
        private String name;

        public void show() {
            System.out.println("内部类方法执行");
        }
    }
}
```

使用内部类：

```java
public static void main(String[] args) {
    // 创建内部类对象
    Outer.Inner in = new Outer().new Inner();
    in.show();
}
```

**成员内部类的访问特点**

成员内部类最大的特点是：可以直接访问外部类的所有成员，包括私有成员。

```java
public class People {
    private int heartBeat = 110;  // 外部类的私有成员

    // 成员内部类
    public class Heart {
        private int heartBeat = 95;  // 内部类的成员

        public void show() {
            int heartBeat = 80;  // 局部变量
            System.out.println(heartBeat);        // 访问局部变量：80
            System.out.println(this.heartBeat);   // 访问内部类成员：95
            System.out.println(People.this.heartBeat);  // 访问外部类成员：110
        }
    }
}
```

使用这个例子：

```java
public static void main(String[] args) {
    People.Heart heart = new People().new Heart();
    heart.show();
}
```

成员内部类的特点总结：

1. 可以直接访问外部类的所有成员（包括私有成员）
2. 可以使用`外部类名.this`获取外部类对象引用
3. 必须先创建外部类对象，才能创建内部类对象

成员内部类就像是外部类的一个特殊成员，它能够无障碍地访问外部类的所有内容，同时又能像一个独立的类一样定义自己的成员。

## 静态内部类

在类里面用 static 修饰的内部类。它和普通的成员内部类不一样，**属于外部类本身**，不是外部类的某个对象。

有时候，内部类的功能其实和外部类对象没啥关系，只是逻辑上归在一起。用 static 修饰后，这个内部类就不再依赖外部类对象了，节省内存，也更清晰。

```java
public class Outer {
    static String schoolName = "清华大学";
    int height = 180;

    // 静态内部类
    public static class Inner {
        public void show() {
            // 1. 可以直接访问外部类的静态成员
            System.out.println(schoolName);
            // 2. 不能直接访问外部类的实例成员
            // System.out.println(height); // 错误
        }
    }
}
```

静态内部类的对象创建，不需要外部类对象，直接用“外部类名.内部类名”：

```java
Outer.Inner in = new Outer.Inner();
in.show();
```

如果真的要访问外部类的实例成员，也不是不行，只是要先 new 外部类对象：

```java
public void show() {
    Outer o = new Outer();
    System.out.println(o.height);
}
```

## 局部内部类

定义在方法、代码块、构造器等局部范围里的类。作用域只在当前代码块内，出了这个范围就没法用了。

有时候，只是想在某个方法里临时用一下小工具类，没必要让它暴露在整个类里。

```java
public void doSomething() {
    // 局部内部类
    class Helper {
        public void help() {
            System.out.println("帮忙中...");
        }
    }
    Helper h = new Helper();
    h.help();
}
```

注意：只能在当前方法里用，出了方法就没法访问了。

实际开发中用得不多，更多是为了代码结构的局部封装。如果经常用，可能要考虑是不是设计有问题。

## 匿名内部类(重点)

匿名内部类其实就是“没有名字的内部类”，本质上是一个临时用一次的小类，通常用来**快速创建某个接口或抽象类的子类对象**，而且只用一次就扔，不需要专门起名字。

举个例子，假设有个接口：

```java
public interface Swimming {
    void swim();
}
```

平时我们要用它，得先写个实现类：

```java
public class Student implements Swimming {
    @Override
    public void swim() {
        System.out.println("学生游泳");
    }
}
```

然后 new 出来用：

```java
Swimming s = new Student();
s.swim();
```

但如果只是临时用一下，写个类太麻烦，这时候就可以用匿名内部类：

```java
Swimming s = new Swimming() {
    @Override
    public void swim() {
        System.out.println("学生贼溜~~~");
    }
};
s.swim(); // 输出：学生贼溜~~~
```

你会发现，`new Swimming() { ... }` 这段代码，直接在 new 的时候就把类的内容写出来了，**省略了类名，也不用单独写类文件**。

**匿名内部类的本质**

- 它其实就是“临时写了一个子类”，并且**立刻 new 出一个对象**。
- 你没给它起名字，Java 会自动帮你生成一个“当前类名$编号”的名字（比如 Test2$1）。
- 只能用一次，不能复用。

**匿名内部类的常见用法**

最常见的场景，就是**把它当作参数传给方法**，比如：

```java
public static void go(Swimming s) {
    System.out.println("开始...");
    s.swim();
    System.out.println("结束...");
}
```

用匿名内部类传参：

```java
go(new Swimming() {
    @Override
    public void swim() {
        System.out.println("老师贼慢~~~");
    }
});
```

输出：

```
开始...
老师贼慢~~~
结束...
```

- 匿名内部类**只能用来继承一个类或实现一个接口**，而且只能用一次。
- 里面可以重写父类/接口的方法，直接写方法体。
- 常用于回调、事件监听、临时实现某个功能。

# 枚举

枚举（enum）其实就是一种特殊的类，用来表示一组**有限且固定的常量**。比如星期、月份、操作类型等。

以前我们经常用一堆 `public static final int` 常量来表示状态，比如：

```java
public class Constant {
    public static final int DOWN = 1;
    public static final int UP = 2;
    public static final int HALF_UP = 3;
    public static final int DELETE_LEFT = 4;
}
```

这样写虽然能用，但有两个问题：

- 参数值不受约束，随便传个 5、6 也能进来，容易出错
- 可读性一般，维护起来麻烦

用枚举就很优雅了，直接把所有可能的取值都列出来：

```java
public enum RoundingMode {
    DOWN, UP, HALF_UP, DELETE_LEFT;
}
```

每个名称其实就是一个常量对象，类型就是 `RoundingMode`。

比如我们要写一个方法，支持不同的取整方式：

```java
public static double handleData(double number, RoundingMode mode) {
    switch (mode) {
        case DOWN:
            return Math.floor(number);
        case UP:
            return Math.ceil(number);
        case HALF_UP:
            return Math.round(number);
        case DELETE_LEFT:
            return (int) number;
        default:
            throw new IllegalArgumentException("未知取整方式");
    }
}
```

调用的时候，参数只能是枚举里的四种，写错编译器直接报错：

```java
System.out.println(handleData(3.9991, RoundingMode.DOWN));     // 3.0
System.out.println(handleData(5.9991, RoundingMode.HALF_UP));  // 6.0
```

**枚举的本质和特点**

```java
public enum RoundingMode {
    DOWN, UP, HALF_UP, DELETE_LEFT;
}
```

其实 Java 编译器在背后会帮你生成一堆“看不见的”源代码。大致等价于下面这样（省略了部分细节，但核心结构是这样的）：

```java
public final class RoundingMode extends java.lang.Enum<RoundingMode> {
    // 1. 四个 public static final 的对象，分别代表每个枚举值
    public static final RoundingMode DOWN = new RoundingMode("DOWN", 0);
    public static final RoundingMode UP = new RoundingMode("UP", 1);
    public static final RoundingMode HALF_UP = new RoundingMode("HALF_UP", 2);
    public static final RoundingMode DELETE_LEFT = new RoundingMode("DELETE_LEFT", 3);

    // 2. 用于存放所有枚举值的数组
    private static final RoundingMode[] VALUES = {DOWN, UP, HALF_UP, DELETE_LEFT};

    // 3. 构造器是私有的，外部不能 new
    private RoundingMode(String name, int ordinal) {
        super(name, ordinal);
    }

    // 4. 返回所有枚举值
    public static RoundingMode[] values() {
        return VALUES.clone();
    }

    // 5. 通过名字查找枚举对象
    public static RoundingMode valueOf(String name) {
        for (RoundingMode mode : VALUES) {
            if (mode.name().equals(name)) {
                return mode;
            }
        }
        throw new IllegalArgumentException("No enum constant: " + name);
    }
}
```

- `values()` 方法返回所有枚举对象的数组。
- `valueOf(String)` 可以通过名字查找对应的枚举对象。

每个枚举值（DOWN、UP、HALF_UP、DELETE_LEFT）其实就是 `public static final` 的对象，系统帮你 new 好了。

构造器是私有的，外部 new 不出来。

这个类还自动继承了 `java.lang.Enum`，所以有很多和枚举相关的内置方法，比如 `name()`、`ordinal()` 等。

# 泛型

泛型（Generic）就是在定义类、接口、方法时，不直接指定某种具体类型，而是用一个“类型变量”来占位，等到用的时候再指定具体类型。常见的类型变量有 E、T、K、V 等，都是大写字母。

泛型的最大作用，就是**让编译器帮我们检查类型安全**，避免强制类型转换带来的麻烦和隐患。比如：

```java
ArrayList<String> list = new ArrayList<>();
list.add("张三");
// list.add(123); // 编译报错，类型不对
```

有了泛型，类型不对直接编译不过，安全又省心。

## 泛型类

定义格式：

```java
public class MyArrayList<E> {
    public boolean add(E e) { ... }
    public boolean remove(E e) { ... }
}
```

用法：

```java
MyArrayList<String> list = new MyArrayList<>();
list.add("张无忌");
list.add("赵敏");
list.remove("张无忌");
```

- `E` 代表“Element”，你也可以用 `T`（Type）、`K`（Key）、`V`（Value）等。
- 泛型类的本质，就是把类型当作参数传进来，等用的时候再确定。

## 泛型接口

定义格式：

```java
public interface DataService<T> {
    void save(T data);
}
```

实现时可以指定类型：

```java
public class StringService implements DataService<String> {
    public void save(String data) { ... }
}
```

## 泛型方法

有时候，方法本身也可以很通用，这时可以单独给方法加泛型：

```java
public static <T> void print(T t) {
    System.out.println(t);
}
```

用法：

```java
print("hello");
print(123);
```

## 通配符

有时候我们希望“泛型类型不确定”，这时可以用 `?` 作为通配符：

```java
public void printList(List<?> list) {
    for (Object obj : list) {
        System.out.println(obj);
    }
}
```

**泛型的上下限**

- `? extends Car`：只能接收 Car 或 Car 的子类(常用)
- `? super Car`：只能接收 Car 或 Car 的父类

例子：

```java
List<? extends Number> list1; // 只能放 Number 及其子类
List<? super Integer> list2;  // 只能放 Integer 及其父类
```

- 泛型只在编译阶段有效，编译后 class 文件里就没有泛型信息了（这叫“泛型擦除”）。
- 泛型不能直接用基本数据类型（如 int、double），只能用引用类型（如 Integer、Double）。
