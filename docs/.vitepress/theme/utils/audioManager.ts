/**
 * 音频管理器 - 确保同一时间只有一个音频在播放
 * 使用简单的发布-订阅模式实现组件间通信
 */

// 创建一个简单的事件总线
class AudioEventBus {
  // 当前播放的音频ID
  private currentPlayingId: string = '';
  
  // 事件监听器注册表
  private listeners: Map<string, Array<(audioId: string) => void>> = new Map();
  
  /**
   * 注册一个事件监听器
   * @param event 事件名称
   * @param callback 回调函数
   */
  on(event: string, callback: (audioId: string) => void): () => void {
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
   * @param audioId 音频ID
   */
  emit(event: string, audioId: string): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(audioId));
    }
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
        this.emit('audio-reset', this.currentPlayingId);
      }
      // 设置新的当前播放ID
      this.currentPlayingId = audioId;
    }
  }
  
  /**
   * 暂停当前播放，并清除正在播放的ID
   * @param audioId 要暂停的音频ID
   */
  pauseCurrent(audioId?: string): void {
    if (!audioId || audioId === this.currentPlayingId) {
      this.currentPlayingId = '';
    }
  }
  
  /**
   * 重置指定音频的播放进度
   * @param audioId 要重置的音频ID
   */
  resetProgress(audioId: string): void {
    this.emit('audio-reset', audioId);
  }
  
  /**
   * 获取当前正在播放的音频ID
   * @returns 当前播放的ID
   */
  getCurrentPlayingId(): string {
    return this.currentPlayingId;
  }
}

// 创建单例实例
const audioManager = new AudioEventBus();

export default audioManager; 