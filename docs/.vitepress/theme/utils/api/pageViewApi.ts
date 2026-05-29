/**
 * pageViewApi.ts：
 * 提供pageViewApi相关的通用工具能力。
 */
import { parseWalinePageViewResponse } from './apiResponseParser'
import { logError } from '../logger'
import { getBackendApiBase } from '../runtimePolicy'

function getArticleEndpoint(): string {
  return `${getBackendApiBase()}/api/stats/pageview`
}

const PAGEVIEW_CACHE_PREFIX = 'lycan_pageview_'
const PAGEVIEW_CACHE_TIME_SUFFIX = '_time'
const CACHE_EXPIRATION = 30 * 60 * 1000

const VISIT_RECORD_PREFIX = 'lycan_visit_record_'
const VISIT_RECORD_EXPIRATION = 30 * 60 * 1000

const updatingPaths = new Set<string>()

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && !!window.localStorage
}

function parseStoredInt(value: string | null): number | null {
  if (!value) return null
  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? null : parsed
}

function getPageViewCacheKey(path: string): string {
  return `${PAGEVIEW_CACHE_PREFIX}${path}`
}

function getVisitRecordKey(path: string): string {
  return `${VISIT_RECORD_PREFIX}${path}`
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    mode: 'cors',
    credentials: 'omit',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    }
  })

  if (!response.ok) {
    throw new Error(`请求失败: ${response.status}`)
  }

  if (response.status === 204) {
    return null as T
  }

  return (await response.json()) as T
}

function buildGetPageViewUrl(path: string): string {
  return `${getArticleEndpoint()}?path=${encodeURIComponent(path)}`
}

function isLocalhost(): boolean {
  return typeof window !== 'undefined' && window.location.hostname === 'localhost'
}

function createMockPageView(): number {
  return Math.floor(Math.random() * 100) + 10
}

function savePageViewToCache(path: string, count: number): void {
  if (!canUseStorage() || !count) return

  try {
    const key = getPageViewCacheKey(path)
    localStorage.setItem(key, count.toString())
    localStorage.setItem(`${key}${PAGEVIEW_CACHE_TIME_SUFFIX}`, Date.now().toString())
  } catch {
    // Ignore storage availability errors.
  }
}

function clearPageViewCache(path: string): void {
  if (!canUseStorage()) return

  try {
    const key = getPageViewCacheKey(path)
    localStorage.removeItem(key)
    localStorage.removeItem(`${key}${PAGEVIEW_CACHE_TIME_SUFFIX}`)
  } catch {
    // Ignore storage availability errors.
  }
}

export function getPageViewFromCache(path: string): number | null {
  if (!canUseStorage()) return null

  try {
    const key = getPageViewCacheKey(path)
    const cachedValue = parseStoredInt(localStorage.getItem(key))
    if (cachedValue === null) return null

    const cacheTime = parseStoredInt(localStorage.getItem(`${key}${PAGEVIEW_CACHE_TIME_SUFFIX}`))
    if (!cacheTime) return null

    if (Date.now() - cacheTime > CACHE_EXPIRATION) {
      clearPageViewCache(path)
      return null
    }

    return cachedValue
  } catch {
    return null
  }
}

function shouldUpdateVisit(path: string): boolean {
  if (!canUseStorage()) return true

  try {
    const recordKey = getVisitRecordKey(path)
    const now = Date.now()
    const lastVisit = parseStoredInt(localStorage.getItem(recordKey))

    if (!lastVisit || now - lastVisit > VISIT_RECORD_EXPIRATION) {
      localStorage.setItem(recordKey, now.toString())
      return true
    }

    return false
  } catch {
    return true
  }
}

function resolvePath(path?: string): string {
  if (path) return path
  if (typeof window === 'undefined') return ''
  return window.location.pathname
}

export async function getPageView(path?: string, fallbackValue: number = 1): Promise<number> {
  const currentPath = resolvePath(path)
  if (!currentPath) return fallbackValue

  const cachedCount = getPageViewFromCache(currentPath)
  if (cachedCount !== null) {
    return cachedCount
  }

  try {
    const data = await requestJson<unknown>(buildGetPageViewUrl(currentPath), {
      method: 'GET'
    })
    const count = parseWalinePageViewResponse(data)

    if (count > 0) {
      savePageViewToCache(currentPath, count)
      return count
    }

    return fallbackValue
  } catch (error) {
    logError('pageViewApi', '获取页面浏览量失败', error)

    if (isLocalhost()) {
      const mockCount = createMockPageView()
      savePageViewToCache(currentPath, mockCount)
      return mockCount
    }

    return fallbackValue
  }
}

export async function updatePageView(path?: string): Promise<boolean> {
  const currentPath = resolvePath(path)
  if (!currentPath) return false

  if (!shouldUpdateVisit(currentPath)) {
    return false
  }

  if (updatingPaths.has(currentPath)) {
    return false
  }

  try {
    updatingPaths.add(currentPath)

    const data = await requestJson<unknown>(getArticleEndpoint(), {
      method: 'POST',
      body: JSON.stringify({ path: currentPath })
    })

    const count = parseWalinePageViewResponse(data)
    if (count > 0) {
      savePageViewToCache(currentPath, count)
      return true
    }

    return false
  } catch (error) {
    logError('pageViewApi', '更新页面浏览量失败', error)
    return false
  } finally {
    updatingPaths.delete(currentPath)
  }
}

export async function getAndUpdatePageView(
  path?: string,
  fallbackValue: number = 1
): Promise<number> {
  const currentPath = resolvePath(path)
  if (!currentPath) return fallbackValue

  await updatePageView(currentPath)
  return getPageView(currentPath, fallbackValue)
}

export async function getSiteUV(fallbackValue: number = 100): Promise<number> {
  return fallbackValue
}
