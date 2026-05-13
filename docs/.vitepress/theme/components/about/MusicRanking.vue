<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import SimpleMusicPlayer from '../common/SimpleMusicPlayer.vue'
import { fetchWeeklyTracks, type MusicTrack } from '../../utils/musicApi'

// 简化的状态
const isLoading = ref(true)
const hasError = ref(false)
const containerRef = ref<HTMLElement | null>(null)
const isAtTop = ref(true)
const isAtBottom = ref(false)

const musicRanking = ref<MusicTrack[]>([])

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
      withTimestamp: false,
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
  fetchMusicRanking()
})
</script>

<template>
  <div class="music-ranking-container">
    <h3 class="ranking-title">歌曲推荐</h3>
    
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-container">加载中...</div>
    
    <!-- 错误状态 -->
    <div v-else-if="hasError" class="error-container">加载失败</div>
    
    <!-- 空状态 -->
    <div v-else-if="musicRanking.length === 0" class="empty-container">暂无听歌记录</div>
    
    <!-- 内容区域 - 添加滚动和遮罩 -->
    <div v-else class="ranking-wrapper">
      <!-- 顶部渐变遮罩 -->
      <div class="fade-mask top" :style="{ opacity: isAtTop ? 0 : 1 }"></div>
      
      <!-- 滚动容器 -->
      <div 
        ref="containerRef" 
        class="ranking-scroll-container" 
        @scroll="updateScrollPosition"
      >
        <div v-for="music in musicRanking" :key="music.id" class="music-item">
          <SimpleMusicPlayer 
            :neteaseid="music.id" 
            :name="music.name"
            :artist="music.artist"
            :cover="music.cover"
          />
        </div>
      </div>
      
      <!-- 底部渐变遮罩 -->
      <div class="fade-mask bottom" :style="{ opacity: isAtBottom ? 0 : 1 }"></div>
    </div>
  </div>
</template>

<style scoped>
.music-ranking-container {
  margin: 1rem 0;
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

/* 渐变遮罩 */
.fade-mask {
  position: absolute;
  left: 0;
  right: 0;
  height: 35px;
  pointer-events: none; /* 允许点击穿透 */
  transition: opacity var(--lc-motion-duration-normal) var(--lc-motion-ease-standard);
  z-index: 10;
}

.fade-mask.top {
  top: 0;
  background: linear-gradient(to bottom, var(--vp-c-bg), transparent);
}

.fade-mask.bottom {
  bottom: 0;
  background: linear-gradient(to top, var(--vp-c-bg), transparent);
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
