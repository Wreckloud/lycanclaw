---
title: Java入门-面向对象
date: 2024-12-25 13:39:20
description: 这是一篇新文章!
publish: true
tags:
  - Java
---

# 类

想象一下"蛋糕模具"和"蛋糕"的关系：

- 类就像是一个蛋糕模具：它定义了形状、大小等特征，但本身不能吃。
- 对象就像是用模具做出来的一个个实际的蛋糕：可以有各种口味，可以真正享用。

在 Java 中：

- 类中的变量叫成员变量，描述事物的特征（比如蛋糕的大小、颜色）
- 类中的方法叫成员方法，描述事物能做什么（比如蛋糕可以切开、可以品尝）

### 类的语法格式

```Java
修饰符 class 类名 {
    // 属性（成员变量）- 不用初始化，会有默认值
    数据类型 变量名;

    // 行为（成员方法）
    public 返回类型 方法名(参数列表) {
        // 方法体：做什么事情
    }
}
```

### 对象创建

有了类（模具），就可以"生产"出具体的对象：

- 创建对象（实例化）：

```Java
类名 对象名 = new 类名();
```

- 使用对象的方法

```Java
对象名.方法名(参数);
```

- 访问对象的属性

```Java
对象名.属性名;
```

变量和对象在内存中存储的位置不同

- 局部变量存在 **栈** 中  - 存取快，空间小
- 对象实体存在 **堆** 中  - 空间大，生命周期长
- 对象的引用（地址）存在栈中 - 相当于"门牌号"，方便快速找到对象

# 封装

封装（Encapsulation）是面向对象的第一大特性，简单来说，就是：

> 合理隐藏，合理暴露

- 把相关的数据和操作这些数据的方法打包在一起
- 对外隐藏实现细节，只公开必要的接口

就像手机一样，你只需要知道怎么按按钮，不需要知道内部电路怎么工作。

## 从过程式到面向对象的转变

看一个计算薪资的例子：

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

在 IDEA 中，选中表达式后按`Alt + Enter`可以快速创建变量来保存结果。

## Getter 和 Setter

现在的问题是：员工的属性可以被任意修改，没有任何限制。比如可能会设置负数的工资！

解决方案是：

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

## 构造方法

在 Java 中，**构造方法**是一种特殊的方法，用于在创建对象时执行初始化操作。与普通方法不同，它的名称必须与类名**完全一致**，而且**没有返回值**（连 `void` 也不能写）。

当我们使用`new`关键字创建对象时，其实是在调用**构造方法**：

```java
Employee employee = new Employee(); // 调用了构造方法
```

**无参构造方法**

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

**有参构造方法**

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
# 继承

在现实生活中，孩子会继承父母的特征。在 Java 中，继承是一种让一个类（子类）获得另一个类（父类）的属性和方法的机制。

**继承的核心好处**：代码复用 + 类的层次结构。

想象一个电商系统，有各种各样的商品：

```
商品（共有：名称、价格）
├── 实体商品（特有：重量）
└── 虚拟商品（特有：卡密）
```

如果不使用继承，每种商品类都需要重复编写名称和价格的代码。但有了继承，我们可以：

## 实现继承

首先定义一个父类：

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

> 在 Java 中，所有的类都直接或间接继承自`Object`类。如果没有明确指定父类，则默认继承 Object 类。

## 继承中的构造方法

父类的属性（name、price）都是 private 的，子类无法直接访问它们。那怎么才能在创建子类对象时，同时初始化这些父类的属性呢？

使用 super 关键字调用父类的构造方法。

```java
public class PhysicalProduct extends Product {
    private double weight;

    // 子类的构造方法
    public PhysicalProduct(String name, double price, double weight) {
        // 调用父类的构造方法初始化父类属性
        super(name, price);
        // 初始化子类特有属性
        this.weight = weight;
    }
}
```

