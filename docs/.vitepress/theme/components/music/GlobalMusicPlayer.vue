<script setup lang="ts">
/**
 * GlobalMusicPlayer.vue：
 * 全局悬浮音乐播放器，负责播放状态展示、折叠交互和会话流控制。
 */

import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  audioManager,
  audioService,
  calculateProgressPercent,
  fetchTrackLyric,
  formatAudioTime,
  playNextFromFlow,
  stopFlow,
  type AudioSongInfo,
  type MusicFlowState,
  type MusicLyricLine,
  type SongInfo
} from '../../utils/music'
import { logError } from '../../utils/logger'

const AUTO_COLLAPSE_MS = 5000
const PANEL_GAP = 8
const MOBILE_BREAKPOINT = 768
const VOLUME_STORAGE_KEY = 'lycan:global-player-volume'
const POSITION_STORAGE_KEY = 'lycan:global-player-position'

type PanelMode = 'mini' | 'collapsed' | 'expanded'

const playerRef = ref<HTMLElement | null>(null)
const progressBarRef = ref<HTMLElement | null>(null)
const isTouchDevice = ref(false)
const isNarrowScreen = ref(false)
const isVisible = ref(false)
const panelMode = ref<PanelMode>('collapsed')
const isHoveringDetail = ref(false)
const isDraggingProgress = ref(false)
const lyricLines = ref<MusicLyricLine[]>([])
const currentLyricIndex = ref(-1)
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
const volume = ref(70)
const coverResetVersion = ref(0)
const position = ref({ x: 0, y: 0, side: 'left' as 'left' | 'right' })

const unsubscribers: Array<() => void> = []
let collapseTimer: ReturnType<typeof setTimeout> | null = null
let dragTimer: ReturnType<typeof setTimeout> | null = null
let resizeHandler: (() => void) | null = null
let isDraggingPanel = false
let panelPointerOffsetX = 0
let panelPointerOffsetY = 0
let draggedInGesture = false
let suppressClickUntil = 0

const isExpanded = computed(() => panelMode.value === 'expanded')
const showCover = computed(() => panelMode.value !== 'mini')
const showCloseButton = computed(() => isExpanded.value)
const formattedCurrentTime = computed(() => formatAudioTime(currentSong.value.currentTime))
const formattedDuration = computed(() => formatAudioTime(currentSong.value.duration))
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

const panelStyle = computed(() => ({
  left: `${position.value.x}px`,
  top: `${position.value.y}px`
}))

function clearCollapseTimer(): void {
  if (!collapseTimer) return
  clearTimeout(collapseTimer)
  collapseTimer = null
}

function clearDragTimer(): void {
  if (!dragTimer) return
  clearTimeout(dragTimer)
  dragTimer = null
}

function scheduleCollapse(): void {
  clearCollapseTimer()
  if (isTouchDevice.value || !isExpanded.value) return
  collapseTimer = setTimeout(() => {
    collapseTimer = null
    if (isHoveringDetail.value || !isExpanded.value) return
    panelMode.value = isNarrowScreen.value ? 'mini' : 'collapsed'
    ensurePanelInViewport()
  }, AUTO_COLLAPSE_MS)
}

function loadVolumePreference(): void {
  if (typeof window === 'undefined') return
  const raw = window.localStorage.getItem(VOLUME_STORAGE_KEY)
  const parsed = Number.parseInt(raw || '', 10)
  if (!Number.isNaN(parsed)) {
    volume.value = Math.max(0, Math.min(parsed, 100))
  }
  audioService.setVolume(volume.value)
}

function saveVolumePreference(): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(VOLUME_STORAGE_KEY, String(volume.value))
}

function onVolumeInput(event: Event): void {
  const target = event.target as HTMLInputElement | null
  if (!target) return
  const nextValue = Number.parseInt(target.value, 10)
  if (Number.isNaN(nextValue)) return
  volume.value = Math.max(0, Math.min(nextValue, 100))
  audioService.setVolume(volume.value)
  saveVolumePreference()
}

