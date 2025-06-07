---
title: VUE3状态管理-Pinia(替代Vuex)
date: 2025-05-17 20:21:20
description: Vue的下一代状态管理工具，以更简洁的API和更友好的TypeScript支持替代Vuex！
publish: true
tags:
  - VUE
---

# Pinia 概述

Pinia 是 Vue 官方推荐的新一代状态管理工具，作为 Vuex 的继任者，它提供了更简洁的 API 和更优雅的使用体验。

- 去除 mutations，允许直接修改状态
- 符合 Vue3 组合式 API 风格
- 抛弃 modules 嵌套概念，每个 store 独立
- TypeScript 友好，自动类型推断

## 安装与配置

在创建 Vue 项目时，可以选择自动添加 Pinia。如果需要手动添加，按照以下步骤进行：

### 安装 Pinia

```bash
# 选择你喜欢的包管理器
yarn add pinia
# 或
npm install pinia
```

### 配置 Pinia

在主入口文件中创建并挂载 Pinia 实例：

```javascript
// main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

// 创建pinia实例
const pinia = createPinia()
const app = createApp(App)

// 将pinia挂载到应用
app.use(pinia)
app.mount('#app')
```

这样简单的几行代码，就完成了 Pinia 的基础配置，接下来我们可以开始创建和使用 store 了。

# 创建与使用 Store

`defineStore` 是创建 store 的核心方法。每个 store 应该专注于一个功能领域（用户信息、购物车等）。

```javascript
// stores/counter.js
import { defineStore } from 'pinia'

// 1. store ID必须唯一
// 2. 推荐使用 useXxxStore 命名风格
export const useCounterStore = defineStore('counter', {
  // 配置选项
  state: () => ({ count: 0 }),
  getters: { /* ... */ },
  actions: { /* ... */ }
})
```

> ⚠️ **注意**: store ID 在应用中必须唯一，通常与文件名对应

### 两种定义方式

Pinia 支持两种 store 定义风格：

**选项式 API 风格** (类似 Vuex)

```javascript
// 选项式API风格
defineStore('counter', {
  state: () => ({ count: 0 }),
  getters: { /* ... */ },
  actions: { /* ... */ }
})
```

**组合式 API 风格** (适合 Vue 3)

```javascript
// 组合式API风格
defineStore('counter', () => {
  const count = ref(0)
  const doubleCount = computed(() => count.value * 2)
  function increment() { count.value++ }

  // 以对象方式return供组件使用
  return { count, doubleCount, increment }
})
```

> 根据项目风格选择一种方式并保持一致，避免混用

`useCounterStore` 本质仍是一个函数，它是 `defineStore` 的返回值。必须在组件的 `setup` 中调用这个函数，才能获取到对应的 store 实例。

## 使用 Store

基本使用流程：

1. 在组件中调用 `useXxxStore()` 获取实例
2. 直接使用 state / getters / actions

**示例：在组件中使用 `useCounterStore`**

```vue
<script setup>
import { useCounterStore } from '@/stores/counter'

// 1. 获取 store 实例（必须在 setup 内部调用）
const counter = useCounterStore()

// 2. 直接使用 state 和方法
counter.increment()
console.log('当前计数:', counter.count)
</script>

<template>
  <div>
    <p>当前计数：{{ counter.count }}</p>
    <p>双倍：{{ counter.doubleCount }}</p>
    <button @click="counter.increment">+1</button>
  </div>
</template>
```

# State - 状态定义

Pinia 中的 `state` 就是**全局共享的数据源**，可以在多个组件中访问和修改。  
在组合式写法中，我们用 `ref()` 或 `reactive()` 定义 state。

**创建一个最基础的 State**

```js
// stores/counter.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCounterStore = defineStore('counter', () => {
  // 定义共享状态
  const count = ref(0)

  return { count }
})
```

**在组件中使用 State**

```vue
<script setup>
import { useCounterStore } from '@/stores/counter'

// 获取 store 实例
const counter = useCounterStore()
</script>

<template>
  <p>当前计数：{{ counter.count }}</p>
</template>
```

- 你可以在 Store 里用 `ref()` 创建基本数据，用 `reactive()` 创建对象；

**状态更改**

> State 是 Store 的核心。它应该只负责“存数据”，不负责“改数据”——修改应该通过 Action 来完成。

但 Pinia 还是允许直接修改状态，无需像 Vuex 那样通过 mutations：

```javascript
const store = useCounterStore()

// 简单修改
store.count++

// 多个属性修改 - 对象方式
store.$patch({
  count: store.count + 1,
  name: '大狼'
})

// 复杂逻辑修改 - 函数方式(推荐)
store.$patch((state) => {
  state.count++
  state.friends.push('小熊')
})
```

> 简单修改直接赋值，复杂修改(特别是数组操作)使用`$patch`函数方式

**重置状态**

```javascript
// 一键重置到初始状态
store.$reset()
```

# Getters - 计算状态

在组合式风格中，**Getter 就是计算属性**，用来从状态派生出新值。逻辑和 Vue 的 `computed` 类似。

