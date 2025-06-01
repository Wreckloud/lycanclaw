---
title: VUE 工程化项目配置
published: false
categories:
  - 猎识印记-领域
excerpt: 这是一篇新文章!
thumbnail: /img/文章封面/defaultcover.jpg
date: 2025-05-11 17:12:11
tags:
---

# 项目基础结构优化

Vue CLI 创建的初始项目包含一些示例组件和配置，这些在实际开发中往往需要被替换。
优化项目结构不仅可以减小项目体积，还能让项目更符合开发需求，便于团队协作。

总之就是清除其默认的模板和格式， 很简单啦。

### 目录结构优化

1. **删除多余文件**

   - 清理不需要的初始化组件和资源
   - 删除 `components/HelloWorld.vue` 等示例文件
   - 清理 `assets` 文件夹中不需要的资源

2. **修改路由配置**

   - 调整`router/index.js`路由文件，删除示例路由
   - 简化`App.vue`，只保留必要的结构（如 router-view）
   - 为后续开发做好准备，预留路由结构

3. **新增功能目录**

```
src/
├── api/        # 接口请求模块，统一管理API请求
└── utils/      # 工具模块，存放自定义工具方法
```

- `api`目录：集中管理所有后端接口请求，按功能模块分类
- `utils`目录：封装通用工具方法，如格式化函数、通用验证方法等

合理的目录结构可以极大提升开发效率和代码可维护性

# Vant 组件库集成

Vant 是一个轻量、可靠的移动端 Vue 组件库，适合移动端项目开发。它提供了丰富的基础组件和业务组件，可大幅提高移动端开发效率。

