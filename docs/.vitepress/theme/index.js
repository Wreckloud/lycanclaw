// 导入默认主题
import DefaultTheme from 'vitepress/theme'

// 导入medium-zoom和Vue响应式API
import mediumZoom from 'medium-zoom';
import { onMounted, watch, nextTick, h, defineAsyncComponent } from 'vue';
import { useRoute, useData } from 'vitepress';
import giscusTalk from 'vitepress-plugin-comment-with-giscus';

// 导入自定义布局组件（保留直接导入，因为它是必需的）
import MyLayout from './components/MyLayout.vue';


// 导入自定义样式
import './styles/index.css';

// 使用异步组件实现按需加载
const AsyncArticleMetadata = defineAsyncComponent(() => import('./components/ArticleMetadata.vue'));
const AsyncPostList = defineAsyncComponent(() => import('./components/PostList.vue'));
const AsyncDataPanel = defineAsyncComponent(() => import('./components/DataPanel.vue'));
const AsyncPostTitle = defineAsyncComponent(() => import('./components/PostTitle.vue'));
// 评论组件使用Giscus

export default {
  extends: DefaultTheme,
  
  enhanceApp({ app }) {
    // 注册全局组件（使用异步组件）
    app.component('ArticleMetadata', AsyncArticleMetadata);
    app.component('PostList', AsyncPostList);
    app.component('DataPanel', AsyncDataPanel);
    app.component('PostTitle', AsyncPostTitle);
  },
  
  // 使用自定义页脚，但保持VitePress对侧边栏页面的页脚隐藏规则
  Layout: MyLayout,
  
  setup() {
    // 获取frontmatter和route
    const { frontmatter } = useData();
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
    
    // 配置Giscus评论系统
    giscusTalk({
      // Giscus配置数据
      repo: 'Wreckloud/lycanclaw-comments',
      repoId: 'R_kgDOO36ijw',
      category: 'General', 
      categoryId: 'DIC_kwDOO36ij84CrLoe',
      mapping: 'pathname',
      strict: '0',
      inputPosition: 'bottom',
      lang: 'zh-CN',
      reactionsEnabled: '1',
      emitMetadata: '0',
      theme: 'preferred_color_scheme', // 自动跟随网站主题
    }, 
    {
      frontmatter, 
      route
    },
    // 默认值为true，表示已启用
    // 如果为false，则表示未启用
    // 您可以使用"comment:true"frontmatter在特定页面单独启用
    true
    );
  }
} 