<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { withBase } from 'vitepress'
import {
  useDebounceFn,
  useEventListener,
  useIntersectionObserver,
  useIntervalFn,
  useWindowSize
} from '@vueuse/core'
import { formatMonthDayCn } from '../../utils/time'
import { logError } from '../../utils/logger'
import { fetchRecommendedPosts, type RecommendedPost } from '../../utils/recommendedApi'
import {
  isHomeTwoColumnLayout,
  markHomeTopSectionsVisible,
  onHomeTopSectionsVisible
} from '../../utils/homeTopSectionSync'
import { recommendedPosts as configuredPostsPaths } from '../../../config/recommended-posts.js'

const isBrowser = typeof window !== 'undefined'
const INTERACTION_COOLDOWN_MS = 3000
const NEXT_PREV_COOLDOWN_MS = 1000
const INDEX_UPDATE_DEBOUNCE_MS = 50
const VISIBILITY_THRESHOLD = 0.6
const VISIBILITY_ROOT_MARGIN = '0px 0px -10% 0px'

const props = defineProps({
  maxPosts: {
    type: Number,
    default: 5
  },
  autoplaySpeed: {
    type: Number,
    default: 6000
  }
})

const sectionRef = ref<HTMLElement | null>(null)
const carouselRef = ref<HTMLElement | null>(null)
const animationTriggerRef = ref<HTMLElement | null>(null)
const isVisible = ref(false)
const recommendedPosts = ref<RecommendedPost[]>([])
const isLoading = ref(true)
const hasError = ref(false)
const currentIndex = ref(0)
const scrollPosition = ref(0)
const maxScroll = ref(0)
const isUserInteracting = ref(false)
const isHovered = ref(false)
const hasTriggeredVisibleOnce = ref(false)

const { width } = useWindowSize()
const isPcLayout = computed(() => width.value >= 960)
const shouldDisableAutoplay = computed(() => recommendedPosts.value.length <= 1)
const canAutoplay = computed(() =>
  props.autoplaySpeed > 0 &&
  !shouldDisableAutoplay.value &&
  !isHovered.value &&
  !isUserInteracting.value
)

let scrollResetTimer: number | null = null
let stopVisibilityObserver: (() => void) | null = null
let stopTopSectionSync: (() => void) | null = null

const cardWidth = computed(() => {
  if (recommendedPosts.value.length === 1) return '100%'
  if (recommendedPosts.value.length < 3) return '80%'

  return isPcLayout.value
    ? `${Math.min(85 - (recommendedPosts.value.length * 5), 70)}%`
    : `${Math.min(90 - (recommendedPosts.value.length * 3), 80)}%`
})

const spacerWidth = computed(() => {
  const cardWidthPercent = parseFloat(cardWidth.value)
  return `calc((100% - ${cardWidthPercent}%) / 2)`
})

const updateCurrentIndex = useDebounceFn(() => {
  if (!carouselRef.value || recommendedPosts.value.length <= 1) return

  const scrollLeft = carouselRef.value.scrollLeft
  const containerWidth = carouselRef.value.clientWidth
  const totalWidth = carouselRef.value.scrollWidth
  const scrollableWidth = totalWidth - containerWidth
  if (scrollableWidth <= 0) return

  const scrollProgress = scrollLeft / scrollableWidth
  const maxIndex = recommendedPosts.value.length - 1
  const newIndex = Math.round(Math.max(0, Math.min(maxIndex, scrollProgress * maxIndex)))

  if (currentIndex.value !== newIndex) {
    currentIndex.value = newIndex
  }

  scrollPosition.value = scrollLeft
  maxScroll.value = scrollableWidth
}, INDEX_UPDATE_DEBOUNCE_MS)

function scrollToCardByProgress(progress: number, smooth = true): void {
  if (!carouselRef.value || !recommendedPosts.value.length) return
  const scrollableWidth = carouselRef.value.scrollWidth - carouselRef.value.clientWidth
  carouselRef.value.scrollTo({
    left: progress * scrollableWidth,
    behavior: smooth ? 'smooth' : 'auto'
  })
}

function scrollToCard(index: number, smooth = true): void {
  if (!carouselRef.value || !recommendedPosts.value.length) return
  const safeIndex = Math.max(0, Math.min(index, recommendedPosts.value.length - 1))
  currentIndex.value = safeIndex
  const maxIndex = Math.max(1, recommendedPosts.value.length - 1)
  scrollToCardByProgress(safeIndex / maxIndex, smooth)
}

function clearInteractionResetTimer(): void {
  if (scrollResetTimer === null) return
  clearTimeout(scrollResetTimer)
  scrollResetTimer = null
}

