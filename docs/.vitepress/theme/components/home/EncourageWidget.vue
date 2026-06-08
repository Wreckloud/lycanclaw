<script setup lang="ts">
/**
 * EncourageWidget.vue：
 * 定义EncourageWidget组件的交互与展示逻辑。
 */

import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useDebounceFn, useThrottleFn } from '@vueuse/core'
import { logError } from '../../utils/logger'
import { beaconSettleEncouragement, settleEncouragement } from '../../utils/encouragementApi'
import { getVisitorId } from '../../utils/visitorIdentity'
import {
  ENCOURAGE_MESSAGE_COLORS,
  ENCOURAGE_PARTICLE_COLORS
} from '../../utils/theme'

type PointerEventLike = MouseEvent | TouchEvent
type TimerHandle = ReturnType<typeof setTimeout>
type TimerKey = 'drawer' | 'comboReset' | 'hintDisplay' | 'hintAutoClose' | 'observerSetup'

interface FloatingMessage {
  id: number
  x: number
  y: number
  message: string
  angle: number
  color: string
  opacity: number
  scale: number
  fontSize: string
}

interface ClientPoint {
  x: number
  y: number
}

const props = withDefaults(
  defineProps<{
    postCount?: number
    animatedCount?: number
  }>(),
  {
    postCount: 0,
    animatedCount: 0
  }
)

const internalAnimatedCount = ref(0)
const DRAWER_CLOSE_MS = 3000
const COMBO_RESET_MS = 3000
const PARTICLE_THROTTLE_MS = 200
const HINT_DISPLAY_DELAY_S = 20
const HINT_AUTO_CLOSE_S = 7
const OBSERVER_SETUP_DELAY_MS = 200
const ENCOURAGEMENT_SETTLE_DELAY_MS = 1200

const encourageCount = ref(0)
const isDrawerVisible = ref(false)
const drawerMessage = ref('')
const widgetRef = ref<HTMLElement | null>(null)
const showClickHint = ref(false)
let observerInstance: IntersectionObserver | null = null
const timers: Partial<Record<TimerKey, TimerHandle>> = {}
let settleTimer: TimerHandle | null = null
let pendingEncouragementDelta = 0
let isSettlementInFlight = false

const hasClickedInSession = ref(false)
const hasHoveredInSession = ref(false)
const isHovered = ref(false)

const encourageMessages: Record<number, string> = {
  1: '收到催更了',
  5: '别戳啦！已经在动笔了',
  10: '嗷呜——深夜码字...',
  20: '咕——要过劳死了……',
  30: '再催试试看？(咧牙)',
  45: '你是想逼我咬你一口？',
  90: '哼，我不伺候了!',
  200: '真有耐心...但没用!',
}

const activeMessages = ref<FloatingMessage[]>([])
let messageIdCounter = 0

watch(
  () => props.animatedCount,
  (newValue) => {
    internalAnimatedCount.value = newValue
  },
  { immediate: true }
)

function clearTimer(key: TimerKey): void {
  if (!timers[key]) return
  clearTimeout(timers[key])
  delete timers[key]
}

function setTimer(key: TimerKey, callback: () => void, delayMs: number): void {
  clearTimer(key)
  timers[key] = setTimeout(() => {
    delete timers[key]
    callback()
  }, delayMs)
}

function clearAllTimers(): void {
  clearTimer('drawer')
  clearTimer('comboReset')
  clearTimer('hintDisplay')
  clearTimer('hintAutoClose')
  clearTimer('observerSetup')
  clearSettleTimer()
}

function clearSettleTimer(): void {
  if (!settleTimer) return
  clearTimeout(settleTimer)
  settleTimer = null
}

function getEncourageMessage(count: number): string {
  const thresholds = Object.keys(encourageMessages)
    .map(Number)
    .sort((a, b) => a - b)

  let selectedThreshold = 1
  for (const threshold of thresholds) {
    if (count >= threshold) {
      selectedThreshold = threshold
    } else {
      break
    }
  }
  return encourageMessages[selectedThreshold]
}

function getClientPoint(event: PointerEventLike): ClientPoint | null {
  if ('touches' in event) {
    const touch = event.touches[0]
    if (!touch) return null
    return { x: touch.clientX, y: touch.clientY }
  }
  return { x: event.clientX, y: event.clientY }
}

