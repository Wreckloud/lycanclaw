<script setup lang="ts">
/**
 * RecentComments.vue：
 * 定义RecentComments组件的交互与展示逻辑。
 */

import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter, withBase } from 'vitepress'
import { useIntersectionObserver } from '@vueuse/core'
import {
  formatCommentDate,
  getRecentComments,
  RECENT_COMMENTS_UPDATED_EVENT,
  type RecentComment
} from '../../utils/api'
import { logError } from '../../utils/logger'

const isBrowser = typeof window !== 'undefined'
const router = useRouter()
const COMMENT_LIMIT = 7
const INITIAL_SCROLL_SYNC_DELAY_MS = 100
const VISIBILITY_THRESHOLD = 0.5
const VISIBILITY_ROOT_MARGIN = '0px 0px -5% 0px'
const INDEX_PAGE_TITLES = new Map([
  ['/', '首页'],
  ['/index.html', '首页'],
  ['/knowledge/', '猎识印记'],
  ['/knowledge/index.html', '猎识印记'],
  ['/thoughts/', '风絮茸杂'],
  ['/thoughts/index.html', '风絮茸杂'],
  ['/projects/', '绝穴密藏'],
  ['/projects/index.html', '绝穴密藏'],
  ['/about', '留痕之地'],
  ['/about.html', '留痕之地']
])

interface CommentContentPart {
  type: 'text' | 'emoji' | 'image'
  value: string
  alt?: string
}

const sectionRef = ref<HTMLElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)
const animationTriggerRef = ref<HTMLElement | null>(null)
const isVisible = ref(false)

const comments = ref<RecentComment[]>([])
const commentPartsById = computed(() => new Map(
  comments.value.map(comment => [comment.id, parseCommentContent(comment)])
))
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

function normalizeCommentPath(value: string): string {
  if (!value) return '/'
  try {
    const url = new URL(value, window.location.origin)
    return url.pathname || '/'
  } catch {
    return value.startsWith('/') ? value : `/${value}`
  }
}

function getArticleTitle(url: string, articleTitle?: string): string {
  const normalizedPath = normalizeCommentPath(url)
  const indexTitle = INDEX_PAGE_TITLES.get(normalizedPath)
  if (indexTitle) return indexTitle
  if (articleTitle) return articleTitle
  const path = normalizedPath.replace(/^\//, '')
  if (!path || path === 'index.html') return '首页'

  const slug = path.split('/').pop()?.replace(/\.html$/, '') || '未知文章'
  return decodePathSegment(slug).replace(/[-_]/g, ' ')
}

function getArticleLink(comment: RecentComment): string {
  const path = normalizeCommentPath(comment.path || comment.url)
  const hash = comment.id ? `#${encodeURIComponent(comment.id)}` : ''
  return `${withBase(path)}${hash}`
}

function openComment(comment: RecentComment): void {
  if (!isBrowser) return
  void router.go(getArticleLink(comment))
}

function normalizeWebsite(value?: string): string {
  const trimmed = value?.trim()
  if (!trimmed) return ''
  const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  try {
    const url = new URL(candidate)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : ''
  } catch {
    return ''
  }
}

function appendTextPart(parts: CommentContentPart[], value: string): void {
  const text = value.replace(/\s+/g, ' ').trim()
  if (!text) return
  const previous = parts.at(-1)
  if (previous?.type === 'text') {
    previous.value = `${previous.value} ${text}`.trim()
    return
  }
  parts.push({ type: 'text', value: text })
}

function stripInlineMarkdown(value: string): string {
  return value
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/~~(.*?)~~/g, '$1')
}

function appendPreviewTextPart(parts: CommentContentPart[], value: string): void {
  appendTextPart(parts, stripInlineMarkdown(value))
}

function isTrustedEmojiSource(value: string): boolean {
  try {
    const url = new URL(value, window.location.origin)
    if (url.origin === window.location.origin) return true
    if (url.hostname === 'cdn.jsdelivr.net') {
      return url.pathname.startsWith('/npm/@waline/emojis')
    }
    if (url.hostname === 'unpkg.com') {
      return url.pathname.startsWith('/@waline/emojis')
    }
    return false
  } catch {
    return false
  }
}

function appendImagePart(parts: CommentContentPart[], source: string, alt: string): void {
  if (source && isTrustedEmojiSource(source)) {
    parts.push({ type: 'emoji', value: source, alt })
    return
  }
  parts.push({ type: 'image', value: '图片', alt: alt || '图片' })
}

function appendMarkdownPreviewParts(parts: CommentContentPart[], value: string): void {
  const imagePattern = /!\[([^\]]*)](?:\(([^)\s]+)(?:\s+["'][^"']*["'])?\))?/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = imagePattern.exec(value)) !== null) {
    appendPreviewTextPart(parts, value.slice(lastIndex, match.index))
    appendImagePart(parts, match[2]?.trim() || '', match[1]?.trim() || '图片')
    lastIndex = match.index + match[0].length
  }

  appendPreviewTextPart(parts, value.slice(lastIndex))
}

