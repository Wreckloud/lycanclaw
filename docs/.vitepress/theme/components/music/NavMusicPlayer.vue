<script setup lang="ts">
/**
 * NavMusicPlayer.vue：
 * 窄屏导航菜单中的紧凑随机音乐入口。
 */
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { audioManager, audioService, calculateProgressPercent, formatAudioTime } from '../../utils/music'
import {
  playNextFromFlow,
  startRandomFlow,
  type MusicFlowState,
  type MusicPlaybackItem
} from '../../utils/music'
import { logError } from '../../utils/logger'

withDefaults(defineProps<{
  variant?: 'screen' | 'dropdown'
}>(), {
  variant: 'screen'
})

const defaultCoverUrl = '/images/首页/default-cover.png'
const NAV_PLAYBACK_REQUEST = {
  source: 'nav-random',
  priority: 1,
  allowInterrupt: true
} as const

interface NavSongInfo {
  id: string
  name: string
  artist: string
  cover: string
}

const currentSong = ref<NavSongInfo>({
  id: '',
  name: '',
  artist: '',
  cover: ''
})
const isPlaying = ref(false)
const isLoading = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const progress = ref(0)
const progressBarRef = ref<HTMLElement | null>(null)
const isDragging = ref(false)
const unsubscribers: Array<() => void> = []

const hasSong = computed(() => Boolean(currentSong.value.id))
const coverUrl = computed(() => currentSong.value.cover || defaultCoverUrl)
const titleText = computed(() => hasSong.value ? currentSong.value.name : '随机音乐')
const artistText = computed(() => {
  if (isLoading.value) return '正在寻找下一首'
  if (hasSong.value) return currentSong.value.artist || '未知歌手'
  return '从听歌排行里抽一首'
})
const formattedCurrentTime = computed(() => formatAudioTime(currentTime.value))
const formattedDuration = computed(() => formatAudioTime(duration.value))
const playButtonLabel = computed(() => {
  if (isLoading.value) return '加载中'
  if (!hasSong.value) return '播放随机音乐'
  return isPlaying.value ? '暂停' : '播放'
})

function normalizeCoverUrl(cover: string): string {
  if (!cover) return ''
  let normalized = cover.startsWith('http:') ? cover.replace('http:', 'https:') : cover
  if (normalized.includes('music.126.net') && !normalized.includes('param=')) {
    normalized += '?param=64y64'
  }
  return normalized
}

function resetProgress(): void {
  currentTime.value = 0
  duration.value = 0
  progress.value = 0
}

function updateCurrentSong(item: MusicPlaybackItem): void {
  currentSong.value = {
    id: `netease-${item.id}`,
    name: item.name,
    artist: item.artist,
    cover: normalizeCoverUrl(item.cover)
  }
}

function toAudioSongInfo(item: MusicPlaybackItem) {
  return {
    name: item.name,
    artist: item.artist,
    cover: normalizeCoverUrl(item.cover),
    url: item.url || '',
    urlSource: item.urlSource || 'unknown'
  }
}

async function playFlowState(state: MusicFlowState): Promise<void> {
  if (!state.current) {
    isPlaying.value = false
    return
  }

  updateCurrentSong(state.current)
  resetProgress()
  await audioService.play(
    currentSong.value.id,
    toAudioSongInfo(state.current),
    0,
    NAV_PLAYBACK_REQUEST
  )
  isPlaying.value = true
}

async function startRandomPlayback(): Promise<void> {
  isLoading.value = true
  try {
    await playFlowState(await startRandomFlow())
  } catch (error) {
    isPlaying.value = false
    logError('NavMusicPlayer', '启动随机播放失败', error)
  } finally {
    isLoading.value = false
  }
}

async function playNextSong(): Promise<void> {
  isLoading.value = true
  try {
    await playFlowState(await playNextFromFlow())
  } catch (error) {
    isPlaying.value = false
    logError('NavMusicPlayer', '切换下一首失败', error)
  } finally {
    isLoading.value = false
  }
}

