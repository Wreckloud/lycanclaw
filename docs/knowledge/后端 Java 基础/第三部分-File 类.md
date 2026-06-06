---
title: 第三部分-File 类
date: 2025-08-11 18:38:54
description: 这是一篇新文章!
order: 9
publish: true
tags:
  - Java
  - File
  - IO
---

# File 与 IO 流

在计算机里，我们存储和管理数据的方式，通常有这样几个层次：

- 单个数据用 **变量** 保存
- 一组数据用 **数组**
- 描述一个事物时用 **对象**
- 存储多个事物时用 **集合**

这些都是**内存中的数据结构**，操作速度快，效率高。但内存是暂时的，一旦断电或者程序结束，所有数据都会丢失。

为了保证数据的持久保存，我们必须借助长期存储手段。

**File 类 - 长期存储的基础**

文件是最常见、最重要的存储方式。数据存在**硬盘**上，即便断电或程序退出，内容依然保留。  
Java 提供了 `File` 类来代表文件或文件夹：

- 它在 `java.io` 包下
- 既可以指向一个具体文件，也可以指向一个文件夹
- 提供**文件信息获取**（大小、名称、修改时间）、**类型判断**、**创建/删除文件或目录**等 API

`File` 对象实际上封装的是文件系统中的路径信息，无论是文件还是文件夹，都是一个具体的对象实体。
但要注意，`File` 只能操作**文件本身**（元数据），不能直接读写文件内容。

**IO 流 - 数据的读写通道**

要想在文件中存储或读取实际数据，我们需要 IO 流（Input/Output Stream）：

- **Input**：从外部（文件、网络等）读入数据
- **Output**：将数据写出到外部
- 不仅可以操作文件，还可以处理网络传输、内存数据交换等场景

简单来说：

- **File** → 代表文件这个实体
- **IO 流** → 操作文件（或其他介质）中的数据

这两者配合使用，才能在开发中完成从“创建一个文件”到“真正往里写数据”的完整流程。

# File 类

`File` 是 Java 操作文件和文件夹的“门面”，位于 `java.io` 包。

## 创建 File 类对象

`File` 类能代表一个文件或者文件夹，本质上就是对路径的封装，路径可以是存在的，也可以是不存在的。

**构造器**：

```java
// 最常用，传入文件或文件夹的路径（字符串）
File f1 = new File("D:/resource/wolf.jpg");

// 也可以分开写，用系统分隔符拼接路径，更跨平台
File f2 = new File("D:" + File.separator + "resource" + File.separator + "wolf.jpg");

// 传父路径和子路径，比较少用
File f3 = new File("D:/resource", "wolf.jpg");
```

- `File` 只是路径的封装，不保证路径对应的文件或文件夹一定存在。
- 可以代表文件，也可以代表文件夹，创建 `File` 对象时不区分。

**路径类型**：

- **绝对路径**：从盘符开始，定位系统中的具体位置。
- **相对路径**：相对当前项目目录，适合访问项目资源。

```java
File absolute = new File("D:/resource/wolf.jpg");
File relative = new File("day08-stream-file-io/src/wolf.jpg");
```

`File` 对象创建后，可以用 `length()` 方法获取文件大小（字节数），如果是文件夹，返回的是文件夹本身的大小，不是里面内容的总和。

## 判断类型

`File` 提供了很多判断和获取文件状态、信息的方法，掌握这些能帮快速了解文件的基本情况。

### `exists()` 路径是否存在

判断这个 `File` 对象代表的文件或文件夹是否真实存在。

```java
File f = new File("E:\\resource\\meinv.jpg");
System.out.println(f.exists()); // true 表示路径存在，false 不存在
```

### `isFile()` 是否为文件

判断路径是否指向一个文件（不是文件夹）。

```java
System.out.println(f.isFile()); // true 是文件，false 不是
```

### `isDirectory()` 是否为文件夹

判断路径是否指向一个文件夹。

```java
System.out.println(f.isDirectory()); // true 是文件夹，false 不是
```

## 获取信息

### `getName()` 文件名

返回文件名（含后缀），不包含路径。

```java
System.out.println(f.getName()); // meinv.jpg
```

### `length()` 文件大小

返回文件的大小，单位是字节。注意：如果是文件夹，返回的是文件夹本身对象大小，不是里面所有文件的总和。

```java
System.out.println(f.length()); // 具体字节数
```

