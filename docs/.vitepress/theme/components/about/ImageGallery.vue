<template>
  <div class="image-card" :class="{ 'full-width': size === 'large' }">
    <div 
      class="gallery-item"
      @mouseenter="showDrawer = true"
      @mouseleave="showDrawer = false"
    >
      <div class="image-container">
        <img :src="image" :alt="title" />
      </div>
      <div class="drawer" :class="{ 'drawer-open': showDrawer }">
        <h3>{{ title }}</h3>
        <p>{{ description }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// 定义组件的属性
const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    required: true
  },
  size: {
    type: String,
    default: 'small', // 'small' 或 'large'
    validator: (value) => ['small', 'large'].includes(value)
  }
});

// 控制抽屉显示的状态
const showDrawer = ref(false);
</script>

<style scoped>
.image-card {
  width: 48%;
  margin-bottom: 2rem;
  background: linear-gradient(135deg, rgba(89, 89, 89, 0.05) 0%, rgba(174, 174, 174, 0.1) 100%);
  border-radius: 8px;
  padding: 0.5rem;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.05);
  transform: perspective(800px) rotateX(2deg);
  transition: all 0.3s ease;
}

.full-width {
  width: 100%;
}

.gallery-item {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  height: 280px;
}

.image-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.gallery-item:hover .image-container img {
  transform: scale(1.05);
}

.drawer {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
  padding: 1rem;
  color: #fff;
  transform: translateY(100%);
  transition: transform 0.3s ease;
}

.drawer-open {
  transform: translateY(0);
}

.drawer h3 {
  margin: 0 0 0.5rem;
  font-size: 1.2rem;
}

.drawer p {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.9;
}

@media (max-width: 768px) {
  .image-card {
    width: 100%;
  }
  
  .gallery-item {
    height: 200px;
  }
}
</style> 