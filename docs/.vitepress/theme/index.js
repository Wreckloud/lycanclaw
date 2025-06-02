// 导入默认主题
import DefaultTheme from 'vitepress/theme'

// 导入medium-zoom和Vue响应式API
import mediumZoom from 'medium-zoom';
import { onMounted, watch, nextTick, h } from 'vue';
import { useRoute } from 'vitepress';

// 导入自定义组件
import ArticleMetadata from './components/ArticleMetadata.vue';
import PostList from './components/PostList.vue';
import DataPanel from './components/DataPanel.vue';

// 导入自定义样式
import './styles/index.css';

export default {
  extends: DefaultTheme,
  
  enhanceApp({ app }) {
    // 注册全局组件
    app.component('ArticleMetadata', ArticleMetadata);
    app.component('PostList', PostList);
    app.component('DataPanel', DataPanel);
  },
  
  // 使用自定义页脚，但保持VitePress对侧边栏页面的页脚隐藏规则
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'layout-bottom': () => h(DataPanel)
    })
  },
  
  setup() {
    const route = useRoute();
    
    // 初始化图片缩放功能
    const initZoom = () => {
      // 为.main容器内的所有图像启用缩放功能
      mediumZoom('.main img', { 
        background: 'var(--vp-c-bg)'
      });
    };
    
    // 组件挂载后初始化缩放
    onMounted(() => {
      initZoom();
    });
    
    // 路由变化时重新初始化缩放
    watch(
      () => route.path,
      () => nextTick(() => initZoom())
    );
  }
} 