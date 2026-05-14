/**
 * 网易云 API 适配层：
 * - 拉取周听歌榜
 * - 拉取歌曲详情与播放地址
 * - 统一 HTTPS 与封面参数
 */
import { addCorsProxy } from '../api/apiProxyPolicy'
import { getMusicApiBase, getMusicUid } from '../runtimePolicy'

export interface MusicTrack {
  id: string
  name: string
  artist: string
  cover: string
}

export interface MusicTrackWithUrl extends MusicTrack {
  url: string
}

interface RawArtist {
  name?: string
}

interface RawAlbum {
  picUrl?: string
}

interface RawSong {
  id?: string | number
  name?: string
  ar?: RawArtist[]
  al?: RawAlbum
}

interface RawWeekItem {
  song?: RawSong
}

interface SongUrlArrayItem {
  url?: string | null
}

interface SongUrlPayload {
  code?: number
  data?: SongUrlArrayItem[] | {
    url?: string | null
  } | null
}

function isWeekItem(item: RawWeekItem | RawSong): item is RawWeekItem {
  return 'song' in item
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

async function requestJson(path: string, params: Record<string, string | number> = {}) {
  const query = new URLSearchParams(
    Object.entries(params).map(([key, value]) => [key, String(value)])
  ).toString()
  const apiBase = getMusicApiBase()
  const url = addCorsProxy(`${apiBase}${path}${query ? `?${query}` : ''}`)
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`音乐接口请求失败: ${response.status}`)
  }
  return response.json()
}

function extractPlayableUrl(payload: SongUrlPayload): string | null {
  const data = payload?.data
  if (Array.isArray(data)) {
    const url = data[0]?.url
    return typeof url === 'string' && url ? normalizeHttps(url) : null
  }

  const url = data && typeof data === 'object' ? data.url : null
  return typeof url === 'string' && url ? normalizeHttps(url) : null
}

// 优先 /song/url，失败时回退 /song/download/url。
async function fetchTrackUrlPayload(id: string): Promise<SongUrlPayload> {
  const primaryPayload = await requestJson('/song/url', {
    id,
    timestamp: Date.now()
  }).catch(() => null)

  const primaryUrl = primaryPayload ? extractPlayableUrl(primaryPayload as SongUrlPayload) : null
  if (primaryUrl) {
    return primaryPayload as SongUrlPayload
  }

  return requestJson('/song/download/url', {
    id,
    timestamp: Date.now()
  }) as Promise<SongUrlPayload>
}

function parseArtistNames(artists: RawArtist[] = []): string {
  return artists.map((artist) => artist?.name).filter(Boolean).join('/')
}

function parseTrack(item: RawWeekItem | RawSong, coverSize: string): MusicTrack {
  const song = isWeekItem(item) ? item.song : item
  return {
    id: String(song?.id || ''),
    name: song?.name || '',
    artist: parseArtistNames(song?.ar),
    cover: withCoverSize(song?.al?.picUrl || '', coverSize)
  }
}

export async function fetchWeeklyTracks(options: {
  uid?: string
  limit?: number
  coverSize?: string
  withTimestamp?: boolean
} = {}): Promise<MusicTrack[]> {
  const {
    uid = getMusicUid(),
    limit,
    coverSize = '120y120',
    withTimestamp = true
  } = options

  const payload = await requestJson('/user/record', {
    uid,
    type: 1,
    ...(withTimestamp ? { timestamp: Date.now() } : {})
  })

  if (payload?.code !== 200 || !Array.isArray(payload?.weekData)) {
    throw new Error('音乐排行榜数据不可用')
  }

  const tracks = payload.weekData.map((item: RawWeekItem) => parseTrack(item, coverSize))
  return typeof limit === 'number' ? tracks.slice(0, limit) : tracks
}

export async function fetchTrackWithUrlById(
  id: string,
  coverSize = '120y120'
): Promise<MusicTrackWithUrl | null> {
  if (!id) return null

  const [detailPayload, urlPayload] = await Promise.all([
    requestJson('/song/detail', { ids: id }),
    fetchTrackUrlPayload(id)
  ])

  if (detailPayload?.code !== 200 || !Array.isArray(detailPayload?.songs) || detailPayload.songs.length === 0) {
    return null
  }

  const url = extractPlayableUrl(urlPayload)
  if (!url) {
    return null
  }

  const song = detailPayload.songs[0]
  return {
    id: String(song.id),
    name: song.name || '',
    artist: parseArtistNames(song.ar || []),
    cover: withCoverSize(song?.al?.picUrl || '', coverSize),
    url
  }
}

export async function fetchTrackUrlById(id: string): Promise<string | null> {
  if (!id) return null

  const payload = await fetchTrackUrlPayload(id)
  return extractPlayableUrl(payload)
}
