---
title: Vue Router-路由管理
date: '2025-05-06 14:03:52'
description: Vue Router 是 Vue.js 官方的路由管理器，它与 Vue.js 核心深度集成，让构建单页面应用变得易如反掌。
publish: true
tags:
  - VUE
---

# Vue Router

## 单页应用

**单页应用程序**(Single Page Application, SPA)就是整个网站只有一个 HTML 页面，页面内容通过 JS 动态切换，不会整页刷新。常见场景：后台管理、文档系统、移动端 Web 应用等。

**代表案例**：[网易云音乐](https://music.163.com/)、GitHub、Gmail 等。

核心优点：体验流畅、前后端分离、开发效率高。
主要缺点：首屏加载慢、不利于 SEO。

**什么是路由？**

在生活中，路由器负责数据包的转发，建立了设备和 IP 的映射关系。在 Vue 应用中，**路由**是指**路径和组件之间的映射关系**。通过路由系统，可以根据不同的 URL 路径，在页面中渲染不同的组件，实现 SPA 的核心功能。

在 Vue 里，路由就是“路径和组件的映射”。你只需要配置好“哪个路径显示哪个组件”，Vue Router 会帮你根据 URL 自动切换页面内容，无需刷新。

## 安装

### 方式一：脚手架集成（推荐）

**新项目建议直接用官方脚手架工具，自动帮你配置好 Vue Router 4。**

#### 1. 使用 Vue CLI

安装 Vue CLI（如未安装）

```bash
npm install -g @vue/cli
```

创建新项目，按提示选择“Vue Router”

```bash
vue create my-vue-app
```

> 脚手架会自动帮你生成 `src/router/index.js` 和基础路由配置，直接用即可。

### 方式二：手动安装

适合已有项目或需要自定义配置时使用。

#### 1. 安装

```bash
npm install vue-router@4
# 或选择自己喜欢的包管理器
yarn add vue-router@4
```

#### 2. 创建路由配置文件

**src/router/index.js：**

```js
// 引入 Vue Router 的核心方法
import { createRouter, createWebHistory } from 'vue-router'


// 创建路由实例，采用 history 模式（URL 无 #，更美观）
const router = createRouter({
  history: createWebHistory(), // 路由表：每个对象就是一个页面路由配置
  routes:[
	{
	    path: '/', // 路径
	    name: 'Home', // 路由名称（推荐写，便于编程式跳转）
	    component: () => import('@/views/Home.vue') // 懒加载页面组件
	},
	{
		path: '/about',
	    name: 'About',
	    component: () => import('@/views/About.vue')
	}
  ]

})

// 导出路由实例，供 main.js/main.ts 挂载
export default router
```

#### 3. 在 main.js 中挂载

```js
import { createApp } from 'vue' // 引入 Vue 3 的应用创建方法
import App from './App.vue' // 引入根组件
import router from './router' // 引入路由实例（上面配置并导出的 router）

const app = createApp(App) // 创建 Vue 应用实例
// 挂载路由插件，整个应用就能用 <router-link>、<router-view> 等路由功能
app.use(router)
app.mount('#app') // 挂载根组件到页面
```

这样写，查阅和操作都非常直观，适合 Vue 3 项目日常开发。

## 配置

### 基本配置

最简单的路由配置，每个页面一个路由：

```js
import { createRouter, createWebHistory } from 'vue-router'

// 路由表：每个对象就是一个页面
const routes = [
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/views/Home.vue')
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('@/views/About.vue')
  }
]
```

### 嵌套路由（子页面）

有些页面有自己的“子页面”，比如用户中心下有“资料”和“帖子”。这时用 children 配置嵌套路由：

```js
const routes = [
  // ...前面的基础路由
  {
    path: '/user',
    name: 'User',
    component: () => import('@/views/User/index.vue'), // 父页面
    children: [
      {
        path: 'profile', // 访问 /user/profile
        name: 'UserProfile',
        component: () => import('@/views/User/Profile.vue')
      },
      {
        path: 'posts', // 访问 /user/posts
        name: 'UserPosts',
        component: () => import('@/views/User/Posts.vue')
      }
    ]
  }
]
```

- 父页面（如 User/index.vue）里要有 `<router-view />`，子页面会渲染在这里。
- 子路由 path 前面不要加 `/`，否则会变成根路径。

### 路由重定向

有时希望访问某个路径时自动跳转到另一个页面，比如访问 `/` 时跳到 `/home`：

```js
const routes = [
  { path: '/', redirect: '/home' }
  // ...其他路由
]
```

redirect 可以是字符串路径，也可以是对象（如 `{ name: 'Home' }`）。

### 404 页面（通配符）

如果用户访问了不存在的路径，应该显示一个友好的 404 页面：

```js
const routes = [
  // ...其他路由
  {
    path: '/:pathMatch(.*)*', // 匹配所有未定义的路径
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue')
  }
]
```

404 路由要放在最后，否则会把所有路由都匹配成 404。

**完整配置示例**

把上面所有内容合并，就是一个常用的路由配置文件：

```js
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  // 重定向：访问 / 自动跳转到 /home
  { path: '/', redirect: '/home' },

  // 基础页面
  { path: '/home', name: 'Home', component: () => import('@/views/Home.vue') },
  { path: '/about', name: 'About', component: () => import('@/views/About.vue') },

  // 嵌套路由：用户中心
  {
    path: '/user',
    name: 'User',
    component: () => import('@/views/User/index.vue'),
    children: [
      { path: 'profile', name: 'UserProfile', component: () => import('@/views/User/Profile.vue') },
      { path: 'posts', name: 'UserPosts', component: () => import('@/views/User/Posts.vue') }
    ]
  },

  // 404 页面，必须放最后
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('@/views/NotFound.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
```

````

#### 2 个核心步骤

1. **配置路由规则**：在独立的路由文件中定义路径与组件的映射关系

```javascript
// 路由配置
const routes = [
  { path: '/find', component: () => import('./views/Find.vue') },
  { path: '/my', component: () => import('./views/My.vue') },
  { path: '/friend', component: () => import('./views/Friend.vue') }
];
````

2. **使用路由组件**：在 `App.vue` 添加路由导航链接和视图出口

```vue
<template>
  <div class="app">
    <!-- 路由导航链接 -->
    <div class="nav">
      <router-link to="/find">发现音乐</router-link>
      <router-link to="/my">我的音乐</router-link>
      <router-link to="/friend">朋友</router-link>
    </div>

    <!-- 路由出口：匹配的组件将在这里渲染 -->
    <div class="content">
      <router-view></router-view>
    </div>
  </div>
</template>
```

> `<router-link>` 组件会被渲染为 `<a>` 标签，但比普通 `<a>` 标签更智能，可以阻止默认的页面刷新行为，保持单页应用的特性。

## 使用

配置好路由后，页面跳转和内容切换就非常简单了。主要用到两个内置组件：`<router-link>` 和 `<router-view>`。

### `<router-link>` 跳转导航

`<router-link>` 用来生成导航链接，点击后会切换页面，但不会刷新整个页面。

**基本用法：**

```vue
<template>
  <div>
    <router-link to="/home">首页</router-link>
    <router-link to="/about">关于</router-link>
    <router-link to="/user/profile">我的资料</router-link>
  </div>
</template>
```

- `to` 属性指定要跳转的路径。
- 渲染出来其实是 `<a>` 标签，但不会刷新页面，体验更流畅。

### `<router-view>` 页面出口

`<router-view>` 是用来显示当前路由对应的页面组件的地方。通常放在 App.vue 或页面的主区域。

**基本用法：**

```vue
<template>
  <div>
    <!-- 导航栏 -->
    <nav>
      <router-link to="/home">首页</router-link>
      <router-link to="/about">关于</router-link>
    </nav>
    <!-- 路由出口，当前页面内容会显示在这里 -->
    <router-view />
  </div>
</template>
```

- 只有 `<router-view>` 里才会渲染当前激活的页面组件。
- 如果有嵌套路由，父组件和子组件都要有 `<router-view>`。

### 导航高亮

当前激活的 `<router-link>` 会自动加上 `router-link-active` 或 `router-link-exact-active` 类名，可以用 CSS 高亮当前菜单。

```css
.router-link-active {
  color: #42b983;
  font-weight: bold;
}
```

### 命名路由跳转

除了写死路径，也可以用路由的 name 跳转，方便维护：

```vue
<router-link :to="{ name: 'UserProfile' }">我的资料</router-link>
```

### 嵌套路由的使用

如果有嵌套路由，父组件（如 User/index.vue）里要加 `<router-view />`，子页面会显示在这里：

```vue
<!-- User/index.vue -->
<template>
  <div>
    <h2>用户中心</h2>
    <router-link to="/user/profile">资料</router-link>
    <router-link to="/user/posts">帖子</router-link>
    <!-- 子路由出口 -->
    <router-view />
  </div>
</template>
```

## 组件分类

Vue 项目中的组件通常分为两大类：

**页面组件(Views)**：与路由路径对应，负责页面整体布局和功能实现。这类组件通常体积较大，复用性低，例如 `HomeView.vue`、`AboutView.vue` 等。

**复用组件(Components)**：体积小、复用性高的组件，可在多个页面中使用，通常通过 props 接收参数来定制行为。例如按钮、卡片、输入框等。

## 路由模块封装

随着项目规模增长，将所有路由配置放在 main.js 中会使文件臃肿且难以维护。将路由配置抽离成独立模块是一种更好的实践：

```
src/
├── views/          # 页面组件
├── components/     # 复用组件
└── router/         # 路由配置
    └── index.js    # 路由模块入口
```

具体封装步骤：

1. 创建 router/index.js 文件，将路由相关代码迁移到此处：

```javascript
import { createRouter, createWebHistory } from "vue-router";

// 路由配置
const routes = [
  { path: '/find', component: () => import('@/views/Find.vue') },
  { path: '/my', component: () => import('@/views/My.vue') },
  { path: '/friend', component: () => import('@/views/Friend.vue') }
];

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes
});

