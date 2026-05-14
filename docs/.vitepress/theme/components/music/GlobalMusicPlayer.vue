<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  audioManager,
  audioService,
  calculateProgressPercent,
  formatAudioTime,
  type SongInfo,
  type AudioSongInfo
} from '../../utils/music'
import { logError } from '../../utils/logger'

const AUTO_COLLAPSE_MS = 3000
const HOVER_COLLAPSE_MS = 2000
const RESET_ROTATION_MS = 800
const ROTATION_SPEED_DEG_PER_MS = 0.03

const currentSong = ref<SongInfo>({
  id: '',
  name: '',
  artist: '',
  cover: '',
  isPlaying: false,
  progress: 0,
  duration: 0,
  currentTime: 0
})

const isVisible = ref(false)
const isExpanded = ref(true)
const showCover = ref(true)
const isDragging = ref(false)
const isHovering = ref(false)
const isTouchDevice = ref(false)
const progressBarRef = ref<HTMLElement | null>(null)
const coverRotation = ref(0)
const rotationAnimationId = ref<number | null>(null)
const lastPausedRotation = ref(0)

const unsubscribers: Array<() => void> = []
let collapseTimer: ReturnType<typeof setTimeout> | null = null

interface LegacyNavigator extends Navigator {
  msMaxTouchPoints?: number
}

const formattedCurrentTime = computed(() => formatAudioTime(currentSong.value.currentTime))
const formattedDuration = computed(() => formatAudioTime(currentSong.value.duration))
const coverRotationStyle = computed(() => ({ transform: `rotate(${coverRotation.value}deg)` }))
const isMiniMode = computed(() => !showCover.value)

function clearCollapseTimer(): void {
  if (!collapseTimer) return
  clearTimeout(collapseTimer)
  collapseTimer = null
}

function clearDragListeners(): void {
  document.removeEventListener('mousemove', updateProgressFromEvent)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', updateProgressFromTouch)
  document.removeEventListener('touchend', stopDrag)
}

function setExpandedMode(): void {
  isExpanded.value = true
  showCover.value = true
}

function setCollapsedMode(): void {
  isExpanded.value = false
  showCover.value = true
}

function setMiniMode(): void {
  isExpanded.value = false
  showCover.value = false
}

function scheduleCollapse(delayMs: number): void {
  clearCollapseTimer()
  collapseTimer = setTimeout(() => {
    collapseTimer = null
    if (!currentSong.value.isPlaying) return
    setMiniMode()
  }, delayMs)
}

function pauseCurrentSong(): void {
  audioService.pause()
  audioManager.pauseCurrent(currentSong.value.id)
}

function startRotation(): void {
  if (rotationAnimationId.value) return

  const startTime = performance.now()
  const baseRotation = lastPausedRotation.value
  coverRotation.value = baseRotation

  const animate = (now: number) => {
    const elapsed = now - startTime
    coverRotation.value = (baseRotation + elapsed * ROTATION_SPEED_DEG_PER_MS) % 360
    rotationAnimationId.value = requestAnimationFrame(animate)
  }

  rotationAnimationId.value = requestAnimationFrame(animate)
}

function stopRotation(): void {
  if (!rotationAnimationId.value) return
  cancelAnimationFrame(rotationAnimationId.value)
  rotationAnimationId.value = null
  lastPausedRotation.value = coverRotation.value
}

function resetRotation(): void {
  stopRotation()
  const startRotation = coverRotation.value
  const startTime = performance.now()

  const animateReset = (now: number) => {
    const progress = Math.min((now - startTime) / RESET_ROTATION_MS, 1)
    const easedProgress = 1 - Math.pow(1 - progress, 3)
    coverRotation.value = startRotation * (1 - easedProgress)
    if (progress < 1) {
      requestAnimationFrame(animateReset)
      return
    }
    coverRotation.value = 0
    lastPausedRotation.value = 0
  }

  requestAnimationFrame(animateReset)
}

function buildPlayableSongInfo(): AudioSongInfo {
  return {
    name: currentSong.value.name,
    artist: currentSong.value.artist,
    cover: currentSong.value.cover,
    url: ''
  }
}

