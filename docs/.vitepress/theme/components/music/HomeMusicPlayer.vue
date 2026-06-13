<script setup lang="ts">
/**
 * HomeMusicPlayer.vue：
 * 首页播放器始终与全局播放器同步，负责随机流播放入口。
 */

import { ref, onMounted, computed, onUnmounted, watch } from 'vue'
import { audioManager, audioService } from '../../utils/music'
import { useIntersectionObserver } from '@vueuse/core'
import { calculateProgressPercent, formatAudioTime } from '../../utils/music'
import {
  fetchTrackLyric,
  startRandomFlow,
  playNextFromFlow,
  fetchFlowState,
  fetchWeeklyTracks,
  type MusicFlowState,
  type MusicLyricLine,
  type MusicQueueItem
} from '../../utils/music'
import { logError } from '../../utils/logger'

const defaultCoverUrl = '/images/首页/default-cover.png'
const UI_SYNC_DELAY_MS = 50
const NEXT_SONG_DELAY_MS = 350
const LYRIC_DELAY_MS = -500
const HOME_PLAYBACK_REQUEST = {
  source: 'home-random',
  priority: 1,
  allowInterrupt: true,
  resumeInterrupted: false
} as const

interface CurrentSongInfo {
  id: string
  name: string
  artist: string
  cover: string
}

const containerRef = ref<HTMLElement | null>(null)
const isPlaying = ref(false)
const isLoading = ref(false)
const showTitle = ref(false)
const hasAvailableTracks = ref(true)
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
const isDragging = ref(false)
const isButtonDisabled = ref(false)
const lyricLines = ref<MusicLyricLine[]>([])
const currentLyricIndex = ref(-1)
const pendingTimers = new Set<ReturnType<typeof setTimeout>>()
const unsubscribers: Array<() => void> = []
let lyricRequestSequence = 0

const buttonText = computed(() => {
  if (!showTitle.value && !hasAvailableTracks.value && !isLoading.value) {
    return '音乐暂不可用'
  }
  return showTitle.value ? currentSongInfo.value.name : '来听歌吧！'
})

const titleStyle = computed(() => {
  if (!showTitle.value || currentSongInfo.value.name.length <= 14) {
    return {}
  }
  return {
    animation: `marquee ${currentSongInfo.value.name.length * 0.3}s linear infinite`,
    animationDelay: '1.5s',
    paddingRight: '20px'
  }
})

function formatTime(seconds: number): string {
  return formatAudioTime(seconds)
}

const formattedCurrentTime = computed(() => formatTime(currentTime.value))
const formattedDuration = computed(() => formatTime(duration.value))
const currentLyric = computed(() => {
  if (currentLyricIndex.value < 0 || currentLyricIndex.value >= lyricLines.value.length) {
    return ''
  }
  return lyricLines.value[currentLyricIndex.value]?.text || ''
})
const nextLyric = computed(() => {
  const nextIndex = currentLyricIndex.value + 1
  if (nextIndex < 0 || nextIndex >= lyricLines.value.length) {
    return ''
  }
  return lyricLines.value[nextIndex]?.text || ''
})
const hasLyricDisplay = computed(() => isPlaying.value && lyricLines.value.length > 0)

function normalizeSongId(rawId: string): string {
  if (!rawId) return ''
  return rawId.startsWith('netease-') ? rawId.slice('netease-'.length) : rawId
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

function updateLyricCursor(currentTimeSec: number): void {
  if (!lyricLines.value.length) {
    currentLyricIndex.value = -1
    return
  }

  const currentMs = Math.max(0, Math.floor(currentTimeSec * 1000) - LYRIC_DELAY_MS)
  let left = 0
  let right = lyricLines.value.length - 1
  let index = -1

  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    if (lyricLines.value[mid].timeMs <= currentMs) {
      index = mid
      left = mid + 1
    } else {
      right = mid - 1
    }
  }

  currentLyricIndex.value = index
}

async function loadLyricForCurrentSong(songId: string): Promise<void> {
  const requestSequence = ++lyricRequestSequence
  const targetId = normalizeSongId(songId)
  lyricLines.value = []
  currentLyricIndex.value = -1
  if (!targetId) return

  try {
    const lyric = await fetchTrackLyric(targetId)
    if (!lyric?.hasLyric || !lyric.lines.length) {
      return
    }
    if (requestSequence !== lyricRequestSequence || normalizeSongId(currentSongInfo.value.id) !== targetId) {
      return
    }
    lyricLines.value = lyric.lines
    updateLyricCursor(currentTime.value)
  } catch (error) {
    logError('HomeMusicPlayer', '加载歌词失败', { songId: targetId, error })
  }
}

