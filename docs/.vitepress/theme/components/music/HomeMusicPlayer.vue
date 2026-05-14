<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { audioManager, audioService } from '../../utils/music'
import { useIntersectionObserver } from '@vueuse/core'
import { calculateProgressPercent, formatAudioTime } from '../../utils/music'
import {
  enqueueMusicQueueItem,
  playNextFromMusicQueue,
  fetchTrackUrlById,
  type MusicQueueItem,
  type MusicQueueSnapshot,
  fetchWeeklyTracks,
  type MusicTrack
} from '../../utils/music'
import { logError } from '../../utils/logger'

// 默认封面图片路径
const defaultCoverUrl = '/images/首页/default-cover.png'
const UI_SYNC_DELAY_MS = 50
const NEXT_SONG_DELAY_MS = 1000
const MAX_NEXT_ATTEMPTS = 6
const QUEUE_PREFETCH_SIZE = 4
const PLAYLIST_CACHE_KEY = 'lycan:music:weekly-ranking'
const HOME_PLAYBACK_REQUEST = {
  source: 'home-random',
  priority: 1,
  allowInterrupt: true,
  resumeInterrupted: true
} as const
const HOME_QUEUE_SOURCE = 'home-random'

interface CurrentSongInfo {
  id: string
  name: string
  artist: string
  cover: string
}

const isBrowser = typeof window !== 'undefined'

// 组件状态
const containerRef = ref<HTMLElement | null>(null)
const isPlaying = ref(false)
const isLoading = ref(false)
const showTitle = ref(false)
const favoritePlaylist = ref<MusicTrack[]>([])
const currentSongInfo = ref<CurrentSongInfo>({
  id: '',
  name: '',
  artist: '',
  cover: ''
})
const isVisible = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const progress = ref(0)
const progressBarRef = ref<HTMLElement | null>(null)
const isDragging = ref(false)  // 新增：是否正在拖动进度条
const isButtonDisabled = ref(false) // 添加按钮禁用状态
const pendingTimers = new Set<ReturnType<typeof setTimeout>>()
const isQueuePrefilling = ref(false)
let songPool: MusicTrack[] = []

// 计算属性：按钮显示的文本，随机听或当前歌曲标题
const buttonText = computed(() => {
  if (!showTitle.value && favoritePlaylist.value.length === 0 && !isLoading.value) {
    return '音乐暂不可用'
  }
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
  return formatAudioTime(seconds)
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
      const matchedSong = favoritePlaylist.value.find(song => String(song.id) === neteaseId)

      if (matchedSong) {
        // 找到了歌曲，更新状态
        // 两步处理来确保动画正常：先重置状态
        showTitle.value = false
        
        // 短暂延迟后设置新状态，让DOM有时间更新
        schedule(() => {
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
          schedule(() => {
            isPlaying.value = savedSongInfo.isPlaying
          }, UI_SYNC_DELAY_MS)
          
        }, UI_SYNC_DELAY_MS)
      }
    }
  }
}

function cachePlaylist(playlist: MusicTrack[]): void {
  if (!isBrowser) return
  try {
    window.localStorage.setItem(PLAYLIST_CACHE_KEY, JSON.stringify(playlist))
  } catch (error) {
    logError('HomeMusicPlayer', '缓存排行榜失败', error)
  }
}

function readCachedPlaylist(): MusicTrack[] {
  if (!isBrowser) return []
  try {
    const raw = window.localStorage.getItem(PLAYLIST_CACHE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is MusicTrack =>
      !!item &&
      typeof item.id === 'string' &&
      typeof item.name === 'string' &&
      typeof item.artist === 'string' &&
      typeof item.cover === 'string'
    )
  } catch (error) {
    logError('HomeMusicPlayer', '读取排行榜缓存失败', error)
    return []
  }
}

function resetSongPool(excludeSongId = ''): void {
  const normalizedExcludeId = excludeSongId.replace('netease-', '')
  const candidates = favoritePlaylist.value.filter((song) => song.id !== normalizedExcludeId)
  songPool = shuffleArray([...candidates])
}

