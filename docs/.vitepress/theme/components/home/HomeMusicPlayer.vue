<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue'
import audioManager from '../../utils/audioManager'
import audioService from '../../utils/audioService'
import { useIntersectionObserver } from '@vueuse/core'
import {
  fetchTrackUrlById,
  fetchWeeklyTracks,
  type MusicTrack
} from '../../utils/musicApi'

// 默认封面图片路径
const defaultCoverUrl = '/images/首页/default-cover.png'

// 组件状态
const containerRef = ref<HTMLElement | null>(null)
const isPlaying = ref(false)
const isLoading = ref(false)
const showTitle = ref(false)
const favoritePlaylist = ref<MusicTrack[]>([])
const currentSongInfo = ref({
  id: '',
  name: '',
  artist: '',
  cover: ''
})
const isVisible = ref(false)
const currentSongIndex = ref(-1)
const currentTime = ref(0)
const duration = ref(0)
const progress = ref(0)
const isDragging = ref(false)  // 新增：是否正在拖动进度条
const isButtonDisabled = ref(false) // 添加按钮禁用状态
const preloadedSongs = ref<Array<MusicTrack & { url: string }>>([]) // 预加载歌曲队列
const isFetchingNext = ref(false) // 是否正在获取下一首歌曲

// 计算属性：按钮显示的文本，随机听或当前歌曲标题
const buttonText = computed(() => {
  return showTitle.value ? currentSongInfo.value.name : '来听歌吧！'
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

// 格式化时间显示
function formatTime(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds)) return '0:00'
  
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}

const formattedCurrentTime = computed(() => formatTime(currentTime.value))
const formattedDuration = computed(() => formatTime(duration.value))

// 同步当前播放状态
function syncWithCurrentPlayback() {
  const currentPlayingId = audioManager.getCurrentPlayingId()
  const savedSongInfo = audioManager.getCurrentSongInfo()
  
  if (currentPlayingId && savedSongInfo) {
    // 提取网易云ID
    const match = currentPlayingId.match(/netease-(\d+)/)
    if (match && match[1]) {
      const neteaseId = match[1]
      
      // 查找我们的歌单中是否有这首歌
      const songIndex = favoritePlaylist.value.findIndex(song => String(song.id) === neteaseId)
      
      if (songIndex !== -1) {
        // 找到了歌曲，更新状态
        currentSongIndex.value = songIndex
        
        // 两步处理来确保动画正常：先重置状态
        showTitle.value = false
        
        // 短暂延迟后设置新状态，让DOM有时间更新
        setTimeout(() => {
          // 1. 设置歌曲信息
          currentSongInfo.value = {
            id: currentPlayingId,
            name: savedSongInfo.name,
            artist: savedSongInfo.artist,
            cover: savedSongInfo.cover
          }
          
          // 2. 设置播放状态和进度
          currentTime.value = savedSongInfo.currentTime
          duration.value = savedSongInfo.duration
          progress.value = savedSongInfo.progress
          
          // 3. 显示标题和播放状态，触发动画
          showTitle.value = true
          
          // 4. 再次短暂延迟后更新播放状态，以确保UI完全更新
          setTimeout(() => {
            isPlaying.value = savedSongInfo.isPlaying
          }, 50)
          
        }, 50)
      }
    }
  }
}

// 获取网易云音乐排行榜数据
async function fetchMusicRanking() {
  if (typeof window === 'undefined') return
  
  isLoading.value = true
  
  try {
    const songs = await fetchWeeklyTracks({ withTimestamp: true, coverSize: '120y120' })
    const shuffledSongs = shuffleArray([...songs])
    favoritePlaylist.value = shuffledSongs
    
    // 获取歌单后再次尝试同步播放状态
    syncWithCurrentPlayback()
  } catch (error) {
    if (favoritePlaylist.value.length === 0) {
      favoritePlaylist.value = [{
        id: '1824020871',
        name: '音乐服务暂不可用',
        artist: '未知艺术家',
        cover: defaultCoverUrl
      }]
    }
  } finally {
    isLoading.value = false
  }
}

// Fisher-Yates 洗牌算法，用于打乱数组顺序
function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function schedule(task: () => void, delay = 100) {
  setTimeout(task, delay)
}

