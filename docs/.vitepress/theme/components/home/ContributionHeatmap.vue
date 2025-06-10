<script setup>
/**
 * GitHub风格贡献热力图
 * 基于ECharts实现，显示文章发布的热力分布
 */
import { ref, onMounted, onBeforeUnmount, nextTick, computed, watch } from 'vue'
import { withBase, useData } from 'vitepress'
import * as echarts from 'echarts/core'
import { CalendarComponent, TooltipComponent, VisualMapComponent } from 'echarts/components'
import { HeatmapChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'

// 按需注册组件
echarts.use([
  CalendarComponent,
  TooltipComponent,
  VisualMapComponent,
  HeatmapChart,
  CanvasRenderer
])

// 从VitePress获取主题数据
const { isDark: themeIsDark } = useData()

// 判断是否在浏览器环境中
const isBrowser = typeof window !== 'undefined'

// 引用DOM元素
const heatmapRef = ref(null)
const containerRef = ref(null)

// 滚动状态
const scrollPosition = ref(0)
const maxScroll = ref(0)

// 组件状态
const isLoading = ref(true)
const hasError = ref(false)
const debugInfo = ref('') // 保留调试信息但默认不显示
const isDark = computed(() => themeIsDark.value) // 使用VitePress的主题状态

// 热力图数据
const heatmapData = ref([])
const yearRange = ref({
  start: '',
  end: ''
})
const visualMapMax = ref(100)

// 平滑滚动热力图
function scrollHeatmap(delta) {
  if (!containerRef.value) return
  
  const targetScroll = scrollPosition.value + delta
  
  // 使用原生动画API实现平滑滚动
  containerRef.value.scrollTo({
    left: targetScroll,
    behavior: 'smooth'
  })
}

// 更新滚动位置
function updateScrollPosition() {
  if (!containerRef.value) return
  scrollPosition.value = containerRef.value.scrollLeft
  
  // 计算最大滚动距离
  maxScroll.value = containerRef.value.scrollWidth - containerRef.value.clientWidth
}

// 日期格式化
function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 获取过去一年的日期范围
function getYearRange() {
  const today = new Date()
  const endDate = formatDate(today)
  
  // 计算一年前的日期
  const startDate = new Date()
  startDate.setFullYear(today.getFullYear() - 1)
  startDate.setDate(startDate.getDate() + 1) // 加一天，确保是整整一年
  
  return {
    start: formatDate(startDate),
    end: endDate
  }
}

// 获取当前主题的颜色列表
function getThemeColors() {
  if (!isBrowser) return []
  
  if (isDark.value) {
    return [
      '#2d333b', // --heatmap-color-0
      '#0e4429', // --heatmap-color-1
      '#006d32', // --heatmap-color-2
      '#26a641', // --heatmap-color-3
      '#39d353'  // --heatmap-color-4
    ]
  } else {
    return [
      '#ebedf0', // --heatmap-color-0
      '#c6e48b', // --heatmap-color-1
      '#7bc96f', // --heatmap-color-2
      '#239a3b', // --heatmap-color-3
      '#196127'  // --heatmap-color-4
    ]
  }
}

// 尝试解析各种可能的日期格式
function parseDateString(dateString) {
  if (!dateString) return null
  
  // 如果是对象类型或Date实例，直接返回
  if (dateString instanceof Date) return dateString
  
  // 处理字符串类型
  if (typeof dateString === 'string') {
    // 去除可能的引号
    const cleanDateStr = dateString.replace(/^["']|["']$/g, '')
    
    // 尝试通过正则匹配YYYY-MM-DD格式
    const match = cleanDateStr.match(/(\d{4})-(\d{1,2})-(\d{1,2})/)
    if (match) {
      const year = parseInt(match[1])
      const month = parseInt(match[2]) - 1 // 月份从0开始
      const day = parseInt(match[3])
      return new Date(year, month, day)
    }
    
    // 尝试直接用Date构造函数解析
    const parseDate = new Date(cleanDateStr)
    if (!isNaN(parseDate.getTime())) {
      return parseDate
    }
  }
  
  // 所有解析方法都失败
  return null
}

// 内联实现countWord函数
function countWord(data) {
  const pattern = /[a-zA-Z0-9_\u0392-\u03C9\u00C0-\u00FF\u0600-\u06FF\u0400-\u04FF]+|[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF\u3040-\u309F\uAC00-\uD7AF]+/g
  const m = data.match(pattern)
  let count = 0
  if (!m) {
    return 0
  }
  for (let i = 0; i < m.length; i += 1) {
    if (m[i].charCodeAt(0) >= 0x4E00) {
      count += m[i].length
    }
    else {
      count += 1
    }
  }
  return count
}

// 热力图实例
const chartInstance = ref(null)

// 获取图表配置
function getChartOption() {
  return {
    backgroundColor: isDark.value ? 'rgba(0,0,0,0)' : undefined, // 深色模式下使用透明背景
    tooltip: {
      position: 'top',
      formatter: function(params) {
        const count = params.value[1]
        if (count !== 0) {
          return `${count} 字`
        }
      }
    },
    visualMap: {
      show: false,
      min: 0,
      max: visualMapMax.value,
      calculable: true,
      inRange: {
        color: getThemeColors()
      }
    },
    calendar: {
      top: 50,
      left: 50,
      right: 50,
      cellSize: [14, 18],
      range: [yearRange.value.start, yearRange.value.end],
      itemStyle: {
        borderWidth: 2,
        borderColor: isDark.value ? '#1B1B1F' : '#FFFFFF'
      },
      splitLine: {
        show: false
      },
      dayLabel: {
        show: false
      },
      monthLabel: {
        nameMap: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
        fontSize: 12,
        color: '#999'
      },
      yearLabel: {
        show: false
      }
    },
    series: {
      type: 'heatmap',
      coordinateSystem: 'calendar',
      data: heatmapData.value
    }
  }
}

// 设置横向滚动
function setupHorizontalScroll() {
  if (containerRef.value) {
    // 监听滚轮事件
    containerRef.value.addEventListener('wheel', (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault()
        containerRef.value.scrollLeft += e.deltaY
      }
    }, { passive: false });
    
    // 初始化滚动位置
    updateScrollPosition()
    
    // 设置初始位置到最右侧（最新数据）
    nextTick(() => {
      if (containerRef.value) {
        containerRef.value.scrollLeft = containerRef.value.scrollWidth - containerRef.value.clientWidth;
      }
    });
  }
}

// 初始化图表的函数
function initChart() {
  if (!heatmapRef.value) {
    hasError.value = true
    return
  }
  
  try {
    // 强制设置容器尺寸 - 保留原始尺寸设置
    heatmapRef.value.style.width = '1000px'
    heatmapRef.value.style.height = '200px'
    
    // 初始化图表
    const chart = echarts.init(heatmapRef.value, isDark.value ? 'dark' : undefined)
    
    // 添加测试数据（如果没有真实数据）
    if (heatmapData.value.length === 0 || heatmapData.value.every(item => item[1] === 0)) {
      // 添加一些测试数据点
      const testData = []
      const today = new Date()
      for (let i = 0; i < 30; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() - i * 3)
        testData.push([formatDate(date), Math.floor(Math.random() * 500)])
      }
      heatmapData.value = [...heatmapData.value, ...testData]
    }
    
    // 设置图表选项
    chart.setOption(getChartOption())
    
    // 添加窗口大小变化事件监听
    window.addEventListener('resize', handleResize)
    
    // 保存图表实例，以便后续可以销毁
    chartInstance.value = chart
    
    // 更新滚动状态
    nextTick(() => {
      updateScrollPosition()
      
      // 设置初始位置到最右侧（最新数据）
      if (containerRef.value) {
        containerRef.value.scrollLeft = containerRef.value.scrollWidth - containerRef.value.clientWidth;
      }
    })
  } catch (err) {
    console.error('Error initializing heatmap:', err)
    hasError.value = true
  }
}

// 更新图表配置选项
function updateChartOptions() {
  if (!chartInstance.value) return
  chartInstance.value.setOption(getChartOption())
}

// 监听主题变化
watch(isDark, (newVal, oldVal) => {
  if (newVal !== oldVal && chartInstance.value) {
    // 保存当前滚动位置
    const currentScrollLeft = containerRef.value?.scrollLeft || 0;
    
    // 重新初始化图表以应用新主题
    nextTick(() => {
      if (chartInstance.value) {
        const el = chartInstance.value.getDom();
        chartInstance.value.dispose();
        el.style.backgroundColor = newVal ? 'transparent' : '';
        chartInstance.value = echarts.init(el, newVal ? 'dark' : undefined);
        chartInstance.value.setOption(getChartOption());
        
        // 恢复滚动位置
        nextTick(() => {
          if (containerRef.value) {
            containerRef.value.scrollLeft = currentScrollLeft;
            updateScrollPosition();
          }
        });
      }
    });
  }
}, { immediate: false });

// 检测并设置当前主题
function detectTheme() {
  if (!isBrowser) return
  
  // 获取HTML元素上的dark类
  const isDarkMode = document.documentElement.classList.contains('dark')
  if (isDark.value !== isDarkMode) {
    // 不需要手动设置isDark，因为它是一个computed属性，会自动跟随themeIsDark变化
  }
}

// 监听主题变化
function setupThemeChangeListener() {
  if (!isBrowser) return
  
  // 不再需要初始检测主题，因为使用了VitePress的isDark
  
  // 返回空函数作为清理函数
  return () => {};
}

// 处理窗口大小变化
function handleResize() {
  if (chartInstance.value) {
    chartInstance.value.resize()
  }
  nextTick(() => {
    updateScrollPosition()
  })
}

// 保存需要清理的资源
let cleanupThemeListener = null;

onMounted(async () => {
  // 确保只在浏览器环境中执行
  if (!isBrowser) return
  
  try {
    // 从生成的JSON文件获取数据
    const response = await fetch(withBase('/posts.json'))
    if (!response.ok) {
      throw new Error('加载文章数据失败')
    }
    
    const posts = await response.json()
    
    // 只获取随想文章
    const thoughtsPosts = posts.filter(post => 
      post.frontmatter.publish === true && 
      post.relativePath.startsWith('thoughts/') && 
      post.relativePath !== 'thoughts/index.md' &&
      post.relativePath !== 'thoughts/tags.md'
    )
    
    // 按日期统计文章字数
    const dateWordCountMap = {}
    thoughtsPosts.forEach(post => {
      if (post.frontmatter.date) {
        // 使用增强的日期解析
        const parsedDate = parseDateString(post.frontmatter.date)
        if (parsedDate) {
          const dateStr = formatDate(parsedDate)
          // 使用文章总字数作为数据点
          const wordCount = countWord(post.content || '')
          dateWordCountMap[dateStr] = (dateWordCountMap[dateStr] || 0) + wordCount
        }
      }
    })
    
    // 确定日期范围
    yearRange.value = getYearRange()
    const startDate = new Date(yearRange.value.start)
    const endDate = new Date(yearRange.value.end)
    
    // 转换为热力图需要的数据格式 [日期, 字数]
    const tempData = []
    
    // 遍历日期范围内的每一天
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = formatDate(d)
      const wordCount = dateWordCountMap[dateStr] || 0
      tempData.push([dateStr, wordCount])
    }
    
    // 计算颜色范围
    const maxValue = Math.max(
      ...tempData.map(item => item[1]),
      1 // 确保至少为1，避免所有数据为0的情况
    )
    
    // 设置为GitHub贡献图的5种颜色等级
    const levels = 5
    const step = Math.ceil(maxValue / levels)
    visualMapMax.value = step * levels
    
    // 保存数据
    heatmapData.value = tempData
    
    // 渲染完成后，需要设置isLoading为false
    isLoading.value = false
    
    // 设置主题变化监听器
    cleanupThemeListener = setupThemeChangeListener()
    
    // 确保DOM已渲染后初始化图表
    nextTick(() => {
      setTimeout(() => {
        initChart()
        setupHorizontalScroll() // 设置横向滚动
      }, 100) // 添加一点延迟，以确保DOM完全渲染
    })
  } catch (error) {
    console.error('Error loading heatmap data:', error)
    hasError.value = true
    isLoading.value = false
  }
})