// 导出路由实例
export default router;
```

2. 在 main.js 中导入路由模块：

```javascript
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

const app = createApp(App);
app.use(router);
app.mount('#app');
```

Vue CLI 提供了 `@` 路径别名，指向 src 目录，使用它可以避免复杂的相对路径引用，简化导入语句。

# 编程式导航

除了使用 `router-link` 组件实现声明式导航，Vue Router 还提供了通过 JavaScript 代码控制路由跳转的方法，这在需要根据逻辑动态决定跳转目标时非常有用。

> 传统的 Web 开发中，我们使用 `location.href` 进行页面跳转。Vue Router 的编程式导航是其增强版，不同之处在于传统方式会刷新整个页面，而 Vue Router 只更新变化的组件，保持应用状态，提供更流畅的用户体验。

## 获取路由实例

在 Vue 3 中，编程式导航有两种实现方式：

### 选项式 API 中

在选项式 API 中，可以通过 `this.$router` 访问路由实例：

```js
export default {
  methods: {
    goToHome() {
      this.$router.push('/home');
    }
  }
}
```

### 组合式 API 中（推荐）

在组合式 API 中，使用 `useRouter` 钩子获取路由实例：

```js
import { useRouter } from 'vue-router';

export default {
  setup() {
    const router = useRouter();

    function goToHome() {
      router.push('/home');
    }

    return {
      goToHome
    };
  }
}
```

## 基本跳转方法

Vue Router 提供了两种基本的跳转方式：

### **`path` 路径跳转**

直接指定目标路径，简单直观：

```javascript
// 选项式API
this.$router.push("/search");

