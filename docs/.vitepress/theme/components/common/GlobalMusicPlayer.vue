<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted, watch } from 'vue'
import audioManager from '../../utils/audioManager'

// 当前播放歌曲的信息
const currentSong = ref<{
  id: string,
  name: string,
  artist: string,
  cover: string,
  isPlaying: boolean,
  progress: number,
  duration: number,
  currentTime: number
}>({
  id: '',
  name: '',
  artist: '',
  cover: '',
  isPlaying: false,
  progress: 0,
  duration: 0,
  currentTime: 0
})

// 是否显示播放器
const isVisible = ref(false)
// 是否显示详细信息
const showDetail = ref(false)
// 是否正在拖动进度条
const isDragging = ref(false)

// 格式化时间
function formatTime(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds)) return '0:00'
  
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}

// 计算属性：格式化的当前时间
const formattedCurrentTime = computed(() => formatTime(currentSong.value.currentTime))
// 计算属性：格式化的总时长
const formattedDuration = computed(() => formatTime(currentSong.value.duration))

// 切换播放/暂停
function togglePlay() {
  if (!currentSong.value.id) return
  
  if (currentSong.value.isPlaying) {
    // 如果正在播放，则暂停
    audioManager.emit('global-pause', currentSong.value.id)
  } else {
    // 如果已暂停，则播放
    audioManager.emit('global-play', currentSong.value.id)
  }
}

// 切换详情显示
function toggleDetail() {
  showDetail.value = !showDetail.value
}

// 设置进度
function setProgress(e: MouseEvent) {
  if (!currentSong.value.id || isDragging.value) return
  
  const progressBar = e.currentTarget as HTMLElement
  const rect = progressBar.getBoundingClientRect()
  const percent = (e.clientX - rect.left) / rect.width
  
  // 限制百分比在0-1之间
  const boundedPercent = Math.max(0, Math.min(1, percent))
  
  // 发送进度更新事件
  audioManager.emit('global-seek', currentSong.value.id + ':' + (boundedPercent * currentSong.value.duration))
}

// 开始拖动进度条
function startDrag(e: MouseEvent) {
  if (!currentSong.value.id) return
  
  isDragging.value = true
  updateProgressFromEvent(e)
  
  // 添加全局事件监听
  document.addEventListener('mousemove', updateProgressFromEvent)
  document.addEventListener('mouseup', stopDrag)
}

// 从事件更新进度
function updateProgressFromEvent(e: MouseEvent) {
  if (!isDragging.value || !currentSong.value.id) return
  
  const progressBar = document.querySelector('.global-progress-bar') as HTMLElement
  if (!progressBar) return
  
  const rect = progressBar.getBoundingClientRect()
  let percent = (e.clientX - rect.left) / rect.width
  
  // 限制百分比在0-1之间
  percent = Math.max(0, Math.min(1, percent))
  
  currentSong.value.progress = percent * 100
}

// 停止拖动进度条
function stopDrag() {
  if (!isDragging.value || !currentSong.value.id) return
  
  isDragging.value = false
  
  // 计算新的播放位置
  const newTime = (currentSong.value.progress / 100) * currentSong.value.duration
  
  // 发送进度更新事件
  audioManager.emit('global-seek', currentSong.value.id + ':' + newTime)
  
  // 移除全局事件监听
  document.removeEventListener('mousemove', updateProgressFromEvent)
  document.removeEventListener('mouseup', stopDrag)
}

// 监听音频事件
onMounted(() => {
  // 同步当前歌曲信息（从audioManager获取）
  const savedSongInfo = audioManager.getCurrentSongInfo();
  if (savedSongInfo) {
    currentSong.value = savedSongInfo;
    isVisible.value = savedSongInfo.isPlaying;
  }
  
  // 监听歌曲信息更新
  const unsubscribers: Array<() => void> = []
  
  // 监听播放状态变化
  unsubscribers.push(
    audioManager.on('song-info-update', (data) => {
      try {
        const songInfo = JSON.parse(data)
        
        // 更新歌曲信息
        currentSong.value = {
          ...currentSong.value,
          ...songInfo
        }
        
        // 只有在歌曲正在播放时才显示全局控件
        if (songInfo.isPlaying) {
          isVisible.value = true
        }
      } catch (e) {
        console.error('解析歌曲信息失败', e)
      }
    })
  )
  
  // 监听进度更新
  unsubscribers.push(
    audioManager.on('progress-update', (data) => {
      if (isDragging.value) return
      
      try {
        const [id, currentTime, duration] = data.split(':')
        
        // 只更新当前播放的歌曲
        if (id === currentSong.value.id) {
          currentSong.value.currentTime = parseFloat(currentTime)
          currentSong.value.duration = parseFloat(duration)
          currentSong.value.progress = (currentSong.value.currentTime / currentSong.value.duration) * 100 || 0
        }
      } catch (e) {
        console.error('解析进度信息失败', e)
      }
    })
  )
  
  // 监听播放状态变化
  unsubscribers.push(
    audioManager.on('play-state-change', (data) => {
      try {
        const [id, isPlaying] = data.split(':')
        
        // 只更新当前播放的歌曲
        if (id === currentSong.value.id) {
          const wasPlaying = currentSong.value.isPlaying
          currentSong.value.isPlaying = isPlaying === 'true'
          
          // 根据播放状态决定是否显示全局控件
          if (currentSong.value.isPlaying) {
            isVisible.value = true
          } else if (wasPlaying) {
            // 如果是从播放状态变为暂停状态，延迟隐藏播放器
            // 这样用户可以在暂停后仍能看到控件并重新播放
            setTimeout(() => {
              // 再次检查是否仍处于暂停状态，如果是则隐藏
              if (!currentSong.value.isPlaying) {
                isVisible.value = false
                showDetail.value = false
              }
            }, 5000) // 5秒后隐藏
          }
        }
      } catch (e) {
        console.error('解析播放状态信息失败', e)
      }
    })
  )
  
  // 监听歌曲结束事件
  unsubscribers.push(
    audioManager.on('song-ended', (id) => {
      if (id === currentSong.value.id) {
        // 歌曲结束后隐藏全局控件
        isVisible.value = false
        showDetail.value = false
      }
    })
  )
  
  // 监听当前音频变更事件
  unsubscribers.push(
    audioManager.on('current-audio-changed', (id) => {
      // 如果当前显示的歌曲不是正在播放的歌曲，更新状态
      if (id && id !== currentSong.value.id) {
        const songInfo = audioManager.getCurrentSongInfo();
        if (songInfo) {
          currentSong.value = songInfo;
          isVisible.value = songInfo.isPlaying;
        }
      }
    })
  )
  
  // 组件卸载时清理事件监听
  onUnmounted(() => {
    unsubscribers.forEach(unsub => unsub())
  })
})
</script>

