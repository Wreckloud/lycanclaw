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
// 是否显示封面（二级折叠状态）
const showCover = ref(true)
// 是否正在拖动进度条
const isDragging = ref(false)
// 自动收起定时器
const autoCollapseTimer = ref<number | null>(null)
// 三级折叠定时器
const miniModeTimer = ref<number | null>(null)
// 鼠标是否悬停在封面上
const isHovering = ref(false)
// 是否是触摸设备
const isTouchDevice = ref(false)

// 封面旋转角度
const coverRotation = ref(0)
// 封面旋转动画ID
const rotationAnimationId = ref<number | null>(null)
// 上次暂停时的角度
const lastPausedRotation = ref(0)

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
// 计算属性：封面旋转样式
const coverRotationStyle = computed(() => {
  return {
    transform: `rotate(${coverRotation.value}deg)`
  }
})

// 开始封面旋转动画
function startRotation() {
  if (rotationAnimationId.value) return
  
  const startTime = performance.now()
  // 从上次暂停的角度开始旋转
  const startRotation = lastPausedRotation.value
  coverRotation.value = startRotation
  
  // 每秒旋转30度（缓慢旋转）
  const rotationSpeed = 30 / 1000
  
  const animate = (currentTime: number) => {
    const elapsedTime = currentTime - startTime
    coverRotation.value = startRotation + (elapsedTime * rotationSpeed)
    
    // 保持在0-360度范围内
    if (coverRotation.value >= 360) {
      coverRotation.value -= 360
    }
    
    rotationAnimationId.value = requestAnimationFrame(animate)
  }
  
  rotationAnimationId.value = requestAnimationFrame(animate)
}

// 停止封面旋转动画
function stopRotation() {
  if (rotationAnimationId.value) {
    cancelAnimationFrame(rotationAnimationId.value)
    rotationAnimationId.value = null
    // 保存当前角度
    lastPausedRotation.value = coverRotation.value
  }
}

// 重置封面旋转角度
function resetRotation() {
  // 如果正在旋转，先停止
  stopRotation()
  
  // 动画过渡到0度
  const startRotation = coverRotation.value
  const startTime = performance.now()
  const duration = 800 // 过渡时间，毫秒
  
  const animateReset = (currentTime: number) => {
    const elapsedTime = currentTime - startTime
    const progress = Math.min(elapsedTime / duration, 1)
    
    // 使用缓动函数使动画更自然
    const easeOutProgress = 1 - Math.pow(1 - progress, 3)
    coverRotation.value = startRotation * (1 - easeOutProgress)
    
    if (progress < 1) {
      requestAnimationFrame(animateReset)
    } else {
      coverRotation.value = 0
      lastPausedRotation.value = 0 // 重置暂停角度
    }
  }
  
  requestAnimationFrame(animateReset)
}

// 切换播放/暂停
function togglePlay(event?: Event) {
  // 如果是三级折叠状态，禁用播放/暂停功能
  if (!showCover.value) {
    return
  }
  
  if (!currentSong.value.id) return
  
  if (currentSong.value.isPlaying) {
    // 如果正在播放，则暂停
    audioService.pause()
    audioManager.pauseCurrent(currentSong.value.id)
    
    // 停止封面旋转
    stopRotation()
    
    // 清除自动收起定时器
    if (autoCollapseTimer.value) {
      clearTimeout(autoCollapseTimer.value)
      autoCollapseTimer.value = null
    }
    
    // 清除三级折叠定时器
    if (miniModeTimer.value) {
      clearTimeout(miniModeTimer.value)
      miniModeTimer.value = null
    }
    
    // 如果是三级折叠状态，恢复封面显示
    if (!showCover.value) {
      showCover.value = true
    }
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
    
    // 开始封面旋转
    startRotation()
      
    // 设置自动收起定时器
    scheduleAutoCollapse()
  }
}

// 设置自动收起定时器
function scheduleAutoCollapse() {
  // 清除现有定时器
  if (autoCollapseTimer.value) {
    clearTimeout(autoCollapseTimer.value)
  }
  
  // 3秒后直接进入三级折叠（只显示控制按钮）
  autoCollapseTimer.value = window.setTimeout(() => {
    if (currentSong.value.isPlaying) {
      isExpanded.value = false
      showCover.value = false // 直接进入三级折叠
    }
    autoCollapseTimer.value = null
  }, 3000) // 从5秒改为3秒
}

