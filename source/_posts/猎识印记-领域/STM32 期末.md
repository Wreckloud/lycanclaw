---
title: STM32 期末
date: 2025-05-28 09:54:34
published: false
tags:
categories: 
excerpt: "这是一篇新文章!"
thumbnail: "/img/文章封面/defaultcover.jpg"
---

AHB 高性能总线 
用于连接处理器和高带宽、低延迟的主要系统组件，如存储器、高速外设等。

APB 简单和低功耗的总线
主要用于连接较低带宽、较高延迟的外设，如GPIO（通用输入/输出）、定时器等。

在STM32嵌入式系统中
AHB总线用于连接高速外设/存储器，而APB总线用于连接低速外设/存储器。


DMA（Direct Memory Access，直接内存访问） 
数据传输技术
直接与内存进行数据交换，而无需经过中央处理器(CPU)
提高CPU的响应速度。

最小嵌入式系统(理解)
具有基本功能的简化的嵌入式系统
包括必要的组件和资源，以实现特定的任务或功能，
并尽可能减少硬件和软件的复杂性与资源消耗
一般包含三个部分：
电源电路 供电
复位电路 重启
晶振电路 时钟信号

# GPIO

通用目的输入输出
控制外部设备模拟输出脉冲生成
读取开关、读取传感器数据、外部中断检测

模拟信号连续变化的信号
数字信号是离散的信号在模拟信号上采样可以得到数字信号

引脚编号采用"Px:y"的格式，其中:
P表示引l脚端口号，x表示引脚号，y表示引脚的多功能编号
例如，PA4表示端口A的第4号引I脚，PB10表示端口B的第10号引脚。
GPIO的端口：端口号分组管理引脚的编号
STM 32 F103系列 三个端口 Port A (PA)、Port B (PB)、Port C (PC)
STM 32 F407系列 四个端口 Port A (PA)、Port B (PB)、Port C (PC)、Port D (PD)

同一个引脚集成了多种功能, 我们的工作就是写代码打开引脚的指定功能(寄存器配置多种功能) 例如串口通信 定时器 I2C总线

因为电压不可能是方方正正的, 为了滤出规整的信号, 施密特触发能滤出这种方波信号


上拉电阻, 保持在高电平, 提高电路对外部驱动能力
浮空状态 引脚状态不确定 有危害
下拉电阻 保持在低电平状态, 没有外部信号驱动


GPIO的工作模式
(已集成, 直接配置寄存器即可使用)
上拉输入
下拉输入
浮空输入
模拟输入(关闭施密特触发)

mos管 场效应管

推挽输出 (将电流推出挽回)
Q1 打开 Q2 关闭 输出高电平 相反输出低电平 (都关闭: 浮空/高阻态)
开漏输出 (相当于上面的Q1不参与, Q2的漏极是开的)
Q1 始终关闭 Q2 打开 - 低电平 相反为浮空/高阻态
复用推挽输出 I2C
复用开漏输出 PWM USART

在数字电路中，信号复用是一种技术
通过共享相同的物理引脚来传输多个信号
这种技术可以节省引脚数量，提高系统的
灵活性和效率。复用推挽输出是其中一种
常见的复用方式，它使用推挽输出器来驱
动共享的物理引脚

引脚的复用(I2C PWM USART)

# 主要寄存器设置(了解)

