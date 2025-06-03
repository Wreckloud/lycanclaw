# LycanClaw 个人博客

基于VitePress构建的个人博客网站，专注于前端技术分享和个人随笔。

## 特点

- 🚀 基于VitePress构建，享受极速开发体验
- 📱 响应式设计，适配各种设备
- 🌙 深色模式支持
- 📊 访问统计与运行时间显示
- 📝 Markdown增强，支持自定义容器
- 🖼️ 图片缩放功能
- 🏷️ 文章标签系统
- ⚡ 组件按需加载，提升性能

## 性能优化

### 组件按需加载

本站使用Vue的`defineAsyncComponent`实现组件按需加载，大幅提高首屏加载速度：

```js
// 在theme/index.js中
import { defineAsyncComponent } from 'vue';

// 使用异步组件实现按需加载
const AsyncPostList = defineAsyncComponent(() => import('./components/PostList.vue'));
const AsyncDataPanel = defineAsyncComponent(() => import('./components/DataPanel.vue'));

// 注册全局组件
app.component('PostList', AsyncPostList);
app.component('DataPanel', AsyncDataPanel);
```

按需加载的优势：
- 减少首屏加载时间和初始包体积
- 只在需要时才加载组件代码
- 提高用户体验，特别是在移动设备上
- 优化网站性能评分

### 其他优化

- 文章数据增量更新
- 图片懒加载
- 代码分割
- 资源预加载

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 许可证

MIT 