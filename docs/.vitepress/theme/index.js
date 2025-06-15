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

// 同步首页推荐阅读和数据统计组件高度
const syncSectionHeights = () => {
  if (typeof window === 'undefined') return
  
  // 确保只在PC视图下执行
  const isPcView = window.innerWidth >= 960
  if (!isPcView) return
  
  // 获取需要同步高度的容器
  const syncContainers = document.querySelectorAll('.sync-height-container')
  if (syncContainers.length < 2) return
  
  // 重置高度以获取自然高度
  syncContainers.forEach(container => {
    container.style.minHeight = 'auto'
  })
  
  // 立即尝试同步一次
  requestAnimationFrame(() => {
    let maxHeight = 0
    syncContainers.forEach(container => {
      maxHeight = Math.max(maxHeight, container.offsetHeight)
    })
    
    if (maxHeight > 0) {
      syncContainers.forEach(container => {
        container.style.minHeight = `${maxHeight}px`
      })
    }
  })
  
  // 等待组件渲染完成后再次同步
  setTimeout(() => {
    // 查找最大高度
    let maxHeight = 0
    syncContainers.forEach(container => {
      const height = container.offsetHeight
      maxHeight = Math.max(maxHeight, height)
    })
    
    // 设置相同的高度
    if (maxHeight > 0) {
      syncContainers.forEach(container => {
        container.style.minHeight = `${maxHeight}px`
      })
    }
    
    // 组件动画完成后再同步一次
    setTimeout(() => {
      let finalMaxHeight = 0
      syncContainers.forEach(container => {
        finalMaxHeight = Math.max(finalMaxHeight, container.scrollHeight)
      })
      
      if (finalMaxHeight > 0) {
        syncContainers.forEach(container => {
          container.style.minHeight = `${finalMaxHeight}px`
        })
      }
    }, 1000) // 等待动画完成
  }, 800) // 增加延迟时间，确保组件完全加载
}

export default {
  extends: DefaultTheme,
  
  enhanceApp({ app, router, siteData }) {
    // 注册全局组件（使用异步组件）
    app.component('ArticleMetadata', AsyncArticleMetadata);
    app.component('PostList', AsyncPostList);
    app.component('DataPanel', AsyncDataPanel);
    app.component('PostTitle', AsyncPostTitle);
    app.component('Comment', AsyncComment);
    app.component('RecentComments', AsyncRecentComments);
    
    // 全局注册echarts
    app.config.globalProperties.$echarts = echarts;
    
    // 添加路由钩子，在页面变化时执行高度同步
    if (typeof window !== 'undefined') {
      router.onAfterRouteChanged = () => {
        // 检查当前是否在首页
        if (router.route.path === '/') {
          // 等待Vue组件渲染
          setTimeout(syncSectionHeights, 300)
          
          // 监听窗口大小变化，重新调整高度
          window.addEventListener('resize', syncSectionHeights)
        } else {
          // 不在首页时，移除事件监听
          window.removeEventListener('resize', syncSectionHeights)
        }
      }
      
      // 初始加载时，如果是首页则执行同步
      if (router.route.path === '/') {
        setTimeout(syncSectionHeights, 300)
        window.addEventListener('resize', syncSectionHeights)
      }
    }
  },
  
  // 使用自定义布局
  Layout: MyLayout,
  
  setup() {
    // 获取route
    const route = useRoute();
    
    // 初始化图片缩放功能
    const initZoom = () => {
      // 为.main容器内的所有图像启用缩放功能
      mediumZoom('.main img', { 
        background: 'var(--vp-c-bg)'
      });
    };
    
    // 组件挂载后初始化缩放和预加载数据
    onMounted(() => {
      initZoom();
      // 预加载网站数据
      preloadSiteData();
    });
    
    // 路由变化时重新初始化缩放
    watch(
      () => route.path,
      () => nextTick(() => {
        initZoom();
      })
    );
  }
} 