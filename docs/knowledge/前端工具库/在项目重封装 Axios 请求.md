---
title: 在项目重封装 Axios 请求
date: 2025-06-07 18:06:38
description: 这是一篇新文章!
publish: true
tags:
  - Axios
---

# Axios 项目配置

写项目总少不了和后端打交道。你可以每次 `axios.get()`、`axios.post()`，但这样重复多、不好维护，还容易出错。

更推荐的方法是：**创建一个 Axios 实例**，统一配置、集中管理。
基础配置通常包括：

1. 实例化 - baseURL + timeout
2. 拦截器 - 携带 token 401 拦截等

[Axios 官方文档（中文）](https://www.axios-http.cn/docs/instance)

## 1. 安装 axios

```bash
pnpm add axios
```

## 2. 创建 Axios 实例

在 `src/utils/request.js` 或 `request.ts` 里建立一个基础封装，专管所有请求的“底层逻辑”。

```js
// src/utils/request.js

import axios from 'axios'

// 创建 Axios 实例，配置基础路径和请求超时
const instance = axios.create({
  baseURL: 'https://some-domain.com/api/', // 请求地址前缀
  timeout: 5000 // 请求超时时间（毫秒）
})

// 请求拦截器：请求发送前统一处理
instance.interceptors.request.use(
  config => {
    // 可在此注入 token、修改 headers 等
    // 示例：统一附带 token
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config // 必须返回 config 对象
  },
  error => {
    // 请求错误（如配置问题）直接拒绝
    return Promise.reject(error)
  }
)

// 响应拦截器：统一处理响应结果
instance.interceptors.response.use(
  response => {
    // 请求成功，直接返回核心数据部分
    return response.data
  },
  error => {
    // 请求失败（状态码非 2xx 或网络错误）
    return Promise.reject(error) // 交由调用方处理
  }
)

export default instance
```

### 多接口基地址支持方案

有些项目不仅访问一个后端服务，还要接多个接口来源，比如：

- 用户相关：`https://api.user-service.com`
- 商品相关：`https://api.goods-service.com`

**解决方案：用多个 axios 实例**：

```js
// src/utils/request-user.js
export default axios.create({
  baseURL: 'https://api.user-service.com',
  timeout: 5000
})

// src/utils/request-goods.js
export default axios.create({
  baseURL: 'https://api.goods-service.com',
  timeout: 5000
})
```

然后在对应的 API 文件中引入使用即可，避免 baseURL 混乱。

## 3.模块化封装 API 接口

将接口**按功能划分成文件**，统一调用 `request` 实例，利于维护和复用。

```js
// api/user.js
import request from '@/utils/request'

export const login = data => request.post('/user/login', data)
export const getUserInfo = () => request.get('/user/info')
```

```js
// api/product.js
import request from '@/utils/request'

export const getProductList = params => request.get('/products', { params })
export const getProductDetail = id => request.get(`/products/${id}`)
```

## 4. 组件中调用方式

```js
// Login.vue
import { login } from '@/api/user'

export default {
  methods: {
    async handleLogin() {
      try {
        const res = await login({
          username: this.username,
          password: this.password
        })
        // 登录成功逻辑
      } catch (e) {
        // 错误已被拦截器统一处理，必要时也可以额外提示
      }
    }
  }
}
```
