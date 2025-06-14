<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { withBase } from 'vitepress'
import { useIntersectionObserver } from '@vueuse/core'

// 类型定义
interface Post {
  url: string
  relativePath: string
  frontmatter: {
    title: string
    date: string
    publish: boolean
    description?: string
    tags?: string[]
  }
  content: string
  excerpt?: string
}

// 判断是否在浏览器环境中
const isBrowser = typeof window !== 'undefined'

// 组件引用和状态
const containerRef = ref<HTMLElement | null>(null)
const postsRef = ref<HTMLElement | null>(null) // 专门用于动画触发的引用
const isVisible = ref(false)
const recentPosts = ref<Post[]>([])
const isLoading = ref(true)
const hasError = ref(false)
const maxPosts = 6 // 显示最多6篇最新文章

// 使用VueUse的useIntersectionObserver来检测元素是否进入视口
onMounted(() => {
  if (!isBrowser) return

  // 加载文章数据
  fetchPosts()
  
  // 设置滚动动画 - 使用专门的postsRef元素确保独立触发
  const { stop } = useIntersectionObserver(
    postsRef,
    ([{ isIntersecting }]) => {
      if (isIntersecting) {
        // 直接触发动画，不再检查元素位置
        isVisible.value = true
        stop() // 只触发一次动画
      }
    },
    { 
      threshold: 0.005, // 降低阈值至1%，几乎一出现就触发
      rootMargin: '0px 0px -1% 0px' // 增大底部边距，更早触发
    }
  )
})

// 加载文章数据
async function fetchPosts() {
  if (!isBrowser) return
  
  try {
    // 从生成的JSON文件获取数据
    const response = await fetch(withBase('/posts.json'))
    if (!response.ok) {
      throw new Error('加载文章数据失败')
    }
    
    const posts = await response.json()
    
    // 严格过滤，只显示publish为true的随想文章
    const filteredPosts = posts.filter((post: Post) => 
      post.frontmatter.publish === true && 
      post.relativePath.startsWith('thoughts/') &&
      post.relativePath !== 'thoughts/index.md' &&
      post.relativePath !== 'thoughts/tags.md'
    )
    
    // 按日期排序，取最新的几篇
    recentPosts.value = filteredPosts
      .sort((a: Post, b: Post) => new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime())
      .slice(0, maxPosts)
    
    isLoading.value = false
  } catch (error) {
    console.error('Error loading posts:', error)
    hasError.value = true
    isLoading.value = false
  }
}

// 内联实现countWord函数
function countWord(data: string): number {
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

// 计算阅读时间
function calculateReadTime(content: string): number {
  const wordCount = countWord(content || '')
  return Math.ceil(wordCount / 300)
}

// 获取文章摘要，优先使用description
function getPostExcerpt(post: Post): string {
  // 优先使用frontmatter中的description
  if (post.frontmatter.description) {
    return post.frontmatter.description
  }
  // 其次使用通过<!-- more -->分隔的摘要
  return post.excerpt || ''
}
</script>

<template>
  <div class="recent-posts" ref="containerRef">
    <h2 class="section-title" :class="{ 'animate-in': isVisible }">近期动态</h2>
    
    <!-- 加载中状态 -->
    <div v-if="isLoading" class="loading">
      <p>加载中...</p>
    </div>
    
    <!-- 错误状态 -->
    <div v-else-if="hasError" class="error">
      <p>加载文章失败，请刷新页面重试</p>
    </div>
    
    <!-- 文章列表 -->
    <template v-else>
      <div ref="postsRef" class="posts-container">
        <div 
          v-for="(post, index) in recentPosts" 
          :key="post.url" 
          class="post-item"
          :class="{ 'animate-in': isVisible }"
          :style="{ '--anim-delay': `${index * 0.1 + 0.1}s` }"
        >
          <div class="post-content">
            <h3 class="post-item-title">
              <a :href="withBase(post.url)" class="title-link">{{ post.frontmatter.title }}</a>
            </h3>
            
            <!-- 文章摘要：优先使用description -->
            <p class="post-excerpt">{{ getPostExcerpt(post) }}</p>
            
            <div class="post-meta">
              <span class="post-date">{{ formatDate(post.frontmatter.date) }}</span>
              <span class="post-separator">/</span>
              <span class="post-read-time">约{{ calculateReadTime(post.content) }}分钟读完</span>
              <span class="post-separator">/</span>
              <span class="post-category">随想</span>
              <span v-if="post.frontmatter.tags?.length" class="post-tags">
                <span 
                  v-for="(tag, index) in post.frontmatter.tags" 
                  :key="index"
                  class="post-tag"
                >
                  #{{ tag }}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 无文章提示 -->
      <div v-if="recentPosts.length === 0" class="no-posts">
        <p>暂无文章</p>
      </div>
      
      <!-- 查看更多链接 -->
      <div v-else class="view-more" :class="{ 'animate-in': isVisible }" style="--anim-delay: 0.7s">
        <a href="/thoughts/" class="view-more-link">查看更多 →</a>
      </div>
    </template>
  </div>
</template>

<style scoped>
.recent-posts {
  overflow: hidden !important;
}

/* 文章列表容器 - 用于交叉观察 */
.posts-container {
  position: relative;
  width: 100%;
}

/* 添加动画样式 - 默认设置为不可见 */
.section-title,
.post-item,
.view-more {
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
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  border-bottom: 1px solid var(--vp-c-divider);
  padding-bottom: 0.5rem;
}

.post-item {
  margin-bottom: 1.5rem;
  border-bottom: 1px dashed var(--vp-c-divider);
  padding-bottom: 1rem;
}

.post-item:last-child {
  margin-bottom: 0.5rem;
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
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.post-date, .post-read-time, .post-category {
  margin-right: 4px;
}

.post-separator {
  margin: 0 4px;
}

.post-tags {
  display: flex;
  flex-wrap: wrap;
  margin-left: 4px;
}

.post-tag {
  margin-right: 8px;
  color: var(--vp-c-brand-1);
}

.loading, .error, .no-posts {
  text-align: center;
  padding: 1rem 0;
  color: var(--vp-c-text-2);
  font-style: italic;
}

.error {
  color: var(--vp-c-danger);
}

.view-more {
  text-align: right;
  margin-top: 1rem;
}

.view-more-link {
  display: inline-block;
  color: var(--vp-c-brand-1);
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 500;
  transition: color 0.2s;
}

.view-more-link:hover {
  color: var(--vp-c-brand-2);
}

/* 移动端适配 */
@media (max-width: 959px) {
  
  .section-title {
    font-size: 1.5rem;
    margin-bottom: 1.2rem;
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
  .recent-posts {
    /* margin: 1rem 0; 移除此行 */
  }
  
  .section-title {
    font-size: 1.3rem;
    margin-bottom: 1rem;
    padding-bottom: 0.4rem;
  }
  
  .post-item {
    margin-bottom: 1.2rem;
    padding-bottom: 0.8rem;
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
  
  .view-more-link {
    font-size: 0.9rem;
  }
}
</style> 