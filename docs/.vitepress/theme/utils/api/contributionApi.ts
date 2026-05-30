/**
 * contributionApi.ts：
 * 提供contributionApi相关的通用工具能力。
 */
import { getBackendApiBase } from '../runtimePolicy'

export interface DailyContributionRecord {
  date: string
  additions: number
  deletions: number
  total: number
}

interface ApiResponse<T> {
  success: boolean
  data: T | null
  error?: {
    code: string
    message: string
  } | null
}

interface DailyContributionResponse {
  generatedAt: string
  timezone: string
  metric: string
  days: number
  scope: string[]
  data: DailyContributionRecord[]
}

const CONTRIBUTION_CACHE_TTL_MS = 10 * 60 * 1000
const contributionMemoryCache = new Map<string, { expiresAt: number; payload: DailyContributionResponse }>()

function buildDailyContributionsUrl(days?: number): string {
  const query = typeof days === 'number' && days > 0 ? `?days=${Math.floor(days)}` : ''
  return `${getBackendApiBase()}/api/contributions/daily${query}`
}

function getContributionCacheKey(days?: number): string {
  return typeof days === 'number' && days > 0 ? `days:${Math.floor(days)}` : 'days:default'
}

function readContributionCache(key: string): DailyContributionResponse | null {
  const cached = contributionMemoryCache.get(key)
  if (!cached) return null
  if (cached.expiresAt <= Date.now()) {
    contributionMemoryCache.delete(key)
    return null
  }
  return cached.payload
}

function writeContributionCache(key: string, payload: DailyContributionResponse): void {
  contributionMemoryCache.set(key, {
    expiresAt: Date.now() + CONTRIBUTION_CACHE_TTL_MS,
    payload
  })
}

export async function fetchDailyContributionPayload(days?: number): Promise<DailyContributionResponse> {
  const cacheKey = getContributionCacheKey(days)
  const cached = readContributionCache(cacheKey)
  if (cached) return cached

  const response = await fetch(buildDailyContributionsUrl(days), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`加载日贡献数据失败: ${response.status}`)
  }

  const payload = (await response.json()) as ApiResponse<DailyContributionResponse>
  if (!payload?.success || !payload.data || !Array.isArray(payload.data.data)) {
    throw new Error(payload?.error?.message || '日贡献接口返回格式错误')
  }

  writeContributionCache(cacheKey, payload.data)
  return payload.data
}

export async function fetchDailyContributions(days?: number): Promise<DailyContributionRecord[]> {
  const payload = await fetchDailyContributionPayload(days)
  return payload.data
}