function detectDeviceState(): void {
  const legacyNavigator = navigator as Navigator & { msMaxTouchPoints?: number }
  isTouchDevice.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || (legacyNavigator.msMaxTouchPoints ?? 0) > 0
  isNarrowScreen.value = window.innerWidth <= MOBILE_BREAKPOINT
}

function getPanelSize(mode: PanelMode): { width: number; height: number } {
  if (mode === 'mini') {
    return { width: 40, height: 64 }
  }
  if (mode === 'collapsed') {
    return { width: 98, height: 64 }
  }
  return { width: isNarrowScreen.value ? 346 : 382, height: 118 }
}

function defaultModeByDevice(): PanelMode {
  if (isTouchDevice.value || isNarrowScreen.value) {
    return 'mini'
  }
  return 'collapsed'
}

function clampPanelPosition(nextX: number, nextY: number, mode: PanelMode): { x: number; y: number } {
  const size = getPanelSize(mode)
  const maxX = Math.max(PANEL_GAP, window.innerWidth - size.width - PANEL_GAP)
  const maxY = Math.max(PANEL_GAP, window.innerHeight - size.height - PANEL_GAP)
  return {
    x: Math.min(Math.max(PANEL_GAP, nextX), maxX),
    y: Math.min(Math.max(PANEL_GAP, nextY), maxY)
  }
}

function savePanelPosition(): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(position.value))
}

function loadPanelPosition(mode: PanelMode): void {
  if (typeof window === 'undefined') return
  const raw = window.localStorage.getItem(POSITION_STORAGE_KEY)
  if (!raw) {
    const size = getPanelSize(mode)
    const initialY = Math.max(PANEL_GAP, window.innerHeight - size.height - 92)
    position.value = { x: PANEL_GAP, y: initialY, side: 'left' }
    return
  }

  try {
    const parsed = JSON.parse(raw) as { x?: number; y?: number; side?: 'left' | 'right' }
    const clamped = clampPanelPosition(Number(parsed.x ?? PANEL_GAP), Number(parsed.y ?? PANEL_GAP), mode)
    position.value = {
      x: clamped.x,
      y: clamped.y,
      side: parsed.side === 'right' ? 'right' : 'left'
    }
  } catch {
    const size = getPanelSize(mode)
    const initialY = Math.max(PANEL_GAP, window.innerHeight - size.height - 92)
    position.value = { x: PANEL_GAP, y: initialY, side: 'left' }
  }
}

function ensurePanelInViewport(): void {
  const clamped = clampPanelPosition(position.value.x, position.value.y, panelMode.value)
  position.value = { ...position.value, x: clamped.x, y: clamped.y }
  savePanelPosition()
}

function snapToHorizontalEdge(): void {
  const size = getPanelSize(panelMode.value)
  const centerX = position.value.x + size.width / 2
  const snapRight = centerX > window.innerWidth / 2
  const targetX = snapRight
    ? Math.max(PANEL_GAP, window.innerWidth - size.width - PANEL_GAP)
    : PANEL_GAP
  const clamped = clampPanelPosition(targetX, position.value.y, panelMode.value)
  position.value = {
    x: clamped.x,
    y: clamped.y,
    side: snapRight ? 'right' : 'left'
  }
  savePanelPosition()
}

function pointerFromEvent(event: MouseEvent | TouchEvent): { x: number; y: number } | null {
  if (event instanceof MouseEvent) {
    return { x: event.clientX, y: event.clientY }
  }
  const touch = event.touches?.[0] || event.changedTouches?.[0]
  if (!touch) return null
  return { x: touch.clientX, y: touch.clientY }
}

function shouldBlockDragStart(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return Boolean(target.closest('[data-control="true"]'))
}

function startPanelDrag(event: MouseEvent | TouchEvent): void {
  if (!isVisible.value) return
  if (shouldBlockDragStart(event.target)) return
  const pointer = pointerFromEvent(event)
  if (!pointer) return

  isDraggingPanel = true
  draggedInGesture = false
  const rect = playerRef.value?.getBoundingClientRect()
  panelPointerOffsetX = pointer.x - (rect?.left ?? position.value.x)
  panelPointerOffsetY = pointer.y - (rect?.top ?? position.value.y)

  clearCollapseTimer()

  if (event instanceof MouseEvent) {
    document.addEventListener('mousemove', onPanelDragMove)
    document.addEventListener('mouseup', endPanelDrag)
    return
  }

  document.addEventListener('touchmove', onPanelDragTouchMove, { passive: false })
  document.addEventListener('touchend', endPanelDrag)
}

