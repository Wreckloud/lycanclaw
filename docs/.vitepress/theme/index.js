// 导入默认主题
import DefaultTheme from 'vitepress/theme'

// 导入medium-zoom和Vue响应式API
import mediumZoom from 'medium-zoom';
import { onMounted, watch, nextTick, defineAsyncComponent } from 'vue';
import { useRoute } from 'vitepress';

// 导入自定义布局组件（保留直接导入，因为它是必需的）
import MyLayout from './components/MyLayout.vue';

// 导入自定义样式
import './styles/index.css';
// 导入echarts
import * as echarts from 'echarts';

// 导入API
import { preloadRecentComments } from './utils/commentApi';

// 使用异步组件实现按需加载
const AsyncArticleMetadata = defineAsyncComponent(() => import('./components/ArticleMetadata.vue'));
const AsyncPostList = defineAsyncComponent(() => import('./components/PostList.vue'));
const AsyncDataPanel = defineAsyncComponent(() => import('./components/DataPanel.vue'));
const AsyncPostTitle = defineAsyncComponent(() => import('./components/PostTitle.vue'));
const AsyncComment = defineAsyncComponent(() => import('./components/Comment.vue'));
const AsyncRecentComments = defineAsyncComponent(() => import('./components/home/RecentComments.vue'));

/**
 * 清除不蒜子缓存
 * 在以下情况会自动清除缓存：
 * 1. URL参数中包含clear_busuanzi_cache=true
 * 2. 强制刷新页面（Ctrl+F5）
 */
function clearBusuanziCache() {
  if (!window.localStorage) return
  
  try {
    // 检查URL参数
    const urlParams = new URLSearchParams(window.location.search)
    const shouldClear = urlParams.get('clear_busuanzi_cache') === 'true'
    
    if (shouldClear) {
      // 清除所有以busuanzi_开头的缓存
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('busuanzi_')) {
          localStorage.removeItem(key)
        }
      })
      console.log('不蒜子访问统计缓存已清除')
    }
  } catch (e) {
    console.error('清除不蒜子缓存失败:', e)
  }
}

/**
 * 更新不蒜子统计
 */
function updateBusuanziCount() {
  if (typeof window !== 'undefined') {
    // 尝试清除缓存（如果需要）
    clearBusuanziCache()
    
    setTimeout(() => {
      try {
        // 使用索引访问方法
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

/**
 * 预加载网站数据
 * 提前加载网站统计、最新评论等数据，避免页面切换时卡顿
 */
function preloadSiteData() {
  if (typeof window === 'undefined') return;
  
  // 在页面加载完成后，预加载评论数据
  window.addEventListener('load', () => {
    setTimeout(() => {
      preloadRecentComments();
    }, 2000); // 延迟2秒预加载，避免影响首屏渲染
  });
}

export default {
  extends: DefaultTheme,
  
  enhanceApp({ app }) {
    // 注册全局组件（使用异步组件）
    app.component('ArticleMetadata', AsyncArticleMetadata);
    app.component('PostList', AsyncPostList);
    app.component('DataPanel', AsyncDataPanel);
    app.component('PostTitle', AsyncPostTitle);
    app.component('Comment', AsyncComment);
    app.component('RecentComments', AsyncRecentComments);
    
    // 全局注册echarts
    app.config.globalProperties.$echarts = echarts;
  },
  
  // 使用自定义页脚，但保持VitePress对侧边栏页面的页脚隐藏规则
  Layout: MyLayout,
  
  setup() {
    // 获取frontmatter和route
    const route = useRoute();
    
    // 初始化图片缩放功能
    const initZoom = () => {
      // 为.main容器内的所有图像启用缩放功能
      mediumZoom('.main img', { 
        background: 'var(--vp-c-bg)'
      });
    };
    
    // 组件挂载后初始化缩放和浏览量统计
    onMounted(() => {
      initZoom();
      // 更新不蒜子统计
      updateBusuanziCount();
      // 预加载网站数据
      preloadSiteData();
    });
    
    // 路由变化时重新初始化缩放和浏览量统计
    watch(
      () => route.path,
      () => nextTick(() => {
        initZoom();
        // 更新不蒜子统计
        updateBusuanziCount();
      })
    );
  }
} 