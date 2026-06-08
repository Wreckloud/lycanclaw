<script setup lang="ts">
/**
 * SimpleMusicPlayer.vue：
 * 定义SimpleMusicPlayer组件的交互与展示逻辑。
 */

import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useData } from 'vitepress'
import { useIntersectionObserver } from '@vueuse/core'
import {
  audioManager,
  audioService,
  fetchTrackWithUrlById,
  interruptSingleFlow,
  startAboutSequenceFlow,
  calculateProgressPercent,
  formatAudioTime
} from '../../utils/music'
import { logError } from '../../utils/logger'
import type { SongInfo } from '../../utils/music'

interface Props {
  name?: string
  artist?: string
  cover?: string
  url?: string
  autoplay?: boolean
  neteaseid?: string
  playbackSource?: string
  playbackPriority?: number
  allowInterrupt?: boolean
}

interface LocalSongInfo {
  name: string
  artist: string
  cover: string
  url: string
}

const PLAY_TOGGLE_DEBOUNCE_MS = 200

const props = withDefaults(defineProps<Props>(), {
  name: '',
  artist: '未知艺术家',
  cover: '',
  url: '',
  autoplay: false,
  neteaseid: '',
  playbackSource: 'article-embed',
  playbackPriority: 3,
  allowInterrupt: true
})

const { isDark } = useData()

const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const progress = ref(0)
const isVisible = ref(false)
const isLoading = ref(true)
const hasError = ref(false)
const isDragging = ref(false)
const isAudioReady = ref(false)
const useNetease = ref(false)
const animationApplied = ref(false)
const playerRef = ref<HTMLElement | null>(null)
const progressBarRef = ref<HTMLElement | null>(null)
const debounceTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const stopVisibilityObserver = ref<(() => void) | null>(null)
const unsubscribers: Array<() => void> = []
const fallbackAudioId = `player-${Math.random().toString(36).slice(2, 10)}`

const audioId = computed(() => {
  if (props.neteaseid) return `netease-${props.neteaseid}`
  if (props.url) return `url-${props.url}`
  return fallbackAudioId
})

const songInfo = ref<LocalSongInfo>({
  name: props.name,
  artist: props.artist,
  cover: props.cover,
  url: props.url
})

const formattedCurrentTime = computed(() => formatAudioTime(currentTime.value))
const formattedDuration = computed(() => formatAudioTime(duration.value))
const neteaseLink = computed(() => (
  props.neteaseid ? `https://music.163.com/#/song?id=${props.neteaseid}` : null
))
const playbackRequest = computed(() => ({
  source: props.playbackSource,
  priority: props.playbackPriority,
  allowInterrupt: props.allowInterrupt,
  resumeInterrupted: false
}))

function playbackRequestBySource(source: string | undefined) {
  if (source === 'home-random') {
    return {
      source: 'home-random',
      priority: 1,
      allowInterrupt: true,
      resumeInterrupted: false
    }
  }
  if (source === 'about-ranking') {
    return {
      source: 'about-ranking',
      priority: 2,
      allowInterrupt: true,
      resumeInterrupted: false
    }
  }
  if (source === 'article-embed') {
    return {
      source: 'article-embed',
      priority: 3,
      allowInterrupt: true,
      resumeInterrupted: false
    }
  }
  if (source === 'interrupt-single') {
    return {
      source: 'interrupt-single',
      priority: 3,
      allowInterrupt: true,
      resumeInterrupted: false
    }
  }
  return playbackRequest.value
}

function clearDebounceTimer(): void {
  if (!debounceTimer.value) return
  clearTimeout(debounceTimer.value)
  debounceTimer.value = null
}

function clearDragListeners(): void {
  document.removeEventListener('mousemove', updateProgressFromEvent)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', updateProgressFromTouch)
  document.removeEventListener('touchend', stopDrag)
}

function setCurrentProgress(percent: number): void {
  const normalizedPercent = Math.max(0, Math.min(percent, 1))
  progress.value = normalizedPercent * 100
  currentTime.value = normalizedPercent * duration.value
}

function resetVisualProgress(): void {
  currentTime.value = 0
  progress.value = 0
}

function emitPlayState(state: boolean): void {
  audioManager.emit('play-state-change', `${audioId.value}:${state}`)
}

