<script setup lang="ts">
/**
 * GlobalMusicPlayer.vue：
 * 全局悬浮音乐播放器，负责播放状态展示、折叠交互和会话流控制。
 */

import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vitepress'
import {
  audioManager,
  audioService,
  calculateProgressPercent,
  fetchTrackLyric,
  formatAudioTime,
  playNextFromFlow,
  startRandomFlow,
  stopFlow,
  type AudioSongInfo,
  type MusicFlowState,
  type MusicLyricLine,
  type PlaybackRequestContext,
  type SongInfo
} from '../../utils/music'
import { logError } from '../../utils/logger'

const PANEL_GAP = 0
const MOBILE_BREAKPOINT = 768
const DRAG_CANCEL_THRESHOLD = 8
const COVER_GESTURE_THRESHOLD = 6
const NAV_SAFE_TOP = 65
const DEFAULT_VOLUME = 50
const LYRIC_DELAY_MS = -500
const VOLUME_STORAGE_KEY = 'lycan:global-player-volume'
const POSITION_STORAGE_KEY = 'lycan:global-player-position'
const RESUME_STORAGE_KEY = 'lycan:global-player-resume-snapshot'
const RESUME_MAX_AGE_MS = 30 * 60 * 1000
const RESUME_SAVE_INTERVAL_MS = 2000
const RESUME_END_GUARD_SEC = 3
const RESUME_FADE_IN_MS = 900
const READ_COLLAPSE_WIDTH = 960
const READ_SCROLL_DELTA = 48
const ROTATE_BASE_DEG_PER_SEC = 18
const ROTATE_GESTURE_DECAY = 0.92
const ROTATE_GESTURE_GAIN = 120
const VOLUME_SWIPE_GAIN = 0.32

type PanelMode = 'immersive' | 'collapsed' | 'expanded'
type PlayerSide = 'left' | 'right'

interface ResumeSnapshot {
  version: 1
  audioId: string
  songInfo: AudioSongInfo
  requestContext: PlaybackRequestContext
  currentTime: number
  duration: number
  volume: number
  wasPlaying: boolean
  savedAt: number
}

const playerRef = ref<HTMLElement | null>(null)
const progressBarRef = ref<HTMLElement | null>(null)
const route = useRoute()
const isTouchDevice = ref(false)
const isNarrowScreen = ref(false)
const isVisible = ref(false)
const panelMode = ref<PanelMode>('collapsed')
const isDraggingProgress = ref(false)
const isPanelDragging = ref(false)
const isSnapping = ref(false)
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
const volume = ref(DEFAULT_VOLUME)
const position = ref({ x: 0, y: 0, side: 'left' as PlayerSide })
const coverAngle = ref(0)
const gestureSpinVelocity = ref(0)
const playableSongInfo = ref<AudioSongInfo | null>(null)
const shouldFadeOnNextPlay = ref(false)

const unsubscribers: Array<() => void> = []
let resizeTimer: ReturnType<typeof setTimeout> | null = null
let resizeHandler: (() => void) | null = null
let snapTimer: ReturnType<typeof setTimeout> | null = null
let resumeSaveTimer = 0
let pageHideHandler: (() => void) | null = null
let beforeUnloadHandler: (() => void) | null = null
let visibilityChangeHandler: (() => void) | null = null
let scrollHandler: (() => void) | null = null
let scrollRafId: number | null = null
let lastScrollY = 0
let downwardScrollDistance = 0

let isDraggingPanel = false
let panelPointerOffsetX = 0
let panelPointerOffsetY = 0
let draggedInGesture = false
let suppressClickUntil = 0

let isPendingControlPress = false
let controlPressSource: 'mouse' | 'touch' | 'none' = 'none'
let controlPressMoved = false
let controlPressPoint = { x: 0, y: 0 }
let controlLastPoint = { x: 0, y: 0 }
let isCoverGestureActive = false
let coverGestureMode: 'idle' | 'volume' = 'idle'
let coverStartPoint = { x: 0, y: 0 }
let coverLastPoint = { x: 0, y: 0 }
let coverLastTs = 0

let rotationRafId: number | null = null
let lastRotationTs = 0

const isExpanded = computed(() => panelMode.value === 'expanded')
const isImmersive = computed(() => panelMode.value === 'immersive')
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
const coverTransformStyle = computed(() => ({
  transform: `rotate(${coverAngle.value}deg)`
}))

function clearResizeTimer(): void {
  if (!resizeTimer) return
  clearTimeout(resizeTimer)
  resizeTimer = null
}

function normalizeSongId(rawId: string): string {
  if (!rawId) return ''
  return rawId.startsWith('netease-') ? rawId.slice('netease-'.length) : rawId
}

function detectDeviceState(): void {
  const legacyNavigator = navigator as Navigator & { msMaxTouchPoints?: number }
  isTouchDevice.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || (legacyNavigator.msMaxTouchPoints ?? 0) > 0
  isNarrowScreen.value = window.innerWidth <= MOBILE_BREAKPOINT
}

function defaultModeByDevice(): PanelMode {
  return 'collapsed'
}

function getViewportWidth(): number {
  return window.innerWidth
}

function getPanelSize(mode: PanelMode): { width: number; height: number } {
  if (mode === 'immersive') {
    return { width: 24, height: 58 }
  }
  if (mode === 'collapsed') {
    return { width: 82, height: 58 }
  }
  return { width: isNarrowScreen.value ? 340 : 404, height: 108 }
}

