---
title: Java  中的集合
date: 2025-08-07 09:40:47
description: 这是一篇新文章!
order: 0
publish: true
tags:
  - Java
---

# 集合

集合是一种用来存储数据的容器，和数组类似，但比数组更灵活——集合的容量是可变的，能动态增删元素，因而在实际开发中使用频率极高。

为了满足不同的业务场景，Java 将集合划分为两大体系：

- **Collection**：单列集合，每个元素只有一个值。
- **Map**：双列集合，每个元素由一对键值对组成。

# Collection

Collection 是一个接口，用于定义“集合”的基本行为。它本身不能直接使用，但它下面派生出了两个核心子接口：

![](../../public/images/文章资源/java-中的集合/file-20250807094433942.jpg)

- **List**：有序、可重复、支持索引
- **Set**：无序、不重复、不支持索引

这两个接口也不是直接使用的重点，真正落地还得看它们的实现类：

**List 系列**

- `ArrayList`：基于数组，查询快，增删慢，适合查多改少。
- `LinkedList`：基于链表，查询慢，增删快，适合频繁插入删除。

它们都保证**元素有序、可重复、支持索引**，但底层结构不同，性能也有区别，后续再详细分析。

**Set 系列**

- `HashSet`：元素**无序、不可重复**，通过哈希表去重。
- `LinkedHashSet`：在 `HashSet` 基础上，保留了插入顺序。
- `TreeSet`：元素按自然顺序或指定规则**自动排序**，同样不可重复。

## 常用方法

在 Java 的集合体系中，`Collection` 是所有单列集合（如 List、Set）的顶级接口，它定义了一批最基础的“增删查改”操作，掌握这些方法，就等于掌握了集合的基本使用套路。

下面按功能分类，逐一演示每个常用方法的使用方式。

#### `add` 增

`add(E e)` 方法用于向集合中添加一个元素。大多数集合类型都支持添加重复元素（如 List），而像 Set 则会自动去重。

```java
Collection<String> wolves = new ArrayList<>();
wolves.add("灰影");
wolves.add("血牙");
wolves.add("灰影"); // 可以重复添加
System.out.println(wolves); // [灰影, 血牙, 灰影]
```

#### `remove` 删

`remove(Object o)` 方法用于删除集合中**首次出现**的指定元素。

```java
wolves.remove("灰影"); // 只会删除第一个灰影
System.out.println(wolves); // [血牙, 灰影]
```

注意，`remove` 不是删除所有相同元素，只删第一个。要删除全部，可以搭配循环或 `removeIf`。

#### `contains` 是否包含

`contains(Object o)` 用于判断集合中是否存在某个元素，相当于“查”操作。

```java
System.out.println(wolves.contains("血牙")); // true
System.out.println(wolves.contains("银狼")); // false
```

#### `size()` 获取大小

返回当前集合中元素的数量。

```java
System.out.println(wolves.size()); // 2
```

#### `isEmpty()` 是否为空

用于判断集合当前是否为空，常用于逻辑判断、避免空操作。

```java
System.out.println(wolves.isEmpty()); // false
wolves.clear();
System.out.println(wolves.isEmpty()); // true
```

#### `clear()` 清空集合

`clear()` 方法会直接清除集合中所有元素，不是逐个删，是一口气清干净。

```java
wolves.add("苍狼");
wolves.add("影牙");
System.out.println(wolves); // [苍狼, 影牙]

wolves.clear();
System.out.println(wolves); // []
```

#### `toArray()` 集合转数组

有时候我们要把集合传递给只接受数组的方法，那就得使用 `toArray()`。它有两个常用版本：

1. **返回 `Object[]` 数组（基础版）**

```java
Collection<String> names = new ArrayList<>();
names.add("云牙");
names.add("雪踪");

Object[] arr = names.toArray();
System.out.println(Arrays.toString(arr)); // [云牙, 雪踪]
```

这返回的是一个 `Object[]` 类型的数组，需要注意类型转换。

2. **转成指定类型数组（推荐方式）**

Java 8 引入的方法引用，可以精确指定目标数组类型：

```java
String[] arr2 = names.toArray(String[]::new);
System.out.println(Arrays.toString(arr2)); // [云牙, 雪踪]
```

这种方式更安全，避免强转风险，也是现代写法推荐使用的形式。

#### `addAll()` 合并

有时候我们需要把两个集合的数据合并，就用 `addAll(Collection<? extends E> c)`。

