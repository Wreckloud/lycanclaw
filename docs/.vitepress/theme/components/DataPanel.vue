<script setup lang="ts">
/**
 * 网站页脚数据面板组件
 * 显示网站运行时间、版权信息和访问统计
 * 由不蒜子统计更换为Waline统计
 */
import { onMounted, ref, onBeforeUnmount, computed } from 'vue'
import { useData } from 'vitepress'
import { useSidebar } from 'vitepress/theme'

// 获取页面数据和侧边栏状态
const { page, frontmatter } = useData()
const { hasSidebar } = useSidebar()

// 判断是否在浏览器环境中
const isBrowser = typeof window !== 'undefined'

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

// ===== 访客统计相关 =====
// 访问量数据
const visitorCount = ref('0')
// 缓存键名
const UV_CACHE_KEY = 'busuanzi_site_uv'
// 缓存时间键名
const UV_CACHE_TIME_KEY = 'busuanzi_site_uv_time'
// 缓存有效期（6小时，单位毫秒）
const CACHE_EXPIRATION = 6 * 60 * 60 * 1000

/**
 * 从缓存中获取站点访问量
 */
const getVisitorCountFromCache = () => {
  if (!isBrowser) return null
  
  try {
    const cachedCount = localStorage.getItem(UV_CACHE_KEY)
    
    // 检查缓存是否过期
    const cacheTime = localStorage.getItem(UV_CACHE_TIME_KEY)
    if (!cacheTime) return null
    
    const now = Date.now()
    if ((now - parseInt(cacheTime)) > CACHE_EXPIRATION) return null
    
    return cachedCount || null
  } catch (e) {
    return null
  }
}

/**
 * 将站点访问量保存到缓存
 */
const saveVisitorCountToCache = (count) => {
  if (!isBrowser || !count) return
  
  try {
    localStorage.setItem(UV_CACHE_KEY, count)
    localStorage.setItem(UV_CACHE_TIME_KEY, Date.now().toString())
  } catch (e) {
    console.error('保存站点访问量到缓存失败:', e)
  }
}

/**
 * 初始化不蒜子统计
 */
const initBusuanzi = () => {
  if (!isBrowser) return
  
  // 先尝试从缓存中获取
  const cachedCount = getVisitorCountFromCache()
  if (cachedCount) {
    visitorCount.value = cachedCount
  }
  
  // 防止重复加载脚本
  if (document.getElementById('busuanzi_script')) {
    // 如果脚本已经加载，尝试重新初始化
    if (typeof window !== 'undefined' && window['busuanzi'] && typeof window['busuanzi'].fetch === 'function') {
      window['busuanzi'].fetch()
    }
    return
  }
  
  // 创建不蒜子脚本
  const script = document.createElement('script')
  script.id = 'busuanzi_script'
  script.src = '//busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js'
  script.async = true
  
  // 监视DOM变化来获取不蒜子更新的值
  const observer = new MutationObserver(() => {
    const uvElement = document.getElementById('busuanzi_value_site_uv')
    if (uvElement && uvElement.textContent) {
      visitorCount.value = uvElement.textContent
      saveVisitorCountToCache(uvElement.textContent)
      observer.disconnect()
    }
  })
  
  // 脚本加载成功后开始监听DOM变化
  script.onload = () => {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
    
    // 1秒后如果还没有获取到值，尝试手动更新
    setTimeout(() => {
      if (window['busuanzi'] && typeof window['busuanzi'].fetch === 'function') {
        window['busuanzi'].fetch()
      }
    }, 1000)
  }
  
  // 添加脚本到页面
  document.head.appendChild(script)
}

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

/**
 * 获取Waline站点访问量统计
 * 使用缓存机制减少API请求次数
 */
/* const fetchWalineVisitorCount = async () => {
  // ... 原来的Waline统计代码
} */

onMounted(() => {
  // 确保只在浏览器环境中执行
  if (!isBrowser) return
  
  // 初始化计时器
  updateTimer()
  timer = window.setInterval(updateTimer, 1000)
  
  // 加载一言
  fetchHitokoto()
  
  // 初始化不蒜子统计
  initBusuanzi()
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
      
      <!-- 访客统计居中显示 - 使用不蒜子统计 -->
      <div class="visitor-count-container">
        <p class="visitor-count">
          <!-- 隐藏的不蒜子统计元素，用于数据获取 -->
          <span id="busuanzi_container_site_uv">
            <span id="busuanzi_value_site_uv" class="count-value">0</span> 位行者曾翻阅此卷
          </span>
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