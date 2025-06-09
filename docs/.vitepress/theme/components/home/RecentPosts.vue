<script setup>
import { ref, onMounted, computed } from 'vue'
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

// 最近的随想文章
const recentPosts = ref([])
const isLoading = ref(true)
const hasError = ref(false)
const maxPosts = 5 // 显示最多5篇最新文章

onMounted(async () => {
  // 确保只在浏览器环境中执行
  if (!isBrowser) return
  
  try {
    // 从生成的JSON文件获取数据
    const response = await fetch(withBase('/posts.json'))
    if (!response.ok) {
      throw new Error('加载文章数据失败')
    }
    
    const posts = await response.json()
    
    // 严格过滤，只显示publish为true的随想文章
    const filteredPosts = posts.filter(post => 
      post.frontmatter.publish === true && 
      post.relativePath.startsWith('thoughts/') &&
      post.relativePath !== 'thoughts/index.md' &&
      post.relativePath !== 'thoughts/tags.md'
    )
    
    // 按日期排序，取最新的5篇
    recentPosts.value = filteredPosts
      .sort((a, b) => new Date(b.frontmatter.date) - new Date(a.frontmatter.date))
      .slice(0, maxPosts)
    
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
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  
  return `${year}年${month}月${day}日`
}

// 计算阅读时间
function calculateReadTime(content) {
  const wordCount = countWord(content || '')
  return Math.ceil(wordCount / 300)
}

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
  <div class="recent-posts">
    <h2 class="section-title">近期动态</h2>
    
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
      <div v-for="post in recentPosts" :key="post.url" class="post-item">
        <a :href="withBase(post.url)" class="post-link">
          <h3 class="post-item-title">{{ post.frontmatter.title }}</h3>
          
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
        </a>
      </div>
      
      <!-- 无文章提示 -->
      <div v-if="recentPosts.length === 0" class="no-posts">
        <p>暂无文章</p>
      </div>
      
      <!-- 查看更多链接 -->
      <div v-else class="view-more">
        <a href="/thoughts/" class="view-more-link">查看更多 →</a>
      </div>
    </template>
  </div>
</template>

<style scoped>
.recent-posts {
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

.post-item {
  margin-bottom: 1.5rem;
  border-bottom: 1px dashed var(--vp-c-divider);
  padding-bottom: 1rem;
}

.post-item:last-child {
  margin-bottom: 0.5rem;
}

.post-link {
  display: block;
  text-decoration: none;
  color: var(--vp-c-text-1);
}

.post-link:hover .post-item-title {
  color: var(--vp-c-brand-1);
}

.post-item-title {
  font-size: 1.2rem;
  margin: 0 0 0.5rem 0;
  transition: color 0.2s;
  color: var(--vp-c-text-1);
  font-weight: 500;
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
</style> 