function clampPanelYToViewport(nextY: number, mode: PanelMode): number {
  const size = getPanelSize(mode)
  const minY = Math.max(PANEL_GAP, NAV_SAFE_TOP)
  const maxY = Math.max(minY, window.innerHeight - size.height - PANEL_GAP)
  return Math.min(Math.max(nextY, minY), maxY)
}

function clampPanelPosition(nextX: number, nextY: number, mode: PanelMode): { x: number; y: number } {
  const size = getPanelSize(mode)
  const maxX = Math.max(PANEL_GAP, getViewportWidth() - size.width - PANEL_GAP)
  return {
    x: Math.min(Math.max(PANEL_GAP, nextX), maxX),
    y: clampPanelYToViewport(nextY, mode)
  }
}

function savePanelPosition(): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify({
    y: position.value.y,
    side: position.value.side
  }))
}

function clearSnapTimer(): void {
  if (!snapTimer) return
  clearTimeout(snapTimer)
  snapTimer = null
}

function animatePanelSnap(): void {
  clearSnapTimer()
  isSnapping.value = true
  snapTimer = setTimeout(() => {
    isSnapping.value = false
    snapTimer = null
  }, 260)
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
    const side = parsed.side === 'right' ? 'right' : 'left'
    const clamped = clampPanelPosition(Number(parsed.x ?? PANEL_GAP), Number(parsed.y ?? PANEL_GAP), mode)
    const size = getPanelSize(mode)
    const edgeX = side === 'right'
      ? Math.max(PANEL_GAP, getViewportWidth() - size.width - PANEL_GAP)
      : PANEL_GAP
    position.value = { x: edgeX, y: clamped.y, side }
  } catch {
    const size = getPanelSize(mode)
    const initialY = Math.max(PANEL_GAP, window.innerHeight - size.height - 92)
    position.value = { x: PANEL_GAP, y: initialY, side: 'left' }
  }
}

function ensurePanelInViewport(animate = true): void {
  const clamped = clampPanelPosition(position.value.x, position.value.y, panelMode.value)
  const size = getPanelSize(panelMode.value)
  const edgeX = position.value.side === 'right'
    ? Math.max(PANEL_GAP, getViewportWidth() - size.width - PANEL_GAP)
    : PANEL_GAP
  if (animate) animatePanelSnap()
  position.value = { ...position.value, x: edgeX, y: clamped.y }
  savePanelPosition()
}

function snapToHorizontalEdge(): void {
  const size = getPanelSize(panelMode.value)
  const centerX = position.value.x + size.width / 2
  const viewportWidth = getViewportWidth()
  const snapRight = centerX > viewportWidth / 2
  const targetX = snapRight
    ? Math.max(PANEL_GAP, viewportWidth - size.width - PANEL_GAP)
    : PANEL_GAP
  const clamped = clampPanelPosition(targetX, position.value.y, panelMode.value)
  animatePanelSnap()
  position.value = {
    x: clamped.x,
    y: clamped.y,
    side: snapRight ? 'right' : 'left'
  }
  savePanelPosition()
}

function pointerFromMouse(event: MouseEvent): { x: number; y: number } {
  return { x: event.clientX, y: event.clientY }
}

function pointerFromTouch(event: TouchEvent): { x: number; y: number } | null {
  const touch = event.touches?.[0] || event.changedTouches?.[0]
  if (!touch) return null
  return { x: touch.clientX, y: touch.clientY }
}