`super(name, price)` 表示调用父类的构造方法，必须是子类构造方法的第一条语句。

## 方法的覆写（Override）

子类可以重新定义父类的方法，这称为方法覆写或重写：

比如，父类的 displayInfo()方法只显示名称和价格，但实体商品还应该显示重量：

```java
@Override
public String displayInfo() {
    // 调用父类的方法，获取基本信息
    return super.displayInfo() + "，商品重量：" + weight + "g";
}
```

`@Override`注解不是必须的，但建议使用，它可以帮助编译器检查是否正确覆写了父类方法。

> IDEA 快捷键：`Ctrl + O` 可以快速覆写父类的方法

如果不希望某个方法被子类覆写，可以使用`final`关键字：

```java
public final void doNotOverrideMe() {
    // 这个方法不能被子类覆写
}
```

## 权限修饰符

Java 提供了四种权限修饰符，控制类成员的可访问范围：

| 修饰符       | 本类内部 | 同一个包 | 子类 | 其他包的类 |
| ------------ | -------- | -------- | ---- | ---------- |
| `private`    | ✓        | ✗        | ✗    | ✗          |
| 默认（不写） | ✓        | ✓        | ✗    | ✗          |
| `protected`  | ✓        | ✓        | ✓    | ✗          |
| `public`     | ✓        | ✓        | ✓    | ✓          |

> 设计类时，遵循"最小权限原则"，只给必要的访问权限。

# 多态

多态（Polymorphism）是面向对象的第三大特性，简单说就是：同一种操作作用于不同的对象，可以有不同的解释和结果。

比如"按下按钮"这个动作：

- 在电视遥控器上 → 换台
- 在电梯里 → 选择楼层
- 在门铃上 → 发出声音

## 实现多态

Java 中实现多态的基础是：父类引用指向子类对象。

```java
// 父类引用指向子类对象
Product product = new PhysicalProduct("手机", 1999, 672);
// 或者
Product anotherProduct = new DigitalProduct("充值卡", 99.9, "123456");
```

然后通过这个父类引用调用方法，实际执行的是子类中的方法：

```java
// 这里调用的displayInfo实际上是子类重写的版本
System.out.println(product.displayInfo());
```

多态非常适合处理一组相似但不完全相同的对象：

```java
// 创建订单的方法接收任何Product类型
public static void createOrder(Product product) {
    System.out.println(product.displayInfo());
    System.out.println("订单已确认");
}

// 使用时可以传入任何Product的子类
createOrder(new PhysicalProduct("手机", 1999, 672));
createOrder(new DigitalProduct("充值卡", 99.9, "123456"));
```

通过父类引用，只能调用父类中定义的方法，不能直接调用子类特有的方法。如果需要调用子类特有方法，需要向下转型。

## 向上转型和向下转型

- **向上转型**：子类对象赋给父类引用，自动进行。

  ```java
  Product p = new PhysicalProduct(); // 自动向上转型
  ```

- **向下转型**：父类引用转为子类引用，需要显式转换，且有风险。
  ```java
  // 需要先判断是否可以安全转换
  if (product instanceof PhysicalProduct) {
      PhysicalProduct pp = (PhysicalProduct) product;
      pp.setWeight(586.0);
  }
  ```

> 进行向下转型前必须用`instanceof`检查，否则可能出现`ClassCastException`异常！

## 抽象类和抽象方法

有时候，父类只提供一个"大纲"，具体实现由子类完成。这时候可以使用抽象类：

```java
// 抽象类
public abstract class Product {
    private String name;
    private double price;

    // 普通方法
    public String displayInfo() {
        return "商品名称：" + name + "，商品价格：" + price;
    }

    // 抽象方法 - 没有方法体，必须由子类实现
    public abstract void sendProduct();
}
```

抽象类的特点：

- 不能被实例化（不能用`new`创建对象）
- 可以包含普通方法，也可以包含抽象方法
- 子类必须实现所有抽象方法，除非子类也是抽象类

