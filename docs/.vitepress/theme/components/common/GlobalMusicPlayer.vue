<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted, watch } from 'vue'
import audioManager from '../../utils/audioManager'
import audioService from '../../utils/audioService'

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
// 是否显示详细信息（展开状态）
const isExpanded = ref(true)
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
    audioService.pause()
    audioManager.pauseCurrent(currentSong.value.id)
  } else {
    // 如果已暂停，则播放
    const songInfo = {
      name: currentSong.value.name,
      artist: currentSong.value.artist,
      cover: currentSong.value.cover,
      url: ''  // 这里URL可能为空，但audioService会从缓存中恢复
    }
    
    audioService.play(currentSong.value.id, songInfo, currentSong.value.currentTime)
      .catch(error => {
        console.error('播放失败:', error)
      })
  }
}

// 切换展开/收起状态
function toggleExpand() {
  isExpanded.value = !isExpanded.value
}

// 关闭播放器
function closePlayer() {
  isVisible.value = false
  
  // 如果正在播放，先暂停
  if (currentSong.value.isPlaying) {
    audioService.pause()
    audioManager.pauseCurrent(currentSong.value.id)
  }
}

// 设置进度
function setProgress(e: MouseEvent) {
  if (!currentSong.value.id || !currentSong.value.isPlaying || isDragging.value) return
  
  const progressBar = e.currentTarget as HTMLElement
  const rect = progressBar.getBoundingClientRect()
  const percent = (e.clientX - rect.left) / rect.width
  
  // 限制百分比在0-1之间
  const boundedPercent = Math.max(0, Math.min(1, percent))
  const newTime = boundedPercent * currentSong.value.duration
  
  // 直接使用audioService设置进度
  audioService.seek(newTime)
}

// 开始拖动进度条
function startDrag(e: MouseEvent | TouchEvent) {
  if (!currentSong.value.id || !currentSong.value.isPlaying) return
  
  isDragging.value = true
  
  if (e.type === 'touchstart') {
    updateProgressFromTouch(e as TouchEvent)
    
    // 添加触摸事件监听
    document.addEventListener('touchmove', updateProgressFromTouch, { passive: false })
    document.addEventListener('touchend', stopDrag)
  } else {
    updateProgressFromEvent(e as MouseEvent)
    
    // 添加鼠标事件监听
    document.addEventListener('mousemove', updateProgressFromEvent)
    document.addEventListener('mouseup', stopDrag)
  }
}

// 从鼠标事件更新进度
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

// 从触摸事件更新进度
function updateProgressFromTouch(e: TouchEvent) {
  if (!isDragging.value || !currentSong.value.id) return
  
  // 阻止触摸事件的默认行为（如滚动）
  e.preventDefault()
  
  const progressBar = document.querySelector('.global-progress-bar') as HTMLElement
  if (!progressBar) return
  
  const touch = e.touches[0] || e.changedTouches[0]
  const rect = progressBar.getBoundingClientRect()
  let percent = (touch.clientX - rect.left) / rect.width
  
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
  
  // 直接使用audioService设置进度
  audioService.seek(newTime)
  
  // 移除全局事件监听
  document.removeEventListener('mousemove', updateProgressFromEvent)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', updateProgressFromTouch)
  document.removeEventListener('touchend', stopDrag)
}

