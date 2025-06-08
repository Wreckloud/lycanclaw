<script setup>
import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import PostTitle from './PostTitle.vue'
import DataPanel from './DataPanel.vue'
import { useData, useRoute } from 'vitepress'
import { ref, onMounted, onUnmounted, computed } from 'vue'

const { Layout } = DefaultTheme
const { page, frontmatter } = useData()
const route = useRoute()

// 计算当前页面是否应该显示评论区
const shouldShowComments = computed(() => {
  // 在随想页面显示评论区
  if (route.path.includes('/thoughts/') && !route.path.endsWith('/thoughts/')) {
    return true;
  }
  
  // 在关于页面显示评论区 (匹配 /about 和 /about.html)
  if (route.path === '/about' || route.path === '/about.html') {
    return true;
  }
  
  // 其他页面可以通过 frontmatter 控制
  if (frontmatter.value.showComments) {
    return true;
  }
  
  return false;
})

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

    <!-- 添加评论区组件 -->
    <template #doc-footer-before>
      <!-- Giscus评论区将自动通过插件显示，无需手动添加组件 -->
      <!-- 评论系统会根据shouldShowComments计算属性来控制显示 -->
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