---
title: VUE 3-组合式API
date: 2025-05-17 15:12:40
description: Vue 3组合式API详解、核心特性及实战技巧
publish: true
tags:
  - VUE
---

# Vue 3 核心概念

Vue 3 不仅是一次版本更新，更是一次从内到外的全面革新，带来了三大核心提升：

- **代码组织**: 按逻辑关注点组织代码，而非选项类型
- **逻辑复用**: 轻松提取和复用逻辑，避免 mixins 缺陷
- **类型支持**: 更完善的 TypeScript 支持
- **体积更小**: 更好的 Tree-shaking 支持

## 快速创建项目

```bash
# 确保 Node.js 版本 >= 16.0
npm init vue@latest
```

Create-Vue 作为新一代脚手架工具，底层使用 Vite 构建工具，提供了极速的开发体验，彻底告别了漫长的等待时间。

## 项目结构与关键文件

项目创建完成后，你会看到几个重要的文件：

- **vite.config.js**：Vite 的项目配置文件
- **package.json**：依赖管理文件，包含 Vue 3.x 和 Vite
- **main.js**：使用`createApp()`创建应用实例，替代了 Vue 2 的`new Vue()`
- **App.vue**：根组件，与 Vue 2 相比有这些变化：
  - script 和 template 顺序可调整
  - template 不再要求唯一根元素
  - 支持`<script setup>`直接编写组合式 API
- **index.html**：提供 id 为"app"的挂载点，作为整个应用的入口

# 组合式 API 基础

## setup 选项

组合式 API 的核心入口是 setup 选项，它具有以下特点：

- 执行时机比 beforeCreate 钩子还早
- 由于执行时机太早，setup 函数中无法获取到 this（this 为 undefined）
- 定义的数据和函数需要在 setup 最后 return，才能在模板中使用

```javascript
export default {
  setup() {
    // 在这里定义响应式数据、方法和生命周期钩子
    const count = ref(0)

    function increment() {
      count.value++
    }

    // 必须返回模板中需要用到的内容
    return { count, increment }
  }
}
```

**setup 语法糖**

Vue 3 提供了`<script setup>`语法糖，大大简化了组合式 API 的使用：

```vue
<script setup>
// 引入API
import { ref } from 'vue'

// 声明响应式状态
const count = ref(0)

// 定义方法
function increment() {
  count.value++
}
// 无需return，顶层变量和函数自动暴露给模板
</script>
```

> 推荐用法：更简洁，自动暴露变量，更好的 IDE 支持。

# 响应式系统

Vue 的响应式 API 用于让 JS 数据变化自动更新到 DOM。两种核心方式：

### `reactive()`：让对象变响应式

适合复杂结构，如嵌套对象、数组等。

```js
import { reactive } from 'vue'

// 创建响应式对象
const state = reactive({
  count: 0,
  user: { name: '张三' }
})

// 直接修改属性触发更新
state.count++
state.user.name = '李四'
```

**解构将失去响应性**

解构得到的是值的复制而非响应式引用。

```js
const state = reactive({ count: 0, name: '张三' })

// ❌ 错误：解构后失去响应性
const { count, name } = state
```

为保留响应性，推荐使用 `toRefs()`：

```js
// 使用toRefs保持响应性
import { toRefs } from 'vue'
const { count, name } = toRefs(state)
```

若你使用的是 **Pinia 状态管理库**，则可用 `storeToRefs()`，它能自动为状态属性创建响应式引用。

```js
// ✅ 或者从ref对象中解构（专用于store）
import { storeToRefs } from 'pinia'
const { count, name } = storeToRefs(store)
```

普通解构拿到的是“值的副本”，响应追踪中断；而 `toRefs()` 和 `storeToRefs()` 提供的是“响应式引用”。

## ref - 包装任意值

适合数字、字符串、布尔值等，也可用于 DOM 引用。

```js
import { ref } from 'vue'

const count = ref(0)          // 基本类型
count.value++                 // 修改必须用 `.value`

const user = ref({ name: '张三' })
user.value.name = '李四'      // 对象也能包装
```

> **模板中不写 `.value`，JS 逻辑必须 `.value`** —— 因为模板会“解包”，JS 不会。

