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
      dark: isDark.value ? 'html.dark' : false,
      meta: ['nick', 'mail', 'link'],
      requiredMeta: ['nick', 'mail'],
      pageSize: 10,
      // 更换为B站表情包
      emoji: [
        'https://unpkg.com/@waline/emojis@1.2.0/bilibili',
      ],
      // 禁用表情搜索
      search: false,
      // 禁用文章反应
      reaction: false, 
      // 启用浏览统计
      pageview: true,
      // 评论数统计默认开启
      comment: true,
      // 隐藏Markdown指南
      texRenderer: false,
      // 本地化文字
      locale: {
        placeholder: '欢迎留下您的评论~',
        sofa: '快来抢占沙发吧~',
        comment: '评论',
        like: '点赞',
        cancelLike: '取消点赞',
        replyPlaceholder: '回复 @{at}',
        admin: '管理员',
        level0: '潜水',
        level1: '冒泡',
        level2: '活跃',
        level3: '话痨',
        more: '更多...',
        preview: '预览',
        emoji: '表情',
        uploadImage: '上传图片',
        seconds: '秒前',
        minutes: '分钟前',
        hours: '小时前',
        days: '天前',
        now: '刚刚',
        loading: '加载中...',
        login: '登录',
        logout: '退出',
        admin: '管理员',
        sticky: '置顶',
        word: '字',
        wordHint: '评论字数应在 $0 到 $1 字之间',
      },
      login: 'enable',
      // 错误处理
      errorHandler: (err) => {
        console.error('[Waline]', err);
      }
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
      walineInstance.update({ dark: isDark.value ? 'html.dark' : false })
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
  max-width: 100%;
  min-height: 200px;
  
  /* 匹配主题色 */
  --waline-theme-color: var(--vp-c-brand-1, #3eaf7c);
  --waline-active-color: var(--vp-c-brand-2, #2c974b);
}

/* 隐藏Markdown指南文本 */
.wl-footer .wl-action[title="Markdown Guide"] {
  display: none !important;
}

/* 只统一评论文本区域字体 */
.wl-editor {
  font-family: var(--vp-font-family-base) !important;
  font-size: var(--vp-font-size-1*0.6) !important;
  background-color: transparent !important;
}

/* 移除wl-panel的边框并添加阴影效果 */
.wl-panel {
  border: none !important;
  border-radius: 5px !important;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15), 0 5px 12px rgba(0, 0, 0, 0.12) !important;
  transition: all 0.3s ease;
}

/* 移除输入框被选中时的所有高亮效果 */
.wl-editor:focus, .wl-input:focus {
  outline: none !important;
  border-color: transparent !important;
  box-shadow: none !important;
  background-color: transparent !important;
}

/* 完全移除文本区域选中效果 */
.wl-editor:focus {
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
}

/* 评论加载中样式 */
.comment-loading {
  margin-top: 2rem;
  margin-bottom: 2rem;
  padding-top: 1rem;
  border-top: 1px dashed var(--vp-c-divider);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.comment-loading-spinner {
  width: 40px;
  height: 40px;
  color: var(--vp-c-brand-1);
  margin-bottom: 1rem;
}

.comment-loading-text {
  font-size: 1rem;
  color: var(--vp-c-text-2);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .comment-title {
    font-size: 1.25rem;
  }
}
</style> 