// 组件卸载时清理资源
onBeforeUnmount(() => {
  if (isBrowser) {
    // 清理主题监听器
    if (cleanupThemeListener) {
      cleanupThemeListener()
    }
    
    // 清理事件监听器
    window.removeEventListener('resize', handleResize)
    if (containerRef.value) {
      containerRef.value.removeEventListener('wheel', () => {})
    }
    
    // 销毁图表实例
    if (chartInstance.value) {
      chartInstance.value.dispose()
    }
  }
})
</script>

<template>
  <div class="contribution-heatmap">
    <h3 class="section-title">字数热力图</h3>
    
    <!-- 加载中状态 -->
    <div v-if="isLoading" class="loading">
      <p>加载中...</p>
    </div>
    
    <!-- 错误状态 -->
    <div v-else-if="hasError" class="error">
      <p>加载热力图数据失败，请刷新重试</p>
    </div>
    
    <!-- 热力图展示 -->
    <div v-else class="heatmap-outer">
      <div class="scroll-wrapper">
        <!-- 左侧渐变遮罩 -->
        <div class="fade-mask left" :style="{ opacity: scrollPosition > 0 ? 1 : 0 }"></div>

        <!-- 热力图容器 -->
        <div class="heatmap-container" ref="containerRef" @scroll="updateScrollPosition">
        <div ref="heatmapRef" class="heatmap-chart"></div>
        </div>
        
        <!-- 右侧渐变遮罩 -->
        <div class="fade-mask right" :style="{ opacity: scrollPosition < maxScroll ? 1 : 0 }"></div>
      </div>

      <div class="legend">
          <span class="legend-text">字数贡献</span>
          <div class="legend-squares">
          <span class="legend-square" :style="{ backgroundColor: isDark ? '#2d333b' : '#ebedf0' }"></span>
          <span class="legend-square" :style="{ backgroundColor: isDark ? '#0e4429' : '#c6e48b' }"></span>
          <span class="legend-square" :style="{ backgroundColor: isDark ? '#006d32' : '#7bc96f' }"></span>
          <span class="legend-square" :style="{ backgroundColor: isDark ? '#26a641' : '#239a3b' }"></span>
          <span class="legend-square" :style="{ backgroundColor: isDark ? '#39d353' : '#196127' }"></span>
          </div>
          <span class="legend-text">更多</span>
        </div>
    </div>
  </div>
