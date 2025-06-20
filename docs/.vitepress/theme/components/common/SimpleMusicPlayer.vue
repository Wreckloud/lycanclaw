<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useData } from 'vitepress'
import { useIntersectionObserver } from '@vueuse/core'

// 组件属性定义
interface Props {
  name?: string             // 歌曲名称
  artist?: string          // 艺术家
  cover?: string           // 封面图片URL
  url?: string              // 音频文件URL
  autoplay?: boolean       // 是否自动播放
  neteaseid?: string       // 网易云音乐ID
}

const props = withDefaults(defineProps<Props>(), {
  name: '',
  artist: '未知艺术家',
  cover: '',
  url: '',
  autoplay: false,
  neteaseid: ''
})

// 组件状态
const audio = ref<HTMLAudioElement | null>(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(70)
const progress = ref(0)
const isVisible = ref(false)  // 用于控制动画
const isLoading = ref(true)   // 加载状态
const hasError = ref(false)   // 错误状态
const isDragging = ref(false) // 是否正在拖动进度条
const isAudioReady = ref(false) // 音频是否已准备好
const debounceTimer = ref<number | null>(null) // 用于防抖操作
const useNetease = ref(false) // 是否使用网易云播放器
const isInitialRender = ref(true) // 是否是初始渲染
const playerRef = ref<HTMLElement | null>(null) // 播放器元素引用

// 歌曲信息状态
const songInfo = ref({
  name: props.name || '',
  artist: props.artist || '未知艺术家',
  cover: props.cover || '',
  url: props.url || ''
})

// 获取主题模式
const { isDark } = useData()

// 计算属性
const formattedCurrentTime = computed(() => formatTime(currentTime.value))
const formattedDuration = computed(() => formatTime(duration.value))

// 音频控制函数
function togglePlay() {
  if (!audio.value || hasError.value || !isAudioReady.value) return
  
  // 防止连续快速点击导致的播放/暂停冲突
  if (debounceTimer.value) {
    clearTimeout(debounceTimer.value)
  }
  
  debounceTimer.value = window.setTimeout(() => {
    try {
      if (isPlaying.value) {
        audio.value?.pause()
      } else {
        const playPromise = audio.value?.play()
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error('播放出错:', error)
            isPlaying.value = false
            
            // 如果是由于用户交互策略导致的错误，尝试静音播放
            if (error.name === 'NotAllowedError') {
              audio.value!.muted = true
              audio.value?.play().catch(() => {
                hasError.value = true
              })
            }
          })
        }
      }
      
      isPlaying.value = !isPlaying.value
    } catch (error) {
      console.error('播放器操作错误:', error)
      isPlaying.value = false
    }
    
    debounceTimer.value = null
  }, 100)
}

// 进度条拖动相关函数
function startDrag(e: MouseEvent | TouchEvent) {
  if (!audio.value || !isAudioReady.value) return
  
  isDragging.value = true
  
  // 处理触摸事件或鼠标事件
  if (e.type === 'touchstart') {
    updateProgressFromTouch(e as TouchEvent)
  } else {
    updateProgressFromEvent(e as MouseEvent)
  }
  
  // 添加全局事件监听
  if (e.type === 'touchstart') {
    document.addEventListener('touchmove', updateProgressFromTouch, { passive: false })
    document.addEventListener('touchend', stopDrag)
  } else {
    document.addEventListener('mousemove', updateProgressFromEvent)
    document.addEventListener('mouseup', stopDrag)
  }
}

function updateProgressFromEvent(e: MouseEvent) {
  if (!isDragging.value || !audio.value) return
  
  const progressBar = document.querySelector('.progress-bar') as HTMLElement
  if (!progressBar) return
  
  const rect = progressBar.getBoundingClientRect()
  let percent = (e.clientX - rect.left) / rect.width
  
  // 限制百分比在0-1之间
  percent = Math.max(0, Math.min(1, percent))
  
  progress.value = percent * 100
  currentTime.value = percent * duration.value
}