function normalizeCoverUrl(coverUrl: string): string {
  if (!coverUrl) return coverUrl
  let normalized = coverUrl
  if (normalized.startsWith('http:')) {
    normalized = normalized.replace('http:', 'https:')
  }
  if (normalized.includes('music.126.net') && !normalized.includes('param=')) {
    normalized += '?param=80y80'
  }
  return normalized
}

function pickQueuedOrRandomSong() {
  if (preloadedSongs.value.length > 0) {
    const song = preloadedSongs.value[0]
    currentSongIndex.value = favoritePlaylist.value.findIndex((item) => item.id === song.id)
    return song
  }

  if (favoritePlaylist.value.length === 0) {
    return null
  }

  const randomIndex = Math.floor(Math.random() * favoritePlaylist.value.length)
  currentSongIndex.value = randomIndex
  return favoritePlaylist.value[randomIndex]
}

// 预加载下一首歌曲
async function preloadNextSong() {
  // 如果正在获取歌曲或歌单为空，则返回
  if (isFetchingNext.value || favoritePlaylist.value.length === 0) return
  
  // 如果预加载队列已有两首歌曲，不再重复加载
  if (preloadedSongs.value.length >= 2) return
  
  isFetchingNext.value = true
  
  try {
    // 随机选择歌曲，避免选择当前播放的歌曲和已预加载的歌曲
    let nextSong: MusicTrack | null = null
    const existingIds = new Set([
      ...preloadedSongs.value.map(s => s.id),
      currentSongInfo.value.id?.replace('netease-', '')
    ].filter(Boolean));
    
    let attempts = 0;
    const maxAttempts = Math.min(10, favoritePlaylist.value.length);
    
    do {
      const randomIndex = Math.floor(Math.random() * favoritePlaylist.value.length);
      nextSong = favoritePlaylist.value[randomIndex];
      attempts++;
    } while (existingIds.has(nextSong.id) && attempts < maxAttempts);

    if (!nextSong) return
    
    const musicUrl = await fetchTrackUrlById(nextSong.id)
    if (!musicUrl) {
      // 如果获取失败，尝试另一首歌
      isFetchingNext.value = false
      schedule(() => preloadNextSong(), 500)
      return
    }
    
    // 添加到预加载队列
    preloadedSongs.value.push({
      ...nextSong,
      url: musicUrl,
      cover: normalizeCoverUrl(nextSong.cover)
    })
    
    // 如果预加载队列中的歌曲数量仍然少于2首，继续预加载
    if (preloadedSongs.value.length < 2) {
      schedule(() => preloadNextSong(), 300)
    }
  } catch (error) {
    console.error('预加载歌曲失败:', error)
  } finally {
    isFetchingNext.value = false
  }
}

// 获取歌曲详细信息并播放（包括音频URL）
async function fetchSongDetailAndPlay(song: MusicTrack | (MusicTrack & { url?: string })) {
  if (typeof window === 'undefined' || !song.id) return
  
  isLoading.value = true
  
  try {
    // 检查是否有预加载的URL
    let musicUrl = ''
    let coverUrl = song.cover
    
    // 如果是从预加载队列中获取的歌曲，直接使用
    const preloadedSong = preloadedSongs.value.find(s => s.id === song.id)
    if (preloadedSong) {
      musicUrl = preloadedSong.url
      coverUrl = preloadedSong.cover
      
      // 使用后从预加载队列中移除
      preloadedSongs.value = preloadedSongs.value.filter(s => s.id !== song.id)
      
      // 立即开始预加载下一首
      schedule(() => preloadNextSong(), 100)
    } else {
      const resolvedUrl = await fetchTrackUrlById(song.id)
      if (!resolvedUrl) {
        // 如果URL为空，可能是因为版权限制
        playNextSong()
        return
      }
      musicUrl = resolvedUrl
      coverUrl = normalizeCoverUrl(coverUrl)
      
      // 开始预加载下一首
      schedule(() => preloadNextSong(), 100)
    }
    
    // 创建完整的歌曲信息对象
    const songInfo = {
      name: song.name,
      artist: song.artist,
      cover: coverUrl,
      url: musicUrl
    }
    
    // 使用audioService播放音乐
    const audioId = `netease-${song.id}`
    currentSongInfo.value = { ...song, id: audioId, cover: coverUrl }
    
    // 播放音频
    audioService.play(audioId, songInfo)
      .then(() => {
        isPlaying.value = true
        showTitle.value = true
        
        // 发送歌曲信息到全局播放器
        audioManager.emit('song-info-update', JSON.stringify({
          id: audioId,
          name: song.name,
          artist: song.artist,
          cover: coverUrl,
          isPlaying: true,
          progress: 0,
          duration: 0,
          currentTime: 0
        }))
      })
      .catch(() => {
        // 恢复播放失败，移除调试信息
        isPlaying.value = false
        showTitle.value = false
        
        // 自动尝试播放下一首
        schedule(() => playNextSong(), 1000)
      })
  } catch (error) {
    // 移除调试信息，保留错误处理逻辑
    isPlaying.value = false
    showTitle.value = false
    
    // 自动尝试播放下一首
    schedule(() => playNextSong(), 1000)
  } finally {
    isLoading.value = false
  }
}

