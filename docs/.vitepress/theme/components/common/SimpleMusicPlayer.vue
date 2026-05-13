<script setup lang="ts">
import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
import { useData } from 'vitepress'
import { useIntersectionObserver } from '@vueuse/core'
import audioManager from '../../utils/audioManager'
import audioService from '../../utils/audioService'
import { fetchTrackWithUrlById } from '../../utils/musicApi'
import { calculateProgressPercent, formatAudioTime } from '../../utils/audioUi'
import { logError } from '../../utils/logger'

// 组件属性定义
interface Props {
  name?: string             // 歌曲名称
  artist?: string          // 艺术家
  cover?: string           // 封面图片URL
  url?: string              // 音频文件URL
  autoplay?: boolean       // 是否自动播放
  neteaseid?: string       // 网易云音乐ID
}

const props = withDefaults(defineProps<Props>(), {
  name: '',
  artist: '未知艺术家',
  cover: '',
  url: '',
  autoplay: false,
  neteaseid: ''
})

// 组件状态
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(70)
const progress = ref(0)
const isVisible = ref(false)  // 用于控制动画
const isLoading = ref(true)   // 加载状态
const hasError = ref(false)   // 错误状态
const isDragging = ref(false) // 是否正在拖动进度条
const isAudioReady = ref(false) // 音频是否已准备好
const debounceTimer = ref<number | null>(null) // 用于防抖操作
const useNetease = ref(false) // 是否使用网易云播放器
const isInitialRender = ref(true) // 是否是初始渲染
const playerRef = ref<HTMLElement | null>(null) // 播放器元素引用
const progressBarRef = ref<HTMLElement | null>(null)
const animationApplied = ref(false) // 标记动画是否已应用

// 生成唯一的音频ID
const audioId = computed(() => {
  if (props.neteaseid) {
    return `netease-${props.neteaseid}`;
  } else if (props.url) {
    return `url-${props.url}`;
  } else {
    return `player-${Date.now().toString()}`;
  }
});

// 歌曲信息状态
const songInfo = ref({
  name: props.name || '',
  artist: props.artist || '未知艺术家',
  cover: props.cover || '',
  url: props.url || ''
})

// 获取主题模式
const { isDark } = useData()

// 计算属性
const formattedCurrentTime = computed(() => formatTime(currentTime.value))
const formattedDuration = computed(() => formatTime(duration.value))

// 计算网易云音乐链接
const neteaseLink = computed(() => {
  if (props.neteaseid) {
    return `https://music.163.com/#/song?id=${props.neteaseid}`;
  }
  return null;
});

// 音频控制函数
function togglePlay() {
  if (hasError.value || !isAudioReady.value) return
  
  // 防止连续快速点击导致的播放/暂停冲突
  if (debounceTimer.value) {
    clearTimeout(debounceTimer.value)
  }
  
  // 设置防抖定时器
  debounceTimer.value = window.setTimeout(() => {
    try {
      if (isPlaying.value) {
        // 暂停播放
        audioService.pause();
        audioManager.pauseCurrent(audioId.value);
        isPlaying.value = false;
      } else {
        // 通知音频管理器切换当前播放的音频
        // 这将触发current-audio-changed事件，使其他播放器重置进度条
        audioManager.setCurrentPlaying(audioId.value);
        
        // 播放音频
        audioService.play(audioId.value, songInfo.value, currentTime.value)
          .then(() => {
            isPlaying.value = true;
            // 播放成功后发送歌曲信息给全局播放器
            sendSongInfoToGlobalPlayer();
          })
          .catch(error => {
            // 只有当错误不是AbortError时才显示错误
            // AbortError已经在audioService中处理了
            if (error && error.name !== 'AbortError') {
              logError('SimpleMusicPlayer', '播放出错', error)
              isPlaying.value = false;
              
              // 发送播放失败状态
              audioManager.emit('play-state-change', `${audioId.value}:false`);
            }
          });
      }
      
      // 发送播放状态更新事件给全局播放器
      audioManager.emit('play-state-change', `${audioId.value}:${isPlaying.value}`);
    } catch (error) {
      logError('SimpleMusicPlayer', '播放器操作错误', error)
      isPlaying.value = false;
      
      // 发送播放失败状态
      audioManager.emit('play-state-change', `${audioId.value}:false`);
    }
    
    // 清除定时器引用
    debounceTimer.value = null;
  }, 200); // 增加防抖时间，减少快速点击的问题
}

