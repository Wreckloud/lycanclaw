/**
 * 全局音频服务 - 用于在页面跳转时保持音频状态
 * 使用单例模式实现全局共享音频实例
 */
import audioManager from './audioManager';
import { addCorsProxy } from './proxyConfig';

// 音频操作状态枚举
enum AudioOperationState {
  IDLE = 'idle',
  LOADING = 'loading',
  PLAYING = 'playing',
  PAUSED = 'paused',
  ERROR = 'error'
}

class AudioService {
  private static instance: AudioService;
  private audioElement: HTMLAudioElement | null = null;
  private currentAudioId: string = '';
  private currentSongInfo: any = null;
  private isPlaying: boolean = false;
  private currentTime: number = 0;
  private duration: number = 0;
  private volume: number = 70;
  private operationState: AudioOperationState = AudioOperationState.IDLE;
  private operationInProgress: boolean = false;
  private retryCount: number = 0;
  private maxRetries: number = 3;
  
  // 私有构造函数，防止外部实例化
  private constructor() {
    // 创建全局音频元素
    if (typeof window !== 'undefined') {
      this.audioElement = new Audio();
      this.setupAudioEvents();
    }
  }
  
  // 获取单例实例
  public static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }
  
  // 设置音频事件监听
  private setupAudioEvents() {
    if (!this.audioElement) return;
    
    // 时间更新事件
    this.audioElement.addEventListener('timeupdate', () => {
      if (!this.audioElement) return;
      this.currentTime = this.audioElement.currentTime;
      
      // 发送进度更新事件
      if (this.currentAudioId) {
        audioManager.emit('progress-update', 
          `${this.currentAudioId}:${this.currentTime}:${this.duration}`);
      }
    });
    
    // 元数据加载完成事件
    this.audioElement.addEventListener('loadedmetadata', () => {
      if (!this.audioElement) return;
      this.duration = this.audioElement.duration;
      
      // 如果有存储的播放位置，恢复它
      if (this.currentTime > 0 && this.currentTime < this.duration) {
        this.audioElement.currentTime = this.currentTime;
      }
      
      // 更新操作状态
      this.operationState = AudioOperationState.PAUSED;
      this.operationInProgress = false;
    });
    
    // 播放结束事件
    this.audioElement.addEventListener('ended', () => {
      this.isPlaying = false;
      this.currentTime = 0;
      this.operationState = AudioOperationState.PAUSED;
      
      // 发送歌曲结束事件
      if (this.currentAudioId) {
        audioManager.emit('song-ended', this.currentAudioId);
        audioManager.emit('play-state-change', `${this.currentAudioId}:false`);
        audioManager.pauseCurrent(this.currentAudioId);
      }
    });
    
    // 错误事件
    this.audioElement.addEventListener('error', (e) => {
      console.error('全局音频加载错误:', e);
      this.isPlaying = false;
      this.operationState = AudioOperationState.ERROR;
      this.operationInProgress = false;
      
      // 发送播放失败状态
      if (this.currentAudioId) {
        audioManager.emit('play-state-change', `${this.currentAudioId}:false`);
      }
    });
    
    // 等待事件
    this.audioElement.addEventListener('waiting', () => {
      this.operationState = AudioOperationState.LOADING;
      // 可以在这里添加加载状态通知
    });
    
    // 可以播放事件
    this.audioElement.addEventListener('canplay', () => {
      if (this.operationState === AudioOperationState.LOADING) {
        this.operationState = this.isPlaying ? 
          AudioOperationState.PLAYING : AudioOperationState.PAUSED;
      }
      this.operationInProgress = false;
      // 可以在这里添加准备就绪状态通知
    });
    
    // 播放开始事件
    this.audioElement.addEventListener('play', () => {
      this.isPlaying = true;
      this.operationState = AudioOperationState.PLAYING;
      this.operationInProgress = false;
      
      // 发送播放状态更新
      if (this.currentAudioId) {
        audioManager.emit('play-state-change', `${this.currentAudioId}:true`);
      }
    });
    
    // 暂停事件
    this.audioElement.addEventListener('pause', () => {
      this.isPlaying = false;
      this.operationState = AudioOperationState.PAUSED;
      this.operationInProgress = false;
      
      // 发送暂停状态更新
      if (this.currentAudioId) {
        audioManager.emit('play-state-change', `${this.currentAudioId}:false`);
      }
    });
    
    // 播放中断事件
    this.audioElement.addEventListener('abort', () => {
      console.log('音频播放被中断');
      this.operationInProgress = false;
    });
    
    // 网络状态变化事件
    this.audioElement.addEventListener('stalled', () => {
      console.log('音频加载停滞');
      this.operationState = AudioOperationState.LOADING;
    });
  }
  
  // 播放音频
  public play(audioId: string, songInfo: any, startTime: number = 0): Promise<void> {
    if (!this.audioElement) return Promise.reject('音频元素未初始化');
    
    // 如果正在进行操作，避免重复操作
    if (this.operationInProgress) {
      console.log('操作正在进行中，请稍候再试');
      return Promise.resolve();
    }
    
    this.operationInProgress = true;
    this.retryCount = 0;
    
    // 如果是不同的音频，则加载新的
    if (this.currentAudioId !== audioId || !this.audioElement.src) {
      // 保存当前音频ID和信息
      this.currentAudioId = audioId;
      this.currentSongInfo = songInfo;
      
      // 设置音频源 - 使用代理处理CORS问题
      const url = addCorsProxy(songInfo.url);
      this.audioElement.src = url;
      this.audioElement.load();
      this.operationState = AudioOperationState.LOADING;
      
      // 设置音量
      this.audioElement.volume = this.volume / 100;
      
      // 如果有指定开始时间
      if (startTime > 0) {
        this.currentTime = startTime;
      } else {
        this.currentTime = 0;
      }
    }
    
    // 播放音频
    const playPromise = this.audioElement.play()
      .catch(error => {
        // 处理AbortError - 这是由于play()请求被pause()中断导致的
        // 这种情况通常发生在快速切换播放/暂停时
        if (error.name === 'AbortError') {
          console.log('播放被中断，可能是由于快速切换播放状态');
          // 不需要向用户显示这个错误，它是正常的交互行为
          // 但我们需要确保状态是正确的
          this.isPlaying = false;
          this.operationState = AudioOperationState.PAUSED;
          this.operationInProgress = false;
          
          // 发送状态更新
          audioManager.emit('play-state-change', `${audioId}:false`);
          
          // 返回一个已解决的Promise，这样外部调用不会收到错误
          return Promise.resolve();
        }
        
        // 网络错误，尝试重试
        if (error.name === 'NotAllowedError' || error.name === 'NotSupportedError') {
          if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            console.log(`播放失败，正在重试(${this.retryCount}/${this.maxRetries})...`);
            
            // 短暂延迟后重试
            return new Promise<void>((resolve, reject) => {
              setTimeout(() => {
                this.operationInProgress = false;
                this.play(audioId, songInfo, startTime)
                  .then(resolve)
                  .catch(reject);
              }, 1000);
            });
          }
        }
        
        // 其他类型的错误，继续抛出
        this.operationState = AudioOperationState.ERROR;
        this.operationInProgress = false;
        return Promise.reject(error);
      });
    
    // 更新状态
    this.isPlaying = true;
    this.operationState = AudioOperationState.PLAYING;
    
    // 通知音频管理器
    audioManager.setCurrentPlaying(audioId);
    
    // 发送播放状态更新
    audioManager.emit('play-state-change', `${audioId}:true`);
    
    // 发送歌曲信息
    const songData = {
      id: audioId,
      name: songInfo.name,
      artist: songInfo.artist,
      cover: songInfo.cover,
      isPlaying: true,
      progress: (this.currentTime / (this.duration || 1)) * 100,
      duration: this.duration,
      currentTime: this.currentTime
    };
    audioManager.emit('song-info-update', JSON.stringify(songData));
    
    return playPromise;
  }
  
  // 暂停音频
  public pause(): void {
    if (!this.audioElement || !this.isPlaying) return;
    
    // 如果正在进行操作，避免重复操作
    if (this.operationInProgress) {
      console.log('操作正在进行中，请稍候再试');
      return;
    }
    
    this.operationInProgress = true;
    
    try {
      this.audioElement.pause();
      this.isPlaying = false;
      this.operationState = AudioOperationState.PAUSED;
      
      // 发送暂停状态
      if (this.currentAudioId) {
        audioManager.emit('play-state-change', `${this.currentAudioId}:false`);
        audioManager.pauseCurrent(this.currentAudioId);
      }
    } catch (error) {
      console.error('暂停音频时出错:', error);
    } finally {
      this.operationInProgress = false;
    }
  }
  
  // 设置播放位置
  public seek(time: number): void {
    if (!this.audioElement) return;
    
    // 如果正在进行操作，避免重复操作
    if (this.operationInProgress) {
      console.log('操作正在进行中，请稍候再试');
      return;
    }
    
    try {
      // 确保时间在有效范围内
      const validTime = Math.max(0, Math.min(time, this.duration || 0));
      this.audioElement.currentTime = validTime;
      this.currentTime = validTime;
    } catch (error) {
      console.error('设置播放位置时出错:', error);
    }
  }
  
  // 设置音量
  public setVolume(volume: number): void {
    if (!this.audioElement) return;
    
    try {
      this.volume = Math.max(0, Math.min(volume, 100));
      this.audioElement.volume = this.volume / 100;
    } catch (error) {
      console.error('设置音量时出错:', error);
    }
  }
  
  // 获取当前播放状态
  public getPlayingStatus(): { 
    isPlaying: boolean, 
    currentTime: number, 
    duration: number,
    audioId: string,
    songInfo: any,
    operationState: AudioOperationState
  } {
    return {
      isPlaying: this.isPlaying,
      currentTime: this.currentTime,
      duration: this.duration,
      audioId: this.currentAudioId,
      songInfo: this.currentSongInfo,
      operationState: this.operationState
    };
  }
  
  // 重置服务状态
  public reset(): void {
    if (!this.audioElement) return;
    
    try {
      // 暂停当前播放
      if (this.isPlaying) {
        this.audioElement.pause();
      }
      
      // 清除音频源
      this.audioElement.src = '';
      this.audioElement.load();
      
      // 重置状态
      this.isPlaying = false;
      this.currentTime = 0;
      this.duration = 0;
      this.currentAudioId = '';
      this.currentSongInfo = null;
      this.operationState = AudioOperationState.IDLE;
      this.operationInProgress = false;
      this.retryCount = 0;
    } catch (error) {
      console.error('重置音频服务时出错:', error);
    }
  }
}

// 导出单例实例
export default AudioService.getInstance(); 