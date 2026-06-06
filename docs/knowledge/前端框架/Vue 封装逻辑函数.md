---
title: Vue 封装逻辑函数
date: 2025-06-18T19:46:36
description: 这是一篇新文章!
publish: true
tags:
  - Vue
  - 组合式函数
  - 代码复用
---
Vue 社区提倡：**按业务拆逻辑函数**。

组件逻辑一多，`<script setup>` 就变成灾难现场。拆！按业务功能拆。  
用函数，把每一块逻辑塞回自己的窝。

我们在 Vue 3 中，有了 `<script setup>`，这让逻辑代码离模版更近、更扁平。但问题也来了——**所有代码混在一起，没有归属感**。

这时候，可以把**“一块完整的业务”**抽出来，变成一个函数。函数内部负责：

- 数据定义
- 方法封装
- 生命周期调用
- `return` 统一暴露

然后在组件里引入这些函数，就像装插件一样，把功能拼回来。

# 实现步骤

项目结构参考：

```
├─ views/
│  └─ Home.vue
├─ composables/
│  ├─ useCategory.js
│  └─ useBanner.js
```

这是一个未封装的组件:

```vue
<script setup>
import { ref, onMounted } from 'vue'

// 分类相关逻辑
const categoryList = ref([])

const fetchCategory = async () => {
  // 模拟请求
  categoryList.value = ['男装', '数码', '美妆']
}

// Banner相关逻辑
const bannerList = ref([])

const fetchBanner = async () => {
  bannerList.value = ['banner1.png', 'banner2.png']
}

// ... 其他业务逻辑 ...

// 生命周期钩子
onMounted(() => {
  fetchCategory()
  fetchBanner()
  // ... 其他初始化 ...
})
</script>
```

### 1. 以 `useXxx` 命名逻辑函数

这是一种社区约定。“use”代表这是一个可组合的逻辑单元，后面跟业务名（比如 useBanner、useLogin、useDetail 等等）。
在路径下新建文件，为封装逻辑函数做准备。

```js
// composables/useCategory.js
export function useCategory() {
  // 分类相关逻辑将放在这里
}

// composables/useBanner.js
export function useBanner() {
  // Banner相关逻辑将放在这里
}

// ... 其他逻辑函数 ...
```

### 2. 在函数内部封装对应逻辑

该写请求写请求，该定义数据就定义数据。该挂 `onMounted`、`watchEffect` 就正常挂。这个逻辑函数就像一个“微型组件”，只不过没有模板，纯逻辑。

```js
// composables/useCategory.js
import { ref, onMounted } from 'vue'

export function useCategory() {
  const categoryList = ref([])

  const fetchCategory = async () => {
    // 模拟请求
    categoryList.value = ['男装', '数码', '美妆']
  }

  onMounted(fetchCategory)

  // 后续步骤将在这里return暴露接口
}
```

### 3. 用 `return` 把组件要用的数据/方法抛出去

在组件里调用这个函数的时候，我们就可以解构出里面暴露的变量。

```js{14-17}
// composables/useCategory.js
import { ref, onMounted } from 'vue'

export function useCategory() {
  const categoryList = ref([])

  const fetchCategory = async () => {
    // 模拟请求
    categoryList.value = ['男装', '数码', '美妆']
  }

  onMounted(fetchCategory)

  return {
    categoryList,
    fetchCategory
  }
}
```

### 4. 在组件中调用，把业务拼回去

多个 useXxx 一起用，组合成组件的完整逻辑结构。

```vue
<script setup>
import { useCategory } from '@/composables/useCategory'
import { useBanner } from '@/composables/useBanner'
// ... 其他导入 ...

const { categoryList } = useCategory()
const { bannerList } = useBanner()
// ... 其他逻辑解构 ...
</script>
```

逻辑不再堆在组件里，谁负责什么一目了然。该谁干活就谁干活，和写后端 API 一样干净。