- 适用于 Vue 2 项目的 [Vant 2](https://develop365.gitlab.io/vant/v2/zh-CN/home/)
- 适用于 Vue 3 项目的 [Vant 4](https://develop365.gitlab.io/vant/zh-CN/home/)

### 组件库分类

不同场景下可选择不同的组件库：

- **PC 端常用**：Element UI、Ant Design Vue
- **移动端常用**：Vant UI、Mint UI(饿了么)、Cube UI(滴滴)

选择组件库时应考虑项目需求、团队熟悉度、社区活跃度和组件丰富程度。

### 安装 Vant

```bash
# 安装Vant 2.x版本
yarn add vant@latest-v2
# 或
npm i vant@latest-v2
```

### 两种引入方式

#### 1. 全部导入

简单但会增加项目体积：

```javascript
// main.js
import Vue from 'vue'
import Vant from 'vant'
import 'vant/lib/index.css'

Vue.use(Vant)
```

**优缺点分析**：

- **优点**：简单方便，一次导入即可使用所有组件
- **缺点**：增加打包体积，包含许多未使用的组件代码

#### 2. 按需导入（推荐）

只引入需要的组件，减小项目体积：

1. **安装插件**

```bash
npm i babel-plugin-import -D
```

`babel-plugin-import` 是一个用于按需加载组件代码和样式的 babel 插件，它能够让我们只引入需要的组件，而不必导入整个库。

2. **配置 babel**

```javascript
// babel.config.js
module.exports = {
  presets: [
    '@vue/cli-plugin-babel/preset'
  ],
  plugins: [
    ['import', {
      libraryName: 'vant',
      libraryDirectory: 'es',
      style: true
    }, 'vant']
  ]
}
```

配置解析：

- `libraryName`: 指定要按需引入的库名
- `libraryDirectory`: 指定组件所在目录，默认为 `lib`
- `style`: 是否自动引入对应的样式文件

3. **按需引入组件**

```javascript
// main.js
import Vue from 'vue'
import { Button, Cell } from 'vant'

Vue.use(Button)
Vue.use(Cell)
```

配置完成后，我们就可以在 main.js 中按需引入所需的组件，而不必导入整个 Vant 库。

4. **组织引入代码**

   最佳做法是将所有组件引入封装到单独文件中：

```javascript
// utils/vant-ui.js
import Vue from 'vue'
import { Button, Cell, Icon } from 'vant'

Vue.use(Button)
Vue.use(Cell)
Vue.use(Icon)

// main.js 中引入
import '@/utils/vant-ui'
```

这种方式的好处是：

- 集中管理所有组件引入
- 避免 main.js 过于臃肿
- 新增组件时只需修改 vant-ui.js 文件
- 维护更加方便，一目了然当前项目使用了哪些组件

## 移动端适配配置 - vw 适配

移动设备屏幕尺寸和分辨率千差万别，为了让页面在不同设备上都能正常展示，需要进行屏幕适配。常见的适配方案有：

1. **媒体查询**：为不同屏幕宽度设置不同的 CSS 样式
2. **rem 适配**：基于根元素字体大小的相对单位
3. **vw/vh 适配**：基于视口宽度/高度的相对单位（现代方案）

使用 [`postcss-px-to-viewport`](https://github.com/evrone/postcss-px-to-viewport) 插件，将 px 自动转换为 vw，实现屏幕适配：

1. **安装插件**

```bash
yarn add postcss-px-to-viewport@1.1.1 -D
```

2. **配置 postcss**
   在项目的根目录(注意不是 `src` )新建配置文件 `postcss.config.js`

```javascript
module.exports = {
  plugins: {
    'postcss-px-to-viewport': {
      viewportWidth: 375, // 设计稿的宽度
      // 如果设计图是750px宽，调成1倍 => 适配375标准屏幕
      // 如果设计图是640px宽，调成1倍 => 适配320标准屏幕
      unitPrecision: 5, // 单位转换后保留的精度
      viewportUnit: 'vw', // 希望使用的视口单位
      selectorBlackList: ['.ignore', '.hairlines'], // 指定不转换为视口单位的类
      minPixelValue: 1, // 小于或等于`1px`不转换为视口单位
      mediaQuery: false // 允许在媒体查询中转换`px`
    }
  }
}
```

**工作原理**

postcss-px-to-viewport 插件会在构建过程中自动将 CSS 中的 px 单位转换为 vw 单位：

```css
/* 输入 */
.example {
  width: 375px;
  height: 100px;
}

/* 输出 (viewportWidth: 375) */
.example {
  width: 100vw;  /* 375 ÷ 375 × 100 = 100vw */
  height: 26.67vw;  /* 100 ÷ 375 × 100 = 26.67vw */
}
```

这样，无论设备屏幕大小如何，元素都会保持相对于视口的大小比例，实现响应式布局。

## 通用 CSS 样式

在项目开发中，经常会遇到一些重复使用的样式，如样式重置、文本溢出处理、弹性布局等。

可在全局样式文件中定义常用样式避免这些问题：

```css
/* styles/common.scss */

/* 重置默认样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 文字两行溢出显示省略号 */
.text-ellipsis-2 {
  overflow: hidden;
  -webkit-line-clamp: 2;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
}
```

最后，别忘了在 main.js 中全局引用。

### 常用通用样式

除了上面的例子，还可以考虑添加以下常用样式：

```css
/* 弹性布局 */
.flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 隐藏滚动条但保留滚动功能 */
.scroll-hidden {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}
.scroll-hidden::-webkit-scrollbar {
  display: none; /* Chrome, Safari and Opera */
}

/* 禁止用户选择文本 */
.no-select {
  user-select: none;
}
```

# 封装 Axios 请求模块

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

### 进一步优化 - API 模块化

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

# 封装 API 接口

**传统模式的问题**：

- 页面中充斥着请求代码，降低可读性
- 相同请求无法复用，导致重复代码
- 缺乏统一管理，维护困难

**封装后的优势**：

- 代码分离，页面逻辑与数据请求解耦
- 提高复用性，多个页面调用同一接口
- 便于维护，接口变更只需修改一处

## 二、封装步骤详解

### 1. 创建 API 模块目录结构

```
src/
  ├─ api/
  │   ├─ login.js     // 登录相关接口
  │   ├─ user.js      // 用户相关接口
  │   └─ ...
  └─ ...
```

### 2. 封装请求函数（以验证码为例）

```js
// src/api/login.js
import request from '@/utils/request'

// 获取图形验证码
export function getCodeImg() {
  return request.get('/captcha/image')
}

// 获取短信验证码
export function getPhoneCode(phone, imageCode, imageKey) {
  return request.post('/captcha/sendSms', {
    phone,
    imageCode,
    imageKey
  })
}

// 登录方法
export function login(phone, smsCode) {
  return request.post('/login', {
    phone,
    smsCode
  })
}
```

> **注意**：一定要返回请求结果（`return`），否则调用方无法接收响应数据

### 3. 页面中的使用方式

```js
// 页面组件中
import { getCodeImg } from '@/api/login'

export default {
  methods: {
    async getCodeImg() {
      try {
        // 调用封装的API方法
        const { data: { base64, key } } = await getCodeImg()
        this.codeUrl = base64  // 更新验证码图片
        this.codeKey = key     // 存储验证码标识
      } catch (error) {
        console.error(error)
      }
    }
  }
}
```

# Vue 项目认证与拦截机制

## Axios 响应拦截器

### 核心概念

- **响应拦截器**：请求响应返回后，到达组件前的预处理机制
- **主要作用**：统一错误处理、数据提取、状态码处理

### 实现原理

响应拦截器会拦截所有响应，根据 HTTP 状态码和业务状态码分别处理，让组件层代码更简洁。

### 标准实现

```js
// utils/request.js
instance.interceptors.response.use(
  (response) => {
    const res = response.data
    // 业务状态码处理
    if (res.status !== 200) {
      Toast(res.message)
      return Promise.reject(res)
    }
    return res  // 直接返回数据部分
  },
  (error) => {
    // HTTP错误处理
    Toast('网络请求失败')
    return Promise.reject(error)
  }
)
```

### 最佳实践

- 在拦截器中处理通用错误，组件中只处理特殊情况
- 统一提取响应数据结构，减少重复代码
- 处理登录失效重定向：
  ```js
  if (res.status === 401) {
    router.replace('/login')
    return Promise.reject('登录已过期')
  }
  ```

## Vuex 用户认证管理

### 概念与价值

用户模块存储登录凭证(token 和 userId)，提供全局访问和状态管理。

### 数据结构

```js
// 后端返回数据示例
{
  status: 200,
  message: "登录成功",
  data: {
    userId: 10034,
    token: "c1c079695f414a71b9903444e882259c"
  }
}
```

### 实现方案

```js
// store/modules/user.js
export default {
  namespaced: true,
  state: {
    token: '',
    userId: ''
  },
  mutations: {
    setUserInfo(state, userInfo) {
      state.token = userInfo.token
      state.userId = userInfo.userId
    },
    clearUserInfo(state) {
      state.token = ''
      state.userId = ''
    }
  },
  actions: {
    // 异步登录action
    async login({ commit }, loginData) {
      const res = await login(loginData)
      commit('setUserInfo', res.data)
      setInfo(res.data) // 同步存储到本地
      return res
    },
    // 退出登录
    logout({ commit }) {
      commit('clearUserInfo')
      removeInfo()
    }
  }
}
```

## 存储持久化处理

### 问题与解决方案

1. **问题**：Vuex 刷新后状态丢失
2. **解决**：结合本地存储实现持久化

### 存储模块封装

```js
// utils/storage.js
const INFO_KEY = 'vue_app_user_info'

// 获取用户信息
export const getInfo = () => {
  const result = localStorage.getItem(INFO_KEY)
  return result ? JSON.parse(result) : { token: '', userId: '' }
}

// 设置用户信息
export const setInfo = (info) => {
  localStorage.setItem(INFO_KEY, JSON.stringify(info))
}

// 移除用户信息
export const removeInfo = () => {
  localStorage.removeItem(INFO_KEY)
}
```

### 应用初始化加载

```js
// store/modules/user.js
import { getInfo } from '@/utils/storage'

export default {
  state: {
    token: getInfo().token,
    userId: getInfo().userId
  },
  // 其他配置...
}
```

## 路由访问控制

### 路由守卫原理

全局前置守卫拦截所有路由跳转，根据条件决定是否放行或重定向。

### 标准实现

```js
// router/index.js
router.beforeEach((to, from, next) => {
  // to: 目标路由信息
  // from: 来源路由信息
  // next: 控制放行的函数

  const { token } = store.state.user
  const isLogin = !!token

  // 白名单页面（无需登录可访问）
  const whiteList = ['/login', '/register', '/404']

  if (isLogin) {
    if (to.path === '/login') {
      // 已登录时访问登录页，重定向到首页
      next('/')
    } else {
      next() // 已登录，放行
    }
  } else {
    // 未登录
    if (whiteList.includes(to.path)) {
      next() // 访问白名单页面，放行
    } else {
      next('/login') // 重定向到登录页
    }
  }
})
```

### 路由守卫应用场景

- 登录状态验证
- 角色权限控制
- 页面访问限制
- 路由参数预处理

这样的路由守卫机制，就像领地边界的哨兵，严格控制谁能访问应用中的各个区域，确保安全与秩序。

