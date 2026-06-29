<script setup lang="ts">
/**
 * 关于页听歌排行。
 * 展示配置账号最近一周的前五首歌曲。
 */

import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'
import SimpleMusicPlayer from './SimpleMusicPlayer.vue'
import { fetchWeeklyTracks, type MusicTrack } from '../../utils/music'

// 简化的状态
const isLoading = ref(true)
const hasError = ref(false)
const sectionRef = ref<HTMLElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)
const animationTriggerRef = ref<HTMLElement | null>(null)
const isVisible = ref(false)
const isAtTop = ref(true)
const isAtBottom = ref(false)

const musicRanking = ref<MusicTrack[]>([])
let stopObserver: (() => void) | null = null

// 更新滚动位置和状态
function updateScrollPosition() {
  if (!containerRef.value) return
  
  const container = containerRef.value
  isAtTop.value = container.scrollTop <= 0
  isAtBottom.value = container.scrollTop + container.clientHeight >= container.scrollHeight
}

// 获取网易云音乐排行榜数据
async function fetchMusicRanking() {
  if (typeof window === 'undefined') return
  
  isLoading.value = true
  hasError.value = false
  
  try {
    musicRanking.value = await fetchWeeklyTracks({
      limit: 5,
      coverSize: '120y120'
    })
  } catch (error) {
    hasError.value = true
  } finally {
    isLoading.value = false
    
    // 在数据加载完成后初始化滚动状态
    nextTick(() => {
      updateScrollPosition()
    })
  }
}

// 组件挂载
onMounted(() => {
  if (typeof window === 'undefined') return
  const observer = useIntersectionObserver(
    animationTriggerRef,
    ([entry]) => {
      if (!entry?.isIntersecting) return
      isVisible.value = true
      observer.stop()
    },
    {
      threshold: 0.5,
      rootMargin: '0px 0px -5% 0px'
    }
  )
  stopObserver = observer.stop
  fetchMusicRanking()
})

onBeforeUnmount(() => {
  stopObserver?.()
  stopObserver = null
})
</script>

<template>
  <div ref="sectionRef" class="music-ranking-container">
    <div ref="animationTriggerRef" class="animation-trigger"></div>
    <h3 class="ranking-title" :class="{ 'animate-in': isVisible }">歌曲推荐</h3>
    
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-container">加载中…</div>
    
    <!-- 错误状态 -->
    <div v-else-if="hasError" class="error-container">加载失败</div>
    
    <!-- 空状态 -->
    <div v-else-if="musicRanking.length === 0" class="empty-container">暂无听歌记录</div>
    
    <!-- 内容区域 - 添加滚动和遮罩 -->
    <div v-else class="ranking-wrapper" :class="{ 'animate-in': isVisible }">
      <!-- 顶部渐变遮罩 -->
      <div class="lc-fade-mask lc-fade-mask--top" :style="{ opacity: isAtTop ? 0 : 1 }"></div>
      
      <!-- 滚动容器 -->
      <div 
        ref="containerRef" 
        class="ranking-scroll-container" 
        @scroll="updateScrollPosition"
      >
        <div
          v-for="(music, index) in musicRanking"
          :key="music.id"
          class="music-item"
          :class="{ 'animate-item': isVisible }"
          :style="{ '--item-delay': `${index * 0.08 + 0.3}s` }"
        >
          <SimpleMusicPlayer 
            :neteaseid="music.id" 
            :name="music.name"
            :artist="music.artist"
            :cover="music.cover"
            playback-source="about-ranking"
            :playback-priority="2"
          />
        </div>
      </div>
      
      <!-- 底部渐变遮罩 -->
      <div class="lc-fade-mask lc-fade-mask--bottom" :style="{ opacity: isAtBottom ? 0 : 1 }"></div>
    </div>
  </div>
</template>

<style scoped>
.music-ranking-container {
  margin: 1rem 0;
  position: relative;
}

.animation-trigger {
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
}

.ranking-title,
.ranking-wrapper {
  opacity: 0;
  transform: translateY(20px);
}

.music-item {
  opacity: 0;
  transform: translateY(15px);
}

.animate-in {
  animation: ranking-fade-in var(--lc-motion-duration-slower) var(--lc-motion-ease-standard) forwards;
}

.animate-item {
  animation: ranking-fade-in var(--lc-motion-duration-slow) var(--lc-motion-ease-standard) forwards;
  animation-delay: var(--item-delay);
}

@keyframes ranking-fade-in {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.ranking-title {
  font-size: 1.4rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--vp-c-divider);
  margin-bottom: 16px;
}

/* 排行榜内容区域 */
.ranking-wrapper {
  position: relative;
  height: 310px; /* 设置为能显示约3.5首歌曲的高度 */
  overflow: hidden;
}

.ranking-scroll-container {
  height: 100%;
  overflow-y: auto;
  padding: 5px 0;
  /* 隐藏滚动条但保持滚动功能 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}

/* 隐藏WebKit浏览器的滚动条 */
.ranking-scroll-container::-webkit-scrollbar {
  display: none;
}

.lc-fade-mask {
  --lc-fade-mask-height: 35px;
}

.music-item {
  margin-bottom: 12px;
  border-radius: 6px;
  overflow: hidden;
}

.music-item:last-child {
  margin-bottom: 0;
}

/* 加载、错误和空状态容器 */
.loading-container,
.error-container,
.empty-container {
  height: 310px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--vp-c-text-2);
  background-color: var(--vp-c-bg-soft);
  border-radius: 6px;
}
</style> 
