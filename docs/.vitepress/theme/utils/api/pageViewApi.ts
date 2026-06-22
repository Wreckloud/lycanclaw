import { getBackendApiBase } from '../runtimePolicy'
import { logError } from '../logger'

const VISIT_RECORD_PREFIX = 'lycan_visit_record_'
const VISIT_RECORD_EXPIRATION = 30 * 60 * 1000
const REQUEST_TIMEOUT_MS = 5000
const updatingPaths = new Set<string>()

function canUseStorage(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return !!window.localStorage
  } catch {
    return false
  }
}

function shouldRecordVisit(path: string): boolean {
  if (!canUseStorage()) return true
  try {
    const key = `${VISIT_RECORD_PREFIX}${path}`
    const now = Date.now()
    const previous = Number.parseInt(localStorage.getItem(key) || '', 10)
    return !Number.isFinite(previous) || now - previous > VISIT_RECORD_EXPIRATION
  } catch {
    return true
  }
}

function markVisitRecorded(path: string): void {
  if (!canUseStorage()) return
  try {
    localStorage.setItem(`${VISIT_RECORD_PREFIX}${path}`, Date.now().toString())
  } catch {
  }
}

interface ApiResponseEnvelope<T> {
  data?: T
}

export async function updatePageView(path: string): Promise<number | null> {
  const normalizedPath = path.trim()
  if (!normalizedPath || updatingPaths.has(normalizedPath) || !shouldRecordVisit(normalizedPath)) {
    return null
  }

  updatingPaths.add(normalizedPath)
  try {
    const response = await fetch(`${getBackendApiBase()}/api/stats/pageview`, {
      method: 'POST',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ path: normalizedPath })
    })
    if (!response.ok) {
      throw new Error(`请求失败: ${response.status}`)
    }
    const payload = await response.json() as ApiResponseEnvelope<unknown>
    if (typeof payload.data !== 'number') return null
    markVisitRecorded(normalizedPath)
    return Math.max(0, payload.data)
  } catch (error) {
    logError('pageViewApi', '更新页面浏览量失败', error)
    return null
  } finally {
    updatingPaths.delete(normalizedPath)
  }
}
