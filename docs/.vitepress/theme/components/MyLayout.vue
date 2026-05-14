<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import PostTitle from './PostTitle.vue'
import ArticleTagsFooter from './ArticleTagsFooter.vue'
import DataPanel from './DataPanel.vue'
import GlobalMusicPlayer from './music/GlobalMusicPlayer.vue'
import BackToTop from './common/BackToTop.vue'
import { useData } from 'vitepress'
import { defineAsyncComponent, computed } from 'vue'

const { Layout } = DefaultTheme
const { frontmatter, page } = useData()

// 异步加载评论组件，提高页面加载性能
const Comment = defineAsyncComponent(() => 
  import('./Comment.vue')
)

/**
 * 判断是否显示评论
 * - 文章页面 (有日期属性的页面)
 * - 关于页面
 * - 除非明确禁用评论
 */
const shouldShowComment = computed(() => {
  // 在文章页面显示评论 (通常有日期的是文章页)
  const isArticlePage = !!frontmatter.value.date
  
  // 关于页显示评论
  const isAboutPage = page.value.relativePath === 'about.md'
  
  // 明确禁用评论的页面不显示
  const disableComment = frontmatter.value.comment === false
  
  return (isArticlePage || isAboutPage) && !disableComment
})
</script>

<template>
  <Layout>
    <!-- 文章标题区域 -->
    <template #doc-before>
      <PostTitle />
    </template>

    <template #doc-footer-before>
      <ArticleTagsFooter />
    </template>
    
    <!-- 评论区域 -->
    <template #doc-after>
      <Comment v-if="shouldShowComment" />
    </template>

    <!-- 页脚数据面板 -->
    <template #layout-bottom>
      <DataPanel />
    </template>
  </Layout>
  
  <!-- 全局音乐播放器 -->
  <GlobalMusicPlayer />
  
  <!-- 返回顶部按钮 -->
  <BackToTop />
</template>