function togglePlay(): void {
  if (isMiniMode.value || !currentSong.value.id) return

  if (currentSong.value.isPlaying) {
    pauseCurrentSong()
    stopRotation()
    clearCollapseTimer()
    return
  }

  const requestContext = audioManager.getCurrentRequest() ?? {
    source: 'global-player',
    priority: 1,
    allowInterrupt: true,
    resumeInterrupted: true
  }

  void audioService.play(
    currentSong.value.id,
    buildPlayableSongInfo(),
    currentSong.value.currentTime,
    requestContext
  )
    .then(() => {
      startRotation()
      scheduleCollapse(AUTO_COLLAPSE_MS)
    })
    .catch(error => {
      logError('GlobalMusicPlayer', '播放失败', error)
    })
}

function isTouchInteraction(event?: Event): boolean {
  if (!event) return isTouchDevice.value
  const pointerType = event instanceof PointerEvent ? event.pointerType : undefined
  return event.type === 'touchend' || pointerType === 'touch'
}

function toggleExpand(event?: Event): void {
  if (isTouchInteraction(event)) {
    if (!isExpanded.value || isMiniMode.value) {
      setExpandedMode()
      if (currentSong.value.isPlaying) scheduleCollapse(AUTO_COLLAPSE_MS)
      return
    }
    setMiniMode()
    return
  }

  if (isMiniMode.value || !isExpanded.value) {
    setExpandedMode()
    if (currentSong.value.isPlaying) scheduleCollapse(AUTO_COLLAPSE_MS)
    return
  }

  setMiniMode()
}

function handlePlayerMouseEnter(): void {
  clearCollapseTimer()
  if (isMiniMode.value) {
    setCollapsedMode()
  }
}

function handlePlayerMouseLeave(): void {
  if (currentSong.value.isPlaying) {
    scheduleCollapse(HOVER_COLLAPSE_MS)
  }
}

function handleMouseEnter(): void {
  isHovering.value = true
}

function handleMouseLeave(): void {
  isHovering.value = false
}

function closePlayer(): void {
  isVisible.value = false
  clearCollapseTimer()

  if (currentSong.value.isPlaying) {
    pauseCurrentSong()
  }

  audioManager.emit('player-closed', currentSong.value.id)
  setExpandedMode()
  resetRotation()
}

function setProgress(event: MouseEvent): void {
  if (!currentSong.value.id || !currentSong.value.isPlaying || isDragging.value) return
  const progressBar = progressBarRef.value ?? (event.currentTarget as HTMLElement | null)
  if (!progressBar) return
  const percent = calculateProgressPercent(event, progressBar)
  audioService.seek(percent * currentSong.value.duration)
}

function updateProgressFromEvent(event: MouseEvent): void {
  if (!isDragging.value || !progressBarRef.value || !currentSong.value.id) return
  const percent = calculateProgressPercent(event, progressBarRef.value)
  currentSong.value.progress = percent * 100
}

function updateProgressFromTouch(event: TouchEvent): void {
  if (!isDragging.value || !progressBarRef.value || !currentSong.value.id) return
  event.preventDefault()
  const percent = calculateProgressPercent(event, progressBarRef.value)
  currentSong.value.progress = percent * 100
}

function startDrag(event: MouseEvent | TouchEvent): void {
  if (!currentSong.value.id || !currentSong.value.isPlaying) return
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
  clearDragListeners()
  if (!isDragging.value || !currentSong.value.id) return

  isDragging.value = false
  const newTime = (currentSong.value.progress / 100) * currentSong.value.duration
  audioService.seek(newTime)
}

function detectTouchDevice(): void {
  const legacyNavigator = navigator as LegacyNavigator
  isTouchDevice.value = 'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (legacyNavigator.msMaxTouchPoints ?? 0) > 0
}

function syncWithStoredSong(): void {
  const songInfo = audioManager.getCurrentSongInfo()
  if (!songInfo) {
    isVisible.value = false
    return
  }

  currentSong.value = songInfo
  isVisible.value = songInfo.isPlaying

  if (songInfo.isPlaying) {
    startRotation()
    scheduleCollapse(AUTO_COLLAPSE_MS)
  }
}

