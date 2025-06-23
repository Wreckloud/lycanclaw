<script setup>
import { ref, onMounted, computed } from 'vue'
import { useData } from 'vitepress'
import { withBase } from 'vitepress'
import { useIntersectionObserver } from '@vueuse/core'

// 判断是否在浏览器环境中
const isBrowser = typeof window !== 'undefined'

// 添加动画相关状态
const sectionRef = ref(null)
const animationTriggerRef = ref(null) // 添加专门的动画触发引用
const isVisible = ref(false)

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

// 过滤出thoughts目录下的文章，且publish为true的文章
const thoughtsPosts = ref([])
const isLoading = ref(true)
const hasError = ref(false)

// 分页相关
const currentPage = ref(1)
const postsPerPage = 7 // 每页显示7篇文章
const totalPages = computed(() => Math.ceil(thoughtsPosts.value.length / postsPerPage))
const paginatedPosts = computed(() => {
  const startIndex = (currentPage.value - 1) * postsPerPage
  const endIndex = startIndex + postsPerPage
  return thoughtsPosts.value.slice(startIndex, endIndex)
})

// 页码导航
const pageNumbers = computed(() => {
  const pages = []
  const maxVisiblePages = 5 // 最多显示5个页码
  
  if (totalPages.value <= maxVisiblePages) {
    // 如果总页数少于最大显示页码，则显示所有页码
    return Array.from({ length: totalPages.value }, (_, i) => i + 1)
  }
  
  // 总是显示第一页
  pages.push(1)
  
  // 计算中间页码的起始和结束
  let start = Math.max(2, currentPage.value - 1)
  let end = Math.min(totalPages.value - 1, currentPage.value + 1)
  
  // 如果当前页靠近开始，多显示几个后面的页码
  if (currentPage.value <= 3) {
    end = Math.min(totalPages.value - 1, 4)
  }
  
  // 如果当前页靠近结束，多显示几个前面的页码
  if (currentPage.value >= totalPages.value - 2) {
    start = Math.max(2, totalPages.value - 3)
  }
  
  // 如果第一页和起始页之间有间隔，添加省略号
  if (start > 2) {
    pages.push('...')
  }
  
  // 添加中间页码
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  // 如果结束页和最后一页之间有间隔，添加省略号
  if (end < totalPages.value - 1) {
    pages.push('...')
  }
  
  // 总是显示最后一页
  pages.push(totalPages.value)
  
  return pages
})

// 页面导航函数
function goToPage(page) {
  if (typeof page === 'number' && page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    // 滚动到页面顶部
    if (isBrowser) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    
    // 重置动画状态，使新页面的文章也能有动画效果
    isVisible.value = false
    setTimeout(() => {
      isVisible.value = true
    }, 100)
  }
}

onMounted(async () => {
  // 确保只在浏览器环境中执行
  if (!isBrowser) return
  
  try {
    // 从生成的JSON文件获取数据，使用绝对路径
    const response = await fetch(withBase('/posts.json'))
    if (!response.ok) {
      throw new Error('Failed to fetch posts data')
    }
    
    const posts = await response.json()
    
    // 严格过滤，只显示publish为true的随想文章，排除草稿文件
    thoughtsPosts.value = posts.filter(post => 
      post.frontmatter.publish === true && 
      post.relativePath.startsWith('thoughts/') &&
      post.relativePath !== 'thoughts/index.md' &&
      post.relativePath !== 'thoughts/tags.md'
    )
    
    // 验证文章URL是否有效 - 仅对非目录路径进行检查
    if (isBrowser && 
        window.location.pathname.includes('/thoughts/') && 
        window.location.pathname !== '/thoughts/' && // 排除根目录
        !window.location.pathname.endsWith('/index.html') && // 排除索引页
        !thoughtsPosts.value.some(post => post.url === window.location.pathname)) {
      // 只在开发环境下显示警告
      if (process.env.NODE_ENV === 'development') {
        console.debug('文章未在列表中找到:', window.location.pathname)
      }
    }
    
    isLoading.value = false
    
    // 使用useIntersectionObserver来触发动画
    if (animationTriggerRef.value) {
      const { stop } = useIntersectionObserver(
        animationTriggerRef,
        ([{ isIntersecting }]) => {
          if (isIntersecting) {
            isVisible.value = true
            stop()  // 只触发一次
          }
        }, 
        { 
          threshold: 0.1,  // 降低阈值，让元素更早触发
          rootMargin: '0px 0px -10% 0px'  // 增大底部边距，提前触发
        }
      )
    }
  } catch (error) {
    console.error('Error loading posts:', error)
    hasError.value = true
    isLoading.value = false
  }
})

