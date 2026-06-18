import { EMPTY, X, O, type AdaptiveProfile, type AIDifficulty, type GameCoreState, type GameMode, type GameSettings } from './types'

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  gameMode: 'human-vs-ai',
  aiDifficulty: 'adaptive'
}

export const SETTINGS_STORAGE_KEY = 'lycan:utt:settings'
export const ADAPTIVE_PROFILE_STORAGE_KEY = 'lycan:utt:adaptive-profile'

export function createInitialGameState(settings: Partial<GameSettings> = {}): GameCoreState {
  const mergedSettings = {
    ...DEFAULT_GAME_SETTINGS,
    ...settings
  }

  return {
    board: Array.from({ length: 81 }, () => EMPTY),
    smallBoardStatus: Array.from({ length: 9 }, () => EMPTY),
    smallBoardResolved: Array.from({ length: 9 }, () => false),
    smallBoardWinningLines: Array.from({ length: 9 }, () => null),
    currentPlayer: X,
    nextBoard: null,
    winner: EMPTY,
    bigBoardWinningLine: null,
    gameMode: mergedSettings.gameMode,
    aiDifficulty: mergedSettings.aiDifficulty,
    players: {
      [X]: {
        sideName: '蓝方',
        name: '你'
      },
      [O]: {
        sideName: '红方',
        name: mergedSettings.gameMode === 'human-vs-ai' ? '电脑' : '对手'
      }
    },
    moveHistory: [],
    turnReports: [],
    lastTurnMoves: [],
    lastRuleEvents: []
  }
}

export function cloneGameCoreState(state: GameCoreState): GameCoreState {
  return {
    ...state,
    board: state.board.slice(),
    smallBoardStatus: state.smallBoardStatus.slice(),
    smallBoardResolved: state.smallBoardResolved.slice(),
    smallBoardWinningLines: state.smallBoardWinningLines.map((line) => line?.slice() ?? null),
    players: {
      [X]: { ...state.players[X] },
      [O]: { ...state.players[O] }
    },
    moveHistory: state.moveHistory.map((move) => ({ ...move })),
    turnReports: state.turnReports.slice(),
    lastTurnMoves: state.lastTurnMoves.map((move) => ({ ...move })),
    lastRuleEvents: state.lastRuleEvents.map((event) => ({
      ...event,
      filledCells: event.filledCells.map((move) => ({ ...move }))
    }))
  }
}

export function cloneGameSearchState(state: GameCoreState): GameCoreState {
  return {
    ...state,
    board: state.board.slice(),
    smallBoardStatus: state.smallBoardStatus.slice(),
    smallBoardResolved: state.smallBoardResolved.slice(),
    smallBoardWinningLines: state.smallBoardWinningLines.map((line) => line?.slice() ?? null),
    players: state.players,
    moveHistory: [],
    turnReports: [],
    lastTurnMoves: [],
    lastRuleEvents: []
  }
}

export function loadGameSettings(): GameSettings {
  if (typeof window === 'undefined') return DEFAULT_GAME_SETTINGS

  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!raw) return DEFAULT_GAME_SETTINGS

    const parsed = JSON.parse(raw) as Partial<GameSettings>

    return {
      gameMode: normalizeGameMode(parsed.gameMode),
      aiDifficulty: normalizeDifficulty(parsed.aiDifficulty)
    }
  } catch {
    return DEFAULT_GAME_SETTINGS
  }
}

export function saveGameSettings(settings: GameSettings): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
}

export function loadAdaptiveProfile(): AdaptiveProfile {
  if (typeof window === 'undefined') return createDefaultAdaptiveProfile()

  try {
    const raw = window.localStorage.getItem(ADAPTIVE_PROFILE_STORAGE_KEY)
    if (!raw) return createDefaultAdaptiveProfile()
    const parsed = JSON.parse(raw) as Partial<AdaptiveProfile>

    return {
      level: clampNumber(parsed.level ?? 0.5, 0, 1),
      recentQuality: Array.isArray(parsed.recentQuality) ? parsed.recentQuality.slice(-12) : [],
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : Date.now()
    }
  } catch {
    return createDefaultAdaptiveProfile()
  }
}

export function saveAdaptiveProfile(profile: AdaptiveProfile): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(ADAPTIVE_PROFILE_STORAGE_KEY, JSON.stringify(profile))
}

export function getDifficultyName(difficulty: AIDifficulty): string {
  switch (difficulty) {
    case 'normal':
      return '普通'
    case 'hard':
      return '困难'
    case 'nightmare':
      return '噩梦'
    case 'adaptive':
      return '自适应'
  }
}

export function getGameModeName(gameMode: GameMode): string {
  switch (gameMode) {
    case 'human-vs-ai':
      return '人机对战'
    case 'local':
      return '本地对战'
    case 'online':
      return '在线对战'
  }
}

function createDefaultAdaptiveProfile(): AdaptiveProfile {
  return {
    level: 0.5,
    recentQuality: [],
    updatedAt: Date.now()
  }
}

function normalizeGameMode(value: unknown): GameMode {
  return value === 'local' || value === 'online' || value === 'human-vs-ai'
    ? value
    : DEFAULT_GAME_SETTINGS.gameMode
}

function normalizeDifficulty(value: unknown): AIDifficulty {
  return value === 'normal' || value === 'hard' || value === 'nightmare' || value === 'adaptive'
    ? value
    : DEFAULT_GAME_SETTINGS.aiDifficulty
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
