<script setup lang="ts">
import { ref, onBeforeUnmount, onMounted, computed } from 'vue'
import { withBase } from 'vitepress'
import { useIntersectionObserver } from '@vueuse/core'
import { estimateReadMinutes } from '../utils/contentMetrics'
import { formatDateCn } from '../utils/time'
import {
  fetchPublishedThoughtPosts,
  type ThoughtPost
} from '../utils/contentData'
import { logError } from '../utils/logger'

// 判断是否在浏览器环境中
const isBrowser = typeof window !== 'undefined'

// 添加动画相关状态
const animationTriggerRef = ref<HTMLElement | null>(null)
const isVisible = ref(false)
const listVisible = ref(false)
const listRenderKey = ref(0)
let animationResetTimer: number | null = null
let animationRafId: number | null = null

interface NormalizedFrontmatter {
  title: string
  date: string
  tags: string[]
}

// 过滤出thoughts目录下的文章，且publish为true的文章
const thoughtsPosts = ref<ThoughtPost[]>([])
const isLoading = ref(true)
const hasError = ref(false)
const selectedTag = ref('')

// 分页相关
const currentPage = ref(1)
const postsPerPage = 7 // 每页显示7篇文章
const normalizedSelectedTag = computed(() => selectedTag.value.trim())
const availableTags = computed(() => {
  const counter = new Map<string, number>()
  for (const post of thoughtsPosts.value) {
    const tags = Array.isArray(post.frontmatter?.tags) ? post.frontmatter.tags : []
    for (const rawTag of tags) {
      if (typeof rawTag !== 'string') continue
      const tag = rawTag.trim()
      if (!tag) continue
      counter.set(tag, (counter.get(tag) || 0) + 1)
    }
  }
  return Array.from(counter.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'zh-Hans-CN'))
})
const filteredPosts = computed(() => {
  const tag = normalizedSelectedTag.value
  if (!tag) return thoughtsPosts.value
  return thoughtsPosts.value.filter((post) => {
    const tags = Array.isArray(post.frontmatter?.tags) ? post.frontmatter.tags : []
    return tags.some((item) => typeof item === 'string' && item.trim() === tag)
  })
})
const totalPages = computed(() => Math.max(1, Math.ceil(filteredPosts.value.length / postsPerPage)))
const paginatedPosts = computed(() => {
  const startIndex = (currentPage.value - 1) * postsPerPage
  const endIndex = startIndex + postsPerPage
  return filteredPosts.value.slice(startIndex, endIndex)
})
const paginatedViewPosts = computed(() =>
  paginatedPosts.value.map((post) => ({
    post,
    meta: normalizeFrontmatter(post)
  }))
)

// 页码导航
const pageNumbers = computed(() => {
  const pages: Array<number | '...'> = []
  const maxVisiblePages = 5 // 最多显示5个页码
  
  if (totalPages.value <= maxVisiblePages) {
    // 如果总页数少于最大显示页码，则显示所有页码
    return Array.from({ length: totalPages.value }, (_, i) => i + 1)
  }
  
  // 总是显示第一页
  pages.push(1)
  
  // 计算中间页码的起始和结束
  let start = Math.max(2, currentPage.value - 1)
  let end = Math.min(totalPages.value - 1, currentPage.value + 1)
  
  // 如果当前页靠近开始，多显示几个后面的页码
  if (currentPage.value <= 3) {
    end = Math.min(totalPages.value - 1, 4)
  }
  
  // 如果当前页靠近结束，多显示几个前面的页码
  if (currentPage.value >= totalPages.value - 2) {
    start = Math.max(2, totalPages.value - 3)
  }
  
  // 如果第一页和起始页之间有间隔，添加省略号
  if (start > 2) {
    pages.push('...')
  }
  
  // 添加中间页码
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  // 如果结束页和最后一页之间有间隔，添加省略号
  if (end < totalPages.value - 1) {
    pages.push('...')
  }
  
  // 总是显示最后一页
  pages.push(totalPages.value)
  
  return pages
})

// 页面导航函数
function goToPage(page: number | '...') {
  if (typeof page === 'number' && page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    // 滚动到页面顶部
    if (isBrowser) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    
    replayListAnimation()
  }
}

function buildThoughtsTagUrl(tag: string): string {
  return withBase(`/thoughts/?tag=${encodeURIComponent(tag.trim())}`)
}

function getTagFromUrl(): string {
  if (!isBrowser) return ''
  const queryTag = new URLSearchParams(window.location.search).get('tag')
  return typeof queryTag === 'string' ? queryTag.trim() : ''
}

