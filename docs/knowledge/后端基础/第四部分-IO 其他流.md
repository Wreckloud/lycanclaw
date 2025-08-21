---
title: '第四部分-IO 其他流'
date: '2025-08-20 19:37:01'
description: '这是一篇新文章!'
order: 0
publish: true
tags: 
---
![](../../public/images/文章资源/第四部分-io-其他流/file-20250820193716146.jpg)
PrintStream/PrintWriter （打印流）
作用：打印流可以实现更方便、更高效的打印数据出去，能实现打印啥出去就是啥出去

PrintStream提供的打印数据的方案
构造器说明
public PrintStream(OutputStream/File/String)打印流直接通向字节输出流/文件/文件路径
public PrintStream(String fileName, Charset charset)可以指定写出去的字符编码
public PrintStream(OutputStream out, boolean autoFlush)可以指定实现自动刷新
public PrintStream(OutputStream out, boolean autoFlush, String encoding)可以指定实现自动刷新，并可指定字符的编码

方法说明
public void println(Xxx xx)打印任意类型的数据出去
public void write(int/byte[]/byte[]—部分)可以支持写字节数据出去


特殊流就不用多态写了
public class PrintStreamDemo1{
public static void main(String[]args){
try（
//目标：打印流：方便，高效的写数据出去。
PrintStream ps = new PrintStream( fileName:"day1o-io-code/src/ps.txt");
){
ps.println(666);
ps.println(97);
ps.println(97.9);
ps.println('a');
ps.println(true);
ps.println("深圳黑马Java!");
}catch（Exception e）{
e.printStackTrace();
8

能够做到打印啥就是啥
输出文件:
666
97
97.9
a
true
深圳黑马Java!(后面帮我全部换掉成狼的)

他还会自带换行.

点进去看源码:
private PrintStream(boolean autoFlush, OutputStream out) {
super(out);
this.autoFlush = autoFlush;
this.charset = out instanceof PrintStream ps ? ps.charset() : Charset.defaultcharset()
this.char0ut = new OutputStreamWriter( out:this，charset);
this.textout = new BufferedWriter(charout);
//usemonitors whenPrintStreamis sub-classed
if （getClass(） == PrintStream.class）{
lock = InternalLock.newLockorNull();
}else{
lock = null;
看关键信息, 他是基于基于buffer,性能肯定不差的.


PrintWriter提供的打印数据的方案
构造器说明
 public Printwriter(OutputStream/writer/File/String)打印流直接通向字节输出流/文件/文件路径
public Printwriter(String fileName, Charset charset)可以指定写出去的字符编码
N
public Printwriter(OutputStream out/Writer, boolean autoFlush)可以指定实现自动刷新
public Printwriter(OutputStream out, boolean autoFlush, String encoding)可以指定实现自动刷新，并可指定字符的编码
方法说明
public void println(Xxx xx)打印任意类型的数据出去
public void write(int/String/char[]/..)可以支持写字符数据出去

用法是一样的.
不过他的写入是覆盖,如果一定要追加,还得包低级管道,打开追加模式
public static void main(String[] args）{
try（
//目标：打印流：方便，高效的写数据出去。
PrintStream ps = new PrintStream("day10-io-code/src/ps.txt");
// PrintWriter ps = new PrintWriter("day10-io-code/src/ps.txt");
PrintWriter ps = new PrintWriter(new FileWriter(fileName:"day10-io-code/src/ps.txt", append: trueD);
ps.println(666);I
ps.println(97);
ps.println(97.9);
ps.println('a');
ps.println(true);
ps.println("深圳黑马Java!");
} catch（Exception e）{
e.printStackTrace();


打印数据的功能上是一模一样的：者都是使用方便，性能高效 (核心优势)
如果非要找区别:
PrintStream继承自字节输出流OutputStream因此支持写字节数据的方法。
PrintWriter继承自字符输出流Writer，因此支持写字符数据出去。
但是我们一半不用他的写功能, 所以实际上他们就是没有区别.

打印流的一种应用：车输出语句的重定向
public static void main(String[] args） throws Exception {
//目标：输出语句的重定向。
System.out.println("红豆生南国");
System.out.println（"春来发几枝");
PrintStream ps = new PrintStream(new File0utputStream( name:"day10-io-code/src/ps2.txt",append: true));
System.setout（ps）；/把系统类的打印流改成我的打印流！！
T
System.out.printLn（"愿君多采");
System.out.printLn（"此物最相思")；

我们用的sout, 其实是系统里得到的out对象,他是一个 System public staticfinaPrintStream out 是一个PrintStream打印流对象, out 调用往控制台打印的printLn方法.我们知道改自己的路径就行了


![](../../public/images/文章资源/第四部分-io-其他流/file-20250820195501405.jpg)

DataOutputStream（数据输出流）
允许把数据和其类型一并写出去。
构造器说明
public DataoutputStream(OutputStream out)创建新数据输出流包装基础的字节输出流
方法说明
public final void writeByte(int v) throws IOException将byte类型的数据写入基础的字节输出流
public final void writeInt(int v) throws IOException将int类型的数据写入基础的字节输出流
public final void writeDouble(Double v) throws IOException将double类型的数据写入基础的字节输出流
public final void writeUTE(String str) throws IOException将字符串数据以UTF-8编码成字节写入基础的字节输出流
public void write(int/byte[]/byte[]—部分)支持写字节数据出去