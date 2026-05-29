/**
 * recommendedApi.ts：
 * 提供recommendedApi相关的通用工具能力。
 */
import { getBackendApiBase } from '../runtimePolicy'
import { logError } from '../logger'

export interface RecommendedPost {
  url: string
  title: string
  description: string
  date: string
  tags: string[]
  pageviewCount?: number
  commentCount?: number
  hotScore?: number
  manualPinned?: boolean
}

interface ApiResponseEnvelope<T> {
  success?: boolean
  data?: T
  error?: {
    code?: string
    message?: string
  }
}

function buildRecommendationsUrl(limit: number): string {
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(limit, 20)) : 5
  return `${getBackendApiBase()}/api/recommendations?limit=${safeLimit}`
}

function normalizePost(item: unknown): RecommendedPost | null {
  if (!item || typeof item !== 'object') return null
  const record = item as Record<string, unknown>

  const url = typeof record.url === 'string' ? record.url : ''
  const title = typeof record.title === 'string' ? record.title : ''
  const date = typeof record.date === 'string' ? record.date : ''
  if (!url || !title || !date) return null

  const description = typeof record.description === 'string' ? record.description : ''
  const tags = Array.isArray(record.tags)
    ? record.tags.filter((tag): tag is string => typeof tag === 'string')
    : []

  return {
    url,
    title,
    description,
    date,
    tags,
    pageviewCount: typeof record.pageviewCount === 'number' ? record.pageviewCount : undefined,
    commentCount: typeof record.commentCount === 'number' ? record.commentCount : undefined,
    hotScore: typeof record.hotScore === 'number' ? record.hotScore : undefined,
    manualPinned: typeof record.manualPinned === 'boolean' ? record.manualPinned : undefined
  }
}

function parseRecommendationResponse(payload: unknown): RecommendedPost[] {
  if (!payload || typeof payload !== 'object') return []

  const envelope = payload as ApiResponseEnvelope<unknown>
  const rawData = envelope.data

  if (!Array.isArray(rawData)) return []

  return rawData
    .map((item) => normalizePost(item))
    .filter((item): item is RecommendedPost => item !== null)
}

export async function fetchRecommendedPosts(maxPosts: number): Promise<RecommendedPost[]> {
  try {
    const response = await fetch(buildRecommendationsUrl(maxPosts), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`请求失败: ${response.status}`)
    }

    const payload = (await response.json()) as unknown
    return parseRecommendationResponse(payload).slice(0, maxPosts)
  } catch (error) {
    logError('recommendedApi', '加载推荐文章数据失败', error)
    return []
  }
}