### `lastModified()` 最后修改时间

返回文件最后修改时间，单位是毫秒时间戳（`long`类型）。对人类没啥意义，需要格式化。

```java
long time = f.lastModified();
System.out.println(time); // 例如：1691728826000
```

时间戳转格式化字符串：

```java
// 时间戳转 LocalDateTime
LocalDateTime dateTime = LocalDateTime.ofInstant(Instant.ofEpochMilli(time), ZoneId.systemDefault());

// 格式化时间字符串
DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss EEE a");
String formattedTime = dateTime.format(dtf);

System.out.println(formattedTime); // 例如：2025-08-11 11:13:46 Mon 上午
```

### `getPath()` 路径字符串

返回创建 `File` 对象时用的路径，可能是绝对路径，也可能是相对路径。

```java
System.out.println(f.getPath()); // E:\resource\meinv.jpg 或 day08-stream-file-io/src/wolf.jpg
```

### `getAbsolutePath()` 绝对路径

返回文件的绝对路径，帮你确认文件实际所在位置。

```java
System.out.println(f.getAbsolutePath()); // D:\workspace\project\E\resource\meinv.jpg
```

## 文件创建

File 提供了几个关键方法用来创建文件、创建文件夹和删除文件/空文件夹。

### `createNewFile()` 创建新文件

`createNewFile()`：尝试创建一个新的空文件。如果文件不存在，会新建并返回 `true`，否则返回 `false`。

- 抛异常需捕获（比如路径不存在或权限不足）

```java
File f = new File("E:\\resource\\itheima666.txt");
try {
    boolean created = f.createNewFile();
    System.out.println(created); // true 表示新建成功，false 文件已存在
} catch (IOException e) {
    e.printStackTrace();
}
```

> 抛异常需捕获（比如路径不存在或权限不足）

不过这方法在开发里用得少，因为写文件流时，文件不存在一般会自动创建。

### `mkdir()` 创建单级文件夹

只能创建一级文件夹，且父目录必须存在，否则失败。

```java
File f2 = new File("E:\\resource\\leee66");
boolean success = f2.mkdir();
System.out.println(success); // true 创建成功，false 失败
```

### `mkdirs()` 创建多级文件夹（重点）

能创建多级目录，即使中间目录不存在也能自动补齐，是开发中最常用的创建目录方法。

```java
File f3 = new File("E:\\resource\\eee777\\bbb\\ccc\\fff\\fff");
boolean success = f3.mkdirs();
System.out.println(success); // true 创建成功，false 失败
```

## 文件删除

#### `delete()` 删除文件或空文件夹

能删除文件和空文件夹，但不能删除非空文件夹。删除成功返回 `true`。

```java
File f = new File("E:\\resource\\itheima666.txt");
boolean deleted = f.delete();
System.out.println(deleted); // true 删除成功，false 失败

File f2 = new File("E:\\resource\\leee66");
System.out.println(f2.delete()); // 删除空文件夹
```

> `delete()` 直接物理删除，文件不会进回收站。

想删非空文件夹必须递归删除里面所有文件和子文件夹，涉及复杂递归算法，下面再单独展开。

## 遍历文件夹

File 类里帮我们搞文件夹内容的两大法宝是 `list()` 和 `listFiles()`。

- `list()` 返回当前目录下所有**一级文件名称**（字符串数组），但只有名字，不带路径，实际作用有限。
- `listFiles()` 推荐！返回当前目录下所有**一级文件对象**（File 数组），这才是干活的利器。

假设你有个 `D:/resource` 文件夹，用 list() 获取文件名数组：

```java
File dir = new File("D:/resource");

String[] names = dir.list();
for (String name : names) {
    System.out.println(name);
}
```

这能帮你列出文件夹里的“门牌号”，但没法拿到文件的更多信息。

更实用的是`listFiles()`：

```java
File[] files = dir.listFiles();
if (files != null) {
    for (File file : files) {
        System.out.println(file.getAbsolutePath());
    }
}
```

你能拿到每个文件或子文件夹的完整路径，后续还能调用其他 File 方法做判断和处理。

使用 `listFiles()` 时要注意：

- 如果传入的 File 不是目录，或者目录不存在，返回 `null`。
- 空文件夹返回空数组（长度为 0）。
- 会包含隐藏文件和文件夹（只要权限允许）。
- 如果没有权限访问，返回 `null`。