function sendSongInfoToGlobalPlayer(): void {
  const songData: SongInfo = {
    id: audioId.value,
    name: songInfo.value.name,
    artist: songInfo.value.artist,
    cover: songInfo.value.cover,
    isPlaying: isPlaying.value,
    progress: progress.value,
    duration: duration.value,
    currentTime: currentTime.value
  }
  audioManager.emit('song-info-update', JSON.stringify(songData))
}

function pausePlay(): void {
  if (!isPlaying.value) return
  audioService.pause()
  isPlaying.value = false
  emitPlayState(false)
}

function resetProgress(): void {
  audioService.seek(0)
  resetVisualProgress()
}

function updateProgressFromEvent(event: MouseEvent): void {
  if (!isDragging.value || !progressBarRef.value) return
  const percent = calculateProgressPercent(event, progressBarRef.value)
  setCurrentProgress(percent)
}

function updateProgressFromTouch(event: TouchEvent): void {
  if (!isDragging.value || !progressBarRef.value) return
  event.preventDefault()
  const percent = calculateProgressPercent(event, progressBarRef.value)
  setCurrentProgress(percent)
}

function startDrag(event: MouseEvent | TouchEvent): void {
  if (!isAudioReady.value) return
  isDragging.value = true

  if (event.type === 'touchstart') {
    updateProgressFromTouch(event as TouchEvent)
    document.addEventListener('touchmove', updateProgressFromTouch, { passive: false })
    document.addEventListener('touchend', stopDrag)
    return
  }

  updateProgressFromEvent(event as MouseEvent)
  document.addEventListener('mousemove', updateProgressFromEvent)
  document.addEventListener('mouseup', stopDrag)
}

function stopDrag(): void {
  if (!isDragging.value) return
  isDragging.value = false
  audioService.seek(currentTime.value)
  clearDragListeners()
}

function setProgress(event: MouseEvent): void {
  if (!isAudioReady.value || isDragging.value) return
  const progressBar = progressBarRef.value ?? (event.currentTarget as HTMLElement | null)
  if (!progressBar) return
  const percent = calculateProgressPercent(event, progressBar)
  setCurrentProgress(percent)
  audioService.seek(currentTime.value)
}

function retryLoadAudio(): void {
  hasError.value = false
  isLoading.value = true
  void loadAudioSource()
}

async function fetchNeteaseMusicInfo(id: string): Promise<boolean> {
  if (!id) return false
  try {
    isLoading.value = true
    const track = await fetchTrackWithUrlById(id)
    if (!track?.url) {
      hasError.value = true
      isLoading.value = false
      return false
    }

    songInfo.value = {
      name: track.name,
      artist: track.artist || '未知艺术家',
      cover: track.cover,
      url: track.url
    }
    isLoading.value = false
    return true
  } catch (error) {
    logError('SimpleMusicPlayer', '获取网易云音乐信息失败', error)
    hasError.value = true
    isLoading.value = false
    return false
  }
}

function normalizeHttpToHttps(url: string): string {
  return url.startsWith('http:') ? url.replace('http:', 'https:') : url
}

function syncFromAudioStatus(): void {
  const status = audioService.getPlayingStatus()
  if (status.audioId !== audioId.value) return
  isPlaying.value = status.isPlaying
  currentTime.value = status.currentTime
  duration.value = status.duration
  progress.value = duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0
  isAudioReady.value = true
  isLoading.value = false
  if (isPlaying.value) {
    sendSongInfoToGlobalPlayer()
  }
}

async function loadAudioSource(): Promise<void> {
  isLoading.value = true
  isAudioReady.value = false
  hasError.value = false
  useNetease.value = false

  try {
    if (props.neteaseid) {
      const success = await fetchNeteaseMusicInfo(props.neteaseid)
      if (!success && !props.url) {
        useNetease.value = true
        isLoading.value = false
        return
      }
    } else if (props.url) {
      songInfo.value = {
        name: props.name,
        artist: props.artist,
        cover: normalizeHttpToHttps(props.cover),
        url: normalizeHttpToHttps(props.url)
      }
    } else {
      hasError.value = true
      isLoading.value = false
      return
    }

    syncFromAudioStatus()
    if (!isAudioReady.value) {
      isAudioReady.value = true
      isLoading.value = false
      if (props.autoplay) {
        togglePlay()
      }
    }
  } catch (error) {
    logError('SimpleMusicPlayer', '加载音频源失败', error)
    hasError.value = true
    isLoading.value = false
  }
}