function onPanelDragMove(event: MouseEvent): void {
  if (!isDraggingPanel) return
  const nextX = event.clientX - panelPointerOffsetX
  const nextY = event.clientY - panelPointerOffsetY
  const clamped = clampPanelPosition(nextX, nextY, panelMode.value)
  position.value = { ...position.value, x: clamped.x, y: clamped.y }
  draggedInGesture = true
}

function onPanelDragTouchMove(event: TouchEvent): void {
  if (!isDraggingPanel) return
  const pointer = pointerFromEvent(event)
  if (!pointer) return
  event.preventDefault()
  const nextX = pointer.x - panelPointerOffsetX
  const nextY = pointer.y - panelPointerOffsetY
  const clamped = clampPanelPosition(nextX, nextY, panelMode.value)
  position.value = { ...position.value, x: clamped.x, y: clamped.y }
  draggedInGesture = true
}

function endPanelDrag(): void {
  document.removeEventListener('mousemove', onPanelDragMove)
  document.removeEventListener('mouseup', endPanelDrag)
  document.removeEventListener('touchmove', onPanelDragTouchMove)
  document.removeEventListener('touchend', endPanelDrag)

  if (!isDraggingPanel) return
  isDraggingPanel = false

  if (draggedInGesture) {
    suppressClickUntil = Date.now() + 160
    snapToHorizontalEdge()
  }

  draggedInGesture = false
  scheduleCollapse()
}

function blockClickAfterDrag(): boolean {
  return Date.now() < suppressClickUntil
}

function resetCoverRotation(): void {
  coverResetVersion.value += 1
}

function buildPlayableSongInfo(): AudioSongInfo {
  return {
    name: currentSong.value.name,
    artist: currentSong.value.artist,
    cover: currentSong.value.cover,
    url: ''
  }
}

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
  return {
    source: source || 'global-player',
    priority: 3,
    allowInterrupt: true,
    resumeInterrupted: false
  }
}

function resolveSongId(rawId: string): string {
  if (!rawId) return ''
  return rawId.startsWith('netease-') ? rawId.slice('netease-'.length) : rawId
}

function updateLyricCursor(currentTimeSec: number): void {
  if (!lyricLines.value.length) {
    currentLyricIndex.value = -1
    return
  }

  const currentMs = Math.max(0, Math.floor(currentTimeSec * 1000))
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
  const targetId = resolveSongId(songId)
  lyricLines.value = []
  currentLyricIndex.value = -1
  if (!targetId) return

  try {
    const lyric = await fetchTrackLyric(targetId)
    if (!lyric?.hasLyric || !lyric.lines.length) {
      return
    }
    lyricLines.value = lyric.lines
    updateLyricCursor(currentSong.value.currentTime)
  } catch (error) {
    logError('GlobalMusicPlayer', '加载歌词失败', { songId: targetId, error })
  }
}

async function playFromFlowState(state: MusicFlowState): Promise<void> {
  if (!state.current) {
    currentSong.value.isPlaying = false
    resetCoverRotation()
    return
  }

  const nextAudioId = `netease-${state.current.id}`
  currentSong.value = {
    id: nextAudioId,
    name: state.current.name,
    artist: state.current.artist,
    cover: state.current.cover,
    isPlaying: false,
    progress: 0,
    duration: 0,
    currentTime: 0
  }
  isVisible.value = true

  await audioService.play(
    nextAudioId,
    {
      name: state.current.name,
      artist: state.current.artist,
      cover: state.current.cover,
      url: state.current.url || ''
    },
    0,
    playbackRequestBySource(state.current.source)
  )

  await loadLyricForCurrentSong(nextAudioId)
}

