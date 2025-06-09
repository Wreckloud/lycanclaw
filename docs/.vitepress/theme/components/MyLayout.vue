<script setup>
import DefaultTheme from 'vitepress/theme'
import PostTitle from './PostTitle.vue'
import DataPanel from './DataPanel.vue'
import { useRoute } from 'vitepress'
import { ref, onMounted, onUnmounted, computed } from 'vue'

const { Layout } = DefaultTheme
const route = useRoute()

// 返回顶部按钮
const showBackToTop = ref(false)
const scrollThreshold = 300
const scrollProgress = ref(0)
const lastScrollTop = ref(0)
const isScrollingUp = ref(false)
const isMobile = ref(false)

// 判断是否为移动设备
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

// 计算滚动进度
const calculateScrollProgress = () => {
  const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
  const progress = window.scrollY / scrollHeight * 100
  scrollProgress.value = Math.min(Math.max(progress, 0), 100)
}

// 计算SVG圆环的dash值
const circleDashArray = computed(() => {
  const circumference = 2 * Math.PI * 24 // 圆周长 (2πr) 其中 r=24
  const dashOffset = circumference * (1 - scrollProgress.value / 100)
  return `${circumference - dashOffset} ${dashOffset}`
})

// 判断是否显示返回顶部按钮
const shouldShowBackToTop = computed(() => {
  if (!isMobile.value) {
    // 桌面端只需判断滚动位置
    return showBackToTop.value
  } else {
    // 移动端需要判断滚动位置和方向
    return showBackToTop.value && isScrollingUp.value
  }
})

const handleScroll = () => {
  // 判断滚动方向
  const currentScrollTop = window.scrollY
  isScrollingUp.value = currentScrollTop < lastScrollTop.value
  lastScrollTop.value = currentScrollTop
  
  // 判断是否显示按钮
  showBackToTop.value = currentScrollTop > scrollThreshold
  
  // 计算滚动进度
  calculateScrollProgress()
}

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

const handleResize = () => {
  checkMobile()
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    // 初始检查是否为移动设备
    checkMobile()
    
    // 添加事件监听
    window.addEventListener('scroll', handleScroll)
    window.addEventListener('resize', handleResize)
    
    // 初始计算一次进度
    calculateScrollProgress()
    lastScrollTop.value = window.scrollY
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', handleScroll)
    window.removeEventListener('resize', handleResize)
  }
})
</script>

<template>
  <Layout>
    <template #doc-before>
      <PostTitle />
    </template>

    <template #layout-bottom>
      <DataPanel />
    </template>
  </Layout>
  
  <!-- 返回顶部按钮 -->
  <Transition name="slide-fade">
    <button v-show="shouldShowBackToTop" class="vp-back-to-top-button" aria-label="返回顶部" @click="scrollToTop">
      <span class="vp-scroll-progress" role="progressbar" aria-valuenow="scrollProgress">
        <svg viewBox="0 0 52 52">
          <circle cx="26" cy="26" r="24" fill="none" stroke="currentColor" stroke-width="4" :stroke-dasharray="circleDashArray"></circle>
        </svg>
      </span>
      <div class="back-to-top-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
      </div>
    </button>
  </Transition>
</template>

<style scoped>
.vp-back-to-top-button {
  position: fixed;
  right: 20px;
  bottom: 20px;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background-color: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 100;
  transition: box-shadow 0.3s;
  padding: 0;
  -webkit-tap-highlight-color: transparent;
}

.vp-back-to-top-button:hover {
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.6);
}

.vp-scroll-progress {
  position: absolute;
  top: 0;
  left: 0;
  width: 52px;
  height: 52px;
  transform: rotate(-90deg); /* 让进度从顶部开始 */
}

.vp-scroll-progress svg {
  width: 100%;
  height: 100%;
}

.vp-scroll-progress circle {
  stroke: var(--vp-c-brand-1);
  transition: stroke-dasharray 0.2s ease;
}

.back-to-top-icon {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent; 
  border-radius: 50%;
  width: 44px;
  height: 44px;
}

/* 向上滑动淡入动画 */
.slide-fade-enter-active {
  transition: all 0.3s ease;
}

.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from {
  transform: translateY(20px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateY(20px);
  opacity: 0;
}
</style> 