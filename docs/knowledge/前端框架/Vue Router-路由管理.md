---
title: Vue Router-路由管理
date: 2025-05-06 14:03:52
description: Vue Router 是 Vue.js 官方的路由管理器，它与 Vue.js 核心深度集成，让构建单页面应用变得易如反掌。
publish: true
tags:
  - VUE
---

# Vue Router

## 单页应用

**单页应用程序**(Single Page Application, SPA)是一种将所有功能集中在同一个 HTML 页面中实现的现代 Web 应用架构模式。整个应用只有一个完整的页面加载，后续操作通过动态更新当前页面来实现交互。

**代表案例**：[网易云音乐](https://music.163.com/)、GitHub、Gmail等。

| 优点                     | 缺点                           |
| ------------------------ | ------------------------------ |
| 按需更新 DOM，性能高     | 首屏加载较慢(需一次性加载框架) |
| 用户体验流畅(无页面跳转) | 不利于 SEO(搜索引擎优化)       |
| 前后端分离，开发效率高   | 开发复杂度和学习成本较高       |
| 节省服务器资源           | 对浏览器性能要求较高           |

SPA 特别适合以下场景：

- **系统类网站**：后台管理系统、内部 ERP 系统
- **内部应用**：对 SEO 要求不高的内部网站
- **文档类应用**：在线文档、知识库
- **移动端应用**：接近原生体验的移动 web 应用

**什么是路由？**

在生活中，路由器负责数据包的转发，建立了设备和 IP 的映射关系。在 Vue 应用中，**路由**是指**路径和组件之间的映射关系**。通过路由系统，可以根据不同的 URL 路径，在页面中渲染不同的组件，实现 SPA 的核心功能。

路由的核心功能是：根据 URL 路径切换显示不同的组件，且无需重新加载页面。这就像是一个智能的导航系统，当用户点击不同的链接时，系统会找到对应的组件并显示，而不会刷新整个页面。

## 安装与配置

Vue Router 是 Vue 官方的路由管理器，与 Vue.js 深度集成，是构建 SPA 的必备工具。它提供了完整的路由功能，包括路由配置、导航控制、参数传递等。

> **版本对应关系**：  
> Vue 2.x → Vue Router 3.x → Vuex 3.x  
> Vue 3.x → Vue Router 4.x → Pinia

### 基本使用步骤(5+2 模式)

实现 Vue Router 基本功能需要完成以下步骤：

#### 5 个基础步骤

1. **下载安装**：添加 Vue Router 到项目中

```bash
# Vue3项目安装Vue Router 4.x版本
yarn add vue-router@4
# 或
npm install vue-router@4
```

2. **引入模块**：在 `main.js` 中导入 Vue Router 所需的函数

```javascript
import { createRouter, createWebHistory } from "vue-router";
```

3. **定义路由**：配置路由规则

```javascript
const routes = [
  { path: '/home', component: () => import('./views/Home.vue') }
];
```

4. **创建路由实例**：使用createRouter创建路由对象

```javascript
const router = createRouter({
  history: createWebHistory(),
  routes
});
```

5. **注入挂载**：将路由对象注入到 Vue 应用实例

```javascript
// Vue 3中使用createApp创建应用实例
import { createApp } from 'vue';
import App from './App.vue';

const app = createApp(App);
app.use(router); // 将路由挂载到应用
app.mount('#app');
```

完整的 main.js：

```javascript
import { createApp } from 'vue'
import App from './App.vue'
import { createRouter, createWebHistory } from 'vue-router'

// 路由配置
const routes = [
  { path: '/find', component: () => import('./views/Find.vue') },
  { path: '/my', component: () => import('./views/My.vue') },
  { path: '/friend', component: () => import('./views/Friend.vue') }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes
})

// 创建应用实例
const app = createApp(App)

// 挂载路由
app.use(router)

// 挂载应用
app.mount('#app')
```

#### 2 个核心步骤

1. **配置路由规则**：在独立的路由文件中定义路径与组件的映射关系

```javascript
// 路由配置
const routes = [
  { path: '/find', component: () => import('./views/Find.vue') },
  { path: '/my', component: () => import('./views/My.vue') },
  { path: '/friend', component: () => import('./views/Friend.vue') }
];
```

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

## 嵌套路由

在实际应用中，页面通常由多层嵌套的组件组成。例如，一个用户管理页面可能包含用户列表、用户详情等子页面。Vue Router 支持通过 `children` 配置项来实现路由嵌套，创建多级路由结构。

### 配置嵌套路由

在路由配置中，使用 `children` 属性定义子路由规则：

```javascript
const routes = [
  {
    path: "/user",
    component: () => import('./views/User.vue'),
    children: [
      // 子路由路径前不需要加/
      { path: "profile", component: () => import('./views/user/UserProfile.vue') }, // /user/profile
      { path: "posts", component: () => import('./views/user/UserPosts.vue') }, // /user/posts
      { path: "", component: () => import('./views/user/UserHome.vue') }, // /user 默认子路由
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes
});
```

### 添加嵌套的路由出口

在父级路由组件中，需要添加一个 `<router-view>` 作为子路由的出口：

```vue
<!-- User.vue -->
<template>
  <div class="user">
    <h2>用户中心</h2>

    <!-- 子路由导航 -->
    <router-link to="/user/profile">个人资料</router-link>
    <router-link to="/user/posts">我的文章</router-link>

    <!-- 子路由出口 -->
    <router-view></router-view>
  </div>
</template>
```

当用户访问 `/user/profile` 时，父组件 `User` 会渲染在根 `<router-view>` 中，而子组件 `UserProfile` 会渲染在 `User` 组件内的 `<router-view>` 中，形成嵌套结构。

嵌套路由的使用使得复杂应用的页面组织更加清晰，特别适合构建包含侧边栏、标签页等多层次的界面结构。

# 声明式导航

### router-link 组件

`router-link` 是 Vue Router 提供的全局组件，用于替代传统的 `<a>` 标签。
它不仅能实现页面跳转，还自带激活状态的高亮效果。

使用时，必须通过 `to` 属性指定目标路由路径。

```vue
<router-link to="/path">链接文本</router-link>
```

**激活状态类名**

`router-link` 的一个重要特性是会自动为当前激活的导航添加类名，便于设置样式：

- `router-link-active`：模糊匹配，适用于导航菜单。例如，当 `to="/my"` 时，可以匹配 `/my`、`/my/a`、`/my/b` 等路径。
- `router-link-exact-active`：精确匹配，仅当路径完全相同时才会激活。例如，`to="/my"` 只能匹配 `/my`。

这些默认类名可以在路由配置中自定义：

```javascript
const router = createRouter({
  history: createWebHistory(),
  routes: [...],
  linkActiveClass: "active",    // 自定义模糊匹配类名
  linkExactActiveClass: "exact" // 自定义精确匹配类名
});
```

在Vue 3中，`router-link`组件还提供了自定义v-slot功能，可以更灵活地定制链接样式：

```vue
<router-link to="/profile" v-slot="{ href, route, navigate, isActive, isExactActive }">
  <a :href="href" @click="navigate" :class="[isActive && 'active', isExactActive && 'exact']">
    个人中心
  </a>
</router-link>
```

## 声明式传参

在 Vue 应用中，不同页面间常常需要传递数据。Vue Router 提供了两种参数传递方式，分别适用于不同场景。

### 查询参数传参 (query)

查询参数是 URL 中 `?` 后面的部分，以键值对形式传递数据。这种方式类似于传统的 GET 请求，适合传递多个可选参数：

```vue
<router-link to="/search?keyword=vue&type=all">搜索</router-link>
```

更结构化的写法：

```vue
<router-link :to="{ path: '/search', query: { keyword: 'vue', type: 'all' }}">
  搜索
</router-link>
```

在目标组件中，通过 `useRoute()` 钩子获取这些参数：

```js
// 选项式API中
export default {
  created() {
    console.log(this.$route.query.keyword); // 'vue'
    console.log(this.$route.query.type); // 'all'
  },
};

// 组合式API中 (Vue 3推荐)
import { useRoute } from 'vue-router';
import { onMounted } from 'vue';

export default {
  setup() {
    const route = useRoute();
    
    onMounted(() => {
      console.log(route.query.keyword); // 'vue'
      console.log(route.query.type); // 'all'
    });
  }
};
```

查询参数的优势在于灵活性高，不需要在路由配置中预先定义参数名称。

### 动态路由传参 (params)

动态路由参数作为 URL 路径的一部分，使 URL 更简洁美观。这种方式更适合传递必要的、语义化的参数。

首先需要在路由配置中定义参数占位符：

```javascript
const routes = [
  { path: "/search/:keyword", component: () => import('./views/Search.vue') }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});
```

然后在链接中传递参数：

```vue
<router-link to="/search/vue">搜索</router-link>
```

更结构化的写法（使用命名路由）：

```vue
<router-link :to="{ name: 'search', params: { keyword: 'vue' }}">
  搜索
</router-link>
```

在目标组件中，通过 `useRoute()` 获取参数：

```js
// 选项式API中
export default {
  created() {
    console.log(this.$route.params.keyword); // 'vue'
  },
};

// 组合式API中 (Vue 3推荐)
import { useRoute } from 'vue-router';
import { onMounted } from 'vue';

export default {
  setup() {
    const route = useRoute();
    
    onMounted(() => {
      console.log(route.params.keyword); // 'vue'
    });
  }
};
```

某些情况下，参数可能是可选的，可以在路由配置中添加 `?` 使参数变为可选：

```javascript
{ path: '/search/:keyword?', component: () => import('./views/Search.vue') }
```

动态路由参数的优势在于 URL 更简洁，参数更有语义性，适合表示资源标识。

## 路由重定向

### 重定向

在单页应用中，当用户访问根路径 `/` 时，通常需要将其重定向到应用的默认页面，而不是显示空白页面。

重定向的工作原理是：当匹配到特定路径时，自动跳转到另一个路径：

```javascript
const routes = [
  { path: "/", redirect: "/home" }, // 访问根路径时自动跳转到home页面
  { path: "/home", component: () => import('./views/Home.vue') },
];

const router = createRouter({
  history: createWebHistory(),
  routes
});
```

Vue Router 4还支持更灵活的重定向方式：

```javascript
// 使用命名路由重定向
{ path: '/', redirect: { name: 'home' } },

// 使用函数进行动态重定向
{ path: '/user/:id', redirect: to => {
  // 根据条件动态返回重定向目标
  return { path: '/profile', query: { id: to.params.id } }
}}
```

### 404 页面

对于用户访问不存在的路径，应当提供一个友好的 404 页面，而不是留下空白。配置 404 页面需要使用通配符路径：

```javascript
const routes = [
  // ... 其他路由配置
  { 
    path: "/:pathMatch(.*)*", 
    name: "NotFound",
    component: () => import('./views/NotFound.vue')
  }, // 匹配任何未定义的路径
];
```

注意：在Vue Router 4中，通配符语法从`*`变为了`/:pathMatch(.*)*`，更加符合路径参数的统一规范。

404 页面的配置需要放在路由配置的最后，因为路由匹配是按顺序进行的，最后才会匹配到通配符。

## 路由模式

Vue Router 提供了几种 URL 模式，适应不同的部署需求：

- **Hash 模式**：URL 中带有 `#` 符号，如 `http://localhost:8080/#/home`
- **HTML5 模式**：更自然的 URL 形式，如 `http://localhost:8080/home`
- **内存模式**：不会更改URL，适用于SSR等特殊场景

在Vue Router 4中，这些模式通过不同的history创建函数来实现：

```javascript
// Hash模式
import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [...]
})

// HTML5模式
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [...]
})

// 内存模式 (主要用于SSR)
import { createRouter, createMemoryHistory } from 'vue-router'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [...]
})
```

> 使用 HTML5 模式 (createWebHistory) 时，需要后端服务器配置支持，否则用户刷新页面时可能会遇到 404 错误。

# 编程式导航

除了使用 `router-link` 组件实现声明式导航，Vue Router 还提供了通过 JavaScript 代码控制路由跳转的方法，这在需要根据逻辑动态决定跳转目标时非常有用。

> 传统的 Web 开发中，我们使用 `location.href` 进行页面跳转。Vue Router 的编程式导航是其增强版，不同之处在于传统方式会刷新整个页面，而 Vue Router 只更新变化的组件，保持应用状态，提供更流畅的用户体验。

## 获取路由实例

在Vue 3中，编程式导航有两种实现方式：

### 选项式API中

在选项式API中，可以通过 `this.$router` 访问路由实例：

```js
export default {
  methods: {
    goToHome() {
      this.$router.push('/home');
    }
  }
}
```

### 组合式API中（推荐）

在组合式API中，使用 `useRouter` 钩子获取路由实例：

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

在Vue 3中，`<router-view>` 组件提供了 v-slot API，可以更灵活地控制路由组件的渲染：

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

使用组合式API：

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
