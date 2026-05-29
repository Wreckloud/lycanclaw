/**
 * index.ts：
 * 提供index相关的通用工具能力。
 */
// 音乐域统一导出入口。
export { default as audioManager } from './audioManager'
export type { SongInfo, PlaybackRequestContext } from './audioManager'
export { default as audioService } from './audioService'
export type { AudioSongInfo } from './audioService'
export { calculateProgressPercent, formatAudioTime } from './audioUi'
export {
  fetchWeeklyTracks,
  fetchTrackUrlById,
  fetchTrackWithUrlById,
  fetchMusicQueue,
  enqueueMusicQueueItem,
  playNextFromMusicQueue,
  clearMusicQueue
} from './musicApi'
export type {
  MusicTrack,
  MusicTrackWithUrl,
  MusicQueueItem,
  MusicQueueSnapshot
} from './musicApi'