各个子类可以根据自己的特点实现抽象方法：

```java
// 实体商品
public class PhysicalProduct extends Product {
    @Override
    public void sendProduct() {
        System.out.println("通过物流发货");
    }
}

// 虚拟商品
public class DigitalProduct extends Product {
    @Override
    public void sendProduct() {
        System.out.println("通过网络发送卡密");
    }
}
```

> 在 IDEA 中，输入需要遍历的变量名，然后输入`.fori`并按回车，可以自动生成 for 循环代码。

好的，我会按照您的要求，从 "static 静态" 部分开始优化笔记，参考您确认的风格。

# static 静态

你有没有想过，为什么我们可以直接使用 `Math.PI` 而不需要先创建一个 Math 对象？这就是 static（静态）的魔力！

### 静态变量

静态变量就像班级里的"公共财产"，不属于某个同学，而是属于整个班级。在 Java 中，静态变量是用 `static` 关键字修饰的变量，它属于类而非对象。

- 静态变量在类第一次被使用时就加载到内存，并完成初始化
- 不需要创建对象就能直接用 `类名.变量名` 来访问

```java
public class School {
    // 静态变量 - 所有学生共享的校训
    private static String motto = "好好学习，天天向上";

    // 普通变量 - 每个学生有自己的名字
    private String studentName;

    // 获取校训的方法
    public static String getMotto() {
        return motto;
    }
}

// 使用静态变量
String schoolMotto = School.motto; // 直接用类名访问，无需创建对象
```

### 静态方法

静态方法就像是公共服务，不管有没有居民（对象），服务本身都存在。

- 可以直接用 `类名.方法名` 调用，不需要创建对象
- 静态方法中不能直接访问非静态成员，就像公共图书馆不能直接查看你家的私人书架
- 静态方法中不能使用 `this` 关键字，因为它不属于任何对象

```java
private static int studentCount = 0;

// 静态方法 - 获取学生总数
public static int getStudentCount() {
    // 静态方法不能使用 this 关键字
    return studentCount;
}

// 调用静态方法
int totalStudents = School.getStudentCount();
```

# 工具类

静态特性最常见的应用就是创建工具类。想一想，你不会为了用一次计算器就买一个新的吧？

工具类是用来封装某一领域的通用方法的类，这些方法通常不需要对象状态，只是纯粹的功能服务，所以一般都设计成静态的。

例如，一个角度转换工具类：

```java
public class MathUtil {
    // 静态常量
    public static final double PI = 3.14159265359;
    public static final double STRAIGHT_ANGLE = 180.0;

    // 静态方法 - 角度转弧度
    public static double toRadians(double degrees) {
        return degrees * PI / STRAIGHT_ANGLE;
    }

    // 私有构造方法，防止创建实例
    private MathUtil() {
        // 不允许创建工具类的实例
    }
}

// 使用工具类
double radians = MathUtil.toRadians(90); // 直接调用，清晰明了
```

### 静态工厂方法

静态工厂方法是在类中提供一个创建对象的静态方法，来代替直接使用构造方法。这听起来像是多此一举，但实际上有很多好处！

```java
public class Worker {
    private String name;
    private int age;

    // 普通构造方法
    public Worker(String name, int age) {
        this.name = name;
        this.age = age;
    }

    // 静态工厂方法
    public static Worker getInstance(String name, int age) {
        return new Worker(name, age);
    }
}
```

为什么要这样做呢？让我们看几个真实案例：

#### 案例 1：提高代码可读性

比如，我们需要一个表示 API 调用结果的类：

```java
public class Result {
    private int code;       // 状态码：0成功，1失败
    private String msg;     // 结果描述
    private Object data;    // 返回的数据

    public Result(int code, String msg, Object data) {
        this.code = code;
        this.msg = msg;
        this.data = data;
    }

    // 静态工厂方法 - 成功且有返回数据
    public static Result ok(Object data) {
        return new Result(0, "OK", data);
    }

    // 成功但无返回数据
    public static Result ok() {
        return ok(null);
    }

    // 失败情况
    public static Result fail(String msg) {
        return new Result(1, msg, null);
    }

    // 省略getter和setter
}
```

