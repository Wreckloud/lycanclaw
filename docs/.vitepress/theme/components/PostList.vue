<script setup lang="ts">
/**
 * PostList.vue：
 * 定义PostList组件的交互与展示逻辑。
 */

import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { withBase } from 'vitepress'
import { useIntersectionObserver } from '@vueuse/core'
import {
  fetchPublishedThoughtPosts,
  estimateReadMinutes,
  type ThoughtPost
} from '../utils/content'
import { formatDateCn } from '../utils/time'
import { logError } from '../utils/logger'

const isBrowser = typeof window !== 'undefined'
const POSTS_PER_PAGE = 7
const MAX_VISIBLE_PAGES = 5
const ANIMATION_RESET_DELAY_MS = 16
const VISIBILITY_THRESHOLD = 0.1
const VISIBILITY_ROOT_MARGIN = '0px 0px -10% 0px'
type PageNumber = number | '...'

const animationTriggerRef = ref<HTMLElement | null>(null)
const isVisible = ref(false)
const listVisible = ref(false)
const listRenderKey = ref(0)
let animationResetTimer: number | null = null
let animationRafId: number | null = null
let stopObserver: (() => void) | null = null

interface NormalizedFrontmatter {
  title: string
  date: string
  tags: string[]
  readMinutes: number
}

interface ThoughtTagItem {
  tag: string
  count: number
}

interface ThoughtPostSummary {
  url: string
  title: string
  description: string
  date: string
  tags: string[]
  excerpt: string
  readMinutes: number
}

const allThoughtPosts = ref<ThoughtPostSummary[]>([])
const availableTags = ref<ThoughtTagItem[]>([])
const totalPostsCount = ref(0)
const paginatedPosts = ref<ThoughtPostSummary[]>([])
const isLoading = ref(true)
const hasError = ref(false)
const selectedTag = ref('')

const currentPage = ref(1)
const totalPages = ref(0)
const normalizedSelectedTag = computed(() => selectedTag.value.trim())
const paginatedViewPosts = computed(() =>
  paginatedPosts.value.map((post) => ({
    post,
    meta: normalizeFrontmatter(post)
  }))
)

const pageNumbers = computed(() => {
  const pages: PageNumber[] = []
  if (totalPages.value <= MAX_VISIBLE_PAGES) {
    return Array.from({ length: totalPages.value }, (_, i) => i + 1)
  }

  pages.push(1)
  let start = Math.max(2, currentPage.value - 1)
  let end = Math.min(totalPages.value - 1, currentPage.value + 1)

  if (currentPage.value <= 3) {
    end = Math.min(totalPages.value - 1, 4)
  }

  if (currentPage.value >= totalPages.value - 2) {
    start = Math.max(2, totalPages.value - 3)
  }

  if (start > 2) {
    pages.push('...')
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (end < totalPages.value - 1) {
    pages.push('...')
  }

  pages.push(totalPages.value)
  return pages
})

function cleanupAnimationTimers(): void {
  if (!isBrowser) return
  if (animationResetTimer !== null) {
    window.clearTimeout(animationResetTimer)
    animationResetTimer = null
  }
  if (animationRafId !== null) {
    window.cancelAnimationFrame(animationRafId)
    animationRafId = null
  }
}

function goToPage(page: PageNumber): void {
  if (typeof page === 'number' && page >= 1 && page <= Math.max(1, totalPages.value)) {
    currentPage.value = page
    void loadPagePosts({ replayAnimation: true, smoothScroll: true })
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

function handlePopstate(): void {
  syncTagFromUrl()
  void loadPagePosts({ replayAnimation: true, smoothScroll: false })
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
  void loadPagePosts({ replayAnimation: true, smoothScroll: false })
}

function replayListAnimation(): void {
  if (!isBrowser || !isVisible.value) return
  cleanupAnimationTimers()

  listRenderKey.value += 1
  listVisible.value = false

  animationRafId = window.requestAnimationFrame(() => {
    animationRafId = null
    animationResetTimer = window.setTimeout(() => {
      listVisible.value = true
      animationResetTimer = null
    }, ANIMATION_RESET_DELAY_MS)
  })
}

async function loadTags(): Promise<void> {
  const counter = new Map<string, number>()
  for (const post of allThoughtPosts.value) {
    for (const tag of post.tags) {
      counter.set(tag, (counter.get(tag) || 0) + 1)
    }
  }
  availableTags.value = [...counter.entries()]
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1]
      return a[0].localeCompare(b[0], 'zh-Hans-CN')
    })
    .map(([tag, count]) => ({ tag, count }))
  totalPostsCount.value = allThoughtPosts.value.length
}