async function handleNextSong(): Promise<void> {
  if (blockClickAfterDrag()) return
  try {
    const state = await playNextFromFlow()
    await playFromFlowState(state)
    scheduleCollapse()
  } catch (error) {
    logError('GlobalMusicPlayer', '下一首失败', error)
  }
}

async function closePlayer(): Promise<void> {
  if (blockClickAfterDrag()) return
  try {
    await stopFlow()
  } catch (error) {
    logError('GlobalMusicPlayer', '停止播放流失败', error)
  }

  audioService.pause()
  audioManager.pauseCurrent(currentSong.value.id)
  audioManager.emit('player-closed', '')

  isVisible.value = false
  currentSong.value = {
    id: '',
    name: '',
    artist: '',
    cover: '',
    isPlaying: false,
    progress: 0,
    duration: 0,
    currentTime: 0
  }
  lyricLines.value = []
  currentLyricIndex.value = -1
  clearCollapseTimer()
  panelMode.value = defaultModeByDevice()
  resetCoverRotation()
}

function togglePlay(): void {
  if (blockClickAfterDrag() || !currentSong.value.id) return
  if (currentSong.value.isPlaying) {
    audioService.pause()
    audioManager.pauseCurrent(currentSong.value.id)
    clearCollapseTimer()
    return
  }

  const requestContext = audioManager.getCurrentRequest() ?? {
    source: 'global-player',
    priority: 3,
    allowInterrupt: true,
    resumeInterrupted: false
  }

  void audioService.play(
    currentSong.value.id,
    buildPlayableSongInfo(),
    currentSong.value.currentTime,
    requestContext
  ).then(() => {
    scheduleCollapse()
  }).catch(error => {
    logError('GlobalMusicPlayer', '恢复播放失败', error)
  })
}

function expandPanel(): void {
  if (panelMode.value === 'expanded') return
  panelMode.value = 'expanded'
  nextTick(() => ensurePanelInViewport())
  scheduleCollapse()
}

function collapsePanel(): void {
  panelMode.value = isNarrowScreen.value ? 'mini' : 'collapsed'
  nextTick(() => ensurePanelInViewport())
  clearCollapseTimer()
}

function onExpandButton(): void {
  if (blockClickAfterDrag()) return
  if (panelMode.value !== 'expanded') {
    expandPanel()
    return
  }
  collapsePanel()
}

function onDetailEnter(): void {
  isHoveringDetail.value = true
  clearCollapseTimer()
}

function onDetailLeave(): void {
  isHoveringDetail.value = false
  scheduleCollapse()
}

function setProgress(event: MouseEvent): void {
  if (!currentSong.value.id || !currentSong.value.duration) return
  const progressBar = progressBarRef.value ?? (event.currentTarget as HTMLElement | null)
  if (!progressBar) return
  const percent = calculateProgressPercent(event, progressBar)
  audioService.seek(percent * currentSong.value.duration)
}

function startProgressDrag(event: MouseEvent | TouchEvent): void {
  if (!currentSong.value.id || !currentSong.value.duration) return
  isDraggingProgress.value = true

  if (event.type === 'touchstart') {
    document.addEventListener('touchmove', updateProgressFromTouch, { passive: false })
    document.addEventListener('touchend', stopProgressDrag)
    updateProgressFromTouch(event as TouchEvent)
    return
  }

  document.addEventListener('mousemove', updateProgressFromMouse)
  document.addEventListener('mouseup', stopProgressDrag)
  updateProgressFromMouse(event as MouseEvent)
}

function updateProgressFromMouse(event: MouseEvent): void {
  if (!isDraggingProgress.value || !progressBarRef.value) return
  const percent = calculateProgressPercent(event, progressBarRef.value)
  currentSong.value.progress = percent * 100
}

function updateProgressFromTouch(event: TouchEvent): void {
  if (!isDraggingProgress.value || !progressBarRef.value) return
  event.preventDefault()
  const percent = calculateProgressPercent(event, progressBarRef.value)
  currentSong.value.progress = percent * 100
}