function updateProgressFromTouch(e: TouchEvent) {
  if (!isDragging.value || !audio.value) return
  
  // 阻止触摸事件的默认行为（如滚动）
  e.preventDefault()
  
  const progressBar = document.querySelector('.progress-bar') as HTMLElement
  if (!progressBar) return
  
  const touch = e.touches[0] || e.changedTouches[0]
  const rect = progressBar.getBoundingClientRect()
  let percent = (touch.clientX - rect.left) / rect.width
  
  // 限制百分比在0-1之间
  percent = Math.max(0, Math.min(1, percent))
  
  progress.value = percent * 100
  currentTime.value = percent * duration.value
}

function stopDrag(e?: MouseEvent | TouchEvent) {
  if (!isDragging.value || !audio.value) return
  
  isDragging.value = false
  audio.value.currentTime = currentTime.value
  
  // 移除全局事件监听
  document.removeEventListener('mousemove', updateProgressFromEvent)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', updateProgressFromTouch)
  document.removeEventListener('touchend', stopDrag)
}

function setProgress(e: MouseEvent) {
  if (!audio.value || !isAudioReady.value || isDragging.value) return
  
  const progressBar = e.currentTarget as HTMLElement
  const rect = progressBar.getBoundingClientRect()
  const percent = (e.clientX - rect.left) / rect.width
  
  progress.value = percent * 100
  audio.value.currentTime = percent * duration.value
}

function setVolume(e: Event) {
  if (!audio.value) return
  
  const input = e.target as HTMLInputElement
  volume.value = Number(input.value)
  audio.value.volume = volume.value / 100
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds)) return '0:00'
  
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}

// 重试加载音频
function retryLoadAudio() {
  if (!audio.value) return
  
  hasError.value = false
  isLoading.value = true
  
  // 重置音频元素
  audio.value.load()
}

// 从网易云API获取音乐信息
async function fetchNeteaseMusicInfo(id: string) {
  if (!id) return false
  
  try {
    isLoading.value = true
    
    // 获取歌曲详情
    const detailResponse = await fetch(`https://163api.qijieya.cn/song/detail?ids=${id}`)
    const detailData = await detailResponse.json()
    
    if (detailData.code !== 200 || !detailData.songs || detailData.songs.length === 0) {
      console.error('获取网易云音乐详情失败', detailData)
      hasError.value = true
      isLoading.value = false
      return false
    }
    
    const song = detailData.songs[0]
    
    // 获取歌曲URL
    const urlResponse = await fetch(`https://163api.qijieya.cn/song/url?id=${id}`)
    const urlData = await urlResponse.json()
    
    if (urlData.code !== 200 || !urlData.data || urlData.data.length === 0 || !urlData.data[0].url) {
      console.error('获取网易云音乐URL失败', urlData)
      hasError.value = true
      isLoading.value = false
      return false
    }
    
    // 更新歌曲信息
    songInfo.value = {
      name: song.name,
      artist: song.ar.map((a: any) => a.name).join('/'),
      cover: song.al.picUrl,
      url: urlData.data[0].url
    }
    
    isLoading.value = false
    return true
  } catch (error) {
    console.error('获取网易云音乐信息失败:', error)
    hasError.value = true
    isLoading.value = false
    return false
  }
}

// 监听URL变化重新加载音频
watch(() => songInfo.value.url, (newUrl) => {
  if (!audio.value || !newUrl) return
  
  isPlaying.value = false
  currentTime.value = 0
  progress.value = 0
  isLoading.value = true
  hasError.value = false
  isAudioReady.value = false
  
  // 重新加载音频
  audio.value.load()
})

