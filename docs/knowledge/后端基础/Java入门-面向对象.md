---
title: Java入门-面向对象
date: 2024-12-25 13:39:20
description: 这是一篇新文章!
order: 2
publish: true
tags:
  - Java
---

# 类

在 Java 的世界里，类和对象是最基础也是最核心的概念。想要真正理解它们的关系，不妨用一个生活中的例子来类比：

想象一下"蛋糕模具"和"蛋糕"的关系：

- 类就像是一个蛋糕模具：它定义了形状、大小等特征，但本身不能吃。
- 对象就像是用模具做出来的一个个实际的蛋糕：可以有各种口味，可以真正享用。

### 类的组成

在 Java 中：

- 类中的变量叫 **成员变量**，描述事物的特征（比如蛋糕的大小、颜色）
- 类中的方法叫 **成员方法**，描述事物能做什么（比如蛋糕可以切开、可以品尝）

类的定义语法很直观：

```Java
修饰符 class 类名 {
    // 属性（成员变量）- 不需要手动初始化，Java会提供默认值
    数据类型 变量名;

    // 行为（成员方法）
    public 返回类型 方法名(参数列表) {
        // 方法体：实现具体功能
    }
}
```

### 从类到对象

有了类这个"模具"，我们就可以创建具体的对象了。创建和使用对象的方式很简单：

```Java
// 创建对象
类名 对象名 = new 类名();

// 调用对象的方法
对象名.方法名(参数);

// 访问对象的属性
对象名.属性名;
```

理解对象在内存中如何存储，对于掌握 Java 程序运行机制非常重要：

- 局部变量存在 **栈** 内存中 — 存取速度快，但空间有限
- 对象实体存在 **堆** 内存中 — 空间充足，生命周期较长
- 对象的引用（地址）存在栈中 — 就像是对象的"门牌号"，指向堆中的实际对象

如果所有东西（包括完整的对象）都放在栈内存中，系统会很快耗尽高速内存；如果只用堆内存，访问速度又会太慢。这种"门牌号指向实物"的设计，正是为了平衡性能和存储能力的需求。

# 封装

封装（Encapsulation）是面向对象的第一大特性，简单来说，就是：

> 合理隐藏，合理暴露

- 把相关的数据和操作这些数据的方法打包在一起
- 对外隐藏实现细节，只公开必要的接口

就像手机一样，你只需要知道怎么按按钮，不需要知道内部电路怎么工作。

## 从过程式到面向对象的转变

为什么需要封装？让我们用一个计算薪资的例子来对比：

**过程式风格**（所有数据和方法分离）：

```java
public class SalaryDemo {
    public static void main(String[] args) {
        // 数据散落各处
        int baseSalary = 5000;
        int bonus = 10000;
        char grade = 'B';

        // 独立的方法处理数据
        int salary = calculateSalary(baseSalary, bonus, grade);
        System.out.println(salary);
    }

    public static int calculateSalary(int baseSalary, int bonus, char grade) {
        double rate = switch (grade) {
            case 'A' -> 1.0;
            case 'B' -> 0.8;
            case 'C' -> 0.6;
            case 'D' -> 0.4;
            default -> 0;
        };
        return baseSalary + (int)(bonus * rate);
    }
}
```

在这种写法中，**数据和逻辑是分开的**。你在方法里传来传去各种参数，每次调用都要自己组装数据，代码虽然直白，但不够紧凑，维护起来容易出错。

**面向对象风格**（数据和方法封装在一起）：

```java
// 定义员工类
public class Employee {
    // 数据（属性）和方法放在一起
    int baseSalary;
    int bonus;

    // 计算薪资的方法直接访问类内部的数据
    public int calculateSalary(char grade) {
        double rate = switch (grade) {
            case 'A' -> 1.0;
            case 'B' -> 0.8;
            case 'C' -> 0.6;
            case 'D' -> 0.4;
            default -> 0;
        };
        return baseSalary + (int)(bonus * rate);
    }
}
```

这段代码的核心转变在于：

> 数据（`baseSalary`、`bonus`）和处理逻辑（`calculateSalary`）被**封装**在了一个对象内部。