function parsePlayState(data: string): { id: string; isPlaying: boolean } | null {
  const [id, state] = data.split(':')
  if (!id || state === undefined) return null
  return { id, isPlaying: state === 'true' }
}

function parseProgressData(data: string): { id: string; currentTime: number; duration?: number } | null {
  const [id, currentTimeText, durationText] = data.split(':')
  if (!id || !currentTimeText) return null
  const currentTime = Number.parseFloat(currentTimeText)
  if (Number.isNaN(currentTime)) return null
  const duration = durationText !== undefined ? Number.parseFloat(durationText) : undefined
  return {
    id,
    currentTime,
    duration: duration !== undefined && !Number.isNaN(duration) ? duration : undefined
  }
}

function setupEventListeners(): void {
  unsubscribers.push(
    audioManager.on('song-info-update', data => {
      try {
        const songInfo = JSON.parse(data) as SongInfo
        const isNewSong = currentSong.value.id !== songInfo.id
        currentSong.value = { ...currentSong.value, ...songInfo }

        if (!songInfo.id) return
        if (songInfo.isPlaying) {
          isVisible.value = true
          if (isNewSong) setExpandedMode()
          scheduleCollapse(AUTO_COLLAPSE_MS)
          return
        }

        clearCollapseTimer()
      } catch (error) {
        logError('GlobalMusicPlayer', '解析歌曲信息失败', error)
      }
    })
  )

  unsubscribers.push(
    audioManager.on('progress-update', data => {
      if (isDragging.value) return
      const parsed = parseProgressData(data)
      if (!parsed || parsed.id !== currentSong.value.id) return

      currentSong.value.currentTime = parsed.currentTime
      if (parsed.duration !== undefined && parsed.duration > 0) {
        currentSong.value.duration = parsed.duration
      }

      currentSong.value.progress = currentSong.value.duration > 0
        ? (currentSong.value.currentTime / currentSong.value.duration) * 100
        : 0
    })
  )

  unsubscribers.push(
    audioManager.on('play-state-change', data => {
      const parsed = parsePlayState(data)
      if (!parsed || parsed.id !== currentSong.value.id) return

      const previousState = currentSong.value.isPlaying
      currentSong.value.isPlaying = parsed.isPlaying

      if (parsed.isPlaying) {
        isVisible.value = true
        startRotation()
        scheduleCollapse(AUTO_COLLAPSE_MS)
        return
      }

      if (previousState) {
        clearCollapseTimer()
        stopRotation()
      }
    })
  )

  unsubscribers.push(
    audioManager.on('song-ended', id => {
      if (id !== currentSong.value.id) return
      currentSong.value.isPlaying = false
      clearCollapseTimer()
      resetRotation()
    })
  )

  unsubscribers.push(
    audioManager.on('current-audio-changed', id => {
      if (!id || id === currentSong.value.id) return
      const songInfo = audioManager.getCurrentSongInfo()
      if (!songInfo) return

      resetRotation()
      currentSong.value = songInfo
      isVisible.value = true
      setExpandedMode()

      if (songInfo.isPlaying) {
        startRotation()
        scheduleCollapse(AUTO_COLLAPSE_MS)
      }
    })
  )
}

onMounted(() => {
  detectTouchDevice()
  window.addEventListener('resize', detectTouchDevice)
  setupEventListeners()
  syncWithStoredSong()
})

onUnmounted(() => {
  unsubscribers.forEach(unsubscribe => unsubscribe())
  clearCollapseTimer()
  clearDragListeners()
  stopRotation()
  window.removeEventListener('resize', detectTouchDevice)
})
</script>