function togglePlay(): void {
  if (hasError.value || !isAudioReady.value) return
  clearDebounceTimer()

  debounceTimer.value = setTimeout(() => {
    if (isPlaying.value) {
      pausePlay()
      return
    }

    void startPlaybackByContext()
  }, PLAY_TOGGLE_DEBOUNCE_MS)
}

async function playFromFlowState(state: {
  mode?: string
  current: {
    id: string
    name: string
    artist: string
    cover: string
    url: string
    source: string
  } | null
}): Promise<void> {
  if (!state.current) {
    isPlaying.value = false
    emitPlayState(false)
    return
  }

  const flowItem = state.current
  const flowAudioId = `netease-${flowItem.id}`
  const flowSong = {
    name: flowItem.name,
    artist: flowItem.artist,
    cover: normalizeHttpToHttps(flowItem.cover),
    url: normalizeHttpToHttps(flowItem.url || '')
  }
  const requestSource = state.mode === 'interrupt-single' ? 'interrupt-single' : flowItem.source

  await audioService.play(flowAudioId, flowSong, 0, playbackRequestBySource(requestSource))
  isPlaying.value = flowAudioId === audioId.value
  emitPlayState(isPlaying.value)
  if (isPlaying.value) {
    sendSongInfoToGlobalPlayer()
  }
}

async function playLocalSong(): Promise<void> {
  await audioService.play(audioId.value, songInfo.value, currentTime.value, playbackRequest.value)
  isPlaying.value = true
  emitPlayState(true)
  sendSongInfoToGlobalPlayer()
}

function hasActivePlayback(): boolean {
  const currentId = audioManager.getCurrentPlayingId()
  return !!currentId
}

async function startPlaybackByContext(): Promise<void> {
  try {
    if (props.neteaseid && props.playbackSource === 'about-ranking') {
      const flowState = hasActivePlayback()
        ? await interruptSingleFlow(props.neteaseid, 'about-ranking')
        : await startAboutSequenceFlow(props.neteaseid)
      await playFromFlowState(flowState)
      return
    }

    if (props.neteaseid && props.playbackSource === 'article-embed' && hasActivePlayback()) {
      const flowState = await interruptSingleFlow(props.neteaseid, 'article-embed')
      await playFromFlowState(flowState)
      return
    }

    await playLocalSong()
  } catch (error) {
    if (error instanceof Error && error.message === 'PLAYBACK_DENIED') {
      return
    }
    if (error && (error as { name?: string }).name === 'AbortError') {
      return
    }
    logError('SimpleMusicPlayer', '播放出错', error)
    isPlaying.value = false
    emitPlayState(false)
  }
}

function setupEventListeners(): void {
  unsubscribers.push(audioManager.on('audio-pause', id => {
    if (id === audioId.value && isPlaying.value) {
      pausePlay()
    }
  }))

  unsubscribers.push(audioManager.on('audio-reset', id => {
    if (id === audioId.value) {
      resetProgress()
    }
  }))

  unsubscribers.push(audioManager.on('global-play', id => {
    if (id === audioId.value && !isPlaying.value && isAudioReady.value) {
      togglePlay()
    }
  }))

  unsubscribers.push(audioManager.on('global-pause', id => {
    if (id === audioId.value && isPlaying.value) {
      togglePlay()
    }
  }))

  unsubscribers.push(audioManager.on('global-seek', data => {
    const [id, timeStr] = data.split(':')
    if (id !== audioId.value) return
    const time = Number.parseFloat(timeStr)
    if (Number.isNaN(time)) return
    audioService.seek(time)
    currentTime.value = time
    progress.value = duration.value > 0 ? (time / duration.value) * 100 : 0
  }))

  unsubscribers.push(audioManager.on('progress-update', data => {
    const [id, timeStr, durationStr] = data.split(':')
    if (id !== audioId.value || isDragging.value) return
    const timeValue = Number.parseFloat(timeStr)
    const durationValue = durationStr ? Number.parseFloat(durationStr) : NaN
    if (!Number.isNaN(timeValue)) {
      currentTime.value = timeValue
    }
    if (!Number.isNaN(durationValue) && durationValue > 0) {
      duration.value = durationValue
    }
    progress.value = duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0
  }))

  unsubscribers.push(audioManager.on('play-state-change', data => {
    const [id, state] = data.split(':')
    if (id === audioId.value) {
      isPlaying.value = state === 'true'
    }
  }))

  unsubscribers.push(audioManager.on('current-audio-changed', id => {
    if (id !== audioId.value) {
      resetVisualProgress()
    }
  }))

  unsubscribers.push(audioManager.on('player-closed', id => {
    if (id === audioId.value) {
      resetVisualProgress()
      isPlaying.value = false
    }
  }))

  unsubscribers.push(audioManager.on('resume-playback', payload => {
    try {
      const parsed = JSON.parse(payload) as {
        audioId?: string
        currentTime?: number
      }
      if (!parsed.audioId || parsed.audioId !== audioId.value) return
      if (!songInfo.value.url) return

      const resumeTime = typeof parsed.currentTime === 'number'
        ? Math.max(0, parsed.currentTime)
        : currentTime.value

      void audioService.play(audioId.value, songInfo.value, resumeTime, playbackRequest.value)
        .then(() => {
          isPlaying.value = true
          sendSongInfoToGlobalPlayer()
        })
        .catch(error => {
          if (error instanceof Error && error.message === 'PLAYBACK_DENIED') {
            return
          }
          logError('SimpleMusicPlayer', '恢复被打断歌曲失败', error)
        })
    } catch (error) {
      logError('SimpleMusicPlayer', '解析恢复播放事件失败', error)
    }
  }))
}

