<script setup>
import DefaultTheme from 'vitepress/theme'
import PostTitle from './PostTitle.vue'
import DataPanel from './DataPanel.vue'
import { useRoute } from 'vitepress'
import { ref, onMounted, onUnmounted } from 'vue'

const { Layout } = DefaultTheme
const route = useRoute()

// 返回顶部按钮
const showBackToTop = ref(false)
const scrollThreshold = 300

const handleScroll = () => {
  showBackToTop.value = window.scrollY > scrollThreshold
}

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', handleScroll)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', handleScroll)
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
  <Transition name="fade">
    <div v-show="showBackToTop" class="back-to-top" @click="scrollToTop" title="返回顶部">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="18 15 12 9 6 15"></polyline>
      </svg>
    </div>
  </Transition>
</template>

<style scoped>
.back-to-top {
  position: fixed;
  right: 20px;
  bottom: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--vp-c-brand-1);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 100;
  transition: background-color 0.3s;
}

.back-to-top:hover {
  background-color: var(--vp-c-brand-2);
}

/* 淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style> 