<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted, watch } from 'vue'
import { addCorsProxy } from '../../utils/proxyConfig'
import audioManager from '../../utils/audioManager'
import audioService from '../../utils/audioService'
import { useIntersectionObserver } from '@vueuse/core'

// 组件状态
const containerRef = ref<HTMLElement | null>(null)
const isPlaying = ref(false)
const isLoading = ref(false)
const hasError = ref(false)
const showTitle = ref(false)
const favoritePlaylist = ref<any[]>([])
const currentSongInfo = ref({
  id: '',
  name: '',
  artist: '',
  cover: ''
})
const isVisible = ref(false)
const currentSongIndex = ref(-1)
const isHovering = ref(false)

// 计算属性：按钮显示的文本，随机听或当前歌曲标题
const buttonText = computed(() => {
  return showTitle.value ? currentSongInfo.value.name : '随机播放'
})

// 格式化滚动标题的样式
const titleStyle = computed(() => {
  if (!showTitle.value || currentSongInfo.value.name.length <= 14) {
    return {}
  }
  return {
    animation: `marquee ${currentSongInfo.value.name.length * 0.3}s linear infinite`,
    animationDelay: '1.5s',
    paddingRight: '20px' // 为了确保文字可以完全滚动
  }
})

// 封面旋转角度
const coverRotation = ref(0)
// 封面旋转动画ID
const rotationAnimationId = ref<number | null>(null)
// 上次暂停时的角度
const lastPausedRotation = ref(0)

// 开始封面旋转动画
function startRotation() {
  if (rotationAnimationId.value) return
  
  const startTime = performance.now()
  // 从上次暂停的角度开始旋转
  const startRotation = lastPausedRotation.value
  coverRotation.value = startRotation
  
  // 每秒旋转30度（缓慢旋转）
  const rotationSpeed = 30 / 1000
  
  const animate = (currentTime: number) => {
    const elapsedTime = currentTime - startTime
    coverRotation.value = startRotation + (elapsedTime * rotationSpeed)
    
    // 保持在0-360度范围内
    if (coverRotation.value >= 360) {
      coverRotation.value -= 360
    }
    
    rotationAnimationId.value = requestAnimationFrame(animate)
  }
  
  rotationAnimationId.value = requestAnimationFrame(animate)
}

// 停止封面旋转动画
function stopRotation() {
  if (rotationAnimationId.value) {
    cancelAnimationFrame(rotationAnimationId.value)
    rotationAnimationId.value = null
    // 保存当前角度
    lastPausedRotation.value = coverRotation.value
  }
}

// 重置封面旋转角度
function resetRotation() {
  // 如果正在旋转，先停止
  stopRotation()
  
  // 动画过渡到0度
  const startRotation = coverRotation.value
  const startTime = performance.now()
  const duration = 800 // 过渡时间，毫秒
  
  const animateReset = (currentTime: number) => {
    const elapsedTime = currentTime - startTime
    const progress = Math.min(elapsedTime / duration, 1)
    
    // 使用缓动函数使动画更自然
    const easeOutProgress = 1 - Math.pow(1 - progress, 3)
    coverRotation.value = startRotation * (1 - easeOutProgress)
    
    if (progress < 1) {
      requestAnimationFrame(animateReset)
    } else {
      coverRotation.value = 0
      lastPausedRotation.value = 0 // 重置暂停角度
    }
  }
  
  requestAnimationFrame(animateReset)
}

// 计算属性：封面旋转样式
const coverRotationStyle = computed(() => {
  return {
    transform: `rotate(${coverRotation.value}deg)`
  }
})

