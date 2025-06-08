---
title: 留痕之地-关于
comment: true
aside: true
---

<script setup>
import Greeting from './.vitepress/theme/components/about/Greeting.vue'
import TypewriterEffect from './.vitepress/theme/components/about/TypewriterEffect.vue'
import TechStackIcons from './.vitepress/theme/components/about/TechStackIcons.vue'
import ImageGallery from './.vitepress/theme/components/about/ImageGallery.vue'
</script>

这里是维克罗德!

<Greeting />

我喜欢将现实打磨成幻想，把零碎的知识砌成思维的塔楼。

探索前端与幻想故事，我喜欢在美好的事物间寻找自己的步伐。不擅长喧哗，也不习惯高调，但总希望留下些可以回望的痕迹。

<div class="typewriter-container">
  <TypewriterEffect />
  <div class="tech-stack-background">
    <TechStackIcons />
  </div>
</div>


目前正在学习 Vue 及其生态（Pinia、Router 等），熟悉 HTML、CSS、JavaScript，常用 Markdown 记录和整理内容。会与 Git 打交道，搭建了这个使用 VitePress 的小站。后端方面接触过 Java、Spring、MySQL 等。



我喜欢中世纪幻想与狼、艺术创作，偶尔尝试写一些故事，更多是把想象放进日常的缝隙里。这个博客，是为了记录成长、分享技能、展示原创作品，也是希望能遇到志同道合的旅人。

<ImageGallery 
  title="创意无限"
  description="在数字世界中探索无限可能，每一行代码都是创造的开始。"
  image="\images\关于页\嗷呜.jpg"
  size="large"
/>

如果你偶尔在夜里迷路，希望这里的微光能成为你的一个小小路标。

<style>
.typewriter-container {
  position: relative;
  margin: 2rem 0;
}

.tech-stack-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 50%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.typewriter-container :deep(.typewriter-box) {
  position: relative;
  z-index: 1;
  background: linear-gradient(135deg, rgba(89, 89, 89, 0.05) 0%, rgba(174, 174, 174, 0.1) 100%);
}

.tech-stack-background :deep(.tech-icons-container) {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  margin: 0;
}

.image-gallery-container {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  margin: 2rem 0;
}
</style>