```java
Collection<String> packA = new ArrayList<>();
packA.add("夜哨");
packA.add("影爪");

Collection<String> packB = new ArrayList<>();
packB.add("雾牙");
packB.add("白爪");

packA.addAll(packB);

System.out.println(packA); // [夜哨, 影爪, 雾牙, 白爪]
```

这个操作**不会去重**，要去重的场景请考虑 `Set` 类型。

## 遍历方式

对于容器而言，**遍历是最基本、最常见的操作之一**。无论你是想查找、统计还是处理数据，都绕不开“把集合里的元素一个个拿出来”。

而在 Collection 体系中，由于大部分集合没有索引（除了 List），所以不能只依赖传统的 `for` 循环。下面我们从通用的 `Iterator` 开始，逐步过一遍所有推荐的遍历方式。

### Iterator 迭代器

`Iterator` 是集合体系中专门用于遍历元素的对象。每一个 Collection 类型的集合都可以通过 `iterator()` 方法获取一个迭代器。

Java 中所有 `Collection` 子类，都可以通过 `.iterator()` 方法获取一个迭代器对象。

```java
Collection<String> wolves = new ArrayList<>();
wolves.add("苍牙");
wolves.add("夜爪");
wolves.add("雾鬃");

// 获取迭代器对象
Iterator<String> it = wolves.iterator();

// 一个个取（不推荐）
System.out.println(it.next()); // 苍牙
System.out.println(it.next()); // 夜爪
System.out.println(it.next()); // 雾鬃
```

此时如果再 `it.next()`，就会抛出：

```text
java.util.NoSuchElementException
```

这种方式太死板，而且容易抛异常。所以我们需要引入改进版本。

**正确方式：**
使用 `hasNext()` + `next()` 循环遍历

```java
Iterator<String> it = list.iterator();
while (it.hasNext()) {
    String ele = it.next();
    System.out.println(ele);
}
```

- **`hasNext()`**：判断是否还有元素
- **`next()`**：获取当前元素，并把迭代器指针移向下一个

看看 `ArrayList` 内部 `Itr` 迭代器的简化源码：

```java
// ArrayList 内部迭代器 Itr 的关键属性：
int cursor; // 指向下一个要访问的元素索引，默认 0
int lastRet = -1; // 上一次访问的索引，-1 表示未访问
```

`hasNext()` 源码：

```java
public boolean hasNext() {
    return cursor != size;
}
```

注意，`hasNext()` 实际问的是当前游标是否越界，而不是“下一个有没有”，这很关键

`next()` 源码逻辑：

```java
public E next() {
    if (cursor >= size) throw new NoSuchElementException();

    Object[] data = ArrayList.this.elementData;
    int i = cursor;
    cursor = i + 1;
    return (E) data[lastRet = i];
}
```

- `cursor` 初始为 0，每次调用 `next()`，就拿当前位置的数据，然后游标后移。如果越界，就会抛出 `NoSuchElementException`。
- 内部使用的是数组访问方式，即使我们没有索引，其实还是“按下标走的”

### 增强 for 循环

增强 `for` 是 Java 对迭代器（`Iterator`）的简化封装，语法更简洁，避免手动处理游标和判断逻辑。它适合**只读遍历**（不修改、不删除集合元素）场景。

**语法格式：**

```java
for (元素类型 变量名 : 集合对象) {
    // 使用变量名操作每个元素
}
```

增强 `for` 是对迭代器的封装，语法更简单，不需要手动获取迭代器对象。

```java
for (String wolf : wolves) {
    System.out.println(wolf);
}
```

这段代码背后实际上调用的是迭代器，只不过被语法糖封装掉了。

```java
for (Iterator<String> it = list.iterator(); it.hasNext();) {
    String name = it.next();
    ...
}
```

> 增强 for 只适合读数据，不能用来修改集合，否则会抛出`ConcurrentModificationException`。

### Lambda 表达式遍历

从 JDK 8 开始，`Collection` 接口新增了 `forEach` 默认方法，配合 Lambda 表达式，让遍历写法更简洁。

```java
wolves.forEach(new Consumer<String>() {
    @Override
    public void accept(String wolf) {
        System.out.println(wolf);
    }
});
```

Lambda 简化写法：

```java
wolves.forEach(wolf -> System.out.println(wolf));
```

方法引用（进一步简化）：

```java
wolves.forEach(System.out::println);
```

我们并不是自己去遍历集合，而是把“打印逻辑”封装成函数交给系统，**由集合内部帮我们去遍历并回调处理逻辑**：

```java
default void forEach(Consumer<? super T> action) {
    for (T t : this) {
        action.accept(t);
    }
}
```