外部使用者不再关心怎么计算奖金比例，只需要说：“喂，`employee`，你来算算你自己的工资”。

使用这个员工类：

```java
public static void main(String[] args) {
    // 创建员工对象
    Employee employee = new Employee();

    // 设置属性值
    employee.baseSalary = 5000;
    employee.bonus = 10000;

    // 调用方法计算薪资
    int salary = employee.calculateSalary('A');
    System.out.println(salary);
}
```

现在的使用方式是不是更清爽了？调用者不需要操心任何细节，只需要设置参数，然后问对象：“你自己的工资是多少？”

- 封装让代码更清晰，职责更明确；
- 封装让对象拥有“自我管理”的能力 ，逻辑和数据紧密绑定；
- 封装减少了外部对内部结构的依赖，提高了**维护性与安全性**。

说到底，它的目的就是：

> **让使用者只看到“操作界面”，而看不到“内部电路”**。

这不仅仅是代码风格问题，而是软件设计中**组织复杂性**的一种武器。

## Getter 和 Setter

现在的问题是：员工的属性可以被任意修改，没有任何限制。比如可能会设置负数的工资！

解决方案：

1. 将属性设为私有（private）
2. 提供公开的方法来访问和修改这些私有属性

```java
public class Employee {
    // 私有化属性，外部不能直接访问
    private int baseSalary;
    private int bonus;

    // 提供设置基本工资的方法，可以添加验证逻辑
    public void setBaseSalary(int baseSalary) {
        // 添加验证逻辑
        if (baseSalary < 0) {
            System.out.println("基本工资不能为负数！");
            return;
        }
        // 通过this关键字区分成员变量和参数
        this.baseSalary = baseSalary;
    }

    // 提供获取基本工资的方法
    public int getBaseSalary() {
        return baseSalary;
    }

    // 同样方式处理bonus属性
    // ...
}
```

`this`关键字表示"当前对象"，用来区分成员变量和同名的局部变量。

### 字段与属性

在 Java 面向对象编程中，**字段（Field）**和**属性（Property）**是两个容易混淆的概念，但它们有明确的区别：

- **字段**：类中直接声明的变量
- **属性**：有 getter/setter 的字段

不是所有字段都是属性，但所有属性都是字段。

**字段（Field）**

字段就是类中直接声明的变量，也叫成员变量：

```java
public class Student {
    private String name;    // 这是字段
    private int age;        // 这也是字段
    public String school;   // 这还是字段
}
```

**属性（Property）**

属性是**字段 + getter/setter 方法**的组合。只有**同时具备** getter 和 setter 的字段，才能称为属性：

```java
public class Student {
    private String name;  // 字段

    // getter 和 setter 方法
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
```

这样，`name` 就既是字段，也是属性。

### JavaBean

JavaBean 是 Java 中一种特殊的类规范，主要用于封装数据。**由字段（属性，包含 getter+setter）组成的类就是 JavaBean**。

JavaBean 的标准规范包括：

1. **私有字段**：所有字段都用 `private` 修饰
2. **公共访问器**：提供 `public` 的 getter 和 setter 方法
3. **无参构造器**：必须有一个无参数的构造方法

```java
public class Student implements Serializable {
    // 1. 私有字段
    private String name;
    private int age;

    // 2. 无参构造器
    public Student() {}

    // 3. 公共访问器
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getAge() {
        return age;
    }

    public void setAge(int age) {
        this.age = age;
    }
}
```

JavaBean 通过私有字段  +  公共访问器的设计，既保护数据安全，又让框架能通过反射动态访问属性。
这种标准化格式让它成为数据传输和框架配置的通用解决方案，几乎所有主流框架都基于 JavaBean  规范工作。

## 构造方法

在 Java 中，**构造方法** (constructor) 是一种特殊的方法，用于在创建对象时执行初始化操作。它的名称必须与类名**完全一致**，而且**没有返回值**。

当我们使用`new`关键字创建对象时，其实是在调用**构造方法**：

```java
Employee employee = new Employee(); // 调用了构造方法
```

构造方法没有返回值，连 `void` 也不能写，如果写了就成为与类同名的普通方法了，而不是构造方法：

```java
public class Example {
    public Example() {}  // 构造函数
    public void Example() {}  // 合法方法（不推荐）
}
```