// 不再需要单独的三级折叠定时器
// function scheduleMiniMode() {
//   if (miniModeTimer.value) {
//     clearTimeout(miniModeTimer.value)
//   }
//   
//   miniModeTimer.value = window.setTimeout(() => {
//     if (currentSong.value.isPlaying && !isExpanded.value) {
//       showCover.value = false
//     }
//     miniModeTimer.value = null
//   }, 10000)
// }

// 切换展开/收起状态
function toggleExpand(event?: Event) {
  // 检查是否是触摸事件
  const isTouchEvent = event && (event.type === 'touchend' || (event as any).pointerType === 'touch')
  
  // 如果是触摸设备或触摸事件
  if (isTouchDevice.value || isTouchEvent) {
    // 触摸设备上，直接展开到完整状态
    if (!isExpanded.value || !showCover.value) {
      isExpanded.value = true
      showCover.value = true
      
      // 如果正在播放，设置自动收起定时器
      if (currentSong.value.isPlaying) {
        scheduleAutoCollapse()
      }
      return
    }
    
    // 如果已经是完全展开状态，则收起到三级折叠
    isExpanded.value = false
    showCover.value = false
    return
  }
  
  // 以下是鼠标设备的逻辑
  // 如果当前是三级折叠状态，先恢复到完全展开
  if (!showCover.value) {
    showCover.value = true
    isExpanded.value = true
    
    // 如果正在播放，设置自动收起定时器
    if (currentSong.value.isPlaying) {
      scheduleAutoCollapse()
    }
    return
  }
  
  // 如果当前是二级折叠状态，恢复到完全展开
  if (!isExpanded.value && showCover.value) {
    isExpanded.value = true
    
    // 如果正在播放，设置自动收起定时器
    if (currentSong.value.isPlaying) {
      scheduleAutoCollapse()
    }
    return
  }
  
  // 如果当前是完全展开状态，直接进入三级折叠
  if (isExpanded.value) {
    isExpanded.value = false
    showCover.value = false
  }
}

// 鼠标进入播放器
function handlePlayerMouseEnter() {
  // 清除所有自动收起定时器
  if (autoCollapseTimer.value) {
    clearTimeout(autoCollapseTimer.value)
    autoCollapseTimer.value = null
  }
  
  if (miniModeTimer.value) {
    clearTimeout(miniModeTimer.value)
    miniModeTimer.value = null
  }
  
  // 如果是三级折叠状态，恢复到二级折叠
  if (!showCover.value) {
    showCover.value = true
    isExpanded.value = false // 确保只显示到二级折叠
  }
}

// 鼠标离开播放器
function handlePlayerMouseLeave() {
  // 只有在播放状态下才设置自动收起定时器
  if (currentSong.value.isPlaying) {
    // 清除现有定时器
    if (autoCollapseTimer.value) {
      clearTimeout(autoCollapseTimer.value)
    }
    
    // 设置新的定时器，2秒后收起
    autoCollapseTimer.value = window.setTimeout(() => {
      // 如果是完全展开状态，直接收起到三级折叠
      if (isExpanded.value) {
        isExpanded.value = false
        showCover.value = false
      } 
      // 如果是二级折叠状态，收起到三级折叠
      else if (showCover.value) {
        showCover.value = false
      }
      
      autoCollapseTimer.value = null
    }, 2000)
  }
}

// 鼠标进入封面区域
function handleMouseEnter() {
  isHovering.value = true
}

// 鼠标离开封面区域
function handleMouseLeave() {
  isHovering.value = false
}

