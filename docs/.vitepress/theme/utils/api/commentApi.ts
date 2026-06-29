/**
 * commentApi.ts：
 * 提供commentApi相关的通用工具能力。
 */
import { formatRecentCommentTime } from '../time/timeDisplayPolicy'
import { parseWalineRecentCommentsResponse } from './apiResponseParser'
import { logError } from '../logger'
import { getBackendApiBase } from '../runtimePolicy'

function getCommentEndpoint(): string {
  return `${getBackendApiBase()}/api/comments`
}

const RECENT_COMMENTS_CACHE_KEY = 'lycan_recent_comments_v3'
const RECENT_COMMENTS_CACHE_TIME_KEY = 'lycan_recent_comments_time_v3'
const RECENT_COMMENTS_CACHE_COUNT_KEY = 'lycan_recent_comments_count_v3'
const CACHE_EXPIRATION = 2 * 60 * 1000
const REQUEST_TIMEOUT_MS = 5000
export const RECENT_COMMENTS_UPDATED_EVENT = 'lycan:recent-comments-updated'

export interface RecentComment {
  id: string
  comment: string
  commentHtml?: string
  nick: string
  website?: string
  url: string
  path: string
  articleTitle?: string
  createdAt: string
}

let pendingRequest: { count: number; promise: Promise<RecentComment[]> } | null = null

function canUseStorage(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return !!window.localStorage
  } catch {
    return false
  }
}

function readCacheTimestamp(): number | null {
  if (!canUseStorage()) return null

  const raw = localStorage.getItem(RECENT_COMMENTS_CACHE_TIME_KEY)
  if (!raw) return null

  const parsed = Number.parseInt(raw, 10)
  return Number.isNaN(parsed) ? null : parsed
}

function getRecentCommentsFromCache(requiredCount: number): RecentComment[] | null {
  if (!canUseStorage()) return null

  try {
    const cacheTime = readCacheTimestamp()
    if (!cacheTime || Date.now() - cacheTime > CACHE_EXPIRATION) {
      return null
    }

    const cachedRequestCount = Number.parseInt(
      localStorage.getItem(RECENT_COMMENTS_CACHE_COUNT_KEY) || '',
      10
    )
    if (Number.isNaN(cachedRequestCount) || cachedRequestCount < requiredCount) {
      return null
    }

    const raw = localStorage.getItem(RECENT_COMMENTS_CACHE_KEY)
    return raw ? (JSON.parse(raw) as RecentComment[]) : null
  } catch {
    return null
  }
}

function saveRecentCommentsToCache(comments: RecentComment[], requestedCount: number): void {
  if (!canUseStorage()) return

  try {
    localStorage.setItem(RECENT_COMMENTS_CACHE_KEY, JSON.stringify(comments))
    localStorage.setItem(RECENT_COMMENTS_CACHE_TIME_KEY, Date.now().toString())
    localStorage.setItem(RECENT_COMMENTS_CACHE_COUNT_KEY, String(requestedCount))
  } catch {
    // Ignore storage quota / availability errors.
  }
}

export function clearCommentsCache(): void {
  if (!canUseStorage()) return

  try {
    localStorage.removeItem(RECENT_COMMENTS_CACHE_KEY)
    localStorage.removeItem(RECENT_COMMENTS_CACHE_TIME_KEY)
    localStorage.removeItem(RECENT_COMMENTS_CACHE_COUNT_KEY)
  } catch {
    // Ignore storage availability errors.
  }
}

export function notifyRecentCommentsUpdated(): void {
  clearCommentsCache()
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(RECENT_COMMENTS_UPDATED_EVENT))
  }
}

async function requestJson<T>(url: string): Promise<T> {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
  const response = await fetch(url, {
    method: 'GET',
    mode: 'cors',
    credentials: 'omit',
    signal: controller.signal
  })

  if (!response.ok) {
    throw new Error(`请求失败: ${response.status}`)
  }

  return (await response.json()) as T
  } finally {
    window.clearTimeout(timeoutId)
  }
}

function buildRecentCommentsUrl(count: number): string {
  return `${getCommentEndpoint()}/recent?limit=${count}&_t=${Date.now()}`
}

export function preloadRecentComments(count: number = 7): void {
  if (typeof window === 'undefined') return

  const requestIdle =
    window.requestIdleCallback ||
    ((callback: () => void) => setTimeout(() => callback(), 1000))

  requestIdle(() => {
    void getRecentComments(count).catch(() => undefined)
  })
}

export async function getRecentComments(
  count: number = 5,
  forceRefresh: boolean = false
): Promise<RecentComment[]> {
  if (forceRefresh) {
    clearCommentsCache()
  }

  if (!forceRefresh && pendingRequest && pendingRequest.count >= count) {
    return pendingRequest.promise
  }

  if (!forceRefresh) {
    const cached = getRecentCommentsFromCache(count)
    if (cached) return cached
  }

  const fetchPromise = (async () => {
    try {
      const data = await requestJson<unknown>(buildRecentCommentsUrl(count))
      const comments = parseWalineRecentCommentsResponse<RecentComment>(data)
      saveRecentCommentsToCache(comments, count)
      return comments
    } catch (error) {
      logError('commentApi', '获取最新评论失败', error)
      throw error
    }
  })()

  pendingRequest = { count, promise: fetchPromise }

  void fetchPromise.then(() => {
    if (pendingRequest?.promise === fetchPromise) {
      pendingRequest = null
    }
  }, () => {
    if (pendingRequest?.promise === fetchPromise) {
      pendingRequest = null
    }
  })

  return fetchPromise
}

export function formatCommentDate(dateString: string): string {
  return formatRecentCommentTime(dateString)
}