function getEventTargetElement(event: PointerEventLike): HTMLElement | null {
  const target = event.currentTarget
  return target instanceof HTMLElement ? target : null
}

function showFloatingMessage(event: PointerEventLike, count: number): void {
  if (!event || !event.currentTarget) return
  const targetElement = getEventTargetElement(event)
  const point = getClientPoint(event)
  if (!targetElement || !point) return

  const x = point.x
  const y = point.y

  const angle = Math.random() * 40 - 20
  const offsetX = Math.random() * 80 - 40
  const offsetY = Math.random() * 60 - 120
  const color = ENCOURAGE_MESSAGE_COLORS[Math.floor(Math.random() * ENCOURAGE_MESSAGE_COLORS.length)]
  const id = messageIdCounter++

  const sizeVariation = 0.9 + Math.random() * 0.3
  const displayMessage = count === 1 ? '催更' : `催更x${count}`

  const messageObj = {
    id,
    x: x + offsetX,
    y: y + offsetY,
    message: displayMessage,
    angle,
    color,
    opacity: 1,
    scale: 0.8 * sizeVariation,
    fontSize: `${1.2 * sizeVariation}rem`
  }

  activeMessages.value.push(messageObj)

  setTimeout(() => {
    const msgIndex = activeMessages.value.findIndex((m) => m.id === id)
    if (msgIndex !== -1) {
      activeMessages.value[msgIndex].opacity = 0
      activeMessages.value[msgIndex].scale = 1.2 * sizeVariation
    }

    setTimeout(() => {
      activeMessages.value = activeMessages.value.filter((m) => m.id !== id)
    }, 500)
  }, 1500)
}

function createParticles(event: PointerEventLike): void {
  if (!event) return
  const point = getClientPoint(event)
  if (!point) return

  let particles = 36
  if (window.innerWidth <= 768) {
    particles = 24
  }

  const canvas = document.createElement('canvas')
  const maybeCtx = canvas.getContext('2d')

  if (!maybeCtx) {
    logError('EncourageWidget', '无法创建 Canvas 上下文')
    return
  }
  const ctx = maybeCtx

  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  canvas.className = 'particle-canvas'
  canvas.width = viewportWidth
  canvas.height = viewportHeight
  canvas.style.position = 'fixed'
  canvas.style.left = '0'
  canvas.style.top = '0'
  canvas.style.width = '100vw'
  canvas.style.height = '100vh'
  canvas.style.pointerEvents = 'none'
  canvas.style.zIndex = '9999'
  document.body.appendChild(canvas)
  const x = point.x
  const y = point.y

  const particlesArray: Array<{
    x: number
    y: number
    vx: number
    vy: number
    size: number
    color: string
    alpha: number
    rotation: number
    rotationSpeed: number
  }> = []
  
  function drawStar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string
  ): void {
    ctx.save()
    ctx.beginPath()
    ctx.fillStyle = color
    
    const spikes = 5
    const outerRadius = size
    const innerRadius = size * 0.4
    
    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius
      const angle = (Math.PI * i) / spikes - Math.PI / 2
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
    const color = ENCOURAGE_PARTICLE_COLORS[Math.floor(Math.random() * ENCOURAGE_PARTICLE_COLORS.length)]
    const angle = Math.random() * Math.PI * 2
    const velocity = Math.random() * 2.5 + 1.8
    const vx = Math.cos(angle) * velocity
    const vy = Math.sin(angle) * velocity - 2

    particlesArray.push({
      x,
      y,
      vx,
      vy,
      size,
      color,
      alpha: 1,
      rotation: 0,
      rotationSpeed: (Math.random() * 0.8 - 0.4) * Math.PI / 180 * 12
    })
  }

  const startTime = performance.now()
  const duration = 1300

  function animate() {
    const elapsed = performance.now() - startTime

    if (elapsed < duration) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (let i = 0; i < particlesArray.length; i++) {
        const p = particlesArray[i]

        p.x += p.vx
        p.y += p.vy
        p.vy += 0.08
        p.vx *= 0.99
        p.rotation += p.rotationSpeed

        const progress = elapsed / duration
        p.alpha = 1 - Math.pow(progress, 1.5)

        ctx.globalAlpha = p.alpha
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)

        drawStar(ctx, 0, 0, p.size, p.color)

        ctx.restore()
        ctx.globalAlpha = 1
      }

      requestAnimationFrame(animate)
    } else {
      canvas.remove()
    }
  }

  animate()
}

