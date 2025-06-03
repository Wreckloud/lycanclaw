---
title: 留痕之地-关于
aside: true
---

<script setup>
import Greeting from './.vitepress/theme/components/about/Greeting.vue'
</script>

<Greeting />

我喜欢将现实打磨成幻想，把零碎的知识砌成思维的塔楼。

探索前端与幻想故事，我喜欢在美好的事物间寻找自己的步伐。不擅长喧哗，也不习惯高调，但总希望留下些可以回望的痕迹。

目前正在学习 Vue 及其生态（Pinia、Router 等），熟悉 HTML、CSS、JavaScript，常用 Markdown 记录和整理内容。会与 Git 打交道，搭建了这个使用 VitePress 的小站。后端方面接触过 Java、Spring、MySQL 等。

我喜欢中世纪幻想与狼、艺术创作，偶尔尝试写一些故事，更多是把想象放进日常的缝隙里。这个博客，是为了记录成长、分享技能、展示原创作品，也是希望能遇到志同道合的旅人。

如果你偶尔在夜里迷路，希望这里的微光能成为你的一个小小路标。

<div class="about-page">
  <div class="bg-glow"></div>
</div>

<style>
.about-page {
  position: relative;
  width: 100%;
  max-width: 100%;
  padding: 2rem 0;
  line-height: 1.6;
}

.bg-glow {
  position: fixed;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(ellipse at center, rgba(10, 62, 30, 0.1), transparent 70%);
  animation: flicker 12s infinite alternate ease-in-out;
  z-index: -1;
  pointer-events: none;
}

@keyframes flicker {
  0% { transform: scale(1) rotate(0deg); }
  50% { transform: scale(1.1) rotate(0.5deg); }
  100% { transform: scale(1.2) rotate(1deg); }
}


</style>

