<script setup lang="ts">
/**
 * StatsPanel.vue：
 * 定义StatsPanel组件的交互与展示逻辑。
 */

import { nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { withBase } from 'vitepress'
import {
  useIntersectionObserver,
  useEventListener
} from '@vueuse/core'
import EncourageWidget from './EncourageWidget.vue'
import {
  fetchKnowledgeStats,
  fetchPublishedThoughtPosts
} from '../../utils/content'
import {
  calculateHomeStats,
  isHomeTwoColumnLayout,
  markHomeTopSectionsVisible,
  onHomeTopSectionsVisible
} from '../../utils/home'
import { logError } from '../../utils/logger'

const isBrowser = typeof window !== 'undefined'
const VISIBILITY_THRESHOLD = 0.6
const VISIBILITY_ROOT_MARGIN = '0px 0px -10% 0px'
const NUMBER_ANIMATION_DELAY_MS = 200

interface StatsState {
  currentMonthPosts: number
  totalPostsCount: number
  thoughtsWords: number
  animatedCurrentMonthPosts: number
  animatedTotalPostsCount: number
  animatedThoughtsWords: number
}

const stats = reactive<StatsState>({
  currentMonthPosts: 0,
  totalPostsCount: 0,
  thoughtsWords: 0,
  animatedCurrentMonthPosts: 0,
  animatedTotalPostsCount: 0,
  animatedThoughtsWords: 0,
})

const isVisible = ref(false)
const animationTriggerRef = ref<HTMLElement | null>(null)
const statsValueRefs = ref<HTMLElement[]>([])

const isLoading = ref(true)
const hasError = ref(false)
const animationStarted = ref(false)
let stopVisibilityObserver: (() => void) | null = null
let stopTopSectionSync: (() => void) | null = null
let stopResizeListener: (() => void) | null = null
let animationDelayTimer: ReturnType<typeof setTimeout> | null = null
let animationFrameId: number | null = null

function clearAnimationSchedule(): void {
  if (animationDelayTimer !== null) {
    clearTimeout(animationDelayTimer)
    animationDelayTimer = null
  }
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
}

function formatNumber(num: number | null | undefined): string {
  if (num === undefined || num === null) return '0'
  
  if (num < 10000) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  } else if (num < 1000000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  } else if (num < 100000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
  } else {
    return (num / 100000000).toFixed(1).replace(/\.0$/, '') + '亿'
  }
}

function animateNumbers() {
  if (!animationStarted.value) {
    animationStarted.value = true
    
    const duration = 2000
    const framesPerSecond = 60
    const totalFrames = duration / 1000 * framesPerSecond
    let currentFrame = 0
    
    const targetCurrentMonthPosts = stats.currentMonthPosts
    const targetTotalPostsCount = stats.totalPostsCount
    const targetThoughtsWords = stats.thoughtsWords
    
    stats.animatedCurrentMonthPosts = 0
    stats.animatedTotalPostsCount = 0
    stats.animatedThoughtsWords = 0

    function animate() {
      currentFrame++
      const progress = currentFrame / totalFrames
      
      const easeProgress = 1 - Math.pow(1 - progress, 4)
      
      stats.animatedCurrentMonthPosts = Math.round(easeProgress * targetCurrentMonthPosts)
      stats.animatedTotalPostsCount = Math.round(easeProgress * targetTotalPostsCount)
      stats.animatedThoughtsWords = Math.round(easeProgress * targetThoughtsWords)
      
      if (currentFrame < totalFrames) {
        animationFrameId = requestAnimationFrame(animate)
      } else {
        stats.animatedCurrentMonthPosts = targetCurrentMonthPosts
        stats.animatedTotalPostsCount = targetTotalPostsCount
        stats.animatedThoughtsWords = targetThoughtsWords
        animationFrameId = null
      }
    }
    
    animationFrameId = requestAnimationFrame(animate)
  }
}

function delayedAnimateNumbers(delay = NUMBER_ANIMATION_DELAY_MS) {
  if (!animationStarted.value) {
    clearAnimationSchedule()
    animationDelayTimer = setTimeout(() => {
      animationDelayTimer = null
      animateNumbers()
    }, delay)
  }
}