onMounted(() => {
  if (typeof window !== 'undefined' && playerRef.value) {
    const observer = useIntersectionObserver(
      playerRef,
      ([entry]) => {
        if (entry?.isIntersecting && !animationApplied.value) {
          isVisible.value = true
          animationApplied.value = true
          observer.stop()
        }
      },
      { threshold: 0.2, immediate: true }
    )
    stopVisibilityObserver.value = observer.stop
  }

  audioManager.registerPlayer(audioId.value)
  setupEventListeners()

  const currentSongInfo = audioManager.getCurrentSongInfo()
  if (currentSongInfo && currentSongInfo.id === audioId.value) {
    isPlaying.value = currentSongInfo.isPlaying
    currentTime.value = currentSongInfo.currentTime
    duration.value = currentSongInfo.duration
    progress.value = currentSongInfo.progress
    isAudioReady.value = true
    isLoading.value = false
  }

  void loadAudioSource()
})

onUnmounted(() => {
  clearDebounceTimer()
  clearDragListeners()
  stopVisibilityObserver.value?.()
  unsubscribers.forEach(unsubscribe => unsubscribe())
  audioManager.unregisterPlayer(audioId.value)
})

watch(
  () => [props.neteaseid, props.url, props.name, props.artist, props.cover] as const,
  () => {
    isPlaying.value = false
    resetVisualProgress()
    isLoading.value = true
    hasError.value = false
    isAudioReady.value = false
    audioManager.pauseCurrent(audioId.value)
    void loadAudioSource()
  }
)
</script>

<template>
  <div class="music-player" ref="playerRef" :class="{ 'dark-mode': isDark, 'animate-in': isVisible }">
    <!-- 网易云iframe播放器 -->
      <iframe v-if="useNetease" 
      class="netease-player"
      :class="{ 'animate-in': isVisible }"
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
      <div class="controls-container" :class="{ 'animate-in': isVisible }" style="--anim-delay: var(--lc-motion-duration-fast)">
        <div class="player-top">
          <!-- 歌曲信息 -->
          <div class="song-info">
            <!-- 标题容器 -->
            <div class="title-container">
              <!-- 歌曲标题骨架屏 -->
              <div v-if="isLoading && !songInfo.name" class="skeleton-title"></div>
              <h3 v-else class="song-title">
                <a v-if="neteaseLink" :href="neteaseLink" target="_blank" class="song-title-link">{{ songInfo.name }}</a>
                <span v-else>{{ songInfo.name }}</span>
              </h3>
            </div>
            
            <!-- 艺术家信息（适应性显示） -->
            <div class="artist-container">
              <!-- 艺术家骨架屏 -->
              <div v-if="isLoading && !songInfo.artist" class="skeleton-artist"></div>
              <span v-else class="song-artist">{{ songInfo.artist }}</span>
            </div>
          </div>
          
          <!-- 时间信息 -->
          <div class="time-info">
            <!-- 时间骨架屏 -->
            <div v-if="isLoading" class="skeleton-time"></div>
            <template v-else>
              <div class="time-display">
                <span class="current-time">{{ formattedCurrentTime }}</span>
                <span class="duration"> / {{ formattedDuration }}</span>
              </div>
            </template>
          </div>
        </div>
        
        <!-- 进度条 -->
        <div 
          class="progress-container lc-progress-root" 
          @click="setProgress" 
          @mousedown="startDrag"
          @touchstart="startDrag"
          :class="{ 'is-dragging': isDragging, 'is-disabled': !isAudioReady }"
        >
          <!-- 进度条骨架屏 -->
          <div v-if="isLoading" class="skeleton-progress">
            <div class="skeleton-pulse"></div>
          </div>
          <div v-else ref="progressBarRef" class="progress-bar lc-progress-bar">
            <div class="progress-current lc-progress-fill" :style="{ width: `${progress}%` }"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.music-player {
  margin: 0; /* 移除外边距，让父元素控制 */
  width: 100%;
  overflow: hidden;
  background-color: var(--vp-c-bg-soft);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  border-radius: 3px;
  opacity: 0;
  transform: translateY(16px);
  will-change: opacity, transform;
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
  animation: fadeInUp var(--lc-motion-duration-slow) var(--lc-motion-ease-standard) forwards;
  animation-delay: var(--anim-delay, 0s);
}