<template>
  <Transition name="slide-fade">
    <div v-if="isVisible" class="global-music-player" 
      :class="{ 'expanded': isExpanded, 'mini-mode': isMiniMode, 'touch-device': isTouchDevice }" 
      @mouseenter="handlePlayerMouseEnter" @mouseleave="handlePlayerMouseLeave">
      <!-- 封面区域 - 在二级和一级折叠状态下显示 -->
      <div v-if="showCover" class="cover-section" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave">
        <div class="cover-container" @click="togglePlay">
          <div class="rotating-cover" :style="coverRotationStyle">
            <img v-if="currentSong.cover" :src="currentSong.cover" :alt="currentSong.name" class="cover-image" />
            <div v-else class="cover-placeholder">
              <div class="music-note">♪</div>
            </div>
          </div>
          
          <!-- 播放按钮 - 在暂停时显示 -->
          <div v-if="!currentSong.isPlaying" class="play-overlay">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </div>
          
          <!-- 暂停按钮 - 在播放且鼠标悬停时显示 -->
          <div v-if="currentSong.isPlaying && isHovering" class="pause-overlay">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="6" y1="4" x2="6" y2="20"></line>
              <line x1="18" y1="4" x2="18" y2="20"></line>
            </svg>
          </div>
        </div>
      </div>
      
      <!-- 控制按钮区域 - 收起状态 -->
      <div v-if="!isExpanded" class="controls-panel collapsed">
        <button class="control-btn expand-btn" @click="toggleExpand" @touchend.prevent="toggleExpand($event)" aria-label="展开">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
        <button class="control-btn close-btn" @click="closePlayer" @touchend.prevent="closePlayer" aria-label="关闭">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- 详细信息区域 - 只在一级折叠（完全展开）状态下显示 -->
      <div v-if="isExpanded" class="player-detail">
        <!-- 歌曲信息和进度条 -->
        <div class="song-info">
          <div class="song-title-row">
            <div class="song-name">{{ currentSong.name || '未知歌曲' }}</div>
            <div class="time-readout">
              <span class="current-time">{{ formattedCurrentTime }}</span>
              <span class="duration">/ {{ formattedDuration }}</span>
            </div>
          </div>
          
          <div class="song-artist">{{ currentSong.artist || '未知艺术家' }}</div>
          
          <!-- 进度条 -->
          <div 
            ref="progressBarRef"
            class="global-progress-bar" 
            :class="{ 'disabled': !currentSong.isPlaying }"
            @click="setProgress"
            @mousedown="startDrag"
            @touchstart="startDrag"
          >
            <div class="progress-bg"></div>
            <div class="progress-fill" :style="{ width: `${currentSong.progress}%` }"></div>
            <div class="progress-handle" :style="{ left: `${currentSong.progress}%` }" :class="{ 'visible': isDragging || currentSong.isPlaying }"></div>
          </div>
        </div>
      </div>

      <!-- 控制按钮区域 - 展开状态 -->
      <div v-if="isExpanded" class="controls-panel expanded">
        <button class="control-btn collapse-btn" @click="toggleExpand" @touchend.prevent="toggleExpand($event)" aria-label="收起">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <button class="control-btn close-btn" @click="closePlayer" @touchend.prevent="closePlayer" aria-label="关闭">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.global-music-player {
  position: fixed;
  left: 0;
  bottom: 80px;
  background-color: var(--vp-c-bg-soft);
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 100;
  overflow: hidden;
  transition:
    width var(--lc-motion-duration-normal) var(--lc-motion-ease-emphasis),
    opacity var(--lc-motion-duration-normal) var(--lc-motion-ease-out),
    transform var(--lc-motion-duration-normal) var(--lc-motion-ease-out);
  display: flex;
  flex-direction: row;
  height: 60px;
  user-select: none;
  will-change: width;
}

.global-music-player:not(.expanded) {
  width: 86px;
}

.global-music-player.mini-mode {
  width: 26px;
}

.global-music-player.expanded {
  width: 280px;
}

.global-music-player.touch-device .control-btn {
  width: 24px;
  height: 24px;
  padding: 4px;
}

.global-music-player.touch-device.mini-mode .controls-panel.collapsed {
  width: 30px;
  padding: 0 2px;
}

.global-music-player.touch-device .control-btn:hover {
  transform: none;
  background-color: transparent;
}

