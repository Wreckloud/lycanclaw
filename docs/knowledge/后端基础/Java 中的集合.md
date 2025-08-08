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

# Collection 单列集合

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

#### `add(E e)` 增

`add` 方法用于向集合中添加一个元素。大多数集合类型都支持添加重复元素（如 List），而像 Set 则会自动去重。

```java
Collection<String> wolves = new ArrayList<>();
wolves.add("灰影");
wolves.add("血牙");
wolves.add("灰影"); // 可以重复添加
System.out.println(wolves); // [灰影, 血牙, 灰影]
```

#### `remove(Object o)` 删

`remove` 方法用于删除集合中**首次出现**的指定元素。

```java
wolves.remove("灰影"); // 只会删除第一个灰影
System.out.println(wolves); // [血牙, 灰影]
```

注意，`remove` 不是删除所有相同元素，只删第一个。要删除全部，可以搭配循环或 `removeIf`。

#### `contains(Object o)` 是否包含

`contains` 用于判断集合中是否存在某个元素，相当于“查”操作。

```java
System.out.println(wolves.contains("血牙")); // true
System.out.println(wolves.contains("银狼")); // false
```

#### `size()` 获取集合大小

返回当前集合中元素的数量。

```java
System.out.println(wolves.size()); // 2
```

#### `isEmpty()` 集合是否为空

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

#### `addAll(Collection<? extends E> c)` 合并

有时候我们需要把两个集合的数据合并，就用 `addAll()`。

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

### 迭代器（Iterator）遍历

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

### 异常触发机制

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

### `remove()` 迭代器的删除方法

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

# List 集合

List 是 Collection 的子接口，它除了继承单列集合的基本功能（增删查改），还**具备“索引”这一特性**，可以像数组一样通过位置访问或修改元素。

这使得它在处理有序数据时，比其他集合更灵活。

## 特有方法

#### `add(int index, E element)` 插入元素

List 允许你**在集合中间插入元素**，自动后移原位置及其后的所有元素。

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
