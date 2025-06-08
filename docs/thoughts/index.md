---
title: 思考随笔
description: 记录思考、感悟与创作
sidebar: false
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
/* 移除了页面操作按钮相关样式 */
</style>