### 无参构造方法

如果你**没有定义任何构造方法**，Java 会自动提供一个**默认的无参构造方法**，让你能创建对象而不传入任何参数：

```java
public class Employee {
    // Java 会自动生成如下的构造方法：
    // public Employee() { }
}
```

但要注意：
一旦你手动定义了任意构造方法（哪怕是有参的），这个默认的构造方法就不会再自动生成。

如果你还需要无参构造，就必须自己显式写出来：

```java
public class Employee {
    public Employee() {
        // 显式定义无参构造方法
    }
}
```

### 有参构造方法

构造方法可以定义参数，用于在创建对象时顺便完成属性赋值。这类构造方法被称为有参构造方法：

```java
public class Employee {
    private int baseSalary;
    private int bonus;

    public Employee(int baseSalary, int bonus) {
        this.baseSalary = baseSalary;
        this.bonus = bonus;
    }
}
```

通过参数构造对象，可以直接初始化字段：

```java
Employee emp = new Employee(10000, 2000);
```

这样，在需要创建多个对象时，比 `对象.属性` 的初始化方式方便很多。

## 权限修饰符

Java 提供了四种权限修饰符，控制类成员的可访问范围：

| 修饰符       | 本类内部 | 同一个包 | 子类 | 其他包的类 |
| ------------ | -------- | -------- | ---- | ---------- |
| private      | ✓        | ✗        | ✗    | ✗          |
| 默认（不写） | ✓        | ✓        | ✗    | ✗          |
| protected    | ✓        | ✓        | ✓    | ✗          |
| public       | ✓        | ✓        | ✓    | ✓          |

设计类时，应遵循"最小权限原则"，只给必要的访问权限。对于需要被子类访问但不想对外公开的成员，protected 是最佳选择。

# 继承

继承（Inheritance）是面向对象的第二大特性，同样简单来说，就是：

> 子类可以获得父类的特征和行为

在现实生活中，子女会从父母那里继承一些特征，比如长相、性格等。在 Java 编程中，继承也是类似的概念：

- 父类（基类）：定义共有的属性和方法
- 子类（派生类）：可以直接使用父类的特征，并添加自己的特色

**继承的核心好处**：代码复用 + 类的层次结构。

想象一个电商系统，有各种各样的商品：

```
商品（共有：名称、价格）
├── 实体商品（特有：重量、需要物流）
└── 虚拟商品（特有：卡密、无需物流）
```

所有商品都有"名称"和"价格"，如果不使用继承，每种商品类都需要重复编写这些属性和对应的方法。这会导致：

- 代码大量重复
- 后期维护困难（如修改价格计算逻辑时，需要修改多处代码）
- 缺乏统一管理的能力

继承解决了这个问题，它带来两个核心好处：

- 代码复用：子类自动获得父类的属性和方法
- 逻辑层次结构：形成清晰的类之间的关系体系

## `extends` 实现继承

Java 使用 extends 关键字实现继承：

```java
// 父类：Product
public class Product {
    private String name;    // 商品名称
    private double price;   // 商品价格

    // 显示商品信息的方法
    public String displayInfo() {
        return "商品名称：" + name + "，商品价格：" + price;
    }

    // getter和setter方法
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }

    // 构造方法
    public Product() { }

    public Product(String name, double price) {
        this.name = name;
        this.price = price;
    }
}
```

然后定义子类，使用`extends`关键字继承父类：

```java
// 子类：PhysicalProduct
public class PhysicalProduct extends Product {
    private double weight;  // 特有属性：重量

    // 只需要添加子类特有的属性和方法
    public double getWeight() { return weight; }
    public void setWeight(double weight) { this.weight = weight; }
}
```

这样，`PhysicalProduct` 类自动拥有了 `name`、`price` 属性以及相关方法，无需重复编码。

> 在 Java 中，所有的类都直接或间接继承自`Object`类。如果没有明确指定父类，则默认继承 Object 类。

## `super` 访问父类成员

父类的属性（name、price）都是 private 的，子类无法直接访问它们。那怎么才能在创建子类对象时，同时初始化这些父类的属性呢？