> 通常用于格式化展示、过滤列表、计算数量等场景。

**基本语法**

在 `defineStore` 的返回对象中，直接使用 `computed` 创建 getter 并返回。

```js
// stores/counter.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)

  // 派生数据
  const doubleCount = computed(() => count.value * 2)

  return {
    count,
    doubleCount
  }
})
```

**组件中使用 Getter**

```vue
<script setup>
import { useCounterStore } from '@/stores/counter'

const counterStore = useCounterStore()

console.log(counterStore.doubleCount) // 会随着 count 变化自动更新
</script>
```

Getter 是只读的计算属性，直接写在函数中并通过 `return` 暴露即可，无需额外声明。它们应保持纯粹，不建议在内部修改状态。

# Actions - 业务逻辑

在组合式写法中，**Actions 就是函数**，专门用来封装对状态的修改，以及处理更复杂的业务逻辑。

> 所有对 `state` 的更改都推荐通过 Action 来完成，这样逻辑集中、易于追踪调试，也更符合单一职责的设计原则。

**基本语法**

```js
// stores/counter.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)

  // 一个简单的 action，用于修改 state
  function addOne() {
    count.value++
  }

  return {
    count,
    addOne
  }
})
```

**组件中使用 Action**

```vue
<script setup>
import { useCounterStore } from '@/stores/counter'

const counter = useCounterStore()

// 直接调用 Action
counter.addOne()
</script>

<template>
  <button @click="counter.addOne">+1</button>
  <p>当前计数：{{ counter.count }}</p>
</template>
```

Action 是修改 state 的唯一推荐方式，在组合式 API 中无需使用 `this`，也不能使用它。

**异步请求数据并更新状态**

异步写法同样简单直白，直接使用 `async/await` 即可。

```js
// stores/user.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const userInfo = ref(null)

  async function fetchUser() {
    const res = await fetch('/api/user')
    const data = await res.json()
    userInfo.value = data
  }

  return { userInfo, fetchUser }
})
```

# 响应性传递

在组件里，我们常用 `counter.addOne()` 这种方法调用，很自然，像在操作普通对象。于是很容易想到：把 store 直接解构出来使用，会不会更简洁？

**但这里埋了个坑——普通解构会让响应性丢失。**

```js
// 普通解构，拿到的是值的副本
const { count, addOne } = counter
```

普通解构会断开响应性，原因在于解构拿到的是值的副本，比如数字或字符串这类**非响应式对象的基本类型**，直接解构就是普通值，失去了响应式追踪。

### `storeToRefs` - 辅助保持数据响应

Pinia 提供了 `storeToRefs()`，它会把响应式的**state 属性**转换成对应的响应式引用（`ref` 对象），保持响应性：

```js
import { storeToRefs } from 'pinia'

const { count, addOne } = storeToRefs(counter)
```

这里的 `count` 是一个响应式的 `ref`，它是一个对象，包裹了实际的值，修改它能触发视图更新。而 `addOne` 是普通函数，不需要响应性，直接解构即可。

注意：方法保持普通函数，不需要经过 `storeToRefs` 处理。

### 断链防止意外数据响应

在某些场景下又需要断链防止意外修改

子组件编辑父组件传来的响应式对象时，如果直接传递响应式引用，子组件的改动会立刻反应到父组件，导致未提交时数据已被修改。

```vue
<!-- 父组件传递响应式 row -->
<ChildDialog :formData="row" />
```

解决办法是使用扩展运算符创建一个非响应式副本，切断响应链：

```vue
<!-- 传递副本，断开响应性 -->
<ChildDialog :formData="{ ...row }" />
```

这样，子组件对 `formData` 的修改不会影响父组件原数据，只有明确提交后才同步。

# 持久化存储

Pinia 官方提供了持久化插件，可以轻松把 store 的数据保存在 `localStorage` 或 `sessionStorage` 中，避免刷新丢失状态。

#### 第一步：安装插件

使用你习惯的包管理器安装：

```bash
pnpm add pinia-plugin-persistedstate
# 或 yarn / npm
```

#### 第二步：全局注册插件

在 `main.js` 中配置插件，使其作用于所有 store：

```js
// main.js
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
```

#### 第三步：在某个 store 中启用持久化

最简单的方式，只需一行：

```js
// 在store中启用持久化
export const useUserStore = defineStore('user', {
  state: () => ({
    token: '',
    preferences: {}
  }),
  // 简单持久化
  persist: true
})
```

但实际开发中，往往只想保存部分字段，比如用户的 `token`，就需要指定更细的配置：

```js
// stores/user.js
export const useUserStore = defineStore('user', {
  state: () => ({
    token: '',
    preferences: {}
  }),

  persist: {
    key: 'user-storage', // 配置浏览器存储中的键名 => '{"user-storage":"xxx"}'
    storage: localStorage, // 也可以用 sessionStorage
    paths: ['token'] // 只保存 token 字段
  }
})
```

通常只保留认证信息、用户设置等核心内容，才是精细化控制的上策。
