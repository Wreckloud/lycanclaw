<template>
  <div class="typewriter-tech-container">
    <!-- 第三层：渐变背景 -->
    <div class="gradient-background"></div>
    
    <!-- 第二层：滚动技术栈图标 -->
    <div class="tech-stack-layer">
      <div class="tech-icons-container">
        <div class="tech-icons-wrapper" ref="iconsWrapper">
          <div v-for="(tech, index) in techStackData" :key="index" 
              class="tech-icon-item" :style="{ background: tech.bg }">
            <img :src="tech.src" :alt="tech.title" :title="tech.title" />
          </div>
        </div>
      </div>
    </div>
    
    <!-- 第一层：打字机文字效果 -->
    <div class="typewriter-layer">
      <div class="typewriter-content">
        <div class="typewriter-line">我要成为</div>
        <div class="typewriter-line typewriter-dynamic">
          <span ref="dynamicText" class="dynamic-text"></span>
          <span class="cursor">|</span>
        </div>
        <div class="typewriter-line">高手</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

// 技术栈数据中心化管理
const techStackData = [
  { title: 'HTML', bg: '#e9572b', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg' },
  { title: 'CSS3', bg: '#2c51db', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg' },
  { title: 'JavaScript', bg: '#f7cb4f', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg' },
  { title: 'TypeScript', bg: '#3178c6', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg' },
  { title: 'Vue', bg: '#42b883', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg' },
  { title: 'Vuex', bg: '#42b883', src: 'https://user-images.githubusercontent.com/7110136/29002857-9e802f08-7ab4-11e7-9c31-604b5d0d0c19.png' },
  { title: 'Pinia', bg: '#ffe56c', src: 'https://pinia.vuejs.org/logo.svg' },
  { title: 'Nuxt.js', bg: '#00dc82', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nuxtjs/nuxtjs-original.svg' },
  { title: 'Vuetify', bg: '#1867c0', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuetify/vuetify-original.svg' },
  { title: 'Quasar', bg: '#1976d2', src: 'https://cdn.quasar.dev/logo-v2/svg/logo.svg' },
  { title: 'Vite', bg: '#937df7', src: 'https://vitejs.dev/logo.svg' },
  { title: 'VitePress', bg: '#937df7', src: 'https://vitepress.dev/vitepress-logo-mini.svg' },
  { title: 'Node.js', bg: '#333', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg' },
  { title: 'Python', bg: '#3776AB', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg' },
  { title: 'Git', bg: '#df5b40', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg' },
  { title: 'Docker', bg: '#57b6e6', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg' },
  { title: 'Kubernetes', bg: '#326CE5', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kubernetes/kubernetes-plain.svg' },
  { title: 'Markdown', bg: '#fff', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/markdown/markdown-original.svg' },
  { title: 'VS Code', bg: '#0078d7', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vscode/vscode-original.svg' },
  { title: 'GitHub', bg: '#24292e', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg' },
  { title: 'Axios', bg: '#5a29e4', src: 'https://axios-http.com/assets/logo.svg' },
  { title: 'Java', bg: '#007396', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg' },
  { title: 'React', bg: '#61DAFB', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg' },
  { title: 'Webpack', bg: '#8DD6F9', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/webpack/webpack-original.svg' },
  { title: 'Element Plus', bg: '#409EFF', src: 'https://element-plus.org/images/element-plus-logo.svg' },
  { title: 'Ant Design Vue', bg: '#0170fe', src: 'https://www.antdv.com/assets/logo.1ef800a8.svg' },
  { title: 'Vitest', bg: '#729b1b', src: 'https://vitest.dev/logo.svg' },
  { title: 'Vueuse', bg: '#41b883', src: 'https://vueuse.org/logo-vertical.png' },
  { title: 'Volar', bg: '#41b883', src: 'https://user-images.githubusercontent.com/499550/176823239-f59d75de-1d24-4b2d-b04b-fcc95db2903e.png' },
  { title: 'Storybook', bg: '#ff4785', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/storybook/storybook-original.svg' },
  { title: 'ESLint', bg: '#4b32c3', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/eslint/eslint-original.svg' },
];

// 打字机效果数据
const technologiesList = [
  'HTML',
  'CSS3',
  'JavaScript',
  'TypeScript',
  'Vue',
  'Vuex',
  'Vue Router',
  'Pinia',
  'Nuxt.js',
  'Vuetify',
  'Quasar',
  'Vite',
  'VitePress',
  'Element Plus',
  'Ant Design Vue',
  'Naive UI',
  'Vueuse',
  'Volar',
  'Vitest',
  'Storybook',
  'Node.js',
  'Python',
  'Java',
  'Git',
  'Docker',
  'Kubernetes',
  'React',
  'Webpack',
  '全栈(真的吗',
  '前端'
];

// 打字机效果相关
const dynamicText = ref(null);
let currentTimeout = null;
let currentText = '';
let isDeleting = false;
let typingSpeed = 150; // 打字速度(ms)
let pauseTime = 3000; // 完成一个词后暂停时间(ms)
let currentTech = ''; // 当前正在处理的技术名称

// 技术图标滚动相关
const iconsWrapper = ref(null);
let animationId = null;
const scrollSpeed = 0.1; // 滚动速度

// 随机获取一个技术
function getRandomTech() {
  return technologiesList[Math.floor(Math.random() * technologiesList.length)];
}

// 打字效果
function typeEffect() {
  // 如果没有当前技术或者已经删除完成，选择一个新的技术
  if (currentTech === '' || (isDeleting && currentText === '')) {
    currentTech = getRandomTech();
  }
  
  // 如果正在删除
  if (isDeleting) {
    // 从后往前删除字符
    currentText = currentText.substring(0, currentText.length - 1);
  } else {
    // 从前往后添加字符
    currentText = currentTech.substring(0, currentText.length + 1);
  }
  
  // 更新文本内容
  if (dynamicText.value) {
    dynamicText.value.textContent = currentText;
  }
  
  // 根据状态调整打字速度
  let typeSpeed = typingSpeed;
  
  // 如果完成了一个词的打字
  if (!isDeleting && currentText === currentTech) {
    // 暂停一段时间后开始删除
    typeSpeed = pauseTime;
    isDeleting = true;
  } else if (isDeleting && currentText === '') {
    // 如果删除完成，切换到下一个词
    isDeleting = false;
    // 重置当前技术，下次循环时会选择新的
    currentTech = '';
    // 稍微暂停一下再开始新词
    typeSpeed = 500;
  }
  
  // 继续打字效果
  currentTimeout = setTimeout(typeEffect, typeSpeed);
}

// 技术图标滚动效果
function setupIconsScroll() {
  if (!iconsWrapper.value) return;
  
  // 复制足够多的图标，确保无缝滚动
  const originalIcons = [...iconsWrapper.value.children];
  const totalWidth = originalIcons.reduce((sum, icon) => {
    const style = window.getComputedStyle(icon);
    const width = parseFloat(style.width) + parseFloat(style.marginLeft) + parseFloat(style.marginRight);
    return sum + width;
  }, 0);
  
  // 复制足够的图标以确保覆盖整个可见区域
  const copies = Math.ceil(window.innerWidth * 1.5 / totalWidth) + 1;
  
  for (let i = 0; i < copies; i++) {
    originalIcons.forEach(icon => {
      const clone = icon.cloneNode(true);
      iconsWrapper.value.appendChild(clone);
    });
  }
  
  let position = 0;
  
  function scroll() {
    position += scrollSpeed;
    
    // 检查是否需要重置位置（当第一组图标完全滚出视图）
    if (position >= totalWidth) {
      position = 0;
    }
    
    if (iconsWrapper.value) {
      iconsWrapper.value.style.transform = `translateX(-${position}px)`;
    }
    
    animationId = requestAnimationFrame(scroll);
  }
  
  animationId = requestAnimationFrame(scroll);
}

onMounted(() => {
  // 启动打字机效果
  typeEffect();
  
  // 给DOM元素一点时间加载
  setTimeout(() => {
    // 启动技术图标滚动
    setupIconsScroll();
  }, 100);
});

onUnmounted(() => {
  // 清除定时器
  if (currentTimeout) {
    clearTimeout(currentTimeout);
  }
  
  // 清除动画
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
});
</script>

<style scoped>
/* 整体容器 */
.typewriter-tech-container {
  position: relative;
  margin: 2rem 0;
  width: 100%;
  min-height: 180px;
  box-sizing: border-box;
  border-radius: 8px;
  overflow: hidden;
}

/* 第三层：渐变背景 */
.gradient-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 50%;
  height: 100%;
  background: linear-gradient(135deg, rgba(89, 89, 89, 0.05) 0%, rgba(174, 174, 174, 0.1) 100%);
  border-radius: 8px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.05);
  transform: perspective(800px) rotateX(2deg);
  z-index: 1;
}

/* 第二层：技术栈图标 */
.tech-stack-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 50%; /* 桌面端50% */
  height: 100%;
  z-index: 2;
  pointer-events: none;
  overflow: hidden;
}

/* 技术图标容器，应用倾斜角度 */
.tech-icons-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform: rotate(33deg) scale(1.5) translateY(-60px) translateX(60px);
  opacity: 0.7;
}

.tech-icons-wrapper {
  position: relative;
  display: flex;
  white-space: nowrap;
  height: 100%;
  align-items: center;
  will-change: transform;
}

.tech-icon-item {
  width: 80px;
  height: 80px;
  border-radius: 5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0 10px;
  box-shadow: none;
  flex-shrink: 0;
  position: relative;
  background: #ffffff;
}

.tech-icon-item img {
  width: 50px;
  height: 50px;
  object-fit: contain;
  filter: drop-shadow(2px 2px 0 rgba(0, 0, 0, 0.4)) brightness(0.9);
}

/* 第一层：打字机文字 */
.typewriter-layer {
  position: relative;
  z-index: 3;
  padding: 1.5rem 2rem;
  width: 100%;
  box-sizing: border-box;
}

.typewriter-content {
  text-align: left;
  font-family: var(--vp-font-family-base);
  width: 100%;
}

.typewriter-line {
  font-size: 1.8rem;
  line-height: 1.4;
  color: var(--vp-c-text-1);
  text-align: left;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.typewriter-dynamic {
  color: var(--vp-c-brand);
  font-weight: 600;
  min-height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.dynamic-text {
  display: inline-block;
}

.cursor {
  display: inline-block;
  margin-left: 2px;
  font-weight: 700;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* 深色模式适配 */
.dark .tech-icon-item[style*="background:#fff"] {
  background: #333 !important;
}

.dark .tech-icon-item {
  background: #2a2a2a;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .gradient-background {
    width: 100%;
  }
  .tech-stack-layer {
    width: 100%; /* 移动端100% */
  }
  
  .tech-icons-container {
    transform: rotate(30deg) scale(1.2) translateY(-70px) translateX(30px);
  }
  
  .tech-icon-item {
    width: 60px;
    height: 60px;
    margin: 0 8px;
  }
  
  .tech-icon-item img {
    width: 35px;
    height: 35px;
  }
}
</style> 