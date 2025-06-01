// 导入并导出默认主题
// 这样我们既可以使用默认主题，又可以在将来扩展它
import DefaultTheme from 'vitepress/theme'

// 导入medium-zoom和Vue响应式API
import mediumZoom from 'medium-zoom';
import { onMounted, watch, nextTick } from 'vue';
import { useRoute } from 'vitepress';

// 导入自定义样式
import './styles/var.css';

export default {
  extends: DefaultTheme,
  
  setup() {
    const route = useRoute();
    
    // 初始化图片缩放功能
    const initZoom = () => {
      // 为.main容器内的所有图像启用缩放功能
      mediumZoom('.main img', { 
        background: 'var(--vp-c-bg)',
        margin: 24
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