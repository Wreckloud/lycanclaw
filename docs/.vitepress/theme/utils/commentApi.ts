/**
 * 评论API封装
 * 提供获取最新评论、评论数量与时间格式化能力。
 */
import { formatRecentCommentTime } from './timeDisplayPolicy'
import {
  parseWalineCommentCountResponse,
  parseWalineRecentCommentsResponse
} from './apiResponseParsers'

const WALINE_SERVER_URL = 'https://lycanclaw-comment.netlify.app/.netlify/functions/comment'
const COMMENT_ENDPOINT = `${WALINE_SERVER_URL}/comment`

const RECENT_COMMENTS_CACHE_KEY = 'lycan_recent_comments'
const RECENT_COMMENTS_CACHE_TIME_KEY = 'lycan_recent_comments_time'
const CACHE_EXPIRATION = 10 * 60 * 1000

export interface WalineComment {
  objectId: string
  comment: string
  nick: string
  mail: string
  link: string
  url: string
  insertedAt: string
  browser?: string
  os?: string
  level?: number
  avatar?: string
  addr?: string
  ip?: string
  pid?: string
  rid?: string
  status?: string
  ua?: string
  like?: number
  sticky?: boolean
  user_id?: string
  createdAt?: string
  updatedAt?: string
  ACL?: unknown
}

let isPreloading = false
let preloadPromise: Promise<WalineComment[]> | null = null

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && !!window.localStorage
}

function readCacheTimestamp(): number | null {
  if (!canUseStorage()) return null

  const raw = localStorage.getItem(RECENT_COMMENTS_CACHE_TIME_KEY)
  if (!raw) return null

  const parsed = Number.parseInt(raw, 10)
  return Number.isNaN(parsed) ? null : parsed
}

function getRecentCommentsFromCache(): WalineComment[] | null {
  if (!canUseStorage()) return null

  try {
    const cacheTime = readCacheTimestamp()
    if (!cacheTime || Date.now() - cacheTime > CACHE_EXPIRATION) {
      return null
    }

    const raw = localStorage.getItem(RECENT_COMMENTS_CACHE_KEY)
    return raw ? (JSON.parse(raw) as WalineComment[]) : null
  } catch {
    return null
  }
}

function saveRecentCommentsToCache(comments: WalineComment[]): void {
  if (!canUseStorage() || comments.length === 0) return

  try {
    localStorage.setItem(RECENT_COMMENTS_CACHE_KEY, JSON.stringify(comments))
    localStorage.setItem(RECENT_COMMENTS_CACHE_TIME_KEY, Date.now().toString())
  } catch {
    // Ignore storage quota / availability errors.
  }
}

export function clearCommentsCache(): void {
  if (!canUseStorage()) return

  try {
    localStorage.removeItem(RECENT_COMMENTS_CACHE_KEY)
    localStorage.removeItem(RECENT_COMMENTS_CACHE_TIME_KEY)
  } catch {
    // Ignore storage availability errors.
  }
}

async function requestJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    mode: 'cors',
    credentials: 'omit'
  })

  if (!response.ok) {
    throw new Error(`请求失败: ${response.status}`)
  }

  return (await response.json()) as T
}

function buildRecentCommentsUrl(count: number): string {
  return `${COMMENT_ENDPOINT}?type=recent&count=${count}&_t=${Date.now()}`
}

function buildCommentCountUrl(path: string): string {
  return `${COMMENT_ENDPOINT}?type=count&url=${encodeURIComponent(path)}`
}

export function preloadRecentComments(count: number = 5): void {
  if (typeof window === 'undefined' || isPreloading) return

  isPreloading = true

  const requestIdle =
    window.requestIdleCallback ||
    ((callback: () => void) => setTimeout(() => callback(), 1000))

  requestIdle(() => {
    getRecentComments(count).finally(() => {
      isPreloading = false
    })
  })
}

export async function getRecentComments(
  count: number = 5,
  forceRefresh: boolean = false
): Promise<WalineComment[]> {
  if (forceRefresh) {
    clearCommentsCache()
  }

  if (isPreloading && preloadPromise && !forceRefresh) {
    return preloadPromise
  }

  if (!forceRefresh) {
    const cached = getRecentCommentsFromCache()
    if (cached) return cached
  }

  const fetchPromise = (async () => {
    try {
      const data = await requestJson<unknown>(buildRecentCommentsUrl(count))
      const comments = parseWalineRecentCommentsResponse<WalineComment>(data)
      if (comments.length > 0) {
        saveRecentCommentsToCache(comments)
      }
      return comments
    } catch (error) {
      console.error('[CommentAPI] 获取最新评论失败:', error)
      return []
    }
  })()

  preloadPromise = fetchPromise

  fetchPromise.finally(() => {
    preloadPromise = null
    isPreloading = false
  })

  return fetchPromise
}

export async function getCommentCount(path: string): Promise<number> {
  if (!path) return 0

  try {
    const data = await requestJson<unknown>(buildCommentCountUrl(path))
    return parseWalineCommentCountResponse(data, path)
  } catch (error) {
    console.error('[CommentAPI] 获取评论数失败:', error)
    return 0
  }
}

export function formatCommentDate(dateString: string): string {
  return formatRecentCommentTime(dateString)
}
