<script setup lang="ts">
import { ref, onMounted, computed, onBeforeUnmount, nextTick } from 'vue'
import { withBase } from 'vitepress'
import { useIntersectionObserver } from '@vueuse/core'
// 导入推荐文章配置
import { recommendedPosts as configuredPostsPaths } from '../../../config/recommended-posts.js'

// 类型定义
interface Post {
  url: string
  title: string
  description: string
  date: string
  tags: string[]
}

// 判断是否在浏览器环境中
const isBrowser = typeof window !== 'undefined'

// 组件引用和状态
const sectionRef = ref<HTMLElement | null>(null)
const carouselRef = ref<HTMLElement | null>(null)
const animationTriggerRef = ref<HTMLElement | null>(null) // 专门用于动画触发
const isVisible = ref(false)
const recommendedPosts = ref<Post[]>([])
const isLoading = ref(true)
const hasError = ref(false)

// 判断是否为PC布局
const isPcLayout = ref(isBrowser ? window.innerWidth >= 960 : true)

// 更新布局状态函数
const updateLayoutState = () => {
  isPcLayout.value = window.innerWidth >= 960
}

// 轮播状态
const currentIndex = ref(0)
const scrollPosition = ref(0)
const maxScroll = ref(0)
const autoplayInterval = ref<number | null>(null)

// 组件属性
const props = defineProps({
  // 最大显示文章数量
  maxPosts: {
    type: Number,
    default: 5
  },
  // 自动轮播间隔（毫秒），0表示不自动轮播
  autoplaySpeed: {
    type: Number,
    default: 6000
  }
})

// 处理全局动画触发
const handleAnimationTrigger = () => {
  // 移除此方法的实现，不再需要
}

// 事件清理函数
// let animationTriggerListener: (() => void) | null = null
let resizeListener: (() => void) | null = null
let observerStop: (() => void) | null = null

// 使用VueUse的useIntersectionObserver来检测元素是否进入视口
onMounted(() => {
  if (!isBrowser) return

  // 初始化布局状态
  updateLayoutState()
  
  // 监听窗口大小变化
  resizeListener = () => {
    updateLayoutState()
  }
  window.addEventListener('resize', resizeListener)
  
  // 移除动画触发事件监听
  // animationTriggerListener = () => {
  //   handleAnimationTrigger()
  // }
  // document.addEventListener('triggerAnimation', animationTriggerListener)

  // 加载文章数据
  fetchPosts()

  // 设置滚动动画
  const { stop } = useIntersectionObserver(
    animationTriggerRef,
    ([{ isIntersecting }]) => {
      // 确保动画只被触发一次
      if (isIntersecting && !isVisible.value) {
        isVisible.value = true
        stop()
      }
    },
    {
      threshold: 0.7,
      rootMargin: '0px 0px -15% 0px'
    }
  )
  observerStop = stop
})

// 更新当前卡片索引
function updateCurrentIndex() {
  if (!carouselRef.value) return;
  
  const scrollLeft = carouselRef.value.scrollLeft;
  const cardWidth = carouselRef.value.clientWidth;
  
  currentIndex.value = Math.round(scrollLeft / cardWidth);
  scrollPosition.value = scrollLeft;
  maxScroll.value = carouselRef.value.scrollWidth - carouselRef.value.clientWidth;
}

// 滚动到指定卡片
function scrollToCard(index: number) {
  if (!carouselRef.value || !recommendedPosts.value.length) return;
  
  const safeIndex = Math.max(0, Math.min(index, recommendedPosts.value.length - 1));
  const cardWidth = carouselRef.value.clientWidth;
  const targetScroll = safeIndex * cardWidth;
  
  carouselRef.value.scrollTo({
    left: targetScroll,
    behavior: 'smooth'
  });
  
  currentIndex.value = safeIndex;
}

// 切换到前一个或后一个卡片
function prevCard() {
  scrollToCard(currentIndex.value - 1);
}

