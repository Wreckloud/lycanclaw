/**
 * analyticsTracker.ts：
 * 在 VitePress 路由变化时记录公开页面访问，并按页面可见时间结算停留时长。
 */
import { logError } from './logger'
import { beaconEndVisit, endVisit, startVisit } from './analyticsApi'
import { getVisitorId } from './visitorIdentity'

const MAX_DURATION_MS = 30 * 60 * 1000
const ROUTE_START_DELAY_MS = 80

interface ActiveVisit {
  visitId: string
  path: string
  visibleSince: number
  visibleDurationMs: number
  visible: boolean
  maxScrollPercent: number
}

let activeVisit: ActiveVisit | null = null
let pendingPath = ''
let pendingTimer: ReturnType<typeof setTimeout> | null = null
let isBound = false
let visitSequence = 0

function normalizePath(path: string): string {
  if (!path) return '/'
  const url = path.split('#')[0].split('?')[0]
  const normalized = url.startsWith('/') ? url : `/${url}`
  try {
    return decodeURIComponent(normalized)
  } catch {
    return normalized
  }
}

function isArticlePath(path: string): boolean {
  return /^\/(thoughts|knowledge)\/(?!index\.html$)(?!tags\.html$).+\.html$/i.test(path)
}

function isTrackablePath(path: string): boolean {
  if (!path || path.length > 512 || /[\u0000-\u001F\u007F]/.test(path) || path.includes('\\') || path.includes('//')) return false
  if (path.split('/').some((segment) => segment === '.' || segment === '..')) return false
  if (/^\/(admin|api|assets|\.vitepress)(\/|$)/i.test(path)) return false
  return !/\.(?:js|css|map|json|xml|txt|ico|png|jpe?g|gif|svg|webp|avif|bmp|wasm|woff2?|ttf|otf|eot|mp3|wav|ogg|flac|m4a|mp4|webm|pdf|zip|gz)$/i.test(path)
}

function currentTitle(path: string): string {
  const rawTitle = typeof document === 'undefined' ? '' : document.title.replace(/\s*[|-]\s*LycanClaw\s*$/i, '').trim()
  return rawTitle || path
}

function isNotFoundPage(): boolean {
  return typeof document !== 'undefined' && Boolean(document.querySelector('.lycan-not-found'))
}

function isNotFoundTitle(title: string): boolean {
  const value = title.trim()
  return value === '404' || value.toLowerCase() === 'not found'
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
  updateReadingProgress()
  const payload = {
    visitId: activeVisit.visitId,
    durationMs: durationForSubmit(),
    maxScrollPercent: activeVisit.maxScrollPercent
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
  window.addEventListener('scroll', updateReadingProgress, { passive: true })
  window.addEventListener('resize', updateReadingProgress, { passive: true })
  window.addEventListener('pagehide', () => finishActiveVisit(true))
  isBound = true
}

function updateReadingProgress(): void {
  if (!activeVisit || !isArticlePath(activeVisit.path)) return
  const content = document.querySelector<HTMLElement>('.VPDoc .vp-doc, .vp-doc')
  if (!content || content.offsetHeight <= 0) return

  const rect = content.getBoundingClientRect()
  const viewportBottom = window.scrollY + window.innerHeight
  const contentTop = window.scrollY + rect.top
  const percent = Math.round(((viewportBottom - contentTop) / content.offsetHeight) * 100)
  activeVisit.maxScrollPercent = Math.max(
    activeVisit.maxScrollPercent,
    Math.max(0, Math.min(percent, 100))
  )
}

async function startTrackableVisit(path: string): Promise<void> {
  const sequence = ++visitSequence
  const normalized = normalizePath(path)
  if (!isTrackablePath(normalized)) {
    finishActiveVisit(true)
    return
  }
  const title = currentTitle(normalized)
  if (isNotFoundPage() || isNotFoundTitle(title)) {
    finishActiveVisit(true)
    return
  }

  finishActiveVisit(false)

  try {
    const response = await startVisit({
      path: normalized,
      title,
      referrer: document.referrer || '',
      visitorId: getVisitorId()
    })

    if (sequence !== visitSequence) {
      endVisit({ visitId: response.visitId, durationMs: 0, maxScrollPercent: 0 }).catch((error) => {
        logError('analyticsTracker', '清理过期页面访问失败', error)
      })
      return
    }

    activeVisit = {
      visitId: response.visitId,
      path: normalized,
      visibleSince: Date.now(),
      visibleDurationMs: 0,
      visible: document.visibilityState !== 'hidden',
      maxScrollPercent: 0
    }
    requestAnimationFrame(updateReadingProgress)
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
