import { nextTick } from 'vue'
import { audioManager } from '../utils/music'
import { preloadRecentComments } from '../utils/api'

const PRELOAD_DELAY_MS = 1500
const AUDIO_SYNC_DELAY_MS = 100
const HOME_SYNC_DELAY_MS = 300
const SECTION_SYNC_DELAY_MS = 800
const SECTION_SYNC_SCROLL_DELAY_MS = 1800

type Task = () => void

interface VitePressRouterLike {
  route: {
    path: string
  }
  onAfterRouteChanged?: (to: string) => void
}

function runWhenIdle(task: Task, delay = 0): void {
  if (typeof window === 'undefined') return

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => setTimeout(task, delay))
    return
  }

  setTimeout(task, delay)
}

export function preloadSiteData(): void {
  if (typeof window === 'undefined') return

  const preload = () => runWhenIdle(() => preloadRecentComments(), PRELOAD_DELAY_MS)

  if (document.readyState === 'complete') {
    preload()
    return
  }

  window.addEventListener('load', preload, { once: true })
}

function syncAudioState(): void {
  nextTick(() => {
    setTimeout(() => {
      audioManager.syncCurrentSongInfo()
    }, AUDIO_SYNC_DELAY_MS)
  })
}

function getSyncContainers(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('.sync-height-container'))
}

function applyUniformHeight(containers: HTMLElement[], useScrollHeight = false): void {
  let maxHeight = 0

  for (const container of containers) {
    const height = useScrollHeight ? container.scrollHeight : container.offsetHeight
    maxHeight = Math.max(maxHeight, height)
  }

  if (maxHeight <= 0) return

  for (const container of containers) {
    container.style.minHeight = `${maxHeight}px`
  }
}

function resetHeight(containers: HTMLElement[]): void {
  for (const container of containers) {
    container.style.minHeight = 'auto'
  }
}

export function syncSectionHeights(): void {
  if (typeof window === 'undefined' || window.innerWidth < 960) return

  const containers = getSyncContainers()
  if (containers.length < 2) return

  resetHeight(containers)

  requestAnimationFrame(() => applyUniformHeight(containers))
  setTimeout(() => applyUniformHeight(containers), SECTION_SYNC_DELAY_MS)
  setTimeout(() => applyUniformHeight(containers, true), SECTION_SYNC_SCROLL_DELAY_MS)
}

let hasBoundResize = false

function bindResize(): void {
  if (hasBoundResize) return
  window.addEventListener('resize', syncSectionHeights)
  hasBoundResize = true
}

function unbindResize(): void {
  if (!hasBoundResize) return
  window.removeEventListener('resize', syncSectionHeights)
  hasBoundResize = false
}

export function setupRouteSideEffects(router: VitePressRouterLike): void {
  if (typeof window === 'undefined') return

  router.onAfterRouteChanged = (to) => {
    if (to === '/') {
      setTimeout(syncSectionHeights, HOME_SYNC_DELAY_MS)
      bindResize()
    } else {
      unbindResize()
    }

    syncAudioState()
  }

  if (router.route.path === '/') {
    setTimeout(syncSectionHeights, HOME_SYNC_DELAY_MS)
    bindResize()
  }
}

export function syncAudioOnMounted(): void {
  if (typeof window === 'undefined') return
  syncAudioState()
}