// 获取网易云音乐红心歌单数据
async function fetchFavoritePlaylist() {
  if (typeof window === 'undefined') return
  
  isLoading.value = true
  hasError.value = false
  
  try {
    // 使用用户提供的红心歌单ID
    const response = await fetch(addCorsProxy('https://163api.qijieya.cn/playlist/detail?id=973818739'))
    const data = await response.json()
    
    if (data.code !== 200 || !data.playlist || !data.playlist.tracks || data.playlist.tracks.length === 0) {
      throw new Error('获取歌单失败')
    }
    
    // 处理所有的歌曲数据
    const songs = data.playlist.tracks.map((item: any) => ({
      id: String(item.id),
      name: item.name,
      artist: item.ar.map((a: any) => a.name).join('/'),
      cover: item.al.picUrl.replace('http://', 'https://') + '?param=120y120'
    }))
    
    favoritePlaylist.value = songs
  } catch (error) {
    console.error('获取歌单失败:', error)
    hasError.value = true
  } finally {
    isLoading.value = false
  }
}

// 获取歌曲详细信息并播放（包括音频URL）
async function fetchSongDetailAndPlay(song: any) {
  if (typeof window === 'undefined' || !song.id) return
  
  isLoading.value = true
  
  try {
    // 获取音乐URL
    const musicResponse = await fetch(addCorsProxy(`https://163api.qijieya.cn/song/url?id=${song.id}`))
    const musicData = await musicResponse.json()
    
    if (musicData.code !== 200 || !musicData.data || !musicData.data[0]?.url) {
      throw new Error('获取音乐URL失败')
    }
    
    // 创建完整的歌曲信息对象
    const songInfo = {
      name: song.name,
      artist: song.artist,
      cover: song.cover,
      url: musicData.data[0].url
    }
    
    // 使用audioService播放音乐
    const audioId = `netease-${song.id}`
    currentSongInfo.value = { ...song, id: audioId }
    
    // 播放音频
    audioService.play(audioId, songInfo)
      .then(() => {
        isPlaying.value = true
        showTitle.value = true
        startRotation()
        
        // 发送歌曲信息到全局播放器
        audioManager.emit('song-info-update', JSON.stringify({
          id: audioId,
          name: song.name,
          artist: song.artist,
          cover: song.cover,
          isPlaying: true,
          progress: 0,
          duration: 0,
          currentTime: 0
        }))
      })
      .catch(error => {
        console.error('播放失败:', error)
        isPlaying.value = false
        showTitle.value = false
      })
  } catch (error) {
    console.error('获取歌曲详情失败:', error)
    isPlaying.value = false
    showTitle.value = false
  } finally {
    isLoading.value = false
  }
}

// 随机播放一首歌
function playRandomSong() {
  if (isLoading.value || favoritePlaylist.value.length === 0) return
  
  // 真正随机选择一首歌
  const randomIndex = Math.floor(Math.random() * favoritePlaylist.value.length)
  currentSongIndex.value = randomIndex
  const randomSong = favoritePlaylist.value[randomIndex]
  
  // 获取详细信息并播放
  fetchSongDetailAndPlay(randomSong)
}

// 播放下一首歌
function playNextSong() {
  if (isLoading.value || favoritePlaylist.value.length === 0) return
  
  // 随机选择下一首，而不是顺序播放
  const nextIndex = Math.floor(Math.random() * favoritePlaylist.value.length)
  currentSongIndex.value = nextIndex
  const nextSong = favoritePlaylist.value[nextIndex]
  
  // 获取详细信息并播放
  fetchSongDetailAndPlay(nextSong)
}

// 停止播放并恢复按钮状态
function stopPlayAndReset() {
  if (currentSongInfo.value.id) {
    audioService.pause()
    audioManager.pauseCurrent(currentSongInfo.value.id)
    audioManager.emit('play-state-change', `${currentSongInfo.value.id}:false`)
  }
  
  // 恢复按钮状态
  isPlaying.value = false
  showTitle.value = false
  stopRotation()
}

// 处理下一首按钮点击事件
function handleNextSong(e) {
  e.stopPropagation() // 防止事件冒泡到父元素
  
  // 如果当前正在播放，先停止
  if (isPlaying.value && currentSongInfo.value.id) {
    audioService.pause()
    audioManager.pauseCurrent(currentSongInfo.value.id)
  }
  
  // 播放下一首歌曲
  playNextSong()
}