function scheduleInteractionReset(delayMs = INTERACTION_COOLDOWN_MS): void {
  clearInteractionResetTimer()
  scrollResetTimer = window.setTimeout(() => {
    scrollResetTimer = null
    isUserInteracting.value = false
    if (canAutoplay.value) {
      resumeAutoplay()
    }
  }, delayMs)
}

function prevCard(): void {
  if (shouldDisableAutoplay.value) return
  isUserInteracting.value = true
  const prevIndex = currentIndex.value <= 0
    ? recommendedPosts.value.length - 1
    : currentIndex.value - 1
  scrollToCard(prevIndex)
  scheduleInteractionReset(NEXT_PREV_COOLDOWN_MS)
}

function nextCard(): void {
  if (shouldDisableAutoplay.value) return
  isUserInteracting.value = true
  const nextIndex = currentIndex.value >= recommendedPosts.value.length - 1
    ? 0
    : currentIndex.value + 1
  scrollToCard(nextIndex)
  scheduleInteractionReset(NEXT_PREV_COOLDOWN_MS)
}

function handleScroll(): void {
  updateCurrentIndex()
  if (!isUserInteracting.value) {
    isUserInteracting.value = true
    pauseAutoplay()
  }
  scheduleInteractionReset()
}

function handleTouchStart(): void {
  isUserInteracting.value = true
  pauseAutoplay()
  clearInteractionResetTimer()
}

function handleTouchEnd(): void {
  scheduleInteractionReset()
}

function handleMouseEnter(): void {
  isHovered.value = true
  pauseAutoplay()
}

function handleMouseLeave(): void {
  isHovered.value = false
  if (canAutoplay.value) {
    resumeAutoplay()
  }
}

function handleKeyDown(e: KeyboardEvent): void {
  if (!isVisible.value || shouldDisableAutoplay.value || !isHovered.value) return

  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    prevCard()
    e.preventDefault()
  } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    nextCard()
    e.preventDefault()
  }
}

const { pause: pauseAutoplay, resume: resumeAutoplay } = useIntervalFn(() => {
  if (shouldDisableAutoplay.value || isUserInteracting.value) return
  const nextIndex = (currentIndex.value + 1) % recommendedPosts.value.length
  scrollToCard(nextIndex)
}, props.autoplaySpeed, { immediate: false })

watch(() => recommendedPosts.value.length, (newCount) => {
  if (currentIndex.value >= newCount) {
    currentIndex.value = Math.max(0, newCount - 1)
    nextTick(() => {
      scrollToCard(currentIndex.value, false)
    })
  }
})

watch(isVisible, async (visible) => {
  if (!visible) {
    pauseAutoplay()
    return
  }

  if (!hasTriggeredVisibleOnce.value) {
    hasTriggeredVisibleOnce.value = true
    await nextTick()
    scrollToCard(0, false)
    updateCurrentIndex()
  }

  if (canAutoplay.value) {
    resumeAutoplay()
  }
})

onMounted(async () => {
  if (!isBrowser) return

  stopTopSectionSync = onHomeTopSectionsVisible(() => {
    isVisible.value = true
  })

  const observer = useIntersectionObserver(
    animationTriggerRef,
    ([entry]) => {
      if (entry?.isIntersecting && !isVisible.value) {
        isVisible.value = true
        markHomeTopSectionsVisible()
        observer.stop()
        stopVisibilityObserver = null
        return
      }

      if (entry?.isIntersecting && isHomeTwoColumnLayout()) {
        markHomeTopSectionsVisible()
      }
    },
    {
      threshold: VISIBILITY_THRESHOLD,
      rootMargin: VISIBILITY_ROOT_MARGIN
    }
  )
  stopVisibilityObserver = observer.stop

  await fetchPosts()

  nextTick(() => {
    if (!carouselRef.value) return
    useEventListener(carouselRef.value, 'scroll', handleScroll)
    useEventListener(carouselRef.value, 'touchstart', handleTouchStart)
    useEventListener(carouselRef.value, 'touchend', handleTouchEnd)
    useEventListener(carouselRef.value, 'mouseenter', handleMouseEnter)
    useEventListener(carouselRef.value, 'mouseleave', handleMouseLeave)
    useEventListener(window, 'keydown', handleKeyDown)
    updateCurrentIndex()
  })
})

onBeforeUnmount(() => {
  pauseAutoplay()
  clearInteractionResetTimer()
  stopVisibilityObserver?.()
  stopVisibilityObserver = null
  stopTopSectionSync?.()
  stopTopSectionSync = null
})