function updateCurrentSongInfo(item: {
  id: string
  name: string
  artist: string
  cover: string
}): void {
  currentSongInfo.value = {
    id: `netease-${item.id}`,
    name: item.name,
    artist: item.artist,
    cover: normalizeCoverUrl(item.cover)
  }
  showTitle.value = true
}

function syncFromAudioManager(): void {
  const info = audioManager.getCurrentSongInfo()
  if (!info || !info.id) {
    return
  }

  currentSongInfo.value = {
    id: info.id,
    name: info.name,
    artist: info.artist,
    cover: normalizeCoverUrl(info.cover)
  }
  showTitle.value = true
  currentTime.value = info.currentTime
  duration.value = info.duration
  progress.value = info.progress
  isPlaying.value = info.isPlaying
  updateLyricCursor(currentTime.value)
}

function toAudioSongInfo(item: MusicQueueItem) {
  return {
    name: item.name,
    artist: item.artist,
    cover: normalizeCoverUrl(item.cover),
    url: item.url || '',
    urlSource: item.urlSource || 'unknown'
  }
}

async function playQueueItem(item: MusicQueueItem): Promise<boolean> {
  if (!item?.id) return false

  isLoading.value = true
  try {
    updateCurrentSongInfo(item)
    await audioService.play(
      currentSongInfo.value.id,
      toAudioSongInfo(item),
      0,
      HOME_PLAYBACK_REQUEST
    )
    isPlaying.value = true
    showTitle.value = true
    return true
  } catch (error) {
    isPlaying.value = false
    logError('HomeMusicPlayer', '播放流歌曲失败', { songId: item.id, error })
    return false
  } finally {
    isLoading.value = false
  }
}

async function applyFlowState(state: MusicFlowState, fallbackNext = false): Promise<void> {
  if (!state.current) {
    isPlaying.value = false
    if (fallbackNext) {
      schedule(() => {
        void playNextSong()
      }, NEXT_SONG_DELAY_MS)
    }
    return
  }

  const played = await playQueueItem(state.current)
  if (!played && fallbackNext) {
    schedule(() => {
      void playNextSong()
    }, NEXT_SONG_DELAY_MS)
  }
}

async function refreshAvailability(): Promise<void> {
  try {
    const tracks = await fetchWeeklyTracks({ limit: 1 })
    hasAvailableTracks.value = tracks.length > 0
  } catch {
    hasAvailableTracks.value = false
  }
}

async function startRandomPlayback(): Promise<void> {
  try {
    isLoading.value = true
    const state = await startRandomFlow()
    await applyFlowState(state)
  } catch (error) {
    logError('HomeMusicPlayer', '启动随机流失败', error)
  } finally {
    isLoading.value = false
  }
}

async function playNextSong(): Promise<void> {
  try {
    const state = await playNextFromFlow()
    await applyFlowState(state, true)
  } catch (error) {
    logError('HomeMusicPlayer', '随机流下一首失败', error)
  }
}

function stopCurrentSongPlayback(): void {
  if (!currentSongInfo.value.id) return
  audioService.pause()
  audioManager.pauseCurrent(currentSongInfo.value.id)
}

function stopPlayAndReset() {
  if (currentSongInfo.value.id) {
    stopCurrentSongPlayback()
    audioManager.emit('play-state-change', `${currentSongInfo.value.id}:false`)
  }
  isPlaying.value = false
  showTitle.value = false
  lyricLines.value = []
  currentLyricIndex.value = -1
}

function handleNextSong(e: MouseEvent) {
  e.stopPropagation()
  if (isButtonDisabled.value || isLoading.value) return

  isButtonDisabled.value = true
  schedule(() => {
    isButtonDisabled.value = false
  }, 1000)

  if (isPlaying.value && currentSongInfo.value.id) {
    stopCurrentSongPlayback()
  }

  void playNextSong()
}