// 随机播放一首歌
function playRandomSong() {
  if (isLoading.value) return
  
  if (favoritePlaylist.value.length === 0) {
    // 尝试重新获取歌单
    fetchMusicRanking()
    return
  }
  
  const song = pickQueuedOrRandomSong()
  if (!song) return
  fetchSongDetailAndPlay(song)
}

// 播放下一首歌
function playNextSong() {
  if (isLoading.value || favoritePlaylist.value.length === 0) return
  
  const song = pickQueuedOrRandomSong()
  if (!song) return
  fetchSongDetailAndPlay(song)
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
}

// 处理下一首按钮点击事件
function handleNextSong(e) {
  e.stopPropagation() // 防止事件冒泡到父元素
  
  // 如果按钮已禁用，不执行操作
  if (isButtonDisabled.value || isLoading.value) return
  
  // 禁用按钮1秒
  isButtonDisabled.value = true
  schedule(() => {
    isButtonDisabled.value = false
  }, 1000)
  
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
  if (isLoading.value) return
  
  if (!showTitle.value) {
    // 如果没有显示标题（第一次播放），播放随机歌曲
    playRandomSong()
  } else {
    // 如果已经有歌曲，只切换播放状态，不切换歌曲
    if (isPlaying.value) {
      // 如果正在播放，暂停
      audioService.pause()
      audioManager.pauseCurrent(currentSongInfo.value.id)
      isPlaying.value = false
    } else {
      // 如果已暂停，继续播放当前歌曲
      audioService.play(currentSongInfo.value.id, {
        name: currentSongInfo.value.name,
        artist: currentSongInfo.value.artist,
        cover: currentSongInfo.value.cover,
        url: ''  // 服务会使用现有的音频对象
      }, currentTime.value)
      .then(() => {
        isPlaying.value = true
      })
      .catch(() => {
        // 恢复播放失败，移除调试信息
        isPlaying.value = false
      })
    }
    
    // 发送播放状态更新
    audioManager.emit('play-state-change', `${currentSongInfo.value.id}:${isPlaying.value}`)
  }
}

// 进度条拖动相关函数
function startDrag(e: MouseEvent | TouchEvent) {
  if (!duration.value || !showTitle.value) return
  
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
  if (!isDragging.value) return
  
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
  if (!isDragging.value) return
  
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
  if (!isDragging.value) return
  
  isDragging.value = false
  
  // 设置音频播放位置
  audioService.seek(currentTime.value)
  
  // 移除全局事件监听
  document.removeEventListener('mousemove', updateProgressFromEvent)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', updateProgressFromTouch)
  document.removeEventListener('touchend', stopDrag)
}

function setProgress(e: MouseEvent) {
  if (!showTitle.value || isDragging.value) return
  
  const progressBar = e.currentTarget as HTMLElement
  const rect = progressBar.getBoundingClientRect()
  const percent = (e.clientX - rect.left) / rect.width
  
  progress.value = percent * 100
  currentTime.value = percent * duration.value
  
  // 设置音频播放位置
  audioService.seek(currentTime.value)
}

// 计算网易云音乐链接
const neteaseLink = computed(() => {
  if (currentSongInfo.value.id && currentSongInfo.value.id.startsWith('netease-')) {
    const id = currentSongInfo.value.id.replace('netease-', '');
    return `https://music.163.com/#/song?id=${id}`;
  }
  return null;
});