如果子类和父类有同名的成员，使用`super`关键字可以明确指定访问父类的成员：

- `super.变量名`：访问父类的成员变量
- `super.方法名()`：调用父类的方法

这在处理父子类同名成员时特别有用：

```java
public class Child extends Parent {
    private String name = "小明";  // 与父类同名

    public void printName() {
        System.out.println(name);       // 访问自己的name："小明"
        System.out.println(super.name); // 访问父类的name："张三"
    }
}
```

## 构造方法与继承

子类构造器有一个重要特性：**必须先调用父类的构造器，再执行自己的代码**。这就像盖房子，必须先有地基（父类），才能建上层结构（子类）。

Java 的规则是：子类构造器的第一行代码，必须是调用父类的构造器。

```java
public class Child extends Parent {
    private int age;

    public Child() {
        // 这里有一行隐式的代码：super()
        System.out.println("Child构造器执行");
    }
}
```

如果你没有明确调用父类构造器，Java 会自动插入 `super()` 调用。但如果父类没有无参构造器，你必须显式调用其有参构造器：

```java
public class Parent {
    private String name;

    // 只有有参构造器
    public Parent(String name) {
        this.name = name;
    }
}

public class Child extends Parent {
    private int age;

    public Child(String name, int age) {
	    // super(); 报错,父类没有无参构造器
        super(name);  // 必须显式调用父类构造器
        this.age = age;
    }
}
```

除了刚刚提到的  super()  构造器，Java 中还提供了另一个特殊的构造器调用方式。

- `this()`：调用同一个类中的其他构造器
- `super()`：调用父类的构造器

构造器之间可以相互调用，这样能够有效复用代码，避免重复编写相同的初始化逻辑。

```java
public class Child extends Parent {
    public Child() {
        super("默认名字");  // 调用父类构造器
    }

    public Child(String name, int age) {
        this();  // 调用本类的无参构造器，间接调用了super
        // 不能再写super()，因为this()已经在第一行了
    }
}
```

记住：`super()` 和 `this()`都必须放在构造器的第一行，所以它们不能同时使用。

## `@Override` 方法覆写

子类可以"覆写"父类的方法，提供自己特有的实现：

比如，父类的 displayInfo() 方法只显示名称和价格，但实体商品还应该显示重量：

```java
@Override
public String displayInfo() {
    // 调用父类的方法，获取基本信息
    return super.displayInfo() + "，商品重量：" + weight + "g";
}
```

`@Override`注解不是必须的，但建议使用，它可以帮助编译器检查是否正确覆写了父类方法。

> IDEA 快捷键：`Ctrl + O` 可以快速覆写父类的方法

如果不希望某个方法被子类覆写，可以使用`final`关键字，后面的章节会详细介绍 `final`：

```java
public final void doNotOverrideMe() {
    // 这个方法不能被子类覆写
}
```

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

> Java 的 `main` 是 JVM 找类入口的标记，写 `static` 是为了**不用创建对象就能执行启动逻辑**。

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

# 多态

多态（Polymorphism）是面向对象的第三大特性，简单说就是：

> 同一种操作作用于不同的对象，可以产生不同的行为

多态就像一个万能遥控器，可以控制不同的电视品牌 - 按"音量+"按钮，不同电视都会增大音量，但对于具体的电视品牌，实现方式可能各不相同。
多态让我们可以用统一的方式处理不同类型的对象，大大提高代码的灵活性和可扩展性。

多态表现为两种形式：

- **对象多态**：父类引用可以指向子类对象

```java
People p1 = new Student();
People p2 = new Teacher();
```

- **行为多态**：同一方法调用会根据实际对象类型产生不同行为

```java
p1.run();  // 执行Student类的run方法
p2.run();  // 执行Teacher类的run方法
```

## 实现多态

要实现多态，必须同时满足三个条件：

1. 存在继承或实现关系
2. 子类重写父类的方法
3. 父类引用指向子类对象

多态最常见的应用是让父类引用指向子类对象：