function blockClickAfterDrag(): boolean {
  return Date.now() < suppressClickUntil
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

function setVolumeByDelta(delta: number): void {
  if (delta === 0) return
  const next = Math.max(0, Math.min(100, volume.value + delta))
  if (next === volume.value) return
  volume.value = next
  audioService.setVolume(next)
  saveVolumePreference()
}

function startRotationLoop(): void {
  if (rotationRafId !== null) return
  lastRotationTs = performance.now()

  const tick = (now: number) => {
    const deltaSec = Math.min(0.05, (now - lastRotationTs) / 1000)
    lastRotationTs = now

    const baseVelocity = currentSong.value.isPlaying ? ROTATE_BASE_DEG_PER_SEC : 0
    const totalVelocity = baseVelocity + gestureSpinVelocity.value
    coverAngle.value = (coverAngle.value + totalVelocity * deltaSec + 360) % 360

    if (Math.abs(gestureSpinVelocity.value) > 0.01) {
      gestureSpinVelocity.value *= Math.pow(ROTATE_GESTURE_DECAY, deltaSec * 60)
    } else {
      gestureSpinVelocity.value = 0
    }

    const shouldContinue = currentSong.value.isPlaying || Math.abs(gestureSpinVelocity.value) > 0.1
    if (!shouldContinue) {
      rotationRafId = null
      return
    }

    rotationRafId = requestAnimationFrame(tick)
  }

  rotationRafId = requestAnimationFrame(tick)
}

function stopRotationLoop(): void {
  if (rotationRafId === null) return
  cancelAnimationFrame(rotationRafId)
  rotationRafId = null
}

function syncRotationLoop(): void {
  if (!currentSong.value.isPlaying && Math.abs(gestureSpinVelocity.value) <= 0.1) {
    stopRotationLoop()
    return
  }
  startRotationLoop()
}

function syncPlayableSongInfoFromStatus(): void {
  const status = audioService.getPlayingStatus()
  if (status.audioId === currentSong.value.id && status.songInfo?.url) {
    playableSongInfo.value = status.songInfo
  }
}

function buildPlayableSongInfo(): AudioSongInfo {
  syncPlayableSongInfoFromStatus()
  return {
    name: currentSong.value.name,
    artist: currentSong.value.artist,
    cover: currentSong.value.cover,
    url: playableSongInfo.value?.url || ''
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
  if (source === 'interrupt-single') {
    return {
      source: 'interrupt-single',
      priority: 3,
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
  const targetId = normalizeSongId(songId)
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

function clearResumeSnapshot(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(RESUME_STORAGE_KEY)
}

function readResumeSnapshot(): ResumeSnapshot | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(RESUME_STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<ResumeSnapshot>
    if (parsed.version !== 1 || !parsed.audioId || !parsed.songInfo?.url || !parsed.savedAt) {
      return null
    }
    if (Date.now() - parsed.savedAt > RESUME_MAX_AGE_MS) {
      clearResumeSnapshot()
      return null
    }
    return parsed as ResumeSnapshot
  } catch {
    clearResumeSnapshot()
    return null
  }
}

function shouldSkipResumeSnapshot(currentTime: number, duration: number): boolean {
  if (currentTime <= 0) return true
  return duration > 0 && duration - currentTime <= RESUME_END_GUARD_SEC
}

function saveResumeSnapshot(force = false): void {
  if (typeof window === 'undefined' || !currentSong.value.id) return
  const now = Date.now()
  if (!force && now - resumeSaveTimer < RESUME_SAVE_INTERVAL_MS) return

  const status = audioService.getPlayingStatus()
  const isSameAudio = status.audioId === currentSong.value.id
  const songInfo = isSameAudio && status.songInfo?.url
    ? status.songInfo
    : playableSongInfo.value
  if (!songInfo?.url) return

  const currentTime = isSameAudio ? status.currentTime : currentSong.value.currentTime
  const duration = isSameAudio && status.duration > 0 ? status.duration : currentSong.value.duration
  if (shouldSkipResumeSnapshot(currentTime, duration)) return

  const snapshot: ResumeSnapshot = {
    version: 1,
    audioId: currentSong.value.id,
    songInfo,
    requestContext: audioManager.getCurrentRequest() ?? playbackRequestBySource('global-player'),
    currentTime,
    duration,
    volume: volume.value,
    wasPlaying: isSameAudio ? status.isPlaying : currentSong.value.isPlaying,
    savedAt: now
  }

  window.localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify(snapshot))
  resumeSaveTimer = now
}

async function restoreResumeSnapshot(): Promise<boolean> {
  const snapshot = readResumeSnapshot()
  if (!snapshot || shouldSkipResumeSnapshot(snapshot.currentTime, snapshot.duration)) {
    return false
  }

  playableSongInfo.value = snapshot.songInfo
  volume.value = Math.max(0, Math.min(Number(snapshot.volume) || DEFAULT_VOLUME, 100))
  audioService.setVolume(volume.value)
  shouldFadeOnNextPlay.value = true
  currentSong.value = {
    id: snapshot.audioId,
    name: snapshot.songInfo.name,
    artist: snapshot.songInfo.artist,
    cover: snapshot.songInfo.cover,
    isPlaying: false,
    progress: snapshot.duration > 0 ? (snapshot.currentTime / snapshot.duration) * 100 : 0,
    duration: snapshot.duration,
    currentTime: snapshot.currentTime
  }
  isVisible.value = true
  void loadLyricForCurrentSong(snapshot.audioId)
  syncRotationLoop()

  if (!snapshot.wasPlaying) {
    return true
  }

  try {
    await audioService.play(
      snapshot.audioId,
      snapshot.songInfo,
      snapshot.currentTime,
      snapshot.requestContext ?? playbackRequestBySource('global-player'),
      { fadeInMs: RESUME_FADE_IN_MS, retryOnNotAllowed: false }
    )
    currentSong.value.isPlaying = true
    shouldFadeOnNextPlay.value = false
    syncRotationLoop()
  } catch (error) {
    currentSong.value.isPlaying = false
    syncRotationLoop()
    if (!(error instanceof DOMException && error.name === 'NotAllowedError')) {
      logError('GlobalMusicPlayer', '断点续播失败', error)
    }
  }

  return true
}

function applySongInfo(info: SongInfo): void {
  const changedSong = info.id && info.id !== currentSong.value.id
  if (changedSong) {
    playableSongInfo.value = null
  }
  currentSong.value = { ...currentSong.value, ...info }
  syncPlayableSongInfoFromStatus()
  if (currentSong.value.duration > 0) {
    currentSong.value.progress = (currentSong.value.currentTime / currentSong.value.duration) * 100
  }
  isVisible.value = true
  syncRotationLoop()
}

async function playFromFlowState(state: MusicFlowState): Promise<void> {
  if (!state.current) {
    currentSong.value.isPlaying = false
    clearResumeSnapshot()
    syncRotationLoop()
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
  playableSongInfo.value = {
    name: state.current.name,
    artist: state.current.artist,
    cover: state.current.cover,
    url: state.current.url || ''
  }
  shouldFadeOnNextPlay.value = false
  isVisible.value = true

  await audioService.play(
    nextAudioId,
    playableSongInfo.value,
    0,
    playbackRequestBySource(state.mode === 'interrupt-single' ? 'interrupt-single' : state.current.source)
  )

  syncRotationLoop()
  await loadLyricForCurrentSong(nextAudioId)
}

async function handleNextSong(): Promise<void> {
  if (blockClickAfterDrag()) return
  try {
    const source = audioManager.getCurrentRequest()?.source
    const isFlowSource = source === 'home-random' || source === 'about-ranking' || source === 'interrupt-single'
    if (!isFlowSource || source === 'interrupt-single') {
      audioService.pause()
      audioManager.pauseCurrent(currentSong.value.id)
    }
    const state = isFlowSource ? await playNextFromFlow() : await startRandomFlow()
    await playFromFlowState(state)
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

  const closedSongId = currentSong.value.id
  audioService.reset()
  audioManager.clearCurrentSession()
  audioManager.emit('player-closed', closedSongId)
  clearResumeSnapshot()

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
  playableSongInfo.value = null
  shouldFadeOnNextPlay.value = false
  gestureSpinVelocity.value = 0
  panelMode.value = defaultModeByDevice()
  syncRotationLoop()
}

function togglePlay(): void {
  if (blockClickAfterDrag() || !currentSong.value.id) return
  const status = audioService.getPlayingStatus()
  const isActiveAudio = status.audioId === currentSong.value.id
  if (currentSong.value.isPlaying || (isActiveAudio && status.isPlaying)) {
    audioService.pause()
    audioManager.pauseCurrent(currentSong.value.id)
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
    isActiveAudio && status.songInfo?.url ? status.songInfo : buildPlayableSongInfo(),
    isActiveAudio ? status.currentTime : currentSong.value.currentTime,
    requestContext,
    shouldFadeOnNextPlay.value ? { fadeInMs: RESUME_FADE_IN_MS, retryOnNotAllowed: false } : undefined
  ).then(() => {
    currentSong.value.isPlaying = true
    shouldFadeOnNextPlay.value = false
    syncRotationLoop()
  }).catch(error => {
    logError('GlobalMusicPlayer', '恢复播放失败', error)
  })
}

function expandPanel(): void {
  if (panelMode.value === 'expanded') return
  panelMode.value = 'expanded'
  nextTick(() => ensurePanelInViewport())
}

function collapsePanel(): void {
  panelMode.value = 'collapsed'
  nextTick(() => ensurePanelInViewport())
}

function enterImmersiveMode(): void {
  if (panelMode.value === 'immersive') return
  panelMode.value = 'immersive'
  nextTick(() => ensurePanelInViewport())
}

function isReadableArticlePath(): boolean {
  const path = route.path || window.location.pathname
  return /^\/(thoughts|knowledge)\/.+/.test(path) && !path.endsWith('/index.html')
}

function shouldUseImmersiveCollapse(): boolean {
  return isTouchDevice.value || isNarrowScreen.value || window.innerWidth <= READ_COLLAPSE_WIDTH
}

function handleReadingScroll(): void {
  scrollRafId = null
  const nextY = window.scrollY || document.documentElement.scrollTop || 0
  const delta = nextY - lastScrollY
  lastScrollY = nextY

  if (delta > 0) {
    downwardScrollDistance += delta
  } else if (delta < 0) {
    downwardScrollDistance = 0
  }

  if (downwardScrollDistance < READ_SCROLL_DELTA || !isVisible.value || panelMode.value === 'immersive') return
  if (!isReadableArticlePath() || !shouldUseImmersiveCollapse()) return
  downwardScrollDistance = 0
  enterImmersiveMode()
}

function onWindowScroll(): void {
  if (scrollRafId !== null) return
  scrollRafId = requestAnimationFrame(handleReadingScroll)
}

function beginPanelDragFromPoint(point: { x: number; y: number }, source: 'mouse' | 'touch'): void {
  isDraggingPanel = true
  isPanelDragging.value = true
  draggedInGesture = false

  const rect = playerRef.value?.getBoundingClientRect()
  panelPointerOffsetX = point.x - (rect?.left ?? position.value.x)
  panelPointerOffsetY = point.y - (rect?.top ?? position.value.y)

  if (source === 'mouse') {
    document.addEventListener('mousemove', onPanelDragMouseMove)
    document.addEventListener('mouseup', endPanelDrag)
    return
  }

  document.addEventListener('touchmove', onPanelDragTouchMove, { passive: false })
  document.addEventListener('touchend', endPanelDrag)
}

function onPanelDragMouseMove(event: MouseEvent): void {
  if (!isDraggingPanel) return
  const nextX = event.clientX - panelPointerOffsetX
  const nextY = event.clientY - panelPointerOffsetY
  const clamped = clampPanelPosition(nextX, nextY, panelMode.value)
  position.value = { ...position.value, x: clamped.x, y: clamped.y }
  draggedInGesture = true
}

function onPanelDragTouchMove(event: TouchEvent): void {
  if (!isDraggingPanel) return
  const pointer = pointerFromTouch(event)
  if (!pointer) return
  event.preventDefault()
  const nextX = pointer.x - panelPointerOffsetX
  const nextY = pointer.y - panelPointerOffsetY
  const clamped = clampPanelPosition(nextX, nextY, panelMode.value)
  position.value = { ...position.value, x: clamped.x, y: clamped.y }
  draggedInGesture = true
}

function endPanelDrag(): void {
  document.removeEventListener('mousemove', onPanelDragMouseMove)
  document.removeEventListener('mouseup', endPanelDrag)
  document.removeEventListener('touchmove', onPanelDragTouchMove)
  document.removeEventListener('touchend', endPanelDrag)

  if (!isDraggingPanel) return
  isDraggingPanel = false
  isPanelDragging.value = false

  if (draggedInGesture) {
    suppressClickUntil = Date.now() + 160
    snapToHorizontalEdge()
  }

  draggedInGesture = false
}

function clearPendingControlPressListeners(source: 'mouse' | 'touch'): void {
  if (source === 'mouse') {
    document.removeEventListener('mousemove', onControlPressMouseMove)
    document.removeEventListener('mouseup', onControlPressMouseUp)
    return
  }
  document.removeEventListener('touchmove', onControlPressTouchMove)
  document.removeEventListener('touchend', onControlPressTouchEnd)
}

function resetPendingControlPress(): void {
  if (!isPendingControlPress) return
  clearPendingControlPressListeners(controlPressSource === 'none' ? 'mouse' : controlPressSource)
  isPendingControlPress = false
  controlPressSource = 'none'
}

function beginPendingControlPress(point: { x: number; y: number }, source: 'mouse' | 'touch'): void {
  resetPendingControlPress()
  isPendingControlPress = true
  controlPressSource = source
  controlPressMoved = false
  controlPressPoint = point
  controlLastPoint = point

  if (source === 'mouse') {
    document.addEventListener('mousemove', onControlPressMouseMove)
    document.addEventListener('mouseup', onControlPressMouseUp)
    return
  }

  document.addEventListener('touchmove', onControlPressTouchMove, { passive: false })
  document.addEventListener('touchend', onControlPressTouchEnd)
}

function controlPressDistance(next: { x: number; y: number }): number {
  const dx = next.x - controlPressPoint.x
  const dy = next.y - controlPressPoint.y
  return Math.hypot(dx, dy)
}

function onControlPressMouseMove(event: MouseEvent): void {
  if (!isPendingControlPress) return
  controlLastPoint = pointerFromMouse(event)
  if (controlPressDistance(controlLastPoint) > DRAG_CANCEL_THRESHOLD) {
    controlPressMoved = true
    const source = controlPressSource === 'touch' ? 'touch' : 'mouse'
    resetPendingControlPress()
    beginPanelDragFromPoint(controlLastPoint, source)
    onPanelDragMouseMove(event)
  }
}

function onControlPressTouchMove(event: TouchEvent): void {
  if (!isPendingControlPress) return
  const point = pointerFromTouch(event)
  if (!point) return
  controlLastPoint = point
  if (controlPressDistance(point) > DRAG_CANCEL_THRESHOLD) {
    controlPressMoved = true
    const source = controlPressSource === 'touch' ? 'touch' : 'mouse'
    resetPendingControlPress()
    beginPanelDragFromPoint(point, source)
    onPanelDragTouchMove(event)
  }
  event.preventDefault()
}

function handleControlPressRelease(): void {
  const moved = controlPressMoved
  const pending = isPendingControlPress
  resetPendingControlPress()

  if (!pending) return
  if (moved) {
    suppressClickUntil = Date.now() + 120
    return
  }

  if (!isExpanded.value) {
    expandPanel()
  }
}

function onControlPressMouseUp(): void {
  handleControlPressRelease()
}

function onControlPressTouchEnd(): void {
  handleControlPressRelease()
}

function onControlAreaMouseDown(event: MouseEvent): void {
  if (!isVisible.value || blockClickAfterDrag()) return

  if (isExpanded.value) {
    return
  }

  beginPendingControlPress(pointerFromMouse(event), 'mouse')
}

function onControlAreaTouchStart(event: TouchEvent): void {
  if (!isVisible.value || blockClickAfterDrag()) return
  const point = pointerFromTouch(event)
  if (!point) return

  if (isExpanded.value) {
    return
  }

  beginPendingControlPress(point, 'touch')
}

function clearCoverGestureListeners(source: 'mouse' | 'touch'): void {
  if (source === 'mouse') {
    document.removeEventListener('mousemove', onCoverMouseMove)
    document.removeEventListener('mouseup', onCoverMouseUp)
    return
  }
  document.removeEventListener('touchmove', onCoverTouchMove)
  document.removeEventListener('touchend', onCoverTouchEnd)
}

function finishCoverGesture(source: 'mouse' | 'touch', shouldToggleWhenIdle = true): void {
  clearCoverGestureListeners(source)
  if (!isCoverGestureActive) return

  const shouldToggle = shouldToggleWhenIdle && coverGestureMode === 'idle' && !blockClickAfterDrag()
  isCoverGestureActive = false
  coverGestureMode = 'idle'

  if (shouldToggle) {
    togglePlay()
    return
  }

  suppressClickUntil = Date.now() + 140
  syncRotationLoop()
}

function onCoverGestureMove(point: { x: number; y: number }, nowTs: number, preventTouchDefault: () => void): void {
  if (!isCoverGestureActive) return

  const deltaX = Math.abs(point.x - coverStartPoint.x)
  const deltaY = Math.abs(point.y - coverStartPoint.y)

  if (coverGestureMode === 'idle' && (deltaY > COVER_GESTURE_THRESHOLD || deltaX > DRAG_CANCEL_THRESHOLD)) {
    coverGestureMode = 'volume'
  }

  if (coverGestureMode !== 'volume') {
    coverLastPoint = point
    coverLastTs = nowTs
    return
  }

  preventTouchDefault()
  const dy = coverLastPoint.y - point.y
  const dtMs = Math.max(16, nowTs - coverLastTs)

  if (dy !== 0) {
    setVolumeByDelta(dy * VOLUME_SWIPE_GAIN)
    const velocity = (dy / dtMs) * ROTATE_GESTURE_GAIN
    gestureSpinVelocity.value += velocity
    syncRotationLoop()
  }

  coverLastPoint = point
  coverLastTs = nowTs
}

function onCoverMouseMove(event: MouseEvent): void {
  onCoverGestureMove(pointerFromMouse(event), performance.now(), () => {})
}

function onCoverTouchMove(event: TouchEvent): void {
  const point = pointerFromTouch(event)
  if (!point) return
  onCoverGestureMove(point, performance.now(), () => event.preventDefault())
}

function onCoverMouseUp(): void {
  finishCoverGesture('mouse')
}

function onCoverTouchEnd(): void {
  finishCoverGesture('touch')
}

function onCoverMouseDown(event: MouseEvent): void {
  if (!currentSong.value.id) return
  if (blockClickAfterDrag()) return

  isCoverGestureActive = true
  coverGestureMode = 'idle'
  const point = pointerFromMouse(event)
  coverStartPoint = point
  coverLastPoint = point
  coverLastTs = performance.now()

  document.addEventListener('mousemove', onCoverMouseMove)
  document.addEventListener('mouseup', onCoverMouseUp)
}

function onCoverTouchStart(event: TouchEvent): void {
  if (!currentSong.value.id) return
  if (blockClickAfterDrag()) return

  const point = pointerFromTouch(event)
  if (!point) return

  isCoverGestureActive = true
  coverGestureMode = 'idle'
  coverStartPoint = point
  coverLastPoint = point
  coverLastTs = performance.now()

  document.addEventListener('touchmove', onCoverTouchMove, { passive: false })
  document.addEventListener('touchend', onCoverTouchEnd)
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
        applySongInfo(incoming)

        if (!incoming.id) return
        if (changedSong) {
          void loadLyricForCurrentSong(incoming.id)
          if (panelMode.value !== 'expanded' && panelMode.value !== 'immersive') {
            panelMode.value = defaultModeByDevice()
          }
          nextTick(() => ensurePanelInViewport())
        }
        saveResumeSnapshot(true)
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
      saveResumeSnapshot()
    })
  )

  unsubscribers.push(
    audioManager.on('play-state-change', data => {
      const [id, state] = data.split(':')
      if (!id || id !== currentSong.value.id) return
      currentSong.value.isPlaying = state === 'true'
      syncRotationLoop()
      saveResumeSnapshot(true)
    })
  )

  unsubscribers.push(
    audioManager.on('song-ended', id => {
      if (!id || id !== currentSong.value.id) return
      currentSong.value.isPlaying = false
      clearResumeSnapshot()
      syncRotationLoop()
      void handleNextSong()
    })
  )

  unsubscribers.push(
    audioManager.on('current-audio-changed', id => {
      if (!id || id === currentSong.value.id) return
      const info = audioManager.getCurrentSongInfo()
      if (!info) return
      applySongInfo(info)
      if (panelMode.value !== 'expanded' && panelMode.value !== 'immersive') {
        panelMode.value = defaultModeByDevice()
      }
      void loadLyricForCurrentSong(info.id)
      nextTick(() => ensurePanelInViewport())
      saveResumeSnapshot(true)
    })
  )
}

function syncWithStoredSong(): boolean {
  const songInfo = audioManager.getCurrentSongInfo()
  if (!songInfo || !songInfo.id) {
    isVisible.value = false
    syncRotationLoop()
    return false
  }

  const status = audioService.getPlayingStatus()
  const isSameAudio = status.audioId === songInfo.id
  currentSong.value = {
    ...songInfo,
    isPlaying: isSameAudio ? status.isPlaying : false,
    currentTime: isSameAudio ? status.currentTime : songInfo.currentTime,
    duration: isSameAudio && status.duration > 0 ? status.duration : songInfo.duration
  }
  currentSong.value.progress = currentSong.value.duration > 0
    ? (currentSong.value.currentTime / currentSong.value.duration) * 100
    : 0

  isVisible.value = true
  void loadLyricForCurrentSong(songInfo.id)
  syncRotationLoop()
  saveResumeSnapshot(true)
  return true
}

watch(panelMode, () => {
  nextTick(() => ensurePanelInViewport())
})

watch(() => route.path, () => {
  lastScrollY = window.scrollY || document.documentElement.scrollTop || 0
  downwardScrollDistance = 0
})

onMounted(() => {
  detectDeviceState()
  panelMode.value = defaultModeByDevice()
  loadPanelPosition(panelMode.value)
  loadVolumePreference()
  setupEventListeners()
  if (!syncWithStoredSong()) {
    void restoreResumeSnapshot()
  }

  const onResize = () => {
    detectDeviceState()
    clearResizeTimer()
    resizeTimer = setTimeout(() => {
      resizeTimer = null
      ensurePanelInViewport()
    }, 80)
  }
  resizeHandler = onResize
  window.addEventListener('resize', onResize)

  lastScrollY = window.scrollY || document.documentElement.scrollTop || 0
  downwardScrollDistance = 0
  scrollHandler = onWindowScroll
  window.addEventListener('scroll', onWindowScroll, { passive: true })

  pageHideHandler = () => saveResumeSnapshot(true)
  window.addEventListener('pagehide', pageHideHandler)
  beforeUnloadHandler = () => saveResumeSnapshot(true)
  window.addEventListener('beforeunload', beforeUnloadHandler)
  visibilityChangeHandler = () => {
    if (document.visibilityState === 'hidden') {
      saveResumeSnapshot(true)
    }
  }
  document.addEventListener('visibilitychange', visibilityChangeHandler)
})

onUnmounted(() => {
  unsubscribers.forEach(unsubscribe => unsubscribe())
  clearResizeTimer()
  clearSnapTimer()
  stopProgressDrag()
  resetPendingControlPress()
  endPanelDrag()
  finishCoverGesture('mouse', false)
  finishCoverGesture('touch', false)
  stopRotationLoop()
  if (scrollRafId !== null) {
    cancelAnimationFrame(scrollRafId)
    scrollRafId = null
  }
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler)
  }
  if (scrollHandler) {
    window.removeEventListener('scroll', scrollHandler)
  }
  if (pageHideHandler) {
    window.removeEventListener('pagehide', pageHideHandler)
  }
  if (beforeUnloadHandler) {
    window.removeEventListener('beforeunload', beforeUnloadHandler)
  }
  if (visibilityChangeHandler) {
    document.removeEventListener('visibilitychange', visibilityChangeHandler)
  }
})
</script>

