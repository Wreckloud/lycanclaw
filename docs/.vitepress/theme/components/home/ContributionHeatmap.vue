<script setup>
/**
 * GitHub风格贡献热力图
 * 基于ECharts实现，显示文章发布的热力分布
 */
import { ref, onMounted, onBeforeUnmount, nextTick, computed, watch } from 'vue'
import { withBase, useData } from 'vitepress'
import * as echarts from 'echarts/core'
import { CalendarComponent, VisualMapComponent } from 'echarts/components'
import { HeatmapChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'
import {
  fetchKnowledgeStats,
  fetchPublishedThoughtPosts
} from '../../utils/contentData'
import {
  buildDateWordCountMap,
  getOneYearDateRange
} from '../../utils/homeAnalytics'

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

// 引用DOM元素
const heatmapRef = ref(null)
const containerRef = ref(null)
const animationTriggerRef = ref(null) // 添加动画触发元素引用

// 滚动状态
const scrollPosition = ref(0)
const maxScroll = ref(0)
const isVisible = ref(false) // 添加可见性状态

// 组件状态
const isLoading = ref(true)
const hasError = ref(false)
const isDark = computed(() => themeIsDark.value) // 使用VitePress的主题状态

// 热力图数据
const heatmapData = ref([])
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

function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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

// 热力图实例
const chartInstance = ref(null)

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
    wheelListener = (e) => {
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
  if (!containerRef.value) return
  
  // 先滚动到最左侧
  containerRef.value.scrollLeft = 0
  
  // 稍微延迟后滚动到最右侧，产生动画效果
  setTimeout(() => {
    const targetScroll = containerRef.value.scrollWidth - containerRef.value.clientWidth
    containerRef.value.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    })
  }, 300)
}

// 观察元素是否进入视口
function setupIntersectionObserver() {
  if (!isBrowser || !window.IntersectionObserver) return
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !isVisible.value) {
        isVisible.value = true
        // 触发滚动动画
        performScrollAnimation()
        observer.unobserve(entry.target)
      }
    })
  }, { 
    threshold: 0.1, // 降低阈值，只需要30%进入视口就触发
    rootMargin: '0px 0px 0px 0px' // 移除负边距，不再延迟触发
  })
  
  // 观察动画触发元素
  setTimeout(() => {
    if (animationTriggerRef.value) {
      observer.observe(animationTriggerRef.value)
    }
  }, 100)
  
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
    // 强制设置容器尺寸 - 保留原始尺寸设置
    heatmapRef.value.style.width = '1000px'
    heatmapRef.value.style.height = '200px'
    
    // 初始化图表
    const chart = echarts.init(heatmapRef.value, isDark.value ? 'dark' : undefined)
    
    // 设置图表选项
    chart.setOption(getChartOption())
    
    // 添加窗口大小变化事件监听
    window.addEventListener('resize', handleResize)
    
    // 保存图表实例，以便后续可以销毁
    chartInstance.value = chart
    
    // 更新滚动状态
    nextTick(() => {
      updateScrollPosition()
    })
  } catch (err) {
    console.error('Error initializing heatmap:', err)
    hasError.value = true
  }
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
let cleanupObserver = null
let wheelListener = null

onMounted(async () => {
  // 确保只在浏览器环境中执行
  if (!isBrowser) return
  
  try {
    const thoughtsPosts = await fetchPublishedThoughtPosts(withBase)
    
    const knowledgeStats = await fetchKnowledgeStats(withBase)
    const dateWordCountMap = buildDateWordCountMap(thoughtsPosts, knowledgeStats)
    
    // 确定日期范围
    yearRange.value = getOneYearDateRange()
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
    
    // 确保DOM已渲染后初始化图表
    nextTick(() => {
      setTimeout(() => {
        initChart()
        setupHorizontalScroll() // 设置横向滚动
        cleanupObserver = setupIntersectionObserver() // 设置交叉观察器
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