function stopProgressDrag(): void {
  document.removeEventListener('mousemove', updateProgressFromMouse)
  document.removeEventListener('mouseup', stopProgressDrag)
  document.removeEventListener('touchmove', updateProgressFromTouch)
  document.removeEventListener('touchend', stopProgressDrag)

  if (!isDraggingProgress.value || !currentSong.value.duration) return
  isDraggingProgress.value = false
  const targetTime = (currentSong.value.progress / 100) * currentSong.value.duration
  audioService.seek(targetTime)
}

function setupEventListeners(): void {
  unsubscribers.push(
    audioManager.on('song-info-update', data => {
      try {
        const incoming = JSON.parse(data) as SongInfo
        const changedSong = incoming.id && incoming.id !== currentSong.value.id
        currentSong.value = { ...currentSong.value, ...incoming }

        if (!incoming.id) return
        if (changedSong) {
          resetCoverRotation()
          void loadLyricForCurrentSong(incoming.id)
          isVisible.value = true
          if (panelMode.value !== 'expanded') {
            panelMode.value = defaultModeByDevice()
          }
          nextTick(() => ensurePanelInViewport())
        }

        if (incoming.isPlaying) {
          scheduleCollapse()
        }
      } catch (error) {
        logError('GlobalMusicPlayer', '解析歌曲信息失败', error)
      }
    })
  )

  unsubscribers.push(
    audioManager.on('progress-update', data => {
      if (isDraggingProgress.value) return
      const [id, currentTimeText, durationText] = data.split(':')
      if (!id || id !== currentSong.value.id) return

      const currentTime = Number.parseFloat(currentTimeText)
      const duration = Number.parseFloat(durationText)
      if (!Number.isNaN(currentTime)) {
        currentSong.value.currentTime = currentTime
      }
      if (!Number.isNaN(duration) && duration > 0) {
        currentSong.value.duration = duration
      }

      currentSong.value.progress = currentSong.value.duration > 0
        ? (currentSong.value.currentTime / currentSong.value.duration) * 100
        : 0
      updateLyricCursor(currentSong.value.currentTime)
    })
  )

  unsubscribers.push(
    audioManager.on('play-state-change', data => {
      const [id, state] = data.split(':')
      if (!id || id !== currentSong.value.id) return
      const isPlaying = state === 'true'
      currentSong.value.isPlaying = isPlaying
      if (isPlaying) {
        isVisible.value = true
        scheduleCollapse()
        return
      }
      clearCollapseTimer()
    })
  )

  unsubscribers.push(
    audioManager.on('song-ended', id => {
      if (!id || id !== currentSong.value.id) return
      currentSong.value.isPlaying = false
      clearCollapseTimer()
      resetCoverRotation()
      void handleNextSong()
    })
  )

  unsubscribers.push(
    audioManager.on('current-audio-changed', id => {
      if (!id || id === currentSong.value.id) return
      resetCoverRotation()
      const info = audioManager.getCurrentSongInfo()
      if (!info) return
      currentSong.value = info
      isVisible.value = true
      if (panelMode.value !== 'expanded') {
        panelMode.value = defaultModeByDevice()
      }
      void loadLyricForCurrentSong(info.id)
      nextTick(() => ensurePanelInViewport())
    })
  )
}

function syncWithStoredSong(): void {
  const songInfo = audioManager.getCurrentSongInfo()
  if (!songInfo || !songInfo.id) {
    isVisible.value = false
    return
  }
  currentSong.value = songInfo
  isVisible.value = true
  void loadLyricForCurrentSong(songInfo.id)
  scheduleCollapse()
}

watch(panelMode, () => {
  nextTick(() => ensurePanelInViewport())
})

