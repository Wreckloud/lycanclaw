<script setup lang="ts">
// 在组件挂载时加载不蒜子统计脚本
import { onMounted, ref, onBeforeUnmount, computed } from 'vue'
import { useData } from 'vitepress'
import { useSidebar } from 'vitepress/theme'

// 获取页面数据和侧边栏状态
const { page, frontmatter } = useData()
const { hasSidebar } = useSidebar()

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
  
  // 计算天、时、分、秒
  days.value = Math.floor(diff / (1000 * 60 * 60 * 24))
  hours.value = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  minutes.value = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  seconds.value = Math.floor((diff % (1000 * 60)) / 1000)
}

onMounted(() => {
  // 动态加载不蒜子脚本
  const script = document.createElement('script')
  script.src = '//busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js'
  script.async = true
  document.body.appendChild(script)
  
  // 初始化计时器
  updateTimer()
  timer = window.setInterval(updateTimer, 1000)
  
  // 加载一言
  fetchHitokoto()
})

onBeforeUnmount(() => {
  // 清除计时器
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})
</script>

<template>
  <!-- 只在没有侧边栏时显示页脚 -->
  <footer v-if="!hasSidebar" class="VPFooter">
    <div class="container">
      <div class="footer-content">
        <!-- 左侧内容 -->
        <div class="left-content">
          <p class="copyright">© {{ yearString }} Wreckloud. 
            <span>Powered by <a href="https://www.netlify.com/" target="_blank">netlify</a> | </span>
            <span>Theme by <a href="https://vitepress.dev/" target="_blank">vitepress</a></span>
          </p>
          <p class="timer">
            孤狼踏雪，已行于世间第 
            <span class="time-value">{{ days }}</span> 天 
            <span class="time-value">{{ hours }}</span> 时 
            <span class="time-value">{{ minutes }}</span> 分 
            <span class="time-value">{{ seconds }}</span> 秒
          </p>

        </div>
        
        <!-- 右侧内容 -->
        <div class="right-content">
          <p class="statistics">
            <span id="busuanzi_container_site_pv" class="statistic-item">造访爪迹 <span id="busuanzi_value_site_pv" class="statistic-value">--</span> 次</span>
            
          </p>
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

.copyright, .timer, .motto, .statistics {
  margin: 4px 0;
  line-height: 1.6;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-3);
}

a {
  color: var(--vp-c-text-3);
  text-decoration: none;
  transition: color 0.25s;
}

a:hover {
  color: var(--vp-c-text-2);
}

.time-value {
  display: inline-block;
  min-width: 2em;
  text-align: center;
  font-variant-numeric: tabular-nums;
  color: var(--vp-c-brand-1);
}

.statistic-value {
  color: var(--vp-c-brand-1);
}

.statistics {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
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
  
  .statistics {
    align-items: center;
  }
}
</style> 