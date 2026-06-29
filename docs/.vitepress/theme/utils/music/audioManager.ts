/**
 * 全局音频协调器。
 * 维护当前歌曲快照，并按播放优先级决定是否允许切换音频。
 */
import { logError } from '../logger'

export interface SongInfo {
  id: string
  name: string
  artist: string
  cover: string
  isPlaying: boolean
  progress: number
  duration: number
  currentTime: number
  urlSource?: string
}

export interface PlaybackRequestContext {
  source?: string
  priority?: number
  allowInterrupt?: boolean
}

interface NormalizedPlaybackRequest {
  source: string
  priority: number
  allowInterrupt: boolean
}

function normalizeRequest(
  request: PlaybackRequestContext = {}
): NormalizedPlaybackRequest {
  return {
    source: request.source?.trim() || 'default',
    priority: Number.isFinite(request.priority) ? Math.max(1, Number(request.priority)) : 1,
    allowInterrupt: request.allowInterrupt !== false
  }
}

class AudioEventBus {
  private currentPlayingId = ''
  private currentSongInfo: SongInfo | null = null
  private currentRequest: NormalizedPlaybackRequest | null = null
  private listeners: Map<string, Array<(data: string) => void>> = new Map()

  on(event: string, callback: (data: string) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }

    this.listeners.get(event)?.push(callback)

    return () => {
      const eventListeners = this.listeners.get(event)
      if (!eventListeners) return
      const index = eventListeners.indexOf(callback)
      if (index !== -1) {
        eventListeners.splice(index, 1)
      }
    }
  }

  emit(event: string, data: string): void {
    if (event === 'song-info-update') {
      this.handleSongInfoUpdate(data)
    } else if (event === 'play-state-change') {
      this.handlePlayStateChange(data)
    } else if (event === 'progress-update') {
      this.handleProgressUpdate(data)
    }

    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data))
    }
  }

  // 同步全局当前歌曲快照，供全局播放器和各内嵌播放器共享。
  private handleSongInfoUpdate(data: string): void {
    try {
      const songInfo = JSON.parse(data) as SongInfo
      this.currentSongInfo = songInfo

      if (songInfo.isPlaying) {
        this.currentPlayingId = songInfo.id
      }
    } catch (error) {
      logError('audioManager', '解析歌曲信息失败', error)
    }
  }

  // 仅更新当前歌曲播放态，避免误写非当前歌曲状态。
  private handlePlayStateChange(data: string): void {
    try {
      const [id, state] = data.split(':')
      if (!id || !this.currentSongInfo || this.currentSongInfo.id !== id) return

      const isPlaying = state === 'true'
      this.currentSongInfo.isPlaying = isPlaying
      if (isPlaying) {
        this.currentPlayingId = id
      } else if (id === this.currentPlayingId) {
        this.currentPlayingId = ''
      }
    } catch (error) {
      logError('audioManager', '解析播放状态失败', error)
    }
  }

  // 写回 currentTime / duration / progress，保证拖动与恢复播放准确。
  private handleProgressUpdate(data: string): void {
    try {
      const [id, time, duration] = data.split(':')
      if (!id || !this.currentSongInfo || this.currentSongInfo.id !== id) return

      const parsedTime = Number.parseFloat(time)
      const parsedDuration = Number.parseFloat(duration)
      if (!Number.isNaN(parsedTime)) {
        this.currentSongInfo.currentTime = parsedTime
      }
      if (!Number.isNaN(parsedDuration) && parsedDuration > 0) {
        this.currentSongInfo.duration = parsedDuration
      }
      this.currentSongInfo.progress = this.currentSongInfo.duration > 0
        ? (this.currentSongInfo.currentTime / this.currentSongInfo.duration) * 100
        : 0
    } catch (error) {
      logError('audioManager', '解析进度信息失败', error)
    }
  }

  // 返回 false 表示当前请求未通过抢占策略，调用方应停止继续播放。
  requestPlayback(audioId: string, request: PlaybackRequestContext = {}): boolean {
    if (!audioId) return false
    const nextRequest = normalizeRequest(request)

    if (audioId === this.currentPlayingId) {
      this.currentRequest = nextRequest
      return true
    }

    const activeAudioId = this.currentPlayingId
    const activeRequest = this.currentRequest ?? normalizeRequest()
    if (activeAudioId) {
      const canPreempt =
        nextRequest.priority > activeRequest.priority ||
        (nextRequest.priority === activeRequest.priority && nextRequest.allowInterrupt)
      if (!canPreempt) {
        return false
      }

      this.emit('audio-pause', activeAudioId)
    }

    this.currentPlayingId = audioId
    this.currentRequest = nextRequest
    this.emit('current-audio-changed', audioId)
    return true
  }

  pauseCurrent(audioId?: string): void {
    if (!audioId || audioId === this.currentPlayingId) {
      this.currentPlayingId = ''
      this.currentRequest = null

      if (this.currentSongInfo) {
        this.currentSongInfo.isPlaying = false
      }
    }
  }

  clearCurrentSession(): void {
    this.currentPlayingId = ''
    this.currentRequest = null
    this.currentSongInfo = null
  }

  handlePlaybackCompleted(audioId: string): void {
    if (!audioId) return

    if (audioId === this.currentPlayingId) {
      this.currentPlayingId = ''
      this.currentRequest = null
      if (this.currentSongInfo?.id === audioId) {
        this.currentSongInfo.isPlaying = false
      }
    }
  }

  resetProgress(audioId: string): void {
    this.emit('audio-reset', audioId)

    if (this.currentSongInfo && this.currentSongInfo.id === audioId) {
      this.currentSongInfo.currentTime = 0
      this.currentSongInfo.progress = 0
    }
  }

  getCurrentPlayingId(): string {
    return this.currentPlayingId
  }

  getCurrentSongInfo(): SongInfo | null {
    return this.currentSongInfo
  }

  getCurrentRequest(): PlaybackRequestContext | null {
    return this.currentRequest ? { ...this.currentRequest } : null
  }

  syncCurrentSongInfo(): void {
    if (!this.currentSongInfo) return
    this.emit('song-info-update', JSON.stringify(this.currentSongInfo))
    this.emit('play-state-change', `${this.currentSongInfo.id}:${this.currentSongInfo.isPlaying}`)
  }
}

const audioManager = new AudioEventBus()

export default audioManager