// 暂停播放
function pausePlay() {
  if (!isPlaying.value) return;
  audioService.pause();
  isPlaying.value = false;
}

// 重置播放进度
function resetProgress() {
  audioService.seek(0);
  currentTime.value = 0;
  progress.value = 0;
}

// 注册音频暂停事件监听
let unsubscribe: (() => void) | null = null;

// 进度条拖动相关函数
function startDrag(e: MouseEvent | TouchEvent) {
  // 只要音频准备就绪就允许拖动，不再要求必须正在播放
  if (!isAudioReady.value) return
  
  isDragging.value = true
  
  // 处理触摸事件或鼠标事件
  if (e.type === 'touchstart') {
    updateProgressFromTouch(e as TouchEvent)
  } else {
    updateProgressFromEvent(e as MouseEvent)
  }
  
  // 添加全局事件监听
  if (e.type === 'touchstart') {
    document.addEventListener('touchmove', updateProgressFromTouch, { passive: false })
    document.addEventListener('touchend', stopDrag)
  } else {
    document.addEventListener('mousemove', updateProgressFromEvent)
    document.addEventListener('mouseup', stopDrag)
  }
}

function updateProgressFromEvent(e: MouseEvent) {
  if (!isDragging.value) return
  
  const progressBar = progressBarRef.value
  if (!progressBar) return
  
  const percent = calculateProgressPercent(e, progressBar)
  
  progress.value = percent * 100
  currentTime.value = percent * duration.value
}

function updateProgressFromTouch(e: TouchEvent) {
  if (!isDragging.value) return
  
  // 阻止触摸事件的默认行为（如滚动）
  e.preventDefault()
  
  const progressBar = progressBarRef.value
  if (!progressBar) return
  
  const percent = calculateProgressPercent(e, progressBar)
  
  progress.value = percent * 100
  currentTime.value = percent * duration.value
}

function stopDrag(e?: MouseEvent | TouchEvent) {
  if (!isDragging.value) return
  
  isDragging.value = false
  
  // 设置音频播放位置
  audioService.seek(currentTime.value);
  
  // 移除全局事件监听
  document.removeEventListener('mousemove', updateProgressFromEvent)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', updateProgressFromTouch)
  document.removeEventListener('touchend', stopDrag)
}

function setProgress(e: MouseEvent) {
  // 只要音频准备就绪就允许设置进度，不再要求必须正在播放
  if (!isAudioReady.value || isDragging.value) return
  
  const progressBar = progressBarRef.value || (e.currentTarget as HTMLElement)
  const percent = calculateProgressPercent(e, progressBar)
  
  progress.value = percent * 100
  currentTime.value = percent * duration.value
  
  // 设置音频播放位置
  audioService.seek(currentTime.value);
}

function setVolume(e: Event) {
  const input = e.target as HTMLInputElement
  volume.value = Number(input.value)
  audioService.setVolume(volume.value);
}

function formatTime(seconds: number): string {
  return formatAudioTime(seconds)
}

// 重试加载音频
function retryLoadAudio() {
  hasError.value = false
  isLoading.value = true
  
  // 重新加载音频
  loadAudioSource();
}

// 从网易云API获取音乐信息
async function fetchNeteaseMusicInfo(id: string) {
  if (!id) return false
  
  try {
    isLoading.value = true

    const track = await fetchTrackWithUrlById(id)
    if (!track?.url) {
      hasError.value = true
      isLoading.value = false
      return false
    }

    songInfo.value = {
      name: track.name,
      artist: track.artist || '未知艺术家',
      cover: track.cover,
      url: track.url
    }
    
    isLoading.value = false
    return true
  } catch (error) {
    logError('SimpleMusicPlayer', '获取网易云音乐信息失败', error)
    hasError.value = true
    isLoading.value = false
    return false
  }
}

