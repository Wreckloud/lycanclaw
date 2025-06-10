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

// 催更消息配置
const encourageMessages = {
  1: '收到催更了',
  5: '别戳啦！已经在动笔了',
  10: '嗷呜——深夜码字...',
  15: '咕——要过劳死了……',
  25: '再催试试看？(咧牙)',
  40: '你是想逼我咬你一口？',
  60: '还在戳，是死忠……还是死对头？',
  80: '哼，再点也没用，我不伺候了!',
  150: '真有耐心...但没用!',
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
  
  // 随机参数 - 进一步增加垂直方向上的偏移，使消息更靠上
  const angle = Math.random() * 40 - 20  // 更夸张的角度范围，从 ±10 变为 ±20
  const offsetX = Math.random() * 40 - 20
  const offsetY = Math.random() * 60 - 120  // 更强的向上偏移，从 -80 变为 -120
  const color = messageColors[Math.floor(Math.random() * messageColors.length)]
  const id = messageIdCounter++
  
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
    scale: 0.8
  }
  
  // 添加消息
  activeMessages.value.push(messageObj)
  
  // 设置消失定时器
  setTimeout(() => {
    // 淡出动画
    const msgIndex = activeMessages.value.findIndex(m => m.id === id)
    if (msgIndex !== -1) {
      activeMessages.value[msgIndex].opacity = 0
      activeMessages.value[msgIndex].scale = 1.2
    }
    
    // 移除消息
    setTimeout(() => {
      activeMessages.value = activeMessages.value.filter(m => m.id !== id)
    }, 500)
  }, 1500)
}

// 创建粒子效果
function createParticles(event) {
  const colors = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899']
  const particles = 20 // 减少粒子数量提高性能
  
  // 创建容器
  const particleContainer = document.createElement('div')
  particleContainer.className = 'particle-container'
  document.body.appendChild(particleContainer)
  
  // 获取点击位置
  const x = event.clientX
  const y = event.clientY
  
  // 设置容器样式
  particleContainer.style.position = 'fixed'
  particleContainer.style.left = '0'
  particleContainer.style.top = '0'
  particleContainer.style.width = '100vw'
  particleContainer.style.height = '100vh'
  particleContainer.style.pointerEvents = 'none'
  particleContainer.style.zIndex = '9999'
  
  // 创建粒子
  for (let i = 0; i < particles; i++) {
    const particle = document.createElement('div')
    particle.className = 'particle'
    
    // 随机参数
    const size = Math.random() * 8 + 4
    const color = colors[Math.floor(Math.random() * colors.length)]
    const angle = Math.random() * Math.PI * 2
    const velocity = Math.random() * 3 + 2
    const lifetime = Math.random() * 800 + 800
    
    // 星星形状
    particle.innerHTML = `<svg width="${size*2}" height="${size*2}" viewBox="0 0 24 24" fill="${color}">
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
    </svg>`
    
    // 初始位置
    particle.style.position = 'absolute'
    particle.style.left = `${x}px`
    particle.style.top = `${y}px`
    particle.style.transform = 'translate(-50%, -50%)'
    
    particleContainer.appendChild(particle)
    
    // 计算速度
    const vx = Math.cos(angle) * velocity
    const vy = Math.sin(angle) * velocity - 1
    
    // 动画
    let startTime = null
    
    function animateParticle(timestamp) {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime
      
      if (elapsed < lifetime) {
        // 计算新位置
        const progress = elapsed / lifetime
        const moveX = x + vx * elapsed * 0.1
        const moveY = y + vy * elapsed * 0.1 + 0.5 * 9.8 * Math.pow(elapsed * 0.01, 2)
        
        // 更新样式
        particle.style.left = `${moveX}px`
        particle.style.top = `${moveY}px`
        particle.style.opacity = 1 - progress
        particle.style.transform = `translate(-50%, -50%) rotate(${progress * 360}deg)`
        
        requestAnimationFrame(animateParticle)
      } else {
        // 移除粒子
        particle.remove()
        
        // 检查是否所有粒子都已移除
        if (particleContainer.children.length === 0) {
          particleContainer.remove()
        }
      }
    }
    
    requestAnimationFrame(animateParticle)
  }
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

// 催更功能
function encourageUpdate(event) {
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
          left: `${msg.x}px`,
          top: `${msg.y}px`,
          transform: `translate(-50%, -50%) rotate(${msg.angle}deg) scale(${msg.scale})`,
          color: msg.color,
          opacity: msg.opacity
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
}

/* 粒子样式 */
.particle-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: visible;
  pointer-events: none;
  z-index: 9999;
}

.particle {
  position: absolute;
  pointer-events: none;
  transform-origin: center;
  will-change: transform, opacity;
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