import { ref } from 'vue'

// 创建一个全局状态，表示用户是否已经滚动
const hasScrolled = ref(false)

// 判断是否在浏览器环境中
const isBrowser = typeof window !== 'undefined'

// 初始化函数，在应用启动时调用一次
export function initScrollState() {
  if (!isBrowser) return
  
  // 监听滚动事件
  window.addEventListener('scroll', handleScroll, { passive: true })
  
  // 初始检查滚动状态
  handleScroll()
  
  // 返回清理函数
  return () => {
    window.removeEventListener('scroll', handleScroll)
  }
}

// 滚动事件处理函数
function handleScroll() {
  if (!hasScrolled.value && window.scrollY > 10) {
    hasScrolled.value = true
  }
}

// 导出组合式函数
export function useScrollState() {
  return {
    hasScrolled
  }
} 