function handleButtonClick() {
  if (isLoading.value) return

  if (!showTitle.value) {
    void startRandomPlayback()
    return
  }

  const status = audioService.getPlayingStatus()
  const isCurrentAudioPlaying = status.audioId === currentSongInfo.value.id && status.isPlaying
  if (isPlaying.value || isCurrentAudioPlaying) {
    stopCurrentSongPlayback()
    isPlaying.value = false
    return
  }

  void audioService.play(
    currentSongInfo.value.id,
    {
      name: currentSongInfo.value.name,
      artist: currentSongInfo.value.artist,
      cover: currentSongInfo.value.cover,
      url: ''
    },
    currentTime.value,
    HOME_PLAYBACK_REQUEST
  ).then(() => {
    isPlaying.value = true
  }).catch((error) => {
    isPlaying.value = false
    logError('HomeMusicPlayer', '恢复播放失败', { songId: currentSongInfo.value.id, error })
  })
}

function startDrag(e: MouseEvent | TouchEvent) {
  if (!duration.value || !showTitle.value) return

  isDragging.value = true
  if (e.type === 'touchstart') {
    updateProgressFromTouch(e as TouchEvent)
    document.addEventListener('touchmove', updateProgressFromTouch, { passive: false })
    document.addEventListener('touchend', stopDrag)
    return
  }

  updateProgressFromEvent(e as MouseEvent)
  document.addEventListener('mousemove', updateProgressFromEvent)
  document.addEventListener('mouseup', stopDrag)
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
  e.preventDefault()
  const progressBar = progressBarRef.value
  if (!progressBar) return
  const percent = calculateProgressPercent(e, progressBar)
  progress.value = percent * 100
  currentTime.value = percent * duration.value
}

function stopDrag() {
  document.removeEventListener('mousemove', updateProgressFromEvent)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', updateProgressFromTouch)
  document.removeEventListener('touchend', stopDrag)

  if (!isDragging.value) return
  isDragging.value = false
  audioService.seek(currentTime.value)
}

function setProgress(e: MouseEvent) {
  if (!showTitle.value || isDragging.value) return

  const progressBar = progressBarRef.value || (e.currentTarget as HTMLElement)
  const percent = calculateProgressPercent(e, progressBar)
  progress.value = percent * 100
  currentTime.value = percent * duration.value
  audioService.seek(currentTime.value)
}

const neteaseLink = computed(() => {
  if (currentSongInfo.value.id && currentSongInfo.value.id.startsWith('netease-')) {
    const id = currentSongInfo.value.id.replace('netease-', '')
    return `https://music.163.com/#/song?id=${id}`
  }
  return null
})

function setupEventListeners() {
  unsubscribers.push(
    audioManager.on('song-info-update', (payload) => {
      try {
        const parsed = JSON.parse(payload) as {
          id: string
          name: string
          artist: string
          cover: string
          isPlaying: boolean
          progress: number
          duration: number
          currentTime: number
        }
        if (!parsed.id) return
        currentSongInfo.value = {
          id: parsed.id,
          name: parsed.name,
          artist: parsed.artist,
          cover: normalizeCoverUrl(parsed.cover)
        }
        showTitle.value = true
        isPlaying.value = parsed.isPlaying
        progress.value = parsed.progress
        duration.value = parsed.duration
        currentTime.value = parsed.currentTime
        updateLyricCursor(currentTime.value)
      } catch (error) {
        logError('HomeMusicPlayer', '解析 song-info-update 失败', error)
      }
    })
  )

  unsubscribers.push(
    audioManager.on('play-state-change', (data) => {
      if (!data) return
      const [id, state] = data.split(':')
      if (id === currentSongInfo.value.id) {
        isPlaying.value = state === 'true'
      }
    })
  )

  unsubscribers.push(
    audioManager.on('progress-update', (data) => {
      try {
        const [id, time, dur] = data.split(':')
        if (id !== currentSongInfo.value.id || isDragging.value) return
        const timeValue = Number.parseFloat(time)
        const durationValue = Number.parseFloat(dur)
        if (!Number.isNaN(timeValue)) {
          currentTime.value = timeValue
        }
        if (!Number.isNaN(durationValue) && durationValue > 0) {
          duration.value = durationValue
        }
        progress.value = duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0
        updateLyricCursor(currentTime.value)
      } catch (error) {
        logError('HomeMusicPlayer', '解析进度事件失败', error)
      }
    })
  )

  unsubscribers.push(
    audioManager.on('player-closed', () => {
      stopPlayAndReset()
    })
  )
}

watch(
  () => currentSongInfo.value.id,
  (songId) => {
    void loadLyricForCurrentSong(songId)
  }
)