```java
// 动物父类
public class Animal {
    public void makeSound() {
        System.out.println("动物发出声音");
    }
}

// 狗类
public class Dog extends Animal {
    @Override
    public void makeSound() {
        System.out.println("汪汪汪");
    }

    // 狗特有的方法
    public void fetchBone() {
        System.out.println("狗狗叼回骨头");
    }
}

// 猫类
public class Cat extends Animal {
    @Override
    public void makeSound() {
        System.out.println("喵喵喵");
    }

    // 猫特有的方法
    public void catchMouse() {
        System.out.println("猫咪抓老鼠");
    }
}
```

然后通过这个父类引用调用方法，实际执行的是子类中的方法：

```java
public static void main(String[] args) {
    // 父类引用指向子类对象
    Animal animal1 = new Dog();  // animal1是Animal类型，但实际是Dog对象
    Animal animal2 = new Cat();  // animal2是Animal类型，但实际是Cat对象

    // 同一个方法调用会根据实际对象类型产生不同行为
    animal1.makeSound();  // 输出"汪汪汪"
    animal2.makeSound();  // 输出"喵喵喵"
}
```

**多态的实际应用价值**
多态非常适合处理一组相似但不完全相同的对象：

```java
// 通用的喂食方法，可以接受任何动物
public static void feedAnimal(Animal animal) {
    System.out.println("准备食物...");
    animal.makeSound();  // 动物会发出自己特有的声音
    System.out.println("开始进食");
}
```

使用时可以传入任何 Animal 的子类：

```java
// 可以喂任何一种动物，不需要为每种动物单独写方法
feedAnimal(new Dog());  // 汪汪汪
feedAnimal(new Cat());  // 喵喵喵
```

**多态的限制**

使用父类引用时，只能调用父类中声明的方法，不能直接调用子类特有的方法：

```java
Animal animal = new Dog();
animal.makeSound();  // 可以调用，因为Animal类中定义了此方法
// animal.fetchBone();  // 编译错误！Animal类中没有此方法
```

通过父类引用，只能调用父类中定义的方法，不能直接调用子类特有的方法。如果需要调用子类特有方法，需要向下转型。

## 类型转换

多态状态下，父类引用可以调用重写的方法，但无法直接访问子类特有的方法和属性。这时，我们就需要使用类型转换来"释放"子类的全部功能。

> 向上转型简单，向下转型需谨慎

### 向上转型（Upcasting）

子类对象赋值给父类引用，这种转换是自动的、安全的：

```java
// 向上转型：从子类到父类，自动进行
Dog dog = new Dog();
Animal animal = dog;  // 自动转换，不需要强制类型转换
```

向上转型非常常见，它是多态的基础。但需要注意，向上转型后：

- 可以调用父类中定义的所有方法
- 可以调用子类重写@override 的方法（多态）
- 不能调用子类特有的方法

```java
Animal animal = new Dog();
animal.makeSound();  // 正常调用：输出"汪汪汪"
// animal.fetchBone();  // 错误：Animal类没有此方法
```

**这就是 Java 的“动态绑定”（运行时绑定）**，编译看左边运行看右边。

- 编译器只看引用类型（你是 Animal，我就认你会 makeSound）
- 运行时 JVM 再看实际对象（你其实是 Dog，那我就执行 Dog 的 makeSound）

### 向下转型（Downcasting）

父类引用转换回子类引用，这种转换必须显式进行，且有风险：

```java
// 向下转型：从父类到子类，必须显式转换
Animal animal = new Dog();  // 首先有一个指向Dog对象的Animal引用
Dog dog = (Dog) animal;     // 显式向下转型
dog.fetchBone();            // 现在可以调用Dog特有的方法了
```

为什么需要向下转型？主要是为了访问子类特有的功能：

```java
public static void playWithDog(Animal animal) {
    // 处理所有动物共有的行为
    animal.makeSound();

    // 如果是狗，还要玩特有的游戏
    if (animal instanceof Dog) {
        Dog dog = (Dog) animal;  // 向下转型
        dog.fetchBone();         // 调用Dog特有方法
    }
}
```

### `instanceof` 类型安全检查

向下转型有一个重大风险：如果实际对象不是目标类型，会抛出`ClassCastException`异常。

```java
Animal animal = new Cat();  // animal实际指向Cat对象
// Dog dog = (Dog) animal;  // 危险！运行时会抛出ClassCastException异常
```

