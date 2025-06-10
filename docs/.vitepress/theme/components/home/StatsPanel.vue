<script setup>
import { ref, onMounted, reactive, onBeforeUnmount } from 'vue'
import { withBase } from 'vitepress'

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

// 催更消息配置 - 可以根据需要自定义不同次数的消息
const encourageMessages = {
  1: '催更成功！作者已收到通知~', // 第一次催更
  2: '催更x2！作者表示压力山大...',
  3: '催更x3！作者开始掉头发了...',
  5: '催更x5！作者正在熬夜码字中...',
  10: '催更x10！作者已经趴下了...',
  20: '催更x20！再催作者要罢工了！',
  50: '催更x50！您是真爱粉无误！',
  100: '催更x100！恭喜解锁成就【催更狂魔】',
  // 可以根据需要添加更多特定次数的消息
}

const isLoading = ref(true)
const hasError = ref(false)
const animationStarted = ref(false)
const encourageCount = ref(0) // 催更计数器
const isDrawerVisible = ref(false) // 抽屉是否可见
const drawerMessage = ref('') // 抽屉中显示的消息
let drawerTimer = null // 抽屉自动关闭的计时器

// 获取催更消息
function getEncourageMessage(count) {
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

// 创建星星粒子效果
function createParticles(event, cardElement) {
  const colors = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
  const particles = 30; // 粒子数量
  
  // 创建粒子容器
  const particleContainer = document.createElement('div');
  particleContainer.className = 'particle-container';
  document.body.appendChild(particleContainer); // 添加到body而不是卡片
  
  // 获取点击位置相对于视口的坐标
  const x = event.clientX;
  const y = event.clientY;
  
  // 设置容器位置到点击位置
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
    const angle = Math.random() * Math.PI * 2; // 随机角度
    const velocity = Math.random() * 3 + 2;    // 随机速度
    const lifetime = Math.random() * 1000 + 1000; // 生命周期
    
    // 设置星星形状 - 使用CSS制作星星
    particle.innerHTML = `<svg width="${size*2}" height="${size*2}" viewBox="0 0 24 24" fill="${color}">
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
    </svg>`;
    
    // 设置初始位置和样式
    particle.style.position = 'absolute';
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    particle.style.transform = 'translate(-50%, -50%)';
    
    particleContainer.appendChild(particle);
    
    // 计算速度分量
    const vx = Math.cos(angle) * velocity;
    const vy = Math.sin(angle) * velocity - 1; // 添加向上的偏移
    
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
function encourageUpdate(event) {
  encourageCount.value++;
  
  // 使用配置获取消息
  const text = getEncourageMessage(encourageCount.value);
  
  // 更新抽屉消息
  drawerMessage.value = text;
  
  // 处理连续点击的情况
  if (isDrawerVisible.value) {
    // 如果抽屉已经可见，则更新消息但不重新开始动画
    // 清除自动关闭的计时器
    if (drawerTimer) {
      clearTimeout(drawerTimer);
    }
  } else {
    // 如果抽屉不可见，则显示抽屉
    isDrawerVisible.value = true;
  }
  
  // 创建粒子效果
  createParticles(event, event.currentTarget);
  
  // 设置自动关闭计时器
  drawerTimer = setTimeout(() => {
    isDrawerVisible.value = false;
  }, 3000);
  
  // 持久化保存催更次数（可选）
  try {
    if (isBrowser && window.localStorage) {
      localStorage.setItem('lycanClawEncourageCount', encourageCount.value);
    }
  } catch (e) {
    console.error('Failed to save encourage count to localStorage', e);
  }
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

// 格式化数字 - 智能单位显示
function formatNumber(num) {
  if (num === undefined || num === null) return '0'
  
  // 小于10000，使用逗号分隔
  if (num < 10000) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }
  // 小于1百万，使用k
  else if (num < 1000000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  }
  // 小于1亿，使用M
  else if (num < 100000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
  }
  // 大于1亿，使用亿
  else {
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
    
    const duration = 2000 // 动画持续时间（毫秒）
    const framesPerSecond = 90
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
      
      // 使用easeOutQuart缓动函数，比easeOutExpo慢一些
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

// 观察元素是否进入视口
function setupIntersectionObserver() {
  if (!isBrowser || !window.IntersectionObserver) return
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !animationStarted.value && !isLoading.value) {
        animateNumbers()
      }
    })
  }, { threshold: 0.2 }) // 当20%的元素可见时触发
  
  // 获取统计面板元素并观察它
  setTimeout(() => {
    const statsPanel = document.querySelector('.stats-panel')
    if (statsPanel) {
      observer.observe(statsPanel)
    }
  }, 100) // 短暂延迟确保DOM已渲染
  
  // 返回清理函数
  return () => {
    if (isBrowser) {
      const statsPanel = document.querySelector('.stats-panel')
      if (statsPanel && observer) {
        observer.unobserve(statsPanel)
        observer.disconnect()
      }
    }
  }
}

