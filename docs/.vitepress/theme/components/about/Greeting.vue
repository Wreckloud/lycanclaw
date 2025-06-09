<template>
  <div class="greeting-container">
    <div 
      class="greeting-box"
      @click="handleClick"
    >
      <span class="greeting-text">你 好 呀!</span>
      <MouseParticleEffect ref="particleEffect" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import MouseParticleEffect from './MouseParticleEffect.vue'

const particleEffect = ref(null);

// 处理点击事件，手动触发粒子效果
const handleClick = (e) => {
  // 使用暴露的方法直接触发效果
  if (particleEffect.value) {
    particleEffect.value.triggerEffect(e.clientX, e.clientY);
  }
}
</script>

<style scoped>
.greeting-container {
  margin: 2rem 0;
  display: flex;
  justify-content: center;
  width: 100%;
}

.greeting-box {
  background: linear-gradient(135deg, rgba(89, 89, 89, 0.05) 0%, rgba(174, 174, 174, 0.1) 100%);
  border-radius: 8px;
  padding: 0 2rem;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.05);
  transform: perspective(800px) rotateX(2deg);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  user-select: none; /* 防止文字被选中 */
  cursor: pointer;
  height: 120px; /* 固定高度为200px */
  width: var(--content-width, 740px); /* 使用与内容相同的宽度 */
  max-width: 100%; /* 确保不超过容器宽度 */
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent; /* 禁用移动设备上的点击高亮效果 */
  -webkit-touch-callout: none; /* 禁用长按菜单 */
}

.greeting-text {
  font-size: 8.5rem;
  font-weight: 800;
  color: var(--vp-c-text-1);
  opacity: 0.15;
  display: block;
  position: relative;
  z-index: 5;
  white-space: nowrap; /* 防止文字换行 */
  pointer-events: none; /* 让鼠标事件穿透文字 */
  letter-spacing: 0.05em;
  transform: scale(1.2);
}

/* 深色模式下的文字样式 */
.dark .greeting-text {
  opacity: 0.15;
}

@media (max-width: 768px) {
  .greeting-box {
    height: 150px; /* 移动端稍微降低高度 */
    width: 100%; /* 移动端全宽 */
    padding: 0 1rem;
  }
  
  .greeting-text {
    font-size: 3rem;
    transform: scale(1.1);
  }
}
</style> 