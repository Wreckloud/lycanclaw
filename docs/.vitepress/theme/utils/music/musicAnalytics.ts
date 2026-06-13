/**
 * musicAnalytics.ts：
 * 统一记录全局音频的实际播放时长，并按会话向后端幂等结算。
 */
import audioManager, { type SongInfo } from './audioManager'
import { getBackendApiBase } from '../runtimePolicy'
import { getVisitorId } from '../visitorIdentity'

const SETTLE_INTERVAL_MS = 30_000
let initialized = false

interface ActiveListen {
  listenSessionId: string
  audioId: string
  songId: string
  songName: string
  artist: string
  playbackSource: string
  urlSource: string
  pagePath: string
  listenedMs: number
  durationMs: number
  playingSince: number | null
}

let activeListen: ActiveListen | null = null

function createSessionId(audioId: string): string {
  const random = Math.random().toString(36).slice(2, 10)
  return `${audioId}-${Date.now().toString(36)}-${random}`
}

function normalizeSongId(audioId: string): string {
  return audioId.replace(/^(netease|url|player)-/, '')
}

function accruePlayingTime(): void {
  if (!activeListen?.playingSince) return
  const now = Date.now()
  activeListen.listenedMs += Math.max(0, now - activeListen.playingSince)
  activeListen.playingSince = now
}

function payload(completed: boolean) {
  if (!activeListen) return null
  accruePlayingTime()
  return {
    listenSessionId: activeListen.listenSessionId,
    visitorId: getVisitorId(),
    songId: activeListen.songId,
    songName: activeListen.songName,
    artist: activeListen.artist,
    playbackSource: activeListen.playbackSource,
    urlSource: activeListen.urlSource,
    pagePath: activeListen.pagePath,
    listenedMs: Math.round(activeListen.listenedMs),
    durationMs: Math.round(activeListen.durationMs),
    completed
  }
}

function settle(completed = false, beacon = false): void {
  const body = payload(completed)
  if (!body || body.listenedMs <= 0) return
  const url = `${getBackendApiBase()}/api/music/analytics/settle`
  if (beacon && navigator.sendBeacon) {
    navigator.sendBeacon(url, new Blob([JSON.stringify(body)], { type: 'application/json' }))
    return
  }
  void fetch(url, {
    method: 'POST',
    mode: 'cors',
    credentials: 'omit',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    keepalive: true
  }).catch(() => undefined)
}

function startOrUpdateListen(info: SongInfo): void {
  if (!info.id) return
  if (!activeListen || activeListen.audioId !== info.id) {
    settle(false)
    const request = audioManager.getCurrentRequest()
    activeListen = {
      listenSessionId: createSessionId(info.id),
      audioId: info.id,
      songId: normalizeSongId(info.id),
      songName: info.name,
      artist: info.artist,
      playbackSource: request?.source || 'unknown',
      urlSource: info.urlSource || 'unknown',
      pagePath: window.location.pathname,
      listenedMs: 0,
      durationMs: Math.max(0, info.duration * 1000),
      playingSince: info.isPlaying ? Date.now() : null
    }
    return
  }

  activeListen.songName = info.name
  activeListen.artist = info.artist
  activeListen.urlSource = info.urlSource || activeListen.urlSource
  activeListen.durationMs = Math.max(activeListen.durationMs, info.duration * 1000)
  if (info.isPlaying && activeListen.playingSince === null) {
    activeListen.playingSince = Date.now()
  }
}

function handlePlayState(data: string): void {
  if (!activeListen) return
  const [audioId, state] = data.split(':')
  if (audioId !== activeListen.audioId) return
  if (state === 'true') {
    if (activeListen.playingSince === null) activeListen.playingSince = Date.now()
    return
  }
  accruePlayingTime()
  activeListen.playingSince = null
  settle(false)
}

function handleProgress(data: string): void {
  if (!activeListen) return
  const [audioId, , duration] = data.split(':')
  if (audioId !== activeListen.audioId) return
  const parsedDuration = Number.parseFloat(duration)
  if (Number.isFinite(parsedDuration) && parsedDuration > 0) {
    activeListen.durationMs = Math.max(activeListen.durationMs, parsedDuration * 1000)
  }
}

/**
 * 在全局音频事件总线上安装一次收听统计监听。
 */
export function setupMusicAnalytics(): void {
  if (initialized || typeof window === 'undefined') return
  initialized = true

  audioManager.on('song-info-update', (data) => {
    try {
      startOrUpdateListen(JSON.parse(data) as SongInfo)
    } catch {
      // 无效歌曲快照不影响播放。
    }
  })
  audioManager.on('play-state-change', handlePlayState)
  audioManager.on('progress-update', handleProgress)
  audioManager.on('song-ended', (audioId) => {
    if (activeListen?.audioId !== audioId) return
    settle(true)
    activeListen = null
  })
  audioManager.on('player-closed', () => {
    settle(false)
    activeListen = null
  })

  setInterval(() => settle(false), SETTLE_INTERVAL_MS)
  window.addEventListener('pagehide', () => settle(false, true))
}