// 加载音频源
async function loadAudioSource() {
  // 默认初始显示骨架屏，准备状态
  isLoading.value = true;
  isAudioReady.value = false;
  hasError.value = false;
  
  try {
    // 检查是否使用网易云ID
    if (props.neteaseid) {
      // 尝试加载网易云音乐信息
      const success = await fetchNeteaseMusicInfo(props.neteaseid)
      if (!success && !props.url) {
        // 如果网易云加载失败且没有提供直接URL，则尝试使用iframe
        useNetease.value = true;
        isLoading.value = false;
        return;
      }
    } else if (props.url) {
      // 使用直接提供的URL和信息
      let audioUrl = props.url;
      let coverUrl = props.cover || '';
      
      // 确保音频URL使用HTTPS协议
      if (audioUrl && audioUrl.startsWith('http:')) {
        audioUrl = audioUrl.replace('http:', 'https:');
      }
      
      // 确保封面URL使用HTTPS协议
      if (coverUrl && coverUrl.startsWith('http:')) {
        coverUrl = coverUrl.replace('http:', 'https:');
      }
      
      songInfo.value = {
        name: props.name || '',
        artist: props.artist || '未知艺术家',
        cover: coverUrl,
        url: audioUrl
      }
    } else {
      // 没有提供任何音乐源
      hasError.value = true;
      isLoading.value = false;
      return;
    }
    
    // 检查当前播放状态
    const status = audioService.getPlayingStatus();
    
    // 如果当前正在播放的是这首歌，同步状态
    if (status.audioId === audioId.value) {
      isPlaying.value = status.isPlaying;
      currentTime.value = status.currentTime;
      duration.value = status.duration;
      progress.value = (currentTime.value / duration.value) * 100 || 0;
      isAudioReady.value = true;
      isLoading.value = false;
      
      // 只有在播放状态下才发送歌曲信息给全局播放器
      if (isPlaying.value) {
        sendSongInfoToGlobalPlayer();
      }
    } else {
      // 音频准备就绪
      isAudioReady.value = true;
      isLoading.value = false;
      
      // 如果设置了自动播放，尝试播放
      if (props.autoplay) {
        togglePlay();
      }
    }
    
  } catch (error) {
    logError('SimpleMusicPlayer', '加载音频源失败', error)
    hasError.value = true;
    isLoading.value = false;
  }
}

// 发送歌曲信息给全局播放器
function sendSongInfoToGlobalPlayer() {
  const songData = {
    id: audioId.value,
    name: songInfo.value.name,
    artist: songInfo.value.artist,
    cover: songInfo.value.cover,
    isPlaying: isPlaying.value,
    progress: progress.value,
    duration: duration.value,
    currentTime: currentTime.value
  };
  audioManager.emit('song-info-update', JSON.stringify(songData));
}