function resetComboTimer(): void {
  setTimer('comboReset', () => {
    if (encourageCount.value > 0) {
      encourageCount.value = 0
    }
  }, COMBO_RESET_MS)
}

function buildEncouragementPayload(delta: number) {
  return {
    delta,
    visitorId: getVisitorId(),
    path: '/',
    title: '首页催更'
  }
}

function flushEncouragement(useBeacon = false): void {
  if (pendingEncouragementDelta <= 0 || isSettlementInFlight) return
  const delta = pendingEncouragementDelta
  pendingEncouragementDelta = 0
  clearSettleTimer()

  const payload = buildEncouragementPayload(delta)
  if (useBeacon && beaconSettleEncouragement(payload)) return

  isSettlementInFlight = true
  settleEncouragement(payload).catch((error) => {
    pendingEncouragementDelta += delta
    logError('EncourageWidget', '催更结算失败', error)
  }).finally(() => {
    isSettlementInFlight = false
    if (pendingEncouragementDelta > 0) scheduleEncouragementSettle()
  })
}

function scheduleEncouragementSettle(): void {
  clearSettleTimer()
  settleTimer = setTimeout(() => {
    settleTimer = null
    flushEncouragement(false)
  }, ENCOURAGEMENT_SETTLE_DELAY_MS)
}

const encourageUpdateThrottled = useThrottleFn((event: PointerEventLike) => {
  encourageCount.value++
  pendingEncouragementDelta++
  scheduleEncouragementSettle()
  const text = getEncourageMessage(encourageCount.value)

  showFloatingMessage(event, encourageCount.value)
  createParticlesThrottled(event)
  drawerMessage.value = text

  isDrawerVisible.value = true
  setTimer('drawer', () => {
    isDrawerVisible.value = false
  }, DRAWER_CLOSE_MS)

  resetComboTimer()
  hideClickHint()
  hasClickedInSession.value = true
}, 80)

const createParticlesThrottled = useThrottleFn(createParticles, PARTICLE_THROTTLE_MS)

function encourageUpdate(event: PointerEventLike): void {
  encourageUpdateThrottled(event)
}

function setupIntersectionObserver(): void {
  if (typeof IntersectionObserver === 'undefined' || !widgetRef.value) return

  observerInstance = new IntersectionObserver((entries) => {
    const entry = entries[0]

    if (entry.isIntersecting) {
      if (!timers.hintDisplay && !hasClickedInSession.value && !hasHoveredInSession.value) {
        setTimer('hintDisplay', () => {
          showClickHint.value = true
          setTimer('hintAutoClose', hideClickHint, HINT_AUTO_CLOSE_S * 1000)
        }, HINT_DISPLAY_DELAY_S * 1000)
      }
    } else {
      hideClickHint()
    }
  }, { threshold: 0.5 })

  observerInstance.observe(widgetRef.value)
}

function hideClickHint(): void {
  showClickHint.value = false
  clearTimer('hintDisplay')
  clearTimer('hintAutoClose')
}

