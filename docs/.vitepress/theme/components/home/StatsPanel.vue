<script setup>
import { ref, onMounted } from 'vue'
import { withBase } from 'vitepress'

// 判断是否在浏览器环境中
const isBrowser = typeof window !== 'undefined'

// 统计数据
const stats = ref({
  currentMonthPosts: 0,  // 本月更新的文章数
  thoughtsCount: 0,      // 随想文章数
  thoughtsWords: 0,      // 随想文章总字数
})

const isLoading = ref(true)
const hasError = ref(false)

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

// 格式化数字
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// 判断日期是否在当前月份
function isCurrentMonth(date) {
  const now = new Date()
  return date.getMonth() === now.getMonth() && 
         date.getFullYear() === now.getFullYear()
}

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
    stats.value = {
      currentMonthPosts: currentMonthCount,
      thoughtsCount: thoughtsPosts.length,
      thoughtsWords: totalWords,
    }
    
    isLoading.value = false
  } catch (error) {
    console.error('Error loading stats data:', error)
    hasError.value = true
    isLoading.value = false
  }
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
        <div class="stats-card">
          <div class="stats-value">{{ stats.currentMonthPosts }}<span class="plus-mark">+</span></div>
          <div class="stats-label">本月更新</div>
        </div>
        
        <div class="stats-card">
          <div class="stats-value">{{ stats.thoughtsCount }}</div>
          <div class="stats-label">随想总数</div>
        </div>
        
        <div class="stats-card">
          <div class="stats-value">{{ formatNumber(stats.thoughtsWords) }}</div>
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
}
</style> 