function syncTagFromUrl(): void {
  selectedTag.value = getTagFromUrl()
  currentPage.value = 1
}

function updateTagQueryInUrl(tag: string): void {
  if (!isBrowser) return
  const url = new URL(window.location.href)
  if (tag) {
    url.searchParams.set('tag', tag)
  } else {
    url.searchParams.delete('tag')
  }
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
}

function setSelectedTag(tag: string): void {
  const nextTag = tag.trim()
  if (nextTag === normalizedSelectedTag.value) return
  selectedTag.value = nextTag
  currentPage.value = 1
  updateTagQueryInUrl(nextTag)
  replayListAnimation()
}

function replayListAnimation(): void {
  if (!isBrowser || !isVisible.value) return
  if (animationResetTimer !== null) {
    window.clearTimeout(animationResetTimer)
    animationResetTimer = null
  }
  if (animationRafId !== null) {
    window.cancelAnimationFrame(animationRafId)
    animationRafId = null
  }

  // 强制重建列表节点，避免“同一篇文章复用 DOM”导致的过渡卡顿
  listRenderKey.value += 1
  listVisible.value = false

  animationRafId = window.requestAnimationFrame(() => {
    animationRafId = null
    animationResetTimer = window.setTimeout(() => {
      listVisible.value = true
      animationResetTimer = null
    }, 16)
  })
}

onMounted(async () => {
  // 确保只在浏览器环境中执行
  if (!isBrowser) return
  
  try {
    thoughtsPosts.value = await fetchPublishedThoughtPosts(withBase)
    syncTagFromUrl()
    window.addEventListener('popstate', syncTagFromUrl)
    
    isLoading.value = false
    
    // 使用useIntersectionObserver来触发动画
    if (animationTriggerRef.value) {
      const { stop } = useIntersectionObserver(
        animationTriggerRef,
        ([{ isIntersecting }]) => {
          if (isIntersecting) {
            isVisible.value = true
            replayListAnimation()
            stop()  // 只触发一次
          }
        }, 
        { 
          threshold: 0.1,  // 降低阈值，让元素更早触发
          rootMargin: '0px 0px -10% 0px'  // 增大底部边距，提前触发
        }
      )
    }
  } catch (error) {
    logError('PostList', '加载文章列表失败', error)
    hasError.value = true
    isLoading.value = false
  }
})

onBeforeUnmount(() => {
  if (!isBrowser) return
  window.removeEventListener('popstate', syncTagFromUrl)
  if (animationRafId !== null) {
    window.cancelAnimationFrame(animationRafId)
    animationRafId = null
  }
  if (animationResetTimer !== null) {
    window.clearTimeout(animationResetTimer)
    animationResetTimer = null
  }
})

// 计算阅读时间
function calculateReadTime(content: string | undefined): number {
  return estimateReadMinutes(content || '')
}

// 获取文章摘要，优先使用description
function getPostExcerpt(post: ThoughtPost): string {
  // 优先使用frontmatter中的description
  const description = post.frontmatter?.description
  if (typeof description === 'string' && description.trim()) {
    return description
  }
  // 其次使用通过<!-- more -->分隔的摘要
  return typeof post.excerpt === 'string' ? post.excerpt : ''
}

function normalizeFrontmatter(post: ThoughtPost): NormalizedFrontmatter {
  const title =
    typeof post.frontmatter?.title === 'string' && post.frontmatter.title.trim()
      ? post.frontmatter.title
      : '未命名文章'
  const date = typeof post.frontmatter?.date === 'string' ? post.frontmatter.date : ''
  const tags = Array.isArray(post.frontmatter?.tags)
    ? post.frontmatter.tags.filter((tag): tag is string => typeof tag === 'string' && !!tag.trim())
    : []
  return { title, date, tags }
}

function onTagClick(tag: string): void {
  setSelectedTag(tag)
}
</script>

