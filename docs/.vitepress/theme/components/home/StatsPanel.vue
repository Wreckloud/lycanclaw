<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { withBase } from 'vitepress'
import { 
  useLocalStorage, 
  useThrottleFn,
  useBrowserLocation, 
  useWindowSize, 
  useIntersectionObserver,
  useEventListener
} from '@vueuse/core'
import EncourageWidget from './EncourageWidget.vue'

// 判断是否在浏览器环境中
const isBrowser = typeof window !== 'undefined'

// 统计数据
const stats = reactive({
  currentMonthPosts: 0,  // 本月更新的文章数
  thoughtsCount: 0,      // 随想文章数
  thoughtsWords: 0,      // 随想文章总字数
  // 动画相关
  animatedCurrentMonthPosts: 0,
  animatedThoughtsCount: 0,
  animatedThoughtsWords: 0,
})

// 添加可视性状态追踪
const isVisible = ref(false)
const containerRef = ref(null)
const animationTriggerRef = ref(null) // 专门用于动画触发的引用

// 使用VueUse的useWindowSize替代手动实现的窗口大小检测
const { width: windowWidth } = useWindowSize()
const isPcLayout = ref(windowWidth.value >= 960)

// 更新布局状态函数
const updateLayoutState = () => {
  isPcLayout.value = windowWidth.value >= 960
}

// 催更相关状态
const isLoading = ref(true)
const hasError = ref(false)
const animationStarted = ref(false)
// 使用VueUse的useLocalStorage替代手动存储逻辑
const encourageCount = useLocalStorage('lycanClawEncourageCount', 0)
const activeMessages = ref([])
let messageIdCounter = 0

// 使用VueUse的useThrottleFn为粒子效果添加节流
const createParticlesThrottled = useThrottleFn(createParticles, 200)

// 抽屉相关
const isDrawerVisible = ref(false)
const drawerMessage = ref('')
let drawerTimer = null

// 用于获取催更消息的函数
function getEncourageMessage(count) {
  const encourageMessages = {
    1: '催更成功！作者已收到通知~',
    2: '催更x2！作者表示压力山大...',
    3: '催更x3！作者开始掉头发了...',
    5: '催更x5！作者正在熬夜码字中...',
    10: '催更x10！作者已经趴下了...',
    20: '催更x20！再催作者要罢工了！',
    50: '催更x50！您是真爱粉无误！',
    100: '催更x100！恭喜解锁成就【催更狂魔】',
  }
  
  // 如果有精确匹配的消息，直接返回
  if (encourageMessages[count]) {
    return encourageMessages[count];
  }
  
  // 查找最接近但小于当前计数的消息
  const specificCounts = Object.keys(encourageMessages)
    .map(Number)
    .filter(n => n < count)
    .sort((a, b) => b - a);
  
  if (specificCounts.length > 0) {
    // 找到最接近的特定消息，并把计数显示为当前实际计数
    const closestCount = specificCounts[0];
    const baseMessage = encourageMessages[closestCount];
    // 替换消息中的数字
    return baseMessage.replace(`x${closestCount}`, `x${count}`);
  }
  
  // 默认消息
  return `催更x${count}！作者表示很焦虑...`;
}

// 显示简短的"催更x"消息在鼠标点击处
function showFloatingMessage(event, count) {
  const messageColors = [
    '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', 
    '#ec4899', '#ef4444', '#14b8a6', '#f97316'
  ];
  
  // 获取正确的点击坐标（处理触摸事件）
  const x = (event.touches && event.touches[0] ? event.touches[0].clientX : event.clientX);
  const y = (event.touches && event.touches[0] ? event.touches[0].clientY : event.clientY);
  
  // 随机参数
  const angle = Math.random() * 20 - 10;
  const offsetX = Math.random() * 40 - 20;
  const offsetY = Math.random() * 20 - 30;
  const color = messageColors[Math.floor(Math.random() * messageColors.length)];
  const id = messageIdCounter++;
  
  // 创建消息对象
  const displayMessage = count === 1 ? '催更' : `催更x${count}`;
  
  const messageObj = {
    id,
    x: x + offsetX,
    y: y + offsetY,
    message: displayMessage,
    angle,
    color,
    opacity: 1,
    scale: 0.8
  };
  
  // 添加到活跃消息列表
  activeMessages.value.push(messageObj);
  
  // 设置消失定时器
  setTimeout(() => {
    // 先执行淡出动画
    const msgIndex = activeMessages.value.findIndex(m => m.id === id);
    if (msgIndex !== -1) {
      activeMessages.value[msgIndex].opacity = 0;
      activeMessages.value[msgIndex].scale = 1.2;
    }
    
    // 然后在动画结束后移除消息
    setTimeout(() => {
      activeMessages.value = activeMessages.value.filter(m => m.id !== id);
    }, 500);
  }, 1500);
}

