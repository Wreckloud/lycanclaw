/**
 * Waline 返回值解析器：
 * - 屏蔽返回结构差异
 * - 统一输出组件可直接使用的数据
 */
interface NumberRecord {
  [key: string]: number | unknown
  data?: number | unknown
}

export interface WalineRecentCommentEnvelope<T> {
  data?: T[]
}

function normalizePathCandidates(path: string): string[] {
  const pathWithoutSlash = path.startsWith('/') ? path.slice(1) : path
  const pathWithSlash = path.startsWith('/') ? path : `/${path}`
  return [path, pathWithoutSlash, pathWithSlash]
}

// 兼容数组结果与 { data: [...] } 包装结果。
export function parseWalineRecentCommentsResponse<T = unknown>(data: unknown): T[] {
  if (Array.isArray(data)) return data

  if (data && typeof data === 'object' && 'data' in data) {
    const envelope = data as WalineRecentCommentEnvelope<T>
    if (Array.isArray(envelope.data)) {
      return envelope.data
    }
  }

  return []
}

// 评论数接口可能返回 number、{ data: number } 或 { [path]: number }。
export function parseWalineCommentCountResponse(data: unknown, path: string): number {
  if (typeof data === 'number') return data
  if (!data || typeof data !== 'object') return 0

  const record = data as NumberRecord
  if ('data' in record && typeof record.data === 'number') {
    return record.data
  }

  const candidates = normalizePathCandidates(path)
  for (const candidate of candidates) {
    if (typeof record[candidate] === 'number') {
      return record[candidate]
    }
  }

  return 0
}

export function parseWalinePageViewResponse(data: unknown): number {
  return typeof data === 'number' ? data : 0
}