<template>
  <Transition name="slide-fade">
    <div v-if="isVisible" class="global-music-player" :class="{ 'show-detail': showDetail }">
      <!-- 简洁模式 -->
      <div class="player-compact">
        <!-- 封面 -->
        <div class="cover-container" @click="toggleDetail">
          <img v-if="currentSong.cover" :src="currentSong.cover" :alt="currentSong.name" class="cover-image" />
          <div v-else class="cover-placeholder"></div>
        </div>
        
        <!-- 控制区 -->
        <div class="controls">
          <!-- 播放/暂停按钮 -->
          <button class="control-btn play-btn" @click="togglePlay">
            <svg v-if="currentSong.isPlaying" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="6" y="4" width="4" height="16"></rect>
              <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </button>
          
          <!-- 展开/收起按钮 -->
          <button class="control-btn expand-btn" @click="toggleDetail">
            <svg v-if="showDetail" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        </div>
      </div>
      
      <!-- 详细模式 -->
      <div class="player-detail" v-if="showDetail">
        <!-- 歌曲信息 -->
        <div class="song-info">
          <div class="song-name">{{ currentSong.name }}</div>
          <div class="song-artist">{{ currentSong.artist }}</div>
        </div>
        
        <!-- 进度条 -->
        <div 
          class="global-progress-bar" 
          @click="setProgress"
          @mousedown="startDrag"
        >
          <div class="progress-bg"></div>
          <div class="progress-fill" :style="{ width: `${currentSong.progress}%` }"></div>
          <div class="progress-handle" :style="{ left: `${currentSong.progress}%` }"></div>
        </div>
        
        <!-- 时间信息 -->
        <div class="time-info">
          <span class="current-time">{{ formattedCurrentTime }}</span>
          <span class="duration">{{ formattedDuration }}</span>
        </div>
        
        <!-- 播放/暂停按钮 (大尺寸) -->
        <div class="center-play-control">
          <button class="control-btn play-btn-large" @click="togglePlay">
            <svg v-if="currentSong.isPlaying" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="6" y="4" width="4" height="16"></rect>
              <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.global-music-player {
  position: fixed;
  left: 0;
  bottom: 80px;
  background-color: var(--vp-c-bg-soft);
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 100;
  overflow: hidden;
  transition: all 0.3s ease;
  max-width: 300px;
  border-right: 1px solid var(--vp-c-divider);
  border-top: 1px solid var(--vp-c-divider);
  border-bottom: 1px solid var(--vp-c-divider);
}

.player-compact {
  display: flex;
  align-items: center;
  padding: 8px;
}

.cover-container {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  flex-shrink: 0;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  background-color: var(--vp-c-bg-alt);
  display: flex;
  align-items: center;
  justify-content: center;
}

.controls {
  display: flex;
  align-items: center;
  margin-left: 8px;
}

.control-btn {
  background: transparent;
  border: none;
  color: var(--vp-c-text-1);
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.control-btn:hover {
  background-color: var(--vp-c-bg-alt);
}

.play-btn {
  margin: 0 4px;
}

/* 详细模式样式 */
.player-detail {
  padding: 0 12px 12px;
}

.song-info {
  margin-bottom: 8px;
  text-align: center;
}

.song-name {
  font-weight: 500;
  color: var(--vp-c-text-1);
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-artist {
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.global-progress-bar {
  height: 4px;
  position: relative;
  cursor: pointer;
  margin: 8px 0;
}

.progress-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--vp-c-bg-alt);
  border-radius: 2px;
}

.progress-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background-color: var(--vp-c-brand);
  border-radius: 2px;
  transition: width 0.1s linear;
}

.progress-handle {
  position: absolute;
  top: 50%;
  width: 12px;
  height: 12px;
  background-color: var(--vp-c-brand);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  display: none;
}

.global-progress-bar:hover .progress-handle {
  display: block;
}

.time-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  color: var(--vp-c-text-2);
  margin-bottom: 8px;
}

.center-play-control {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 4px;
}

.play-btn-large {
  width: 40px;
  height: 40px;
  padding: 8px;
  background-color: var(--vp-c-brand-light);
  color: white;
}

.play-btn-large:hover {
  background-color: var(--vp-c-brand);
}

/* 动画 */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(-20px);
  opacity: 0;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .global-music-player {
    bottom: 20px;
  }
}
</style> 