// 关闭播放器
function closePlayer() {
  isVisible.value = false
  
  // 如果正在播放，先暂停
  if (currentSong.value.isPlaying) {
    audioService.pause()
    audioManager.pauseCurrent(currentSong.value.id)
  }
  
  // 发送播放器关闭事件，通知其他组件
  audioManager.emit('player-closed', currentSong.value.id)
  
  // 清除自动收起定时器
  if (autoCollapseTimer.value) {
    clearTimeout(autoCollapseTimer.value)
    autoCollapseTimer.value = null
  }
  
  // 清除三级折叠定时器
  if (miniModeTimer.value) {
    clearTimeout(miniModeTimer.value)
    miniModeTimer.value = null
  }
  
  // 重置状态
  isExpanded.value = true
  showCover.value = true
  
  // 停止封面旋转
  stopRotation()
  
  // 重置旋转角度
  resetRotation()
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

// 检测是否是触摸设备
function detectTouchDevice() {
  isTouchDevice.value = 'ontouchstart' in window || 
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
}

// 组件挂载时
onMounted(() => {
  // 检测是否是触摸设备
  detectTouchDevice()
  
  // 监听窗口大小变化，重新检测设备类型
  window.addEventListener('resize', detectTouchDevice)
  
  // 同步当前歌曲信息（从audioManager获取）
  const savedSongInfo = audioManager.getCurrentSongInfo();
  if (savedSongInfo && savedSongInfo.isPlaying) {
    currentSong.value = savedSongInfo;
    isVisible.value = true; // 只有在播放状态下才显示播放器
    
    // 如果正在播放，设置自动收起定时器
    scheduleAutoCollapse();
  } else {
    isVisible.value = false; // 不在播放状态则隐藏
  }
  
  // 监听歌曲信息更新
  const unsubscribers: Array<() => void> = []
  
  // 监听播放状态变化
  unsubscribers.push(
    audioManager.on('song-info-update', (data) => {
      try {
        const songInfo = JSON.parse(data)
        
        // 检查是否是新的歌曲
        const isNewSong = currentSong.value.id !== songInfo.id
        
        // 更新歌曲信息
        currentSong.value = {
          ...currentSong.value,
          ...songInfo
        }
        
        // 只有在播放状态下才显示播放器
        if (songInfo.id && songInfo.isPlaying) {
          isVisible.value = true
          
          // 如果是新歌曲，完全展开播放器
          if (isNewSong) {
            isExpanded.value = true
            showCover.value = true
          }
          
          // 设置自动收起定时器
          scheduleAutoCollapse()
        } else if (!songInfo.isPlaying) {
          // 如果不是播放状态，可以考虑是否隐藏播放器
          // 这里保留显示，但不再自动收起
          if (autoCollapseTimer.value) {
            clearTimeout(autoCollapseTimer.value)
            autoCollapseTimer.value = null
          }
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
          const newPlayingState = isPlaying === 'true'
          const previousPlayingState = currentSong.value.isPlaying
          currentSong.value.isPlaying = newPlayingState
          
          // 如果开始播放，显示播放器并设置自动收起定时器
          if (newPlayingState) {
            isVisible.value = true
            scheduleAutoCollapse()
            // 开始封面旋转
            startRotation()
          } else if (previousPlayingState) { // 只在从播放状态变为暂停状态时执行
            // 如果停止播放，清除自动收起定时器
            if (autoCollapseTimer.value) {
              clearTimeout(autoCollapseTimer.value)
              autoCollapseTimer.value = null
            }
            // 停止封面旋转
            stopRotation()
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
        // 歌曲结束后不隐藏播放器，只更新状态
        currentSong.value.isPlaying = false
        // 重置封面旋转
        resetRotation()
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
          // 如果切换了新歌曲，重置封面旋转
          resetRotation();
          currentSong.value = songInfo;
          isVisible.value = true;
          
          // 切换歌曲时，完全展开播放器
          isExpanded.value = true;
          showCover.value = true;
          
          // 如果新歌曲是播放状态，开始旋转并设置自动收起定时器
          if (songInfo.isPlaying) {
            startRotation();
            scheduleAutoCollapse();
          }
        }
      }
    })
  )
  
  // 组件卸载时清理事件监听和定时器
  onUnmounted(() => {
    unsubscribers.forEach(unsub => unsub())
    
    if (autoCollapseTimer.value) {
      clearTimeout(autoCollapseTimer.value)
      autoCollapseTimer.value = null
    }
    
    if (miniModeTimer.value) {
      clearTimeout(miniModeTimer.value)
      miniModeTimer.value = null
    }
    
    // 停止封面旋转动画
    stopRotation()
    
    // 移除窗口大小变化监听器
    window.removeEventListener('resize', detectTouchDevice)
  })
  
  // 初始化时，如果有正在播放的歌曲，开始旋转
  if (savedSongInfo && savedSongInfo.isPlaying) {
    startRotation();
  }
})
</script>

<template>
  <Transition name="slide-fade">
    <div v-if="isVisible" class="global-music-player" 
      :class="{ 'expanded': isExpanded, 'mini-mode': !showCover, 'touch-device': isTouchDevice }" 
      @mouseenter="handlePlayerMouseEnter" @mouseleave="handlePlayerMouseLeave">
      <!-- 封面区域 - 在二级和一级折叠状态下显示 -->
      <div v-if="showCover" class="cover-section" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave">
        <div class="cover-container" @click="togglePlay">
          <div class="rotating-cover" :style="coverRotationStyle">
            <img v-if="currentSong.cover" :src="currentSong.cover" :alt="currentSong.name" class="cover-image" />
            <div v-else class="cover-placeholder">
              <div class="music-note">♪</div>
            </div>
          </div>
          
          <!-- 播放按钮 - 在暂停时显示 -->
          <div v-if="!currentSong.isPlaying" class="play-overlay">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </div>
          
          <!-- 暂停按钮 - 在播放且鼠标悬停时显示 -->
          <div v-if="currentSong.isPlaying && isHovering" class="pause-overlay">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="6" y1="4" x2="6" y2="20"></line>
              <line x1="18" y1="4" x2="18" y2="20"></line>
            </svg>
          </div>
        </div>
      </div>
      
      <!-- 控制按钮区域 - 收起状态 -->
      <div v-if="!isExpanded" class="controls-panel collapsed">
        <button class="control-btn expand-btn" @click="toggleExpand" @touchend.prevent="toggleExpand($event)" aria-label="展开">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
        <button class="control-btn close-btn" @click="closePlayer" @touchend.prevent="closePlayer" aria-label="关闭">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- 详细信息区域 - 只在一级折叠（完全展开）状态下显示 -->
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
      </div>

      <!-- 控制按钮区域 - 展开状态 -->
      <div v-if="isExpanded" class="controls-panel expanded">
        <button class="control-btn collapse-btn" @click="toggleExpand" @touchend.prevent="toggleExpand($event)" aria-label="收起">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <button class="control-btn close-btn" @click="closePlayer" @touchend.prevent="closePlayer" aria-label="关闭">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
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
  transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1); /* 使用更平滑的过渡曲线 */
  display: flex;
  flex-direction: row;
  height: 60px; /* 固定高度 */
  user-select: none; /* 防止文字被选中 */
  will-change: width; /* 提示浏览器优化宽度变化的性能 */
}