// 生命周期钩子
onMounted(() => {
  // 初始渲染完成后移除初始渲染标志
  setTimeout(() => {
    isInitialRender.value = false
  }, 50)
  
  // 设置动画可见性检测
  if (typeof window !== 'undefined' && playerRef.value) {
    const { stop } = useIntersectionObserver(
      playerRef,
      ([{ isIntersecting }]) => {
        if (isIntersecting && !animationApplied.value) {
          isVisible.value = true
          animationApplied.value = true
          stop() // 只触发一次
        }
      },
      { threshold: 0.2, immediate: true }
    )
  }

  // 创建事件监听器集合
  const unsubscribers: Array<() => void> = [];
  
  // 注册当前播放器组件
  audioManager.registerPlayer(audioId.value);
  
  // 同步当前播放状态
  const currentSongInfo = audioManager.getCurrentSongInfo();
  if (currentSongInfo && currentSongInfo.id === audioId.value) {
    isPlaying.value = currentSongInfo.isPlaying;
    currentTime.value = currentSongInfo.currentTime;
    duration.value = currentSongInfo.duration;
    progress.value = currentSongInfo.progress;
    isAudioReady.value = true;
    isLoading.value = false;
  }
  
  // 订阅音频管理器的暂停事件
  unsubscribers.push(audioManager.on('audio-pause', (id) => {
    if (id === audioId.value && isPlaying.value) {
      pausePlay();
    }
  }));
  
  // 订阅音频管理器的重置进度事件 
  unsubscribers.push(audioManager.on('audio-reset', (id) => {
    if (id === audioId.value) {
      resetProgress();
      // 确保视觉上的进度条也被重置
      progress.value = 0;
    }
  }));
  
  // 订阅全局播放器的播放命令
  unsubscribers.push(audioManager.on('global-play', (id) => {
    if (id === audioId.value && !isPlaying.value && isAudioReady.value) {
      togglePlay();
    }
  }));
  
  // 订阅全局播放器的暂停命令
  unsubscribers.push(audioManager.on('global-pause', (id) => {
    if (id === audioId.value && isPlaying.value) {
      togglePlay();
    }
  }));
  
  // 订阅全局播放器的跳转命令
  unsubscribers.push(audioManager.on('global-seek', (data) => {
    try {
      const [id, timeStr] = data.split(':');
      if (id === audioId.value) {
        const time = parseFloat(timeStr);
        audioService.seek(time);
        currentTime.value = time;
        progress.value = (time / duration.value) * 100;
      }
    } catch (e) {
      logError('SimpleMusicPlayer', '解析跳转命令失败', e)
    }
  }));
  
  // 订阅进度更新事件
  unsubscribers.push(audioManager.on('progress-update', (data) => {
    try {
      const [id, time, dur] = data.split(':');
      if (id === audioId.value && !isDragging.value) {
        currentTime.value = parseFloat(time);
        if (dur && parseFloat(dur) > 0) {
          duration.value = parseFloat(dur);
        }
        progress.value = (currentTime.value / duration.value) * 100 || 0;
      }
    } catch (e) {
      logError('SimpleMusicPlayer', '解析进度更新失败', e)
    }
  }));
  
  // 订阅播放状态变化事件
  unsubscribers.push(audioManager.on('play-state-change', (data) => {
    try {
      const [id, state] = data.split(':');
      if (id === audioId.value) {
        isPlaying.value = state === 'true';
        // 移除以下代码，不再在暂停时重置进度条
        // if (wasPlaying && !isPlaying.value) {
        //   progress.value = 0;
        // }
      }
    } catch (e) {
      logError('SimpleMusicPlayer', '解析播放状态变化失败', e)
    }
  }));
  
  // 监听当前音频变更事件
  unsubscribers.push(audioManager.on('current-audio-changed', (id) => {
    // 如果当前播放的不是这个组件的歌曲，重置进度条显示
    if (id !== audioId.value && audioId.value) {
      // 只重置视觉上的进度条，不影响实际的播放位置
      progress.value = 0;
      currentTime.value = 0;
    }
  }));
  
  // 监听全局播放器关闭事件
  unsubscribers.push(audioManager.on('player-closed', (id) => {
    // 如果关闭的是当前正在播放的音频，重置进度条
    if (id === audioId.value) {
      progress.value = 0;
      currentTime.value = 0;
      isPlaying.value = false;
    }
  }));
  
  // 合并注销函数
  unsubscribe = () => {
    unsubscribers.forEach(unsub => unsub());
    
    // 注销当前播放器组件
    audioManager.unregisterPlayer(audioId.value);
  };

  // 加载音频源
  loadAudioSource();
})

// 组件卸载时清理事件监听
onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe();
  }
  
  // 如果组件卸载时正在播放，不需要停止播放
  // 全局音频服务会继续播放
})

// 监听URL变化重新加载音频
watch(() => songInfo.value.url, (newUrl) => {
  if (!newUrl) return
  
  isPlaying.value = false
  currentTime.value = 0
  progress.value = 0 // 确保进度条重置
  isLoading.value = true
  hasError.value = false
  isAudioReady.value = false
  
  // 通知音频管理器当前音频已停止播放
  audioManager.pauseCurrent(audioId.value);
  
  // 重新加载音频
  loadAudioSource();
})
</script>