// 订阅全局播放器事件
const unsubscribers: Array<() => void> = []

// 监听全局播放器的歌曲结束事件
function setupEventListeners() {
  // 监听歌曲结束事件
  unsubscribers.push(
    audioManager.on('song-ended', (id) => {
      if (id && id === currentSongInfo.value.id) {
        // 歌曲结束后自动播放下一首
        schedule(() => playNextSong(), 1000) // 延迟1秒播放下一首
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
        }
      } catch (e) {
        // 移除调试信息
      }
    })
  )

  // 监听音频加载错误事件
  unsubscribers.push(
    audioManager.on('audio-error', (id) => {
      if (id === currentSongInfo.value.id) {
        // 出错时尝试播放下一首
        schedule(() => playNextSong(), 1000)
      }
    })
  )
  
  // 监听关闭事件（全局播放器关闭时重置按钮状态）
  unsubscribers.push(
    audioManager.on('current-audio-changed', (id) => {
      if (id && isPlaying.value && currentSongInfo.value.id && id !== currentSongInfo.value.id) {
        // 如果切换到其他音频，更新按钮状态但保持标题
        isPlaying.value = false
        
        // 如果切换的是另一首网易云音乐，尝试找到并同步
        if (id.startsWith('netease-')) {
          syncWithCurrentPlayback()
        }
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
  
  // 订阅进度更新事件
  unsubscribers.push(
    audioManager.on('progress-update', (data) => {
      try {
        const [id, time, dur] = data.split(':');
        if (id === currentSongInfo.value.id) {
          currentTime.value = parseFloat(time);
          if (dur && parseFloat(dur) > 0) {
            duration.value = parseFloat(dur);
          }
          progress.value = (currentTime.value / duration.value) * 100 || 0;
        }
      } catch (e) {
        // 移除调试信息
      }
    })
  )
}

// 组件挂载
onMounted(() => {
  if (typeof window === 'undefined') return
  
  // 获取排行榜数据
  fetchMusicRanking()
    .then(() => {
      // 歌单加载后预加载一首歌曲
      if (favoritePlaylist.value.length > 0) {
        schedule(() => preloadNextSong(), 1000)
      }
    })
  
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
  
  // 尝试立即同步播放状态，如果歌单已加载
  if (favoritePlaylist.value.length > 0) {
    syncWithCurrentPlayback()
  }
})

// 组件卸载
onUnmounted(() => {
  // 清理事件监听
  unsubscribers.forEach(unsub => unsub())
})
</script>

<template>
  <div class="home-music-player" ref="containerRef" :class="{ 'animate-in': isVisible }">
    <h3 class="section-title" :class="{ 'animate-in': isVisible }">随机音乐</h3>
    <p class="section-description" :class="{ 'animate-in': isVisible }" style="--anim-delay: 0.1s">歌曲随机来自我的听歌记录，接口可按后端方案切换。</p>
    <div class="music-content" :class="{ 'animate-in': isVisible }" style="--anim-delay: 0.2s">
      <div class="player-container">
        <!-- 封面区域 -->
        <div class="cover-container">
          <div class="cover-image-container">
            <!-- 封面图片 -->
            <img v-if="currentSongInfo.cover && showTitle" 
              :src="currentSongInfo.cover" 
              loading="lazy"
              :alt="currentSongInfo.name" 
              class="cover-image" />
            <!-- 默认封面图片 -->
            <img v-else 
              :src="defaultCoverUrl" 
              loading="lazy"
              alt="默认音乐封面" 
              class="cover-image default-cover" />
          </div>
          
          <!-- 播放按钮 - 在暂停或未播放时显示 -->
          <div v-if="!isPlaying" class="play-overlay" @click="handleButtonClick">
            <div class="play-button">
              <span>▶</span>
            </div>
          </div>
          
          <!-- 暂停按钮 - 在播放时显示（小角落） -->
          <div v-if="isPlaying" class="pause-button" @click="handleButtonClick">
            <span>❚❚</span>
          </div>
        </div>
        
        <!-- 控制区域 -->
        <div class="controls-container">
          <!-- 上部分：歌曲信息和时间 -->
          <div class="player-top">
            <div class="song-info">
              <div class="title-container">
                <h3 v-if="showTitle" class="song-title" :style="titleStyle">
                  <a v-if="neteaseLink" :href="neteaseLink" target="_blank" class="song-title-link">{{ currentSongInfo.name }}</a>
                  <span v-else>{{ currentSongInfo.name }}</span>
                </h3>
                <div v-else class="button-text">{{ buttonText }}</div>
              </div>
              <div v-if="showTitle" class="artist-container">
                <span class="song-artist">{{ currentSongInfo.artist }}</span>
              </div>
            </div>
            
            <!-- 时间信息 -->
            <div v-if="showTitle" class="time-info">
              <div class="time-display">
                <span class="current-time">{{ formattedCurrentTime }}</span>
                <span class="duration"> / {{ formattedDuration }}</span>
              </div>
            </div>
          </div>
          
          <!-- 进度条 -->
          <div v-if="showTitle" 
               class="progress-container" 
               @click="setProgress" 
               @mousedown="startDrag"
               @touchstart="startDrag"
               :class="{ 'dragging': isDragging }">
            <div class="progress-bar">
              <div class="progress-current" :style="{ width: `${progress}%` }"></div>
            </div>
          </div>
        </div>
        
        <!-- 控制面板 - 新增的垂直控制区域 -->
        <div class="controls-panel" @click.stop="handleNextSong" :class="{ 'disabled': isButtonDisabled }">
          <!-- 下一首图标 -->
          <div class="control-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="5 4 15 12 5 20 5 4"></polygon>
              <line x1="19" y1="5" x2="19" y2="19"></line>
            </svg>
          </div>
        </div>
      </div>
      
      <!-- 加载指示器，简化为只在必要时显示 -->
      <div v-if="isLoading" class="loading-indicator">
        <div class="spinner"></div>
      </div>

      <!-- 添加一个固定高度的容器包裹小提示 -->
      <div class="tip-container">
        <!-- 添加小提示 -->
        <p class="music-tip" :class="{ 'animate-in': isVisible }" style="--anim-delay: 0.3s">只有"下一首"的播放器。<br />错过了?——等它再次路过你耳边吧，狼不回头。</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 添加小提示容器样式 */
.tip-container {
  min-height: 40px; /* 为提示预留固定高度 */
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 8px;
  overflow: hidden; /* 防止内容溢出 */
}

/* 添加小提示样式 */
.music-tip {
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
  text-align: center;
  font-style: italic;
  opacity: 0;
  transform: translateY(20px);
  position: relative;
  height: auto;
  z-index: 1;
  width: 100%;
  will-change: transform;
  margin: 0; /* 移除margin-top */
  transition: none; /* 防止任何未知的过渡效果 */
}

.animate-in.music-tip {
  animation: fadeInUp 0.6s ease forwards;
  animation-delay: var(--anim-delay, 0s);
  animation-fill-mode: both; /* 确保保持最终状态 */
  transform: translateY(0); /* 动画结束时的状态 */
}

.home-music-player {
  margin: 2rem 0;
  opacity: 0;
  transform: translateY(20px);
  position: relative;
  overflow: hidden;
}

.animate-in {
  animation: fadeInUp 0.6s ease forwards;
  animation-delay: var(--anim-delay, 0s);
  animation-fill-mode: forwards; /* 确保保持动画最终状态 */
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
  margin-bottom: 16px;
  opacity: 0;
  transform: translateY(20px);
}

.section-description {
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  margin-top: 8px;
  margin-bottom: 16px;
  opacity: 0;
  transform: translateY(20px);
}

.music-content {
  margin-top: 16px;
  position: relative;
  opacity: 0;
  transform: translateY(20px);
  display: flex;
  flex-direction: column;
  min-height: 140px; /* 设置最小高度 */
  contain: layout paint; /* 隔离布局和绘制影响 */
}

.player-container {
  display: flex;
  width: 100%;
  align-items: stretch;
  background-color: var(--vp-c-bg-soft);
  border-radius: 6px;
  max-width: 100%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  position: relative;
  height: 80px;
  will-change: contents; /* 优化性能 */
  contain: layout; /* 隔离布局变化 */
}

/* 封面区域 */
.cover-container {
  width: 80px;
  height: 80px;
  position: relative;
  flex-shrink: 0;
  overflow: hidden;
  user-select: none;
}

.cover-image-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 为默认封面添加样式 */
.default-cover {
  object-fit: cover;
  filter: brightness(0.95);
  transition: filter 0.3s ease;
}

.default-cover:hover {
  filter: brightness(1.05);
}

/* 播放控制遮罩 */
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
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  pointer-events: auto; /* 确保点击事件正常工作 */
  z-index: 5; /* 提高层级确保可点击 */
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
  margin-left: 3px;
}

/* 暂停按钮 */
.pause-button {
  position: absolute;
  bottom: 5px;
  right: 5px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 9px;
  cursor: pointer;
  animation: fadeIn 0.2s ease;
  z-index: 2;
}

/* 控制区样式 */
.controls-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 12px 16px 8px; /* 减小底部内边距 */
  position: relative;
  min-width: 0; /* 确保内容可以被压缩 */
  justify-content: space-between; /* 确保内容均匀分布 */
  background: transparent; /* 使用透明背景 */
}

.player-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  height: 40px;
  position: relative;
  margin-bottom: 4px;
  contain: layout; /* 隔离布局变化 */
}