// 创建星星粒子效果
function createParticles(event) {
  const colors = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
  const particles = 30;
  
  // 创建粒子容器
  const particleContainer = document.createElement('div');
  particleContainer.className = 'particle-container';
  document.body.appendChild(particleContainer);
  
  // 获取正确的点击坐标（处理触摸事件）
  const x = (event.touches && event.touches[0] ? event.touches[0].clientX : event.clientX);
  const y = (event.touches && event.touches[0] ? event.touches[0].clientY : event.clientY);
  
  // 设置容器样式
  particleContainer.style.position = 'fixed';
  particleContainer.style.left = '0';
  particleContainer.style.top = '0';
  particleContainer.style.width = '100vw';
  particleContainer.style.height = '100vh';
  particleContainer.style.pointerEvents = 'none';
  particleContainer.style.zIndex = '9999';
  
  // 创建粒子
  for (let i = 0; i < particles; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    // 随机样式
    const size = Math.random() * 8 + 4;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const angle = Math.random() * Math.PI * 2;
    const velocity = Math.random() * 3 + 2;
    const lifetime = Math.random() * 1000 + 1000;
    
    // 设置星星形状
    particle.innerHTML = `<svg width="${size*2}" height="${size*2}" viewBox="0 0 24 24" fill="${color}">
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
    </svg>`;
    
    // 设置初始位置
    particle.style.position = 'absolute';
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    particle.style.transform = 'translate(-50%, -50%)';
    
    particleContainer.appendChild(particle);
    
    // 计算速度分量
    const vx = Math.cos(angle) * velocity;
    const vy = Math.sin(angle) * velocity - 1;
    
    // 粒子运动动画
    let startTime = null;
    
    function animateParticle(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      
      if (elapsed < lifetime) {
        // 计算新位置，加入重力效果
        const progress = elapsed / lifetime;
        const moveX = x + vx * elapsed * 0.1;
        const moveY = y + vy * elapsed * 0.1 + 0.5 * 9.8 * Math.pow(elapsed * 0.01, 2);
        
        // 更新位置、旋转和透明度
        particle.style.left = `${moveX}px`;
        particle.style.top = `${moveY}px`;
        particle.style.opacity = 1 - progress;
        particle.style.transform = `translate(-50%, -50%) rotate(${progress * 360}deg)`;
        
        requestAnimationFrame(animateParticle);
      } else {
        // 动画结束，移除粒子
        particle.remove();
        
        // 检查是否所有粒子都已移除，如果是则移除容器
        if (particleContainer.children.length === 0) {
          particleContainer.remove();
        }
      }
    }
    
    requestAnimationFrame(animateParticle);
  }
}

// 催更功能
const encourageUpdate = useThrottleFn((event) => {
  encourageCount.value++;
  
  // 使用配置获取消息
  const text = getEncourageMessage(encourageCount.value);
  
  // 显示浮动短消息
  showFloatingMessage(event, encourageCount.value);
  
  // 创建粒子效果
  createParticlesThrottled(event);
  
  // 更新抽屉消息
  drawerMessage.value = text;
  
  // 处理连续点击的情况
  if (isDrawerVisible.value && drawerTimer) {
    clearTimeout(drawerTimer);
  } else {
    isDrawerVisible.value = true;
  }
  
  // 设置自动关闭计时器
  drawerTimer = setTimeout(() => {
    isDrawerVisible.value = false;
  }, 3000);
}, 80);

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

// 格式化数字 - 智能单位显示
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

// 判断日期是否在当前月份
function isCurrentMonth(date) {
  const now = new Date()
  return date.getMonth() === now.getMonth() && 
         date.getFullYear() === now.getFullYear()
}