在 JavaScript 中，必须通过 `count.value` 才能访问实际数据。`ref()` 创建的是一个包含 `.value` 属性的响应式“壳子对象”：

```js
console.log(count)
// 输出：RefImpl {value: 0, ...}
```

在 `<template>` 中，如果你使用的是 **`<script setup>` 语法**，Vue 会自动对 `ref` 做“解包”，帮你处理 `.value`：

```vue
<template>
  <p>{{ count }}</p>  <!-- 自动读取 count.value -->
</template>
```

**`ref()` 的底层其实也是 `reactive()`**

`ref(0)` 等价于 `reactive({ value: 0 })`，并对外暴露 value 这个属性

Vue 源码中的实现就是把你的数据套在一个 `{ value: yourData }` 对象上，再用 `reactive()` 处理它。因此：

- `ref` 适合简单值（基础类型、DOM 引用）
- `reactive` 适合复杂结构（对象、嵌套数据）

```js
import { reactive } from 'vue'

const raw = reactive({ value: 0 })
console.log(raw.value) // 实际和 ref 的内部行为一致
```

> `ref()` 是对 `reactive({ value })` 的封装，让你写起来更简单、更一致。

# 计算和侦听

## computed - 计算属性

当依赖的数据变化时，它会自动重新计算并记住结果，适合需要重复使用的计算逻辑。

```js
// 基础用法：自动计算值
const count = ref(0)
const doubleCount = computed(() => count.value + 2)
```

大部分情况计算属性应该是只读的
需要可写的计算属性时（比如拆分姓名），可以这样用：

```javascript
const fullName = computed({
  get: () => `${firstName.value} ${lastName.value}`,
  set: (val) => [firstName.value, lastName.value] = val.split(' ')
})
```

> 优先用计算属性代替模板内的复杂表达式，更高效易维护

## watch 侦听器

当需要在数据变化时做些事情（比如打印日志、发起请求），就用侦听器：

```javascript
// 基本侦听：数据变化时通知
watch(count, (newVal, oldVal) => {
  console.log(`从${oldVal}变成${newVal}`)
})
```

需要侦听多个值，只需将值的位置改为多个值的数组对象即可：

```javascript
watch(
  [count1, count2],
  ([newVal1, newVal2], [oldVal1, oldVal2]) => {
    console.log(`count1从${oldVal1}变成${newVal1}`)
    console.log(`count2从${oldVal2}变成${newVal2}`)
  }
)
```

**立即执行**
配合 `immediate: true` 可在组件创建时立即获取初始值：

```javascript
// 会在组件创建时立即打印一次
watch(count, (newVal, oldVal) => {
  console.log(`从${oldVal}变成${newVal}`)
},{
  immediate: true
})
```

**深度侦听**

有时候，我们不只是监听单个变量，而是要跟踪整个对象内部的变化。
只需添加 `deep: true` ，就能监听对象内部所有变化：

```javascript
const countObj = reactive({
  count: 0,
  inner: {
    subCount: 0
  }
})

watch(countObj, (newVal, oldVal) => {
  console.log('对象发生变化:', newVal)
}, {
  deep: true
})

```

**精确侦听**

深度监听消耗较大，推荐尽量精确监听特定属性而非整个对象。
当只需要监听特定嵌套属性时，使用函数形式：

```javascript
// 只监听 countObj.inner.subCount 变化
watch(
  () => countObj.inner.subCount,
  (newVal, oldVal) => {
    console.log(`子计数变化: ${oldVal} → ${newVal}`)
  }
)

// 其他字段变更不会触发
countObj.inner.subCount = 10 // 触发
countObj.count = 10 // ❌ 不触发
```

# 生命周期钩子

生命周期函数是组件的钩子，用于执行特定时机的操作，比如挂载时进行 DOM 操作或 API 请求，卸载前清理资源。

**选项 API 与 组合式 API 对应**

| 选项 API      | 组合式 API      | 触发时机         |
| ------------- | --------------- | ---------------- |
| beforeCreate  | setup 本身      | 组件创建前       |
| created       | setup 本身      | 组件创建后       |
| beforeMount   | onBeforeMount   | DOM 挂载前       |
| mounted       | onMounted       | DOM 挂载后       |
| beforeUpdate  | onBeforeUpdate  | DOM 更新前       |
| updated       | onUpdated       | DOM 更新后       |
| beforeUnmount | onBeforeUnmount | 组件卸载前       |
| unmounted     | onUnmounted     | 组件卸载后       |
| errorCaptured | onErrorCaptured | 捕获后代组件错误 |