<template>
  <Transition name="slide-fade">
    <div
      v-if="isVisible"
      ref="playerRef"
      class="global-music-player"
      :class="[
        `mode-${panelMode}`,
        `side-${position.side}`,
        {
          'is-touch': isTouchDevice,
          'is-dragging-panel': isPanelDragging,
          'is-snapping': isSnapping
        }
      ]"
      :style="panelStyle"
    >
      <div v-if="!isImmersive" class="cover-section">
        <button
          class="cover-button"
          type="button"
          draggable="false"
          data-control-area="true"
          :aria-label="currentSong.isPlaying ? '暂停' : '播放'"
          @mousedown="onCoverMouseDown"
          @touchstart="onCoverTouchStart"
        >
          <div class="cover-rotation-layer" :style="coverTransformStyle">
            <div class="rotating-cover" :class="{ 'is-playing': currentSong.isPlaying }">
              <img v-if="currentSong.cover" :src="currentSong.cover" :alt="currentSong.name" class="cover-image" draggable="false" />
              <div v-else class="cover-placeholder">♪</div>
            </div>
          </div>
          <div v-if="!currentSong.isPlaying" class="cover-overlay">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <polygon points="7,5 19,12 7,19" />
            </svg>
          </div>
        </button>
      </div>

      <div v-if="isExpanded" class="detail-panel">
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
          data-control-area="true"
          @click="setProgress"
          @mousedown="startProgressDrag"
          @touchstart="startProgressDrag"
        >
          <div ref="progressBarRef" class="progress-bar lc-progress-bar">
            <div class="progress-current lc-progress-fill" :style="{ width: `${currentSong.progress}%` }"></div>
          </div>
        </div>

        <div class="lyric-row" data-control-area="true">
          <div class="lyric-current">{{ currentLyric || '暂无歌词' }}</div>
          <div class="lyric-next" v-if="nextLyric">{{ nextLyric }}</div>
        </div>
      </div>

      <div
        class="side-controls"
        :class="{ expanded: isExpanded, immersive: isImmersive, collapsed: !isExpanded && !isImmersive }"
        data-control-rail="true"
        @mousedown="onControlAreaMouseDown"
        @touchstart="onControlAreaTouchStart"
      >
        <template v-if="isExpanded">
          <button class="rail-btn" type="button" data-control-btn="true" @click="closePlayer" aria-label="停止并清空">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          <button class="rail-btn" type="button" data-control-btn="true" @click="collapsePanel" aria-label="收起面板">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
          <button class="rail-btn" type="button" data-control-btn="true" @click="handleNextSong" aria-label="下一首">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <polygon points="5 4 15 12 5 20 5 4"></polygon>
              <line x1="19" y1="5" x2="19" y2="19"></line>
            </svg>
          </button>
        </template>

        <div
          v-else
          class="collapsed-expand"
          aria-label="展开面板"
          role="button"
          tabindex="0"
          @keydown.enter.prevent="expandPanel"
          @keydown.space.prevent="expandPanel"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.global-music-player {
  position: fixed;
  z-index: 999;
  display: flex;
  align-items: stretch;
  height: 58px;
  background-color: var(--vp-c-bg-soft);
  border: 0;
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  transition: width var(--lc-motion-duration-normal) var(--lc-motion-ease-emphasis),
    height var(--lc-motion-duration-normal) var(--lc-motion-ease-emphasis),
    opacity var(--lc-motion-duration-fast) var(--lc-motion-ease-out),
    transform var(--lc-motion-duration-fast) var(--lc-motion-ease-out);
}