这就是“别人帮我们一只只把对象送过来，我们只管处理”——遍历的主控权从开发者交到了集合自身。

## 集合的并发修改异常

在使用 **迭代器** 遍历集合的同时，如果试图直接对集合进行修改（例如删除元素），就会引发 `ConcurrentModificationException` 异常。

这个“并发”指的并不是多线程，而是一边遍历集合，一边修改集合结构/增删元素。

**异常触发机制**

来看 `ArrayList` 的源码片段。在调用迭代器的 `next()` 方法时，内部会执行 `checkForComodification()` 检查集合是否被修改：

```java
public E next() {
    checkForComodification(); // 核心检查
    return (E) elementData[lastRet = cursor++];
}
```

关键方法是这个：

```java
final void checkForComodification() {
    if (modCount != expectedModCount)
        throw new ConcurrentModificationException();
}
```

其中：

- `modCount` 是集合本身的修改次数。
- `expectedModCount` 是迭代器初始化时记录的值。

一旦集合结构发生变化（比如调用了 `remove()`、`clear()` 等方法），`modCount` 就会增加。但如果你是通过集合自身来删除元素，迭代器并不会知道这一变动，于是检测到 `modCount != expectedModCount`，就直接抛出异常。

例如，集合中的 `remove()` 实际上内部会修改 `modCount`：

```java
private void fastRemove(Object[] es, int i) {
    modCount++; // 每次删除都会修改
    final int newSize;
    if ((newSize = size - 1) > i)
        System.arraycopy(es, i + 1, es, i, newSize - i);
    es[size = newSize] = null;
}
```

同样，`clear()` 也会直接修改 `modCount`：

```java
public void clear() {
    modCount++;
    final Object[] es = elementData;
    for (int to = size, i = size = 0; i < to; i++)
        es[i] = null;
}
```

因此，只要你在遍历过程中直接调用这些修改方法，**modCount 和 expectedModCount 不一致**，异常就会抛出。

### 迭代器的删除方法

要避免异常，就必须使用迭代器的 `remove()` 方法，而不是集合本身的删除方法。

```java
Iterator<String> it = list.iterator();
while (it.hasNext()) {
    String name = it.next();
    if (name.contains("枸杞")) {
        // list.remove(name); // ❌ 错误，直接操作集合
        it.remove(); // ✅ 正确，使用迭代器自身的删除
    }
}
```

迭代器的 `remove()` 方法会同步更新 `expectedModCount`，也会处理 `cursor` 的回退，因此不会抛出异常。

这套机制逻辑是清晰而合理的，关键点就是：**迭代器负责遍历，就交给它处理删除。**

这是最推荐的做法：使用迭代器 + it.remove()，最稳定、最安全。

### 其他的删除方法

**增强 for 循环删除**

```java
for (String name : list) {
    if (name.contains("枸杞")) {
        list.remove(name); // ❌ 一定会报错
    }
}
```

增强 for 本质上是基于迭代器实现的遍历，但我们拿不到那个迭代器对象，因此也就无法调用 `it.remove()`。想在循环体内直接删元素，结果就是触发并发修改异常，**无法解决**。

所以，增强 for **适合只读遍历，不适合删除操作**。

**Lambda 表达式删除**

```java
list.forEach(name -> {
    if (name.contains("枸杞")) {
        list.remove(name); // ❌ 也会报错
    }
});
```

Lambda 的底层实现同样是基于迭代器，而且是增强 for 那一套。

看源码：

```java
public void forEach(Consumer<? super E> action) {
    Objects.requireNonNull(action);
    final int expectedModCount = modCount;
    final Object[] es = elementData;
    final int size = this.size;
    for (int i = 0; modCount == expectedModCount && i < size; i++)
        action.accept(elementAt(es, i));
    if (modCount != expectedModCount)
        throw new ConcurrentModificationException();
}
```

如上，只要 `modCount` 被改动（比如删除了元素），循环终止并抛出异常。

**倒序 for 删除（仅限 ArrayList）**

如果真的非要边遍历边删，又不想用迭代器，在 `ArrayList` 这类支持索引的集合中，可以考虑倒序 for：

```java
for (int i = list.size() - 1; i >= 0; i--) {
    if (list.get(i).contains("枸杞")) {
        list.remove(i);
    }
}
```

这种方式可以避免元素索引错位的问题。但写起来略显繁琐，而且容易出错。一般不推荐使用，除非你知道自己在做什么。

# List

