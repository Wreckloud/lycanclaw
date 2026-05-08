import mediumZoom from 'medium-zoom'
import { nextTick, onMounted, watch } from 'vue'

let zoomInstance = null

function mountZoom() {
  if (zoomInstance) {
    zoomInstance.detach()
  }

  zoomInstance = mediumZoom('.main img', {
    background: 'var(--vp-c-bg)'
  })
}

export function useImageZoom(route) {
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
