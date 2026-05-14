// 音乐域统一导出入口。
export { default as audioManager } from './audioManager'
export type { SongInfo, PlaybackRequestContext } from './audioManager'
export { default as audioService } from './audioService'
export type { AudioSongInfo } from './audioService'
export { calculateProgressPercent, formatAudioTime } from './audioUi'
export { fetchWeeklyTracks, fetchTrackUrlById, fetchTrackWithUrlById } from './musicApi'
export type { MusicTrack, MusicTrackWithUrl } from './musicApi'