.global-music-player.is-snapping {
  transition: left var(--lc-motion-duration-normal) var(--lc-motion-ease-emphasis),
    right var(--lc-motion-duration-normal) var(--lc-motion-ease-emphasis),
    top var(--lc-motion-duration-normal) var(--lc-motion-ease-emphasis),
    width var(--lc-motion-duration-normal) var(--lc-motion-ease-emphasis),
    height var(--lc-motion-duration-normal) var(--lc-motion-ease-emphasis),
    opacity var(--lc-motion-duration-fast) var(--lc-motion-ease-out),
    transform var(--lc-motion-duration-fast) var(--lc-motion-ease-out);
}

.global-music-player.side-right {
  flex-direction: row-reverse;
  border-radius: 8px 0 0 8px;
}

.global-music-player.side-left:not(.is-dragging-panel) {
  left: 0 !important;
  right: auto;
}

.global-music-player.side-right:not(.is-dragging-panel) {
  left: auto !important;
  right: 0;
}

.global-music-player.mode-immersive {
  width: 24px;
}

.global-music-player.mode-collapsed {
  width: 82px;
}

.global-music-player.mode-expanded {
  width: 404px;
  height: 108px;
}

.global-music-player.mode-expanded.is-touch {
  width: min(92vw, 340px);
}