// 格式化日期
function formatDate(dateString) {
  if (!dateString) return ''
  
  // 处理可能带引号的日期字符串
  const cleanDateString = String(dateString).replace(/^['"]|['"]$/g, '')
  
  // 直接从日期字符串中提取年月日
  const match = cleanDateString.match(/(\d{4})-(\d{2})-(\d{2})/)
  
  if (match) {
    const year = match[1]
    const month = match[2]
    const day = match[3]
    
    return `${year}年${month}月${day}日`
  }
  
  // 如果无法提取，则回退到Date对象
  const date = new Date(cleanDateString)
  if (isNaN(date.getTime())) return ''
  
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  return `${year}年${month}月${day}日`
}

// 计算阅读时间
function calculateReadTime(content) {
  const wordCount = countWord(content || '')
  return Math.ceil(wordCount / 300)
}

// 获取当前主题模式
const { isDark } = useData()

// 获取文章摘要，优先使用description
function getPostExcerpt(post) {
  // 优先使用frontmatter中的description
  if (post.frontmatter.description) {
    return post.frontmatter.description
  }
  // 其次使用通过<!-- more -->分隔的摘要
  return post.excerpt || ''
}
</script>

<template>
  <div class="post-list" ref="sectionRef">
    <!-- 添加专门用于动画触发的元素 -->
    <div ref="animationTriggerRef" class="animation-trigger"></div>
    
    <!-- 加载中状态：只在组件可见且正在加载时显示 -->
    <div v-if="isLoading && isVisible" class="loading">
      <p>加载中...</p>
    </div>
    
    <!-- 错误状态：只在组件可见且有错误时显示 -->
    <div v-else-if="hasError && isVisible" class="error">
      <p>加载文章失败，请刷新页面重试</p>
    </div>
    
    <!-- 文章列表：只有在不加载或组件可见时显示 -->
    <template v-else-if="!isLoading || isVisible">
      <div 
        v-for="(post, index) in paginatedPosts" 
        :key="post.url" 
        class="post-item"
        :class="{ 'post-item-animate': isVisible }"
        :style="{ '--post-delay': `${index * 0.25 + 0.1}s` }"
      >
        <div class="post-content">
          <h2 class="post-item-title">
            <a :href="withBase(post.url)" class="title-link">{{ post.frontmatter.title }}</a>
          </h2>
          
          <!-- 文章摘要：优先使用description -->
          <p class="post-excerpt">{{ getPostExcerpt(post) }}</p>
          
          <div class="post-meta">
            <span class="post-date">{{ formatDate(post.frontmatter.date) }}</span>
            <span class="post-separator">/</span>
            <span class="post-read-time">约{{ calculateReadTime(post.content) }}分钟读完</span>
            <span class="post-separator">/</span>
            <span class="post-category">随想</span>
            <span v-if="post.frontmatter.tags && post.frontmatter.tags.length" class="post-tags">
              <template v-for="(tag, index) in post.frontmatter.tags" :key="index">
                <span class="post-tag">#{{ tag }}</span>
              </template>
            </span>
          </div>
        </div>
      </div>
      
      <!-- 分页导航 -->
      <div 
        v-if="totalPages > 1" 
        class="pagination"
        :class="{ 'pagination-animate': isVisible }"
        :style="{ '--pagination-delay': `${paginatedPosts.length * 0.25 + 0.3}s` }"
      >
        <button 
          class="pagination-button" 
          :class="{ disabled: currentPage === 1 }"
          @click="goToPage(currentPage - 1)" 
          :disabled="currentPage === 1"
        >
          上一页
        </button>
        
        <button 
          v-for="page in pageNumbers" 
          :key="page"
          class="pagination-button" 
          :class="{ active: page === currentPage, ellipsis: page === '...' }"
          @click="typeof page === 'number' && goToPage(page)"
          :disabled="page === '...'"
        >
          {{ page }}
        </button>
        
        <button 
          class="pagination-button" 
          :class="{ disabled: currentPage === totalPages }"
          @click="goToPage(currentPage + 1)" 
          :disabled="currentPage === totalPages"
        >
          下一页
        </button>
      </div>
      
      <!-- 无文章提示：只在组件可见且没有文章时显示 -->
      <div v-if="thoughtsPosts.length === 0 && isVisible" class="no-posts">
        <p>暂无文章</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.post-list {
  margin-top: 2rem;
  position: relative;
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

/* 动画相关样式 */
.post-item {
  margin-bottom: 2rem;
  border-bottom: 1px dashed var(--vp-c-divider);
  padding-bottom: 1rem;
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.post-item-animate {
  opacity: 1;
  transform: translateY(0);
  transition-delay: var(--post-delay, 0s);
}

.post-item:last-child {
  border-bottom: none;
}

/* 分页动画 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
  gap: 0.5rem;
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.pagination-animate {
  opacity: 1;
  transform: translateY(0);
  transition-delay: var(--pagination-delay, 0.5s);
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
  color: var(--vp-c-brand-1);
}

.post-item-title {
  font-size: 1.4rem;
  margin: 0;
  color: var(--vp-c-text-1);
  padding-bottom: 0.5rem;
  margin-bottom: 0.8rem;
  width: 100%;
  border-bottom: none;
  font-weight: 700;
}

.post-excerpt {
  margin: 0.8rem 0;
  color: var(--vp-c-text-2);
  font-size: 0.95rem;
  line-height: 1.6;
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
  padding: 2rem 0;
  color: var(--vp-c-text-2);
  font-style: italic;
}

.error {
  color: var(--vp-c-danger);
}

.pagination-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  font-size: 14px;
  border-radius: 4px;
  background-color: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  border: 1px solid var(--vp-c-divider);
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-button:hover:not(.disabled):not(.active):not(.ellipsis) {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.pagination-button.active {
  background-color: var(--vp-c-brand-1);
  color: var(--vp-c-white);
  border-color: var(--vp-c-brand-1);
}

.pagination-button.disabled,
.pagination-button.ellipsis {
  opacity: 0.5;
  cursor: not-allowed;
}
</style> 