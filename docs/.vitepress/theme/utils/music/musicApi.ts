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

interface QueueEnqueueResponse {
  action: string
  item: MusicQueueItem
  snapshot: MusicQueueSnapshot
}

interface QueueGenericResponse {
  snapshot: MusicQueueSnapshot
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

async function requestJson<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  const response = await fetch(buildUrl(path, params), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
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

export async function fetchMusicQueue(limit = 3): Promise<MusicQueueSnapshot> {
  return requestJson<MusicQueueSnapshot>('/api/music/queue', { limit })
}

export async function enqueueMusicQueueItem(payload: {
  id: string
  source?: string
  level?: string
}): Promise<QueueEnqueueResponse> {
  const response = await fetch(buildUrl('/api/music/queue/enqueue'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
  if (!response.ok) {
    throw new Error(`音乐队列入队失败: ${response.status}`)
  }
  const data = (await response.json()) as ApiResponse<QueueEnqueueResponse>
  if (!data.success || !data.data) {
    throw new Error(data?.error?.message || '音乐队列入队失败')
  }
  return data.data
}

export async function playNextFromMusicQueue(): Promise<QueueGenericResponse> {
  const response = await fetch(buildUrl('/api/music/queue/next'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  if (!response.ok) {
    throw new Error(`音乐队列切歌失败: ${response.status}`)
  }
  const data = (await response.json()) as ApiResponse<QueueGenericResponse>
  if (!data.success || !data.data) {
    throw new Error(data?.error?.message || '音乐队列切歌失败')
  }
  return data.data
}

export async function clearMusicQueue(keepCurrent = true): Promise<QueueGenericResponse> {
  const response = await fetch(buildUrl('/api/music/queue/clear', { keepCurrent: keepCurrent ? 'true' : 'false' }), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  if (!response.ok) {
    throw new Error(`清空音乐队列失败: ${response.status}`)
  }
  const data = (await response.json()) as ApiResponse<QueueGenericResponse>
  if (!data.success || !data.data) {
    throw new Error(data?.error?.message || '清空音乐队列失败')
  }
  return data.data
}
