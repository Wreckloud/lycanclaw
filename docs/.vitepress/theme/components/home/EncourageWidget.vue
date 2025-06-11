<script setup>
import { ref } from 'vue'

// 接收属性
const props = defineProps({
  postCount: {
    type: Number,
    default: 0
  },
  animatedCount: {
    type: Number,
    default: 0
  }
})

// 催更状态
const encourageCount = ref(0)
const isDrawerVisible = ref(false)
const drawerMessage = ref('')
let drawerTimer = null
let comboResetTimer = null // 连击重置计时器
let lastParticleTime = 0 // 上次创建粒子的时间
let lastClickTime = 0 // 上次点击的时间
const THROTTLE_INTERVAL = 200 // 粒子效果节流间隔（毫秒）
const CLICK_THROTTLE = 80 // 点击事件节流间隔（毫秒）

// 催更消息配置
const encourageMessages = {
  1: '收到催更了',
  5: '别戳啦！已经在动笔了',
  10: '嗷呜——深夜码字...',
  20: '咕——要过劳死了……',
  30: '再催试试看？(咧牙)',
  45: '你是想逼我咬你一口？',
  90: '哼，我不伺候了!',
  200: '真有耐心...但没用!',
}

// 消息颜色列表
const messageColors = [
  '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', 
  '#ec4899', '#ef4444', '#14b8a6', '#f97316'
]

const activeMessages = ref([])
let messageIdCounter = 0

// 获取催更消息
function getEncourageMessage(count) {
  // 区间显示，查找小于等于当前数值的最大级别
  const thresholds = Object.keys(encourageMessages)
    .map(Number)
    .sort((a, b) => a - b)
  
  // 查找合适的区间
  let selectedThreshold = 1 // 默认使用第一个消息
  
  for (const threshold of thresholds) {
    if (count >= threshold) {
      selectedThreshold = threshold
    } else {
      break
    }
  }
  
  // 返回该区间对应的消息
  return encourageMessages[selectedThreshold]
}

// 显示浮动消息
function showFloatingMessage(event, count) {
  const x = event.clientX
  const y = event.clientY
  
  // 随机参数 - 增加横向和垂直方向上的偏移
  const angle = Math.random() * 40 - 20  // 更夸张的角度范围，从 ±10 变为 ±20
  const offsetX = Math.random() * 80 - 40  // 横向偏移增加一倍，从 ±20 变为 ±40
  const offsetY = Math.random() * 60 - 120  // 更强的向上偏移
  const color = messageColors[Math.floor(Math.random() * messageColors.length)]
  const id = messageIdCounter++
  
  // 添加随机大小变化
  const sizeVariation = 0.9 + Math.random() * 0.3 // 0.9 到 1.2 之间的随机值
  
  // 创建消息对象
  const displayMessage = count === 1 ? '催更' : `催更x${count}`
  
  const messageObj = {
    id,
    x: x + offsetX,
    y: y + offsetY,  // 使用更大的垂直偏移
    message: displayMessage,
    angle,  // 使用更夸张的角度
    color,
    opacity: 1,
    scale: 0.8 * sizeVariation, // 应用随机大小变化
    fontSize: `${1.2 * sizeVariation}rem` // 随机字体大小
  }
  
  // 添加消息
  activeMessages.value.push(messageObj)
  
  // 设置消失定时器
  setTimeout(() => {
    // 淡出动画
    const msgIndex = activeMessages.value.findIndex(m => m.id === id)
    if (msgIndex !== -1) {
      activeMessages.value[msgIndex].opacity = 0
      activeMessages.value[msgIndex].scale = 1.2 * sizeVariation // 保持大小比例
    }
    
    // 移除消息
    setTimeout(() => {
      activeMessages.value = activeMessages.value.filter(m => m.id !== id)
    }, 500)
  }, 1500)
}