在 Vue 3 中，`<script setup>` 本身就**取代了 Vue 2 中的 `beforeCreate` 和 `created`**，你在 setup 里写的代码会在组件实例创建之前执行，比这些生命周期更早。

### 基本用法

最常用的写法是两步：

```js
<script setup>
// 1. 从 `vue` 中导入所需生命周期函数
import { onMounted, onBeforeUnmount } from 'vue'

// 2. 在 `<script setup>` 中直接使用
onMounted(() => {
  console.log('组件挂载完成')
})

onBeforeUnmount(() => {
  console.log('组件即将卸载')
})
</script>
```

### 最佳实践

Vue 生命周期函数很多，但常用的其实就几个，掌握好它们就足够应对大部分场景。

**初始化第三方库**

```js
<script setup>
import { onMounted, onBeforeUnmount } from 'vue'

onMounted(() => {
  const chart = initChart('#chart')

  onBeforeUnmount(() => {
    chart.destroy()
  })
})
</script>
```

第三方库往往需要在 DOM 准备好后`onMounted`初始化，在组件销毁前`onBeforeUnmount`销毁资源，避免内存泄漏。

**加载异步数据**

```js
<script setup>
import { onMounted } from 'vue'

onMounted(async () => {
  try {
    loading.value = true
    data.value = await fetchData()
  } catch (err) {
    error.value = err
  } finally {
    loading.value = false
  }
})
</script>
```

异步请求可以直接写在 `onMounted` 中。相比 Vue 2 中常见的 `created`，Vue 3 推荐在 `onMounted` 中处理数据加载，因为这时 DOM 已准备好，逻辑更清晰。

**同一生命周期可以注册多个函数**

```js
onMounted(() => {
  console.log(1)
})

onMounted(() => {
  console.log(2)
})

onMounted(() => {
  console.log(3)
})
// 输出结果 1 2 3, 多次调用会按顺序执行。
```

Vue 3 中，多次调用会按顺序执行，适合将不同逻辑分组，增强代码可读性。
这是组合式 API 的重要特性之一。

# 组件通信

## 父传子通信 - Props

在 Vue3 中，父组件向子组件传递数据是最基本的通信方式。通常只需两步：

1. 父组件传入属性
2. 子组件通过 `defineProps` 接收使用

### 父组件绑定属性

```vue
<template>
  <ChildComponent :name="userName" />
</template>

<script setup>
import ChildComponent from './ChildComponent.vue'

const userName = '骸雲'
</script>
```

### 子组件中通过 `defineProps` 接收

子组件直接插值

```vue
<template>
  <p>{{ name }}</p>
</template>

<script setup>
defineProps(['name'])
</script>
```

如果在 script 中需要使用 props 变量：

```vue
<script setup>
const props = defineProps(['name'])

console.log('收到名字:', props.name)
</script>
```

**类型定义（推荐 ✅）**
这种写法可以指定类型、默认值和是否必传，更加规范。

```vue
<script setup>
const props = defineProps({
  name: String,
  age: Number,
  isAdmin: {
    type: Boolean,
    default: false
  }
})
</script>
```

**简单接收（数组语法）**

```vue
<script setup>
const props = defineProps(['name', 'age', 'isAdmin'])
</script>
```

**解构 props（搭配默认值）**

这样做可以直接使用变量，不必 props.xxx 访问，但注意：**失去了类型校验能力**。

```vue
<script setup>
const { name, age = 18 } = defineProps(['name', 'age'])
</script>
```

## 子传父通信 - `emit`

在 Vue3 中，子组件要向父组件发送事件，可通过组合式 API 中的 `defineEmits` 实现。这同样分两步：

1. 子组件通过 `defineEmits` 定义事件
2. 父组件监听子组件发出的事件

### 子组件中触发事件

```vue
<script setup>
// 通过 defineEmits编译器宏 生成emit方法
const emit = defineEmits(['sayHi'])

function handleClick() {
// 触发自定义事件 并传递参数 emit('事件名称', '值')
  emit('sayHi', '你好，父组件！')
}
</script>

<template>
  <button @click="handleClick">点击发送</button>
</template>
```