async function fetchPosts(): Promise<void> {
  if (!isBrowser) return
  isLoading.value = true
  hasError.value = false

  try {
    recommendedPosts.value = await fetchRecommendedPosts(
      withBase,
      configuredPostsPaths,
      props.maxPosts
    )
    hasError.value = recommendedPosts.value.length === 0
  } catch (error) {
    logError('RecommendedReading', '加载推荐阅读失败', error)
    recommendedPosts.value = []
    hasError.value = true
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="recommended-reading" ref="sectionRef">
    <!-- 添加专门用于触发动画的元素 -->
    <div ref="animationTriggerRef" class="animation-trigger"></div>

    <h2 class="section-title" :class="{ 'animate-in': isVisible }">推荐阅读</h2>

    <!-- 加载中状态：只在组件可见时显示 -->
    <div v-if="isLoading && isVisible" class="loading">
      <p>加载中...</p>
    </div>

    <!-- 错误状态：只在组件可见时显示 -->
    <div v-else-if="hasError && isVisible" class="error">
      <p>加载推荐文章失败，请刷新页面重试</p>
    </div>

    <!-- 轮播卡片：只有在不加载或组件可见时显示 -->
    <template v-else-if="!isLoading || isVisible">
      <div 
        class="carousel-wrapper" 
        :class="{ 
          'animate-in': isVisible, 
          'single-card': recommendedPosts.length === 1
        }" 
        style="--anim-delay: 0.15s"
      >
        <!-- 左侧渐变遮罩 -->
        <div class="fade-mask left" :style="{ 
          opacity: scrollPosition > 0 && recommendedPosts.length > 1 ? 1 : 0 
        }"></div>
        
        <!-- 轮播容器 -->
        <div 
          class="carousel-container" 
          ref="carouselRef"
          @scroll="handleScroll"
        >
          <div class="padding-spacer" :style="{ 
            flexBasis: spacerWidth, 
            minWidth: spacerWidth 
          }"></div>
          
          <div 
            v-for="post in recommendedPosts" 
            :key="post.url" 
            class="post-card"
            :style="{ 
              flexBasis: cardWidth, 
              width: cardWidth 
            }"
          >
            <div class="post-content">
              <h3 class="post-item-title">
                <a :href="withBase(post.url)" class="title-link">{{ post.title }}</a>
              </h3>

              <!-- 文章摘要 -->
              <p class="post-excerpt">{{ post.description }}</p>

              <div class="post-meta">
                <span class="post-date">{{ formatMonthDayCn(post.date) }}</span>
                <span class="post-separator">/</span>
                <span class="post-category">推荐</span>

                <!-- 标签 -->
                <span v-if="post.tags?.length" class="post-tags">
                  <span v-for="(tag, tagIndex) in post.tags" :key="tagIndex" class="post-tag">
                    #{{ tag }}
                  </span>
                </span>
              </div>
            </div>
          </div>
          
          <div class="padding-spacer" :style="{ 
            flexBasis: spacerWidth, 
            minWidth: spacerWidth 
          }"></div>
        </div>
        
        <!-- 右侧渐变遮罩 -->
        <div class="fade-mask right" :style="{ 
          opacity: scrollPosition < maxScroll - 10 && recommendedPosts.length > 1 ? 1 : 0 
        }"></div>
      </div>

      <!-- 卡片指示器，只有多于1篇文章时才显示 -->
      <div 
        v-if="recommendedPosts.length > 1" 
        class="carousel-indicators" 
        :class="{ 'animate-in': isVisible }" 
        style="--anim-delay: 0.3s"
      >
        <button 
          v-for="(post, index) in recommendedPosts" 
          :key="'indicator-' + index"
          class="indicator-dot"
          :class="{ 'active': index === currentIndex }"
          @click="scrollToCard(index)"
          :aria-label="`查看推荐文章 ${index + 1}`"
        ></button>
      </div>
      
      <!-- 无文章提示：只在组件可见时显示 -->
      <div v-if="recommendedPosts.length === 0 && isVisible" class="no-posts">
        <p>暂无推荐文章</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.recommended-reading {
  overflow: hidden !important;
  position: relative;
  min-height: 100px;
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

/* 轮播容器样式 */
.carousel-wrapper {
  position: relative;
  width: 100%;
  overflow: hidden;
  margin-top: 1rem;
  padding-bottom: 0.5rem;
}

.carousel-container {
  display: flex;
  width: 100%;
  overflow-x: auto;
  scroll-snap-type: x mandatory; /* 使用mandatory确保滚动停止在卡片上 */
  scrollbar-width: none;
  -ms-overflow-style: none;
  scroll-behavior: smooth; /* 使用smooth实现平滑滚动 */
  padding-bottom: 0.5rem;
  -webkit-overflow-scrolling: touch; /* 增加iOS上的滚动惯性 */
}

/* 隐藏WebKit浏览器的滚动条 */
.carousel-container::-webkit-scrollbar {
  display: none;
}

/* 左右两端的填充空白，确保首尾卡片显示在中间 */
.padding-spacer {
  flex: 0 0 calc((100% - 70%) / 2);
  min-width: calc((100% - 70%) / 2);
}

/* 左右渐变遮罩 */
.fade-mask {
  position: absolute;
  top: 0;
  height: 100%;
  width: 80px;
  z-index: 10;
  pointer-events: none;
  transition: opacity var(--lc-motion-duration-normal) var(--lc-motion-ease-standard);
}

.fade-mask.left {
  left: 0;
  background: linear-gradient(to right, var(--vp-c-bg), transparent);
}

.fade-mask.right {
  right: 0;
  background: linear-gradient(to left, var(--vp-c-bg), transparent);
}

/* 文章卡片样式 */
.post-card {
  flex: 0 0 70%;
  width: 70%;
  padding: 1rem 1.2rem 1.2rem;
  margin: 0 0.5rem;
  box-sizing: border-box;
  scroll-snap-align: center; /* 确保卡片中心对齐 */
  border-bottom: none;
  position: relative;
  margin-bottom: 0.5rem;
}

/* 只保留虚线分隔 */
.post-card::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 1px;
  border-bottom: 1px dashed var(--vp-c-divider);
  opacity: 0.8;
}

