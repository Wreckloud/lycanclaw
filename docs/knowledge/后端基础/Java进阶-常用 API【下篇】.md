---
title: Java进阶-常用 API【下篇】
date: 2025-07-29 18:47:15
description: 这是一篇新文章!
order: 0
publish: true
tags:
  - Java
---

# Arrays 工具类

Arrays 是 Java 提供的数组操作工具类，它包含了一系列静态方法，可以帮助我们高效地处理数组。

### `.sort` 对象数组排序

基本类型数组（如 int[]）可以直接用  Arrays.sort(arr)  排序，但对象数组需要指定比较规则：

**方式一：实现 Comparable  接口**

当对象有"天然排序规则"时（如学生按年龄排序），让类实现 Comparable 接口：

```java
public class Student implements Comparable<Student> {
    private String name;
    private int age;

    @Override
    public int compareTo(Student o) {
        // 按年龄升序
        return this.age - o.age;
    }
}
```

**官方规定：**

- 返回正数：表示左边大于右边
- 返回负数：表示左边小于右边
- 返回零：表示相等

只要这么写，默认就是升序排序。

> 注意：对于浮点数比较，不要直接相减，应使用  Double.compare(this.height, o.height)

**方式二：使用  Comparator 比较器**

如果不想让类本身固定排序规则，或者排序规则经常变，可以用 `Comparator` 比较器。  
这种方式是把“比较规则”写在排序的时候，灵活切换。

```java
Arrays.sort(students, new Comparator<Student>() {
    @Override
    public int compare(Student o1, Student o2) {
        // 按年龄升序
        return o1.getAge() - o2.getAge();
    }
});
```

同样的，返回的值需要整型，如果是两个小数比较，推荐用 `Double.compare(o1.getHeight(), o2.getHeight())`。

# Lambda 表达式

在  Java 8 之前，实现接口需要写匿名内部类的写法正如我们前面介绍的那样：

```java
Arrays.sort(students, new Comparator<Student>() {
    @Override
    public int compare(Student o1, Student o2) {
        // 按年龄升序
        return o1.getAge() - o2.getAge();
    }
});
```

Lambda 表达式让这种"一次性"的功能实现变得简洁，让上面的代码简化成这样：

```java
Arrays.sort(students, (o1, o2) -> o1.getAge() - o2.getAge());
```

Lambda 的标准格式长这样：

```java
(参数列表) -> { 方法体 }
```

它本质上就是把“接口里唯一的抽象方法”用一行语法快速实现了。比如：

```java
// 传统写法：匿名内部类
Animal a1 = new Animal() {
    @Override
    public void run() {
        System.out.println("跑的贼快~~~~");
    }
};
a1.run();
```

如果 Animal 是一个只有一个抽象方法的接口（也叫“函数式接口”），就能用 Lambda 简化：

```java
Animal a2 = () -> System.out.println("跑的贼快~~~~");
a2.run();
```

### 使用条件

需要特别注意的是，Lambda 并不能简化所有匿名内部类的代码，它只能用于简化"函数式接口"的匿名内部类实现。

什么是函数式接口？

- 有且仅有一个抽象方法的接口
- 通常会有  @FunctionalInterface  注解标记（有这个注解的接口必定是函数式接口）

例如，抽象类就不能使用  Lambda：

```java
abstract class Animal {
    public abstract void run();
}
// 这里不能用 Lambda，因为 Animal 是抽象类而非接口
```

而函数式接口则可以：

```java
@FunctionalInterface  // 函数式接口中有且仅有一个抽象方法
interface Swimming {
    void swim();
}

// 传统方式
Swimming s1 = new Swimming() {
    @Override
    public void swim() {
        System.out.println("学生贼溜~~~~");
    }
};
s1.swim();

// Lambda 简化方式
Swimming s2 = () -> System.out.println("学生贼溜~~~~");
s2.swim();
```

### 工作原理

Lambda 之所以能这样简化代码，是因为 Java  编译器能够通过上下文推断出真实的代码形式。编译器根据接口定义自动补全了必要的代码结构。

这在 API 调用中特别有用：

```Java
// 传统方式
Arrays.setAll(scores, new IntToDoubleFunction() {
    @Override
    public double applyAsDouble(int index) {
        return scores[index] + 10;
    }
});

// Lambda 简化方式
Arrays.setAll(scores, (int index) -> {
    return scores[index] + 10;
});
```