function formatNumber(num: number | null | undefined): string {
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

const handleMouseEnterDebounced = useDebounceFn(() => {
  isHovered.value = true
  hasHoveredInSession.value = true
  clearTimer('hintDisplay')
}, 50)

const handleMouseLeaveDebounced = useDebounceFn(() => {
  isHovered.value = false
}, 50)

function handleMouseEnter(): void {
  handleMouseEnterDebounced()
}

function handleMouseLeave(): void {
  handleMouseLeaveDebounced()
}

onMounted(() => {
  showClickHint.value = false
  setTimer('observerSetup', setupIntersectionObserver, OBSERVER_SETUP_DELAY_MS)
  window.addEventListener('pagehide', handlePageHide)
})

onUnmounted(() => {
  window.removeEventListener('pagehide', handlePageHide)
  flushEncouragement(true)
  clearAllTimers()
  if (observerInstance) {
    observerInstance.disconnect()
    observerInstance = null
  }
})

function handlePageHide(): void {
  flushEncouragement(true)
}
</script>

<template>
  <div 
    class="stats-card clickable-area" 
    @click="encourageUpdate"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    ref="widgetRef"
  >
    <div class="stats-value">{{ formatNumber(internalAnimatedCount) }}<span class="plus-mark">+</span></div>
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
    
    <!-- 点击提示 - 根据条件显示 -->
    <transition name="hint-slide">
      <div class="click-hint-container" v-if="(showClickHint || (isHovered && !hasClickedInSession))">
        <div class="gradient-mask"></div>
        <div class="click-hint-content">
          <div class="arrow-up">^</div>
          <div class="hint-text">点击催更</div>
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
          'position': 'fixed',
          'left': `${msg.x}px`,
          'top': `${msg.y}px`,
          'transform': `translate(-50%, -50%) rotate(${msg.angle}deg) scale(${msg.scale})`,
          'opacity': msg.opacity,
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
  z-index: 10; /* 提高抽屉容器的z-index */
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
  z-index: 10; /* 提高抽屉的z-index */
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

/* 点击提示样式 */
.click-hint-container {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 45px; /* 增加高度 */
  pointer-events: none;
  overflow: hidden;
  z-index: 5; /* 确保z-index低于抽屉 */
}

.gradient-mask {
  position: absolute;
  left: -10px; /* 扩展宽度 */
  right: -10px;
  bottom: 0;
  height: 100%;
  background: linear-gradient(to top, var(--vp-c-bg) 40%, transparent 100%);
  opacity: 1; /* 增加不透明度 */
  z-index: -1;
}

.click-hint-content {
  position: absolute;
  left: 0;
  bottom: 0; /* 调整整个内容区域位置 */
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
}

.arrow-up {
  font-size: 1.2rem; /* 减小箭头大小 */
  color: var(--vp-c-text-2);
  font-weight: bold;
  animation: bounce 0.8s infinite alternate;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
  margin-bottom: -15px; /* 让箭头更靠近文字 */
}

.hint-text {
  font-size: 0.8rem; /* 减小文字大小 */
  color: var(--vp-c-text-2);
  font-weight: 500; /* 稍微加粗文字 */
  padding-bottom: 4px; /* 增加底部内边距 */
}

@keyframes bounce {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(-2px); /* 减少移动距离 */
  }
}

/* 抽屉滑动动画 */
.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: transform var(--lc-motion-duration-normal) var(--lc-motion-ease-emphasis);
}

.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateY(100%);
}

/* 点击提示滑动动画 */
.hint-slide-enter-active,
.hint-slide-leave-active {
  transition: all var(--lc-motion-duration-normal) var(--lc-motion-ease-emphasis);
}

.hint-slide-enter-from,
.hint-slide-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

/* 确保遮罩也有动画效果 */
.click-hint-container .gradient-mask {
  transition: opacity var(--lc-motion-duration-normal) var(--lc-motion-ease-standard);
}

.hint-slide-leave-active .gradient-mask {
  opacity: 0 !important;
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
  font-weight: 700; /* 增加字重 */
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  pointer-events: none;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3); /* 增强文字阴影 */
  white-space: nowrap;
  transition: opacity var(--lc-motion-duration-slow) var(--lc-motion-ease-standard), transform var(--lc-motion-duration-slow) var(--lc-motion-ease-spring); /* 使用更有弹性的贝塞尔曲线 */
  filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.4)); /* 增强阴影效果 */
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
  
  .click-hint-container {
    height: 38px; /* 移动端稍微矮一点 */
  }
  
  .arrow-up {
    font-size: 1.1rem;
  }
  
  .hint-text {
    font-size: 0.75rem;
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
  
  .click-hint-container {
    height: 36px; /* 小屏幕设备稍微矮一点 */
  }
  
  .arrow-up {
    font-size: 1.1rem;
  }
  
  .hint-text {
    font-size: 0.75rem;
    margin-top: -1px;
  }
}
</style> 
