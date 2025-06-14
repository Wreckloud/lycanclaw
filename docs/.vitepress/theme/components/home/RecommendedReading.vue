<script setup lang="ts">
import { ref, onMounted, computed, onBeforeUnmount, nextTick } from 'vue'
import { withBase } from 'vitepress'
import { useIntersectionObserver } from '@vueuse/core'
// 导入现有的API工具
import { getCommentCount } from '../../utils/commentApi'
import { getPageView } from '../../utils/pageViewApi'

// 类型定义
interface HotPost {
  url: string
  title: string
  description: string
  date: string
  tags?: string[]
  hotScore: number
  commentCount: number
  pageviews: number
}

// 判断是否在浏览器环境中
const isBrowser = typeof window !== 'undefined'

// 组件引用和状态
const sectionRef = ref<HTMLElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)
const carouselRef = ref<HTMLElement | null>(null)
const isVisible = ref(false)
const recommendedPosts = ref<HotPost[]>([])
const isLoading = ref(true)
const hasError = ref(false)

// 轮播状态
const currentIndex = ref(0)
const scrollPosition = ref(0)
const maxScroll = ref(0)
const autoplayInterval = ref<number | null>(null)

// 组件属性
const props = defineProps({
  // 自定义文章路径，优先使用
  customPaths: {
    type: Array as () => string[],
    default: () => []
  },
  // 最大显示文章数量
  maxPosts: {
    type: Number,
    default: 5
  },
  // 推荐策略：'hot'(热度), 'most-commented'(评论最多), 'most-viewed'(浏览最多), 'custom'(自定义)
  strategy: {
    type: String,
    default: 'hot'
  },
  // 自动轮播间隔（毫秒），0表示不自动轮播
  autoplaySpeed: {
    type: Number,
    default: 6000
  }
})

// 使用VueUse的useIntersectionObserver来检测元素是否进入视口
onMounted(() => {
  if (!isBrowser) return

  // 加载文章数据
  fetchPosts()

  // 设置滚动动画
  const { stop } = useIntersectionObserver(
    sectionRef,
    ([{ isIntersecting }]) => {
      // 确保动画只被触发一次
      if (isIntersecting && !isVisible.value) {
        isVisible.value = true
        stop()
      }
    },
    {
      threshold: 0.75, // 要求组件大部分在视口内才触发
      rootMargin: '0px 0px -10% 0px' // 适当调整触发区域
    }
  )
})

// 更新当前卡片索引
function updateCurrentIndex() {
  if (!carouselRef.value) return;
  
  const scrollLeft = carouselRef.value.scrollLeft;
  const cardWidth = carouselRef.value.clientWidth;
  
  // 计算当前索引
  currentIndex.value = Math.round(scrollLeft / cardWidth);
  
  // 更新滚动位置
  scrollPosition.value = scrollLeft;
  maxScroll.value = carouselRef.value.scrollWidth - carouselRef.value.clientWidth;
}

// 滚动到指定卡片
function scrollToCard(index: number) {
  if (!carouselRef.value || !recommendedPosts.value.length) return;
  
  // 确保索引在合法范围内
  const safeIndex = Math.max(0, Math.min(index, recommendedPosts.value.length - 1));
  
  // 计算目标滚动位置
  const cardWidth = carouselRef.value.clientWidth;
  const targetScroll = safeIndex * cardWidth;
  
  // 平滑滚动
  carouselRef.value.scrollTo({
    left: targetScroll,
    behavior: 'smooth'
  });
  
  // 更新当前索引
  currentIndex.value = safeIndex;
}

// 切换到前一个卡片
function prevCard() {
  scrollToCard(currentIndex.value - 1);
}

// 切换到后一个卡片
function nextCard() {
  scrollToCard(currentIndex.value + 1);
}

// 监听滚动事件
function handleScroll() {
  updateCurrentIndex();
}

// 开始自动轮播
function startAutoplay() {
  if (props.autoplaySpeed > 0 && recommendedPosts.value.length > 1) {
    autoplayInterval.value = window.setInterval(() => {
      const nextIndex = (currentIndex.value + 1) % recommendedPosts.value.length;
      scrollToCard(nextIndex);
    }, props.autoplaySpeed);
  }
}

// 停止自动轮播
function stopAutoplay() {
  if (autoplayInterval.value) {
    clearInterval(autoplayInterval.value);
    autoplayInterval.value = null;
  }
}

// 组件挂载后设置事件监听
onMounted(() => {
  if (!isBrowser) return;
  
  // 在数据加载完成后设置滚动监听
  fetchPosts().then(() => {
    nextTick(() => {
      if (carouselRef.value) {
        // 添加滚动事件监听
        carouselRef.value.addEventListener('scroll', handleScroll);
        
        // 初始化滚动位置状态
        updateCurrentIndex();
        
        // 启动自动轮播
        startAutoplay();
        
        // 鼠标进入时暂停自动轮播
        carouselRef.value.addEventListener('mouseenter', stopAutoplay);
        // 鼠标离开时恢复自动轮播
        carouselRef.value.addEventListener('mouseleave', startAutoplay);
      }
    });
  });
});

// 组件卸载前移除事件监听
onBeforeUnmount(() => {
  if (isBrowser) {
    // 清除自动轮播
    stopAutoplay();
    
    if (carouselRef.value) {
      carouselRef.value.removeEventListener('scroll', handleScroll);
      carouselRef.value.removeEventListener('mouseenter', stopAutoplay);
      carouselRef.value.removeEventListener('mouseleave', startAutoplay);
    }
  }
});