// 创建粒子效果（Canvas优化版）
function createParticles(event) {
  const now = Date.now()
  
  // 节流控制 - 如果距离上次粒子效果不到200ms，跳过创建新粒子
  if (now - lastParticleTime < THROTTLE_INTERVAL) return
  lastParticleTime = now
  
  const colors = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899']
  
  // 根据设备性能动态调整粒子数量
  let particles = 24 // 增加粒子数量到24个
  
  // 移动设备检测（简易版）- 降低粒子数量
  if (window.innerWidth <= 768) {
    particles = 12 // 移动设备使用12个粒子
  }
  
  // 创建Canvas元素
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  
  if (!ctx) {
    console.error('无法创建Canvas上下文')
    return
  }
  
  // 设置Canvas样式
  canvas.className = 'particle-canvas'
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  canvas.style.position = 'fixed'
  canvas.style.left = '0'
  canvas.style.top = '0'
  canvas.style.width = '100vw'
  canvas.style.height = '100vh'
  canvas.style.pointerEvents = 'none'
  canvas.style.zIndex = '9999'
  
  document.body.appendChild(canvas)
  
  // 获取点击位置
  const x = event.clientX
  const y = event.clientY
  
  // 创建粒子数组
  const particlesArray = []
  
  // 创建星星路径（一次性定义，重复使用）
  function drawStar(ctx, x, y, size, color) {
    ctx.save()
    ctx.beginPath()
    ctx.fillStyle = color
    
    // 绘制更精细的星星
    const spikes = 5
    const outerRadius = size
    const innerRadius = size * 0.4
    
    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius
      const angle = (Math.PI * i) / spikes - Math.PI / 2 // 从顶部开始绘制
      const pointX = x + Math.cos(angle) * radius
      const pointY = y + Math.sin(angle) * radius
      
      if (i === 0) {
        ctx.moveTo(pointX, pointY)
      } else {
        ctx.lineTo(pointX, pointY)
      }
    }
    
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }
  
  // 生成粒子
  for (let i = 0; i < particles; i++) {
    const size = Math.random() * 6 + 4
    const color = colors[Math.floor(Math.random() * colors.length)]
    const angle = Math.random() * Math.PI * 2
    const velocity = Math.random() * 1.8 + 1.2 // 增加速度范围
    
    // 计算水平和垂直速度
    const vx = Math.cos(angle) * velocity
    const vy = Math.sin(angle) * velocity - 1
    
    // 创建粒子对象
    particlesArray.push({
      x,
      y,
      vx,
      vy,
      size,
      color,
      alpha: 1,
      rotation: 0,
      rotationSpeed: (Math.random() * 0.8 - 0.4) * Math.PI / 180 * 5 // 降低旋转速度，转换为弧度
    })
  }
  
  // 开始时间
  const startTime = performance.now()
  const duration = 1200 // 增加粒子效果持续时间
  
  // 执行动画
  function animate() {
    // 计算已过去的时间
    const elapsed = performance.now() - startTime
    
    if (elapsed < duration) {
      // 清除画布
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // 绘制每个粒子
      for (let i = 0; i < particlesArray.length; i++) {
        const p = particlesArray[i]
        
        // 更新位置
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.04 // 减小重力效果
        p.rotation += p.rotationSpeed
        
        // 使用缓动函数计算透明度，让消失更自然
        const progress = elapsed / duration
        p.alpha = 1 - Math.pow(progress, 1.5)
        
        // 绘制粒子
        ctx.globalAlpha = p.alpha
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        
        // 绘制星形
        drawStar(ctx, 0, 0, p.size, p.color)
        
        ctx.restore()
        ctx.globalAlpha = 1
      }
      
      // 继续动画
      requestAnimationFrame(animate)
    } else {
      // 动画结束，移除Canvas
      canvas.remove()
    }
  }
  
  // 开始动画
  animate()
}

// 重置连击计时器
function resetComboTimer() {
  // 清除之前的计时器
  if (comboResetTimer) {
    clearTimeout(comboResetTimer)
  }
  
  // 设置新的计时器 - 3秒后重置连击
  comboResetTimer = setTimeout(() => {
    if (encourageCount.value > 0) {
      encourageCount.value = 0
    }
  }, 3000)
}

// 催更功能（节流版）
function encourageUpdate(event) {
  const now = Date.now()
  
  // 如果点击过于频繁，跳过处理
  if (now - lastClickTime < CLICK_THROTTLE) return
  lastClickTime = now
  
  // 增加计数
  encourageCount.value++
  
  // 获取消息
  const text = getEncourageMessage(encourageCount.value)
  
  // 显示催更消息
  showFloatingMessage(event, encourageCount.value)
  
  // 创建粒子效果
  createParticles(event)
  
  // 更新抽屉消息
  drawerMessage.value = text
  
  // 处理连续点击
  if (isDrawerVisible.value && drawerTimer) {
    clearTimeout(drawerTimer)
  } else {
    isDrawerVisible.value = true
  }
  
  // 自动关闭计时器
  drawerTimer = setTimeout(() => {
    isDrawerVisible.value = false
  }, 3000)
  
  // 重置连击计时器
  resetComboTimer()
}

// 格式化数字
function formatNumber(num) {
  if (num === undefined || num === null) return '0'
  
  if (num < 10000) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  } else if (num < 1000000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  } else if (num < 100000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
  } else {
    return (num / 100000000).toFixed(1).replace(/\.0$/, '') + '亿'
  }
}
</script>