为了避免这种错误，应该在转型前使用 `instanceof` 运算符进行类型检查：

```java
// 安全的向下转型
if (animal instanceof Dog) {
    Dog dog = (Dog) animal;  // 只有确认是Dog才转换
    dog.fetchBone();
} else {
    System.out.println("这不是一只狗，无法执行狗特有的动作");
}
```

instanceof 运算符可以判断对象是否为指定类型或其子类型的实例，返回布尔值：

```java
Animal animal = new Dog();
boolean isDog = animal instanceof Dog;    // true
boolean isCat = animal instanceof Cat;    // false
boolean isAnimal = animal instanceof Animal;  // true（所有Dog也是Animal）
```

通过合理使用多态和类型转换，我们可以编写出更灵活、可扩展的面向对象程序。

### Java 16 后的模式匹配（了解）

从 Java 16 开始，提供了更简洁的类型检查和转换语法：

```java
// 传统方式
if (animal instanceof Dog) {
    Dog dog = (Dog) animal;
    dog.fetchBone();
}

// Java 16+ 模式匹配
if (animal instanceof Dog dog) {  // 类型检查并直接赋值
    dog.fetchBone();  // 可以直接使用转换后的变量
}
```

类型转换是一个强大但潜在危险的工具。通过良好的面向对象设计，我们可以最小化对它的依赖，创建更加健壮的代码。

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

**为什么需要单例？**

某些类创建多个实例会导致问题或资源浪费：

- 数据库连接池：维护多个会消耗过多资源
- 系统设置：应用中只需要一份配置信息
- 线程池：集中管理线程资源更高效
- 日志记录器：统一记录日志避免冲突

**如何实现单例？**

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

# 单例的实现方式

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

# 抽象类

有时候，我们只想定义一个"框架"或"骨架"，而不关心具体实现细节。
抽象类就是为这种需求而生的——它介于普通类和接口之间的一种特殊类型。

> 抽象类像一个“半成品”的模具。
> 它本身不能用，必须交给“工厂”（子类）去完善细节并生产出成品（实例）。
> 如果没人接手（继承）这个模具，它就废了。

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

接口解决了"必须实现"的问题，但接口不能有构造方法，它不能包含交通工具的共同属性和方法。

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

## 抽象类的特性

抽象类有几个重要特点：

1. **不能被实例化**：

   - **原因**：抽象类本质是**不完整的模板**（含未实现的抽象方法）
   - **后果**：若强行  `new`  会导致调用**空壳方法** → 程序崩溃

2. **必须被继承才有价值**

```java
abstract class Vehicle {
    protected int speed; // 具体字段（子类可继承）

    // 具体方法（子类可直接复用）
    public void startEngine() {
        System.out.println("引擎启动...");
    }

    // 抽象方法（强制子类实现）
    public abstract void move();
}
```

子类继承并补全功能：

```java
class Car extends Vehicle {
    @Override
    public void move() {
        System.out.println("汽车行驶，时速：" + speed + "km/h");
    }
}
```

3. **支持多态**：可以用抽象类类型引用指向子类对象

```java
Vehicle vehicle = new Car(); // 多态精髓
vehicle.startEngine(); // 调用父类具体方法
vehicle.move();       // 动态执行Car的move()方法

// 输出：
// 引擎启动...
// 汽车行驶，时速：80km/h
```

4. **子类必须实现所有抽象方法**

```java
abstract class Animal {
    public abstract void eat(); // 抽象方法
}
```

具体子类要么实现所有抽象方法，要么接着保持抽象类，这是 Java 的硬性规定

```java
class Dog extends Animal {
    @Override
    public void eat() { System.out.println("啃骨头"); }
}

// 未实现 → 编译错误！
class Cat extends Animal { }

// 接着保持抽象子类可暂时逃避（但最终需有具体类实现）
abstract class Bird extends Animal { }
```

## 番外-模板方法设计模式

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

# 接口

包饺子时，我们制作饺子皮时关键在于"擀平面团"，可以用擀面杖、酒瓶甚至保温杯 —— 只要能完成这个动作即可。

这正是接口的精髓：

> 定义"做什么"，而不关心"怎么做"。

