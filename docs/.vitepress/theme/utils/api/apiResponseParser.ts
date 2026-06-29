/**
 * apiResponseParser.ts：
 * 解析后端统一响应结构，提取接口业务数据。
 */
interface ApiResponseEnvelope<T> {
  success?: boolean
  data?: T
  error?: {
    code?: string
    message?: string
  }
}

// 解析最新评论响应数据。
export function parseWalineRecentCommentsResponse<T = unknown>(payload: unknown): T[] {
  if (!payload || typeof payload !== 'object') return []
  const envelope = payload as ApiResponseEnvelope<unknown>
  return Array.isArray(envelope.data) ? (envelope.data as T[]) : []
}

// 解析阅读量响应数据。
export function parseWalinePageViewResponse(payload: unknown): number {
  if (!payload || typeof payload !== 'object') return 0
  const envelope = payload as ApiResponseEnvelope<unknown>
  return typeof envelope.data === 'number' ? envelope.data : 0
}