// 数字滚动动画
function animateNumbers() {
  if (!animationStarted.value) {
    animationStarted.value = true
    
    const duration = 2000
    const framesPerSecond = 60
    const totalFrames = duration / 1000 * framesPerSecond
    let currentFrame = 0
    
    const targetCurrentMonthPosts = stats.currentMonthPosts
    const targetThoughtsCount = stats.thoughtsCount
    const targetThoughtsWords = stats.thoughtsWords
    
    // 重置动画起始值
    stats.animatedCurrentMonthPosts = 0
    stats.animatedThoughtsCount = 0
    stats.animatedThoughtsWords = 0
    
    // 使用requestAnimationFrame实现平滑动画
    function animate() {
      currentFrame++
      const progress = currentFrame / totalFrames
      
      // 使用easeOutQuart缓动函数
      const easeProgress = 1 - Math.pow(1 - progress, 4)
      
      stats.animatedCurrentMonthPosts = Math.round(easeProgress * targetCurrentMonthPosts)
      stats.animatedThoughtsCount = Math.round(easeProgress * targetThoughtsCount)
      stats.animatedThoughtsWords = Math.round(easeProgress * targetThoughtsWords)
      
      if (currentFrame < totalFrames) {
        requestAnimationFrame(animate)
      } else {
        // 确保最终值精确
        stats.animatedCurrentMonthPosts = targetCurrentMonthPosts
        stats.animatedThoughtsCount = targetThoughtsCount
        stats.animatedThoughtsWords = targetThoughtsWords
      }
    }
    
    requestAnimationFrame(animate)
  }
}

// 使用VueUse的useIntersectionObserver
if (isBrowser) {
  useIntersectionObserver(
    animationTriggerRef,
    ([{ isIntersecting }]) => {
      if (isIntersecting) {
        isVisible.value = true
        if (!isLoading.value && !animationStarted.value) {
          animateNumbers()
        }
      }
    },
    { 
      threshold: 0.7,
      rootMargin: '0px 0px -15% 0px' 
    }
  )
}

// 加载数据
onMounted(async () => {
  if (!isBrowser) return
  
  try {
    // 自动更新布局状态
    useEventListener(window, 'resize', updateLayoutState)
    
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
    
    // 计算随想文章总字数
    let totalWords = 0
    thoughtsPosts.forEach(post => {
      totalWords += countWord(post.content || '')
    })
    
    // 初始化本月发布的文章数
    let currentMonthCount = 0
    
    // 尝试加载知识笔记统计数据
    try {
      const knowledgeResponse = await fetch(withBase('/knowledge-stats.json'))
      if (knowledgeResponse.ok) {
        const knowledgeStats = await knowledgeResponse.json()
        
        // 累加知识笔记的字数和本月文章数
        knowledgeStats.forEach(item => {
          if (item.wordCount) {
            totalWords += item.wordCount
          }
          
          if (item.date && isCurrentMonth(new Date(item.date))) {
            currentMonthCount++
          }
        })
      }
    } catch (knowledgeError) {
      // 忽略错误，不影响主要功能
    }
    
    // 计算本月发布的文章数
    thoughtsPosts.forEach(post => {
      if (post.frontmatter.date && isCurrentMonth(new Date(post.frontmatter.date))) {
        currentMonthCount++
      }
    })
    
    // 更新统计数据
    stats.currentMonthPosts = currentMonthCount
    stats.thoughtsCount = thoughtsPosts.length
    stats.thoughtsWords = totalWords
    
    isLoading.value = false
  } catch (error) {
    console.error('Error loading stats data:', error)
    hasError.value = true
    isLoading.value = false
  }
})

// 组件卸载时的清理函数
onBeforeUnmount(() => {
  if (drawerTimer) clearTimeout(drawerTimer)
})
</script>

