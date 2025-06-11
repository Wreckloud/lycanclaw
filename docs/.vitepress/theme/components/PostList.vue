<script setup>
import { ref, onMounted, computed } from 'vue'
import { useData } from 'vitepress'
import { withBase } from 'vitepress'

// 判断是否在浏览器环境中
const isBrowser = typeof window !== 'undefined'

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
    
    // 严格过滤，只显示publish为true的随想文章
    thoughtsPosts.value = posts.filter(post => 
      post.frontmatter.publish === true && 
      post.relativePath.startsWith('thoughts/') &&
      post.relativePath !== 'thoughts/index.md' &&
      post.relativePath !== 'thoughts/tags.md'
    )
    
    // 验证文章URL是否有效
    if (isBrowser && window.location.pathname.includes('/thoughts/') && 
        !thoughtsPosts.value.some(post => post.url === window.location.pathname)) {
      // 当前路径是一个thoughts文章，但在posts.json中找不到
      // 这可能是因为文件已被删除
      console.warn('当前文章可能已被删除:', window.location.pathname)
    }
    
    isLoading.value = false
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
  <div class="post-list">
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
      <div v-for="post in paginatedPosts" :key="post.url" class="post-item">
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
      <div v-if="totalPages > 1" class="pagination">
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
      
      <!-- 无文章提示 -->
      <div v-if="thoughtsPosts.length === 0" class="no-posts">
        <p>暂无文章</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.post-list {
  margin-top: 2rem;
}

.post-item {
  margin-bottom: 2rem;
  border-bottom: 1px dashed var(--vp-c-divider);
  padding-bottom: 1rem;
}

.post-item:last-child {
  border-bottom: none;
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

/* 分页样式 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
  gap: 0.5rem;
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