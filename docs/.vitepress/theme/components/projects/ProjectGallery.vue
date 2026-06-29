<template>
  <section class="project-gallery">
    <a
      v-for="project in projects"
      :key="project.link"
      class="project-card"
      :href="project.link"
    >
      <div class="project-card-main">
        <h2>{{ project.title }}</h2>
      </div>
      <div class="project-board" aria-hidden="true">
        <span v-for="index in 9" :key="index"></span>
      </div>
    </a>
  </section>
</template>

<script setup lang="ts">
interface ProjectItem {
  title: string
  link: string
}

const projects: ProjectItem[] = [
  {
    title: '九宫叠阵',
    link: '/games/ultimate-tic-tac-toe'
  }
]
</script>

<style scoped>
.project-gallery {
  display: grid;
  gap: 1rem;
  margin: 2rem 0;
}

.project-card {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 150px;
  gap: 1rem;
  min-height: 136px;
  padding: 1rem 1.1rem;
  overflow: hidden;
  color: inherit;
  background: var(--vp-c-bg-soft);
  text-decoration: none;
}

.project-card h2 {
  margin: 0;
  font-size: clamp(1.6rem, 4vw, 2.5rem);
  line-height: 1.05;
}

.project-board {
  position: absolute;
  right: 1.4rem;
  top: 50%;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 5px;
  width: 104px;
  height: 104px;
  padding: 8px;
  border: 2px solid color-mix(in srgb, #5f5f5f 74%, var(--vp-c-divider));
  background: color-mix(in srgb, var(--vp-c-bg-soft) 78%, #303030 12%);
  opacity: 0.18;
  transform: translateY(-50%) rotate(-13deg);
}

.project-board span {
  border: 1px solid color-mix(in srgb, #5f5f5f 74%, var(--vp-c-divider));
  background: var(--vp-c-bg);
}

@media (max-width: 640px) {
  .project-card {
    grid-template-columns: 1fr;
  }

  .project-board {
    right: -0.6rem;
    width: 88px;
    height: 88px;
  }
}
</style>
