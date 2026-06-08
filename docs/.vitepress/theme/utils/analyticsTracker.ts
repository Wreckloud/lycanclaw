/**
 * analyticsTracker.ts：
 * 在 VitePress 路由变化时记录核心页面访问，并按页面可见时间结算停留时长。
 */
import { logError } from './logger'
import { beaconEndVisit, endVisit, startVisit } from './analyticsApi'
import { getVisitorId } from './visitorIdentity'

const MAX_DURATION_MS = 30 * 60 * 1000
const ROUTE_START_DELAY_MS = 80

type PageType = 'home' | 'core' | 'article'

interface ActiveVisit {
  visitId: string
  path: string
  visibleSince: number
  visibleDurationMs: number
  visible: boolean
}

let activeVisit: ActiveVisit | null = null
let pendingPath = ''
let pendingTimer: ReturnType<typeof setTimeout> | null = null
let isBound = false
let visitSequence = 0

function normalizePath(path: string): string {
  if (!path) return '/'
  const url = path.split('#')[0].split('?')[0]
  return url.startsWith('/') ? url : `/${url}`
}

function isArticlePath(path: string): boolean {
  return /^\/(thoughts|knowledge)\/(?!index\.html$)(?!tags\.html$).+\.html$/i.test(path)
}

function isTrackablePath(path: string): boolean {
  if (path.startsWith('/admin') || path.startsWith('/api') || path.startsWith('/assets')) return false
  return path === '/'
    || path === '/index.html'
    || path === '/about'
    || path === '/about.html'
    || path === '/thoughts/'
    || path === '/thoughts/index.html'
    || path === '/knowledge/'
    || path === '/knowledge/index.html'
    || path === '/projects/'
    || path === '/projects/index.html'
    || isArticlePath(path)
}

function inferPageType(path: string): PageType {
  if (path === '/' || path === '/index.html') return 'home'
  return isArticlePath(path) ? 'article' : 'core'
}

function currentTitle(path: string): string {
  const rawTitle = typeof document === 'undefined' ? '' : document.title.replace(/\s*[|-]\s*LycanClaw\s*$/i, '').trim()
  return rawTitle || path
}

function addVisibleDuration(): void {
  if (!activeVisit || !activeVisit.visible) return
  activeVisit.visibleDurationMs += Date.now() - activeVisit.visibleSince
  activeVisit.visibleSince = Date.now()
}

function durationForSubmit(): number {
  if (!activeVisit) return 0
  addVisibleDuration()
  return Math.min(Math.max(0, Math.round(activeVisit.visibleDurationMs)), MAX_DURATION_MS)
}

function finishActiveVisit(useBeacon = false): void {
  if (!activeVisit) return
  const payload = {
    visitId: activeVisit.visitId,
    durationMs: durationForSubmit()
  }
  activeVisit = null

  if (useBeacon && beaconEndVisit(payload)) return

  endVisit(payload).catch((error) => {
    logError('analyticsTracker', '结算页面停留时间失败', error)
  })
}

function handleVisibilityChange(): void {
  if (!activeVisit) return
  if (document.visibilityState === 'hidden') {
    addVisibleDuration()
    activeVisit.visible = false
    return
  }
  activeVisit.visible = true
  activeVisit.visibleSince = Date.now()
}

function bindLifecycle(): void {
  if (isBound || typeof window === 'undefined') return
  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('pagehide', () => finishActiveVisit(true))
  isBound = true
}

async function startTrackableVisit(path: string): Promise<void> {
  const sequence = ++visitSequence
  const normalized = normalizePath(path)
  if (!isTrackablePath(normalized)) {
    finishActiveVisit(true)
    return
  }

  finishActiveVisit(false)

  try {
    const response = await startVisit({
      path: normalized,
      title: currentTitle(normalized),
      referrer: document.referrer || '',
      visitorId: getVisitorId(),
      pageType: inferPageType(normalized)
    })

    if (sequence !== visitSequence) {
      endVisit({ visitId: response.visitId, durationMs: 0 }).catch((error) => {
        logError('analyticsTracker', '清理过期页面访问失败', error)
      })
      return
    }

    activeVisit = {
      visitId: response.visitId,
      path: normalized,
      visibleSince: Date.now(),
      visibleDurationMs: 0,
      visible: document.visibilityState !== 'hidden'
    }
  } catch (error) {
    logError('analyticsTracker', '创建页面访问统计失败', error)
  }
}

export function trackRouteVisit(path: string): void {
  if (typeof window === 'undefined') return
  bindLifecycle()
  pendingPath = normalizePath(path)
  if (pendingTimer) clearTimeout(pendingTimer)
  pendingTimer = setTimeout(() => {
    pendingTimer = null
    startTrackableVisit(pendingPath)
  }, ROUTE_START_DELAY_MS)
}