/* 底部指示器 */
.carousel-indicators {
  height: 10px;
  display: flex;
  justify-content: center;
  gap: 8px;
}

.indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--vp-c-text-3);
  opacity: 0.5;
  cursor: pointer;
  border: none;
  padding: 0;
  transition: all var(--lc-motion-duration-normal) var(--lc-motion-ease-standard);
}

.indicator-dot.active {
  opacity: 1;
  background-color: var(--vp-c-brand);
  transform: scale(1.2);
}

/* 动画样式 */
.section-title,
.carousel-wrapper,
.carousel-indicators {
  opacity: 0;
  transform: translateY(20px);
}

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
  margin-bottom: 0.5rem;
  font-size: 1.8rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  border-bottom: 1px solid var(--vp-c-divider);
  padding-bottom: 0.5rem;
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
  text-decoration: underline;
  color: var(--vp-c-brand-1);
}

.post-item-title {
  font-size: 1.2rem;
  margin: 0;
  margin-bottom: 0.5rem;
  color: var(--vp-c-text-1);
  font-weight: 700;
  white-space: normal;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.5;
}

.post-excerpt {
  margin: 0.8rem 0;
  color: var(--vp-c-text-2);
  font-size: 0.95rem;
  line-height: 1.6;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  max-height: 4.8rem;
}

.post-meta {
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 0.5rem;
  opacity: 0.8;
}

.post-date,
.post-category {
  margin-right: 3px;
}

.post-separator {
  margin: 0 3px;
  opacity: 0.5;
}

.post-tags {
  display: flex;
  flex-wrap: wrap;
  margin-left: 4px;
}

.post-tag {
  margin-right: 8px;
  color: var(--vp-c-brand-2);
}

.loading,
.error,
.no-posts {
  text-align: center;
  padding: 1rem 0;
  color: var(--vp-c-text-2);
  font-style: italic;
}

.error {
  color: var(--vp-c-danger);
}

/* 移动端适配 */
@media (max-width: 959px) {
  .section-title {
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }
  
  .fade-mask {
    width: 60px;
  }

  .post-card {
    flex: 0 0 80%;
    width: 80%;
  }
  
  .padding-spacer {
    flex: 0 0 calc((100% - 80%) / 2);
    min-width: calc((100% - 80%) / 2);
  }
  
  .post-item-title {
    font-size: 1.1rem;
  }

  .post-excerpt {
    font-size: 0.9rem;
    margin: 0.6rem 0;
  }

  .post-meta {
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .section-title {
    font-size: 1.3rem;
    margin-bottom: 0.8rem;
    padding-bottom: 0.4rem;
  }

  .fade-mask {
    width: 40px;
  }

  .post-card {
    flex: 0 0 90%;
    width: 90%;
    padding: 0.8rem 0.7rem;
  }
  
  .padding-spacer {
    flex: 0 0 calc((100% - 90%) / 2);
    min-width: calc((100% - 90%) / 2);
  }

  .post-item-title {
    font-size: 1rem;
  }

  .post-excerpt {
    font-size: 0.85rem;
    margin: 0.5rem 0;
  }

  .post-meta {
    font-size: 0.8rem;
  }

  .post-tag {
    margin-right: 6px;
  }
}

/* 当只有一篇文章时，为轮播添加特殊样式 */
.single-card .carousel-container {
  justify-content: center;
}
</style>