### 进阶写法

Lambda 表达式还可以进一步简化，遵循以下规则：

1. 参数类型可以省略不写
2. 如果只有一个参数，参数类型可以省略，同时括号()也可以省略
3. 如果方法体只有一行代码，可以省略大括号，同时如果这行代码是  return 语句，必须去掉  return 关键字

让我们看看同一个例子的逐步简化过程：

```java
// 原始形式
Arrays.setAll(scores, new IntToDoubleFunction() {
    @Override
    public double applyAsDouble(int index) {
        return scores[index] + 10;
    }
});

// 基本 Lambda 形式
Arrays.setAll(scores, (int index) -> {
    return scores[index] + 10;
});

// 省略参数类型
Arrays.setAll(scores, (index) -> {
    return scores[index] + 10;
});

// 单参数省略括号
Arrays.setAll(scores, index -> {
    return scores[index] + 10;
});

// 单行方法体省略大括号和 return
Arrays.setAll(scores, index -> scores[index] + 10);
```

这就是 Lambda 的全部精髓：让“只用一次的小功能”写起来又快又清楚，代码更聚焦于业务本身。

抱歉，我没有很好地遵循您的规则。让我重新整理这部分内容，保持专业风格但带点口语化表达，突出"是什么、为什么、怎么用"，并保持与前面内容一致的风格。

### 方法引用

方法引用是 Java 8 的另一个新特性，它的目的是让已经很简洁的 Lambda 表达式变得更加精简。其实 Lambda 表达式已经足够简洁了，方法引用更多是一种"锦上添花"的语法，了解即可。

#### 静态方法引用

**语法格式：`类名::静态方法`**

当我们的 Lambda 表达式里只是在调用一个静态方法，并且参数完全一致时，就可以使用静态方法引用：

```java
// 假设有个静态方法用于比较学生身高
public static int compareByHeight(Student o1, Student o2) {
    return Double.compare(o1.getHeight(), o2.getHeight());
}

// Lambda 写法
Arrays.sort(students, (o1, o2) -> Student.compareByHeight(o1, o2));

// 静态方法引用写法
Arrays.sort(students, Student::compareByHeight);
```

这种写法虽然简洁，但有时为了使用方法引用而专门定义静态方法:

```
额外定义的静态方法
```

反而会增加代码量。直接使用 `Double.compare()` 可能更加直观。

#### 实例方法引用

**语法格式：`对象::实例方法`**

如果 Lambda 表达式里调用的是某个对象的实例方法，参数列表一致，就可以使用实例方法引用：

```java
// 假设有个比较器对象
Test2 t = new Test2();

// Lambda 写法
Arrays.sort(students, (o1, o2) -> t.compare(o1, o2));

// 实例方法引用
Arrays.sort(students, t::compare);
```

这种方式在实际开发中使用较少，可读性也相对较差，更多是在 JDK 内部使用。

#### 特定类型方法引用

**语法格式：`类型::方法`**

这种形式比较特殊：Lambda 表达式的第一个参数是方法的调用者，剩余参数是方法的参数。这时可以使用特定类型方法引用：

```java
// 需要对字符串数组进行忽略大小写排序
String[] names = {"dlei", "Angela", "baby", "Coach", "andy"};

// Lambda 写法
Arrays.sort(names, (o1, o2) -> o1.compareToIgnoreCase(o2));

// 特定类型方法引用
Arrays.sort(names, String::compareToIgnoreCase);
```

这个例子中，`o1.compareToIgnoreCase(o2)` 正好符合特定类型方法引用的模式，所以可以简化为 `String::compareToIgnoreCase`。

#### 构造器引用

**语法格式：`类名::new`**

当 Lambda 表达式只是用来创建对象时，可以使用构造器引用：

```java
// 定义一个函数式接口
@FunctionalInterface
interface Create {
    Car createCar(String name);
}

// Lambda 写法
Create c1 = name -> new Car(name);

// 构造器引用
Create c1 = Car::new;

// 使用
Car car = c1.createCar("布加迪威龙");
```

构造器引用虽然简洁，但实际应用场景相对有限，更多出现在框架内部或工厂模式中。

方法引用是一种高级语法糖，它让代码在特定场景下更加简洁。但也要注意，过度追求简洁可能会降低代码可读性，所以在实际开发中应当根据团队习惯和代码上下文灵活使用。
