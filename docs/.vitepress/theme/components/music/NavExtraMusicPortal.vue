<script setup lang="ts">
/**
 * NavExtraMusicPortal.vue：
 * 将紧凑音乐控件挂载到 VitePress 桌面端三点菜单。
 */
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import NavMusicPlayer from './NavMusicPlayer.vue'

const target = ref<HTMLElement | null>(null)
let observer: MutationObserver | null = null

function resolveTarget(): void {
  target.value = document.querySelector<HTMLElement>('.VPNavBarExtra .menu .VPMenu')
  if (target.value) {
    observer?.disconnect()
    observer = null
  }
}

onMounted(() => {
  void nextTick(() => {
    resolveTarget()
    if (target.value) return

    observer = new MutationObserver(resolveTarget)
    observer.observe(document.body, { childList: true, subtree: true })
  })
})

onUnmounted(() => {
  observer?.disconnect()
})
</script>

<template>
  <Teleport v-if="target" :to="target">
    <div class="lycan-extra-music-host">
      <NavMusicPlayer variant="dropdown" />
    </div>
  </Teleport>
</template>

<style scoped>
.lycan-extra-music-host {
  margin: 0 -12px -12px;
  border-top: 1px solid var(--vp-c-divider);
}

@media (max-width: 767px) {
  .lycan-extra-music-host {
    display: none;
  }
}
</style>