function handleNextClick(): void {
  if (isLoading.value) return
  if (!hasSong.value) {
    void startRandomPlayback()
    return
  }
  void playNextSong()
}

function syncFromAudioManager(): void {
  const info = audioManager.getCurrentSongInfo()
  if (!info?.id) return
  currentSong.value = {
    id: info.id,
    name: info.name,
    artist: info.artist,
    cover: normalizeCoverUrl(info.cover)
  }
  isPlaying.value = info.isPlaying
  currentTime.value = info.currentTime
  duration.value = info.duration
  progress.value = info.progress
}

function togglePlayback(): void {
  if (isLoading.value) return
  if (!hasSong.value) {
    void startRandomPlayback()
    return
  }

  const status = audioService.getPlayingStatus()
  const isCurrentAudio = status.audioId === currentSong.value.id
  if (isPlaying.value || (isCurrentAudio && status.isPlaying)) {
    audioService.pause()
    isPlaying.value = false
    return
  }

  void audioService.play(
    currentSong.value.id,
    {
      name: currentSong.value.name,
      artist: currentSong.value.artist,
      cover: currentSong.value.cover,
      url: ''
    },
    isCurrentAudio ? status.currentTime : 0,
    NAV_PLAYBACK_REQUEST
  ).then(() => {
    isPlaying.value = true
  }).catch((error) => {
    isPlaying.value = false
    logError('NavMusicPlayer', '恢复播放失败', error)
  })
}

function isCurrentAudioLoaded(): boolean {
  return audioService.getPlayingStatus().audioId === currentSong.value.id
}

function updateProgress(percent: number): void {
  const safePercent = Math.max(0, Math.min(percent, 1))
  progress.value = safePercent * 100
  currentTime.value = safePercent * duration.value
}

function progressPercentFromEvent(event: MouseEvent | TouchEvent, fallbackElement?: HTMLElement): number | null {
  const element = progressBarRef.value || fallbackElement
  if (!element) return null
  return calculateProgressPercent(event, element)
}

function startDrag(event: MouseEvent | TouchEvent): void {
  if (!duration.value || !hasSong.value || !isCurrentAudioLoaded()) return

  isDragging.value = true
  if (event.type === 'touchstart') {
    updateProgressFromTouch(event as TouchEvent)
    document.addEventListener('touchmove', updateProgressFromTouch, { passive: false })
    document.addEventListener('touchend', stopDrag)
    return
  }

  updateProgressFromMouse(event as MouseEvent)
  document.addEventListener('mousemove', updateProgressFromMouse)
  document.addEventListener('mouseup', stopDrag)
}

function updateProgressFromMouse(event: MouseEvent): void {
  if (!isDragging.value) return
  const percent = progressPercentFromEvent(event)
  if (percent !== null) updateProgress(percent)
}

function updateProgressFromTouch(event: TouchEvent): void {
  if (!isDragging.value) return
  event.preventDefault()
  const percent = progressPercentFromEvent(event)
  if (percent !== null) updateProgress(percent)
}

function stopDrag(): void {
  document.removeEventListener('mousemove', updateProgressFromMouse)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', updateProgressFromTouch)
  document.removeEventListener('touchend', stopDrag)

  if (!isDragging.value) return
  isDragging.value = false
  audioService.seekCurrentAudio(currentSong.value.id, currentTime.value)
}

function setProgress(event: MouseEvent): void {
  if (!hasSong.value || isDragging.value || !isCurrentAudioLoaded()) return
  const percent = progressPercentFromEvent(event, event.currentTarget as HTMLElement)
  if (percent === null) return
  updateProgress(percent)
  audioService.seekCurrentAudio(currentSong.value.id, currentTime.value)
}

