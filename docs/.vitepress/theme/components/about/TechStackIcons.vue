<template>
  <div class="tech-icons-container">
    <div class="tags-group-wrapper" ref="wrapper">
      <div class="tags-group-icon" 
        v-for="(icon, index) in allIcons" 
        :key="index"
        :style="{ background: icon.bg }"
      >
        <img 
          class="no-lightbox" 
          :title="icon.title" 
          :src="icon.src" 
          :alt="icon.title" 
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

// 技术栈图标数据
const techIcons = [
  { title: 'HTML', bg: '#e9572b', src: 'https://img02.anheyu.com/adminuploads/1/2022/09/25/633006f9ab27d.png' },
  { title: 'CSS3', bg: '#2c51db', src: 'https://img02.anheyu.com/adminuploads/1/2022/09/25/633006cc55e07.png' },
  { title: 'JavaScript', bg: '#f7cb4f', src: 'https://img02.anheyu.com/adminuploads/1/2022/09/25/633006eee047b.png' },
  { title: 'TypeScript', bg: '#3178c6', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg' },
  { title: 'Vue', bg: '#b8f0ae', src: 'https://img02.anheyu.com/adminuploads/1/2022/09/25/633001374747b.png' },
  { title: 'Vite', bg: '#937df7', src: 'https://npm.elemecdn.com/anzhiyu-blog@2.0.8/img/svg/vite-logo.svg' },
  { title: 'VitePress', bg: '#937df7', src: 'https://vitepress.dev/vitepress-logo-large.webp' },
  { title: 'Node.js', bg: '#333', src: 'https://npm.elemecdn.com/anzhiyu-blog@2.1.1/img/svg/node-logo.svg' },
  { title: 'Python', bg: '#fff', src: 'https://img02.anheyu.com/adminuploads/1/2022/09/25/63300647dea51.png' },
  { title: 'Git', bg: '#df5b40', src: 'https://img02.anheyu.com/adminuploads/1/2023/04/11/6434a635e9726.webp' },
  { title: 'Docker', bg: '#57b6e6', src: 'https://img02.anheyu.com/adminuploads/1/2022/09/25/63300647df7fa.png' },
  { title: 'Kubernetes', bg: '#326CE5', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kubernetes/kubernetes-plain.svg' },
  { title: 'Markdown', bg: '#fff', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/markdown/markdown-original.svg' },
  { title: 'VS Code', bg: '#0078d7', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vscode/vscode-original.svg' },
  { title: 'GitHub', bg: '#24292e', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg' },
  { title: 'Axios', bg: '#5a29e4', src: 'https://axios-http.com/assets/logo.svg' },
];

// 复制图标列表以实现无缝滚动
const allIcons = [...techIcons, ...techIcons];

const wrapper = ref(null);
let animationId = null;
const scrollSpeed = 0.1; // 滚动速度

onMounted(() => {
  if (!wrapper.value) return;
  
  // 设置初始位置
  wrapper.value.style.transform = 'translateX(0)';
  
  // 开始滚动动画
  let position = 0;
  const width = wrapper.value.scrollWidth / 2;
  
  function scroll() {
    position += scrollSpeed;
    
    // 当滚动到一半时重置位置
    if (position >= width) {
      position = 0;
    }
    
    wrapper.value.style.transform = `translateX(-${position}px)`;
    animationId = requestAnimationFrame(scroll);
  }
  
  animationId = requestAnimationFrame(scroll);
});

onUnmounted(() => {
  // 清除动画
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
});
</script>

<style scoped>
.tech-icons-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  transform: rotate(33deg) scale(1.5) translateY(-60px) translateX(60px);
  opacity: 0.7;
}

.tags-group-wrapper {
  position: relative;
  display: flex;
  will-change: transform;
  white-space: nowrap;
  height: 100%;
  align-items: center;
}

.tags-group-icon {
  width: 80px;
  height: 80px;
  border-radius: 5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0 10px;
  transition: transform 0.3s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.tags-group-icon img {
  width: 60px;
  height: 60px;
  transition: all 0.3s ease;
  object-fit: contain;
}

.dark .tags-group-icon[style*="background:#fff"] {
  background: #333 !important;
}

.dark .tags-group-icon img {
  filter: brightness(0.9);
}

@media (max-width: 768px) {
  .tech-icons-container {
    transform: rotate(30deg) scale(1.2);
  }
  
  .tags-group-icon {
    width: 60px;
    height: 60px;
    margin: 0 8px;
  }
  
  .tags-group-icon img {
    width: 40px;
    height: 40px;
  }
}
</style> 