function nextCard() {
  scrollToCard(currentIndex.value + 1);
}

// 监听滚动事件
function handleScroll() {
  updateCurrentIndex();
}

// 控制自动轮播
function startAutoplay() {
  if (props.autoplaySpeed > 0 && recommendedPosts.value.length > 1) {
    autoplayInterval.value = window.setInterval(() => {
      const nextIndex = (currentIndex.value + 1) % recommendedPosts.value.length;
      scrollToCard(nextIndex);
    }, props.autoplaySpeed);
  }
}

function stopAutoplay() {
  if (autoplayInterval.value) {
    clearInterval(autoplayInterval.value);
    autoplayInterval.value = null;
  }
}

// 事件监听设置
onMounted(() => {
  if (!isBrowser) return;
  
  fetchPosts().then(() => {
    nextTick(() => {
      if (carouselRef.value) {
        carouselRef.value.addEventListener('scroll', handleScroll);
        updateCurrentIndex();
        startAutoplay();
        
        carouselRef.value.addEventListener('mouseenter', stopAutoplay);
        carouselRef.value.addEventListener('mouseleave', startAutoplay);
      }
    });
  });
});

// 组件卸载前移除事件监听
onBeforeUnmount(() => {
  if (isBrowser) {
    stopAutoplay();
    
    if (carouselRef.value) {
      carouselRef.value.removeEventListener('scroll', handleScroll);
      carouselRef.value.removeEventListener('mouseenter', stopAutoplay);
      carouselRef.value.removeEventListener('mouseleave', startAutoplay);
    }
    
    // 清理动画和布局相关的监听器
    if (resizeListener) {
      window.removeEventListener('resize', resizeListener)
    }
    // 移除动画触发事件监听
    // if (animationTriggerListener) {
    //   document.removeEventListener('triggerAnimation', animationTriggerListener)
    // }
    if (observerStop) {
      observerStop()
    }
  }
});

// 获取推荐文章数据
async function fetchPosts() {
  if (!isBrowser) return
  
  try {
    isLoading.value = true
    hasError.value = false
    
    // 尝试从预生成的recommended-posts.json获取数据
    try {
      const response = await fetch(withBase('/recommended-posts.json'))
      if (response.ok) {
        recommendedPosts.value = await response.json()
        isLoading.value = false
        return
      }
    } catch (e) {
      // 如果预生成数据不存在，则从posts.json获取
    }
    
    // 从posts.json获取所有文章
    const postsResponse = await fetch(withBase('/posts.json'))
    if (!postsResponse.ok) {
      throw new Error('加载文章数据失败')
    }
    
    const allPosts = await postsResponse.json()
    
    // 使用配置文件中的推荐文章
    const posts = configuredPostsPaths
      .map(postPath => {
        const originalPost = allPosts.find(post => post.url === postPath)
        if (!originalPost) return null
        
        return {
          url: originalPost.url,
          title: originalPost.frontmatter.title,
          description: originalPost.frontmatter.description || originalPost.excerpt || '',
          date: originalPost.frontmatter.date,
          tags: originalPost.frontmatter.tags || []
        }
      })
      .filter(post => post !== null)
    
    recommendedPosts.value = posts.slice(0, props.maxPosts)
    isLoading.value = false
  } catch (error) {
    console.error('Error loading recommended posts:', error)
    hasError.value = true
    isLoading.value = false
  }
}

