import { getBackendApiBase } from '../runtimePolicy'

const REQUEST_TIMEOUT_MS = 4000

export interface ArticleMetric {
  path: string
  pageviewCount: number
  commentCount: number
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
    commentCount: typeof record.commentCount === 'number' ? Math.max(0, record.commentCount) : 0
  }
}

async function requestJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
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