<template>
  <div class="music-player" ref="playerRef" :class="{ 'dark-mode': isDark, 'animate-in': isVisible && !isInitialRender, 'initial-render': isInitialRender }">
    <!-- 网易云iframe播放器 -->
    <iframe v-if="useNetease" 
      class="netease-player animate-in"
      frameborder="no" 
      border="0" 
      marginwidth="0" 
      marginheight="0" 
      width="100%" 
      height="80" 
      :src="`//music.163.com/outchain/player?type=2&id=${neteaseid}&auto=${autoplay ? 1 : 0}&height=66`">
    </iframe>
    
    <!-- 自定义播放器 -->
    <div v-else class="player-container">
      <!-- 封面 -->
      <div class="cover-container" :class="{ 'animate-in': isVisible && !isInitialRender }" style="--anim-delay: 0.1s">
        <!-- 骨架屏 -->
        <div v-if="isLoading && !songInfo.cover" class="skeleton-cover">
          <div class="skeleton-pulse"></div>
        </div>
        
        <!-- 封面图片 -->
        <img v-else-if="songInfo.cover" :src="songInfo.cover" :alt="songInfo.name" class="cover-image">
        <div v-else class="default-cover">
          <div class="music-note">♪</div>
        </div>
        
        <!-- 加载状态 -->
        <div v-if="isLoading && !hasError" class="loading-overlay">
          <div class="loading-spinner"></div>
        </div>
        
        <!-- 错误状态 -->
        <div v-if="hasError" 
          class="error-overlay" 
          @click="retryLoadAudio"
          @touchend.prevent="retryLoadAudio">
          <div class="error-icon">!</div>
          <div class="error-text">点击重试</div>
        </div>
        
        <!-- 播放控制遮罩 -->
        <div v-if="!isPlaying && !isLoading && !hasError && isAudioReady" 
          class="play-overlay" 
          @click="togglePlay"
          @touchend.prevent="togglePlay">
          <div class="play-button">
            <span>▶</span>
          </div>
        </div>
        
        <!-- 暂停按钮 -->
        <div v-if="isPlaying && !isLoading && !hasError" 
          class="pause-button" 
          @click="togglePlay"
          @touchend.prevent="togglePlay">
          <span>❚❚</span>
        </div>
      </div>
      
      <!-- 播放器控制区 -->
      <div class="controls-container" :class="{ 'animate-in': isVisible && !isInitialRender }" style="--anim-delay: var(--lc-motion-duration-fast)">
        <div class="player-top">
          <!-- 歌曲信息 -->
          <div class="song-info">
            <!-- 标题容器 -->
            <div class="title-container">
              <!-- 歌曲标题骨架屏 -->
              <div v-if="isLoading && !songInfo.name" class="skeleton-title"></div>
              <h3 v-else class="song-title">
                <a v-if="neteaseLink" :href="neteaseLink" target="_blank" class="song-title-link">{{ songInfo.name }}</a>
                <span v-else>{{ songInfo.name }}</span>
              </h3>
            </div>
            
            <!-- 艺术家信息（适应性显示） -->
            <div class="artist-container">
              <!-- 艺术家骨架屏 -->
              <div v-if="isLoading && !songInfo.artist" class="skeleton-artist"></div>
              <span v-else class="song-artist">{{ songInfo.artist }}</span>
            </div>
          </div>
          
          <!-- 时间信息 -->
          <div class="time-info">
            <!-- 时间骨架屏 -->
            <div v-if="isLoading" class="skeleton-time"></div>
            <template v-else>
              <div class="time-display">
                <span class="current-time">{{ formattedCurrentTime }}</span>
                <span class="duration"> / {{ formattedDuration }}</span>
              </div>
            </template>
          </div>
        </div>
        
        <!-- 进度条 -->
        <div 
          class="progress-container" 
          @click="setProgress" 
          @mousedown="startDrag"
          @touchstart="startDrag"
          :class="{ 'dragging': isDragging, 'disabled': !isAudioReady }"
        >
          <!-- 进度条骨架屏 -->
          <div v-if="isLoading" class="skeleton-progress">
            <div class="skeleton-pulse"></div>
          </div>
          <div v-else ref="progressBarRef" class="progress-bar">
            <div class="progress-current" :style="{ width: `${progress}%` }"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.music-player {
  margin: 0; /* 移除外边距，让父元素控制 */
  width: 100%;
  overflow: hidden;
  background-color: var(--vp-c-bg-soft);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  border-radius: 3px;
  /* 显示为可见，但准备动画 */
  opacity: 1;
  transform: translateY(0);
  will-change: opacity, transform;
}

