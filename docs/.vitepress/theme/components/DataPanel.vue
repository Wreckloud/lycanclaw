<script setup lang="ts">
// 在组件挂载时加载不蒜子统计脚本
import { onMounted, ref, onBeforeUnmount } from 'vue'
import { useData } from 'vitepress'
import { useSidebar } from 'vitepress/theme'

// 获取页面数据和侧边栏状态
const { page, frontmatter } = useData()
const { hasSidebar } = useSidebar()

// 判断是否在浏览器环境中
const isBrowser = typeof window !== 'undefined'

// 当前年份
const currentYear = new Date().getFullYear()

// 网站创建年份
const startYear = 2023

// 格式化年份显示
const yearString = startYear === currentYear 
  ? currentYear.toString() 
  : `${startYear}-${currentYear}`

// 计时器相关
const startDate = new Date('2023-09-17T14:00:00')
const years = ref(0)
const days = ref(0)
const hours = ref(0)
const minutes = ref(0)
const seconds = ref(0)
let timer: number | null = null

// 一言API相关
const hitokoto = ref("死亡是涅灭，亦或是永恒？")

// 获取一言内容
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

// 更新计时器函数
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

// 不蒜子统计脚本加载
const loadBusuanziScript = () => {
  if (!isBrowser) return
  
  // 创建不蒜子脚本
  const script = document.createElement('script')
  script.async = true
  script.src = 'https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js'
  document.body.appendChild(script)
}

onMounted(() => {
  // 确保只在浏览器环境中执行
  if (!isBrowser) return
  
  // 加载不蒜子脚本
  loadBusuanziScript()
  
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
  <footer v-if="!hasSidebar" class="VPFooter">
    <div class="container">
      <!-- 页脚内容 -->
      <div class="footer-content">
        <!-- 左侧内容 -->
        <div class="left-content">
          <p class="timer">
            孤狼踏雪，已行于世间第
            <span v-if="years > 0">{{ years }} 年 </span>
            <span>{{ days }}</span> 天 
            <span>{{ hours }}</span> 时 
            <span>{{ minutes }}</span> 分 
            <span class="time-value">{{ seconds }}</span> 秒
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
      
      <!-- 访客统计居中显示 -->
      <div class="visitor-count-container">
        <p class="visitor-count">
          <span id="busuanzi_value_site_uv" class="count-value">--</span> 位行者曾翻阅此卷
        </p>
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

.VPFooter a {
  color: var(--vp-c-text-2);
  text-decoration: none;
  transition: color 0.25s;
}

.VPFooter a:hover {
  color: var(--vp-c-text-1);
}

.time-value {
  display: inline-block;
  min-width: 2em;
  text-align: center;
  font-variant-numeric: tabular-nums;
  color: var(--vp-c-brand-1);
}

.visitor-count-container {
  text-align: center;
  margin-top: 12px;
}

.visitor-count {
  margin: 4px 0;
  line-height: 1.6;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-3);
  display: inline-block;
}

.count-value {
  color: var(--vp-c-brand-1);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .footer-content {
    flex-direction: column;
  }
  
  .left-content, .right-content {
    text-align: center;
    width: 100%;
  }
  
  .right-content {
    margin-top: 16px;
  }
}
</style> 