<template>
  <div class="post-list">
    <!-- 添加专门用于动画触发的元素 -->
    <div ref="animationTriggerRef" class="animation-trigger"></div>
    
    <!-- 加载中状态：只在组件可见且正在加载时显示 -->
    <div v-if="isLoading && isVisible" class="loading">
      <p>加载中...</p>
    </div>
    
    <!-- 错误状态：只在组件可见且有错误时显示 -->
    <div v-else-if="hasError && isVisible" class="error">
      <p>加载文章失败，请刷新页面重试</p>
    </div>
    
    <!-- 文章列表：只有在不加载或组件可见时显示 -->
    <template v-else-if="!isLoading || isVisible">
      <div v-if="availableTags.length > 0" class="tag-filter" :class="{ 'tag-filter-animate': isVisible }">
        <button
          class="tag-chip"
          :class="{ active: normalizedSelectedTag === '' }"
          type="button"
          @click="setSelectedTag('')"
        >
          全部 <span class="tag-chip-count">[{{ thoughtsPosts.length }}]</span>
        </button>
        <button
          v-for="item in availableTags"
          :key="item.tag"
          class="tag-chip"
          :class="{ active: normalizedSelectedTag === item.tag }"
          type="button"
          @click="setSelectedTag(item.tag)"
        >
          #{{ item.tag }} <span class="tag-chip-count">[{{ item.count }}]</span>
        </button>
      </div>

      <div :key="listRenderKey" class="post-list-body">
        <div 
          v-for="(item, index) in paginatedViewPosts" 
          :key="item.post.url" 
          class="post-item"
          :class="{ 'post-item-animate': listVisible }"
          :style="{ '--post-delay': `${index * 0.08 + 0.04}s` }"
        >
          <div class="post-content">
            <h2 class="post-item-title">
              <a :href="withBase(item.post.url || '/thoughts/')" class="title-link">{{ item.meta.title }}</a>
            </h2>
            
            <!-- 文章摘要：优先使用description -->
            <p class="post-excerpt">{{ getPostExcerpt(item.post) }}</p>
            
            <div class="post-meta">
              <span class="post-date">{{ formatDateCn(item.meta.date) }}</span>
              <span class="post-separator">/</span>
              <span class="post-read-time">约{{ calculateReadTime(item.post.content) }}分钟读完</span>
              <span class="post-separator">/</span>
              <span class="post-category">随想</span>
              <span v-if="item.meta.tags.length" class="post-tags">
                <template v-for="(tag, index) in item.meta.tags" :key="index">
                  <a
                    class="post-tag"
                    :href="buildThoughtsTagUrl(tag)"
                    @click.prevent="onTagClick(tag)"
                  >
                    #{{ tag }}
                  </a>
                </template>
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 分页导航 -->
      <div 
        v-if="totalPages > 1" 
        class="pagination"
        :class="{ 'pagination-animate': listVisible }"
        :style="{ '--pagination-delay': `${paginatedViewPosts.length * 0.08 + 0.2}s` }"
      >
        <button 
          class="pagination-button" 
          :class="{ disabled: currentPage === 1 }"
          @click="goToPage(currentPage - 1)" 
          :disabled="currentPage === 1"
        >
          上一页
        </button>
        
        <button 
          v-for="page in pageNumbers" 
          :key="page"
          class="pagination-button" 
          :class="{ active: page === currentPage, ellipsis: page === '...' }"
          @click="typeof page === 'number' && goToPage(page)"
          :disabled="page === '...'"
        >
          {{ page }}
        </button>
        
        <button 
          class="pagination-button" 
          :class="{ disabled: currentPage === totalPages }"
          @click="goToPage(currentPage + 1)" 
          :disabled="currentPage === totalPages"
        >
          下一页
        </button>
      </div>
      
      <!-- 无文章提示：只在组件可见且没有文章时显示 -->
      <div v-if="filteredPosts.length === 0 && isVisible" class="no-posts">
        <p v-if="normalizedSelectedTag">当前标签下暂无文章：#{{ normalizedSelectedTag }}</p>
        <p v-else>暂无文章</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.post-list {
  margin-top: 2rem;
  position: relative;
}

.tag-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 1.5rem;
  opacity: 0;
  transform: translateY(8px);
  transition:
    opacity var(--lc-motion-duration-mid) var(--lc-motion-ease-standard),
    transform var(--lc-motion-duration-mid) var(--lc-motion-ease-standard);
}

.tag-filter-animate {
  opacity: 1;
  transform: translateY(0);
}

.tag-chip {
  appearance: none;
  display: inline-block;
  position: relative;
  border: none;
  padding: 0;
  background: transparent;
  color: var(--vp-c-text-2);
  cursor: pointer;
  font-size: 14px;
  line-height: 1.4;
  transition: color var(--lc-motion-duration-fast) var(--lc-motion-ease-standard);
}

.tag-chip::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -2px;
  width: 100%;
  height: 1px;
  background-color: currentColor;
  transform: scaleX(0);
  transform-origin: left center;
  opacity: 0.85;
  transition: transform var(--lc-motion-duration-mid) var(--lc-motion-ease-emphasis);
}

