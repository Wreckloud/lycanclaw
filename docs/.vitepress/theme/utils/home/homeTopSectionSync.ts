/**
 * 首页首屏双列联动：
 * 在双列布局下，让“推荐阅读”和“数据统计”使用同一触发时机。
 */
const HOME_TOP_SECTIONS_VISIBLE_EVENT = 'lycan:home-top-sections-visible'
const HOME_TWO_COLUMN_MEDIA_QUERY = '(min-width: 960px)'

declare global {
  interface Window {
    __LYCAN_HOME_TOP_SECTIONS_VISIBLE__?: boolean
  }
}

function canUseWindow(): boolean {
  return typeof window !== 'undefined'
}

export function isHomeTwoColumnLayout(): boolean {
  if (!canUseWindow()) return false
  return window.matchMedia(HOME_TWO_COLUMN_MEDIA_QUERY).matches
}

export function markHomeTopSectionsVisible(): void {
  if (!canUseWindow()) return
  if (!isHomeTwoColumnLayout()) return

  // 只触发一次，避免滚动/resize 导致重复播放动画。
  if (window.__LYCAN_HOME_TOP_SECTIONS_VISIBLE__) return
  window.__LYCAN_HOME_TOP_SECTIONS_VISIBLE__ = true
  window.dispatchEvent(new CustomEvent(HOME_TOP_SECTIONS_VISIBLE_EVENT))
}

export function onHomeTopSectionsVisible(callback: () => void): () => void {
  if (!canUseWindow()) return () => {}

  const handler = () => callback()
  window.addEventListener(HOME_TOP_SECTIONS_VISIBLE_EVENT, handler)

  if (window.__LYCAN_HOME_TOP_SECTIONS_VISIBLE__) {
    callback()
  }

  return () => {
    window.removeEventListener(HOME_TOP_SECTIONS_VISIBLE_EVENT, handler)
  }
}