// 获取网易云音乐排行榜数据
async function fetchMusicRanking() {
  if (typeof window === 'undefined') return
  
  isLoading.value = true
  
  try {
    const songs = await fetchWeeklyTracks({ withTimestamp: true, coverSize: '120y120' })
    favoritePlaylist.value = songs
    resetSongPool()
    cachePlaylist(songs)
    syncWithCurrentPlayback()
  } catch (error) {
    logError('HomeMusicPlayer', '加载音乐排行榜失败，尝试使用缓存列表', error)
    if (favoritePlaylist.value.length === 0) {
      const cached = readCachedPlaylist()
      favoritePlaylist.value = cached
      resetSongPool()
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
  const timer = setTimeout(() => {
    pendingTimers.delete(timer)
    task()
  }, delay)
  pendingTimers.add(timer)
}

function clearPendingTimers(): void {
  for (const timer of pendingTimers) {
    clearTimeout(timer)
  }
  pendingTimers.clear()
}

function stopCurrentSongPlayback(): void {
  if (!currentSongInfo.value.id) return
  audioService.pause()
  audioManager.pauseCurrent(currentSongInfo.value.id)
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

function drawSongCandidate(excludeSongIds: Set<string>): MusicTrack | null {
  if (favoritePlaylist.value.length === 0) return null

  const maxAttempts = favoritePlaylist.value.length * 2
  let attempts = 0

  while (attempts < maxAttempts) {
    if (songPool.length === 0) {
      resetSongPool(currentSongInfo.value.id)
      if (songPool.length === 0) return null
    }

    const nextSong = songPool.shift()
    if (!nextSong) {
      attempts += 1
      continue
    }

    if (excludeSongIds.has(nextSong.id) && favoritePlaylist.value.length > 1) {
      attempts += 1
      continue
    }

    return nextSong
  }

  return null
}

function collectQueuedSongIds(snapshot: MusicQueueSnapshot): Set<string> {
  const ids = new Set<string>()
  if (snapshot.current?.id) ids.add(snapshot.current.id)
  for (const item of snapshot.queue) {
    if (item.id) ids.add(item.id)
  }
  return ids
}

async function ensureQueuePrefetch(snapshot: MusicQueueSnapshot): Promise<void> {
  if (isQueuePrefilling.value) return
  if (favoritePlaylist.value.length === 0) return
  if (snapshot.queueSize >= QUEUE_PREFETCH_SIZE) return

  isQueuePrefilling.value = true
  try {
    let workingSnapshot = snapshot
    const excludedSongIds = collectQueuedSongIds(snapshot)
    const maxAttempts = favoritePlaylist.value.length * 2
    let attempts = 0

    while (workingSnapshot.queueSize < QUEUE_PREFETCH_SIZE && attempts < maxAttempts) {
      const candidate = drawSongCandidate(excludedSongIds)
      if (!candidate) break
      excludedSongIds.add(candidate.id)

      const enqueueResult = await enqueueMusicQueueItem({
        id: candidate.id,
        source: HOME_QUEUE_SOURCE,
        insertFront: false,
        interruptCurrent: false,
        resumeCurrent: true,
        priority: 1,
        dedupeMode: 'skip'
      })

      workingSnapshot = enqueueResult.snapshot
      attempts += 1
    }
  } catch (error) {
    logError('HomeMusicPlayer', '预填充播放队列失败', error)
  } finally {
    isQueuePrefilling.value = false
  }
}

async function enqueueRandomSongAsCurrent(): Promise<MusicQueueSnapshot | null> {
  const excludedSongIds = new Set<string>()
  if (currentSongInfo.value.id.startsWith('netease-')) {
    excludedSongIds.add(currentSongInfo.value.id.replace('netease-', ''))
  }

  const candidate = drawSongCandidate(excludedSongIds)
  if (!candidate) return null

  const result = await enqueueMusicQueueItem({
    id: candidate.id,
    source: HOME_QUEUE_SOURCE,
    insertFront: true,
    interruptCurrent: true,
    resumeCurrent: true,
    priority: 1,
    dedupeMode: 'replace'
  })
  return result.snapshot
}

async function resolveTrackUrl(item: MusicQueueItem): Promise<string> {
  if (item.url) return item.url
  const fallbackUrl = await fetchTrackUrlById(item.id)
  return fallbackUrl || ''
}

async function playQueueItem(item: MusicQueueItem): Promise<boolean> {
  if (typeof window === 'undefined' || !item.id) return false

  isLoading.value = true

  try {
    const resolvedUrl = await resolveTrackUrl(item)
    if (!resolvedUrl) {
      return false
    }

    const coverUrl = normalizeCoverUrl(item.cover)
    const audioId = `netease-${item.id}`
    currentSongInfo.value = {
      id: audioId,
      name: item.name,
      artist: item.artist,
      cover: coverUrl
    }

    await audioService.play(audioId, {
      name: item.name,
      artist: item.artist,
      cover: coverUrl,
      url: resolvedUrl
    }, 0, HOME_PLAYBACK_REQUEST)

    isPlaying.value = true
    showTitle.value = true

    audioManager.emit('song-info-update', JSON.stringify({
      id: audioId,
      name: item.name,
      artist: item.artist,
      cover: coverUrl,
      isPlaying: true,
      progress: 0,
      duration: 0,
      currentTime: 0
    }))
    return true
  } catch (error) {
    isPlaying.value = false
    showTitle.value = false
    logError('HomeMusicPlayer', '播放队列歌曲失败', { songId: item.id, error })
    return false
  } finally {
    isLoading.value = false
  }
}

async function resolveNextSnapshot(): Promise<MusicQueueSnapshot | null> {
  if (currentSongInfo.value.id) {
    const result = await playNextFromMusicQueue()
    if (result.snapshot.current) {
      return result.snapshot
    }
  }
  return enqueueRandomSongAsCurrent()
}

// 随机播放一首歌
async function playNextSong(attempt = 0): Promise<void> {
  if (isLoading.value || favoritePlaylist.value.length === 0) return
  if (attempt >= Math.min(MAX_NEXT_ATTEMPTS, favoritePlaylist.value.length)) {
    logError('HomeMusicPlayer', '连续多首歌曲不可播放，停止自动切歌', {
      attempts: attempt
    })
    isPlaying.value = false
    showTitle.value = false
    return
  }

  try {
    const snapshot = await resolveNextSnapshot()
    const nextItem = snapshot?.current ?? null
    if (!nextItem) {
      schedule(() => {
        void playNextSong(attempt + 1)
      }, NEXT_SONG_DELAY_MS)
      return
    }

    const played = await playQueueItem(nextItem)
    if (!played) {
      schedule(() => {
        void playNextSong(attempt + 1)
      }, NEXT_SONG_DELAY_MS)
      return
    }

    if (snapshot) {
      void ensureQueuePrefetch(snapshot)
    }
  } catch (error) {
    logError('HomeMusicPlayer', '队列切歌失败', error)
    schedule(() => {
      void playNextSong(attempt + 1)
    }, NEXT_SONG_DELAY_MS)
  }
}

function playRandomSong(): void {
  if (isLoading.value) return

  if (favoritePlaylist.value.length === 0) {
    void fetchMusicRanking()
    return
  }

  void playNextSong()
}

// 停止播放并恢复按钮状态
function stopPlayAndReset() {
  if (currentSongInfo.value.id) {
    stopCurrentSongPlayback()
    audioManager.emit('play-state-change', `${currentSongInfo.value.id}:false`)
  }
  
  // 恢复按钮状态
  isPlaying.value = false
  showTitle.value = false
}

// 处理下一首按钮点击事件
function handleNextSong(e: MouseEvent) {
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
    stopCurrentSongPlayback()
  }
  
  // 播放下一首歌曲
  void playNextSong()
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
      stopCurrentSongPlayback()
      isPlaying.value = false
    } else {
      // 如果已暂停，继续播放当前歌曲
      audioService.play(currentSongInfo.value.id, {
        name: currentSongInfo.value.name,
        artist: currentSongInfo.value.artist,
        cover: currentSongInfo.value.cover,
        url: ''  // 服务会使用现有的音频对象
      }, currentTime.value, HOME_PLAYBACK_REQUEST)
      .then(() => {
        isPlaying.value = true
      })
      .catch(() => {
        // 恢复播放失败，移除调试信息
        isPlaying.value = false
        logError('HomeMusicPlayer', '恢复播放失败', { songId: currentSongInfo.value.id })
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
  
  const progressBar = progressBarRef.value
  if (!progressBar) return
  
  const percent = calculateProgressPercent(e, progressBar)
  
  progress.value = percent * 100
  currentTime.value = percent * duration.value
}

function updateProgressFromTouch(e: TouchEvent) {
  if (!isDragging.value) return
  
  // 阻止触摸事件的默认行为（如滚动）
  e.preventDefault()
  
  const progressBar = progressBarRef.value
  if (!progressBar) return
  
  const percent = calculateProgressPercent(e, progressBar)
  
  progress.value = percent * 100
  currentTime.value = percent * duration.value
}

function stopDrag(e?: MouseEvent | TouchEvent) {
  // 移除全局事件监听
  document.removeEventListener('mousemove', updateProgressFromEvent)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', updateProgressFromTouch)
  document.removeEventListener('touchend', stopDrag)

  if (!isDragging.value) return
  
  isDragging.value = false
  
  // 设置音频播放位置
  audioService.seek(currentTime.value)
}

function setProgress(e: MouseEvent) {
  if (!showTitle.value || isDragging.value) return
  
  const progressBar = progressBarRef.value || (e.currentTarget as HTMLElement)
  const percent = calculateProgressPercent(e, progressBar)
  
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
        schedule(() => {
          void playNextSong()
        }, NEXT_SONG_DELAY_MS)
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
        logError('HomeMusicPlayer', '解析播放状态事件失败', e)
      }
    })
  )

  // 监听音频加载错误事件
  unsubscribers.push(
    audioManager.on('audio-error', (id) => {
      if (id === currentSongInfo.value.id) {
        // 出错时尝试播放下一首
        schedule(() => {
          void playNextSong()
        }, NEXT_SONG_DELAY_MS)
      }
    })
  )
  
  // 监听关闭事件（全局播放器关闭时重置按钮状态）
  unsubscribers.push(
    audioManager.on('current-audio-changed', (id) => {
      if (id && isPlaying.value && currentSongInfo.value.id && id !== currentSongInfo.value.id) {
        // 如果切换到其他音频，更新按钮状态但保持标题
        isPlaying.value = false
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
          progress.value = duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0;
        }
      } catch (e) {
        logError('HomeMusicPlayer', '解析进度事件失败', e)
      }
    })
  )

  unsubscribers.push(
    audioManager.on('resume-playback', (payload) => {
      try {
        const parsed = JSON.parse(payload) as {
          audioId?: string
          currentTime?: number
          request?: {
            source?: string
          }
        }
        if (parsed.request?.source !== 'home-random') return
        if (!parsed.audioId || parsed.audioId !== currentSongInfo.value.id) return

        const resumeTime = typeof parsed.currentTime === 'number'
          ? Math.max(0, parsed.currentTime)
          : currentTime.value

        void audioService.play(
          currentSongInfo.value.id,
          {
            name: currentSongInfo.value.name,
            artist: currentSongInfo.value.artist,
            cover: currentSongInfo.value.cover,
            url: ''
          },
          resumeTime,
          HOME_PLAYBACK_REQUEST
        ).then(() => {
          isPlaying.value = true
          showTitle.value = true
        }).catch((error) => {
          logError('HomeMusicPlayer', '恢复被打断歌曲失败', error)
        })
      } catch (error) {
        logError('HomeMusicPlayer', '解析恢复播放事件失败', error)
      }
    })
  )
}

