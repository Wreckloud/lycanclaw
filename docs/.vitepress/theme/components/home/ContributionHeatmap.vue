<script setup lang="ts">
/**
 * ContributionHeatmap.vue：
 * 定义ContributionHeatmap组件的交互与展示逻辑。
 */
import { ref, onMounted, onBeforeUnmount, nextTick, computed, watch } from 'vue'
import { useData } from 'vitepress'
import * as echarts from 'echarts/core'
import { CalendarComponent, VisualMapComponent } from 'echarts/components'
import { HeatmapChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'
import type { EChartsType } from 'echarts/core'
import { fetchDailyContributionPayload } from '../../utils/api'
import { getOneYearDateRange } from '../../utils/home'
import { logError } from '../../utils/logger'
import { HEATMAP_CELL_BORDER, HEATMAP_PALETTE } from '../../utils/theme'

// 按需注册组件
echarts.use([
  CalendarComponent,
  VisualMapComponent,
  HeatmapChart,
  CanvasRenderer
])

// 从VitePress获取主题数据
const { isDark: themeIsDark } = useData()

// 判断是否在浏览器环境中
const isBrowser = typeof window !== 'undefined'
const VISIBILITY_THRESHOLD = 0.1

// 引用DOM元素
const heatmapRef = ref<HTMLElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)
const animationTriggerRef = ref<HTMLElement | null>(null) // 添加动画触发元素引用

// 滚动状态
const scrollPosition = ref(0)
const maxScroll = ref(0)
const isVisible = ref(false) // 添加可见性状态

// 组件状态
const isLoading = ref(true)
const hasError = ref(false)
const isDark = computed(() => themeIsDark.value) // 使用VitePress的主题状态
const isRequested = ref(false)
const isInitialized = ref(false)

// 热力图数据
const heatmapData = ref<Array<[string, number]>>([])
const yearRange = ref({
  start: '',
  end: ''
})
const visualMapMax = ref(100)

// 更新滚动位置
function updateScrollPosition() {
  if (!containerRef.value) return
  scrollPosition.value = containerRef.value.scrollLeft
  
  // 计算最大滚动距离
  maxScroll.value = containerRef.value.scrollWidth - containerRef.value.clientWidth
}

function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDateAsLocal(value: string): Date {
  const [year, month, day] = value.split('-').map((part) => Number.parseInt(part, 10))
  if (!year || !month || !day) {
    return new Date(value)
  }
  return new Date(year, month - 1, day)
}

function getRootCssVar(name: string, fallback: string): string {
  if (!isBrowser) return fallback

  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

// 热力图实例
const chartInstance = ref<EChartsType | null>(null)
const heatmapColors = computed(() => (isDark.value ? HEATMAP_PALETTE.dark : HEATMAP_PALETTE.light))
const heatmapCellBorderColor = computed(() => (isDark.value ? HEATMAP_CELL_BORDER.dark : HEATMAP_CELL_BORDER.light))
const heatmapMonthLabelColor = computed(() => getRootCssVar('--vp-c-text-3', '#999'))

// 获取图表配置
function getChartOption() {
  return {
    backgroundColor: isDark.value ? 'rgba(0,0,0,0)' : undefined, // 深色模式下使用透明背景
    tooltip: {
      show: false // 禁用悬浮提示
    },
    visualMap: {
      show: false,
      min: 0,
      max: visualMapMax.value,
      calculable: true,
      inRange: {
        color: heatmapColors.value
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
        borderColor: heatmapCellBorderColor.value
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
        color: heatmapMonthLabelColor.value
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
    wheelListener = (e: WheelEvent) => {
      if (e.deltaY !== 0 && containerRef.value) {
        e.preventDefault()
        containerRef.value.scrollLeft += e.deltaY
      }
    }

    containerRef.value.addEventListener('wheel', wheelListener, { passive: false })
    updateScrollPosition()
  }
}

// 执行滚动动画 - 从左到右的滚动效果
function performScrollAnimation() {
  const container = containerRef.value
  if (!container) return
  
  // 先滚动到最左侧
  container.scrollLeft = 0
  
  // 稍微延迟后滚动到最右侧，产生动画效果
  setTimeout(() => {
    const latestContainer = containerRef.value
    if (!latestContainer) return
    const targetScroll = latestContainer.scrollWidth - latestContainer.clientWidth
    latestContainer.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    })
  }, 300)
}

// 观察元素是否进入视口
function setupIntersectionObserver(): (() => void) | null {
  if (!isBrowser || !window.IntersectionObserver) return null
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !isVisible.value) {
        isVisible.value = true
        void loadAndInitHeatmap()
        observer.unobserve(entry.target)
      }
    })
  }, { 
    threshold: VISIBILITY_THRESHOLD,
    rootMargin: '0px 0px 0px 0px'
  })
  
  if (animationTriggerRef.value) {
    observer.observe(animationTriggerRef.value)
  }
  
  return () => {
    if (animationTriggerRef.value && observer) {
      observer.unobserve(animationTriggerRef.value)
      observer.disconnect()
    }
  }
}

