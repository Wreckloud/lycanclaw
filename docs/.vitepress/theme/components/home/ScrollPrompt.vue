<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'

// 滚动提示状态管理
const scrollPromptVisible = ref(false) // 初始设为false，避免闪现
const hasScrolled = ref(false)
const isInitialized = ref(false) // 追踪初始化状态
let initTimer: number | null = null
let scrollHandler: (() => void) | null = null

function isHomeFirstSectionVisible(): boolean {
  if (typeof window === 'undefined') return false

  const targets = [
    document.querySelector<HTMLElement>('.recommended-reading-section'),
    document.querySelector<HTMLElement>('.stats-section')
  ].filter((item): item is HTMLElement => !!item)

  if (!targets.length) return false

  return targets.some((target) => {
    const rect = target.getBoundingClientRect()
    return rect.top < window.innerHeight && rect.bottom > 0
  })
}

// 监听滚动事件
onMounted(() => {
  if (typeof window === 'undefined') return

  const handleScroll = () => {
    if (window.scrollY > 0 || isHomeFirstSectionVisible()) {
      hasScrolled.value = true
      scrollPromptVisible.value = false
      return
    }
    // 只有在顶部、用户未滚动且首页首屏组件未出现时显示
    scrollPromptVisible.value = !hasScrolled.value
  }

  // 延迟初始化动画，确保页面已完全渲染并延后1秒出现时机
  initTimer = window.setTimeout(() => {
    isInitialized.value = true

    // 在动画初始化之后，才开始正常的滚动检测
    nextTick(() => {
      handleScroll()
      window.addEventListener('scroll', handleScroll, { passive: true })
    })
  }, 1800)
  scrollHandler = handleScroll
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined' && scrollHandler) {
    window.removeEventListener('scroll', scrollHandler)
  }
  scrollHandler = null

  if (typeof window !== 'undefined' && initTimer !== null) {
    window.clearTimeout(initTimer)
    initTimer = null
  }
})
</script>

<template>
  <!-- 滚动提示 -->
  <div 
    class="scroll-prompt" 
    :class="{ 
      'visible': scrollPromptVisible, 
      'hidden': !scrollPromptVisible && isInitialized,
      'not-initialized': !isInitialized
    }"
  >
    <div class="scroll-prompt-content">
      <div class="scroll-text">向下探索更多</div>
    </div>
    <div class="scroll-prompt-mask"></div>
  </div>
</template>

<style scoped>
/* 滚动提示样式 */
.scroll-prompt {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none; /* 允许点击穿透 */
  transform: translateY(100%); /* 初始状态：完全在屏幕外 */
  opacity: 0;
}

.scroll-prompt.not-initialized {
  transition: none; /* 初始化前不应用过渡效果 */
}

.scroll-prompt.visible {
  transform: translateY(0); /* 显示状态：完全显示 */
  opacity: 1;
  transition:
    transform var(--lc-motion-duration-slower) var(--lc-motion-ease-emphasis),
    opacity var(--lc-motion-duration-slower) var(--lc-motion-ease-standard);
}

.scroll-prompt.hidden {
  transform: translateY(30px); /* 隐藏状态：略微下移并淡出 */
  opacity: 0;
  transition: transform var(--lc-motion-duration-mid) var(--lc-motion-ease-standard), opacity var(--lc-motion-duration-mid) var(--lc-motion-ease-standard);
}

.scroll-prompt-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 8px;
  color: var(--vp-c-text-3);
  text-align: center;
  z-index: 101;
}

.scroll-text {
  font-size: 0.75rem;
  font-weight: 400;
  opacity: 0.8;
  animation: floatText 2s ease-in-out infinite;
}

.scroll-prompt-mask {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100px;
  background: linear-gradient(to top, var(--vp-c-bg-soft), transparent);
  z-index: 99;
}

/* 移动端适配 */
@media (max-width: 480px) {
  .scroll-prompt-content {
    margin-bottom: 5px;
  }
  
  .scroll-text {
    font-size: 0.7rem;
  }
  
  .scroll-prompt-mask {
    height: 80px;
  }
}

/* 文字浮动动画 */
@keyframes floatText {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}
</style> 