// 组件挂载
onMounted(() => {
  if (typeof window === 'undefined') return
  
  void fetchMusicRanking()
  
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
  
  if (favoritePlaylist.value.length > 0) {
    syncWithCurrentPlayback()
  }
})

// 组件卸载
onUnmounted(() => {
  // 清理事件监听
  unsubscribers.forEach(unsub => unsub())
  clearPendingTimers()
  stopDrag()
})
</script>

<template>
  <div class="home-music-player" ref="containerRef" :class="{ 'animate-in': isVisible }">
    <h3 class="section-title" :class="{ 'animate-in': isVisible }">随机音乐</h3>
    <p class="section-description" :class="{ 'animate-in': isVisible }" style="--anim-delay: 0.1s">随机播放来自我听歌排行榜的曲目，陪你一起继续阅读。</p>
    <div class="music-content" :class="{ 'animate-in': isVisible }" style="--anim-delay: var(--lc-motion-duration-fast)">
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
            <div ref="progressBarRef" class="progress-bar">
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
  animation: fadeInUp var(--lc-motion-duration-slower) var(--lc-motion-ease-standard) forwards;
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
  animation: fadeInUp var(--lc-motion-duration-slower) var(--lc-motion-ease-standard) forwards;
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
  transition: filter var(--lc-motion-duration-normal) var(--lc-motion-ease-standard);
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
  animation: fadeIn var(--lc-motion-duration-fast) var(--lc-motion-ease-standard);
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
  animation: fadeIn var(--lc-motion-duration-fast) var(--lc-motion-ease-standard);
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
  transition: width var(--lc-motion-duration-instant) linear;
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
  transition: opacity var(--lc-motion-duration-fast) var(--lc-motion-ease-standard);
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
  transition: background-color var(--lc-motion-duration-fast) var(--lc-motion-ease-standard);
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
  transition: color var(--lc-motion-duration-fast) var(--lc-motion-ease-standard);
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
