<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { useRoute, useData } from 'vitepress'

// 获取当前路由和主题模式
const route = useRoute()
const { isDark } = useData()

// Waline实例引用
const walineRef = ref(null)
let walineInstance = null

// 计算当前路径作为评论标识
const commentPath = computed(() => route.path)

/**
 * 初始化Waline评论系统
 */
const initWaline = async () => {
  if (!walineRef.value) return
  
  try {
    // 动态导入Waline (浏览器环境中)
    const { init } = await import('@waline/client')
    
    // 只在需要时加载样式
    if (!document.querySelector('link[href*="waline.css"]')) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/@waline/client@v3/dist/waline.css'
      document.head.appendChild(link)
    }
    
    // 销毁已存在实例
    if (walineInstance) {
      walineInstance.destroy()
    }
    
    // 创建新实例
    walineInstance = init({
      el: walineRef.value,
      serverURL: 'https://lycanclaw-comment.netlify.app/.netlify/functions/comment',
      path: commentPath.value,
      dark: isDark.value,
      meta: ['nick', 'mail', 'link'],
      requiredMeta: ['nick', 'mail'],
      pageSize: 10,
      locale: {
        placeholder: '欢迎留下您的评论~',
      },
      emoji: [
        'https://unpkg.com/@waline/emojis@1.1.0/weibo',
      ],
      login: 'enable'
    })
  } catch (err) {
    console.error('Waline初始化失败:', err)
  }
}

// 监听路由变化重新初始化评论
watch(() => route.path, () => {
  // 延迟执行以确保DOM更新完成
  setTimeout(() => {
    initWaline()
  }, 300)
})

/**
 * 设置主题变化监听器
 * @returns {Function} 清理函数
 */
const setupThemeWatcher = () => {
  // 创建一个观察器来监听文档根元素上的数据主题属性变化
  const observer = new MutationObserver(() => {
    if (walineInstance) {
      walineInstance.update({ dark: isDark.value })
    }
  })
  
  // 开始观察
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'class']
  })
  
  // 返回清理函数
  return () => observer.disconnect()
}

// 组件挂载时初始化
onMounted(() => {
  // 确保在客户端环境
  if (typeof window !== 'undefined') {
    // 延迟执行以确保DOM更新完成
    setTimeout(() => {
      initWaline()
      const cleanup = setupThemeWatcher()
      
      // 组件卸载前清理
      onBeforeUnmount(() => {
        cleanup()
        if (walineInstance) {
          walineInstance.destroy()
        }
      })
    }, 500)
  }
})
</script>

<template>
  <div class="comment-section">
    <h2 class="comment-title">评论</h2>
    <div ref="walineRef" class="waline-container"></div>
  </div>
</template>

<style>
.comment-section {
  margin-top: 2rem;
  margin-bottom: 2rem;
  padding-top: 1rem;
  border-top: 1px dashed var(--vp-c-divider);
}

.comment-title {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.waline-container {
  --waline-theme-color: var(--vp-c-brand-1, #3eaf7c);
  --waline-active-color: var(--vp-c-brand-2, #2c974b);
  --waline-font-size: 16px;
  --waline-border-color: var(--vp-c-divider, #ddd);
  --waline-border-radius: 8px;
  max-width: 100%;
  min-height: 200px; /* 确保容器有足够高度 */
}

/* 适配暗色模式 */
html.dark .waline-container {
  --waline-white: #1e1e1e;
  --waline-light-grey: #272727;
  --waline-dark-grey: #999;
  --waline-text-color: #888;
  --waline-bgcolor: #121212;
  --waline-bgcolor-light: #272727;
  --waline-border-color: #333;
  --waline-disable-bgcolor: #444;
  --waline-disable-color: #272727;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .waline-container {
    --waline-font-size: 14px;
  }
  
  .wl-card {
    padding: 0.5rem !important;
  }
  
  .comment-title {
    font-size: 1.25rem;
  }
}
</style> 