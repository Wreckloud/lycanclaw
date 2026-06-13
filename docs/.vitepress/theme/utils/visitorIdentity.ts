/**
 * visitorIdentity.ts：
 * 为前台统计和催更结算提供稳定的匿名访客 ID。
 */
import { linkWalineIdentity } from './analyticsApi'

const VISITOR_ID_KEY = 'lycan_visitor_id'
let linkedWalineUserId = ''
let attemptedWalineToken = ''
let memoryVisitorId = ''

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

    const visitorId = memoryVisitorId || createVisitorId()
    memoryVisitorId = visitorId
    localStorage.setItem(VISITOR_ID_KEY, visitorId)
    return visitorId
  } catch {
    if (!memoryVisitorId) memoryVisitorId = createVisitorId()
    return memoryVisitorId
  }
}

interface WalineStoredUser {
  token?: string
  objectId?: string
  id?: string
}

function readWalineUser(): WalineStoredUser | null {
  for (const storage of [localStorage, sessionStorage]) {
    try {
      const raw = storage.getItem('WALINE_USER')
      if (!raw || raw === 'null') continue
      const parsed = JSON.parse(raw) as WalineStoredUser
      if (parsed?.token) return parsed
    } catch {
      // 存储不可用或状态损坏时由 Waline 自身重新写入。
    }
  }
  return null
}

/**
 * 将当前 Waline 登录身份交给后端验证并关联匿名 visitorId。
 */
export async function syncWalineVisitorIdentity(): Promise<void> {
  if (typeof window === 'undefined') return
  const user = readWalineUser()
  const userId = String(user?.objectId || user?.id || '')
  if (
    !user?.token
    || attemptedWalineToken === user.token
    || (userId && linkedWalineUserId === userId)
  ) return

  attemptedWalineToken = user.token
  try {
    await linkWalineIdentity({
      visitorId: getVisitorId(),
      walineToken: user.token
    })
    linkedWalineUserId = userId || user.token.slice(-12)
  } catch (error) {
    attemptedWalineToken = ''
    throw error
  }
}