function setupEventListeners(): void {
  unsubscribers.push(audioManager.on('song-info-update', (payload) => {
    try {
      const parsed = JSON.parse(payload) as NavSongInfo & {
        isPlaying: boolean
        currentTime: number
        duration: number
        progress: number
      }
      if (!parsed.id) return
      currentSong.value = {
        id: parsed.id,
        name: parsed.name,
        artist: parsed.artist,
        cover: normalizeCoverUrl(parsed.cover)
      }
      isPlaying.value = parsed.isPlaying
      currentTime.value = Number.isFinite(parsed.currentTime) ? parsed.currentTime : 0
      duration.value = Number.isFinite(parsed.duration) ? parsed.duration : 0
      progress.value = Number.isFinite(parsed.progress) ? parsed.progress : 0
    } catch (error) {
      logError('NavMusicPlayer', '解析歌曲信息失败', error)
    }
  }))

  unsubscribers.push(audioManager.on('play-state-change', (data) => {
    const [id, state] = data.split(':')
    if (id === currentSong.value.id) {
      isPlaying.value = state === 'true'
    }
  }))

  unsubscribers.push(audioManager.on('progress-update', (data) => {
    try {
      const [id, time, dur] = data.split(':')
      if (id !== currentSong.value.id || isDragging.value) return
      const timeValue = Number.parseFloat(time)
      const durationValue = Number.parseFloat(dur)
      if (!Number.isNaN(timeValue)) {
        currentTime.value = timeValue
      }
      if (!Number.isNaN(durationValue) && durationValue > 0) {
        duration.value = durationValue
      }
      progress.value = duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0
    } catch (error) {
      logError('NavMusicPlayer', '解析进度信息失败', error)
    }
  }))

  unsubscribers.push(audioManager.on('player-closed', () => {
    isPlaying.value = false
    currentSong.value = { id: '', name: '', artist: '', cover: '' }
    resetProgress()
  }))
}

onMounted(() => {
  setupEventListeners()
  syncFromAudioManager()
})

onUnmounted(() => {
  unsubscribers.forEach(unsubscribe => unsubscribe())
  stopDrag()
})
</script>

<template>
  <section class="lycan-nav-music-player" :class="`is-${variant}`" aria-label="随机音乐">
    <button
      type="button"
      class="nav-music-cover-button"
      :disabled="isLoading"
      :aria-label="playButtonLabel"
      @click="togglePlayback"
    >
      <img
        class="nav-music-cover"
        :class="{ 'is-default-cover': !currentSong.cover }"
        :src="coverUrl"
        :alt="hasSong ? currentSong.name : '默认音乐封面'"
        loading="lazy"
      >
      <span class="nav-music-cover-mask">
        <svg v-if="isLoading" class="nav-music-loading-icon" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8"></circle>
        </svg>
        <svg v-else-if="isPlaying" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="7" y="5" width="3.5" height="14" rx="1"></rect>
          <rect x="13.5" y="5" width="3.5" height="14" rx="1"></rect>
        </svg>
        <svg v-else viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 5.5v13l11-6.5-11-6.5Z"></path>
        </svg>
      </span>
    </button>

    <div class="nav-music-center">
      <div class="nav-music-row">
        <span class="nav-music-title">{{ titleText }}</span>
        <span v-if="hasSong" class="nav-music-time">{{ formattedCurrentTime }} / {{ formattedDuration }}</span>
      </div>
      <div class="nav-music-artist">{{ artistText }}</div>
      <div
        class="nav-music-progress"
        :class="{ 'is-disabled': !hasSong || !isCurrentAudioLoaded() }"
        @click="setProgress"
        @mousedown="startDrag"
        @touchstart="startDrag"
      >
        <div ref="progressBarRef" class="nav-music-progress-track">
          <div class="nav-music-progress-fill" :style="{ width: `${progress}%` }"></div>
        </div>
      </div>
    </div>

    <button
      type="button"
      class="nav-music-next"
      :disabled="isLoading"
      aria-label="下一首随机音乐"
      @click="handleNextClick"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 5.5v13l9-6.5-9-6.5Z"></path>
        <path d="M17 6v12"></path>
      </svg>
    </button>
  </section>
</template>

<style scoped>
.lycan-nav-music-player {
  display: none;
}

.lycan-nav-music-player.is-dropdown {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) 34px;
  gap: 10px;
  align-items: stretch;
  min-width: 236px;
  padding: 12px;
  background-color: var(--vp-c-bg-soft);
}