.song-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  padding-right: 60px; /* 为时间信息留出固定空间 */
}

.title-container {
  display: block;
  overflow: hidden;
}

.song-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  line-height: 1.2; /* 调整行高 */
}

.artist-container {
  margin-top: 4px; /* 增加与标题的间距 */
  width: 100%;
  overflow: hidden;
}

.song-artist {
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
  opacity: 0.8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  line-height: 1; /* 紧凑的行高 */
}

.button-text {
  font-size: 0.95rem;
  color: var(--vp-c-text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}

/* 时间信息样式 */
.time-info {
  position: absolute;
  top: -5px; /* 原为0，向上移动9px */
  right: 0;
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
  opacity: 0.8;
  width: 55px;
  text-align: right;
}

.time-display {
  white-space: nowrap;
  width: 100%;
  display: flex;
  justify-content: flex-end;
}

.current-time {
  color: var(--vp-c-brand);
  display: inline-block;
  width: 28px;
  text-align: right;
}

.duration {
  color: var(--vp-c-text-2);
  width: 31px;
  text-align: left;
}

/* 进度条样式 */
.progress-container {
  width: 100%;
  height: 16px; /* 减小高度 */
  display: flex;
  align-items: center;
  position: relative;
  margin-top: 0; /* 移除顶部边距 */
  cursor: pointer;
  touch-action: none;
  padding-top: 2px; /* 增加内边距 */
}

.progress-container.dragging {
  cursor: grabbing;
}

.progress-bar {
  height: 4px;
  width: 100%;
  background-color: var(--vp-c-divider);
  border-radius: 2px;
  position: relative;
  overflow: visible;
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

/* 新增：控制面板样式 */
.controls-panel {
  background-color: var(--vp-c-bg-alt);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 30px; /* 固定宽度 */
  height: 100%;
  flex-shrink: 0; /* 防止被挤压 */
  border-left: 1px solid var(--vp-c-divider);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.controls-panel:hover {
  background-color: var(--vp-c-bg-mute);
}

.controls-panel:active {
  background-color: var(--vp-c-brand-dimm);
}

.control-icon {
  color: var(--vp-c-text-2);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  -webkit-tap-highlight-color: transparent; /* 移除移动端点击高亮 */
}

.controls-panel:hover .control-icon {
  color: var(--vp-c-text-1);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 修改加载指示器，使其不影响布局 */
.loading-indicator {
  position: absolute;
  top: 40px; /* 位于播放器容器之上 */
  left: 50%;
  transform: translateX(-50%);
  height: 20px;
  z-index: 10;
  width: auto;
  pointer-events: none;
  margin: 0; /* 移除margin防止影响布局 */
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
  }
}

/* 针对更窄屏幕的特别处理 */
@media (max-width: 350px) {
  .controls-container {
    padding: 12px 10px;
  }
  
  .song-info {
    padding-right: 50px;
  }
}

.song-title-link {
  color: inherit;
  text-decoration: none;
  transition: color 0.2s ease;
}

.song-title-link:hover {
  color: var(--vp-c-brand);
  text-decoration: underline;
}

/* 控制面板禁用状态 */
.controls-panel.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}
</style> 