使用这些静态工厂方法后，代码变得更加清晰：

```java
// 不使用静态工厂方法
return new Result(0, "OK", student);       // 成功，有数据
return new Result(0, "OK", null);          // 成功，无数据
return new Result(1, "id不能小于0", null); // 失败

// 使用静态工厂方法后
return Result.ok(student);                 // 一目了然！
return Result.ok();                        // 简洁明了
return Result.fail("id不能小于0");         // 表意清晰
```

这样代码更清晰，更容易理解意图！

#### 案例 2：避免重复创建对象

想象一下表示性别的场景，男/女这种固定的值，真的需要每次都创建新对象吗？

```java
public class Gender {
    private int value;     // 性别编码：0代表男，1代表女
    private String label;  // 性别标签：男，女

    // 1.构造方法私有化，外部不能随意创建
    private Gender(int value, String label) {
        this.value = value;
        this.label = label;
    }

    // 3.预先创建好固定的实例，避免重复创建
    private static final Gender MALE = new Gender(0, "男");
    private static final Gender FEMALE = new Gender(1, "女");

    // 2.提供静态工厂方法获取实例
    public static Gender male() {
        return MALE;  // 每次都返回同一个对象！
    }

    public static Gender female() {
        return FEMALE;
    }

    // 4.根据编码获取对应的性别对象
    public static Gender valueOf(int value) {
        if (value == 0) return MALE;
        if (value == 1) return FEMALE;
        throw new IllegalArgumentException("性别参数不合法：" + value);
    }

    // getter方法（不提供setter以确保不可变）
    public int getValue() {
        return value;
    }

    public String getLabel() {
        return label;
    }
}
```

使用时：

```java
// 传统方式 - 每次都创建新对象
Gender g1 = new Gender(0, "男"); // 不可行，构造方法已私有化
Gender g2 = new Gender(0, "男"); // 不可行，且浪费内存

// 使用静态工厂方法 - 重用对象
Gender male1 = Gender.male();
Gender male2 = Gender.male(); // male1和male2是同一个对象！

// 通过编码获取对象
Gender gender = Gender.valueOf(userGenderCode);
System.out.println("用户性别：" + gender.getLabel());
```

这种方式带来的好处是：

1. 节省内存 - 不会创建重复对象
2. 类型安全 - 无法创建除了男/女以外的性别
3. 对象相等性 - `Gender.male() == Gender.male()` 将返回 true

#### 案例 3：创建不同子类对象

静态工厂方法还可以灵活返回不同的子类对象，而不暴露具体实现类：

```java
public abstract class Product {
    private String name;
    private double price;

    // 省略构造方法和getter/setter

    // 创建实体商品的静态工厂方法
    public static Product createPhysicalProduct(String name, double price, double weight) {
        return new PhysicalProduct(name, price, weight);
    }

    // 创建虚拟商品的静态工厂方法
    public static Product createDigitalProduct(String name, double price, String cdKey) {
        return new DigitalProduct(name, price, cdKey);
    }
}
```

使用时，客户端代码不需要知道具体的子类是什么：

```java
// 创建不同类型的商品，但返回值类型相同
Product phone = Product.createPhysicalProduct("手机", 1999, 200);
Product game = Product.createDigitalProduct("游戏", 99, "XXXX-YYYY-ZZZZ");

// 即使将来添加新的商品类型，调用方式也不需要变
```

这种方式的优势：

1. 隐藏具体实现，更换子类实现时不影响客户端代码
2. 提供了更具描述性的方法名，比构造方法更清晰
3. 允许根据参数灵活决定返回哪种子类

