---
title: 啸月嗷声 - 随笔
aside: true
---

非为吼叫，只是心有所动。  
这里收录我向月吐露的低语，不为喧嚣，只为心中不灭的微光。

<PostList />

<script setup>
import { useData } from 'vitepress'
import PostList from '../.vitepress/theme/components/PostList.vue'

const { isDark } = useData()
</script>

<style scoped>
.blog-page {
  padding-bottom: 50px;
}
</style>
