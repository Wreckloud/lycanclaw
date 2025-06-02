<script setup>
import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import PostTitle from './PostTitle.vue'
import DataPanel from './DataPanel.vue'

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #doc-before>
      <PostTitle />
    </template>
    <template #layout-bottom>
      <DataPanel />
    </template>
  </Layout>
</template> 