> IDEA 快捷技巧:  
> 选中代码后按 `Alt + Enter` 可以快速生成变量  
> 在表达式后输入 `.var` 再按回车，也能达到同样效果

### 代码块

代码块就像是特殊的"迷你方法"，它不需要被调用，会在特定时机自动执行。Java 中有两种主要的代码块：

```java
public class CodeBlock {
    // 构造方法
    public CodeBlock() {
        System.out.println("3. 执行构造方法");
    }

    // 普通方法
    public void func() {
        System.out.println("普通方法被调用");
    }

    // 构造代码块 - 每次创建对象都会执行
    {
        System.out.println("2. 执行构造代码块");
    }

    // 静态代码块 - 类加载时执行一次
    static {
        System.out.println("1. 执行静态代码块");
    }
}
```

区别很简单：

- **静态代码块**：类加载时执行，而且只执行一次，用于初始化静态资源
- **构造代码块**：每次创建对象时都执行，在构造方法之前

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

想象一下你去咖啡店点咖啡。你不关心咖啡师是谁，也不在意咖啡机是什么型号，你只关心一件事：我要一杯**好喝的**咖啡！

这就是接口的精髓：定义"做什么"，而不关心"怎么做"。

**为什么需要接口？**

在面向对象编程中，你会发现一个大问题：**耦合**。

什么是耦合？简单说，就是两个模块（类、方法等）之间相互依赖的程度。耦合越高，修改一个模块就越可能影响到其他模块，代码就越难维护。

![](../../public/images/文章资源/java入门-面向对象/file-20250626172103820.jpg)

上图中，类 A 直接依赖于类 B，这是高耦合的设计。如果 B 的实现发生变化，A 也必须跟着修改。

接口就是专门用来解决这个问题的！

### 接口的基本概念

接口（Interface）是一种类似于 class 的类型，但它只定义方法的"长相"（签名），不定义具体实现：

```java
public interface Rollable {
    void roll(); // 只有方法声明，没有方法体
}
```

接口就像是一份"契约"，实现这个接口的类必须遵守这份契约，提供所有接口中定义的方法。

回到擀饺子皮的例子，重点在于"擀"这个动作，而不是用什么工具。"擀"就是接口中的方法，具体用擀面杖、酒瓶、还是保温杯来擀，是接口实现类要考虑的事情。

通过引入接口，我们可以将 A 与具体实现解耦：

![](../../public/images/文章资源/java入门-面向对象/file-20250626172112970.jpg)

类 A 不再直接依赖具体类，而是依赖于"Rollable"接口（定义了 roll()方法）。类 B、C、D 都实现了这个接口。这样 A 只需要知道"能滚动"这个能力，而不关心具体是哪个类实现了这个能力。

### 创建和实现接口

接口的创建很简单：

```java
public interface Coupon {
    // 接口中的方法默认是public abstract的，可以省略
    int calculateDiscount(double totalPrice);
}
```

实现接口使用`implements`关键字：

```java
public class PriceDiscountCoupon implements Coupon {
    private int threshold; // 满多少金额
    private int discount;  // 减多少金额

    public PriceDiscountCoupon(int threshold, int discount) {
        this.threshold = threshold;
        this.discount = discount;
    }

    @Override // 这个注解是可选的，但推荐加上，便于发现错误
    public int calculateDiscount(double totalPrice) {
        // 满足条件时才给予折扣
        return totalPrice >= threshold ? discount : 0;
    }
}
```

使用接口：

```java
public class Order {
    private Product product;
    private int amount;
    // 使用接口类型，而不是具体实现类
    private Coupon coupon;

    public Order(Product product, int amount, Coupon coupon) {
        this.product = product;
        this.amount = amount;
        this.coupon = coupon;
    }

    public double calculateTotal() {
        double total = product.getPrice() * amount;
        int discount = coupon.calculateDiscount(total);
        return total - discount;
    }
}
```

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