.cover-section {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.global-music-player.mode-collapsed .cover-section,
.global-music-player.mode-expanded .cover-section {
  width: 58px;
}

.global-music-player.mode-expanded .cover-section {
  width: 86px;
}

.cover-button {
  border: none;
  padding: 0;
  border-radius: 50%;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  background: transparent;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.16);
  user-select: none;
  -webkit-user-drag: none;
  touch-action: none;
  transform: scale(1);
  transition: transform var(--lc-motion-duration-normal) var(--lc-motion-ease-emphasis),
    box-shadow var(--lc-motion-duration-fast) var(--lc-motion-ease-standard);
}

.cover-button::before,
.cover-button::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 2;
  border-radius: 50%;
  pointer-events: none;
  transform: translate(-50%, -50%);
}

.cover-button::before {
  width: 25%;
  height: 25%;
  background: color-mix(in srgb, var(--vp-c-bg) 90%, transparent);
}

.cover-button::after {
  width: 11%;
  height: 11%;
  background: color-mix(in srgb, var(--vp-c-bg) 92%, var(--vp-c-text-1));
}

.global-music-player.mode-collapsed .cover-button,
.global-music-player.mode-expanded .cover-button {
  width: 44px;
  height: 44px;
}

.global-music-player.mode-expanded .cover-button {
  transform: scale(1.68);
}

