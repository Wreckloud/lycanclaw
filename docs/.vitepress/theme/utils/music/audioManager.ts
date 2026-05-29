/**
 * audioManager.ts：
 * 提供audioManager相关的通用工具能力。
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
}

export interface PlaybackRequestContext {
  source?: string
  priority?: number
  allowInterrupt?: boolean
  resumeInterrupted?: boolean
}

interface NormalizedPlaybackRequest {
  source: string
  priority: number
  allowInterrupt: boolean
  resumeInterrupted: boolean
}

interface InterruptedPlaybackSnapshot {
  audioId: string
  currentTime: number
  request: NormalizedPlaybackRequest
}

function normalizeRequest(
  request: PlaybackRequestContext = {}
): NormalizedPlaybackRequest {
  return {
    source: request.source?.trim() || 'default',
    priority: Number.isFinite(request.priority) ? Math.max(1, Number(request.priority)) : 1,
    allowInterrupt: request.allowInterrupt !== false,
    resumeInterrupted: request.resumeInterrupted !== false
  }
}

class AudioEventBus {
  private currentPlayingId = ''
  private lastPlayedId = ''
  private currentSongInfo: SongInfo | null = null
  private currentRequest: NormalizedPlaybackRequest | null = null
  private interruptedStack: InterruptedPlaybackSnapshot[] = []
  private registeredPlayers: Set<string> = new Set()
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
    } else if (event === 'audio-error') {
      this.handlePlaybackCompleted(data)
    } else if (event === 'progress-update') {
      this.handleProgressUpdate(data)
    } else if (event === 'register-player') {
      this.registeredPlayers.add(data)
    } else if (event === 'unregister-player') {
      this.registeredPlayers.delete(data)
    } else if (event === 'player-closed') {
      this.handlePlaybackCompleted(data)
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
        this.lastPlayedId = songInfo.id
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

      this.saveInterruptedSnapshot(activeAudioId, activeRequest, audioId)
      this.emit('audio-pause', activeAudioId)
    }

    this.currentPlayingId = audioId
    this.currentRequest = nextRequest
    this.lastPlayedId = audioId
    this.emit('current-audio-changed', audioId)
    return true
  }

  private saveInterruptedSnapshot(
    interruptedAudioId: string,
    interruptedRequest: NormalizedPlaybackRequest,
    incomingAudioId: string
  ): void {
    if (!interruptedRequest.resumeInterrupted) return
    if (!this.currentSongInfo || !this.currentSongInfo.isPlaying) return
    if (this.currentSongInfo.id !== interruptedAudioId) return
    if (interruptedAudioId === incomingAudioId) return

    const snapshot: InterruptedPlaybackSnapshot = {
      audioId: interruptedAudioId,
      currentTime: this.currentSongInfo.currentTime,
      request: interruptedRequest
    }

    this.interruptedStack = this.interruptedStack.filter(item => item.audioId !== interruptedAudioId)
    this.interruptedStack.push(snapshot)
  }

  setCurrentPlaying(audioId: string): void {
    this.requestPlayback(audioId, {
      source: 'legacy',
      priority: 1,
      allowInterrupt: true,
      resumeInterrupted: false
    })
  }

  pauseCurrent(audioId?: string): void {
    if (!audioId || audioId === this.currentPlayingId) {
      if (this.currentPlayingId) {
        this.lastPlayedId = this.currentPlayingId
      }
      this.currentPlayingId = ''
      this.currentRequest = null

      if (this.currentSongInfo) {
        this.currentSongInfo.isPlaying = false
      }
    }
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

    this.restoreInterruptedPlayback(audioId)
  }

  private restoreInterruptedPlayback(completedAudioId: string): void {
    while (this.interruptedStack.length > 0) {
      const snapshot = this.interruptedStack.pop()
      if (!snapshot) return
      if (snapshot.audioId === completedAudioId) continue
      if (snapshot.audioId === this.currentPlayingId) continue

      const payload = JSON.stringify({
        audioId: snapshot.audioId,
        currentTime: snapshot.currentTime,
        request: snapshot.request
      })
      this.emit('resume-playback', payload)
      return
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

  getLastPlayedId(): string {
    return this.lastPlayedId
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

  registerPlayer(audioId: string): void {
    this.emit('register-player', audioId)
  }

  unregisterPlayer(audioId: string): void {
    this.emit('unregister-player', audioId)
  }

  getRegisteredPlayers(): string[] {
    return Array.from(this.registeredPlayers)
  }
}

const audioManager = new AudioEventBus()

export default audioManager
