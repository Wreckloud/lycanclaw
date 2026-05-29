/**
 * useImageZoom.ts：
 * 承载useImageZoom模块实现。
 */
import mediumZoom from 'medium-zoom'
import type { Zoom } from 'medium-zoom'
import { nextTick, onMounted, watch } from 'vue'

interface RouteLike {
  path: string
}

let zoomInstance: Zoom | null = null

function mountZoom(): void {
  if (zoomInstance) {
    zoomInstance.detach()
  }

  zoomInstance = mediumZoom('.main img', {
    background: 'var(--vp-c-bg)'
  })
}

export function useImageZoom(route: RouteLike): void {
  onMounted(() => {
    mountZoom()
  })

  watch(
    () => route.path,
    () =>
      nextTick(() => {
        mountZoom()
      })
  )
}