# 递归搜索文件

遍历只能看到一级目录，要想深入子文件夹里找文件，**递归**是唯一杀手锏。

什么是递归？简单来说，就是**方法自己调自己**。但不受控的递归会死循环导致堆栈溢出（`StackOverflowError`），得靠递归终止条件控制。

```java
public static int factorial(int n) {
    if (n == 1) return 1;       // 递归终止条件
    return factorial(n - 1) * n; // 递归调用
}
```

这公式就是 `f(n) = f(n-1) * n`，一路往下算到 `f(1)`，递归结束。

递归三要素：

- 明确递归公式（方法自己调自己）
- 设定终止条件（什么时候停）
- 保证递归方向能走到终点（防止死循环）

掌握了递归，复杂的文件操作也能轻松应对。

假设需求是：在某文件夹里，找名字包含特定字符串的所有文件。

思路：

1. 先判断目录有效性，确保是文件夹且存在。
2. 取当前目录所有一级文件对象。
3. 遍历它们，如果是文件且名字符合，就打印路径。
4. 如果是文件夹，递归进去继续找。

示例代码如下：

```java
public static void searchFile(File dir, String fileName) {
    // 极端判断：路径不合法或不是文件夹，直接返回
    if (dir == null || !dir.exists() || dir.isFile()) {
        return;
    }

    // 获取当前目录所有一级文件对象
    File[] files = dir.listFiles();
    if (files == null || files.length == 0) {
        return; // 没东西，结束
    }

    // 遍历文件夹内容
    for (File file : files) {
        if (file.isFile()) {
            // 是文件，判断名字是否包含目标字符串
            if (file.getName().contains(fileName)) {
                System.out.println("找到文件：" + file.getAbsolutePath());
            }
        } else if (file.isDirectory()) {
            // 是文件夹，递归继续搜索
            searchFile(file, fileName);
        }
    }
}
```

这就是典型的深度优先遍历文件夹。

# 字节与字符编码

计算机本质上只认二进制。

最早，英文字符（包括大小写字母、数字、标点等）用 ASCII 编码，每个字符用 1 个字节（8 位）存储，能表示 128 个字符。这对英语世界来说绰绰有余。

但中文字符远比这多得多。为了解决中文存储问题，出现了 GBK 编码。GBK 能表示两万多个汉字，每个中文字符用 2 个字节存储，而且兼容 ASCII。GBK 规定：

- 如果字节的首位是 1，就是汉字（向后读两个字节）；
- 首位是 0，就是英文或数字（向后读一个字节）。

后来，Unicode 字符集横空出世，目标是囊括全世界所有文字和符号。它用 4 个字节表示一个字符，虽然通用但有点**浪费空间**。

真正实用的是 UTF-8。它是 Unicode 的一种编码方式，采用**可变长度**：

- 英文、数字等只占 1 个字节，
- 中文字符占 3 个字节。

这样既兼容 ASCII，又能高效存储多语言内容。现在写代码，也推荐统一用 UTF-8 编码，避免乱码和兼容性问题。

在 Java 里，字符和字节的相互转换，就是所谓的“编码”和“解码”。

### `getBytes()` 编码

`getBytes()` 方法可以把字符串按照指定字符集编码成字节数组。常见用法有两种：

- `byte[] getBytes()`：使用平台默认字符集（通常是 UTF-8）
- `byte[] getBytes(String charsetName)`：使用指定字符集（如 "GBK"）

```java
String wolfName = "灰牙狼";

// 默认编码（UTF-8）
byte[] bytes = wolfName.getBytes();

// 指定编码（GBK）
byte[] bytesGBK = wolfName.getBytes("GBK");
```

这样就能把字符串转成字节数组，便于后续存储或网络传输。

### `new String(byte[] bytes)` 解码

`String` 构造方法可以把字节数组还原成字符串。常见用法：

- `new String(byte[] bytes)`：用平台默认字符集解码
- `new String(byte[] bytes, String charsetName)`：用指定字符集解码

```java
// 假设 bytes 和 bytesGBK 是上面编码得到的字节数组

// 默认解码（UTF-8）
String decodedUTF8 = new String(bytes);
System.out.println(decodedUTF8);

// 指定解码（GBK）
String decodedGBK = new String(bytesGBK, "GBK");
System.out.println(decodedGBK);
```

只要编码和解码时用的字符集一致，内容就不会乱码。