List 是 Collection 的子接口，它除了继承单列集合的基本功能（增删查改），还**具备“索引”这一特性**，可以像数组一样通过位置访问或修改元素。

这使得它在处理有序数据时，比其他集合更灵活。

## 特有方法

List 的特有方法大多都支持索引操作

#### add 增

`add(int index, E element)` 允许在集合中间插入元素，自动后移原位置及其后的所有元素。

```java
List<String> wolves = new ArrayList<>();
wolves.add("影牙");
wolves.add("雪爪");
wolves.add("赤瞳");
wolves.add("苍风");

System.out.println(wolves);
// [影牙, 雪爪, 赤瞳, 苍风]
```

现在要新增“夜哨”排在“雪爪”前头：

```java
wolves.add(1, "夜哨");
System.out.println(wolves);
// [影牙, 夜哨, 雪爪, 赤瞳, 苍风]
```

位置计算是从 0 开始的，“1” 就是“夜哨”之前。

#### `remove(int index)` 删除元素

这种删除方式比 `remove(Object o)` 更直接——**你告诉它第几位，它就动手砍第几位**。

```java
wolves.remove(2); // 移除“周芷若”
System.out.println(wolves);
// [张无忌, 赵敏, 小昭, 殷素素]
```

> 如果索引越界，会直接抛出 `IndexOutOfBoundsException`，所以动态操作前最好用 `size()` 判断一下集合长度。

#### `set(int index, E element)` 替换元素

如果想要“修改”集合中的某个数据，而不是删除再添加，可以使用 `set()`：

```java
wolves.set(2, "黑焰"); // 把“赤瞳”替换成“黑焰”
System.out.println(wolves);
// [影牙, 夜哨, 黑焰, 苍风]
```

这个方法还会返回被替换掉的那个元素，如果你要留个备份，也方便处理。

#### `get(int index)` 获取元素

要读取集合中的某一只狼，用 `get()`：

```java
String scout = wolves.get(1);
System.out.println(scout); // 夜哨
```

这是 List 最重要的差异点之一——能像数组一样用下标访问元素，而不像 Set 那样只能遍历。

明白，我们继续保持风格一致：**用狼群的例子贯穿、逻辑清晰、语言简洁流畅但不啰嗦、代码块穿插解释**。以下是你要的「遍历方式」笔记整理版：

## 遍历方式

List 因为有“索引”，所以比 Set 多了一种遍历方式，下面我们从最传统的方式讲起。

### 普通 `for` 循环

这是最基础的方式，可以访问索引，适合需要知道位置或修改某一项的场景。

```java
List<String> wolves = new ArrayList<>();
wolves.add("影牙");
wolves.add("夜哨");
wolves.add("赤瞳");

for (int i = 0; i < wolves.size(); i++) {
    String name = wolves.get(i);
    System.out.println(name);
}
// 输出：影牙 夜哨 赤瞳
```

优点是你能拿到下标 `i`，缺点是写法相对繁琐。

### 迭代器 Iterator

几乎所有的 Collection 类型都支持迭代器，是最“保险”的遍历方式。

```java
Iterator<String> it = wolves.iterator();
while (it.hasNext()) {
    String wolf = it.next();
    System.out.println(wolf);
}
// 输出：影牙 夜哨 赤瞳
```

优点是**通用、可安全删除元素**，缺点是写起来啰嗦，日常开发中用得较少，更多用于需要手动控制遍历流程的情况。

### 增强 `for-each` 循环

语法简洁，代码清爽，是绝大多数业务场景下的首选方式。

```java
for (String wolf : wolves) {
    System.out.println(wolf);
}
// 输出：影牙 夜哨 赤瞳
```

缺点是你拿不到下标，不能直接修改某一位置的值（但可以整体替换）。

### Lambda 表达式

Java 8 之后推荐的新写法，适合需要链式处理、过滤等操作的场景。

```java
wolves.forEach(wolf -> System.out.println(wolf));
// 输出：影牙 夜哨 赤瞳
```

语法极简，但不适合复杂流程控制，比如需要 `break`、`continue` 的时候就无能为力了。

## `ArrayList` 和 `LinkedList` 的区别

虽然它俩用法几乎一模一样（都是 `List` 的实现类），但**底层结构不同、适用场景也完全不同**，就像猎狼与牧狼走的不是一条路。

我们分开来看——

## `ArrayList`：基于“数组”的实现

`ArrayList` 的底层，是一块**连续存储的动态数组**。这一点决定了它的几个核心特性：

- **查询快（尤其是按索引）**

数组寻址时，JVM 直接通过地址 + 下标偏移定位：

