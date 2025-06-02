<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useData } from 'vitepress'

// 动态导入组件
const ArticleMetadata = defineAsyncComponent(() => import('./ArticleMetadata.vue'))

const { frontmatter } = useData()

// 获取文章标题
const title = computed(() => frontmatter.value.title || '')

// 判断是否显示文章统计信息 - 基于是否有创建时间
const hasCreationDate = computed(() => !!frontmatter.value.date)
const shouldShowWordStats = computed(() => {
  // 如果设置了aside: false，通常是索引页面，不显示统计
  if (frontmatter.value.aside === false) {
    return false
  }
  // 默认情况下，如果有日期就显示统计
  return hasCreationDate.value
})
</script>

<template>
  <div class="post-title-container" v-if="title">
    <h1 class="post-title">{{ title }}</h1>
    <ArticleMetadata v-if="shouldShowWordStats" />
    <hr class="post-divider" />
  </div>
</template>

<style scoped>
.post-title-container .post-title {
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  font-size: 2.25rem;
  font-weight: 600;
  line-height: 1.25;
  /* 使用渐变色 */
  background: -webkit-linear-gradient(10deg, #34a965 5%, #424987);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.post-title-container .post-divider {
  margin: 1.5rem 0;
  border: none;
  border-top: 1px solid var(--vp-c-divider);
}
</style> 