// 点击按钮处理
function handleButtonClick() {
  if (showTitle.value && !isPlaying.value) {
    // 如果显示标题但不在播放状态（可能是全局播放器暂停了），直接播放新歌曲
    playRandomSong()
  } else if (!showTitle.value) {
    // 如果没有显示标题，播放随机歌曲
    playRandomSong()
  } else if (isPlaying.value) {
    // 如果正在播放，暂停
    audioService.pause()
    audioManager.pauseCurrent(currentSongInfo.value.id)
    isPlaying.value = false
    stopRotation()
  }
}

// 鼠标进入封面区域
function handleMouseEnter() {
  isHovering.value = true
}

// 鼠标离开封面区域
function handleMouseLeave() {
  isHovering.value = false
}

// 订阅全局播放器事件
const unsubscribers: Array<() => void> = []

// 监听全局播放器的歌曲结束事件
function setupEventListeners() {
  // 监听歌曲结束事件
  unsubscribers.push(
    audioManager.on('song-ended', (id) => {
      if (id && id === currentSongInfo.value.id) {
        // 歌曲结束后自动播放下一首
        setTimeout(() => {
          playNextSong()
        }, 1000) // 延迟1秒播放下一首
      }
    })
  )
  
  // 监听播放状态变化
  unsubscribers.push(
    audioManager.on('play-state-change', (data) => {
      if (!data) return
      
      try {
        const [id, isPlayingStr] = data.split(':')
        if (id === currentSongInfo.value.id) {
          const newPlayingState = isPlayingStr === 'true'
          // 同步按钮状态
          isPlaying.value = newPlayingState

          // 如果全局播放器停止了播放，更新旋转状态
          if (newPlayingState) {
            startRotation()
          } else {
            stopRotation()
          }
        }
      } catch (e) {
        console.error('解析播放状态信息失败', e)
      }
    })
  )
  
  // 监听关闭事件（全局播放器关闭时重置按钮状态）
  unsubscribers.push(
    audioManager.on('current-audio-changed', (id) => {
      if (id && isPlaying.value && currentSongInfo.value.id && id !== currentSongInfo.value.id) {
        // 如果切换到其他音频，更新按钮状态但保持标题
        isPlaying.value = false
        stopRotation()
      }
    })
  )

  // 添加对GlobalMusicPlayer关闭事件的监听
  unsubscribers.push(
    audioManager.on('player-closed', () => {
      // 全局播放器关闭时，重置按钮状态
      stopPlayAndReset()
    })
  )
}

// 组件挂载
onMounted(() => {
  if (typeof window === 'undefined') return
  
  // 获取红心歌单数据
  fetchFavoritePlaylist()
  
  // 设置事件监听
  setupEventListeners()

  // 设置动画可见性检测
  if (containerRef.value) {
    const { stop } = useIntersectionObserver(
      containerRef,
      ([{ isIntersecting }]) => {
        if (isIntersecting) {
          isVisible.value = true
          stop() // 只触发一次
        }
      },
      { threshold: 0.2, immediate: true }
    )
  }
})

// 组件卸载
onUnmounted(() => {
  // 清理事件监听
  unsubscribers.forEach(unsub => unsub())
  // 停止封面旋转
  stopRotation()
})
</script>

