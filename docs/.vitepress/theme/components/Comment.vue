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
      pageview: '.waline-pageview-count',
      // 评论数统计默认开启
      comment: true,
      // 正确设置Markdown渲染，不使用原来的布尔值false
      texRenderer: undefined,
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
  }, 100)
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
      // 存储清理函数，用于卸载时调用
      window.__walineCleanup = setupThemeWatcher()
    }, 200)
  }
})
      
// 将onBeforeUnmount移到顶层
      onBeforeUnmount(() => {
  // 清理主题观察器
  if (typeof window !== 'undefined' && window.__walineCleanup) {
    window.__walineCleanup()
    window.__walineCleanup = null
  }
  
  // 销毁Waline实例
        if (walineInstance) {
          walineInstance.destroy()
    walineInstance = null
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
/* 评论区容器 */
.comment-section {
  margin-top: 2rem;
  margin-bottom: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--vp-c-divider);
}

/* 评论标题 */
.comment-title {
  display: none;
}

/* Waline容器基础样式 */
.waline-container {
  color: var(--vp-c-text-1);
  
  /* 基础变量设置 */
  --waline-theme-color: var(--vp-c-brand-1);
  --waline-active-color: var(--vp-c-brand-2);
  --waline-font-size: 14px;
  --waline-avatar-size: 40px;
  --waline-badge-font-size: 12px;
  --waline-info-font-size: 12px;
  --waline-border-color: var(--vp-c-divider);
  --waline-border: 1px solid var(--waline-border-color);
  --waline-box-shadow: none;
  --waline-avatar-radius: 50%; /* 圆形头像 */
  --waline-bg-color: transparent;
}

/* 适配暗黑模式 */
html.dark .waline-container {
  --waline-border-color: #30363d;
}

/* 评论区卡片 */
.wl-card {
  position: relative;
  padding: 12px 0;
  border-top: 1px solid var(--waline-border-color);
  margin-bottom: 0;
  background: transparent;
}


/* 元信息项 */
.wl-meta span {
  font-size: 8px !important;
  color: var(--vp-c-text-3);
  opacity: 0.7;
}

.wl-actions .wl-action {
  cursor: pointer;
  color: var(--vp-c-text-2);
  display: inline-flex;
  align-items: center;
}

.wl-actions .wl-action:hover {
  color: var(--vp-c-brand-1);
}

.wl-actions svg, .wl-like svg, .wl-reply svg {
  width: 14px;
  height: 14px;
  margin-right: 4px;
}

/* 回复区样式 */

/* 引用样式 */
.wl-quote {
  border-left: 1px dashed var(--vp-c-divider) !important;
  color: var(--vp-c-text-2);
}

/* 评论编辑器 */
.wl-panel {
  margin-bottom: 16px;
  border: 1px solid var(--waline-border-color) !important;
  border-radius: 6px !important;

}

.wl-header .wl-header-item {
  flex: 1;
  min-width: 120px;
}

.wl-header .wl-header-item label {
  font-size: 13px;
  color: var(--vp-c-text-2);
}

.wl-header .wl-input {
  width: 100%;
  height: 28px;
  background-color: var(--vp-c-bg);
  font-size: 13px;
}

/* 编辑器内容区 */
.wl-editor {
  min-height: 80px;
  padding: 8px;
  border: none !important;
  font-family: var(--vp-font-family-base) !important;
  font-size: var(--vp-font-size-1, 14px) !important;
  line-height: var(--vp-line-height-1, 1.7) !important;
  color: var(--vp-c-text-1) !important;
  background-color: transparent !important;
}

.wl-footer .wl-action {
  padding: 4px;
  cursor: pointer;
  border-radius: 4px;
  color: var(--vp-c-text-2);
}

/* 字数统计 */
.wl-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.wl-text-number {
  font-size: 12px;
  color: var(--vp-c-text-2);
}

.wl-sort li.active {
  color: var(--vp-c-brand-1);
  font-weight: 500;
}

/* 点赞和回复按钮 */
.wl-like, .wl-reply {
  background: none;
  border: none;
  font-size: 12px;
  color: var(--vp-c-text-2);
  padding: 2px 4px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
}

.wl-like:hover, .wl-reply:hover {
  color: var(--vp-c-brand-1);
}

/* 表情选择器 */
.wl-emoji-popup {
  position: absolute;
  z-index: 100;
  border: 1px solid var(--waline-border-color);
  border-radius: 4px;
  background-color: var(--vp-c-bg);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  max-height: 300px;
  overflow-y: auto;
}

/* GIF表情框样式修复 */
.wl-gif-popup {
  position: absolute;
  z-index: 100;
  border: 1px solid var(--waline-border-color);
  border-radius: 4px;
  background-color: var(--vp-c-bg);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  max-height: 300px;
  overflow-y: auto;
}

/* 隐藏Markdown指南按钮 */
.wl-footer .wl-action[title="Markdown Guide"] {
  display: none !important;
}

/* 移除输入框被选中时的高亮效果 - 简化版 */
.wl-editor:focus, 
.wl-input:focus, 
textarea:focus, 
input:focus {
  outline: none !important;
  border-color: transparent !important;
  background-color: transparent !important;
}

/* 移除输入框边框 */
.wl-input, .wl-editor {
  border: none !important;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .waline-container {
    --waline-avatar-size: 32px;
  }
  
  .wl-card {
    padding: 10px 0;
  }
  
  .wl-reply .wl-card {
    margin-left: 16px;
    padding-left: 10px;
  }
  
  .wl-header .wl-header-item {
    flex: 100%;
  }
}

/* 评论内容样式 - 匹配网站文字样式 */
.wl-content div p,
.wl-content > div,
.wl-content p,
.wl-preview .wl-content p {
  font-family: var(--vp-font-family-base);
  font-size: var(--vp-font-size-1, 14px);
  line-height: var(--vp-line-height-1, 1.7);
  color: var(--vp-c-text-1);
  margin: 6px 0;
  word-break: break-word;
  overflow-wrap: break-word;
}

/* 评论回复内容样式 */
.wl-quote .wl-content p,
.wl-quote .wl-content div p {
  font-family: var(--vp-font-family-base);
  font-size: var(--vp-font-size-1, 14px);
  line-height: var(--vp-line-height-1, 1.7);
  color: var(--vp-c-text-1);
}

/* 引用回复的"@用户:"部分 */
.wl-content > p > a,
.wl-content > p > span {
  font-family: var(--vp-font-family-base);
  font-size: var(--vp-font-size-1, 14px);
  color: var(--vp-c-text-2);
}
</style> 