function revealStatsPanel(): void {
  isVisible.value = true
  if (!isLoading.value && !animationStarted.value) {
    delayedAnimateNumbers()
  }
}

function adjustFontSizes() {
  if (!isBrowser || !statsValueRefs.value.length) return
  
  statsValueRefs.value.forEach((el) => {
    if (!el) return
    
    const container = el.parentElement
    if (!container) return
    
    el.style.setProperty('--scale', '1')

    const elWidth = el.scrollWidth
    const containerWidth = container.clientWidth - 16
    if (elWidth > containerWidth && containerWidth > 0) {
      const scale = Math.min(0.95, containerWidth / elWidth)
      el.style.setProperty('--scale', String(scale))
    } else {
      el.style.setProperty('--scale', '1')
    }
  })
}

watch(() => [stats.animatedTotalPostsCount, stats.animatedThoughtsWords], () => {
  nextTick(() => {
    adjustFontSizes()
  })
})

onMounted(async () => {
  if (!isBrowser) return

  try {
    stopTopSectionSync = onHomeTopSectionsVisible(() => {
      revealStatsPanel()
    })

    stopResizeListener = useEventListener(window, 'resize', () => {
      adjustFontSizes()
    })

    const observer = useIntersectionObserver(
      animationTriggerRef,
      ([entry]) => {
        if (!entry?.isIntersecting) return
        revealStatsPanel()
        if (isHomeTwoColumnLayout()) {
          markHomeTopSectionsVisible()
        }
        observer.stop()
        stopVisibilityObserver = null
      },
      {
        threshold: VISIBILITY_THRESHOLD,
        rootMargin: VISIBILITY_ROOT_MARGIN
      }
    )
    stopVisibilityObserver = observer.stop

    const thoughtsPosts = await fetchPublishedThoughtPosts(withBase)
    const knowledgeStats = await fetchKnowledgeStats(withBase)
    const summary = calculateHomeStats(thoughtsPosts, knowledgeStats)

    stats.currentMonthPosts = summary.currentMonthPosts
    stats.totalPostsCount = summary.totalPostsCount
    stats.thoughtsWords = summary.totalWords

    isLoading.value = false

    nextTick(() => {
      adjustFontSizes()
      if (isVisible.value && !animationStarted.value) {
        delayedAnimateNumbers()
      }
    })
  } catch (error) {
    logError('StatsPanel', '加载统计数据失败', error)
    hasError.value = true
    isLoading.value = false
  }
})

onBeforeUnmount(() => {
  clearAnimationSchedule()
  stopVisibilityObserver?.()
  stopVisibilityObserver = null
  stopTopSectionSync?.()
  stopTopSectionSync = null
  stopResizeListener?.()
  stopResizeListener = null
})

</script>

<template>
  <div class="stats-panel" :class="{ 'is-visible': isVisible }">
    <!-- 添加一个专门用于触发动画的元素 -->
    <div ref="animationTriggerRef" class="animation-trigger"></div>
    
    <h2 class="section-title" :class="{ 'animate-in': isVisible }">数据统计</h2>
    
    <!-- 加载中状态：只在组件可见时显示 -->
    <div v-if="isLoading && isVisible" class="loading">
      <p>加载中…</p>
    </div>
    
    <!-- 错误状态：只在组件可见时显示 -->
    <div v-else-if="hasError && isVisible" class="error">
      <p>加载统计数据失败，请刷新页面重试</p>
    </div>
    
    <!-- 统计数据展示：只有在不加载或组件可见时显示 -->
    <div v-else-if="!isLoading || isVisible" class="stats-container">
      <div class="stats-grid">
        <div class="encourage-widget-container" style="--anim-delay: 0.1s">
          <encourage-widget 
            :animated-count="stats.animatedCurrentMonthPosts"
          />
        </div>
        
        <div class="stats-card" :class="{ 'animate-in': isVisible }" style="--anim-delay: var(--lc-motion-duration-fast)">
          <div class="stats-value" ref="statsValueRefs">{{ formatNumber(stats.animatedTotalPostsCount) }}</div>
          <div class="stats-label">文章总数</div>
        </div>
        
        <div class="stats-card" :class="{ 'animate-in': isVisible }" style="--anim-delay: 0.3s">
          <div class="stats-value" ref="statsValueRefs">{{ formatNumber(stats.animatedThoughtsWords) }}</div>
          <div class="stats-label">总字数</div>
        </div>
      </div>
      
    </div>
  </div>
