/**
 * 音乐前端模块统一导出入口。
 */
export { default as audioManager } from './audioManager'
export type { SongInfo, PlaybackRequestContext } from './audioManager'
export { default as audioService } from './audioService'
export type { AudioSongInfo } from './audioService'
export { calculateProgressPercent, formatAudioTime } from './audioUi'
export {
  fetchWeeklyTracks,
  fetchTrackWithUrlById,
  startRandomFlow,
  startAboutSequenceFlow,
  interruptSingleFlow,
  playNextFromFlow,
  stopFlow,
  fetchTrackLyric
} from './musicApi'
export type {
  MusicTrack,
  MusicTrackWithUrl,
  MusicPlaybackItem,
  MusicFlowState,
  MusicTrackLyric,
  MusicLyricLine
} from './musicApi'