// 生命周期钩子
onMounted(async () => {
  // 设置动画可见性检测
  if (typeof window !== 'undefined' && playerRef.value) {
    const { stop } = useIntersectionObserver(
      playerRef,
      ([{ isIntersecting }]) => {
        if (isIntersecting) {
          isVisible.value = true
          stop() // 只触发一次
        }
      },
      { threshold: 0.2 }
    )
  }

  // 初始渲染完成后移除初始渲染标志
  setTimeout(() => {
    isInitialRender.value = false
  }, 50)

  // 检查是否使用网易云ID
  if (props.neteaseid) {
    // 尝试加载网易云音乐信息
    const success = await fetchNeteaseMusicInfo(props.neteaseid)
    if (!success && !props.url) {
      // 如果网易云加载失败且没有提供直接URL，则尝试使用iframe
      useNetease.value = true
    }
  } else if (props.url) {
    // 使用直接提供的URL和信息
    songInfo.value = {
      name: props.name || '',
      artist: props.artist || '未知艺术家',
      cover: props.cover || '',
      url: props.url
    }
  } else {
    // 没有提供任何音乐源
    hasError.value = true
    isLoading.value = false
  }
  
  // 以下是原有的音频事件监听逻辑
  if (!audio.value) return
  
  // 设置初始音量
  audio.value.volume = volume.value / 100
  
  // 监听音频事件
  audio.value.addEventListener('timeupdate', () => {
    if (!audio.value || isDragging.value) return
    currentTime.value = audio.value.currentTime
    progress.value = (currentTime.value / duration.value) * 100 || 0
  })
  
  audio.value.addEventListener('loadedmetadata', () => {
    if (!audio.value) return
    duration.value = audio.value.duration
    isLoading.value = false
    isAudioReady.value = true
    
    // 如果设置了自动播放，尝试播放
    if (props.autoplay) {
      togglePlay()
    }
  })
  
  audio.value.addEventListener('ended', () => {
    isPlaying.value = false
    currentTime.value = 0
    progress.value = 0
  })
  
  audio.value.addEventListener('error', (e) => {
    console.error('音频加载错误:', e)
    isLoading.value = false
    hasError.value = true
    isAudioReady.value = false
  })
  
  audio.value.addEventListener('waiting', () => {
    isLoading.value = true
  })
  
  audio.value.addEventListener('canplay', () => {
    isLoading.value = false
  })
})
</script>