> 要第 5 个元素？偏移 4 个单位直接拿，不需要从头数。  
> 所以 `get(index)` 是极快的，时间复杂度 O(1)。

数组为什么从 0 开始？  
因为第 0 个位置就是数组首地址，不用偏移；  
第 n 个元素直接计算 `base + n * size`，更快，**更贴近硬件逻辑**。

- **增删慢（尤其是中间位置）**

插入、删除时，会出现两种“麻烦”：

1. 插入一个元素时，**可能要搬动后面的所有元素往后挪**；
2. 删除一个元素时，**也可能要把后面的全部搬过来填空**。

```java
List<String> wolves = new ArrayList<>();
wolves.add("影牙");
wolves.add("夜哨");
wolves.add("赤瞳");

// 在中间插入，会触发“搬家”操作
wolves.add(1, "白霜");
System.out.println(wolves);
// [影牙, 白霜, 夜哨, 赤瞳]
```

你插进去一个“白霜”，后面的狼都要依次向后挪个位置，谁都嫌烦。

### 容量不足时，会自动扩容（但代价不低）

默认创建的 `ArrayList`，初始容量是 0：

```java
List<String> list = new ArrayList<>();
// 添加第一个元素时，触发扩容：默认变成长度 10 的数组
```

当空间不够时，集合会进行“自动扩容”：

- 一次加一个元素时，空间满了会**扩容为原来的 1.5 倍**
- 如果你一次性添加多个元素，**扩容长度以实际需要为准**

这些扩容操作，底层是通过 **新建一个更大的数组 + 拷贝旧数据过去** 实现的。

```java
// 底层源码（只留关键）：
private static final int DEFAULT_CAPACITY = 10;
private transient Object[] elementData;
```

所以频繁插入、删除，尤其是数据量大的时候，**`ArrayList` 的性能会急剧下滑**。

### 🐺 总结一句话：

> `ArrayList` 是“狼群排队宿舍”：排得整整齐齐，按号就位，找谁都快，但动一个就容易“炸窝”。

## `LinkedList`：基于双向链表的实现

`LinkedList` 的底层是一种**双向链表结构**。和 `ArrayList` 相比，它不依赖连续内存空间，节点之间通过指针连接，独立存在。

每个节点内部维护三部分：

- 上一个节点的地址（`prev`）
- 当前元素的值（`item`）
- 下一个节点的地址（`next`）

这种结构决定了它与 `ArrayList` 的根本差异。

- **查询慢（不能跳着查）**

因为没有“索引寻址”能力，链表必须**一个个节点顺着找**：

```java
List<String> wolves = new LinkedList<>();
wolves.add("影牙");
wolves.add("夜哨");
wolves.add("赤瞳");

String name = wolves.get(2); // 会从头开始查
System.out.println(name); // 赤瞳
```

无论你要查第几个元素，它都得从头节点开始数（或者从尾节点开始数，取决于离哪边近）。

时间复杂度是 O(n)，**越往后查，越慢**。

- **增删效率高（特别是首尾）**

新增或删除元素时，只需要改几个节点的指针，不涉及数组整体的迁移或扩容。

```java
wolves.addFirst("银背");
wolves.addLast("裂爪");

System.out.println(wolves);
// [银背, 影牙, 夜哨, 赤瞳, 裂爪]

wolves.removeFirst();
wolves.removeLast();

System.out.println(wolves);
// [影牙, 夜哨, 赤瞳]
```

这对需要频繁首尾操作的场景极其有利，**时间复杂度为 O(1)**。

### ✅ 特有方法一览（常用于首尾操作）

| 方法名          | 说明                   |
| --------------- | ---------------------- |
| `addFirst(E e)` | 在头部插入元素         |
| `addLast(E e)`  | 在尾部插入元素         |
| `getFirst()`    | 获取第一个元素         |
| `getLast()`     | 获取最后一个元素       |
| `removeFirst()` | 删除并返回第一个元素   |
| `removeLast()`  | 删除并返回最后一个元素 |

示例：

```java
LinkedList<String> wolves = new LinkedList<>();
wolves.addFirst("白狼");
wolves.addLast("灰狼");

System.out.println(wolves.getFirst()); // 白狼
System.out.println(wolves.getLast());  // 灰狼

wolves.removeFirst(); // 移除白狼
wolves.removeLast();  // 移除灰狼
```

## `LinkedList` 的典型应用场景：模拟数据结构

`LinkedList` 的结构天然适合模拟两类最常见的数据结构：