// 组合式API
const router = useRouter();
router.push("/search");

// 对象形式，更清晰，便于扩展
router.push({
  path: "/search",
});
```

### **`name` 命名路由跳转**

通过路由名称进行跳转，适合路径复杂或需要动态变化的场景：

```javascript
// 首先在路由配置中设置name
const routes = [
  {
    name: "search",
    path: "/search/:keyword",
    component: () => import('./views/Search.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes
});
```

然后使用 name 进行跳转：

```javascript
// 选项式API
this.$router.push({
  name: "search",
});

// 组合式API
const router = useRouter();
router.push({
  name: "search",
});
```

## 编程式传参

实际应用中，路由跳转通常需要携带参数。Vue Router 支持两种参数传递方式，每种方式又可以与 path 或 name 方式结合使用。

### 查询参数传参 (query)

查询参数会以 `?key=value` 形式显示在 URL 中，适合传递多个可选参数：

**与 path 结合使用**：

```javascript
// 选项式API
// 字符串拼接形式
this.$router.push("/search?keyword=vue&type=all");

// 对象形式（推荐）
this.$router.push({
  path: "/search",
  query: {
    keyword: "vue",
    type: "all",
  },
});

// 组合式API
const router = useRouter();
router.push({
  path: "/search",
  query: {
    keyword: "vue",
    type: "all",
  },
});
```

**与 name 结合使用**：

```javascript
// 选项式API
this.$router.push({
  name: "search", // 路由配置中定义的name
  query: {
    keyword: "vue",
    type: "all",
  },
});

// 组合式API
const router = useRouter();
router.push({
  name: "search",
  query: {
    keyword: "vue",
    type: "all",
  },
});
```

无论使用哪种方式传递查询参数，在目标组件中获取参数的方式如下：

```javascript
// 选项式API
export default {
  created() {
    console.log(this.$route.query.keyword) // 'vue'
    console.log(this.$route.query.type)    // 'all'
  }
}

// 组合式API
import { useRoute } from 'vue-router';

export default {
  setup() {
    const route = useRoute();
    console.log(route.query.keyword) // 'vue'
    console.log(route.query.type)    // 'all'

    return {}
  }
}
```

### 动态路由传参 (params)

动态路由参数是 URL 路径的一部分，使 URL 更简洁、语义更强。使用前必须在路由配置中定义参数占位符：

```javascript
const routes = [
  { path: '/user/:userId', name: 'userProfile', component: () => import('./views/UserProfile.vue') }
];
```

**与 path 结合使用**：

```javascript
// 选项式API
// 需要手动拼接路径
this.$router.push(`/user/${userId}`);

// 组合式API
const router = useRouter();
// 需要手动拼接路径
router.push(`/user/${userId}`);
```

**与 name 结合使用**（推荐）：

```javascript
// 选项式API
this.$router.push({
  name: "userProfile",
  params: {
    userId: "123",
  },
});

// 组合式API
const router = useRouter();
router.push({
  name: "userProfile",
  params: {
    userId: "123",
  },
});
```

> **重要**：当同时指定 path 和 params 时，params 会被忽略！正确做法是要么使用路径拼接，要么使用 name + params 的组合。

在目标组件中获取动态路由参数：

```javascript
// 选项式API
export default {
  created() {
    console.log(this.$route.params.userId) // '123'
  }
}

// 组合式API
import { useRoute } from 'vue-router';

export default {
  setup() {
    const route = useRoute();
    console.log(route.params.userId) // '123'

    return {}
  }
}
```

通过灵活运用这两种传参方式，可以根据具体需求构建出既美观又实用的路由系统。

## 导航控制

除了`push`方法外，Vue Router 还提供了一系列导航控制方法，类比原生 JS 的 `window.history`， 让我们能够像操控浏览器历史记录一样进行路由跳转。

1. `router.back()` - 返回上一页
2. `router.forward()` - 前进一页
3. `router.go(n)` - 前进或后退 n 步
4. `router.replace()` - 替换当前路由

**`router.replace()`**：替换当前路由，不会向历史记录添加新记录

```javascript
// 选项式API
// 基本使用，不会新增历史记录
this.$router.replace("/home");

// 对象形式
this.$router.replace({
  path: "/home",
});

// 组合式API
const router = useRouter();
// 基本使用，不会新增历史记录
router.replace("/home");

// 对象形式
router.replace({
  path: "/home",
});

// 命名路由与参数
router.replace({
  name: "search",
  query: { keyword: "vue" },
});
```

`replace`与`push`的区别：

- `push`会向浏览器历史添加一条新记录
- `replace`则会替换当前历史记录

这在表单提交后跳转等场景特别有用，可以防止用户点击后退按钮回到表单页面。

# `keep-alive` 组件缓存

`keep-alive` 是 Vue 提供的内置抽象组件，用于缓存不活动的组件实例而非销毁它们。它自身不会渲染成 DOM 元素，也不会出现在父组件链中，主要用于优化组件切换性能。

例如，当用户浏览评论列表后点击某条评论查看详情，返回时希望保持列表滚动位置而不是重新加载—— `keep-alive` 正是为解决这类场景而设计的。

## 基本用法

最简单的用法是将 `<router-view>` 包裹在 `<keep-alive>` 中：

```vue
<template>
  <div class="app-container">
    <keep-alive>
      <router-view></router-view>
    </keep-alive>
  </div>
</template>
```

在 Vue 3 中，`<router-view>` 组件提供了 v-slot API，可以更灵活地控制路由组件的渲染：

```vue
<template>
  <div class="app-container">
    <router-view v-slot="{ Component }">
      <keep-alive>
        <component :is="Component" />
      </keep-alive>
    </router-view>
  </div>
</template>
```

> 注意：默认情况下，`keep-alive` 会缓存所有经过的组件实例，这可能导致内存占用过大。

## 缓存控制属性

`keep-alive` 提供了三个重要属性来精细控制缓存行为：

### **include** （常用）

指定哪些组件需要被缓存（白名单）。只有名称匹配的组件会被缓存：

```vue
<router-view v-slot="{ Component }">
  <keep-alive :include="['Home', 'UserProfile']">
    <component :is="Component" />
  </keep-alive>
</router-view>
```

### **exclude**

指定哪些组件不需要被缓存（黑名单）。任何名称匹配的组件都不会被缓存，通常配合 max 使用：

```vue
<router-view v-slot="{ Component }">
  <keep-alive :exclude="['Search', 'Login']">
    <component :is="Component" />
  </keep-alive>
</router-view>
```

### **max**

指定最多可以缓存多少组件实例，超出限制时会采用 LRU 算法（最近最少使用）移除缓存，配合 exclude 防止页面卡死：

```vue
<router-view v-slot="{ Component }">
  <keep-alive :max="10">
    <component :is="Component" />
  </keep-alive>
</router-view>
```

缓存控制属性匹配的是组件的 `name` 选项，而非文件名或路由路径。
为了正确使用 `include` 和 `exclude`，确保组件定义了 `name` 选项：

```javascript
// 选项式API
export default {
  name: "UserProfile", // 这个是 keep-alive 匹配的名称
  // ...其他选项
};

// 组合式API + <script setup>
// 在Vue 3中使用<script setup>时，需要额外定义组件名称
<script setup>
import { defineOptions } from 'vue';

// 定义组件名称，用于keep-alive匹配
defineOptions({
  name: 'UserProfile'
});

// 组件逻辑
</script>
```

### 实际使用方法

在实际开发中，可以通过数据属性动态控制缓存组件：

```vue
<template>
  <div class="app-container">
    <router-view v-slot="{ Component }">
      <keep-alive :include="cachedComponents">
        <component :is="Component" />
      </keep-alive>
    </router-view>
  </div>
</template>

<script>
export default {
  data() {
    return {
      cachedComponents: ["Home", "UserProfile"],
    };
  },
};
</script>
```

使用组合式 API：

```vue
<template>
  <div class="app-container">
    <router-view v-slot="{ Component }">
      <keep-alive :include="cachedComponents">
        <component :is="Component" />
      </keep-alive>
    </router-view>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const cachedComponents = ref(["Home", "UserProfile"]);
</script>
```

## 缓存组件的生命周期

当组件被 `keep-alive` 缓存时，其生命周期会有所变化。被缓存的组件不会经历正常的创建和销毁过程，而是会触发两个专门的生命周期钩子：

- **activated**：组件被激活时触发（显示）
- **deactivated**：组件被停用时触发（隐藏）

这两个钩子替代了传统的 `mounted` 和 `unmounted` 钩子，使开发者能够在组件激活和停用时执行必要的逻辑：

```javascript
// 选项式API
export default {
  name: "UserProfile",
  activated() {
    console.log("UserProfile 组件被激活");
    // 可以在这里更新数据或重置状态
  },
  deactivated() {
    console.log("UserProfile 组件被停用");
    // 可以在这里清理资源或保存状态
  },
};

// 组合式API
import { onActivated, onDeactivated } from 'vue';

export default {
  setup() {
    onActivated(() => {
      console.log("组件被激活");
      // 可以在这里更新数据或重置状态
    });

    onDeactivated(() => {
      console.log("组件被停用");
      // 可以在这里清理资源或保存状态
    });

    return {};
  }
};

// 使用<script setup>的简化写法
<script setup>
import { onActivated, onDeactivated } from 'vue';

onActivated(() => {
  console.log("组件被激活");
  // 可以在这里更新数据或重置状态
});

onDeactivated(() => {
  console.log("组件被停用");
  // 可以在这里清理资源或保存状态
});
</script>
```

通过合理使用 `keep-alive` 及其相关属性和生命周期钩子，可以显著提升应用性能和用户体验，尤其适用于需要保留状态的复杂表单或列表等场景。