.global-music-player.touch-device .control-btn:active {
  transform: scale(0.9);
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
  transition: transform var(--lc-motion-duration-slower) var(--lc-motion-ease-spring);
  will-change: transform; /* 提示浏览器优化变换 */
}

/* 移除唱片中心点样式 */
/* .rotating-cover::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  background-color: var(--vp-c-bg-soft);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 0 2px var(--vp-c-divider);
  z-index: 2;
} */

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
  transition: opacity var(--lc-motion-duration-fast) var(--lc-motion-ease-standard);
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

/* 控制按钮区域 */
.controls-panel {
  background-color: var(--vp-c-bg-alt);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.controls-panel.collapsed {
  width: 26px;
  height: 100%;
  justify-content: center;
  gap: 8px;
}

.controls-panel.expanded {
  width: 26px;
  height: 100%;
  justify-content: center;
  gap: 8px;
}

.control-btn {
  background: transparent;
  border: none;
  color: var(--vp-c-text-2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--lc-motion-duration-fast) var(--lc-motion-ease-standard);
  width: 20px;
  height: 20px;
  padding: 0;
  margin: 0 auto;
  border-radius: 2px;
  -webkit-tap-highlight-color: transparent;
}

.control-btn:hover {
  background-color: var(--vp-c-bg-mute);
  color: var(--vp-c-text-1);
  transform: scale(1.1);
}

.control-btn:active {
  transform: scale(0.95);
}

/* 详细信息区域 */
.player-detail {
  flex-grow: 1;
  padding: 8px 12px;
  display: flex;
  flex-direction: row;
  align-items: center;
  animation: slide-in-right var(--lc-motion-duration-normal) var(--lc-motion-ease-out);
  height: 100%;
  position: relative;
  min-width: 0;
  overflow: hidden;
}

@keyframes slide-in-right {
  from {
    transform: translateX(-20px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.song-info {
  flex: 1;
  min-width: 0;
  width: 100%;
  overflow: hidden;
}

.song-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: -6px;
  position: relative;
}

.song-name {
  font-weight: 500;
  color: var(--vp-c-text-1);
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
  padding-right: 60px;
  user-select: none;
}

.song-artist {
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  user-select: none;
  margin-right: 5px;
}

.time-readout {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  align-items: center;
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
  opacity: 0.8;
  width: 55px;
  text-align: right;
  white-space: nowrap;
  user-select: none;
}

.global-progress-bar {
  height: 3px;
  position: relative;
  cursor: pointer;
  touch-action: none;
  width: 100%;
  margin-bottom: 6px;
  margin-left: 0;
  z-index: 2;
  padding: 8px 0;
}

.global-progress-bar.disabled {
  cursor: default;
  opacity: 0.7;
}

.progress-bg {
  position: absolute;
  top: 8px;
  left: 0;
  right: 0;
  height: 3px;
  background-color: var(--vp-c-bg-alt);
  border-radius: 2px;
}

.progress-fill {
  position: absolute;
  top: 8px;
  left: 0;
  height: 3px;
  background-color: var(--vp-c-brand);
  border-radius: 2px;
  transition: width var(--lc-motion-duration-instant) linear;
}

.progress-handle {
  position: absolute;
  top: 50%;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--vp-c-brand);
  transform: translate(-50%, -50%);
  display: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
}


.global-progress-bar:not(.disabled):hover .progress-handle,
.progress-handle.visible {
  display: block;
}

.current-time {
  color: var(--vp-c-brand);
  margin-right: 2px;
}

/* 动画 */
.slide-fade-enter-active {
  transition: all var(--lc-motion-duration-normal) var(--lc-motion-ease-out);
}

.slide-fade-leave-active {
  transition: all var(--lc-motion-duration-normal) var(--lc-motion-ease-back);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(-60px);
  opacity: 0;
}

@media (max-width: 768px) {
  .global-music-player {
    bottom: 20px;
  }
  
  .global-music-player.expanded {
    width: 260px;
  }
  
  .player-detail {
    padding: 8px 10px;
  }
}

@media (max-width: 370px) {
  .global-music-player.expanded {
    width: 260px;
  }
  
  .player-detail {
    padding: 8px 6px;
  }
}
</style> 