在编程中，最大的问题之一就是耦合，也就是模块间的依赖程度。耦合度高，一个类改变，依赖它的所有类都得跟着改，代码维护成本直线上升。

接口就是为解决这个问题而生的！

## 认识接口

接口（Interface）是一种类似于 class 的类型，但它只定义方法的"长相"（签名），不定义具体实现。

> 接口像一份“能力清单”或“合同”。
> 它本身不能做事，必须有“员工”（实现类）来签字画押，承诺具备清单上列出的所有能力（方法）。
> 如果没人签（实现）这份合同，它就只是一张废纸。

接口使用`interface`关键字定义：

```java
public interface Rollable {
    // 接口中的常量（默认是public static final）
    String DESCRIPTION = "可以滚动的物体";

    // 接口中的抽象方法（默认是public abstract）
    void roll(); // 只有方法声明，没有方法体
}
```

接口中包含：

- 必须是常量，自动以 `public static final` 声明
- 必须是抽象方法，自动以 `public abstract` 声明

注意：

- 接口不能有构造方法，更不能直接实例化

> 不过，从 Java 8 开始，接口还可以包含：
>
> - 默认方法（使用 default 关键字，有方法体）
> - 静态方法（使用 static 关键字）
>
> 从 Java 9 开始，还可以包含：
>
> - 私有方法（使用 private 关键字）

通过引入接口，我们可以将 A 与具体实现解耦：

![](../../public/images/文章资源/java入门-面向对象/file-20250626172112970.jpg)

类 A 不再直接依赖具体类，而是依赖于"Rollable"的“能力清单”。实现类 B、C、D 都有这个能力。
这样 A 只需要知道有这个能力，而不关心具体是谁实现了这个能力。

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

- 一个类可以实现多个接口，弥补 Java 单继承的局限性
- 接口也可以继承其他接口，使用 extends 关键字

这种设计方式让我们可以"面向接口编程"，而不是"面向实现编程"，提高了代码的灵活性和可维护性。

## 接口的特点

接口同样有几个重要特点，这些特点与抽象类相似：

1. **不能被实例化**：

   - **原因**：接口是**纯粹的行为契约**（传统接口无任何方法实现）
   - **后果**：若强行 `new` 会导致调用**不存在的方法** → 程序崩溃

2. **必须被实现才有价值**

```java
interface Driveable {
    // 常量（自动public static final）
    int MAX_SPEED = 120;

    // 抽象方法（自动public abstract）
    void drive();
}
```

实现类必须履行契约，实现所有抽象方法：

```java
class Truck implements Driveable {
    @Override
    public void drive() {
        System.out.println("卡车以" + MAX_SPEED + "km/h行驶");
    }
}
```

3. **支持多态**：可以用接口类型引用指向实现类对象

```java
Driveable vehicle = new Truck();
vehicle.drive();  // 动态执行Truck的drive()方法

// 输出：
// 卡车以120km/h行驶
```

4. **实现类必须重写所有抽象方法**

```java
interface Flyable {
    void takeOff();
    void land();
}
```

同样的，要么实现，要么声明为抽象类

```java
class Airplane implements Flyable {
    // 必须实现所有方法
    @Override
    public void takeOff() {
        System.out.println("飞机滑行起飞");
    }

    @Override
    public void land() {
        System.out.println("飞机轮子着陆");
    }
}

// 未实现 → 编译错误！
class Helicopter implements Flyable { }

// 抽象实现类可暂缓实现（但不可实例化）
abstract class Drone implements Flyable { }
```

### 接口专属特性

5. **突破单继承限制**：一个类可实现多个接口

Java 类只能单继承，但可以实现多个接口，让一个对象拥有更多角色和能力：

```java
class FlyingCar implements Driveable, Flyable {
    @Override
    public void drive() { /* 实现驾驶 */ }

    @Override
    public void takeOff() { /* 实现起飞 */ }

    @Override
    public void land() { /* 实现降落 */ }
}
```

6. **接口继承**：接口可多继承其他接口

```java
interface Aircraft extends Flyable, WeaponSystem {
    // 添加新方法
    void refuel();
}
```

### 番外-接口的新特性

7. **默认方法**（Java 8+）：提供默认实现，实现类可选择重写