/* 避免初始闪烁 */
.initial-render {
  opacity: 0 !important;
  transform: translateY(20px) !important;
  transition: none !important;
}

/* 网易云播放器样式 */
.netease-player {
  display: block;
  width: 100%;
  height: 80px;
  border: none;
}

/* 添加动画效果 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.animate-in {
  animation: fadeInUp var(--lc-motion-duration-slow) var(--lc-motion-ease-standard) forwards;
  animation-delay: var(--anim-delay, 0s);
}

.player-container {
  display: flex;
  width: 100%;
  align-items: stretch;
  height: 80px;
}

/* 封面样式 */
.cover-container {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  overflow: hidden;
  position: relative;
  user-select: none;
  pointer-events: none;
}

/* 让播放控制元素可点击 */
.play-overlay, .pause-button, .error-overlay {
  pointer-events: auto;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.default-cover {
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

/* 骨架屏样式 */
.skeleton-cover {
  width: 100%;
  height: 100%;
  background-color: var(--vp-c-bg-mute);
  position: relative;
  overflow: hidden;
}

.skeleton-pulse {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    var(--vp-c-bg-mute) 25%, 
    var(--vp-c-bg-soft) 50%, 
    var(--vp-c-bg-mute) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-title {
  width: 120px;
  height: 16px;
  background: linear-gradient(90deg, 
    var(--vp-c-bg-mute) 25%, 
    var(--vp-c-bg-soft) 50%, 
    var(--vp-c-bg-mute) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 2px;
}

.skeleton-artist {
  width: 80px;
  height: 12px;
  margin-left: 8px;
  background: linear-gradient(90deg, 
    var(--vp-c-bg-mute) 25%, 
    var(--vp-c-bg-soft) 50%, 
    var(--vp-c-bg-mute) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 2px;
}

.skeleton-artist-narrow {
  width: 100px;
  height: 12px;
  margin-top: 4px;
  background: linear-gradient(90deg, 
    var(--vp-c-bg-mute) 25%, 
    var(--vp-c-bg-soft) 50%, 
    var(--vp-c-bg-mute) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 2px;
  display: none;
}

.skeleton-time {
  width: 50px;
  height: 12px;
  background: linear-gradient(90deg, 
    var(--vp-c-bg-mute) 25%, 
    var(--vp-c-bg-soft) 50%, 
    var(--vp-c-bg-mute) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 2px;
}

.skeleton-progress {
  height: 4px;
  width: 100%;
  background-color: var(--vp-c-divider);
  border-radius: 2px;
  overflow: hidden;
  position: relative;
}

/* 加载状态 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  backdrop-filter: blur(1px);
}

.loading-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* 错误状态 */
.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(220, 38, 38, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  animation: fadeIn var(--lc-motion-duration-normal) var(--lc-motion-ease-standard);
  touch-action: manipulation; /* 优化触摸行为 */
  -webkit-tap-highlight-color: transparent; /* 移除iOS触摸高亮 */
}

.error-icon {
  font-size: 24px;
  color: white;
  font-weight: bold;
  margin-bottom: 5px;
}

.error-text {
  font-size: 12px;
  color: white;
}

/* 播放控制样式 */
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
  cursor: pointer;
  animation: fadeIn var(--lc-motion-duration-fast) var(--lc-motion-ease-standard);
  touch-action: manipulation; /* 优化触摸行为 */
  -webkit-tap-highlight-color: transparent; /* 移除iOS触摸高亮 */
}

.play-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;
}

.play-button span {
  margin-left: 3px; /* 微调播放图标位置 */
}

.pause-button {
  position: absolute;
  bottom: 5px;
  right: 5px;
  width: 24px; /* 略微增大尺寸 */
  height: 24px; /* 略微增大尺寸 */
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 9px; /* 略微增大字体 */
  cursor: pointer;
  animation: fadeIn var(--lc-motion-duration-fast) var(--lc-motion-ease-standard);
  touch-action: manipulation; /* 优化触摸行为 */
  -webkit-tap-highlight-color: transparent; /* 移除iOS触摸高亮 */
  z-index: 2; /* 确保叠放顺序正确 */
}

/* 控制区样式 */
.controls-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: white;
  position: relative;
}

.player-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: nowrap;
  position: relative;
  height: 36px; /* 固定高度以容纳两行文本 */
}

.song-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  padding-right: 60px; /* 为时间信息留出固定空间 */
}

.title-container {
  display: block; /* 改为块级显示 */
  overflow: hidden; /* 防止内容溢出 */
}

.song-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%; /* 允许使用全宽 */
}

/* 艺术家信息容器 */
.artist-container {
  margin-top: -9px;
  width: 100%;
  overflow: hidden;
}

.song-artist {
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
  opacity: 0.8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

/* 时间信息样式 */
.time-info {
  position: absolute;
  top: 0;
  right: 0;
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
  opacity: 0.8;
  width: 55px; /* 固定宽度 */
  text-align: right;
}

.time-display {
  white-space: nowrap;
  width: 100%;
  display: flex;
  justify-content: flex-end;
}

.current-time {
  color: var(--vp-c-brand);
  display: inline-block;
  width: 28px; /* 固定宽度，容纳最长的时间格式 */
  text-align: right;
}

.duration {
  color: var(--vp-c-text-2);
  width: 31px; /* 固定宽度，容纳"/ 0:00"格式 */
  text-align: left;
}

/* 进度条样式 */
.progress-container {
  width: 100%;
  cursor: pointer;
  height: 20px; /* 固定高度 */
  display: flex;
  align-items: center;
  position: relative;
  touch-action: none;
  margin-top: auto; /* 推到底部 */
}

.progress-container.disabled {
  cursor: default;
  opacity: 0.7;
}

.progress-container.dragging {
  cursor: grabbing;
}

.progress-bar {
  height: 4px;
  width: 100%;
  background-color: var(--vp-c-divider);
  border-radius: 2px;
  position: relative;
  overflow: visible;
  touch-action: none;
}

.progress-current {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background-color: var(--vp-c-brand);
  border-radius: 2px;
  transition: width var(--lc-motion-duration-instant) linear;
}

/* 拖动时禁用过渡效果 */
.dragging .progress-current {
  transition: none;
}

/* 圆形滑块 */
.progress-current::after {
  content: '';
  position: absolute;
  right: -5px;
  top: 50%;
  transform: translateY(-50%);
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: var(--vp-c-brand);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  opacity: 0;
  transition: opacity var(--lc-motion-duration-fast) var(--lc-motion-ease-standard);
}

.progress-container:not(.disabled):hover .progress-current::after,
.dragging .progress-current::after {
  opacity: 1;
}

/* 响应式布局 */
@media (max-width: 480px) {
  .controls-container {
    padding: 8px 12px;
  }
}

/* 窄屏幕适配 - 不再需要之前的窄屏幕特殊处理，因为我们现在统一使用垂直布局 */
@media (max-width: 350px) {
  .song-info {
    padding-right: 50px; /* 为时间信息留出更少的空间 */
  }
  
  .time-info {
    width: 45px; /* 减小宽度 */
  }
}

/* 针对更窄屏幕的特别处理 */
@media (max-width: 290px) {
  .controls-container {
    padding: 12px 10px 8px; /* 减少内边距 */
  }
  
  .song-info {
    padding-right: 45px; /* 进一步减少右侧空间 */
  }
  
  .time-info {
    width: 40px; /* 进一步减小宽度 */
  }
}

/* 暗色模式适配 */
.dark-mode .controls-container {
  background-color: var(--vp-c-bg-soft);
}

.dark-mode .progress-bar {
  background-color: rgba(255, 255, 255, 0.1);
}

/* 添加回缺少的样式 */
.current-time {
  color: var(--vp-c-brand);
}

.song-title-link {
  color: inherit;
  text-decoration: none;
  transition: color var(--lc-motion-duration-fast) var(--lc-motion-ease-standard);
}

.song-title-link:hover {
  color: var(--vp-c-brand);
  text-decoration: underline;
}
</style> 