onMounted(() => {
  detectDeviceState()
  panelMode.value = defaultModeByDevice()
  loadPanelPosition(panelMode.value)
  loadVolumePreference()
  setupEventListeners()
  syncWithStoredSong()

  const onResize = () => {
    detectDeviceState()
    if (isTouchDevice.value && panelMode.value === 'collapsed') {
      panelMode.value = 'mini'
    }
    if (!isTouchDevice.value && !isNarrowScreen.value && panelMode.value === 'mini') {
      panelMode.value = 'collapsed'
    }
    clearDragTimer()
    dragTimer = setTimeout(() => {
      dragTimer = null
      ensurePanelInViewport()
    }, 80)
  }
  resizeHandler = onResize
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  unsubscribers.forEach(unsubscribe => unsubscribe())
  clearCollapseTimer()
  clearDragTimer()
  stopProgressDrag()
  endPanelDrag()
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler)
  }
})
</script>

<template>
  <Transition name="slide-fade">
    <div
      v-if="isVisible"
      ref="playerRef"
      class="global-music-player"
      :class="[`mode-${panelMode}`, { 'is-touch': isTouchDevice }]"
      :style="panelStyle"
      @mousedown="startPanelDrag"
      @touchstart="startPanelDrag"
    >
      <div v-if="showCover" class="cover-section">
        <button class="cover-button" type="button" data-control="true" @click="togglePlay" :aria-label="currentSong.isPlaying ? '暂停' : '播放'">
          <div class="rotating-cover" :class="{ 'is-playing': currentSong.isPlaying }" :key="`cover-${coverResetVersion}`">
            <img v-if="currentSong.cover" :src="currentSong.cover" :alt="currentSong.name" class="cover-image" />
            <div v-else class="cover-placeholder">♪</div>
          </div>
          <div v-if="!currentSong.isPlaying" class="cover-overlay">▶</div>
        </button>
      </div>

      <div v-if="isExpanded" class="detail-panel" @mouseenter="onDetailEnter" @mouseleave="onDetailLeave">
        <div class="header-row">
          <div class="title-wrap">
            <div class="song-name">{{ currentSong.name || '未知歌曲' }}</div>
            <div class="song-artist">{{ currentSong.artist || '未知歌手' }}</div>
          </div>
          <div class="time-readout">
            <span class="current-time">{{ formattedCurrentTime }}</span>
            <span class="duration"> / {{ formattedDuration }}</span>
          </div>
        </div>

        <div
          class="progress-container lc-progress-root"
          :class="{ 'is-dragging': isDraggingProgress }"
          data-control="true"
          @click="setProgress"
          @mousedown="startProgressDrag"
          @touchstart="startProgressDrag"
        >
          <div ref="progressBarRef" class="progress-bar lc-progress-bar">
            <div class="progress-current lc-progress-fill" :style="{ width: `${currentSong.progress}%` }"></div>
          </div>
        </div>

        <div class="lyric-row" data-control="true">
          <div class="lyric-current">{{ currentLyric || '暂无歌词' }}</div>
          <div class="lyric-next" v-if="nextLyric">{{ nextLyric }}</div>
        </div>

        <div class="action-row" data-control="true">
          <button class="icon-btn" type="button" @click="togglePlay" :aria-label="currentSong.isPlaying ? '暂停' : '播放'">
            {{ currentSong.isPlaying ? '⏸' : '▶' }}
          </button>
          <button class="icon-btn" type="button" @click="handleNextSong" aria-label="下一首">⏭</button>
          <div class="volume-box">
            <span class="volume-label">🔊</span>
            <input
              class="volume-range"
              type="range"
              min="0"
              max="100"
              step="1"
              :value="volume"
              @input="onVolumeInput"
            />
          </div>
        </div>
      </div>

      <div class="side-controls" :class="{ expanded: isExpanded }">
        <button class="icon-btn" type="button" data-control="true" @click="onExpandButton" :aria-label="isExpanded ? '收起面板' : '展开面板'">
          {{ isExpanded ? '<' : '>' }}
        </button>
        <button v-if="showCloseButton" class="icon-btn close" type="button" data-control="true" @click="closePlayer" aria-label="停止并清空">
          ×
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.global-music-player {
  position: fixed;
  z-index: 120;
  display: flex;
  align-items: stretch;
  height: 64px;
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  box-shadow: 0 8px 26px rgba(0, 0, 0, 0.22);
  overflow: hidden;
  transition: width var(--lc-motion-duration-normal) var(--lc-motion-ease-emphasis),
    height var(--lc-motion-duration-normal) var(--lc-motion-ease-emphasis),
    opacity var(--lc-motion-duration-fast) var(--lc-motion-ease-out);
}