<template>
  <div class="stats-panel" ref="containerRef" :class="{ 'is-visible': isVisible }">
    <!-- 添加一个专门用于触发动画的元素 -->
    <div ref="animationTriggerRef" class="animation-trigger"></div>
    
    <h2 class="section-title" :class="{ 'animate-in': isVisible }">数据统计</h2>
    
    <!-- 加载中状态 -->
    <div v-if="isLoading" class="loading">
      <p>加载中...</p>
    </div>
    
    <!-- 错误状态 -->
    <div v-else-if="hasError" class="error">
      <p>加载统计数据失败，请刷新页面重试</p>
    </div>
    
    <!-- 统计数据展示 -->
    <div v-else class="stats-container">
      <div class="stats-grid">
        <div class="encourage-widget-container" style="--anim-delay: 0.1s">
          <encourage-widget 
            :post-count="stats.currentMonthPosts" 
            :animated-count="stats.animatedCurrentMonthPosts"
          />
        </div>
        
        <div class="stats-card" :class="{ 'animate-in': isVisible }" style="--anim-delay: 0.2s">
          <div class="stats-value">{{ formatNumber(stats.animatedThoughtsCount) }}</div>
          <div class="stats-label">随想总数</div>
        </div>
        
        <div class="stats-card" :class="{ 'animate-in': isVisible }" style="--anim-delay: 0.3s">
          <div class="stats-value">{{ formatNumber(stats.animatedThoughtsWords) }}</div>
          <div class="stats-label">总字数</div>
        </div>
      </div>
      
      <!-- 浮动催更消息 -->
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
    </div>
  </div>
</template>

<style scoped>
.stats-panel {
  position: relative;
  overflow: hidden !important;
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

/* 添加动画样式 - 默认设置为不可见 */
.section-title,
.stats-card {
  opacity: 0;
  transform: translateY(20px);
}

/* 为EncourageWidget添加专门的容器样式 */
.encourage-widget-container {
  opacity: 0; /* 初始设置为不可见 */
  transform: translateY(20px); /* 与其他元素保持一致的初始位置 */
  transition: opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1),
              transform 0.8s cubic-bezier(0.22, 1, 0.36, 1); /* 使用与fadeInUp相同的动画曲线 */
  transition-delay: var(--anim-delay, 0s); /* 添加延迟支持 */
}

/* 当父组件可见时显示EncourageWidget */
.stats-panel.is-visible .encourage-widget-container,
.stats-container .animate-in ~ .encourage-widget-container {
  opacity: 1;
  transform: translateY(0);
}

/* 当元素可见时应用动画 */
.animate-in {
  animation: fadeInUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  animation-delay: var(--anim-delay, 0s);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section-title {
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  border-bottom: 1px solid var(--vp-c-divider);
  padding-bottom: 0.5rem;
}

.loading, .error {
  text-align: center;
  padding: 1rem 0;
  color: var(--vp-c-text-2);
  font-style: italic;
}

.error {
  color: var(--vp-c-danger);
}

.stats-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  overflow: hidden;
  position: relative;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  width: 100%;
  min-width: 0;
}

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
  cursor: default;
  position: relative;
  overflow: hidden;
}

.stats-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--vp-c-brand-1);
  margin-bottom: 0.5rem;
  white-space: nowrap;
  height: 2.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  text-overflow: ellipsis;
  user-select: none;
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
  top: 0;
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
  transform: translateY(100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  text-align: center;
  z-index: 5;
}

.drawer-visible {
  transform: translateY(0);
}

.drawer-content {
  padding: 0 0.5rem;
  font-size: 1.1rem;
  animation: pulse 1s infinite alternate;
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
  animation: pulse 1s infinite alternate;
  transition: opacity 0.5s ease, transform 0.5s ease;
}

@keyframes pulse {
  from {
    transform: translate(-50%, -50%) scale(1);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }
  to {
    transform: translate(-50%, -50%) scale(1.05);
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }
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
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.8rem;
  }
  
  .stats-card {
    padding: 1rem 0.5rem;
  }
  
  .stats-value {
    font-size: 1.5rem;
    height: 2rem;
  }
  
  .stats-label {
    font-size: 0.85rem;
    height: 1.3rem;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    gap: 0.5rem;
  }
  
  .stats-card {
    padding: 0.8rem 0.4rem;
  }
  
  .stats-value {
    font-size: 1.4rem;
    height: 1.8rem;
    margin-bottom: 0.3rem;
  }
  
  .stats-label {
    font-size: 0.8rem;
    height: 1.2rem;
  }
}
</style> 