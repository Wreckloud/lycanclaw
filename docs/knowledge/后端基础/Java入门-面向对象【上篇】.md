---
title: Java入门-面向对象【上篇】
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

- 封装让代码**更清晰**，职责更明确；
- 封装让对象拥有**“自我管理”的能力**，逻辑和数据紧密绑定；
- 封装减少了外部对内部结构的依赖，**提高了维护性与安全性**。

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

## 实现继承

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

## 权限修饰符

Java 提供了四种权限修饰符，控制类成员的可访问范围：

| 修饰符       | 本类内部 | 同一个包 | 子类 | 其他包的类 |
| ------------ | -------- | -------- | ---- | ---------- |
| `private`    | ✓        | ✗        | ✗    | ✗          |
| 默认（不写） | ✓        | ✓        | ✗    | ✗          |
| `protected`  | ✓        | ✓        | ✓    | ✗          |
| `public`     | ✓        | ✓        | ✓    | ✓          |

设计类时，应遵循"最小权限原则"，只给必要的访问权限。对于需要被子类访问但不想对外公开的成员，protected 是最佳选择。

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
- 可以调用子类重写的方法（多态）
- 不能调用子类特有的方法

```java
Animal animal = new Dog();
animal.makeSound();  // 正常调用：输出"汪汪汪"
// animal.fetchBone();  // 错误：Animal类没有此方法
```

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

### 类型安全检查

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