</template>

<style scoped>
.stats-panel {
  position: relative;
  overflow: hidden !important;
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
.section-title,
.stats-card {
  opacity: 0;
  transform: translateY(20px);
}

/* 为EncourageWidget添加专门的容器样式 */
.encourage-widget-container {
  opacity: 0; /* 初始设置为不可见 */
  transform: translateY(20px); /* 与其他元素保持一致的初始位置 */
  transition: opacity var(--lc-motion-duration-slower) var(--lc-motion-ease-emphasis),
              transform var(--lc-motion-duration-slower) var(--lc-motion-ease-emphasis); /* 使用与fadeInUp相同的动画曲线 */
  transition-delay: var(--anim-delay, 0s); /* 添加延迟支持 */
}

/* 当父组件可见时显示EncourageWidget */
.stats-panel.is-visible .encourage-widget-container,
.stats-container .animate-in ~ .encourage-widget-container {
  opacity: 1;
  transform: translateY(0);
}

/* 当元素可见时应用动画 */
.animate-in {
  animation: fadeInUp var(--lc-motion-duration-slower) var(--lc-motion-ease-emphasis) forwards;
  animation-delay: var(--anim-delay, 0s);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section-title {
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  border-bottom: 1px solid var(--vp-c-divider);
  padding-bottom: 0.5rem;
}

.loading, .error {
  text-align: center;
  padding: 1rem 0;
  color: var(--vp-c-text-2);
  font-style: italic;
}

.error {
  color: var(--vp-c-danger);
}

.stats-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  overflow: hidden;
  position: relative;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  width: 100%;
  min-width: 0;
}

.stats-card {
  background-color: var(--vp-c-bg-soft);
  border-radius: 8px;
  padding: 1.5rem 0.5rem;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  user-select: none;
  cursor: default;
  position: relative;
  overflow: hidden;
}

.stats-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--vp-c-brand-1);
  margin-bottom: 0.5rem;
  white-space: nowrap;
  height: 2.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: visible;
  text-overflow: clip;
  user-select: none;
  padding: 0 0.5rem;
  min-width: 0;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
  width: 100%;
}

.stats-label {
  font-size: 0.95rem;
  color: var(--vp-c-text-2);
  white-space: nowrap;
  height: 1.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  user-select: none;
}

/* 移动端适配 */
@media (max-width: 959px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.8rem;
  }
  
  .stats-card {
    padding: 1rem 0.5rem;
  }
  
  .stats-value {
    font-size: 1.5rem;
    height: 2rem;
    letter-spacing: -0.03em;
  }
  
  .stats-label {
    font-size: 0.85rem;
    height: 1.3rem;
  }
}

/* 添加中等屏幕尺寸的断点，专门处理双列布局 */
@media (min-width: 481px) and (max-width: 768px) {
  .stats-grid {
    gap: 0.6rem;
  }
  
  .stats-value {
    font-size: 1.3rem;
    padding: 0 0.2rem;
    letter-spacing: -0.04em;
    height: 1.9rem;
  }
}

/* 针对总字数特别长的情况 */
.stats-card:last-child .stats-value {
  font-size: 1.7rem;
  letter-spacing: -0.03em;
}

@media (min-width: 481px) and (max-width: 768px) {
  .stats-card:last-child .stats-value {
    font-size: 1.2rem;
    letter-spacing: -0.05em;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    gap: 0.5rem;
  }
  
  .stats-card {
    padding: 0.8rem 0.4rem;
  }
  
  .stats-value {
    font-size: 1.4rem;
    height: 1.8rem;
    margin-bottom: 0.3rem;
  }
  
  .stats-label {
    font-size: 0.8rem;
    height: 1.2rem;
  }
  
  .stats-card:last-child .stats-value {
    font-size: 1.3rem;
  }
}

/* 添加自动缩放功能，根据数字长度动态调整字体大小 */
@media (max-width: 768px) {
  .stats-value {
    transform-origin: center;
    transform: scale(var(--scale, 1));
    transition: transform var(--lc-motion-duration-fast) var(--lc-motion-ease-standard);
  }
}
</style> 