.cover-rotation-layer {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
}

.rotating-cover {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  user-select: none;
  -webkit-user-drag: none;
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
  z-index: 3;
  color: #fff;
  background: rgba(0, 0, 0, 0.45);
}

.cover-overlay svg {
  width: 16px;
  height: 16px;
  fill: #fff;
}

.detail-panel {
  flex: 1;
  min-width: 0;
  padding: 8px 10px 7px 6px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  animation: panel-slide-in var(--lc-motion-duration-normal) var(--lc-motion-ease-out);
}

.global-music-player.side-right .detail-panel {
  animation-name: panel-slide-in-right;
}

.header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.title-wrap {
  min-width: 0;
  flex: 1 1 auto;
}

.song-name {
  font-size: 0.83rem;
  color: var(--vp-c-text-1);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-artist {
  font-size: 0.72rem;
  color: var(--vp-c-text-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.time-readout {
  flex: 0 0 auto;
  min-width: 72px;
  text-align: right;
  white-space: nowrap;
  font-size: 0.72rem;
  font-variant-numeric: tabular-nums;
}

.current-time {
  color: var(--vp-c-brand);
}

.duration {
  color: var(--vp-c-text-2);
}

.progress-container {
  height: 12px;
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
  font-size: 0.72rem;
  color: var(--vp-c-text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lyric-next {
  font-size: 0.68rem;
  color: var(--vp-c-text-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.side-controls {
  flex-shrink: 0;
  border-left: 1px solid color-mix(in srgb, var(--vp-c-divider) 70%, transparent);
  background-color: color-mix(in srgb, var(--vp-c-bg-soft) 86%, var(--vp-c-bg-alt));
  touch-action: none;
  user-select: none;
}

.global-music-player.side-right .side-controls {
  border-right: 1px solid color-mix(in srgb, var(--vp-c-divider) 70%, transparent);
  border-left: 0;
}

.side-controls.collapsed,
.side-controls.immersive {
  width: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: default;
}

.side-controls.expanded {
  width: 26px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: stretch;
  cursor: default;
}

.global-music-player.is-dragging-panel .side-controls.collapsed,
.global-music-player.is-dragging-panel .side-controls.immersive {
  cursor: default;
}

.collapsed-expand {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--vp-c-text-2);
  transition: color var(--lc-motion-duration-fast) var(--lc-motion-ease-standard),
    background-color var(--lc-motion-duration-fast) var(--lc-motion-ease-standard);
}

.collapsed-expand svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.global-music-player.side-right .collapsed-expand svg,
.global-music-player.side-right .rail-btn:nth-child(2) svg {
  transform: scaleX(-1);
}

.side-controls.collapsed:hover .collapsed-expand,
.side-controls.immersive:hover .collapsed-expand {
  color: var(--vp-c-text-1);
  background-color: color-mix(in srgb, var(--vp-c-bg-mute) 55%, transparent);
}

.rail-btn {
  flex: 1;
  width: 100%;
  border: none;
  padding: 0;
  margin: 0;
  background: transparent;
  color: var(--vp-c-text-2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color var(--lc-motion-duration-fast) var(--lc-motion-ease-standard),
    background-color var(--lc-motion-duration-fast) var(--lc-motion-ease-standard);
}

.rail-btn + .rail-btn {
  border-top: none;
}

.rail-btn svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.rail-btn:hover {
  color: var(--vp-c-text-1);
  background-color: color-mix(in srgb, var(--vp-c-bg-mute) 55%, transparent);
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: opacity var(--lc-motion-duration-fast) var(--lc-motion-ease-standard),
    transform var(--lc-motion-duration-fast) var(--lc-motion-ease-standard),
    width var(--lc-motion-duration-normal) var(--lc-motion-ease-emphasis);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.global-music-player.side-right.slide-fade-enter-from,
.global-music-player.side-right.slide-fade-leave-to {
  transform: translateX(20px);
}

@keyframes panel-slide-in {
  from {
    opacity: 0;
    transform: translateX(-8px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes panel-slide-in-right {
  from {
    opacity: 0;
    transform: translateX(8px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@media (max-width: 768px) {
  .global-music-player.mode-expanded {
    width: min(92vw, 340px);
    height: 108px;
  }
}
</style>
