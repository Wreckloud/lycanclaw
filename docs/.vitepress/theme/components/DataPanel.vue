<script setup lang="ts">
/**
 * 网站页脚数据面板组件
 * 显示网站运行时间、版权信息和一言API
 */
import { onMounted, ref, onBeforeUnmount, computed } from 'vue'
import { useData } from 'vitepress'
import { useSidebar } from 'vitepress/theme'

// 获取页面数据和侧边栏状态
const { page, frontmatter } = useData()
const { hasSidebar } = useSidebar()

// 判断是否在浏览器环境中
const isBrowser = typeof window !== 'undefined'

// 删除可视性状态和引用
const containerRef = ref(null)

// ===== 版权年份相关 =====
// 当前年份
const currentYear = new Date().getFullYear()
// 网站创建年份
const startYear = 2023
// 格式化年份显示
const yearString = startYear === currentYear 
  ? currentYear.toString() 
  : `${startYear}-${currentYear}`

// ===== 计时器相关 =====
const startDate = new Date('2023-09-17T14:00:00')
const years = ref(0)
const days = ref(0)
const hours = ref(0)
const minutes = ref(0)
const seconds = ref(0)
let timer: number | null = null

// ===== 一言API相关 =====
const hitokoto = ref("死亡是涅灭，亦或是永恒？")

/**
 * 获取一言内容
 */
const fetchHitokoto = async () => {
  try {
    const response = await fetch('https://v1.hitokoto.cn')
    if (response.ok) {
      const data = await response.json()
      hitokoto.value = data.hitokoto
    }
  } catch (error) {
    console.error('Failed to fetch hitokoto:', error)
  }
}

/**
 * 更新计时器函数
 */
const updateTimer = () => {
  const now = new Date()
  const diff = now.getTime() - startDate.getTime()
  
  // 计算年、天、时、分、秒
  const millisecondsPerYear = 1000 * 60 * 60 * 24 * 365.25 // 考虑闰年
  years.value = Math.floor(diff / millisecondsPerYear)
  const remainingAfterYears = diff % millisecondsPerYear
  
  days.value = Math.floor(remainingAfterYears / (1000 * 60 * 60 * 24))
  hours.value = Math.floor((remainingAfterYears % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  minutes.value = Math.floor((remainingAfterYears % (1000 * 60 * 60)) / (1000 * 60))
  seconds.value = Math.floor((remainingAfterYears % (1000 * 60)) / 1000)
}

onMounted(() => {
  // 确保只在浏览器环境中执行
  if (!isBrowser) return
  
  // 初始化计时器
  updateTimer()
  timer = window.setInterval(updateTimer, 1000)
  
  // 加载一言
  fetchHitokoto()
})

onBeforeUnmount(() => {
  // 清除计时器
  if (timer && isBrowser) {
    clearInterval(timer)
    timer = null
  }
})
</script>

<template>
  <!-- 只在没有侧边栏时显示页脚 -->
  <footer v-if="!hasSidebar" ref="containerRef" class="VPFooter">
    <div class="container">
      <!-- 页脚内容 -->
      <div class="footer-content">
        <!-- 左侧内容 -->
        <div class="left-content">
          <p class="timer">
            <span class="timer-prefix">孤狼踏雪，已行于世间</span><br class="timer-break">
            <span class="timer-count">第
              <span v-if="years > 0" class="time-unit">{{ years }} 年 </span>&nbsp;
              <span class="time-unit">{{ days }}</span> 天 
              <span class="time-unit">{{ hours }}</span> 时 
              <span class="time-unit">{{ minutes }}</span> 分 
              <span class="time-value">{{ seconds }}</span> 秒
            </span>
          </p>
          <p class="credits">
            <span>Powered by <a href="https://www.netlify.com/" target="_blank">netlify</a> | </span>
            <span>Theme by <a href="https://vitepress.dev/" target="_blank">vitepress</a></span>
          </p>
        </div>
        
        <!-- 右侧内容 -->
        <div class="right-content">
          <p class="copyright">© {{ yearString }} <a href="/about">Wreckloud</a>.</p>
          <p class="motto">{{ hitokoto }}</p>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.VPFooter {
  border-top: 1px solid var(--vp-c-gutter);
  padding: 24px 24px;
  background-color: var(--vp-c-bg);
}

/* 删除动画样式 */

.container {
  margin: 0 auto;
  max-width: 1152px;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.left-content, .right-content {
  flex: 1;
}

.left-content {
  text-align: left;
}

.right-content {
  text-align: right;
}

.copyright, .timer, .motto, .credits {
  margin: 4px 0;
  line-height: 1.6;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-3);
}

.timer-prefix {
  display: inline-block;
}

.timer-count {
  display: inline-block;
}

/* 在桌面设备上隐藏换行符 */
@media (min-width: 769px) {
  .timer-break {
    display: none;
  }
}

/* 在移动设备上显示换行符 */
@media (max-width: 768px) {
  .timer-break {
    display: block;
  }
}

.time-unit {
  display: inline-block;
}

.time-value {
  display: inline-block;
  min-width: 2em;
  text-align: center;
  font-variant-numeric: tabular-nums;
  color: var(--vp-c-brand-1);
}

.VPFooter a {
  color: var(--vp-c-text-2);
  text-decoration: none;
  transition: color 0.25s;
}

.VPFooter a:hover {
  color: var(--vp-c-text-1);
}

/* 响应式样式调整 */
@media (max-width: 768px) {
  .footer-content {
    flex-direction: column;
  }
  
  .left-content, .right-content {
    text-align: center;
    margin: 0 auto;
  }
  
  .left-content {
    margin-bottom: 12px;
  }
}
</style> 