</template>

<style scoped>
.contribution-heatmap {
  margin-bottom: 2rem;
  overflow: hidden;
}

.section-title {
  font-size: 1.4rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--vp-c-divider);
}

.loading, .error {
  text-align: center;
  padding: 1rem;
  color: var(--vp-c-text-2);
  font-style: italic;
}

.error {
  color: var(--vp-c-danger);
}

.heatmap-outer {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 16px;
}

.scroll-wrapper {
  position: relative;
  width: 100%;
  max-width: 400px;
  overflow: hidden;
}

.heatmap-container {
  width: 100%;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  scroll-behavior: smooth;
}

/* 渐变遮罩 */
.fade-mask {
  position: absolute;
  top: 0;
  height: 100%;
  width: 60px;
  z-index: 10;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.fade-mask.left {
  left: 0;
  background: linear-gradient(to right, var(--vp-c-bg), transparent);
}

.fade-mask.right {
  right: 0;
  background: linear-gradient(to left, var(--vp-c-bg), transparent);
}

.legend {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-top: 8px;
  margin-bottom: 0.5rem;
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
}

.legend-text {
  margin: 0 0.25rem;
}

.legend-squares {
  display: flex;
}

.legend-square {
  width: 12px;
  height: 12px;
  margin: 0 1px;
  border: 1px solid rgba(27, 31, 35, 0.06);
}

.heatmap-chart {
  position: relative;
  background-color: transparent;
}

@media (max-width: 959px) {
  .fade-mask {
    width: 40px;
  }
  
  .section-title {
    font-size: 1.2rem;
    margin-bottom: 0.8rem;
  }
  
  .heatmap-container {
    width: 100%;
  }
  
  .legend {
    font-size: 0.7rem;
  }
  
  .legend-square {
    width: 10px;
    height: 10px;
  }
}

@media (max-width: 480px) {
  .scroll-wrapper {
    max-width: 100%;
  }
  
  .fade-mask {
    width: 30px;
  }
}
</style> 