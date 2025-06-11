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

## 访问统计功能

本站使用不蒜子(busuanzi)提供访问统计功能，包含：

- 站点总访问量统计（UV - 独立访客数）
- 单页面浏览量统计（PV - 页面访问次数）

### 实现方式

```js
// 在DataPanel.vue中初始化不蒜子脚本
const initBusuanzi = () => {
  if (!isBrowser) return
  
  // 防止重复加载脚本
  if (document.getElementById('busuanzi_script')) {
    // 重新初始化统计
    if (window['busuanzi'] && typeof window['busuanzi'].fetch === 'function') {
      window['busuanzi'].fetch()
    }
    return
  }
  
  // 创建不蒜子脚本
  const script = document.createElement('script')
  script.id = 'busuanzi_script'
  script.src = '//busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js'
  script.async = true
  document.head.appendChild(script)
}
```

### 统计标签

```html
<!-- 站点UV统计 -->
<span id="busuanzi_container_site_uv">
  <span id="busuanzi_value_site_uv">0</span> 位访客
</span>

<!-- 页面PV统计 -->
<span id="busuanzi_container_page_pv">
  <span id="busuanzi_value_page_pv">0</span> 次浏览
</span>
```

### 路由变化时更新统计

```js
// 在theme/index.js中监听路由变化
watch(
  () => route.path,
  () => nextTick(() => {
    // 更新不蒜子统计
    updateBusuanziCount();
  })
);

// 更新统计的函数
function updateBusuanziCount() {
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      try {
        const busuanziObj = window['busuanzi']
        if (busuanziObj && typeof busuanziObj.fetch === 'function') {
          busuanziObj.fetch();
        }
      } catch (e) {
        console.error('不蒜子统计更新失败:', e)
      }
    }, 500)
  }
}
```

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