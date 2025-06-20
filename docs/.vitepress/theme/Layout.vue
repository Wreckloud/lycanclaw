<!-- 添加全局音乐播放器 -->
<script setup>
import { useData } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import GlobalMusicPlayer from './components/common/GlobalMusicPlayer.vue'

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #layout-bottom>
      <GlobalMusicPlayer />
    </template>
  </Layout>
</template>

<style>
/* 可以在这里添加全局样式 */
</style> 