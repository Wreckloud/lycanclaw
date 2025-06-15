<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { withBase, useData } from 'vitepress'
import { getRecentComments, formatCommentDate, type WalineComment } from '../../utils/commentApi'
import { useIntersectionObserver, useScroll, useAsyncState } from '@vueuse/core'

// 判断是否在浏览器环境中
const isBrowser = typeof window !== 'undefined'

// 组件引用和状态
const sectionRef = ref<HTMLElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)
const isVisible = ref(false)

// 使用VueUse useAsyncState来管理评论加载
const { 
  state: comments, 
  isLoading, 
  error, 
  execute: refreshComments 
} = useAsyncState(
  () => isBrowser ? getRecentComments(7, true) : Promise.resolve([]), 
  [] as WalineComment[],
  { immediate: false, resetOnExecute: true }
)

// 加载状态和错误状态
const hasError = ref(false)
const errorMessage = ref('')
const isRefreshing = ref(false)

// 使用VueUse的useScroll跟踪滚动位置
const { arrivedState, y: scrollPosition } = useScroll(containerRef)
const { top: isAtTop, bottom: isAtBottom } = arrivedState

// 从VitePress获取文章信息
const { theme } = useData()

// 组件挂载
onMounted(() => {
  if (!isBrowser) return

  // 设置滚动动画
  const { stop } = useIntersectionObserver(
    sectionRef,
    ([{ isIntersecting }]) => {
      if (isIntersecting) {
        isVisible.value = true
        stop() // 只触发一次
      }
    },
    { 
      threshold: 0.2,
      immediate: true
    }
  )

  // 加载最新评论
  loadComments()
})

// 获取最新评论
async function loadComments(forceRefresh = false) {
  if (!isBrowser) return
  
  isRefreshing.value = forceRefresh
  hasError.value = false
  
  try {
    await refreshComments()
  } catch (e) {
    hasError.value = true
    errorMessage.value = e instanceof Error ? e.message : '未知错误'
  } finally {
    isRefreshing.value = false
  }
}

/**
 * 获取文章标题
 */
