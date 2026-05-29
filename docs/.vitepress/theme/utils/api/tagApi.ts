/**
 * tagApi.ts：
 * 提供tagApi相关的通用工具能力。
 */
import { getBackendApiBase } from '../runtimePolicy'
import { logError } from '../logger'

export interface ThoughtTagItem {
  tag: string
  count: number
}

export interface ThoughtPostSummary {
  url: string
  title: string
  description: string
  date: string
  tags: string[]
  excerpt: string
  readMinutes: number
}

export interface ThoughtTagFilterResult {
  tag: string
  page: number
  pageSize: number
  total: number
  totalPages: number
  posts: ThoughtPostSummary[]
}

interface ApiResponseEnvelope<T> {
  success?: boolean
  data?: T
  error?: {
    code?: string
    message?: string
  }
}

interface ThoughtTagsPayload {
  tags?: ThoughtTagItem[]
  totalTags?: number
  totalPosts?: number
}

async function requestData<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${getBackendApiBase()}${path}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`请求失败: ${response.status}`)
    }

    const payload = (await response.json()) as ApiResponseEnvelope<T>
    return payload.data ?? null
  } catch (error) {
    logError('tagApi', `请求失败: ${path}`, error)
    return null
  }
}

export async function fetchThoughtTags(): Promise<{ tags: ThoughtTagItem[]; totalPosts: number }> {
  const data = await requestData<ThoughtTagsPayload>('/api/tags/thoughts')
  const tags = Array.isArray(data?.tags)
    ? data.tags.filter((item): item is ThoughtTagItem => !!item && typeof item.tag === 'string' && typeof item.count === 'number')
    : []

  return {
    tags,
    totalPosts: typeof data?.totalPosts === 'number' ? data.totalPosts : 0
  }
}

export async function fetchThoughtPostsByTag(options: {
  tag?: string
  page: number
  pageSize: number
}): Promise<ThoughtTagFilterResult> {
  const params = new URLSearchParams()
  params.set('page', String(Math.max(1, options.page)))
  params.set('pageSize', String(Math.max(1, Math.min(options.pageSize, 50))))
  if (options.tag && options.tag.trim()) {
    params.set('tag', options.tag.trim())
  }

  const data = await requestData<ThoughtTagFilterResult>(`/api/tags/thoughts/filter?${params.toString()}`)

  if (!data) {
    return {
      tag: options.tag?.trim() || '',
      page: options.page,
      pageSize: options.pageSize,
      total: 0,
      totalPages: 0,
      posts: []
    }
  }

  return {
    tag: typeof data.tag === 'string' ? data.tag : '',
    page: typeof data.page === 'number' ? data.page : options.page,
    pageSize: typeof data.pageSize === 'number' ? data.pageSize : options.pageSize,
    total: typeof data.total === 'number' ? data.total : 0,
    totalPages: typeof data.totalPages === 'number' ? data.totalPages : 0,
    posts: Array.isArray(data.posts) ? data.posts : []
  }
}