// 格式化日期
function formatDate(dateString: string): string {
  if (!dateString) return ''

  const cleanDateString = String(dateString).replace(/^['"]|['"]$/g, '')
  const match = cleanDateString.match(/(\d{4})-(\d{2})-(\d{2})/)

  if (match) {
    const month = match[2]
    const day = match[3]

    return `${month}月${day}日`
  }

  const date = new Date(cleanDateString)
  if (isNaN(date.getTime())) return ''

  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${month}月${day}日`
}
</script>

<template>
  <div class="recommended-reading" ref="sectionRef">
    <!-- 添加专门用于触发动画的元素 -->
    <div ref="animationTriggerRef" class="animation-trigger"></div>

    <h2 class="section-title" :class="{ 'animate-in': isVisible }">推荐阅读</h2>

    <!-- 加载中状态 -->
    <div v-if="isLoading" class="loading">
      <p>加载中...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="hasError" class="error">
      <p>加载推荐文章失败，请刷新页面重试</p>
    </div>

    <!-- 轮播卡片 -->
    <template v-else>
      <div class="carousel-wrapper" :class="{ 'animate-in': isVisible }" style="--anim-delay: 0.15s">
        <!-- 左侧渐变遮罩 -->
        <div class="fade-mask left" :style="{ opacity: scrollPosition > 0 ? 1 : 0 }"></div>
        
        <!-- 轮播容器 -->
        <div class="carousel-container" ref="carouselRef" @scroll="handleScroll">
          <div class="padding-spacer"></div>
          <div 
            v-for="post in recommendedPosts" 
            :key="post.url" 
            class="post-card"
          >
            <div class="post-content">
              <h3 class="post-item-title">
                <a :href="withBase(post.url)" class="title-link">{{ post.title }}</a>
              </h3>

              <!-- 文章摘要 -->
              <p class="post-excerpt">{{ post.description }}</p>

              <div class="post-meta">
                <span class="post-date">{{ formatDate(post.date) }}</span>
                <span class="post-separator">/</span>
                <span class="post-category">推荐</span>

                <!-- 标签 -->
                <span v-if="post.tags?.length" class="post-tags">
                  <span v-for="(tag, tagIndex) in post.tags" :key="tagIndex" class="post-tag">
                    #{{ tag }}
                  </span>
                </span>
              </div>
            </div>
          </div>
          <div class="padding-spacer"></div>
        </div>
        
        <!-- 右侧渐变遮罩 -->
        <div class="fade-mask right" :style="{ opacity: scrollPosition < maxScroll - 10 ? 1 : 0 }"></div>
      </div>

      <!-- 卡片指示器 -->
      <div class="carousel-indicators" :class="{ 'animate-in': isVisible }" style="--anim-delay: 0.3s">
        <button 
          v-for="(post, index) in recommendedPosts" 
          :key="'indicator-' + index"
          class="indicator-dot"
          :class="{ 'active': index === currentIndex }"
          @click="scrollToCard(index)"
          :aria-label="`查看推荐文章 ${index + 1}`"
        ></button>
      </div>
      
      <!-- 无文章提示 -->
      <div v-if="recommendedPosts.length === 0" class="no-posts">
        <p>暂无推荐文章</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.recommended-reading {
  overflow: hidden !important;
  position: relative;
  min-height: 100px;
}

/* 添加动画触发器样式 */
.animation-trigger {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: -1;
}

/* 轮播容器样式 */
.carousel-wrapper {
  position: relative;
  width: 100%;
  overflow: hidden;
  margin-top: 1rem;
  padding-bottom: 0.5rem;
}

.carousel-container {
  display: flex;
  width: 100%;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  -ms-overflow-style: none;
  scroll-behavior: smooth;
  padding-bottom: 0.5rem;
}

/* 隐藏WebKit浏览器的滚动条 */
.carousel-container::-webkit-scrollbar {
  display: none;
}

/* 左右两端的填充空白，确保首尾卡片显示在中间 */
.padding-spacer {
  flex: 0 0 calc((100% - 70%) / 2);
  min-width: calc((100% - 70%) / 2);
}

/* 左右渐变遮罩 */
.fade-mask {
  position: absolute;
  top: 0;
  height: 100%;
  width: 80px;
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

/* 文章卡片样式 */
.post-card {
  flex: 0 0 70%;
  width: 70%;
  padding: 1rem 1.2rem 1.2rem;
  margin: 0 0.5rem;
  box-sizing: border-box;
  scroll-snap-align: center;
  border-bottom: none;
  position: relative;
  margin-bottom: 0.5rem;
}

/* 只保留虚线分隔 */
.post-card::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 1px;
  border-bottom: 1px dashed var(--vp-c-divider);
  opacity: 0.8;
}

/* 底部指示器 */
.carousel-indicators {
  height: 10px;
  display: flex;
  justify-content: center;
  gap: 8px;
}

.indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--vp-c-text-3);
  opacity: 0.5;
  cursor: pointer;
  border: none;
  padding: 0;
  transition: all 0.3s ease;
}

.indicator-dot.active {
  opacity: 1;
  background-color: var(--vp-c-brand);
  transform: scale(1.2);
}

/* 动画样式 */
.section-title,
.carousel-wrapper,
.carousel-indicators {
  opacity: 0;
  transform: translateY(20px);
}

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
  margin-bottom: 0.5rem;
  font-size: 1.8rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  border-bottom: 1px solid var(--vp-c-divider);
  padding-bottom: 0.5rem;
}

.post-content {
  display: block;
  color: var(--vp-c-text-1);
}

.title-link {
  display: inline-block;
  text-decoration: none;
  color: var(--vp-c-text-1);
  transition: color 0.2s;
  font-weight: 700;
}

.title-link:hover {
  text-decoration: underline;
  color: var(--vp-c-brand-1);
}

.post-item-title {
  font-size: 1.2rem;
  margin: 0;
  margin-bottom: 0.5rem;
  color: var(--vp-c-text-1);
  font-weight: 700;
  white-space: normal;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.5;
}

.post-excerpt {
  margin: 0.8rem 0;
  color: var(--vp-c-text-2);
  font-size: 0.95rem;
  line-height: 1.6;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  max-height: 4.8rem;
}

.post-meta {
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 0.5rem;
  opacity: 0.8;
}

.post-date,
.post-category {
  margin-right: 3px;
}

.post-separator {
  margin: 0 3px;
  opacity: 0.5;
}

.post-tags {
  display: flex;
  flex-wrap: wrap;
  margin-left: 4px;
}

.post-tag {
  margin-right: 8px;
  color: var(--vp-c-brand-2);
}

.loading,
.error,
.no-posts {
  text-align: center;
  padding: 1rem 0;
  color: var(--vp-c-text-2);
  font-style: italic;
}

.error {
  color: var(--vp-c-danger);
}

/* 移动端适配 */
@media (max-width: 959px) {
  .section-title {
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }
  
  .fade-mask {
    width: 60px;
  }

  .post-card {
    flex: 0 0 80%;
    width: 80%;
  }
  
  .padding-spacer {
    flex: 0 0 calc((100% - 80%) / 2);
    min-width: calc((100% - 80%) / 2);
  }
  
  .post-item-title {
    font-size: 1.1rem;
  }

  .post-excerpt {
    font-size: 0.9rem;
    margin: 0.6rem 0;
  }

  .post-meta {
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .section-title {
    font-size: 1.3rem;
    margin-bottom: 0.8rem;
    padding-bottom: 0.4rem;
  }

  .fade-mask {
    width: 40px;
  }

  .post-card {
    flex: 0 0 90%;
    width: 90%;
    padding: 0.8rem 0.7rem;
  }
  
  .padding-spacer {
    flex: 0 0 calc((100% - 90%) / 2);
    min-width: calc((100% - 90%) / 2);
  }

  .post-item-title {
    font-size: 1rem;
  }

  .post-excerpt {
    font-size: 0.85rem;
    margin: 0.5rem 0;
  }

  .post-meta {
    font-size: 0.8rem;
  }

  .post-tag {
    margin-right: 6px;
  }
}
</style>