<template>
  <div class="music-player" ref="playerRef" :class="{ 'dark-mode': isDark, 'animate-in': isVisible, 'initial-render': isInitialRender }">
    <!-- 网易云iframe播放器 -->
    <iframe v-if="useNetease" 
      class="netease-player animate-in"
      frameborder="no" 
      border="0" 
      marginwidth="0" 
      marginheight="0" 
      width="100%" 
      height="80" 
      :src="`//music.163.com/outchain/player?type=2&id=${neteaseid}&auto=${autoplay ? 1 : 0}&height=66`">
    </iframe>
    
    <!-- 自定义播放器 -->
    <div v-else class="player-container">
      <!-- 封面 -->
      <div class="cover-container" :class="{ 'animate-in': isVisible }" style="--anim-delay: 0.1s">
        <!-- 骨架屏 -->
        <div v-if="isLoading && !songInfo.cover" class="skeleton-cover">
          <div class="skeleton-pulse"></div>
        </div>
        
        <!-- 封面图片 -->
        <img v-else-if="songInfo.cover" :src="songInfo.cover" :alt="songInfo.name" class="cover-image">
        <div v-else class="default-cover">
          <div class="music-note">♪</div>
        </div>
        
        <!-- 加载状态 -->
        <div v-if="isLoading && !hasError" class="loading-overlay">
          <div class="loading-spinner"></div>
        </div>
        
        <!-- 错误状态 -->
        <div v-if="hasError" 
          class="error-overlay" 
          @click="retryLoadAudio"
          @touchend.prevent="retryLoadAudio">
          <div class="error-icon">!</div>
          <div class="error-text">点击重试</div>
        </div>
        
        <!-- 播放控制遮罩 -->
        <div v-if="!isPlaying && !isLoading && !hasError && isAudioReady" 
          class="play-overlay" 
          @click="togglePlay"
          @touchend.prevent="togglePlay">
          <div class="play-button">
            <span>▶</span>
          </div>
        </div>
        
        <!-- 暂停按钮 -->
        <div v-if="isPlaying && !isLoading && !hasError" 
          class="pause-button" 
          @click="togglePlay"
          @touchend.prevent="togglePlay">
          <span>❚❚</span>
        </div>
      </div>
      
      <!-- 播放器控制区 -->
      <div class="controls-container" :class="{ 'animate-in': isVisible }" style="--anim-delay: 0.2s">
        <div class="player-top">
          <!-- 歌曲信息 -->
          <div class="song-info">
            <div class="title-container">
              <!-- 歌曲标题骨架屏 -->
              <div v-if="isLoading && !songInfo.name" class="skeleton-title"></div>
              <h3 v-else class="song-title">{{ songInfo.name }}</h3>
              
              <!-- 艺术家骨架屏 -->
              <div v-if="isLoading && !songInfo.artist" class="skeleton-artist"></div>
              <span v-else class="song-artist">- {{ songInfo.artist }}</span>
            </div>
          </div>
          
          <!-- 时间信息 -->
          <div class="time-info">
            <!-- 时间骨架屏 -->
            <div v-if="isLoading" class="skeleton-time"></div>
            <template v-else>
              <span class="current-time">{{ formattedCurrentTime }}</span>
              <span class="duration">/ {{ formattedDuration }}</span>
            </template>
          </div>
        </div>
        
        <!-- 进度条 -->
        <div 
          class="progress-container" 
          @click="setProgress" 
          @mousedown="startDrag"
          @touchstart="startDrag"
          :class="{ 'dragging': isDragging }"
        >
          <!-- 进度条骨架屏 -->
          <div v-if="isLoading" class="skeleton-progress">
            <div class="skeleton-pulse"></div>
          </div>
          <div v-else class="progress-bar">
            <div class="progress-current" :style="{ width: `${progress}%` }"></div>
          </div>
        </div>
      </div>
      
      <!-- 音频元素 -->
      <audio 
        ref="audio" 
        :src="songInfo.url" 
        preload="metadata"
        crossorigin="anonymous"
      ></audio>
    </div>
  </div>
</template>

<style scoped>
.music-player {
  margin: 16px 0;
  width: 100%;
  overflow: hidden;
  background-color: var(--vp-c-bg-soft);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  opacity: 0;
  transform: translateY(20px);
  border-radius: 3px;
  will-change: opacity, transform;
}

/* 避免初始闪烁 */
.initial-render {
  opacity: 0 !important;
  transform: translateY(20px) !important;
}

/* 网易云播放器样式 */
.netease-player {
  display: block;
  width: 100%;
  height: 80px;
  border: none;
}

/* 添加动画效果 */
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

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.animate-in {
  animation: fadeInUp 0.5s ease forwards;
  animation-delay: var(--anim-delay, 0s);
}

.player-container {
  display: flex;
  width: 100%;
  align-items: stretch;
  height: 80px;
}

/* 封面样式 */
.cover-container {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  overflow: hidden;
  position: relative;
  user-select: none;
  pointer-events: none;
}

