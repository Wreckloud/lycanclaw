<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { Content, useData } from 'vitepress'
import { ref, computed, defineAsyncComponent } from 'vue'

const { Layout } = DefaultTheme
const { frontmatter, page } = useData()

// 这个布局是备用布局，主要逻辑已移至MyLayout.vue
// 如果需要直接修改VitePress默认布局，可以在这里操作
</script>

<template>
  <Layout>
    <template #layout-top>
      <!-- 页面顶部内容 -->
    </template>
    
    <template #aside-outline-before>
      <!-- 大纲前内容 -->
    </template>
    
    <template #aside-outline-after>
      <!-- 大纲后内容 -->
    </template>
    
    <template #aside-ads-before>
      <!-- 侧边栏广告前内容 -->
    </template>
    
    <template #aside-ads-after>
      <!-- 侧边栏广告后内容 -->
    </template>
    
    <template #doc-before>
      <!-- 文档前内容 -->
      <PageTransition>
        <!-- 这里不需要内容，因为PageTransition是包装器 -->
      </PageTransition>
    </template>
    
    <template #doc-after>
      <!-- 文档后内容 - 评论区逻辑已移至MyLayout.vue -->
    </template>
    
    <template #layout-bottom>
      <!-- 页面底部内容 -->
    </template>
  </Layout>
</template>