- 队列（Queue）：先进先出 FIFO
- 栈（Stack）：后进先出 FILO

### 队列（Queue）：首出尾进

适合排队处理场景，例如：消息队列、任务调度、打印任务等。

用 `LinkedList` 来实现非常直接——

- **入队（添加）**：`addLast()`
- **出队（取出）**：`removeFirst()`

```java
LinkedList<String> queue = new LinkedList<>();

// 狼群排队进入猎场
queue.addLast("灰影");
queue.addLast("刃牙");
queue.addLast("影爪");

// 出队执行任务
System.out.println(queue.removeFirst()); // 灰影
System.out.println(queue.removeFirst()); // 刃牙
```

此结构**只处理两端，不关心中间**，性能稳定，O(1) 操作。

### 栈（Stack）：后进先出

适合撤销操作、符号匹配、递归调用记录等逻辑。

Java 虽然有 `Stack` 类，但其实它早已过时，**推荐使用 `LinkedList` 模拟**，更轻便。

- **入栈（压栈）**：`push()` 等价于 `addFirst()`
- **出栈（弹栈）**：`pop()` 等价于 `removeFirst()`

```java
LinkedList<String> stack = new LinkedList<>();

// 狼群进入密林执行任务
stack.push("夜牙");
stack.push("沉影");
stack.push("雷蹄");

System.out.println(stack.pop()); // 雷蹄（最后压栈的先出来）
System.out.println(stack.pop()); // 沉影
```

这些方法的底层就是：

```java
public void push(E e) {
    addFirst(e);
}

public E pop() {
    return removeFirst();
}
```

开发中，**如果没有明确性能瓶颈，优先考虑 `ArrayList`**，因为它使用更广泛，维护简单。除非你确定需要处理**大量插入删除操作**或有**特定结构要求**，才建议用 `LinkedList`。

### 手写 LinkList

