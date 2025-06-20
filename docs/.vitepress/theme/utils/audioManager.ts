/**
 * 音频管理器 - 确保同一时间只有一个音频在播放
 * 使用简单的发布-订阅模式实现组件间通信和状态管理
 */

// 定义歌曲信息接口
interface SongInfo {
  id: string;
  name: string;
  artist: string;
  cover: string;
  isPlaying: boolean;
  progress: number;
  duration: number;
  currentTime: number;
}

// 创建一个简单的事件总线
class AudioEventBus {
  // 当前播放的音频ID
  private currentPlayingId: string = '';
  
  // 最后一次播放的音频ID（用于记住上次播放的歌曲）
  private lastPlayedId: string = '';
  
  // 当前歌曲信息
  private currentSongInfo: SongInfo | null = null;
  
  // 所有已注册的播放器组件ID
  private registeredPlayers: Set<string> = new Set();
  
  // 事件监听器注册表
  private listeners: Map<string, Array<(data: string) => void>> = new Map();
  
  /**
   * 注册一个事件监听器
   * @param event 事件名称
   * @param callback 回调函数
   */
  on(event: string, callback: (data: string) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    
    this.listeners.get(event)?.push(callback);
    
    // 返回注销函数
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        const index = eventListeners.indexOf(callback);
        if (index !== -1) {
          eventListeners.splice(index, 1);
        }
      }
    };
  }
  
  /**
   * 触发一个事件
   * @param event 事件名称
   * @param data 事件数据
   */
  emit(event: string, data: string): void {
    // 处理特殊事件
    if (event === 'song-info-update') {
      try {
        this.currentSongInfo = JSON.parse(data);
      } catch (e) {
        console.error('解析歌曲信息失败', e);
      }
    } else if (event === 'play-state-change') {
      try {
        const [id, state] = data.split(':');
        if (this.currentSongInfo && this.currentSongInfo.id === id) {
          this.currentSongInfo.isPlaying = state === 'true';
          
          // 如果是播放状态，更新当前播放ID
          if (state === 'true') {
            this.currentPlayingId = id;
          } else if (id === this.currentPlayingId) {
            // 如果当前播放的歌曲被暂停，清除当前播放ID
            this.currentPlayingId = '';
          }
        }
      } catch (e) {
        console.error('解析播放状态失败', e);
      }
    } else if (event === 'progress-update') {
      try {
        const [id, time, dur] = data.split(':');
        if (this.currentSongInfo && this.currentSongInfo.id === id) {
          this.currentSongInfo.currentTime = parseFloat(time);
          if (dur && parseFloat(dur) > 0) {
            this.currentSongInfo.duration = parseFloat(dur);
          }
          this.currentSongInfo.progress = (this.currentSongInfo.currentTime / this.currentSongInfo.duration) * 100 || 0;
        }
      } catch (e) {
        console.error('解析进度信息失败', e);
      }
    } else if (event === 'global-play') {
      // 全局播放命令，需要确保只有一个音频在播放
      this.ensureSinglePlayback(data);
    } else if (event === 'register-player') {
      // 注册播放器组件
      this.registeredPlayers.add(data);
    } else if (event === 'unregister-player') {
      // 注销播放器组件
      this.registeredPlayers.delete(data);
    }
    
    // 触发所有监听器
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }
  
  /**
   * 确保只有一个音频在播放
   * @param audioId 要播放的音频ID
   */
  private ensureSinglePlayback(audioId: string): void {
    // 如果当前有其他音频在播放，先暂停它
    if (this.currentPlayingId && this.currentPlayingId !== audioId) {
      this.emit('audio-pause', this.currentPlayingId);
      this.emit('audio-reset', this.currentPlayingId);
    }
    
    // 设置新的当前播放ID
    this.currentPlayingId = audioId;
    this.lastPlayedId = audioId;
  }
  
  /**
   * 设置当前正在播放的音频ID
   * @param audioId 音频ID
   */
  setCurrentPlaying(audioId: string): void {
    if (audioId !== this.currentPlayingId) {
      // 如果是新的音频，先通知需要暂停旧的播放并重置进度
      if (this.currentPlayingId) {
        this.emit('audio-pause', this.currentPlayingId);
      }
      
      // 设置新的当前播放ID
      this.currentPlayingId = audioId;
      this.lastPlayedId = audioId;
      
      // 通知全局播放器当前播放的音频已更改
      this.emit('current-audio-changed', audioId);
    }
  }
  
  /**
   * 暂停当前播放，并清除正在播放的ID
   * @param audioId 要暂停的音频ID
   */
  pauseCurrent(audioId?: string): void {
    if (!audioId || audioId === this.currentPlayingId) {
      // 保存最后播放的ID，但清除当前播放ID
      if (this.currentPlayingId) {
        this.lastPlayedId = this.currentPlayingId;
      }
      this.currentPlayingId = '';
      
      // 更新歌曲信息的播放状态
      if (this.currentSongInfo) {
        this.currentSongInfo.isPlaying = false;
      }
    }
  }
  
  /**
   * 重置指定音频的播放进度
   * @param audioId 要重置的音频ID
   */
  resetProgress(audioId: string): void {
    this.emit('audio-reset', audioId);
    
    // 更新歌曲信息的进度
    if (this.currentSongInfo && this.currentSongInfo.id === audioId) {
      this.currentSongInfo.currentTime = 0;
      this.currentSongInfo.progress = 0;
    }
  }
  
  /**
   * 获取当前正在播放的音频ID
   * @returns 当前播放的ID
   */
  getCurrentPlayingId(): string {
    return this.currentPlayingId;
  }
  
  /**
   * 获取最后一次播放的音频ID
   * @returns 最后播放的ID
   */
  getLastPlayedId(): string {
    return this.lastPlayedId;
  }
  
  /**
   * 获取当前歌曲信息
   * @returns 当前歌曲信息
   */
  getCurrentSongInfo(): SongInfo | null {
    return this.currentSongInfo;
  }
  
  /**
   * 初始化组件时同步当前歌曲信息
   * 用于页面切换后重新加载组件时同步状态
   */
  syncCurrentSongInfo(): void {
    if (this.currentSongInfo) {
      this.emit('song-info-update', JSON.stringify(this.currentSongInfo));
      
      // 同步播放状态
      this.emit('play-state-change', `${this.currentSongInfo.id}:${this.currentSongInfo.isPlaying}`);
    }
  }
  
  /**
   * 注册播放器组件
   * @param audioId 音频ID
   */
  registerPlayer(audioId: string): void {
    this.emit('register-player', audioId);
  }
  
  /**
   * 注销播放器组件
   * @param audioId 音频ID
   */
  unregisterPlayer(audioId: string): void {
    this.emit('unregister-player', audioId);
  }
  
  /**
   * 获取所有已注册的播放器组件ID
   * @returns 播放器组件ID数组
   */
  getRegisteredPlayers(): string[] {
    return Array.from(this.registeredPlayers);
  }
}

// 创建单例实例
const audioManager = new AudioEventBus();

export default audioManager; 