.tag-chip:hover {
  color: var(--vp-c-brand-1);
}

.tag-chip.active {
  color: var(--vp-c-brand-1);
}

.tag-chip.active::after {
  transform: scaleX(1);
}

.tag-chip-count {
  font-size: 13px;
  color: var(--vp-c-text-3);
}

/* 添加动画触发器样式 */
.animation-trigger {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: -1;
}

/* 动画相关样式 */
.post-item {
  margin-bottom: 2rem;
  border-bottom: 1px dashed var(--vp-c-divider);
  padding-bottom: 1rem;
  opacity: 0;
  transform: translateY(40px);
  transition:
    opacity var(--lc-motion-duration-slower) var(--lc-motion-ease-standard),
    transform var(--lc-motion-duration-slower) var(--lc-motion-ease-standard);
}

.post-item-animate {
  opacity: 1;
  transform: translateY(0);
  transition-delay: var(--post-delay, 0s);
}

.post-item:last-child {
  border-bottom: none;
}

/* 分页动画 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
  gap: 0.25rem;
  opacity: 0;
  transform: translateY(30px);
  transition:
    opacity var(--lc-motion-duration-slower) var(--lc-motion-ease-standard),
    transform var(--lc-motion-duration-slower) var(--lc-motion-ease-standard);
}

.pagination-animate {
  opacity: 1;
  transform: translateY(0);
  transition-delay: var(--pagination-delay, 0.5s);
}

.post-content {
  display: block;
  color: var(--vp-c-text-1);
}

.title-link {
  display: inline-block;
  text-decoration: none;
  color: var(--vp-c-text-1);
  transition: color var(--lc-motion-duration-fast);
  font-weight: 700;
}

.title-link:hover {
  color: var(--vp-c-brand-1);
}

.post-item-title {
  font-size: 1.4rem;
  margin: 0;
  color: var(--vp-c-text-1);
  padding-bottom: 0.5rem;
  margin-bottom: 0.8rem;
  width: 100%;
  border-bottom: none;
  font-weight: 700;
}

.post-excerpt {
  margin: 0.8rem 0;
  color: var(--vp-c-text-2);
  font-size: 0.95rem;
  line-height: 1.6;
}

.post-meta {
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.post-date, .post-read-time, .post-category {
  margin-right: 4px;
}

.post-separator {
  margin: 0 4px;
}

.post-tags {
  display: flex;
  flex-wrap: wrap;
  margin-left: 4px;
}

.post-tag {
  margin-right: 8px;
  color: var(--vp-c-brand-1);
  text-decoration: none;
  transition: color var(--lc-motion-duration-fast) var(--lc-motion-ease-standard);
}

.post-tag:hover {
  color: var(--vp-c-brand-2);
  text-decoration: underline;
}

.loading, .error, .no-posts {
  text-align: center;
  padding: 2rem 0;
  color: var(--vp-c-text-2);
  font-style: italic;
}

.error {
  color: var(--vp-c-danger);
}

.pagination-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 30px;
  padding: 0 10px;
  font-size: 14px;
  border-radius: 0;
  background: transparent;
  color: var(--vp-c-text-2);
  border: none;
  position: relative;
  cursor: pointer;
  transition: color var(--lc-motion-duration-fast) var(--lc-motion-ease-standard);
}

.pagination-button::after {
  content: '';
  position: absolute;
  left: 8px;
  right: 8px;
  bottom: 2px;
  height: 1px;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: left center;
  transition: transform var(--lc-motion-duration-mid) var(--lc-motion-ease-emphasis);
}

.pagination-button:hover:not(.disabled):not(.active):not(.ellipsis) {
  color: var(--vp-c-brand-1);
}

.pagination-button.active {
  color: var(--vp-c-brand-1);
  font-weight: 600;
}

.pagination-button.active::after {
  transform: scaleX(1);
}

.pagination-button.disabled,
.pagination-button.ellipsis {
  opacity: 0.55;
  cursor: not-allowed;
  color: var(--vp-c-text-3);
}

.pagination-button.disabled::after,
.pagination-button.ellipsis::after {
  transform: scaleX(0);
}

@media (max-width: 768px) {
  .tag-filter {
    margin-bottom: 1.2rem;
    gap: 6px;
  }

  .tag-chip {
    font-size: 12px;
    padding: 0;
  }
}
</style> 