/* 收起状态 */
.global-music-player:not(.expanded) {
  width: 86px; /* 缩小为原来的2/3 */
}

/* 三级折叠状态 - 只显示控制按钮 */
.global-music-player.mini-mode {
  width: 26px; /* 只有控制面板的宽度 */
}

/* 展开状态 */
.global-music-player.expanded {
  width: 280px;
}

/* 触摸设备特有样式 */
/* 增加按钮点击区域 */
.global-music-player.touch-device .control-btn {
  width: 24px;
  height: 24px;
  padding: 4px;
}

/* 确保三级折叠状态下的按钮更容易点击 */
.global-music-player.touch-device.mini-mode .controls-panel.collapsed {
  width: 30px;
  padding: 0 2px;
}

/* 触摸设备下，按钮不需要悬浮效果 */
.global-music-player.touch-device .control-btn:hover {
  transform: none;
  background-color: transparent;
}

/* 但保留点击效果 */
.global-music-player.touch-device .control-btn:active {
  transform: scale(0.9);
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
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  position: relative;
  cursor: pointer;
  border-radius: 50%; /* 使封面成为圆形 */
}

/* 旋转封面容器 */
.rotating-cover {
  width: 100%;
  height: 100%;
  position: relative;
  /* 使用更平滑的过渡效果 */
  transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  will-change: transform; /* 提示浏览器优化变换 */
}

