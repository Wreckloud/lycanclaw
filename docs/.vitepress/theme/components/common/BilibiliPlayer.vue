<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  aid: {
    type: String,
    default: ''
  },
  bvid: {
    type: String,
    default: ''
  },
  cid: {
    type: String,
    default: ''
  },
  page: {
    type: String,
    default: '1'
  },
  autoplay: {
    type: Boolean,
    default: false
  }
})

const videoLoaded = ref(false)
const containerRef = ref(null)

// 使用Intersection Observer进行懒加载
onMounted(() => {
  if (typeof IntersectionObserver !== 'undefined') {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          videoLoaded.value = true
          observer.disconnect()
        }
      })
    }, { threshold: 0.1 })
    
    if (containerRef.value) {
      observer.observe(containerRef.value)
    }
  } else {
    // 降级处理：如果不支持IntersectionObserver，直接加载
    videoLoaded.value = true
  }
})

// 构建播放器URL
const getPlayerUrl = () => {
  let url = 'https://player.bilibili.com/player.html?'
  if (props.bvid) url += `bvid=${props.bvid}&`
  if (props.aid) url += `aid=${props.aid}&`
  if (props.cid) url += `cid=${props.cid}&`
  url += `page=${props.page}&`
  url += `autoplay=${props.autoplay ? 1 : 0}`
  return url
}
</script>

<template>
  <div 
    ref="containerRef"
    class="bilibili-player-container"
  >
    <iframe 
      v-if="videoLoaded"
      :src="getPlayerUrl()"
      class="bilibili-player"
      scrolling="no" 
      border="0" 
      frameborder="no" 
      framespacing="0" 
      allowfullscreen="true"
    ></iframe>
    <div v-else class="video-placeholder">
      <div class="loading-text">视频加载中...</div>
    </div>
  </div>
</template>

<style scoped>
.bilibili-player-container {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9比例 */
  background-color: #f4f4f4;
  border-radius: 3px;
  overflow: hidden;
}

.bilibili-player {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
}

.video-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f4f4f4;
  color: #888;
}

.loading-text {
  font-size: 16px;
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .video-placeholder {
    background-color: #2a2a2a;
    color: #aaa;
  }
}
</style> 