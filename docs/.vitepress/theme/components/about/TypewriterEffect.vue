<template>
  <div class="typewriter-box">
    <div class="typewriter-content">
      <div class="typewriter-line">我要成为</div>
      <div class="typewriter-line typewriter-dynamic">
        <span ref="dynamicText" class="dynamic-text"></span>
        <span class="cursor">|</span>
      </div>
      <div class="typewriter-line">高手</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const dynamicText = ref(null);
let currentTimeout = null;
let currentIndex = 0;
let currentText = '';
let isDeleting = false;
let typingSpeed = 150; // 打字速度(ms)
let pauseTime = 3000; // 完成一个词后暂停时间(ms)
let currentTech = ''; // 当前正在处理的技术名称

// 技术栈列表
const techStack = [
  'HTML',
  'CSS',
  'JavaScript',
  'TypeScript',
  'Vue.js',
  'Axios',
  'Node.js',
  'Python',
  'Git',
  'Docker',
  'Kubernetes',
  'VitePress',
  '全栈(真的吗',
  '前端'
];

// 随机获取一个技术
function getRandomTech() {
  return techStack[Math.floor(Math.random() * techStack.length)];
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

onMounted(() => {
  // 开始打字效果
  typeEffect();
});

onUnmounted(() => {
  // 清除任何未完成的定时器
  if (currentTimeout) {
    clearTimeout(currentTimeout);
  }
});
</script>

<style scoped>
.typewriter-box {
  background: linear-gradient(135deg, rgba(89, 89, 89, 0.05) 0%, rgba(174, 174, 174, 0.1) 100%);
  border-radius: 8px;
  padding: 1.5rem 2rem;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.05);
  transform: perspective(800px) rotateX(2deg);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  width: 50%;
  min-height: 120px;
  display: flex;
  align-items: center;
  backdrop-filter: blur(4px);
}

.typewriter-content {
  text-align: left;
  font-family: var(--vp-font-family-base);
  width: 100%;
  position: relative;
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

@media (max-width: 768px) {
  .typewriter-box {
    width: 100%;
    min-height: 100px;
    padding: 1rem;
  }
  
  .typewriter-line {
    font-size: 1.5rem;
  }
}
</style> 