<template>
  <div class="stats-card clickable-area" @click="encourageUpdate">
    <div class="stats-value">{{ formatNumber(animatedCount) }}<span class="plus-mark">+</span></div>
    <div class="stats-label">本月更新</div>
    
    <!-- 抽屉组件 -->
    <transition name="drawer-slide">
      <div class="drawer-container" v-if="isDrawerVisible">
        <div class="drawer">
          <div class="drawer-content">
            {{ drawerMessage }}
          </div>
        </div>
      </div>
    </transition>
  </div>
  
  <!-- 浮动催更消息 -->
  <teleport to="body">
    <div class="floating-messages">
      <div
        v-for="msg in activeMessages"
        :key="msg.id"
        class="floating-message"
        :style="{
          '--x-pos': `${msg.x}px`,
          '--y-pos': `${msg.y}px`,
          '--angle': `${msg.angle}deg`,
          '--scale': msg.scale,
          '--opacity': msg.opacity,
          'color': msg.color,
          'font-size': msg.fontSize
        }"
      >
        {{ msg.message }}
      </div>
    </div>
  </teleport>
</template>

<style scoped>
.stats-card {
  background-color: var(--vp-c-bg-soft);
  border-radius: 8px;
  padding: 1.5rem 0.5rem;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  user-select: none;
  position: relative;
  overflow: hidden;
  will-change: transform; /* 提示浏览器这个元素将会变化 */
  transform: translateZ(0); /* 启用硬件加速 */
}

.clickable-area {
  cursor: pointer;
}

.stats-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--vp-c-brand-1);
  white-space: nowrap;
  height: 2.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  text-overflow: ellipsis;
  user-select: none;
  margin-bottom: 0.5rem;
}

.plus-mark {
  font-size: 1.5rem;
  font-weight: 700;
  vertical-align: super;
  line-height: 1;
  display: inline-block;
  position: relative;
  top: -0.2rem;
}

.stats-label {
  font-size: 0.95rem;
  color: var(--vp-c-text-2);
  white-space: nowrap;
  height: 1.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  user-select: none;
}

/* 抽屉样式 */
.drawer-container {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
}

.drawer {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  background-color: var(--vp-c-brand-1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  text-align: center;
  z-index: 5;
  will-change: transform; /* 提示浏览器这个元素将会变化 */
  transform: translateZ(0); /* 启用硬件加速 */
}

.drawer-content {
  padding: 0 0.5rem;
  font-size: 1.1rem;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* 抽屉滑动动画 */
.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateY(100%);
}

/* 浮动消息样式 */
.floating-messages {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
  overflow: visible;
  contain: content; /* 优化渲染 */
}

.floating-message {
  position: fixed;
  font-size: 1.2rem;
  font-weight: 600;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  pointer-events: none;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  white-space: nowrap;
  transition: opacity 0.5s ease, transform 0.5s ease;
  filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.3)); /* 减淡阴影效果 */
  will-change: transform, opacity; /* 告知浏览器哪些属性会变化 */
  left: 0;
  top: 0;
  /* 使用CSS变量改进性能 */
  transform: translate(var(--x-pos), var(--y-pos)) rotate(var(--angle)) scale(var(--scale));
  opacity: var(--opacity);
  backface-visibility: hidden;
}

/* 粒子Canvas优化 */
.particle-canvas {
  position: fixed;
  left: 0;
  top: 0;
  pointer-events: none;
  z-index: 9999;
  transform: translateZ(0);
  will-change: transform;
}

/* 移动端适配 */
@media (max-width: 959px) {
  .stats-card {
    padding: 1rem 0.5rem;
  }
  
  .stats-value {
    font-size: 1.5rem;
    height: 2rem;
  }
  
  .plus-mark {
    font-size: 1.2rem;
    top: -0.15rem;
  }
  
  .stats-label {
    font-size: 0.85rem;
    height: 1.3rem;
  }
  
  .floating-message {
    font-size: 1rem;
    padding: 0.3rem 0.6rem;
  }
  
  .drawer-content {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .stats-card {
    padding: 0.8rem 0.4rem;
  }
  
  .stats-value {
    font-size: 1.4rem;
    height: 1.8rem;
  }
  
  .plus-mark {
    font-size: 1rem;
    top: -0.1rem;
  }
  
  .stats-label {
    font-size: 0.8rem;
    height: 1.2rem;
  }
  
  .floating-message {
    font-size: 0.9rem;
    padding: 0.2rem 0.5rem;
  }
  
  .drawer-content {
    font-size: 0.9rem;
  }
}
</style> 