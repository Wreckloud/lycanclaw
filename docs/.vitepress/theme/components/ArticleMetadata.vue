<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useData } from 'vitepress'
import { countWord } from '../utils/wordCount'

// 获取当前页面的数据
const { frontmatter, page } = useData()

// 获取文章更新时间
const updateDate = computed(() => {
  const timestamp = page.value.lastUpdated
  return timestamp ? new Date(timestamp) : new Date()
})

// 获取文章创建时间
const hasCreationDate = computed(() => !!frontmatter.value.date)
const creationDate = computed(() => {
  if (!frontmatter.value.date) return null
  
  // 尝试解析日期，处理多种可能的格式
  try {
    // 日期可能是 '2024-07-26 11:45:14' 格式或其他格式
    return new Date(frontmatter.value.date)
  } catch (e) {
    console.error('无法解析日期:', frontmatter.value.date)
    return null
  }
})

// 计算字数
const wordCount = ref(0)
// 计算阅读时间（按照每分钟300字计算）
const readTime = ref(0)

onMounted(() => {
  // 获取文章内容（从DOM中获取）
  const content = document.querySelector('.vp-doc')?.textContent || ''
  // 计算字数
  wordCount.value = countWord(content)
  // 计算阅读时间
  readTime.value = Math.ceil(wordCount.value / 300)
})
</script>

<template>
  <div class="word">
    <p>
      <!-- 创建时间，仅在frontmatter中存在date属性时显示 -->
      <template v-if="hasCreationDate && creationDate">
        <svg t="1724643683964" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
          p-id="2493" width="14" height="14">
          <path
            d="M885.333333 256v618.666667H138.666667V256h746.666666z m0-64H138.666667a64 64 0 0 0-64 64v618.666667a64 64 0 0 0 64 64h746.666666a64 64 0 0 0 64-64V256a64 64 0 0 0-64-64zM375.466667 149.333333v128a32 32 0 1 1-64 0V149.333333a32 32 0 1 1 64 0z m341.333333 0v128a32 32 0 1 1-64 0V149.333333a32 32 0 1 1 64 0z"
            fill="#9a9a9a" p-id="2494"></path>
          <path d="M234.666667 512h554.666666v64H234.666667z" fill="#9a9a9a" p-id="2495"></path>
        </svg>
        <span>创建: {{ creationDate.toLocaleDateString() }}</span>
        <span class="stat-divider"></span>


      <svg t="1724571760788" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
        p-id="6125" width="14" height="14">
        <path
          d="M204.8 0h477.866667l273.066666 273.066667v614.4c0 75.093333-61.44 136.533333-136.533333 136.533333H204.8c-75.093333 0-136.533333-61.44-136.533333-136.533333V136.533333C68.266667 61.44 129.706667 0 204.8 0z m307.2 607.573333l68.266667 191.146667c13.653333 27.306667 54.613333 27.306667 61.44 0l102.4-273.066667c6.826667-20.48 0-34.133333-20.48-40.96s-34.133333 0-40.96 13.65334l-68.266667 191.146666-68.266667-191.146666c-13.653333-27.306667-54.613333-27.306667-68.266666 0l-68.266667 191.146666-68.266667-191.146666c-6.826667-13.653333-27.306667-27.306667-47.786666-20.48s-27.306667 27.306667-20.48 47.786666l102.4 273.066667c13.653333 27.306667 54.613333 27.306667 61.44 0l75.093333-191.146667z"
          fill="#9a9a9a" p-id="6126"></path>
        <path d="M682.666667 0l273.066666 273.066667h-204.8c-40.96 0-68.266667-27.306667-68.266666-68.266667V0z"
          fill="#E0E0E0" opacity=".619" p-id="6127"></path>
      </svg>
      <span>字数: {{ wordCount }} 字</span>
      <span class="stat-divider"></span>

      <svg t="1724572797268" class="icon" viewBox="0 0 1060 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
        p-id="15031" width="14" height="14">
        <path
          d="M556.726857 0.256A493.933714 493.933714 0 0 0 121.929143 258.998857L0 135.021714v350.390857h344.649143L196.205714 334.482286a406.820571 406.820571 0 1 1-15.908571 312.649143H68.937143A505.819429 505.819429 0 1 0 556.726857 0.256z m-79.542857 269.531429v274.907428l249.197714 150.966857 42.422857-70.070857-212.114285-129.389714V269.787429h-79.542857z"
          fill="#9a9a9a" p-id="15032"></path>
      </svg>
      <span>时长: {{ readTime }} 分钟</span>
    </template>
    </p>
  </div>
</template>

<style>
.word {
  color: var(--vp-c-text-3);
  font-size: 12px;
}

.icon {
    display: inline-block;
    transform: translate(0px , 2px);
    margin-right: 4px;
}

.stat-divider {
    display: inline-block;
    width: 16px;
}
</style> 