---
title: '在项目重封装 Axios 请求'
date: '2025-06-07 18:06:38'
description: '这是一篇新文章!'
publish: true
tags: 
---

# Axios 项目配置

写项目总少不了和后端打交道。你可以每次 `axios.get()`、`axios.post()`，但这样重复多、不好维护，还容易出错。

更推荐的方法是：**创建一个 Axios 实例**，统一配置、集中管理。
基础配置通常包括：

1. 实例化 - baseURL + timeout
2. 拦截器 - 携带 token 401 拦截等

官方文档地址：[https://axios-http.com/zh/docs/intro](https://axios-http.com/zh/docs/intro)

## 1. 安装 axios

```bash
pnpm add axios
```

## 2. 创建 Axios 实例

在 `src/utils/request.js` 或 `request.ts` 里建立一个基础封装，专管所有请求的“底层逻辑”。

```js
// src/utils/request.js
import axios from 'axios'

// 创建 Axios 实例，统一配置 baseURL 和超时
const instance = axios.create({
  baseURL: 'https://some-domain.com/api/', // 所有请求默认加这个前缀
  timeout: 5000 // 超过5秒没响应就抛错，避免死等
})

// 请求拦截器：请求发出去前的最后把关
instance.interceptors.request.use(
  function (config) {
    // 你想加token、修改请求头啥的，都写这
    return config // 一定要返回config，否则请求断了
  },
  function (error) {
    // 请求发不出去直接拒绝promise，交给调用方处理
    return Promise.reject(error)
  }
)

// 响应拦截器：服务器成功响应后的统一处理
instance.interceptors.response.use(
  function (response) {
    // 只要状态码是2xx就走这里
    // 大多数接口响应都包装在data里，直接返回data，调用更方便
    return response.data
  },
  function (error) {
    // 状态码非2xx时，或者网络错误，走这里
    // 这里可以统一弹错误提示、日志，或者做自动重试
    return Promise.reject(error) // 让调用方感知错误
  }
)

export default instance

```

## 3. API 模块化封装示例

为了更好地组织 API 请求，可以按功能模块进一步封装：

```javascript
// api/user.js
import request from '@/utils/request'

// 用户相关接口
export const login = (data) => {
  return request.post('/user/login', data)
}

export const getUserInfo = () => {
  return request.get('/user/info')
}

// api/product.js
import request from '@/utils/request'

// 商品相关接口
export const getProductList = (params) => {
  return request.get('/products', { params })
}

export const getProductDetail = (id) => {
  return request.get(`/products/${id}`)
}
```

在组件中使用：

```javascript
// 使用模块化API
import { login } from '@/api/user'

export default {
  methods: {
    async handleLogin() {
      try {
        const data = {
          username: this.username,
          password: this.password
        }
        const res = await login(data)
        // 处理登录成功
      } catch (error) {
        // 已在拦截器中统一处理错误
      }
    }
  }
}
```

这种封装方式让接口请求更加统一管理，且便于添加全局配置和拦截器，处理统一的错误逻辑、添加请求头等。同时，按功能模块化组织 API 使代码结构更加清晰，便于团队协作。

调用就很简单了：

```js
import { login } from '@/api/user'

login({ username: 'wolf', password: '123456' })
  .then(res => {
    console.log(res)  // 这里拿到的是后端返回的 data（拦截器自动帮你取的）
  })
  .catch(err => {
    console.error('接口请求失败:', err)
  })

```

在实际项目开发中，直接使用原始的 axios 会面临以各种问题。

1. **重复配置**：每个组件都需要单独配置请求参数
2. **错误处理分散**：每个请求都需要单独处理错误
3. **认证信息添加**：需要在每个请求中手动添加 token
4. **响应数据格式化**：后端返回的数据格式可能需要统一处理

通过封装，我们可以集中解决这些问题，提高代码复用性和可维护性。

[axios 官方文档](https://www.axios-http.cn/docs/instance)

将 axios 封装为 request 模块，方便管理 API 请求：

1. **安装 axios**

```bash
yarn add axios
# 或
npm i axios
```

2. **创建 request 模块**

```javascript
import axios from 'axios'

const instance = axios.create({
  baseURL: 'https://some-domain.com/api/',
  timeout: 5000
})

// 添加请求拦截器
instance.interceptors.request.use(function (config) {
  // 在发送请求之前做些什么
  return config
}, function (error) {
  // 对请求错误做些什么
  return Promise.reject(error)
})

// 添加响应拦截器
instance.interceptors.response.use(function (response) {
  // 2xx 范围内的状态码都会触发该函数。
  // 对响应数据做点什么
  return response.data
}, function (error) {
  // 超出 2xx 范围的状态码都会触发该函数。
  // 对响应错误做点什么
  return Promise.reject(error)
})

export default instance

```

3. **使用封装的 request**

```javascript
// 在组件中使用
import request from '@/utils/request'

export default {
  name: 'LoginPage',
  async created() {
    try {
      const res = await request.get('/captcha/image')
      console.log(res)
    } catch (error) {
      console.error(error)
    }
  }
}
```