async function loadPagePosts(options: { replayAnimation: boolean; smoothScroll: boolean }): Promise<void> {
  const selected = normalizedSelectedTag.value
  const matched = selected
    ? allThoughtPosts.value.filter((post) => post.tags.includes(selected))
    : allThoughtPosts.value

  const total = matched.length
  totalPages.value = Math.max(1, Math.ceil(total / POSTS_PER_PAGE))
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value
  }
  const start = (currentPage.value - 1) * POSTS_PER_PAGE
  paginatedPosts.value = matched.slice(start, start + POSTS_PER_PAGE)
  totalPostsCount.value = selected ? total : allThoughtPosts.value.length


  if (options.smoothScroll && isBrowser) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (options.replayAnimation) {
    replayListAnimation()
  }
}

function parseThoughtPost(post: ThoughtPost): ThoughtPostSummary | null {
  const frontmatter = post.frontmatter || {}
  const url = typeof post.url === 'string' ? post.url : ''
  const title = typeof frontmatter.title === 'string' ? frontmatter.title.trim() : ''
  const date = typeof frontmatter.date === 'string' ? frontmatter.date.trim() : ''
  if (!url || !title || !date) return null

  const description = typeof frontmatter.description === 'string'
    ? frontmatter.description.trim()
    : ''
  const excerpt = typeof post.excerpt === 'string' ? post.excerpt : ''
  const tags = Array.isArray(frontmatter.tags)
    ? frontmatter.tags.filter((tag): tag is string => typeof tag === 'string' && !!tag.trim())
    : []
  const content = typeof post.content === 'string' ? post.content : ''
  const readMinutes = estimateReadMinutes(content)

  return {
    url,
    title,
    description,
    date,
    tags,
    excerpt,
    readMinutes
  }
}

async function loadThoughtPosts(): Promise<void> {
  const posts = await fetchPublishedThoughtPosts(withBase)
  const normalized = posts
    .map(parseThoughtPost)
    .filter((post): post is ThoughtPostSummary => post !== null)

  normalized.sort((a, b) => {
    const left = new Date(a.date).getTime()
    const right = new Date(b.date).getTime()
    if (right !== left) return right - left
    return a.title.localeCompare(b.title, 'zh-Hans-CN')
  })
  allThoughtPosts.value = normalized
}

onMounted(async () => {
  if (!isBrowser) return

  try {
    await loadThoughtPosts()
    await loadTags()
    syncTagFromUrl()
    await loadPagePosts({ replayAnimation: false, smoothScroll: false })
    window.addEventListener('popstate', handlePopstate)
    isLoading.value = false

    if (animationTriggerRef.value) {
      const observer = useIntersectionObserver(
        animationTriggerRef,
        ([entry]) => {
          if (entry?.isIntersecting) {
            isVisible.value = true
            replayListAnimation()
            observer.stop()
          }
        },
        {
          threshold: VISIBILITY_THRESHOLD,
          rootMargin: VISIBILITY_ROOT_MARGIN
        }
      )
      stopObserver = observer.stop
    }
  } catch (error) {
    logError('PostList', '加载文章列表失败', error)
    hasError.value = true
    isLoading.value = false
  }
})

onBeforeUnmount(() => {
  if (!isBrowser) return
  window.removeEventListener('popstate', handlePopstate)
  cleanupAnimationTimers()
  stopObserver?.()
  stopObserver = null
})

function getPostExcerpt(post: ThoughtPostSummary): string {
  const description = typeof post.description === 'string' ? post.description.trim() : ''
  if (description) return description
  return typeof post.excerpt === 'string' ? post.excerpt : ''
}

function normalizeFrontmatter(post: ThoughtPostSummary): NormalizedFrontmatter {
  const title = typeof post.title === 'string' && post.title.trim()
    ? post.title
      : '未命名文章'
  const date = typeof post.date === 'string' ? post.date : ''
  const tags = Array.isArray(post.tags)
    ? post.tags.filter((tag): tag is string => typeof tag === 'string' && !!tag.trim())
    : []
  const readMinutes =
    typeof post.readMinutes === 'number' && Number.isFinite(post.readMinutes)
      ? Math.max(1, Math.round(post.readMinutes))
      : 1
  return { title, date, tags, readMinutes }
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
          全部 <span class="tag-chip-count">[{{ totalPostsCount }}]</span>
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
              <span class="post-read-time">约{{ item.meta.readMinutes }}分钟读完</span>
              <span class="post-separator">/</span>
              <span class="post-category">随想</span>
              <span v-if="item.meta.tags.length" class="post-tags">
                <template v-for="tag in item.meta.tags" :key="`${item.post.url}-${tag}`">
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
      <div v-if="paginatedViewPosts.length === 0 && isVisible" class="no-posts">
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
