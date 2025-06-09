---
# https://vitepress.dev/reference/default-theme-home-page
layout: home
toc: false

hero:
  name: "LycanClaw"
  text: "渊痕爪记"
  tagline: 维克罗德的世界探索笔记🧭
  image:
    src: /default.png
    alt: LycanClaw
  actions:
    - theme: brand
      text: 🤔 思考随笔 ->
      link: /thoughts/
    - theme: alt
      text: 📚 知识笔记 
      link: /knowledge/
    - theme: alt
      text: 🛠️ 项目展示 
      link: /projects/
---

<script setup>
import RecentPosts from './.vitepress/theme/components/home/RecentPosts.vue'
import StatsPanel from './.vitepress/theme/components/home/StatsPanel.vue'
import ContributionHeatmap from './.vitepress/theme/components/home/ContributionHeatmap.vue'
</script>

<div class="home-container">
  <!-- 左侧主要内容区域 -->
  <div class="home-content-area">
    <!-- 近期动态 -->
    <div class="home-section recent-posts-section">
      <RecentPosts />
    </div>
  </div>
  
  <!-- 右侧边栏 -->
  <div class="home-sidebar">
    <!-- 数据统计 -->
    <div class="home-section stats-section">
      <StatsPanel />
    </div>
  <!-- 贡献热力图 -->
    <div class="home-section heatmap-section">
      <ContributionHeatmap />
    </div>
  </div>
</div>

<style scoped>
/* 主页整体容器 */
.home-container {
  display: grid;
  grid-template-columns: 2fr 1fr; /* 左侧占2份，右侧占1份 */
  grid-template-areas: "content sidebar";
  gap: 2rem;
  margin-top: 2rem;
}

/* 左侧内容区域 */
.home-content-area {
  grid-area: content;
  display: flex;
  flex-direction: column;
  gap: 2rem; /* 每个部分之间的间距 */
}

/* 右侧边栏区域 */
.home-sidebar {
  grid-area: sidebar;
  display: flex;
  flex-direction: column;
}

/* 确保每个区域占满宽度 */
.home-section {
  width: 100%;
}

/* 移动端适配 - 当宽度小于768px时 */
@media (max-width: 959px) {
  /* 改为单列布局 */
  .home-container {
    grid-template-columns: 1fr;
    grid-template-areas: 
      "content" 
      "sidebar";
  }
  
  /* 减少移动端的间距 */
  .home-content-area,
  .home-sidebar {
    gap: 1.5rem;
  }
}

/* 小屏幕移动端进一步优化 */
@media (max-width: 480px) {
  .home-container {
    gap: 1rem;
    margin-top: 1.5rem;
  }
  
  .home-content-area,
  .home-sidebar {
    gap: 1rem;
  }
}
</style>