/* 移除唱片中心点样式 */
/* .rotating-cover::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  background-color: var(--vp-c-bg-soft);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 0 2px var(--vp-c-divider);
  z-index: 2;
} */

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
}

/* 暂停遮罩层 */
.pause-overlay {
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

.cover-section:hover .pause-overlay {
  opacity: 1;
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

/* 控制按钮区域 */
.controls-panel {
  background-color: var(--vp-c-bg-alt); /* 移除绿色背景，使用主题默认颜色 */
  display: flex;
  flex-direction: column;
  flex-shrink: 0; /* 防止被挤压 */
}

/* 收起状态的控制面板 */
.controls-panel.collapsed {
  width: 26px; /* 固定宽度 */
  height: 100%;
  justify-content: center;
  gap: 8px;
}

/* 展开状态的控制面板 */
.controls-panel.expanded {
  width: 26px; /* 固定宽度 */
  height: 100%;
  justify-content: center;
  gap: 8px;
}

.control-btn {
  background: transparent;
  border: none;
  color: var(--vp-c-text-2); /* 使用主题默认文本颜色 */
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  width: 20px; /* 缩小按钮尺寸 */
  height: 20px; /* 缩小按钮尺寸 */
  padding: 0;
  margin: 0 auto;
  border-radius: 2px;
  -webkit-tap-highlight-color: transparent; /* 移除移动端点击高亮 */
}

.control-btn:hover {
  background-color: var(--vp-c-bg-mute); /* 使用主题默认悬停颜色 */
  color: var(--vp-c-text-1);
  transform: scale(1.1); /* 轻微放大效果 */
}

.control-btn:active {
  transform: scale(0.95); /* 点击时的按压效果 */
}

/* 详细信息区域 */
.player-detail {
  flex-grow: 1;
  padding: 8px 12px;
  display: flex;
  flex-direction: row;
  align-items: center;
  animation: slide-in-right 0.3s ease-out;
  height: 100%;
  position: relative;
  min-width: 0; /* 允许内容收缩 */
  overflow: hidden; /* 防止内容溢出 */
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
  min-width: 0; /* 允许内容收缩 */
  width: 100%; /* 确保占满可用空间 */
  overflow: hidden; /* 防止内容溢出 */
}

.song-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: -6px;
  position: relative;
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
  padding-right: 60px;
  user-select: none; /* 防止文字被选中 */
}

.song-artist {
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  user-select: none; /* 防止文字被选中 */
  margin-right: 5px; /* 确保右侧有一点空间 */
}

.time-info {
  position: absolute;
  top: 0;
  right: 0;
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
  opacity: 0.8;
  width: 55px;
  text-align: right;
  white-space: nowrap;
}

.global-progress-bar {
  height: 3px;
  position: relative;
  cursor: pointer;
  touch-action: none;
  width: 100%;
  margin-bottom: 6px;
  margin-left: 0;
  z-index: 2; /* 确保进度条在最上层 */
  padding: 8px 0; /* 增加上下内边距，确保圆点可见 */
}

.global-progress-bar.disabled {
  cursor: default;
  opacity: 0.7;
}

.progress-bg {
  position: absolute;
  top: 8px; /* 调整位置以适应内边距 */
  left: 0;
  right: 0;
  height: 3px; /* 明确设置高度 */
  background-color: var(--vp-c-bg-alt);
  border-radius: 2px;
}

.progress-fill {
  position: absolute;
  top: 8px; /* 调整位置以适应内边距 */
  left: 0;
  height: 3px; /* 明确设置高度 */
  background-color: var(--vp-c-brand);
  border-radius: 2px;
  transition: width 0.1s linear;
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
  user-select: none; /* 防止文字被选中 */
}

.current-time {
  color: var(--vp-c-brand);
  margin-right: 2px;
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
    width: 260px; /* 移动端稍微缩小宽度 */
  }
  
  .player-detail {
    padding: 8px 10px;
  }
}

/* 小屏幕设备适配 */
@media (max-width: 370px) {
  .global-music-player.expanded {
    width: 260px;
  }
  
  .player-detail {
    padding: 8px 6px;
  }
}
</style> 