// 监听音频事件
onMounted(() => {
  // 同步当前歌曲信息（从audioManager获取）
  const savedSongInfo = audioManager.getCurrentSongInfo();
  if (savedSongInfo) {
    currentSong.value = savedSongInfo;
    isVisible.value = true; // 如果有歌曲信息，则显示播放器
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
        
        // 如果有歌曲信息，则显示播放器
        if (songInfo.id) {
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
          currentSong.value.isPlaying = isPlaying === 'true'
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
        // 歌曲结束后不隐藏播放器，只更新状态
        currentSong.value.isPlaying = false
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
          isVisible.value = true;
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
    <div v-if="isVisible" class="global-music-player" :class="{ 'expanded': isExpanded }">
      <!-- 封面区域 -->
      <div class="cover-section">
        <div class="cover-container" :class="{ 'rotating': currentSong.isPlaying }" @click="togglePlay">
          <img v-if="currentSong.cover" :src="currentSong.cover" :alt="currentSong.name" class="cover-image" />
          <div v-else class="cover-placeholder">
            <div class="music-note">♪</div>
          </div>
          
          <!-- 播放遮罩层 -->
          <div v-if="!currentSong.isPlaying" class="play-overlay">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </div>
        </div>
        
        <!-- 收起状态下的展开按钮 -->
        <button v-if="!isExpanded" class="control-btn expand-toggle-btn" @click="toggleExpand" aria-label="展开">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>
      
      <!-- 详细信息区域 -->
      <div v-if="isExpanded" class="player-detail">
        <!-- 歌曲信息和进度条 -->
        <div class="song-info">
          <div class="song-title-row">
            <div class="song-name">{{ currentSong.name || '未知歌曲' }}</div>
            <div class="time-info">
              <span class="current-time">{{ formattedCurrentTime }}</span>
              <span class="duration">/ {{ formattedDuration }}</span>
            </div>
          </div>
          
          <div class="song-artist">{{ currentSong.artist || '未知艺术家' }}</div>
          
          <!-- 进度条 -->
          <div 
            class="global-progress-bar" 
            :class="{ 'disabled': !currentSong.isPlaying }"
            @click="setProgress"
            @mousedown="startDrag"
            @touchstart="startDrag"
          >
            <div class="progress-bg"></div>
            <div class="progress-fill" :style="{ width: `${currentSong.progress}%` }"></div>
            <div class="progress-handle" :style="{ left: `${currentSong.progress}%` }" :class="{ 'visible': isDragging || currentSong.isPlaying }"></div>
          </div>
        </div>
        
        <!-- 控制按钮区 -->
        <div class="controls-row">
          <div class="right-controls">
            <!-- 收起按钮 -->
            <button class="control-btn collapse-btn" @click="toggleExpand" aria-label="收起">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            
            <!-- 关闭按钮 -->
            <button class="control-btn close-btn" @click="closePlayer" aria-label="关闭">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
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
  width: 72px; /* 默认宽度，只显示封面 */
  border-right: 1px solid var(--vp-c-divider);
  border-top: 1px solid var(--vp-c-divider);
  border-bottom: 1px solid var(--vp-c-divider);
  display: flex;
  flex-direction: row;
  height: 60px; /* 固定高度 */
}

/* 展开状态 */
.global-music-player.expanded {
  width: 280px;
}

/* 封面区域 */
.cover-section {
  width: 60px;
  height: 60px;
  position: relative;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-container {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease;
  position: relative;
  cursor: pointer;
}

/* 播放遮罩层 */
.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.cover-container:hover .play-overlay {
  opacity: 1;
}

/* 旋转动画 */
@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.cover-container.rotating {
  animation: rotate 25s linear infinite;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--vp-c-brand) 0%, var(--vp-c-brand-dark) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.music-note {
  font-size: 24px;
  color: white;
}

/* 收起状态下的展开按钮 */
.expand-toggle-btn {
  position: absolute;
  right: -10px;
  top: 50%;
  transform: translateY(-50%);
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  color: var(--vp-c-text-2);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* 详细信息区域 */
.player-detail {
  flex-grow: 1;
  padding: 8px 12px;
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 220px;
  animation: slide-in-right 0.3s ease-out;
  height: 100%;
}

@keyframes slide-in-right {
  from {
    transform: translateX(-20px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.song-info {
  flex: 1;
  min-width: 0;
  padding-right: 8px;
}

.song-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: -6px;
}

.song-name {
  font-weight: 500;
  color: var(--vp-c-text-1);
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
  padding-right: 4px;
}

.song-artist {
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.global-progress-bar {
  height: 3px;
  position: relative;
  cursor: pointer;
  touch-action: none;
  width: 100%;
}

.global-progress-bar.disabled {
  cursor: default;
  opacity: 0.7;
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
  width: 8px;
  height: 8px;
  background-color: var(--vp-c-brand);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  display: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.global-progress-bar:not(.disabled):hover .progress-handle,
.progress-handle.visible {
  display: block;
}

.time-info {
  display: flex;
  align-items: center;
  font-size: 0.65rem;
  color: var(--vp-c-text-2);
  white-space: nowrap;
  flex-shrink: 0;
}

.current-time {
  color: var(--vp-c-brand);
  margin-right: 2px;
}

.controls-row {
  display: flex;
  align-items: center;
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
  transition: all 0.2s ease;
}

.control-btn:hover {
  background-color: var(--vp-c-bg-alt);
}

.right-controls {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.collapse-btn, .close-btn {
  width: 20px;
  height: 20px;
  padding: 2px;
}

.close-btn {
  color: var(--vp-c-text-2);
}

.close-btn:hover {
  color: var(--vp-c-text-1);
  background-color: rgba(220, 38, 38, 0.1);
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
  transform: translateX(-60px);
  opacity: 0;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .global-music-player {
    bottom: 20px;
  }
  
  .global-music-player.expanded {
    width: 260px;
  }
  
  .player-detail {
    width: 200px;
    padding: 8px 10px;
  }
}

/* 小屏幕设备适配 */
@media (max-width: 370px) {
  .global-music-player.expanded {
    width: 220px;
  }
  
  .player-detail {
    width: 160px;
    padding: 8px 6px;
  }
}
</style> 