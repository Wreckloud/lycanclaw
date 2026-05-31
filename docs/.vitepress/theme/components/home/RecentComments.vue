<script setup lang="ts">
/**
 * RecentComments.vue：
 * 定义RecentComments组件的交互与展示逻辑。
 */

import { onBeforeUnmount, onMounted, ref } from 'vue'
import { withBase } from 'vitepress'
import { useIntersectionObserver } from '@vueuse/core'
import { formatCommentDate, getRecentComments, type RecentComment } from '../../utils/api'
import { logError } from '../../utils/logger'

const isBrowser = typeof window !== 'undefined'
const COMMENT_LIMIT = 7
const INITIAL_SCROLL_SYNC_DELAY_MS = 100
const VISIBILITY_THRESHOLD = 0.5
const VISIBILITY_ROOT_MARGIN = '0px 0px -5% 0px'

const sectionRef = ref<HTMLElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)
const animationTriggerRef = ref<HTMLElement | null>(null)
const isVisible = ref(false)

const comments = ref<RecentComment[]>([])
const isLoading = ref(true)
const hasError = ref(false)
const errorMessage = ref('')
const isRefreshing = ref(false)
const isAtTop = ref(true)
const isAtBottom = ref(false)

let stopObserver: (() => void) | null = null
let scrollSyncTimer: number | null = null

function updateScrollPosition(): void {
  if (!containerRef.value) return
  const container = containerRef.value
  isAtTop.value = container.scrollTop <= 0
  isAtBottom.value = container.scrollTop + container.clientHeight >= container.scrollHeight
}

function cleanupScrollSyncTimer(): void {
  if (scrollSyncTimer === null) return
  window.clearTimeout(scrollSyncTimer)
  scrollSyncTimer = null
}

function decodePathSegment(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function getArticleTitle(url: string): string {
  if (!url) return '未知文章'
  const path = url.replace(/^\//, '')
  if (!path || path === 'index.html') return '首页'
  if (path === 'about.html') return '留痕之地-关于'

  const slug = path.split('/').pop()?.replace(/\.html$/, '') || '未知文章'
  return decodePathSegment(slug).replace(/[-_]/g, ' ')
}

function getArticleLink(url: string): string {
  return withBase(url || '/')
}

async function loadComments(forceRefresh = false): Promise<void> {
  if (!isBrowser) return

  hasError.value = false
  errorMessage.value = ''
  if (forceRefresh) {
    isRefreshing.value = true
  } else {
    isLoading.value = true
  }

  try {
    comments.value = await getRecentComments(COMMENT_LIMIT, forceRefresh)
  } catch (error) {
    hasError.value = true
    errorMessage.value = error instanceof Error ? error.message : '未知错误'
    logError('RecentComments', '加载最新评论失败', error)
  } finally {
    isLoading.value = false
    isRefreshing.value = false
    cleanupScrollSyncTimer()
    scrollSyncTimer = window.setTimeout(updateScrollPosition, INITIAL_SCROLL_SYNC_DELAY_MS)
  }
}

onMounted(() => {
  if (!isBrowser) return

  const observer = useIntersectionObserver(
    animationTriggerRef,
    ([entry]) => {
      if (!entry?.isIntersecting) return
      isVisible.value = true
      observer.stop()
    },
    {
      threshold: VISIBILITY_THRESHOLD,
      rootMargin: VISIBILITY_ROOT_MARGIN
    }
  )
  stopObserver = observer.stop

  void loadComments()
})

onBeforeUnmount(() => {
  stopObserver?.()
  stopObserver = null
  cleanupScrollSyncTimer()
})
</script>

<template>
  <div class="recent-comments-container" ref="sectionRef">
    <!-- 添加专门用于动画触发的元素 -->
    <div ref="animationTriggerRef" class="animation-trigger"></div>
    
    <h3 class="section-title" :class="{ 'animate-in': isVisible }">最新评论</h3>
    
    <!-- 内容区域：有评论且已加载完成时显示 -->
    <div 
      v-if="!isLoading && !hasError && comments.length > 0" 
      class="comments-content-area"
      :class="{ 'animate-in': isVisible }"
      style="--anim-delay: var(--lc-motion-duration-fast)"
    >
      <!-- 顶部渐变遮罩 -->
      <div class="lc-fade-mask lc-fade-mask--top" :style="{ opacity: isAtTop ? 0 : 1 }"></div>
      
      <div class="comments-content" ref="containerRef" @scroll="updateScrollPosition">
        <div 
          v-for="(comment, index) in comments" 
          :key="comment.id" 
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
            <div class="comment-time">{{ formatCommentDate(comment.createdAt) }}</div>
          </div>
          <div class="comment-body" v-html="comment.comment"></div>
        </div>
      </div>
      
      <!-- 底部渐变遮罩 -->
      <div class="lc-fade-mask lc-fade-mask--bottom" :style="{ opacity: isAtBottom ? 0 : 1 }"></div>
    </div>
    
    <!-- 加载状态：只在组件可见时显示 -->
    <div 
      v-else-if="isLoading && isVisible" 
      class="comments-content-area"
      :class="{ 'animate-in': isVisible }"
      style="--anim-delay: var(--lc-motion-duration-fast)"
    >
      <!-- 顶部渐变遮罩 -->
      <div class="lc-fade-mask lc-fade-mask--top" style="opacity: 0"></div>
      
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
      <div class="lc-fade-mask lc-fade-mask--bottom" style="opacity: 1"></div>
    </div>
    
    <!-- 空状态：只在组件可见且没有评论时显示 -->
    <div v-else-if="!hasError && comments.length === 0 && isVisible" class="comments-empty">
      <div class="empty-message">暂无评论</div>
    </div>
    
    <!-- 错误状态：只在组件可见且有错误时显示 -->
    <div v-else-if="hasError && isVisible" class="comments-error">
      <div class="error-message">加载评论失败: {{ errorMessage }}</div>
      <button class="retry-button" @click="loadComments(true)">重试</button>
    </div>
    
    <!-- 刷新叠加层：只在主动刷新时显示 -->
    <div class="comments-overlay" v-if="isRefreshing && isVisible">
      <div class="refresh-spinner"></div>
    </div>
  </div>
</template>

<style scoped>
.recent-comments-container {
  overflow: hidden;
  position: relative;
}

/* 为动画触发器设置样式 */
.animation-trigger {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: -1;
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
  animation: fadeInUp var(--lc-motion-duration-slower) var(--lc-motion-ease-standard) forwards;
  animation-delay: var(--anim-delay, 0s);
}

.animate-item {
  animation: fadeInUp var(--lc-motion-duration-slow) var(--lc-motion-ease-standard) forwards;
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

.lc-fade-mask {
  --lc-fade-mask-height: 40px;
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
  transition: color var(--lc-motion-duration-fast) var(--lc-motion-ease-standard);
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
  transition: background-color var(--lc-motion-duration-fast) var(--lc-motion-ease-standard);
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
  
  .lc-fade-mask {
    --lc-fade-mask-height: 30px;
  }
}
</style> 