function parseCommentContent(comment: RecentComment): CommentContentPart[] {
  if (!isBrowser || !comment.commentHtml) {
    const fallbackParts: CommentContentPart[] = []
    appendMarkdownPreviewParts(fallbackParts, comment.comment || '')
    return fallbackParts
  }

  const root = document.createElement('div')
  // 先把图片地址改成普通数据属性，解析过程中不会触发外部资源请求。
  root.innerHTML = comment.commentHtml.replace(
    /\ssrc\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi,
    ' data-lycan-src=$1'
  ).replace(
    /\ssrcset\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,
    ''
  )
  const parts: CommentContentPart[] = []

  const visit = (node: Node): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      appendMarkdownPreviewParts(parts, node.textContent || '')
      return
    }
    if (!(node instanceof HTMLElement)) return

    if (node.tagName === 'IMG') {
      const source = node.getAttribute('data-lycan-src')?.trim() || ''
      const alt = node.getAttribute('alt')?.trim() || '表情'
      appendImagePart(parts, source, alt)
      return
    }

    node.childNodes.forEach(visit)
  }

  root.childNodes.forEach(visit)
  if (parts.length > 0) return parts

  const fallbackParts: CommentContentPart[] = []
  appendMarkdownPreviewParts(fallbackParts, comment.comment || '')
  return fallbackParts
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
  window.addEventListener(RECENT_COMMENTS_UPDATED_EVENT, handleCommentsUpdated)
})

onBeforeUnmount(() => {
  stopObserver?.()
  stopObserver = null
  cleanupScrollSyncTimer()
  if (isBrowser) {
    window.removeEventListener(RECENT_COMMENTS_UPDATED_EVENT, handleCommentsUpdated)
  }
})

function handleCommentsUpdated(): void {
  void loadComments(true)
}
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
          role="link"
          tabindex="0"
          @click="openComment(comment)"
          @keydown.enter.prevent="openComment(comment)"
          @keydown.space.prevent="openComment(comment)"
        >
          <div class="comment-header">
            <div class="comment-user">
              <a
                v-if="normalizeWebsite(comment.website)"
                class="nick nick-link"
                :href="normalizeWebsite(comment.website)"
                target="_blank"
                rel="noopener noreferrer"
                @click.stop
              >
                {{ comment.nick }}
              </a>
              <span v-else class="nick">{{ comment.nick }}</span>
              <span class="connector">发表在</span>
              <span class="article-link">
                {{ getArticleTitle(comment.path || comment.url, comment.articleTitle) }}
              </span>
            </div>
            <div class="comment-time">{{ formatCommentDate(comment.createdAt) }}</div>
          </div>
          <div class="comment-body">
            <template
              v-for="(part, partIndex) in commentPartsById.get(comment.id) || []"
              :key="`${comment.id}-${partIndex}`"
            >
              <span v-if="part.type === 'text'">{{ part.value }}</span>
              <img
                v-else-if="part.type === 'emoji'"
                class="comment-emoji"
                :src="part.value"
                :alt="part.alt"
                loading="lazy"
                referrerpolicy="no-referrer"
              />
              <span
                v-else
                class="comment-image-placeholder"
                aria-label="评论图片"
                :title="part.alt || '图片'"
              >[图片]</span>
            </template>
          </div>
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
    <div
      v-else-if="!hasError && comments.length === 0 && isVisible"
      class="comments-empty"
      :class="{ 'animate-in': isVisible }"
      style="--anim-delay: var(--lc-motion-duration-fast)"
    >
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
  margin-top: 12px;
}

.comments-content {
  padding: 12px 0;
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
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-sizing: border-box;
  height: 74px;
  padding: 0.58rem 0.72rem;
  border-radius: 6px;
  background-color: var(--vp-c-bg-soft);
  margin-bottom: 0.48rem;
  cursor: pointer;
}

.comment-item:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: -2px;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.38rem;
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
  line-height: 1.15;
}

.comment-user {
  display: flex;
  align-items: baseline;
  gap: 0.18rem;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.comment-user .nick {
  font-weight: 700;
  color: var(--vp-c-brand);
}

.nick-link {
  text-decoration: none;
}

.comment-user .connector {
  opacity: 0.72;
}

.article-link {
  color: var(--vp-c-text-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 150px;
}

.comment-time {
  font-size: 0.7rem;
  color: var(--vp-c-text-3);
  opacity: 0.8;
  flex-shrink: 0;
  margin-left: 0.25rem;
}

.comment-body {
  font-size: 0.84rem;
  color: var(--vp-c-text-1);
  word-break: break-word;
  line-height: 1.34;
  max-height: 2.68em;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.comment-image-placeholder {
  display: inline-block;
  margin: 0 0.16em;
  padding: 0 0.32em;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-soft);
  font-size: 0.9em;
}

.comment-emoji {
  display: inline-block;
  width: auto;
  height: 1.45em;
  margin: 0 0.12em;
  vertical-align: text-bottom;
  object-fit: contain;
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
}

.comments-empty {
  opacity: 0;
  transform: translateY(20px);
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
  .comment-item {
    height: 76px;
    min-height: 76px;
    padding: 0.58rem 0.65rem;
  }

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
