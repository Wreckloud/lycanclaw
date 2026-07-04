<script setup lang="ts">
/**
 * NavMusicPlayer.vue：
 * 窄屏导航菜单中的紧凑随机音乐入口。
 */
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { audioManager, audioService } from '../../utils/music'
import {
  playNextFromFlow,
  startRandomFlow,
  type MusicFlowState,
  type MusicPlaybackItem
} from '../../utils/music'
import { logError } from '../../utils/logger'

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
const unsubscribers: Array<() => void> = []

const hasSong = computed(() => Boolean(currentSong.value.id))
const titleText = computed(() => hasSong.value ? currentSong.value.name : '随机音乐')
const subtitleText = computed(() => {
  if (isLoading.value) return '正在寻找下一首'
  if (hasSong.value) return currentSong.value.artist || '未知歌手'
  return '从听歌排行里抽一首'
})
const playButtonLabel = computed(() => {
  if (isLoading.value) return '加载中'
  if (!hasSong.value) return '播放随机音乐'
  return isPlaying.value ? '暂停' : '播放'
})

function normalizeCoverUrl(coverUrl: string): string {
  if (!coverUrl) return ''
  let normalized = coverUrl.startsWith('http:') ? coverUrl.replace('http:', 'https:') : coverUrl
  if (normalized.includes('music.126.net') && !normalized.includes('param=')) {
    normalized += '?param=64y64'
  }
  return normalized
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

  const item = state.current
  updateCurrentSong(item)
  await audioService.play(
    currentSong.value.id,
    toAudioSongInfo(item),
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
}

function togglePlayback(): void {
  if (isLoading.value) return
  if (!hasSong.value) {
    void startRandomPlayback()
    return
  }

  const status = audioService.getPlayingStatus()
  const currentAudioLoaded = status.audioId === currentSong.value.id
  if (isPlaying.value || (currentAudioLoaded && status.isPlaying)) {
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
    status.audioId === currentSong.value.id ? status.currentTime : 0,
    NAV_PLAYBACK_REQUEST
  ).then(() => {
    isPlaying.value = true
  }).catch((error) => {
    isPlaying.value = false
    logError('NavMusicPlayer', '恢复播放失败', error)
  })
}

function setupEventListeners(): void {
  unsubscribers.push(audioManager.on('song-info-update', (payload) => {
    try {
      const parsed = JSON.parse(payload) as NavSongInfo & { isPlaying: boolean }
      if (!parsed.id) return
      currentSong.value = {
        id: parsed.id,
        name: parsed.name,
        artist: parsed.artist,
        cover: normalizeCoverUrl(parsed.cover)
      }
      isPlaying.value = parsed.isPlaying
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

  unsubscribers.push(audioManager.on('player-closed', () => {
    isPlaying.value = false
    currentSong.value = { id: '', name: '', artist: '', cover: '' }
  }))
}

onMounted(() => {
  setupEventListeners()
  syncFromAudioManager()
})

onUnmounted(() => {
  unsubscribers.forEach(unsubscribe => unsubscribe())
})
</script>

<template>
  <section class="lycan-nav-music-player" aria-label="随机音乐">
    <div class="nav-music-main">
      <img
        v-if="currentSong.cover"
        class="nav-music-cover"
        :src="currentSong.cover"
        :alt="currentSong.name"
        loading="lazy"
      >
      <div v-else class="nav-music-cover nav-music-cover-placeholder">♪</div>
      <button
        type="button"
        class="nav-music-info"
        :aria-label="playButtonLabel"
        @click="togglePlayback"
      >
        <span class="nav-music-title">{{ titleText }}</span>
        <span class="nav-music-subtitle">{{ subtitleText }}</span>
      </button>
    </div>
    <div class="nav-music-actions">
      <button
        type="button"
        class="nav-music-action"
        :disabled="isLoading"
        :aria-label="playButtonLabel"
        @click="togglePlayback"
      >
        <span v-if="isLoading" class="nav-music-loading"></span>
        <span v-else>{{ isPlaying ? '❚❚' : '▶' }}</span>
      </button>
      <button
        type="button"
        class="nav-music-action"
        :disabled="isLoading"
        aria-label="下一首随机音乐"
        @click="handleNextClick"
      >
        ⏭
      </button>
    </div>
  </section>
</template>

<style scoped>
.lycan-nav-music-player {
  display: none;
}

@media (max-width: 767px) {
  .lycan-nav-music-player {
    display: block;
    border-top: 1px solid var(--vp-c-divider);
    border-radius: 0 0 3px 3px;
    padding: 12px 14px 14px 16px;
    background-color: var(--vp-c-bg-soft);
  }

  .nav-music-main {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .nav-music-cover {
    flex: 0 0 auto;
    width: 34px;
    height: 34px;
    border-radius: 3px;
    object-fit: cover;
    background-color: var(--vp-c-bg-alt);
  }

  .nav-music-cover-placeholder {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--vp-c-divider);
    color: var(--vp-c-brand-1);
    font-size: 16px;
  }

  .nav-music-info {
    flex: 1 1 auto;
    min-width: 0;
    border: 0;
    padding: 0;
    background: transparent;
    text-align: left;
    cursor: pointer;
  }

  .nav-music-title,
  .nav-music-subtitle {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .nav-music-title {
    line-height: 18px;
    color: var(--vp-c-text-1);
    font-size: 13px;
    font-weight: 600;
  }

  .nav-music-subtitle {
    margin-top: 2px;
    line-height: 16px;
    color: var(--vp-c-text-3);
    font-size: 12px;
  }

  .nav-music-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: 10px;
  }

  .nav-music-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--vp-c-divider);
    border-radius: 3px;
    height: 30px;
    background-color: var(--vp-c-bg);
    color: var(--vp-c-text-2);
    font-size: 13px;
    cursor: pointer;
    transition:
      border-color var(--lc-motion-duration-fast) var(--lc-motion-ease-standard),
      color var(--lc-motion-duration-fast) var(--lc-motion-ease-standard),
      background-color var(--lc-motion-duration-fast) var(--lc-motion-ease-standard);
  }

  .nav-music-action:hover {
    border-color: var(--vp-c-brand-1);
    color: var(--vp-c-brand-1);
    background-color: color-mix(in srgb, var(--vp-c-brand-1) 8%, transparent);
  }

  .nav-music-action:disabled {
    cursor: wait;
    opacity: 0.72;
  }

  .nav-music-loading {
    width: 13px;
    height: 13px;
    border: 2px solid var(--vp-c-divider);
    border-top-color: var(--vp-c-brand-1);
    border-radius: 50%;
    animation: nav-music-spin 0.8s linear infinite;
  }
}

@keyframes nav-music-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
