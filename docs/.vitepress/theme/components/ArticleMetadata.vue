<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import { useData } from 'vitepress'
import { countWord } from '../utils/wordCount'

// 判断是否在浏览器环境中
const isBrowser = typeof window !== 'undefined'

// 获取当前页面的数据
const { frontmatter, page } = useData()

// 获取文章更新时间
const updateDate = computed(() => {
  const timestamp = page.value.lastUpdated
  return timestamp ? new Date(timestamp) : new Date()
})

// 获取文章创建时间
const hasCreationDate = computed(() => !!frontmatter.value.date)
const creationDate = computed(() => {
  if (!frontmatter.value.date) return null
  
  // 直接从日期字符串中提取年月日时分秒，避免时区转换问题
  const dateStr = String(frontmatter.value.date).replace(/^['"]|['"]$/g, '')
  const match = dateStr.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/)
  
  if (match) {
    return {
      year: parseInt(match[1], 10),
      month: parseInt(match[2], 10),
      day: parseInt(match[3], 10),
      hours: parseInt(match[4], 10),
      minutes: parseInt(match[5], 10),
      seconds: parseInt(match[6], 10)
    }
  }
  
  // 如果无法提取，则回退到Date对象
  try {
    return new Date(dateStr)
  } catch (e) {
    console.error('无法解析日期:', frontmatter.value.date)
    return null
  }
})

// 格式化日期，显示年月日时分秒
const formattedDate = computed(() => {
  if (!creationDate.value) return ''
  
  // 如果是我们自己解析的日期对象
  if (typeof creationDate.value === 'object' && 'year' in creationDate.value) {
    const date = creationDate.value
    const year = date.year
    const month = date.month.toString().padStart(2, '0')
    const day = date.day.toString().padStart(2, '0')
    const hours = date.hours.toString().padStart(2, '0')
    const minutes = date.minutes.toString().padStart(2, '0')
    const seconds = date.seconds.toString().padStart(2, '0')
    
    return `${year}年${month}月${day}日 ${hours}:${minutes}:${seconds}`
  }
  
  // 否则使用Date对象
  const date = creationDate.value
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')
  
  return `${year}年${month}月${day}日 ${hours}:${minutes}:${seconds}`
})

// 计算字数
const wordCount = ref(0)
// 计算阅读时间（按照每分钟300字计算）
const readTime = ref(0)
// 浏览量
const pageviewCount = ref('0')
// 缓存相关常量
const PAGEVIEW_CACHE_PREFIX = 'busuanzi_pageview_'
const PAGEVIEW_CACHE_TIME_SUFFIX = '_time'
const CACHE_EXPIRATION = 30 * 60 * 1000 // 30分钟缓存

// 获取当前页面路径用于统计
const currentPath = computed(() => isBrowser ? window.location.pathname : '')

/**
 * 从缓存中获取页面访问量
 */
const getPageViewFromCache = () => {
  if (!isBrowser) return null
  
  try {
    const path = window.location.pathname
    const cacheKey = `${PAGEVIEW_CACHE_PREFIX}${path}`
    const cachedData = localStorage.getItem(cacheKey)
    
    // 检查缓存是否过期
    const cacheTime = localStorage.getItem(`${cacheKey}${PAGEVIEW_CACHE_TIME_SUFFIX}`)
    if (!cacheTime) return null
    
    const now = Date.now()
    if ((now - parseInt(cacheTime)) > CACHE_EXPIRATION) return null
    
    return cachedData || null
  } catch (e) {
    return null
  }
}

/**
 * 将页面访问量保存到缓存
 */
const savePageViewToCache = (count) => {
  if (!isBrowser || !count) return
  
  try {
    const path = window.location.pathname
    const cacheKey = `${PAGEVIEW_CACHE_PREFIX}${path}`
    localStorage.setItem(cacheKey, count)
    localStorage.setItem(`${cacheKey}${PAGEVIEW_CACHE_TIME_SUFFIX}`, Date.now().toString())
  } catch (e) {
    console.error('保存页面访问量到缓存失败:', e)
  }
}

/**
 * 加载不蒜子脚本（如果需要）
 */
const loadBusuanziScript = () => {
  if (!isBrowser) return
  
  // 先尝试从缓存中获取
  const cachedCount = getPageViewFromCache()
  if (cachedCount) {
    pageviewCount.value = cachedCount
  }
  
  // 防止重复加载脚本
  if (document.getElementById('busuanzi_script')) return
  
  // 创建不蒜子脚本
  const script = document.createElement('script')
  script.id = 'busuanzi_script'
  script.src = '//busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js'
  script.async = true
  
  // 监视DOM变化来获取不蒜子更新的值
  const observer = new MutationObserver(() => {
    const pvElement = document.getElementById('busuanzi_value_page_pv')
    if (pvElement && pvElement.textContent) {
      pageviewCount.value = pvElement.textContent
      savePageViewToCache(pvElement.textContent)
      observer.disconnect()
    }
  })
  
  // 开始监听文档变化
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
 * 计算文章字数和阅读时间的函数
 */
const calculateWordStats = () => {
  // 确保只在浏览器环境中执行DOM操作
  if (!isBrowser) return
  
  // 获取文章内容（从DOM中获取）
  const content = document.querySelector('.vp-doc')?.textContent || ''
  // 计算字数
  wordCount.value = countWord(content)
  // 计算阅读时间
  readTime.value = Math.ceil(wordCount.value / 300)
}

/**
 * 获取页面浏览量（简化版）
 */
const fetchPageViewCount = async () => {
  // 简化为调用不蒜子加载函数
  loadBusuanziScript()
}

onMounted(() => {
  // 确保只在浏览器环境中执行
  if (isBrowser) {
    calculateWordStats()
    fetchPageViewCount()
  }
})

// 监听页面路径变化，重新计算字数和阅读时间，更新浏览量
watch(() => page.value.relativePath, () => {
  // 确保只在浏览器环境中执行
  if (!isBrowser) return
  
  // 使用setTimeout确保DOM已更新
  setTimeout(() => {
    calculateWordStats()
    fetchPageViewCount()
  }, 0)
}, { immediate: true })

// 添加默认导出
defineOptions({
  name: 'ArticleMetadata'
})
</script>

<template>
  <div class="word">
    <!-- 移除隐藏的浏览量统计元素 -->
    <p>
      <!-- 创建时间，仅在frontmatter中存在date属性时显示 -->
      <template v-if="hasCreationDate && creationDate">
        <div class="metadata-container">
          <div class="metadata-date">
        <svg t="1724643683964" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
          p-id="2493" width="14" height="14">
          <path
            d="M885.333333 256v618.666667H138.666667V256h746.666666z m0-64H138.666667a64 64 0 0 0-64 64v618.666667a64 64 0 0 0 64 64h746.666666a64 64 0 0 0 64-64V256a64 64 0 0 0-64-64zM375.466667 149.333333v128a32 32 0 1 1-64 0V149.333333a32 32 0 1 1 64 0z m341.333333 0v128a32 32 0 1 1-64 0V149.333333a32 32 0 1 1 64 0z"
            fill="#9a9a9a" p-id="2494"></path>
          <path d="M234.666667 512h554.666666v64H234.666667z" fill="#9a9a9a" p-id="2495"></path>
        </svg>
        <span>创建: {{ formattedDate }}</span>
          </div>

          <div class="metadata-stats-item">
      <svg t="1724571760788" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
        p-id="6125" width="14" height="14">
        <path
          d="M204.8 0h477.866667l273.066666 273.066667v614.4c0 75.093333-61.44 136.533333-136.533333 136.533333H204.8c-75.093333 0-136.533333-61.44-136.533333-136.533333V136.533333C68.266667 61.44 129.706667 0 204.8 0z m307.2 607.573333l68.266667 191.146667c13.653333 27.306667 54.613333 27.306667 61.44 0l102.4-273.066667c6.826667-20.48 0-34.133333-20.48-40.96s-34.133333 0-40.96 13.65334l-68.266667 191.146666-68.266667-191.146666c-13.653333-27.306667-54.613333-27.306667-68.266666 0l-68.266667 191.146666-68.266667-191.146666c-6.826667-13.653333-27.306667-27.306667-47.786666-20.48s-27.306667 27.306667-20.48 47.786666l102.4 273.066667c13.653333 27.306667 54.613333 27.306667 61.44 0l75.093333-191.146667z"
          fill="#9a9a9a" p-id="6126"></path>
        <path d="M682.666667 0l273.066666 273.066667h-204.8c-40.96 0-68.266667-27.306667-68.266666-68.266667V0z"
          fill="#E0E0E0" opacity=".619" p-id="6127"></path>
      </svg>
      <span>字数: {{ wordCount }} 字</span>
          </div>

          <div class="metadata-stats-item">
      <svg t="1724572797268" class="icon" viewBox="0 0 1060 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
        p-id="15031" width="14" height="14">
        <path
          d="M556.726857 0.256A493.933714 493.933714 0 0 0 121.929143 258.998857L0 135.021714v350.390857h344.649143L196.205714 334.482286a406.820571 406.820571 0 1 1-15.908571 312.649143H68.937143A505.819429 505.819429 0 1 0 556.726857 0.256z m-79.542857 269.531429v274.907428l249.197714 150.966857 42.422857-70.070857-212.114285-129.389714V269.787429h-79.542857z"
          fill="#9a9a9a" p-id="15032"></path>
      </svg>
      <span>时长: {{ readTime }} 分钟</span>
          </div>

          <div class="metadata-stats-item">
      <svg t="1724823765544" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="11578" width="14" height="14">
        <path d="M512 298.666667c-164.266667 0-313.6 95.573333-413.866667 249.6 100.266667 154.026667 249.6 249.6 413.866667 249.6 164.266667 0 313.6-95.573333 413.866667-249.6-100.266667-154.026667-249.6-249.6-413.866667-249.6z m0 416c-91.733333 0-166.4-74.666667-166.4-166.4s74.666667-166.4 166.4-166.4 166.4 74.666667 166.4 166.4-74.666667 166.4-166.4 166.4z m0-265.6c-55.466667 0-99.2 43.733333-99.2 99.2s43.733333 99.2 99.2 99.2 99.2-43.733333 99.2-99.2-43.733333-99.2-99.2-99.2z" fill="#9a9a9a" p-id="11579"></path>
      </svg>
            <span>浏览: 
              <span id="busuanzi_container_page_pv">
                <span id="busuanzi_value_page_pv">0</span>
              </span>
            </span>
          </div>
        </div>
    </template>
    </p>
  </div>
</template>

<style scoped>
.word {
  color: var(--vp-c-text-3);
  font-size: 12px;
}

.metadata-container {
  display: flex;
  flex-wrap: wrap;
  row-gap: 8px;
  column-gap: 16px;
}

.metadata-date {
  white-space: nowrap;
}

.metadata-stats-item {
  white-space: nowrap;
}

.icon {
    display: inline-block;
  transform: translate(0px, 2px);
    margin-right: 4px;
}

/* 响应式布局 - 最多两行 */
@media (max-width: 768px) {
  .metadata-date {
    flex: 0 0 100%;
  }
}
</style> 