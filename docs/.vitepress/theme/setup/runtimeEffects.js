import { nextTick } from 'vue'
import audioManager from '../utils/audioManager'
import { preloadRecentComments } from '../utils/commentApi'

function runWhenIdle(task, delay = 0) {
  if (typeof window === 'undefined') return

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => setTimeout(task, delay))
    return
  }

  setTimeout(task, delay)
}

export function preloadSiteData() {
  if (typeof window === 'undefined') return

  const preload = () => runWhenIdle(() => preloadRecentComments(), 1500)

  if (document.readyState === 'complete') {
    preload()
    return
  }

  window.addEventListener('load', preload, { once: true })
}

function syncAudioState() {
  nextTick(() => {
    setTimeout(() => {
      audioManager.syncCurrentSongInfo()
    }, 100)
  })
}

function getSyncContainers() {
  return Array.from(document.querySelectorAll('.sync-height-container'))
}

function applyUniformHeight(containers, useScrollHeight = false) {
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

function resetHeight(containers) {
  for (const container of containers) {
    container.style.minHeight = 'auto'
  }
}

export function syncSectionHeights() {
  if (typeof window === 'undefined' || window.innerWidth < 960) return

  const containers = getSyncContainers()
  if (containers.length < 2) return

  resetHeight(containers)

  requestAnimationFrame(() => applyUniformHeight(containers))
  setTimeout(() => applyUniformHeight(containers), 800)
  setTimeout(() => applyUniformHeight(containers, true), 1800)
}

let hasBoundResize = false

function bindResize() {
  if (hasBoundResize) return
  window.addEventListener('resize', syncSectionHeights)
  hasBoundResize = true
}

function unbindResize() {
  if (!hasBoundResize) return
  window.removeEventListener('resize', syncSectionHeights)
  hasBoundResize = false
}

export function setupRouteSideEffects(router) {
  if (typeof window === 'undefined') return

  router.onAfterRouteChanged = (to) => {
    if (to.path === '/') {
      setTimeout(syncSectionHeights, 300)
      bindResize()
    } else {
      unbindResize()
    }

    syncAudioState()
  }

  if (router.route.path === '/') {
    setTimeout(syncSectionHeights, 300)
    bindResize()
  }
}

export function syncAudioOnMounted() {
  if (typeof window === 'undefined') return
  syncAudioState()
}