// 初始化图表的函数
function initChart() {
  if (!heatmapRef.value) {
    hasError.value = true
    return
  }
  
  try {
    // 初始化图表
    const chart = echarts.init(heatmapRef.value)
    
    // 设置图表选项
    chart.setOption(getChartOption())
    
    // 添加窗口大小变化事件监听
    window.addEventListener('resize', handleResize)
    
    // 保存图表实例，以便后续可以销毁
    chartInstance.value = chart
    isInitialized.value = true
    
    // 更新滚动状态
    nextTick(() => {
      updateScrollPosition()
      requestAnimationFrame(() => performScrollAnimation())
    })
  } catch (err) {
    logError('ContributionHeatmap', '初始化热力图失败', err)
    hasError.value = true
  }
}

// 监听主题变化
watch(isDark, (newVal, oldVal) => {
  if (newVal !== oldVal && chartInstance.value && isInitialized.value) {
    chartInstance.value.setOption(getChartOption(), true)
    nextTick(() => updateScrollPosition())
  }
}, { immediate: false });

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
let cleanupObserver: (() => void) | null = null
let wheelListener: ((event: WheelEvent) => void) | null = null

async function loadAndInitHeatmap() {
  if (isRequested.value) return
  isRequested.value = true
  isLoading.value = true

  try {
    const payload = await fetchDailyContributionPayload()
    const dailyContributions = payload.data
    const contributionMap = new Map(
      dailyContributions.map((item) => [item.date, item.total])
    )

    const fallbackRange = getOneYearDateRange()
    const firstDate = dailyContributions[0]?.date || fallbackRange.start
    const lastDate = dailyContributions[dailyContributions.length - 1]?.date || fallbackRange.end

    yearRange.value = {
      start: firstDate,
      end: lastDate
    }

    const startDate = parseDateAsLocal(yearRange.value.start)
    const endDate = parseDateAsLocal(yearRange.value.end)

    // 转换为热力图需要的数据格式 [日期, 日贡献值]
    const tempData: Array<[string, number]> = []

    // 遍历日期范围内的每一天
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = formatDate(d)
      const contribution = contributionMap.get(dateStr) || 0
      tempData.push([dateStr, contribution])
    }

    // 计算颜色范围
    const maxValue = Math.max(
      ...tempData.map((item) => item[1]),
      1
    )

    // 设置为GitHub贡献图的5种颜色等级
    const levels = 5
    const step = Math.ceil(maxValue / levels)
    visualMapMax.value = step * levels

    // 保存数据
    heatmapData.value = tempData
    isLoading.value = false

    await nextTick()
    requestAnimationFrame(() => {
      initChart()
      setupHorizontalScroll()
    })
  } catch (error) {
    logError('ContributionHeatmap', '加载热力图数据失败', error)
    hasError.value = true
    isLoading.value = false
  }
}

onMounted(() => {
  if (!isBrowser) return

  cleanupObserver = setupIntersectionObserver()
  if (!cleanupObserver) {
    isVisible.value = true
    void loadAndInitHeatmap()
  }
})

// 组件卸载时清理资源
onBeforeUnmount(() => {
  if (isBrowser) {
    // 清理观察器
    if (cleanupObserver) {
      cleanupObserver()
    }
    
    // 清理事件监听器
    window.removeEventListener('resize', handleResize)
    if (containerRef.value && wheelListener) {
      containerRef.value.removeEventListener('wheel', wheelListener)
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
    <!-- 添加动画触发元素 -->
    <div ref="animationTriggerRef" class="animation-trigger"></div>
    
    <!-- 加载中状态：只在组件可见时显示 -->
    <div v-if="isLoading && isVisible" class="loading">
      <p>加载中...</p>
    </div>
    
    <!-- 错误状态：只在组件可见时显示 -->
    <div v-else-if="hasError && isVisible" class="error">
      <p>加载热力图数据失败，请刷新重试</p>
    </div>
    
    <!-- 热力图展示：只有在不加载或组件可见时显示 -->
    <div v-else-if="!isLoading || isVisible" class="heatmap-outer">
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
        <span class="legend-text">日贡献</span>
        <div class="legend-squares">
          <span
            v-for="(heatColor, index) in heatmapColors"
            :key="`legend-${index}`"
            class="legend-square"
            :style="{ backgroundColor: heatColor }"
          ></span>
        </div>
        <span class="legend-text">更多</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.contribution-heatmap {
  overflow: hidden;
  position: relative;
}

/* 为动画触发器设置样式 */
.animation-trigger {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: -1;
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
  transition: opacity var(--lc-motion-duration-normal) var(--lc-motion-ease-standard);
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
  width: 1000px;
  height: 200px;
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