// 获取热门文章数据
async function fetchPosts() {
  if (!isBrowser) return
  
  try {
    // 使用自定义文章路径
    if (props.customPaths.length > 0 && props.strategy === 'custom') {
      // 从posts.json获取所有文章
      const postsResponse = await fetch(withBase('/posts.json'))
      if (!postsResponse.ok) {
        throw new Error('加载文章数据失败')
      }
      
      const allPosts = await postsResponse.json()
      
      // 过滤出自定义路径的文章
      const filteredPosts = allPosts.filter((post: any) => 
        props.customPaths.some(path => post.url.endsWith(path))
      )
      
      // 对于自定义文章，可以实时获取评论数和浏览量
      const postsWithStats = await Promise.all(
        filteredPosts.map(async (post: any) => {
          // 使用封装好的API获取评论数和浏览量
          const commentCount = await getCommentCount(post.url)
          const pageviews = await getPageView(post.url, 1)
          
          return {
            url: post.url,
            title: post.frontmatter.title,
            description: post.frontmatter.description || post.excerpt || '',
            date: post.frontmatter.date,
            tags: post.frontmatter.tags || [],
            hotScore: 0, // 自定义模式下不计算热度
            commentCount,
            pageviews
          }
        })
      )
      
      recommendedPosts.value = postsWithStats.slice(0, props.maxPosts)
    } else {
      // 从生成的热门文章数据中获取
      try {
        // 尝试从public目录获取
        const response = await fetch(withBase('/hot-posts.json'))
        if (!response.ok) {
          throw new Error('无法加载热门文章数据')
        }
        
        let posts = await response.json()
        
        // 根据不同策略排序
        switch (props.strategy) {
          case 'most-commented':
            posts.sort((a: HotPost, b: HotPost) => b.commentCount - a.commentCount)
            break
          case 'most-viewed':
            posts.sort((a: HotPost, b: HotPost) => b.pageviews - a.pageviews)
            break
          case 'hot':
          default:
            // 默认已按热度排序，无需重排
            break
        }
        
        recommendedPosts.value = posts.slice(0, props.maxPosts)
      } catch (error) {
        console.error('加载热门文章数据失败:', error)
        throw new Error('无法加载热门文章数据，请确保文件存在')
      }
    }
    
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

  // 处理可能带引号的日期字符串
  const cleanDateString = String(dateString).replace(/^['"]|['"]$/g, '')

  // 直接从日期字符串中提取年月日
  const match = cleanDateString.match(/(\d{4})-(\d{2})-(\d{2})/)

  if (match) {
    const month = match[2]
    const day = match[3]

    return `${month}月${day}日`
  }

  // 如果无法提取，则回退到Date对象
  const date = new Date(cleanDateString)
  if (isNaN(date.getTime())) return ''

  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${month}月${day}日`
}
</script>

<template>
  <div class="recommended-reading" ref="sectionRef">
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

                <!-- 如果是hot策略，显示热度 -->
                <span v-if="strategy === 'hot'" class="post-hot">
                  <span class="hot-icon">🔥</span>
                  <span class="hot-score">{{ Math.round(post.hotScore) }}热度</span>
                </span>

                <!-- 如果是most-commented策略，显示评论数 -->
                <span v-else-if="strategy === 'most-commented'" class="post-hot">
                  <span class="hot-icon">💬</span>
                  <span class="hot-score">{{ post.commentCount }}评论</span>
                </span>

                <!-- 如果是most-viewed策略，显示浏览量 -->
                <span v-else-if="strategy === 'most-viewed'" class="post-hot">
                  <span class="hot-icon">👀</span>
                  <span class="hot-score">{{ post.pageviews }}浏览</span>
                </span>

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
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
  scroll-behavior: smooth;
  padding-bottom: 0.5rem; /* 为分割线留出空间 */
}

/* 隐藏WebKit浏览器的滚动条 */
.carousel-container::-webkit-scrollbar {
  display: none;
}

/* 左右渐变遮罩 */
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

/* 文章卡片样式 */
.post-card {
  flex: 0 0 90%;
  width: 90%;
  padding: 1rem 1rem 1.2rem;
  margin-right: 1%;
  box-sizing: border-box;
  scroll-snap-align: center;
  border-bottom: 1px dashed var(--vp-c-divider);
  position: relative;
}

/* 添加顶部和底部实线 */
.post-card::before,
.post-card::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background-color: var(--vp-c-divider);
}

.post-card::before {
  top: 0;
}

.post-card::after {
  bottom: 0;
  /* 移除底部实线，改用边距解决重叠问题 */
  display: none;
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

/* 添加动画样式 - 默认设置为不可见 */
.section-title,
.carousel-wrapper,
.carousel-indicators {
  opacity: 0;
  transform: translateY(20px);
}

/* 当元素可见时应用动画 */
.animate-in {
  animation: fadeInUp 0.6s ease forwards;
  animation-delay: var(--anim-delay, 0s);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
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
}

.post-excerpt {
  margin: 0.8rem 0;
  color: var(--vp-c-text-2);
  font-size: 0.95rem;
  line-height: 1.6;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.post-meta {
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 0.2rem;
}

.post-date,
.post-hot,
.post-category {
  margin-right: 4px;
}

.post-separator {
  margin: 0 4px;
  opacity: 0.6;
}

.post-hot {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.hot-icon {
  font-size: 0.8rem;
}

.hot-score {
  font-weight: 400;
  color: var(--vp-c-text-3);
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
    width: 40px;
  }

  .post-card {
    flex: 0 0 95%;
    width: 95%;
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
    width: 30px;
  }

  .post-card {
    flex: 0 0 100%;
    width: 100%;
    padding: 0.8rem 0.5rem;
    border-bottom-width: 1px;
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