onMounted(() => {
  if (typeof window === 'undefined') return

  void refreshAvailability()
  void fetchFlowState().then((state) => applyFlowState(state)).catch(() => {
    // 仅用于初始同步，失败时忽略。
  })

  setupEventListeners()
  syncFromAudioManager()

  if (containerRef.value) {
    const { stop } = useIntersectionObserver(
      containerRef,
      ([{ isIntersecting }]) => {
        if (isIntersecting) {
          isVisible.value = true
          stop()
        }
      },
      { threshold: 0.2, immediate: true }
    )
  }

  schedule(() => {
    syncFromAudioManager()
  }, UI_SYNC_DELAY_MS)
})

onUnmounted(() => {
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
          <div v-if="!isPlaying" class="play-overlay" @click.stop="handleButtonClick">
            <div class="play-button">
              <span>▶</span>
            </div>
          </div>
          
          <!-- 暂停按钮 - 在播放时显示（小角落） -->
          <div v-if="isPlaying" class="pause-button" @click.stop="handleButtonClick">
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
               class="progress-container lc-progress-root" 
               @click="setProgress" 
               @mousedown="startDrag"
               @touchstart="startDrag"
               :class="{ 'is-dragging': isDragging }">
            <div ref="progressBarRef" class="progress-bar lc-progress-bar">
              <div class="progress-current lc-progress-fill" :style="{ width: `${progress}%` }"></div>
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
        <Transition name="tip-mode" mode="out-in">
          <div
            v-if="hasLyricDisplay"
            key="lyrics"
            class="music-lyric-tip"
            :class="{ 'animate-in': isVisible }"
            style="--anim-delay: 0.3s"
          >
            <TransitionGroup name="lyric-stack" tag="div" class="lyric-stack">
              <div
                v-if="currentLyric"
                :key="currentLyricIndex"
                class="lyric-line lyric-line-current"
              >
                {{ currentLyric }}
              </div>
              <div
                v-if="nextLyric"
                :key="currentLyricIndex + 1"
                class="lyric-line lyric-line-next"
              >
                {{ nextLyric }}
              </div>
            </TransitionGroup>
          </div>
          <!-- 添加小提示 -->
          <p
            v-else
            key="tip"
            class="music-tip"
            :class="{ 'animate-in': isVisible }"
            style="--anim-delay: 0.3s"
          >
            只有"下一首"的播放器。<br />错过了?——等它再次路过你耳边吧，狼不回头。
          </p>
        </Transition>
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
  line-height: 1.6;
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

.music-lyric-tip {
  width: 100%;
  min-height: 40px;
  opacity: 0;
  transform: translateY(20px);
  position: relative;
  z-index: 1;
}

.animate-in.music-lyric-tip {
  animation: fadeInUp var(--lc-motion-duration-slower) var(--lc-motion-ease-standard) forwards;
  animation-delay: var(--anim-delay, 0s);
  animation-fill-mode: both;
}

.lyric-stack {
  position: relative;
  width: 100%;
  height: 40px;
  overflow: hidden;
}

.lyric-line {
  width: 100%;
  font-size: 0.75rem;
  line-height: 1.6;
  text-align: center;
  font-style: normal;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition:
    transform var(--lc-motion-duration-fast) var(--lc-motion-ease-standard),
    opacity var(--lc-motion-duration-fast) var(--lc-motion-ease-standard),
    color var(--lc-motion-duration-fast) var(--lc-motion-ease-standard);
}

.lyric-line-current {
  color: var(--vp-c-brand);
}

.lyric-line-next {
  color: var(--vp-c-text-3);
}

.lyric-stack-enter-active,
.lyric-stack-leave-active {
  transition:
    transform var(--lc-motion-duration-fast) var(--lc-motion-ease-standard),
    opacity var(--lc-motion-duration-fast) var(--lc-motion-ease-standard);
}

.lyric-stack-move {
  transition: transform var(--lc-motion-duration-fast) var(--lc-motion-ease-standard);
}

.lyric-stack-enter-from {
  opacity: 0;
  transform: translateY(14px);
}

.lyric-stack-leave-to {
  opacity: 0;
  transform: translateY(-14px);
}

.lyric-stack-leave-active {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
}

.tip-mode-enter-active,
.tip-mode-leave-active {
  transition: opacity var(--lc-motion-duration-fast) var(--lc-motion-ease-standard);
}

.tip-mode-enter-from,
.tip-mode-leave-to {
  opacity: 0;
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

.progress-container.is-dragging {
  cursor: grabbing;
}

.progress-bar {
  width: 100%;
}

.progress-current {
  height: 100%;
}

/* 拖动时禁用过渡效果 */
.is-dragging .progress-current {
  transition: none;
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
