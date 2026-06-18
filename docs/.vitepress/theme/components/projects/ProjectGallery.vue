<template>
  <section class="project-gallery">
    <a
      v-for="project in projects"
      :key="project.link"
      class="project-card"
      :href="project.link"
    >
      <div class="project-card-main">
        <p class="project-kicker">{{ project.kicker }}</p>
        <h2>{{ project.title }}</h2>
        <p>{{ project.description }}</p>
      </div>
      <div class="project-tags">
        <span v-for="tag in project.tags" :key="tag">{{ tag }}</span>
      </div>
    </a>
  </section>
</template>

<script setup lang="ts">
interface ProjectItem {
  title: string
  kicker: string
  description: string
  link: string
  tags: string[]
}

const projects: ProjectItem[] = [
  {
    title: '九宫叠阵',
    kicker: 'Strategy Game',
    description: '一个大型井字棋变体。九个小棋盘彼此牵引，电脑会根据你的表现调整强度。',
    link: '/games/ultimate-tic-tac-toe',
    tags: ['开发中', '人机', '策略棋']
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
  grid-template-columns: 1fr auto;
  gap: 1rem;
  min-height: 168px;
  padding: 1.25rem;
  overflow: hidden;
  color: inherit;
  background:
    linear-gradient(135deg, rgba(22, 163, 70, 0.13), transparent 42%),
    linear-gradient(315deg, rgba(66, 73, 135, 0.12), transparent 48%),
    var(--vp-c-bg-soft);
  text-decoration: none;
  transition:
    transform var(--lc-motion-duration-normal) var(--lc-motion-ease-emphasis),
    background var(--lc-motion-duration-normal) var(--lc-motion-ease-standard);
}

.project-card::before {
  content: "";
  position: absolute;
  inset: auto 0 0;
  height: 2px;
  background: linear-gradient(90deg, var(--vp-c-brand-1), transparent);
  opacity: 0.72;
}

.project-card:hover {
  transform: translateY(-2px);
  color: inherit;
}

.project-kicker {
  margin: 0 0 0.35rem;
  color: var(--vp-c-brand-1);
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.project-card h2 {
  margin: 0;
  font-size: clamp(1.6rem, 4vw, 2.5rem);
  line-height: 1.05;
}

.project-card p {
  max-width: 560px;
  margin: 0.75rem 0 0;
  color: var(--vp-c-text-2);
  line-height: 1.7;
}

.project-tags {
  display: flex;
  flex-wrap: wrap;
  align-content: flex-end;
  justify-content: flex-end;
  gap: 0.45rem;
}

.project-tags span {
  padding: 0.28rem 0.52rem;
  color: var(--vp-c-text-2);
  background: rgba(125, 125, 125, 0.12);
  font-size: 0.78rem;
}

@media (max-width: 640px) {
  .project-card {
    grid-template-columns: 1fr;
  }

  .project-tags {
    justify-content: flex-start;
  }
}
</style>
