import { getBackendApiBase } from '../runtimePolicy'

const REQUEST_TIMEOUT_MS = 4000

export interface ArticleMetric {
  path: string
  pageviewCount: number
  commentCount: number
  syncedAt: string | null
}

interface ApiResponseEnvelope<T> {
  data?: T
}

function normalizeMetric(value: unknown, fallbackPath = ''): ArticleMetric {
  const record = value && typeof value === 'object'
    ? value as Record<string, unknown>
    : {}
  return {
    path: typeof record.path === 'string' ? record.path : fallbackPath,
    pageviewCount: typeof record.pageviewCount === 'number' ? Math.max(0, record.pageviewCount) : 0,
    commentCount: typeof record.commentCount === 'number' ? Math.max(0, record.commentCount) : 0,
    syncedAt: typeof record.syncedAt === 'string' ? record.syncedAt : null
  }
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    }
  })
  if (!response.ok) {
    throw new Error(`请求失败: ${response.status}`)
  }
  const envelope = await response.json() as ApiResponseEnvelope<T>
  if (envelope.data === undefined) {
    throw new Error('文章指标响应缺少 data')
  }
  return envelope.data
}

export async function fetchArticleMetric(path: string): Promise<ArticleMetric> {
  const normalizedPath = path.trim()
  const data = await requestJson<unknown>(
    `${getBackendApiBase()}/api/article-metrics?path=${encodeURIComponent(normalizedPath)}`
  )
  return normalizeMetric(data, normalizedPath)
}

export async function fetchArticleMetrics(paths: string[]): Promise<ArticleMetric[]> {
  const normalizedPaths = [...new Set(paths.map((path) => path.trim()).filter(Boolean))]
  if (normalizedPaths.length === 0) return []
  const data = await requestJson<unknown[]>(`${getBackendApiBase()}/api/article-metrics/batch`, {
    method: 'POST',
    body: JSON.stringify({ paths: normalizedPaths })
  })
  return Array.isArray(data)
    ? data.map((metric, index) => normalizeMetric(metric, normalizedPaths[index] || ''))
    : []
}