√！定义节点类：用于创建节点对象，封装节点数据和下个节点对象的地址值
public static class Node<E>{
E item;
Node<E>next；//下个节点的地址。
public Node(E item,Node<E> next){
this.item = item;
this.next = next;

官方没有变量私有, 我们也不私有

然后定义:
private int size =θ;
MyLinkedList.Node<E>first；//头指针。

定义方法

public boolean add(E e){
//维护单链表
//第一个节点，或者是后面的节点。
1/创建一个节点对象，封装这个数据
Node<E> newNode = new Node<>(e,next:null);
//判断这个节点是否是第一个节点。
if（first == null){
first = newNode;
}else
//把这个节点加入到当前最后一个节点下一个位置。
//如何找到最后一个节点对象
Node<E> temp = first; <- 特别重要!!!!!! 不要动头指针, 而是给一个临时变量, 任何情况都不要动(我这里关于为什么不要动没有说明白)
while（temp.next != null){
temp = temp.next;
temp.next =newNode;
return true;
public int size(）{
size++
return size;
有点难了, 应该再来点文字描述. 这是拓展内容

@Override
public String toString(）{
StringJoiner sb = new StringJoiner( delimiter:",",prefix: "[" ，suffix: "]");
Node<E> temp = first;
while (temp != null){
sb.add(temp.item+
temptemp.nex
return sb.toString();

# Set 集合

Set 系列集合特点：无序：添加数据的顺序和获取出的数据顺序不一致;不重复；无索引;

HashSet：无序、不重复、无索引引。
LinkedHashSet：有序、、不重复、无索引。
TreeSet:排序、不重复、无索引。

注意：
Set 要用到的常用方法，基本上就是 collection 提供的！！
自己几乎没有额外新增一些常用功能！

### HashSet

(同样帮我把人名改为一致的狼)
//目标：了解 Set 家族的特点：无序，无索引。
Set<String> set= newshs//多态，一行经典代码。
set.add（"张无忌"）；
set.add（"张无忌"）；
set.add（"朱九真"）；
set.add（"周芷若"）
set.add（"周芷若"）
set.add（"赵敏")；
set.add（"小昭");
System.out.println(set)；//[小昭，周芷若，赵敏，张无忌，朱九真]
1、为什么添加的元素无亭、不重复、无索引？
Z、增删改查数据有什么特点，适合什么场景？

在正式了解 HashSet 集合的底层原理前，我们需要先搞清楚一个前置知识：哈希值！

哈希值

就是一个 int 类型的随机数值，Java 中每个对象都有一个哈希值。
Java 中的所有对象，都可以调用 obejct 类提供的 hashcode 方法，返回该对象自己的哈希值。
publicinthashCode（）：返回对象的哈希码值。
对象哈希值的特点
）同一个对象多次调用 hashCode()方法返回的哈希值是相同的。
）不同的对象它们的哈希值一般不相但也有可能会相同(哈希碰撞)。
因为 int 顶多也就 42 亿个

HashSet 集合的底层原理
基于哈希表实现。
哈希表是一种增删改查数据，性能都较好的数据结构。
哈希表
JDK8 之前，哈希表=数组+链表
JDK8 开始，哈希表数组+链表红黑树

JDK8 之前 HashSet 集合的底层原理，基于哈希表：数组+链表
Set<String> set = new HashSet<>();① 当我们创建对象, 并第一次加数巨的时候, 创建一个默认长度 16 的数组，默认加载因子为 0.75，数组名 table
set.add("数据 1");

1. 使用元素的哈希值对数组的长度做与运算计算出应存入的位置, 其效果就跟 16 求余运算一样的. 求得的数在 0~15,
2. 然后判断数组的那个位置是不是 null, 是 null 就直接存
3. 如果不为 null, 那就调用 equals 方法比较, 相等则不存, 不相等就存入数组 4. 8 之前, 新元素是存入数组的, 占据老元素的位置, 然后把老元素挂在新元素下面 5. 8 之后, 新元素直接挂在老元素下面

另外, 还有一个什么因子 16\*0.75Ⅱ：12, 当链表过长, 链表的缺点就会体现出来, 然后数组就会扩容到 2 倍
JDK8 后做了优化, JDK8 开始，当链表长度超过 8，且数组长度>=64 时，自动将链表转成红黑树, 他们希望数据能尽可能的铺开.
红黑树就是数据小的左边走,数据大的右边走
(代码块示例一个红黑树展示)
这就比较符合将数据平铺的思想, 查询性能进一步提高.

那么为什么为什么添加的元素无序?因为哈希值本身是随机的, 哈希算法更算法本身就是随机的
不重复, 是因为算到同一个位置会判断是不是同一个元素(是这样吗?)
无索引？也是因为随机, 而且数组就一个坑位, 一个位置还有链表穿着的多个值呢

哈希表是一种增册高删改查数据性能都较好的结构。
因为他直接拿函数一算位置, 判断一下, 就直接存过去了
取数据也是拿哈希值算位置
同样的增删改查都是较好.

他也有很多问题, 他无序不重复无索引的.

Set<String>Set=newLinkedHashSet<>（)；//有序，但依然不重复，无索引。
set.add（"张无忌"）;R
set.add（"张无忌"）；
set.add("朱九真")；
set.add("周芷若");
set.add("周芷若");
set.add("赵敏");
set.add("小昭");

下面了解一些数据结构 树

二叉树 每个节点只有(是只有还最多有?)两个子节点
每个节点包含:
父节点地址值
值
左子节点 右子节点

规则：
小的存左边
大的存右边
一样的不存(为什么 java 一样的就不存?)

二叉树中，任意节点的度<=2 度：每一个节点的子节点数量
树高：树的总层数
根节点：：最顶层的节点
左子节点
右子节点
左子树
右子树

(这些概念对于我们编程都不是重点, 也算不上提高, 稍微过个眼熟就好, 正式笔记不要在这停留很久)
二叉查找性能好, 因为他用的折半查找.
二叉查找树存在的问题：
如果我的数据本身就排好了 7 10 11 12 13 那么按照刚刚的规则
(一条斜着的链表)
这就又变回链表了
当数据已经是排好序的，导致查询的性能与单链表一样，查询速度变慢！
我们当然是希望这个二叉树是越矮越好, 于是就有人提出了: 平衡二叉树!

平衡二叉树
在满足查找二叉树的大小规则下，让树尽可能矮小，以此提高查数据的性能，
什么左旋右旋, 总之就是让任意左右两边的二叉树高度差不超过 1
(11 作为头节点的平衡二叉树)

而红黑树, 就是自平衡的二叉树!
红节点是啥
黑节点是啥
他要求根节点必须是黑节点, 两个红节点不能相连, 每个路径下的黑节点是一样的
当然算法还是很复杂的, 我们了解一下即可

# 深入理解 HashSet 集合去重

其实人类早就知道怎么查找快
比如说字典!

我们以后肯定还是操作对象多一些, 那么 set 集合能不能去重对象呢?
//目标：理解 HashSet 集合去重复。
(同样帮我把案例替换成狼的)
Set<Student>sets=newHashSet<>（)；//无序，不重复，无索引
Student s1 =newStudent（name:"张继科"，sex:‘男'，hobby:"借钱"）；
Student s2=new Student( name:"林丹"，sex:‘男'，hobby:"打球"）；
Student s3=new Student（name:"景甜"，sex:‘女'，hobby:"从前的张继科"）；
Student s4=new Student(name:"景甜"，sex:'女'，hobby:"从前的张继科”）；
sets.add(s1);
sets.add(s2);
sets.add(s3);
sets.add(s4);
System.out.println(sets);

然后发现不能去重, 因为 3 4 的哈希值不一样, 甚至连在数组的位置肯定都不一样.
那我们肯定是期望内容相同的应该判定为一致.

我们就可以重写 equals 和 hashcode

//只要两个对象内容一样结果就是 true
@0verride
publicbooleanequals(objecto){
if （this ==o）return true;
if （o == null ll getClass(） != o.getClass()) return
Student student = （Student） o;
return sex == student.sex && objects.equals(name，stu
//只要两个对象的内容一样，返回的哈希值就是一样的
@0verride
public int hashCode(）{
return Objects.hash(name， sex, hobby);

这样就能去重了!
再重写个 equals, 才能完全保证安全(详细说一下为什么)

LinkedHashSet
LinkedHashSet:：有序、不重复、无索引。
依然是基于哈希表(数组、链表、红黑树)实现的
但是，它的每个元素都额外的多了一个双链表的机制记录它前后元素的位置。
The head (eldest)of the doubly linked list.
T
transient LinkedHashMap.Entry<K，V> head;
The tail (youngest) of the doubly linked list.
transient LinkedHashMap.Entry<K，V> tail;
源码里面就这么写的双节点

static class Entry<k,V>extends HashMapNode<K，V>
Entry<K， V> before,，after;
Entry(int hash, K key， V value, Node<K，V> next){ super(hash， key， value， next);}
entry 继承了哈希 map 的节点, 还拓展了前后, 为了实现双链表, 底层还是 HashMapNode

# TreeSet

特点：不重复、无索引、可排序（默认升序排序，按照元素的大小，由小到大排序）
底层是基于红黑树实现的排序。
对于数值类型：Integer，Double，默认按照数值本身的大小进行升序排序。
对于字符串类型：默认按照首字符的编号升序排序。
对于自定义类型如 Student 对象，TreeSet 默认是无法直接排序的。
自定义排序规则
TreeSet 集合存储自定义类型的对象时，必须指定排序规则，支持如下两种方式来指定比较规则。
方式一
让自定义的类（如学生类）实现 comparable 接口，重写里面的 compareTo 方法来指定比较规则。
方式二
通过调用 TreeSet 集合有参数构造器，可以设置 comparator 对象（比较器对象，用于指定比较规则。
public TreeSet(Comparator<? super E> comparator)
//目标：TreeSet 排序对象。
//方式二：TreeSet 集合自带比较器对象 Comparator
Set<Girl>set = new TreeSet<>(new Comparator<Girl>(){
@0verride
public int compare(GirlGirlo2）{
return Double.compare(o2.getHeight()，o1.getHeight());
})；//排序，不重复，无索引
set.add（newGirL（name:"赵敏"sex:女 age:21,height:169.5));
set.add（newGirL（name:"刘亦菲"sex:女"age:34,height:167.5));
set.add（newGirL（name:"李若彤"，sex:'女'age:26,height: 168.5));
Set.add（newGirL（name:"章若楠"，sex:'女'.age:19，height:171.5));
set.add（newGirL（name:"杨幂"，sex:'女 age:34，height:172.5));
System.out.println(set);

、如果希望记住元素的添加顺序，需要存储重复的元素，又要频繁的根据索引查询数据
用 ArrayList 集合（有序、可重复、有索引），底层基于数组的。（常用）
2、如果希望记住元素的添加顺序，且增删首尾数据的情况较多？
用 LinkedList 集合（有序、可重复、有索引 l），底层基于双链表实现的。 3.如果不在意元素顺序，也没有重复元素需要存储，只希望增删改查都快？
用 HashSet 集合（无序，不重复，无索引 l），底层基于哈希表实现的。（常用） 4.如果希望记住元素的添加顺序，也没有重复元素需要存储，且希望增删改查都快？
用 LinkedHashSet 集合（有序，不重复，无索引 l），底层基于哈希表和双链表。 5.如果要对元素进行排序，也没有重复元素需要存储？且希望增删改查都快？
用 TreeSet 集合，基于红黑树实现。

但一般在开发中, 几乎都只用 ArrayList 和 HashSet
