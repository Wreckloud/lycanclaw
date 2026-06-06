/**
 * encouragementApi.ts：
 * 提供首页催更批量结算接口，不影响前端个人点击特效。
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

export interface EncouragementSettlePayload {
  delta: number
  visitorId: string
  path: string
  title: string
}

async function postSettle(payload: EncouragementSettlePayload): Promise<void> {
  const response = await fetch(`${getBackendApiBase()}/api/encouragement/settle`, {
    method: 'POST',
    mode: 'cors',
    credentials: 'omit',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    throw new Error(`催更结算失败: ${response.status}`)
  }

  const body = (await response.json()) as ApiResponse<unknown>
  if (!body.success) {
    throw new Error(body.error?.message || '催更结算失败')
  }
}

export function settleEncouragement(payload: EncouragementSettlePayload): Promise<void> {
  return postSettle(payload)
}

export function beaconSettleEncouragement(payload: EncouragementSettlePayload): boolean {
  if (typeof navigator === 'undefined' || !navigator.sendBeacon) return false
  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' })
  return navigator.sendBeacon(`${getBackendApiBase()}/api/encouragement/settle`, blob)
}
