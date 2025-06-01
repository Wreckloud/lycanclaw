<script setup>
import { ref, onMounted } from 'vue'
import { useData } from 'vitepress'
import { withBase } from 'vitepress'

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

onMounted(async () => {
  try {
    // 从生成的JSON文件获取数据
    const response = await fetch('/posts.json')
    if (!response.ok) {
      throw new Error('Failed to fetch posts data')
    }
    
    const posts = await response.json()
    
    // 严格过滤，只显示publish为true的文章
    thoughtsPosts.value = posts.filter(post => post.frontmatter.publish === true)
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
  
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ''
  
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${month}月${day}日`
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
      <div v-for="post in thoughtsPosts" :key="post.url" class="post-item">
        <a :href="withBase(post.url)" class="post-link">
          <h2 class="post-title">{{ post.frontmatter.title }}</h2>
          
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
      <div v-if="thoughtsPosts.length === 0" class="no-posts">
        <p>暂无文章</p>
      </div>
    </template>
  </div>
</template>

<style>
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

.post-link {
  display: block;
  text-decoration: none;
  color: var(--vp-c-text-1);
}

.post-link:hover .post-title {
  color: var(--vp-c-brand-1);
}

.post-title {
  font-size: 1.4rem;
  margin: 0 0 0.5rem 0;
  transition: color 0.2s;
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
</style> 