/* 让播放控制元素可点击 */
.play-overlay, .pause-button, .error-overlay {
  pointer-events: auto;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.default-cover {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--vp-c-brand) 0%, var(--vp-c-brand-dark) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.music-note {
  font-size: 24px;
  color: white;
}

/* 骨架屏样式 */
.skeleton-cover {
  width: 100%;
  height: 100%;
  background-color: var(--vp-c-bg-mute);
  position: relative;
  overflow: hidden;
}

.skeleton-pulse {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    var(--vp-c-bg-mute) 25%, 
    var(--vp-c-bg-soft) 50%, 
    var(--vp-c-bg-mute) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-title {
  width: 120px;
  height: 16px;
  background: linear-gradient(90deg, 
    var(--vp-c-bg-mute) 25%, 
    var(--vp-c-bg-soft) 50%, 
    var(--vp-c-bg-mute) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 2px;
}

.skeleton-artist {
  width: 80px;
  height: 12px;
  margin-left: 8px;
  background: linear-gradient(90deg, 
    var(--vp-c-bg-mute) 25%, 
    var(--vp-c-bg-soft) 50%, 
    var(--vp-c-bg-mute) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 2px;
}

.skeleton-time {
  width: 50px;
  height: 12px;
  background: linear-gradient(90deg, 
    var(--vp-c-bg-mute) 25%, 
    var(--vp-c-bg-soft) 50%, 
    var(--vp-c-bg-mute) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 2px;
}

.skeleton-progress {
  height: 4px;
  width: 100%;
  background-color: var(--vp-c-divider);
  border-radius: 2px;
  overflow: hidden;
  position: relative;
}

/* 加载状态 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  backdrop-filter: blur(1px);
}

.loading-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* 错误状态 */
.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(220, 38, 38, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  animation: fadeIn 0.3s ease;
  touch-action: manipulation; /* 优化触摸行为 */
  -webkit-tap-highlight-color: transparent; /* 移除iOS触摸高亮 */
}

.error-icon {
  font-size: 24px;
  color: white;
  font-weight: bold;
  margin-bottom: 5px;
}

.error-text {
  font-size: 12px;
  color: white;
}

/* 播放控制样式 */
.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  animation: fadeIn 0.2s ease;
  touch-action: manipulation; /* 优化触摸行为 */
  -webkit-tap-highlight-color: transparent; /* 移除iOS触摸高亮 */
  backdrop-filter: blur(1px);
}

.play-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;
}

.play-button span {
  margin-left: 3px; /* 微调播放图标位置 */
}

.pause-button {
  position: absolute;
  bottom: 5px;
  right: 5px;
  width: 24px; /* 略微增大尺寸 */
  height: 24px; /* 略微增大尺寸 */
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 9px; /* 略微增大字体 */
  cursor: pointer;
  animation: fadeIn 0.2s ease;
  touch-action: manipulation; /* 优化触摸行为 */
  -webkit-tap-highlight-color: transparent; /* 移除iOS触摸高亮 */
  z-index: 2; /* 确保叠放顺序正确 */
}

/* 控制区样式 */
.controls-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: white;
}

.player-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.song-info {
  display: flex;
  align-items: center;
}

.title-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.song-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-artist {
  margin: 0;
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
  opacity: 0.8;
  white-space: nowrap;
}

/* 进度条样式 */
.progress-container {
  width: 100%;
  cursor: pointer;
  margin-top: 8px;
  padding: 8px 0;
  position: relative;
  touch-action: none;
}

.progress-container.dragging {
  cursor: grabbing;
}

.progress-bar {
  height: 4px;
  background-color: var(--vp-c-divider);
  border-radius: 2px;
  position: relative;
  overflow: visible;
  touch-action: none;
}

.progress-current {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background-color: var(--vp-c-brand);
  border-radius: 2px;
  transition: width 0.1s linear;
}

/* 拖动时禁用过渡效果 */
.dragging .progress-current {
  transition: none;
}

/* 圆形滑块 */
.progress-current::after {
  content: '';
  position: absolute;
  right: -5px;
  top: 50%;
  transform: translateY(-50%);
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: var(--vp-c-brand);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.progress-container:hover .progress-current::after,
.dragging .progress-current::after {
  opacity: 1;
}

.time-info {
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
  opacity: 0.8;
  display: flex;
  align-items: center;
  gap: 2px;
}

.current-time {
  color: var(--vp-c-brand);
}

/* 响应式布局 */
@media (max-width: 480px) {
  .song-artist {
    font-size: 0.75rem;
  }
  
  .controls-container {
    padding: 8px 12px;
  }
}

/* 暗色模式适配 */
.dark-mode .controls-container {
  background-color: var(--vp-c-bg-soft);
}

.dark-mode .progress-bar {
  background-color: rgba(255, 255, 255, 0.1);
}
</style> 