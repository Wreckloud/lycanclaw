<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useEventListener } from '@vueuse/core'

// 判断是否在浏览器环境中
const isBrowser = typeof window !== 'undefined'

// 创建一个响应式变量，表示用户是否已经滚动
const hasScrolled = ref(false)

// 监听滚动事件
function handleScroll() {
  if (!hasScrolled.value && window.scrollY > 10) {
    hasScrolled.value = true
  }
}

// 提供给外部组件使用的方法
function getScrollState() {
  return hasScrolled
}

onMounted(() => {
  if (isBrowser) {
    // 使用VueUse的useEventListener添加滚动事件监听
    useEventListener(window, 'scroll', handleScroll, { passive: true })
    
    // 初始检查当前滚动位置
    handleScroll()
  }
})

// 将hasScrolled暴露给外部使用
defineExpose({
  hasScrolled,
  getScrollState
})
</script>

<template>
  <div class="scroll-controller"></div>
</template> 