.GPIOxMODER(GPIO Mode Register）:
此寄存器用于配置引脚的工作模式 (输入或输出)
每个引脚都有两个位用于设置其工作模式
例如：00表示引l脚为输入模式，01表示引脚为输出模式

2.GPIOxOTYPER（GPIO Output Type Register）:
此寄存器用于配置输出引脚的输出类型
例如：对于开漏输出(Open Drain)或推挽输出(Push-Pull)

GPIOx_OSPEEDR(GPIO Output Speed Register）:
此寄存器用于配置输出引脚的输出速度。
可以选择引脚的输出速度（低、中、高等级）以适应具体的应用要求

GPIOx_PUPDR（GPIOPull-Up/Pull-DownRegister）:
此寄存器用于配置上拉或下拉电阻 (Pull-Up/Pull-Down Resistor）的
可以选择是否启用上拉或下拉电阻，或者禁用它们。

5.GPIOx_IDR（GPIOInputDataRegister）:
此寄存器用于读取输入引脚的状态。
每个位对应一个引脚，可以通过读取相应位的值来获取输入引脚的状

.GPIOxODRR（GPIO Output Data Register）:
此寄存器用于写入输出引脚的状态。
每个位对应一个引脚，可以通过写入相应位的值来设置输出引脚的状

7.GPIOx_BSRR（GPIOBitSet/ResetRegister）:
此寄存器用于对输出引l脚进行原子性的置位（Set）或复位（Reset）
可以通过写入相应的位来设置或清除输出引脚的状态。

# 主要库函数 SPL(了解)

1.GPIO_InitO:
该函数用于初始化 GPIO引I脚的配置，设置引脚的模式、速度、上拉
2.GPIO_WriteBitO:
用于设置GPIO引脚的输出状态，将引脚设置为高电平或低电平
3.GPIO_ReadInputDataBitO:
用于读取GPIO输入引脚的状态，获取引脚的电平状态。

4.GPIO_SetBitsO和GPIO_ResetBitsO:
分别用于设置和复位多个GPIO引脚，可以同时操作多个引I脚的状态

想让一个led闪烁, 用导线与发光管相连, 只要控制引脚的输出, 就能控制led亮灭. 设置为推挽输出模式就能控制引脚输出


```C
#include "stm32fxxx.h"

#define LED PIN GPIO_Pin_13 // 所连引脚的编号
#define LED_PORT GPIOC // 所连接的端口 PC13

void Delay(uint32_t time){
	while(time--)
}

int main(void)
GPIO_InitTypeDef GPIO_InitStructure;
//使能GPIO端口的时钟
RCC_AHB1PeriphClockCmd(RCC_AHB1Periph_GPIOC, ENABLE);
//配置GPIO引I脚为输出模式
GPIO InitStructure.GPIO Pin = LED PIN;
GPIO InitStructure.GPIO Mode = GPIO Mode _OUT;
GPIO_InitStructure.GPIO_OType = GPIO_OType _PP;
GPIO Initr(LED_PORT, &GPIO_InitStructure);

while (1) 
//点亮LED
GPIO SetBits(LED_PORT, LED_PIN);
Delay(1000000);//延时一段时间
//熄灭LED
GPIO ResetBits(LED _PORT, LED_PIN);
Delay(1000000);// 延时一段时间
```

# 中断

什么是中断
实时响应 外部事件/内部事件

中断处理函数
/外部中断线0的中断处理函数
void EXTI6IRQHandler(void)
//在此处编写处理外部中断线0的中断事件的代码
//清除中断标志，以便下一次触发中断
EXTI _ClearITPendingBit(EXTI _LineO);


中断向量表(InterruptVectorTable）是一张存储中断处理函数地址的表格
它是一个特殊的数据结构，用于将特定的中断向量与相应的中断服务子程序
(Interrupt Service Routine，ISR）关联起来。

中断可以分为以下几种类型
外部中断(External Interrupts)
定时器中断(Timer Interrupts)
UART中断(UART Interrupts)
DMA中断(DMA Interrupts)
ADC中断(ADC Interrupts)

边沿触发 上升/下降/双边

灵活 抗干扰能力

在STM32微控制器中，中断线与引脚之间有一
定的关系
具体来说，外部中断线与引脚之间是通过中断
线选择寄存器进行配置和关联的。
每个GPIO引脚可以被分配给一个或多个外部中
断线。通过配置中断线选择寄存器，可以选择
将特定的引脚与相应的外部中断线相关联


NVIC
中断控制器

一些寄存器配置
NVIC_ISER : 中断开关 能够使用中断
NCIV_ICER: 禁止开关 能够禁止中断
NVIC_IPR: 设置中断优先级
NVIC_ICPR: 清除中断标志位
NVIC_ISPR: 设置中断标志位


优先级组
抢占式优先级 子优先级 所占用的位数
通常，STM32F系列微控制器支持4种优先级组配置
0+4=4
1+3=4

先看抢占式优先级(第一优先级)
再看子优先级

要解释STM32中断优先级的概念以及如何配置中断优先级。
解:
STM32中断优先级指定了在多个中断同时发生时，处理器选择响应优先级最高的中断
较高抢占优先级的中断可以打断较低优先级的中断。
可以使用NVIC库函数中的NVIC_SetPriority函数来设置中断的优先级。
通过指定优先级分组方式和具体的优先级值，可以配置中断的优先级。
较低的数值表示较高的优先级。


在STM32微控制器上设置中断的一般流程如下：
1.选择中断线和引脚：确定要使用的中断线和相应的引脚。
在STM32中，不同的引脚可以与不同的中断线相关联。
2.配置引脚：将选定的引脚设置为中断模式
3.设置触发时机（上升沿、下降沿、双边沿或低电平触发)
在STM32微控制器上设置中断的一般流程如下：
4.配置中断控制器：STM32具有中断控制器负责管理和控制中断。
使用寄存器和相应的位操作来配置中断控制器。
主要的中断控制器寄存器包括NVIC（NestedVectoredInterruptController)
编写中断服务程序：编写中断服务程序（Interrupt Service Routine，简称ISR）
这是一段特殊的代码，用于处理中断事件。在中断发生时调用并执行ISR。
确保ISR尽可能地简洁高效，以便快速完成中断处理并返回到主程序。

步骤1的寄存器：
EXTIIMRR（Interrupt MaskRegister）：用于配置中断线对应的引脚是否启用中断。
每个位控制一个中断线对应的引脚，如果将该位设置为1，则启用该引脚的中断。
对应的标准库函数
GPIO_EXTILineConfigO函数用于配置引脚与中断线的关联。该函数的原型如下:
void GPIO_EXTILineConfig(uint8_t GPIO_PortSource, uint8_t GPIO_PinSource);
该函数用于将指定的GPIO引脚与相应的中断线关联起来
GPIO_PortSource参数指定引脚所属的GPIO端口号（例如GPIO_PortSourceGPIOA表
示GPIOA端口），GPIO_PinSource参数指定引脚的位号。

步骤2的寄存器：
GPIOx_MODER（GPIOPort Mode Register）：该寄存器用于配置引脚的模式。
每个引脚占用两个位，通过设置这两个位来选择引脚的功能模式。
00：输入模式
假设我们要将引脚配置为中断模式，需要将对应的引脚位设置为输入模式。
对应的标准库函数
GPIO_InitTypeDef GPIO_InitStruct;
GPIO_InitStruct.Pin=GPIO_PIN_O;//设置引I脚号
GPIO_InitStruct.Mode=GPIO_MODE_INPUT;// 设置为输入模式
GPIO[nit(GPIOA,&GPIO_InitStruct); // 初始化GPIOA引I脚

步骤3的寄存器：
在STM32微控制器中，以下是用于配置触发方式的一些常见寄存器：
EXTI_RTSR（Rising Trigger Selection Register）：该寄存器用于配置外部中断线的
上升沿触发中断。将位设置为1时，表示该中断线在引脚的上升沿触发中断。
EXTI_FTSRR（Falling Trigger Selection Register）：该寄存器用于配置外部中断线的
下降沿触发中断。将位设置为1时，表示该中断线在引脚的下降沿触发中断。

对应的标准库函数
 EXTI_RisingTriggerCmd(uint32_t EXTI_ Line, FunctionalState NewState)
EXTI _FallingTriggerCmd(uint32_t EXTI_Line, FunctionalState NewState)
EXTI_Line：表示要配置触发方式的外部中断线
NewState：表示要设置的触发方式，是一个FunctionalState类型的参数·

步骤4NVIC相关寄存器和库函数：
NVIC _ISER:中断使能寄存器。用于使能中断。
每个位对应一个中断线，置位表示使能相应的中断线。
NVIC _ICER:中断禁止寄存器。与NVIC_ISER相反，用于禁止中断。
每个位对应一个中断线，置位表示禁止相应的中断线。
NVIC_IPR：中断优先级寄存器组。用于设置每个中断的优先级。
每个中断有一个对应的中断优先级寄存器。优先级值越低，表示优先级越高。
NVIC_ICPR：中断清除寄存器。用于清除中断挂起标志位。
每个位对应一个中断线，置位表示清除相应中断线的挂起状态。

步骤4NVIC相关寄存器和库函数：
对应的标准库函数
NVIC_EnableIRQ(uint32_t IRQn):使能指定中断线(IRQn对应的中断)
NVIC_DisableIRQ(uint32_t IRQn):禁用指定中断线。
NVIC_SetPriority(uint32_t IRQn, uint32_t priority): 设置指定中断的优先级。
优先级范围从o（最高）到（PriorityGroup个数-1）(最低)。
NVIC_SetPriorityGrouping(uint32_t PriorityGroup):设置中断优先级分组。
可选值有4个分组方式：0(4位抢占优先级，0位响应优先级)
1(3位抢占优先级，1位响应优先级）、2(2位抢占优先级，2位响应优先级)
3(1位抢占优先级，3位响应优先级)