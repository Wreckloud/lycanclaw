/**
 * musicApi.ts：
 * 提供musicApi相关的通用工具能力。
 */
import { getBackendApiBase } from '../runtimePolicy'

export interface MusicTrack {
  id: string
  name: string
  artist: string
  cover: string
}

export interface MusicTrackWithUrl extends MusicTrack {
  url: string
}

export interface MusicQueueItem {
  queueId: string
  id: string
  name: string
  artist: string
  cover: string
  url: string
  source: string
  priority: number
  enqueuedAt: string
}

export interface MusicQueueSnapshot {
  current: MusicQueueItem | null
  queueSize: number
  nextPreview: MusicQueueItem[]
}

export interface MusicFlowState {
  mode: 'idle' | 'random' | 'about-sequence' | 'interrupt-single'
  current: MusicQueueItem | null
  queueSize: number
  nextPreview: MusicQueueItem[]
}

export interface MusicLyricLine {
  timeMs: number
  text: string
}

export interface MusicTrackLyric {
  id: string
  hasLyric: boolean
  lines: MusicLyricLine[]
}

interface ApiError {
  code: string
  message: string
}

interface ApiResponse<T> {
  success: boolean
  data: T | null
  error?: ApiError | null
}

interface WeeklyRankingResponse {
  limit: number
  uid: string
  tracks: MusicTrack[]
}

interface TrackUrlResponse {
  id: string
  url: string
  level: string
}

interface TrackDetailWithUrlResponse extends MusicTrackWithUrl {
  level: string
}

interface AboutSequenceStartRequest {
  startSongId: string
}

interface InterruptSingleRequest {
  songId: string
  source: string
}

function normalizeHttps(url: string): string {
  if (!url) return ''
  return url.startsWith('http:') ? url.replace('http:', 'https:') : url
}

function withCoverSize(url: string, size = '120y120'): string {
  if (!url) return ''
  const normalized = normalizeHttps(url)
  if (!normalized.includes('music.126.net')) return normalized
  return normalized.includes('param=') ? normalized : `${normalized}?param=${size}`
}

function buildUrl(path: string, params: Record<string, string | number> = {}): string {
  const base = getBackendApiBase()
  const query = new URLSearchParams(
    Object.entries(params).map(([key, value]) => [key, String(value)])
  ).toString()
  return `${base}${path}${query ? `?${query}` : ''}`
}

const PLAYBACK_SESSION_STORAGE_KEY = 'lycan:playback-session-id'

function buildPlaybackSessionId(): string {
  const random = Math.random().toString(36).slice(2)
  return `lycan-${Date.now().toString(36)}-${random}`
}

function resolvePlaybackSessionId(): string {
  if (typeof window === 'undefined') {
    return buildPlaybackSessionId()
  }
  const existing = window.localStorage.getItem(PLAYBACK_SESSION_STORAGE_KEY)
  if (existing && existing.trim()) return existing.trim()
  const created = buildPlaybackSessionId()
  window.localStorage.setItem(PLAYBACK_SESSION_STORAGE_KEY, created)
  return created
}

async function requestJson<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  const response = await fetch(buildUrl(path, params), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Lycan-Playback-Session': resolvePlaybackSessionId()
    }
  })

  if (!response.ok) {
    throw new Error(`音乐后端请求失败: ${response.status}`)
  }

  const payload = (await response.json()) as ApiResponse<T>
  if (!payload?.success || !payload.data) {
    throw new Error(payload?.error?.message || '音乐后端返回数据异常')
  }

  return payload.data
}

async function requestPostJson<T>(path: string, body?: object): Promise<T> {
  const response = await fetch(buildUrl(path), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Lycan-Playback-Session': resolvePlaybackSessionId()
    },
    body: body ? JSON.stringify(body) : undefined
  })
  if (!response.ok) {
    throw new Error(`音乐后端请求失败: ${response.status}`)
  }
  const data = (await response.json()) as ApiResponse<T>
  if (!data.success || !data.data) {
    throw new Error(data?.error?.message || '音乐后端返回数据异常')
  }
  return data.data
}

export async function fetchWeeklyTracks(options: {
  uid?: string
  limit?: number
  coverSize?: string
  withTimestamp?: boolean
} = {}): Promise<MusicTrack[]> {
  const { limit = 20, coverSize = '120y120' } = options
  const payload = await requestJson<WeeklyRankingResponse>('/api/music/ranking/weekly', { limit })
  if (!Array.isArray(payload.tracks)) {
    return []
  }
  return payload.tracks.map((track) => ({
    id: String(track.id || ''),
    name: track.name || '',
    artist: track.artist || '',
    cover: withCoverSize(track.cover || '', coverSize)
  }))
}

export async function fetchTrackWithUrlById(
  id: string,
  coverSize = '120y120'
): Promise<MusicTrackWithUrl | null> {
  if (!id) return null

  const payload = await requestJson<TrackDetailWithUrlResponse>('/api/music/track/detail-with-url', { id })
  if (!payload?.url) {
    return null
  }

  return {
    id: String(payload.id || ''),
    name: payload.name || '',
    artist: payload.artist || '',
    cover: withCoverSize(payload.cover || '', coverSize),
    url: normalizeHttps(payload.url || '')
  }
}

export async function fetchTrackUrlById(id: string): Promise<string | null> {
  if (!id) return null
  const payload = await requestJson<TrackUrlResponse>('/api/music/track/url', { id })
  if (!payload?.url) return null
  return normalizeHttps(payload.url)
}

export async function startRandomFlow(): Promise<MusicFlowState> {
  return requestPostJson<MusicFlowState>('/api/music/flow/start-random')
}

export async function startAboutSequenceFlow(startSongId: string): Promise<MusicFlowState> {
  const payload: AboutSequenceStartRequest = { startSongId }
  return requestPostJson<MusicFlowState>('/api/music/flow/start-about-sequence', payload)
}

export async function interruptSingleFlow(songId: string, source: string): Promise<MusicFlowState> {
  const payload: InterruptSingleRequest = { songId, source }
  return requestPostJson<MusicFlowState>('/api/music/flow/interrupt-single', payload)
}

export async function playNextFromFlow(): Promise<MusicFlowState> {
  return requestPostJson<MusicFlowState>('/api/music/flow/next')
}

export async function fetchFlowState(): Promise<MusicFlowState> {
  return requestJson<MusicFlowState>('/api/music/flow/state')
}

export async function stopFlow(): Promise<MusicFlowState> {
  return requestPostJson<MusicFlowState>('/api/music/flow/stop')
}

export async function fetchTrackLyric(id: string): Promise<MusicTrackLyric | null> {
  if (!id) return null
  const payload = await requestJson<MusicTrackLyric>('/api/music/track/lyric', { id })
  if (!payload || !Array.isArray(payload.lines)) {
    return null
  }
  return {
    id: String(payload.id || ''),
    hasLyric: Boolean(payload.hasLyric),
    lines: payload.lines
      .map(line => ({
        timeMs: Number(line?.timeMs || 0),
        text: String(line?.text || '')
      }))
      .filter(line => line.text.trim().length > 0)
  }
}