function getArticleTitle(url: string): string {
  // 从文章URL中提取路径
  const path = url.replace(/^\//, '')
  
  // 特殊处理 about 页面
  if (path === 'about.html') {
    return '留痕之地-关于'
  }
  
  // 尝试在主题配置中找到文章
  if (theme.value && theme.value.sidebar) {
    // 这里需要根据实际项目结构调整查找文章标题的逻辑
    return path ? path.split('/').pop()?.replace('.html', '').replace(/%\w+/g, ' ') || '未知文章' : '首页'
  }
  
  return path ? path.split('/').pop()?.replace('.html', '').replace(/%\w+/g, ' ') || '未知文章' : '首页'
}

/**
 * 生成文章链接
 */
function getArticleLink(url: string): string {
  return withBase(url)
}
</script>

<template>
  <div class="recent-comments-container" ref="sectionRef">
    <h3 class="section-title" :class="{ 'animate-in': isVisible }">最新评论</h3>
    
    <!-- 内容区域 -->
    <div 
      v-if="!isLoading && !hasError && comments.length > 0" 
      class="comments-content-area"
      :class="{ 'animate-in': isVisible }"
      style="--anim-delay: 0.2s"
    >
      <!-- 顶部渐变遮罩 -->
      <div class="fade-mask top" :style="{ opacity: !isAtTop ? 1 : 0 }"></div>
      
      <div class="comments-content" ref="containerRef">
        <div 
          v-for="(comment, index) in comments" 
          :key="comment.objectId" 
          class="comment-item"
          :class="{ 'animate-item': isVisible }"
          :style="{ '--item-delay': `${index * 0.08 + 0.3}s` }"
        >
          <div class="comment-header">
            <div class="comment-user">
              <span class="nick">{{ comment.nick }}</span>
              <span class="connector">发表在</span>
              <a class="article-link" :href="getArticleLink(comment.url)">
                {{ getArticleTitle(comment.url) }}
              </a>
            </div>
            <div class="comment-time">{{ formatCommentDate(comment.insertedAt) }}</div>
          </div>
          <div class="comment-body" v-html="comment.comment"></div>
        </div>
      </div>
      
      <!-- 底部渐变遮罩 -->
      <div class="fade-mask bottom" :style="{ opacity: !isAtBottom ? 1 : 0 }"></div>
    </div>
    
    <!-- 加载状态 -->
    <div 
      v-else-if="isLoading" 
      class="comments-content-area"
      :class="{ 'animate-in': isVisible }"
      style="--anim-delay: 0.2s"
    >
      <!-- 顶部渐变遮罩 -->
      <div class="fade-mask top" style="opacity: 0"></div>
      
      <div class="comments-content loading-content">
        <div v-for="i in 5" :key="i" class="comment-item skeleton-item">
          <div class="comment-header">
            <div class="skeleton-user"></div>
            <div class="skeleton-time"></div>
          </div>
          <div class="comment-body">
            <div class="skeleton-line"></div>
            <div class="skeleton-line"></div>
          </div>
        </div>
      </div>
      
      <!-- 加载状态下的底部渐变遮罩 -->
      <div class="fade-mask bottom" style="opacity: 1"></div>
    </div>
    
    <!-- 空状态 -->
    <div v-else-if="!hasError && comments.length === 0" class="comments-empty">
      <div class="empty-message">暂无评论</div>
    </div>
    
    <!-- 错误状态 -->
    <div v-else class="comments-error">
      <div class="error-message">加载评论失败: {{ errorMessage }}</div>
      <button class="retry-button" @click="loadComments(true)">重试</button>
    </div>
    
    <!-- 刷新叠加层 -->
    <div class="comments-overlay" v-if="isRefreshing">
      <div class="refresh-spinner"></div>
    </div>
  </div>
</template>

<style scoped>
.recent-comments-container {
  overflow: hidden;
  position: relative;
}

/* 添加动画样式 - 默认设置为不可见 */
.section-title {
  opacity: 0;
  transform: translateY(20px);
}

.comments-content-area {
  opacity: 0;
  transform: translateY(20px);
}

.comment-item {
  opacity: 0;
  transform: translateY(15px);
}

/* 当元素可见时应用动画 */
.animate-in {
  animation: fadeInUp 0.6s ease forwards;
  animation-delay: var(--anim-delay, 0s);
}

.animate-item {
  animation: fadeInUp 0.5s ease forwards;
  animation-delay: var(--item-delay, 0s);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section-title {
  font-size: 1.4rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--vp-c-divider);
  margin-bottom: 16px; /* 与热力图保持一致 */
}

/* 评论内容区域 */
.comments-content-area {
  position: relative;
  height: 330px;
  overflow: hidden;
  margin-top: 16px;
}

.comments-content {
  padding: 20px 0;
  height: 100%;
  overflow-y: auto;
  
  /* 完全隐藏滚动条 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}

/* 隐藏WebKit浏览器的滚动条 */
.comments-content::-webkit-scrollbar {
  display: none;
}

/* 渐变遮罩 */
.fade-mask {
  position: absolute;
  left: 0;
  right: 0;
  height: 40px; /* 增加遮罩高度 */
  pointer-events: none; /* 允许点击穿透 */
  z-index: 10;
  transition: opacity 0.3s ease;
}

.fade-mask.top {
  top: 0;
  background: linear-gradient(to bottom, var(--vp-c-bg), transparent);
}

.fade-mask.bottom {
  bottom: 0;
  background: linear-gradient(to top, var(--vp-c-bg), transparent);
}

/* 评论项 */
.comment-item {
  padding: 0.6rem 0.8rem;
  border-radius: 6px;
  background-color: var(--vp-c-bg-soft);
  margin-bottom: 0.5rem;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
  line-height: 1.2;
}

.comment-user {
  display: flex;
  align-items: center;
  gap: 0.15rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.comment-user .nick {
  font-weight: 700; /* 加粗用户名 */
  color: var(--vp-c-brand);
}

.comment-user .connector {
  opacity: 0.8;
}

.article-link {
  color: var(--vp-c-text-3);
  text-decoration: none;
  transition: color 0.2s ease;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100px;
}

.article-link:hover {
  color: var(--vp-c-brand);
  text-decoration: underline;
}

.comment-time {
  font-size: 0.7rem;
  color: var(--vp-c-text-3);
  opacity: 0.8;
  flex-shrink: 0;
  margin-left: 0.25rem;
}

.comment-body {
  font-size: 0.85rem;
  color: var(--vp-c-text-1);
  word-break: break-word;
  line-height: 1.4;
  max-height: 3.5em; /* 显示2.5行 */
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* 表情包样式特殊处理 */
.comment-body :deep(.wl-emoji) {
  display: inline-block;
  height: 1.2em;
  max-height: 1.2em;
  vertical-align: text-bottom;
  width: auto;
}

/* 骨架屏样式 */
.loading-content .comment-item {
  animation: pulse 1.5s infinite alternate;
}

.skeleton-user {
  width: 100px;
  height: 12px;
  background: linear-gradient(90deg, var(--vp-c-bg) 25%, var(--vp-c-bg-mute) 50%, var(--vp-c-bg) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 2px;
}

.skeleton-time {
  width: 40px;
  height: 10px;
  background: linear-gradient(90deg, var(--vp-c-bg) 25%, var(--vp-c-bg-mute) 50%, var(--vp-c-bg) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 2px;
}

.skeleton-line {
  height: 10px;
  background: linear-gradient(90deg, var(--vp-c-bg) 25%, var(--vp-c-bg-mute) 50%, var(--vp-c-bg) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 2px;
  margin-bottom: 0.35rem;
}

.skeleton-line:first-child {
  width: 100%;
}

.skeleton-line:last-child {
  width: 80%;
  margin-bottom: 0;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@keyframes pulse {
  0% {
    opacity: 0.7;
  }
  100% {
    opacity: 1;
  }
}

/* 空状态和错误状态 */
.comments-empty,
.comments-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 330px;
  color: var(--vp-c-text-2);
  background-color: var(--vp-c-bg-soft);
  border-radius: 6px;
}

.empty-message,
.error-message {
  font-size: 0.8rem;
  margin-bottom: 0.75rem;
}

.retry-button {
  padding: 0.2rem 0.8rem;
  border: none;
  border-radius: 4px;
  background-color: var(--vp-c-brand);
  color: white;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.retry-button:hover {
  background-color: var(--vp-c-brand-dark);
}

/* 刷新叠加层 */
.comments-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(var(--vp-c-bg-rgb), 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
}

.refresh-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid transparent;
  border-top-color: var(--vp-c-brand);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 响应式布局 */
@media (max-width: 768px) {
  .comment-header {
    font-size: 0.7rem;
  }
  
  .comment-body {
    font-size: 0.8rem;
  }
}
</style> 