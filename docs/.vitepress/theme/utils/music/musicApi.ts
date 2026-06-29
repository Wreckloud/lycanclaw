/**
 * 音乐后端 API。
 * 统一歌曲查询、会话播放流和歌词请求。
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
  urlSource: string
  trial: boolean
}

export interface MusicPlaybackItem {
  id: string
  name: string
  artist: string
  cover: string
  url: string
  source: string
  urlSource: string
}

export interface MusicFlowState {
  mode: 'idle' | 'random' | 'about-sequence' | 'interrupt-single'
  current: MusicPlaybackItem | null
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
  tracks: MusicTrack[]
}

interface TrackDetailWithUrlResponse extends MusicTrack {
  url: string
  level: string
  source: string
  trial: boolean
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
const PLAYBACK_SESSION_PATTERN = /^[A-Za-z0-9_-]{16,96}$/
const REQUEST_TIMEOUT_MS = 8_000
let memoryPlaybackSessionId = ''

function buildPlaybackSessionId(): string {
  const random = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID().replace(/-/g, '')
    : Math.random().toString(36).slice(2) + Date.now().toString(36)
  return `lycan-${Date.now().toString(36)}-${random}`
}

function isValidPlaybackSessionId(value: string | null): value is string {
  return value !== null && PLAYBACK_SESSION_PATTERN.test(value.trim())
}

function resolvePlaybackSessionId(): string {
  if (typeof window === 'undefined') {
    return buildPlaybackSessionId()
  }
  try {
    const existing = window.sessionStorage.getItem(PLAYBACK_SESSION_STORAGE_KEY)
    if (isValidPlaybackSessionId(existing)) return existing.trim()
    const created = memoryPlaybackSessionId || buildPlaybackSessionId()
    memoryPlaybackSessionId = created
    window.sessionStorage.setItem(PLAYBACK_SESSION_STORAGE_KEY, created)
    return created
  } catch {
    if (!memoryPlaybackSessionId) memoryPlaybackSessionId = buildPlaybackSessionId()
    return memoryPlaybackSessionId
  }
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = globalThis.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    globalThis.clearTimeout(timeoutId)
  }
}

async function parseApiResponse<T>(response: Response): Promise<T> {
  let payload: ApiResponse<T> | null = null
  try {
    payload = (await response.json()) as ApiResponse<T>
  } catch {
    throw new Error(`音乐后端返回了无效响应: ${response.status}`)
  }
  if (!response.ok || !payload.success || payload.data === null || payload.data === undefined) {
    throw new Error(payload.error?.message || `音乐后端请求失败: ${response.status}`)
  }
  return payload.data
}

async function requestJson<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  const response = await fetchWithTimeout(buildUrl(path, params), { method: 'GET' })
  return parseApiResponse<T>(response)
}

async function requestPostJson<T>(path: string, body?: object): Promise<T> {
  const headers: Record<string, string> = {
    'X-Lycan-Playback-Session': resolvePlaybackSessionId()
  }
  if (body) headers['Content-Type'] = 'application/json'
  const response = await fetchWithTimeout(buildUrl(path), {
    method: 'POST',
    headers,
    body: body ? JSON.stringify(body) : undefined
  })
  return parseApiResponse<T>(response)
}

export async function fetchWeeklyTracks(options: {
  limit?: number
  coverSize?: string
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
    url: normalizeHttps(payload.url || ''),
    urlSource: payload.source || 'unknown',
    trial: Boolean(payload.trial)
  }
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

export async function stopFlow(): Promise<MusicFlowState> {
  return requestPostJson<MusicFlowState>('/api/music/flow/stop')
}

export async function fetchTrackLyric(id: string): Promise<MusicTrackLyric | null> {
  if (!id) return null
  let payload: MusicTrackLyric
  try {
    payload = await requestJson<MusicTrackLyric>('/api/music/track/lyric', { id })
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      return null
    }
    throw error
  }
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