- 事件名使用字符串数组定义
- `emit(事件名, 参数)` 发送事件与数据

### 父组件监听事件

```vue
<template>
<!-- 绑定自定义事件 -->
  <ChildComponent @sayHi="handleSayHi" />
</template>

<script setup>
import ChildComponent from './ChildComponent.vue'

function handleSayHi(message) {
  console.log('收到子组件消息：', message)
}
</script>
```

## 跨层传递普通数据 - `provide` / `inject`

当需要在多个层级之间共享数据，又不想 props 一层层传递时，就可以使用这对组合。

1. 顶层组件通过 provide 函数提供数据 `provide('key'，顶层组件中的数据)`
2. 底层组件通过 inject 函数获取数据 `const message = inject('key')`

### 父组件（提供者）使用 `provide`

```vue
<script setup>
import { provide } from 'vue'

const themeColor = 'dark'
provide('color', themeColor)
</script>

<template>
  <LayoutComponent />
</template>
```

### 任意子孙组件中使用 `inject`

```vue
<script setup>
import { inject } from 'vue'

const color = inject('color')

console.log('注入到的主题色:', color) // 'dark'
</script>
```

传递方法也是类似逻辑，只需将原先传递的变量替换为方法：

```vue
<!-- 顶层组件 -->
<script setup>
import { provide } from 'vue'

// 提供方法而非数据
provide('openModal', () => {
  console.log('打开全局弹窗')
  isModalOpen.value = true
})
</script>

<!-- 深层子组件 -->
<script setup>
const openModal = inject('openModal') // 注入方法

// 直接调用祖先提供的方法
button.addEventListener('click', openModal)
</script>
```

# 模板引用与组件实例

在 Vue3 中，可以通过 `ref` 配合 `ref="xxx"` 实现对 DOM 或组件实例的访问，常见于需要手动操作 DOM 或调用子组件方法时。

## DOM 引用

通过 `ref="xxx"` 绑定 DOM，再通过 `xxx.value` 访问元素。常用于手动聚焦、滚动等。

例如，获取 DOM 节点，当元素装载时自动聚焦：

```vue
<template>
  <!-- 通过ref标识绑定ref对象 -->
  <input ref="inputRef" />
</template>

<script setup>
import { ref, onMounted } from 'vue'
// 调用ref函数得到ref对象
const inputRef = ref(null)

onMounted(() => {
  inputRef.value.focus()
})
</script>
```

**引用表单元素并调用方法**

```vue
<template>

  <form ref="formRef">
    <!-- 表单内容 -->
  </form>
</template>

<script setup>
const formRef = ref(null)

onMounted(() => {
  formRef.value.validate()
})
</script>
```

## 父组件访问子组件实例

默认情况，在`<script setup>`语法糖下组件内部的属性和方法是**不开放给父组件**访问的。

想在父组件中调用子组件的方法或访问内部数据，需要给父组件加 `ref`，并在子组件中显式暴露。

**父组件：使用 `ref` 访问子组件**

```vue
<template>
  <ChildComponent ref="childRef" />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import ChildComponent from './ChildComponent.vue'

const childRef = ref(null)

onMounted(() => {
  childRef.value.reset()
  console.log(childRef.value.count)
})
</script>
```

**子组件：通过 `defineExpose` 暴露方法**

```vue
<script setup>
import { ref } from 'vue'

const count = ref(0)

function reset() {
  count.value = 0
}

defineExpose({
  count,
  reset
})
</script>
```

## 组件实例引用

**父组件引用子组件**

```vue
<script setup>
import { ref, onMounted } from 'vue'
import ChildComponent from './ChildComponent.vue'

const childRef = ref(null)

onMounted(() => {
  // 访问子组件公开的属性和方法
  childRef.value.reset()
  console.log(childRef.value.count)
})
</script>

<template>
  <ChildComponent ref="childRef" />
</template>
```

**子组件暴露属性**

```vue
<script setup>
import { ref } from 'vue'

const count = ref(0)

// 公开给父组件的属性和方法
defineExpose({
  count,
  reset: () => {
    count.value = 0
  }
})
</script>
```

> 注意：`<script setup>`中的变量默认私有，不会暴露给父组件。