// 加载数据
let cleanup = null
onMounted(async () => {
  // 确保只在浏览器环境中执行
  if (!isBrowser) return
  
  try {
    // 尝试从localStorage读取催更次数
    try {
      if (window.localStorage) {
        const savedCount = localStorage.getItem('lycanClawEncourageCount');
        if (savedCount) {
          encourageCount.value = parseInt(savedCount, 10);
        }
      }
    } catch (e) {
      console.error('Failed to load encourage count from localStorage', e);
    }
    
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
    
    // 计算本月发布的文章数
    let currentMonthCount = 0
    thoughtsPosts.forEach(post => {
      if (post.frontmatter.date) {
        const postDate = new Date(post.frontmatter.date)
        if (isCurrentMonth(postDate)) {
          currentMonthCount++
        }
      }
    })
    
    // 更新统计数据
    stats.currentMonthPosts = currentMonthCount
    stats.thoughtsCount = thoughtsPosts.length
    stats.thoughtsWords = totalWords
    
    isLoading.value = false
    
    // 设置交叉观察器，当元素进入视口时启动动画
    cleanup = setupIntersectionObserver()
  } catch (error) {
    console.error('Error loading stats data:', error)
    hasError.value = true
    isLoading.value = false
  }
})

// 组件卸载时的清理函数
onBeforeUnmount(() => {
  if (cleanup) cleanup()
  if (drawerTimer) clearTimeout(drawerTimer)
})
</script>

<template>
  <div class="stats-panel">
    <h2 class="section-title">数据统计</h2>
    
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
        <div class="stats-card encourage-card" @click="encourageUpdate">
          <div class="stats-value">{{ formatNumber(stats.animatedCurrentMonthPosts) }}<span class="plus-mark">+</span></div>
          <div class="stats-label">本月更新</div>
          
          <!-- 抽屉组件 -->
          <div class="drawer-container">
            <div class="drawer" :class="{ 'drawer-visible': isDrawerVisible }">
              <div class="drawer-content">
                {{ drawerMessage }}
              </div>
            </div>
          </div>
        </div>
        
        <div class="stats-card">
          <div class="stats-value">{{ formatNumber(stats.animatedThoughtsCount) }}</div>
          <div class="stats-label">随想总数</div>
        </div>
        
        <div class="stats-card">
          <div class="stats-value">{{ formatNumber(stats.animatedThoughtsWords) }}</div>
          <div class="stats-label">总字数</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stats-panel {
  margin: 2rem 0;
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

.encourage-card {
  cursor: pointer;
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
  top: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none; /* 允许点击穿透到卡片 */
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

@keyframes pulse {
  from {
    transform: scale(1);
    opacity: 0.9;
  }
  to {
    transform: scale(1.05);
    opacity: 1;
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
  
  .plus-mark {
    font-size: 1.2rem;
    top: -0.15rem;
  }
  
  .stats-label {
    font-size: 0.85rem;
    height: 1.3rem;
  }
  
  .drawer-content {
    font-size: 1rem;
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
  
  .plus-mark {
    font-size: 1rem;
    top: -0.1rem;
  }
  
  .stats-label {
    font-size: 0.8rem;
    height: 1.2rem;
  }
  
  .drawer-content {
    font-size: 0.9rem;
  }
}
</style> 