.global-music-player.mode-mini {
  width: 40px;
}

.global-music-player.mode-collapsed {
  width: 98px;
}

.global-music-player.mode-expanded {
  width: 382px;
  height: 118px;
}

.global-music-player.mode-expanded.is-touch {
  width: min(92vw, 362px);
}

.cover-section {
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-button {
  width: 50px;
  height: 50px;
  border: none;
  padding: 0;
  border-radius: 50%;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  background: transparent;
}

.rotating-cover {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  animation: disc-spin 8s linear infinite;
  animation-play-state: paused;
}

.rotating-cover.is-playing {
  animation-play-state: running;
}

@keyframes disc-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 18px;
  background: linear-gradient(135deg, var(--vp-c-brand-1), var(--vp-c-brand-3));
}

.cover-overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: #fff;
  background: rgba(0, 0, 0, 0.34);
  font-size: 16px;
}

.detail-panel {
  flex: 1;
  min-width: 0;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.title-wrap {
  min-width: 0;
  flex: 1;
}

.song-name {
  font-size: 0.88rem;
  color: var(--vp-c-text-1);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-artist {
  font-size: 0.74rem;
  color: var(--vp-c-text-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.time-readout {
  flex-shrink: 0;
  min-width: 108px;
  text-align: right;
  white-space: nowrap;
  font-size: 0.76rem;
  font-variant-numeric: tabular-nums;
}

.current-time {
  color: var(--vp-c-brand);
}

.duration {
  color: var(--vp-c-text-2);
}

.progress-container {
  height: 16px;
  display: flex;
  align-items: center;
}

.progress-bar {
  width: 100%;
}

.progress-current {
  height: 100%;
}

.lyric-row {
  min-height: 30px;
  overflow: hidden;
}

.lyric-current {
  font-size: 0.76rem;
  color: var(--vp-c-text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lyric-next {
  font-size: 0.72rem;
  color: var(--vp-c-text-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.action-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.side-controls {
  width: 34px;
  flex-shrink: 0;
  border-left: 1px solid var(--vp-c-divider);
  background-color: var(--vp-c-bg-alt);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
}

.side-controls.expanded {
  justify-content: flex-start;
  padding-top: 6px;
}

.icon-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--vp-c-text-2);
  cursor: pointer;
  display: grid;
  place-items: center;
  font-size: 13px;
  transition: background-color var(--lc-motion-duration-fast) var(--lc-motion-ease-standard),
    color var(--lc-motion-duration-fast) var(--lc-motion-ease-standard);
}

.icon-btn:hover {
  background: var(--vp-c-bg-mute);
  color: var(--vp-c-text-1);
}

.icon-btn.close {
  font-size: 18px;
  line-height: 1;
}

.volume-box {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.volume-label {
  color: var(--vp-c-text-2);
  font-size: 12px;
}

.volume-range {
  flex: 1;
  height: 4px;
  margin: 0;
  background: transparent;
  appearance: none;
}

.volume-range:focus {
  outline: none;
}

.volume-range::-webkit-slider-runnable-track {
  height: 4px;
  border-radius: 2px;
  background: var(--vp-c-divider);
}

.volume-range::-webkit-slider-thumb {
  appearance: none;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-top: -3px;
  background: var(--vp-c-brand);
}

.volume-range::-moz-range-track {
  height: 4px;
  border-radius: 2px;
  background: var(--vp-c-divider);
}

.volume-range::-moz-range-thumb {
  width: 10px;
  height: 10px;
  border: none;
  border-radius: 50%;
  background: var(--vp-c-brand);
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: opacity var(--lc-motion-duration-fast) var(--lc-motion-ease-standard),
    transform var(--lc-motion-duration-fast) var(--lc-motion-ease-standard);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-12px);
}

@media (max-width: 768px) {
  .global-music-player.mode-expanded {
    width: min(92vw, 362px);
  }
}
</style>