<template>
  <div class="home-music-player" ref="containerRef" :class="{ 'animate-in': isVisible }">
    <h3 class="section-title">随机歌曲</h3>
    <p class="section-description">歌曲随机来自于我的网易云红心歌单，感谢大佬提供的API接口！</p>
    <div class="music-content">
      <div class="player-container">
        <!-- 封面区域 -->
        <div class="cover-section" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave">
          <div class="cover-container" @click="handleButtonClick">
            <div class="rotating-cover" :style="coverRotationStyle">
              <img v-if="currentSongInfo.cover && showTitle" :src="currentSongInfo.cover" :alt="currentSongInfo.name" class="cover-image" />
              <div v-else class="cover-placeholder">
                <div class="music-note">♪</div>
              </div>
            </div>
            
            <!-- 播放按钮 - 在暂停或未播放时显示 -->
            <div v-if="!isPlaying" class="play-overlay">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            </div>
            
            <!-- 暂停按钮 - 在播放且鼠标悬停时显示 -->
            <div v-if="isPlaying && isHovering" class="pause-overlay">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="6" y1="4" x2="6" y2="20"></line>
                <line x1="18" y1="4" x2="18" y2="20"></line>
              </svg>
            </div>
          </div>
        </div>
        
        <!-- 信息区域 -->
        <div class="info-section">
          <div class="song-info" v-if="showTitle">
            <div class="song-title" :style="titleStyle">{{ currentSongInfo.name }}</div>
            <div class="song-artist">{{ currentSongInfo.artist }}</div>
          </div>
          <div class="button-text" v-else>
            {{ buttonText }}
          </div>
          
          <!-- 下一首按钮 -->
          <div class="next-button" @click.stop="handleNextSong">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="5 4 15 12 5 20 5 4"></polygon>
              <line x1="19" y1="5" x2="19" y2="19"></line>
            </svg>
          </div>
        </div>
      </div>
      
      <!-- 加载指示器 -->
      <div v-if="isLoading" class="loading-indicator">
        <div class="spinner"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-music-player {
  margin: 2rem 0;
  opacity: 0;
  transform: translateY(20px);
}

.animate-in {
  animation: fadeInUp 0.6s ease forwards;
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
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--vp-c-text-1);
}

.section-description {
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  margin-top: -0.5rem;
  margin-bottom: 1rem;
}

.music-content {
  margin-top: 0.5rem;
  position: relative;
}

.player-container {
  display: flex;
  align-items: center;
  background-color: var(--vp-c-bg-soft);
  border-radius: 12px;
  padding: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  max-width: 400px;
}

.player-container:hover {
  background-color: var(--vp-c-bg-mute);
}

/* 封面区域 */
.cover-section {
  width: 60px;
  height: 60px;
  position: relative;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-container {
  width: 48px;
  height: 48px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  position: relative;
  cursor: pointer;
  border-radius: 50%; /* 使封面成为圆形 */
}

/* 旋转封面容器 */
.rotating-cover {
  width: 100%;
  height: 100%;
  position: relative;
  /* 使用更平滑的过渡效果 */
  transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  will-change: transform; /* 提示浏览器优化变换 */
}

/* 播放遮罩层 */
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
  color: white;
}

/* 暂停遮罩层 */
.pause-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.cover-section:hover .pause-overlay {
  opacity: 1;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
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

/* 信息区域 */
.info-section {
  flex-grow: 1;
  padding: 0 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0; /* 允许内容收缩 */
  overflow: hidden;
}

.song-info {
  min-width: 0;
  overflow: hidden;
  flex: 1;
  padding-right: 5px; /* 为下一首按钮留出空间 */
}

.song-title {
  font-weight: 500;
  color: var(--vp-c-text-1);
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-artist {
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}

.button-text {
  font-size: 0.95rem;
  color: var(--vp-c-text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* "下一首"按钮样式 */
.next-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: var(--vp-c-text-2);
  cursor: pointer;
  flex-shrink: 0;
  opacity: 0.8;
  margin-left: 8px;
  transition: all 0.2s ease;
  background-color: var(--vp-c-bg-alt);
  border-radius: 50%;
}

.next-button:hover {
  color: var(--vp-c-brand);
  transform: scale(1.1);
  background-color: var(--vp-c-bg-mute);
}

/* 当按钮显示标题且文字过长时应用滚动效果 */
@keyframes marquee {
  0%, 15% {
    transform: translateX(0);
  }
  85%, 100% {
    transform: translateX(calc(-100% + 250px));
  }
}

/* 加载指示器 */
.loading-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 10px;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(var(--vp-c-brand-rgb), 0.3);
  border-top-color: var(--vp-c-brand);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .player-container {
    max-width: 100%;
    padding: 8px;
  }
  
  .cover-section {
    width: 50px;
    height: 50px;
  }
  
  .cover-container {
    width: 40px;
    height: 40px;
  }
  
  .song-title {
    font-size: 0.85rem;
  }
  
  .song-artist {
    font-size: 0.7rem;
  }
  
  .button-text {
    font-size: 0.85rem;
  }
}
</style> 