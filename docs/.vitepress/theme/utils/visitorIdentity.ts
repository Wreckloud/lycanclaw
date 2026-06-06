/**
 * visitorIdentity.ts：
 * 为前台统计和催更结算提供稳定的匿名访客 ID。
 */

const VISITOR_ID_KEY = 'lycan_visitor_id'

function createVisitorId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `visitor_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

export function getVisitorId(): string {
  if (typeof window === 'undefined') return 'ssr'

  try {
    const stored = localStorage.getItem(VISITOR_ID_KEY)
    if (stored) return stored

    const visitorId = createVisitorId()
    localStorage.setItem(VISITOR_ID_KEY, visitorId)
    return visitorId
  } catch {
    return createVisitorId()
  }
}
