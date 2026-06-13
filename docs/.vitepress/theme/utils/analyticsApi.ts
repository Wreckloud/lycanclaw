/**
 * analyticsApi.ts：
 * 提供前台访问统计和停留时间结算接口。
 */
import { getBackendApiBase } from './runtimePolicy'

interface ApiResponse<T> {
  success: boolean
  data: T
  error?: {
    code: string
    message: string
  } | null
}

export interface VisitStartPayload {
  path: string
  title: string
  referrer: string
  visitorId: string
  pageType: string
}

export interface VisitStartResponse {
  visitId: string
}

export interface VisitEndPayload {
  visitId: string
  durationMs: number
  maxScrollPercent: number
}

export interface WalineIdentityPayload {
  visitorId: string
  walineToken: string
}

async function requestJson<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(`${getBackendApiBase()}${path}`, {
    method: 'POST',
    mode: 'cors',
    credentials: 'omit',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    throw new Error(`访问统计请求失败: ${response.status}`)
  }

  const body = (await response.json()) as ApiResponse<T>
  if (!body.success) {
    throw new Error(body.error?.message || '访问统计请求失败')
  }
  return body.data
}

export function startVisit(payload: VisitStartPayload): Promise<VisitStartResponse> {
  return requestJson<VisitStartResponse>('/api/analytics/visit/start', payload)
}

export function endVisit(payload: VisitEndPayload): Promise<void> {
  return requestJson<void>('/api/analytics/visit/end', payload)
}

export function beaconEndVisit(payload: VisitEndPayload): boolean {
  if (typeof navigator === 'undefined' || !navigator.sendBeacon) return false
  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' })
  return navigator.sendBeacon(`${getBackendApiBase()}/api/analytics/visit/end`, blob)
}

export function linkWalineIdentity(payload: WalineIdentityPayload): Promise<void> {
  return requestJson<void>('/api/analytics/identity/waline', payload)
}