.cover-container,
.controls-container {
  opacity: 0;
  transform: translateY(16px);
}

.cover-container.animate-in,
.controls-container.animate-in,
.netease-player.animate-in {
  animation: fadeInUp var(--lc-motion-duration-slow) var(--lc-motion-ease-standard) forwards;
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
  animation: fadeIn var(--lc-motion-duration-normal) var(--lc-motion-ease-standard);
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
  animation: fadeIn var(--lc-motion-duration-fast) var(--lc-motion-ease-standard);
  touch-action: manipulation; /* 优化触摸行为 */
  -webkit-tap-highlight-color: transparent; /* 移除iOS触摸高亮 */
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
  animation: fadeIn var(--lc-motion-duration-fast) var(--lc-motion-ease-standard);
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
  position: relative;
}

.player-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: nowrap;
  position: relative;
  height: 36px; /* 固定高度以容纳两行文本 */
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
  display: block; /* 改为块级显示 */
  overflow: hidden; /* 防止内容溢出 */
}

.song-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%; /* 允许使用全宽 */
}

/* 艺术家信息容器 */
.artist-container {
  margin-top: -9px;
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
}

/* 时间信息样式 */
.time-info {
  position: absolute;
  top: 0;
  right: 0;
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
  opacity: 0.8;
  width: 55px; /* 固定宽度 */
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
  width: 28px; /* 固定宽度，容纳最长的时间格式 */
  text-align: right;
}

.duration {
  color: var(--vp-c-text-2);
  width: 31px; /* 固定宽度，容纳"/ 0:00"格式 */
  text-align: left;
}

/* 进度条样式 */
.progress-container {
  width: 100%;
  cursor: pointer;
  height: 20px; /* 固定高度 */
  display: flex;
  align-items: center;
  position: relative;
  touch-action: none;
  margin-top: auto; /* 推到底部 */
}

.progress-container.is-disabled {
  cursor: default;
  opacity: 0.7;
}

.progress-container.is-dragging {
  cursor: grabbing;
}

.progress-bar {
  width: 100%;
  touch-action: none;
}

.progress-current {
  height: 100%;
}

/* 拖动时禁用过渡效果 */
.is-dragging .progress-current {
  transition: none;
}

/* 响应式布局 */
@media (max-width: 480px) {
  .controls-container {
    padding: 8px 12px;
  }
}

/* 窄屏幕适配 - 不再需要之前的窄屏幕特殊处理，因为我们现在统一使用垂直布局 */
@media (max-width: 350px) {
  .song-info {
    padding-right: 50px; /* 为时间信息留出更少的空间 */
  }
  
  .time-info {
    width: 45px; /* 减小宽度 */
  }
}

/* 针对更窄屏幕的特别处理 */
@media (max-width: 290px) {
  .controls-container {
    padding: 12px 10px 8px; /* 减少内边距 */
  }
  
  .song-info {
    padding-right: 45px; /* 进一步减少右侧空间 */
  }
  
  .time-info {
    width: 40px; /* 进一步减小宽度 */
  }
}

/* 暗色模式适配 */
.dark-mode .controls-container {
  background-color: var(--vp-c-bg-soft);
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
</style> 