```java
interface SmartDevice {
    // 抽象方法
    void connectWifi();

    // 默认方法（带实现）
    default void autoUpdate() {
        System.out.println("自动下载最新固件");
    }
}

// 实现类可不重写默认方法
class SmartLight implements SmartDevice {
    @Override
    public void connectWifi() { /* 必须实现 */ }
    // autoUpdate() 直接继承默认实现
}
```

8. **静态方法**（Java 8+）：接口专属工具方法

```java
interface MathHelper {
    static double circleArea(double r) {
        return Math.PI * r * r;
    }
}

// 直接通过接口调用
double area = MathHelper.circleArea(2.5);
```

## 依赖注入

依赖注入是一种设计模式，它解决了类与类之间过度耦合的问题。本质上，**它让类不再自己创建依赖对象，而是接收外部传入的依赖**。

> 你需要什么工具，别人直接递给你，而不是自己 new 一个。

传统编程中，一个类往往在内部直接创建它需要的对象，这种方式产生了几个问题：

```java
// 传统写法：自己造咖啡机
class Customer {
    private CoffeeMachine machine = new BasicCoffeeMachine(); // 自己new对象

    void drinkCoffee() {
        machine.brew();
        System.out.println("喝咖啡");
    }
}
```

这种写法导致：

1. 顾客类与基础咖啡机类**强耦合**，想替换为高级咖啡机必须修改代码
2. 测试困难，无法注入测试专用的模拟对象
3. 违反单一职责原则，顾客类不应该关心如何创建咖啡机

依赖注入通过**解耦**解决了这些问题，它让每个类专注于自己的职责，提高了代码的灵活性和可维护性。

有几种常见方式：

### 构造函数注入

通过构造方法将依赖对象传递给需要它的类：

```java
class Customer {
    private CoffeeMachine machine; // 不自己创建

    // 通过构造器传入依赖
    public Customer(CoffeeMachine machine) {
        this.machine = machine;
    }

    void drinkCoffee() {
        machine.brew();
        System.out.println("喝咖啡");
    }
}

// 使用场景
public static void main(String[] args) {
    // 可以灵活选择注入哪种咖啡机
    CoffeeMachine luxuryMachine = new LuxuryCoffeeMachine();

    // 将依赖注入到顾客对象
    Customer customer = new Customer(luxuryMachine);
    customer.drinkCoffee();
}
```

创建对象的那一刻，所有必需的依赖就到位了，对象状态完整。适用于依赖不会变化的场景。

**构造函数注入的优势**：

- 对象创建时依赖就绪，确保完整性
- 依赖关系明确，一目了然
- 适合必需的、不变的依赖

### Setter 方法注入

通过 setter 方法在对象创建后动态注入依赖：

```java
class Customer {
    private CoffeeMachine machine;

    // 通过setter方法注入依赖
    public void setCoffeeMachine(CoffeeMachine machine) {
        this.machine = machine;
    }

    void drinkCoffee() {
        if(machine != null) {
            machine.brew();
            System.out.println("喝咖啡");
        }
    }
}

// 使用场景
public static void main(String[] args) {
    Customer customer = new Customer();

    // 先使用基本咖啡机
    customer.setCoffeeMachine(new BasicCoffeeMachine());
    customer.drinkCoffee();

    // 可随时更换为高级咖啡机
    customer.setCoffeeMachine(new LuxuryCoffeeMachine());
    customer.drinkCoffee();
}
```

灵活性高，可以在对象创建后动态替换依赖。适用于依赖可能变化的场景。

**Setter 注入的优势**：

- 支持依赖的动态更换
- 可处理可选依赖
- 适合依赖可能变化的场景

依赖注入让类专注于使用依赖完成任务，而不是创建依赖。

依赖注入作为现代软件开发的重要设计模式，不仅提高了代码质量，也为许多框架（如 Spring）奠定了基础。掌握它让我们能够编写更加灵活、可维护的代码。

## 接口分离原则

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

## 多接口实现

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

## 番外-接口的特性演进

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

泛型（Generic）就是在定义类、接口、方法时，不直接指定某种具体类型，而是用一个“类型变量”来占位，等到用的时候再指定具体类型。

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