.lycan-nav-music-player.is-dropdown .nav-music-cover-button {
  width: 42px;
  height: 42px;
}

.lycan-nav-music-player.is-dropdown .nav-music-next {
  width: 34px;
  min-height: 42px;
}

.lycan-nav-music-player.is-dropdown .nav-music-title {
  max-width: 112px;
}

.lycan-nav-music-player.is-dropdown .nav-music-time {
  font-size: 10px;
}

@media (max-width: 767px) {
  .lycan-nav-music-player.is-screen {
    display: grid;
    grid-template-columns: 46px minmax(0, 1fr) 36px;
    gap: 10px;
    align-items: stretch;
    border-top: 1px solid var(--vp-c-divider);
    border-radius: 0 0 3px 3px;
    padding: 12px 14px 14px 16px;
    background-color: var(--vp-c-bg-soft);
  }

  .lycan-nav-music-player.is-dropdown {
    display: none;
  }
}

.nav-music-cover-button,
.nav-music-next {
  border: 1px solid var(--vp-c-divider);
  border-radius: 3px;
  padding: 0;
  color: var(--vp-c-text-2);
  background-color: var(--vp-c-bg);
  cursor: pointer;
  transition:
    border-color var(--lc-motion-duration-fast) var(--lc-motion-ease-standard),
    color var(--lc-motion-duration-fast) var(--lc-motion-ease-standard),
    background-color var(--lc-motion-duration-fast) var(--lc-motion-ease-standard);
}

.nav-music-cover-button:hover,
.nav-music-next:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  background-color: color-mix(in srgb, var(--vp-c-brand-1) 8%, transparent);
}

.nav-music-cover-button:disabled,
.nav-music-next:disabled {
  cursor: wait;
  opacity: 0.72;
}

.nav-music-cover-button {
  position: relative;
  overflow: hidden;
  width: 46px;
  height: 46px;
}

.nav-music-cover {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.nav-music-cover.is-default-cover {
  opacity: 0.72;
}

.nav-music-cover-mask {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: rgba(0, 0, 0, 0.34);
  opacity: 0;
  transition: opacity var(--lc-motion-duration-fast) var(--lc-motion-ease-standard);
}

.nav-music-cover-button:hover .nav-music-cover-mask,
.nav-music-cover-button:focus-visible .nav-music-cover-mask,
.nav-music-cover-button:disabled .nav-music-cover-mask,
.nav-music-cover.is-default-cover + .nav-music-cover-mask {
  opacity: 1;
}

.nav-music-cover-mask svg {
  width: 18px;
  height: 18px;
  fill: currentColor;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.nav-music-loading-icon {
  fill: none !important;
  animation: nav-music-spin 0.8s linear infinite;
}

.nav-music-loading-icon circle {
  fill: none;
  stroke-dasharray: 36;
  stroke-dashoffset: 10;
}

.nav-music-center {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.nav-music-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}

.nav-music-title {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  color: var(--vp-c-text-1);
  font-size: 13px;
  font-weight: 600;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-music-time {
  flex: 0 0 auto;
  color: var(--vp-c-brand-1);
  font-size: 11px;
  line-height: 16px;
  white-space: nowrap;
}

.nav-music-artist {
  overflow: hidden;
  margin-top: 1px;
  color: var(--vp-c-text-3);
  font-size: 12px;
  line-height: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-music-progress {
  margin-top: 7px;
  padding: 4px 0;
  cursor: pointer;
}

.nav-music-progress.is-disabled {
  cursor: default;
}

.nav-music-progress-track {
  position: relative;
  overflow: hidden;
  height: 3px;
  border-radius: 999px;
  background-color: var(--vp-c-divider);
}

.nav-music-progress-fill {
  height: 100%;
  border-radius: inherit;
  background-color: var(--vp-c-brand-1);
  transition: width var(--lc-motion-duration-instant) linear;
}

.nav-music-next {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  min-height: 46px;
}

.nav-music-next svg {
  width: 18px;
  height: 18px;
  fill: currentColor;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

@keyframes nav-music-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
