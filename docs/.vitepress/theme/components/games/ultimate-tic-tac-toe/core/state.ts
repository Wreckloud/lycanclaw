import { EMPTY, X, O, type AdaptiveProfile, type AIDifficulty, type GameCoreState, type GameMode, type GameSettings } from './types'
import { GAME_TEXT } from './game-text'

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  gameMode: 'human-vs-ai',
  aiDifficulty: 'normal'
}

export const SETTINGS_STORAGE_KEY = 'lycan:utt:settings'
export const ADAPTIVE_PROFILE_STORAGE_KEY = 'lycan:utt:adaptive-profile'

export function createInitialGameState(settings: Partial<GameSettings> = {}, options: { started?: boolean } = {}): GameCoreState {
  const mergedSettings = {
    ...DEFAULT_GAME_SETTINGS,
    ...settings
  }
  const isStarted = options.started ?? false

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
    isStarted,
    players: {
      [X]: {
        sideName: GAME_TEXT.player.sideName(X),
        name: GAME_TEXT.player.defaultName(X)
      },
      [O]: {
        sideName: GAME_TEXT.player.sideName(O),
        name: GAME_TEXT.player.defaultName(O)
      }
    },
    moveHistory: [],
    turnReports: [],
    lastTurnMoves: [],
    lastRuleEvents: [],
    messages: isStarted ? createStartMessages(mergedSettings) : [],
    errorMessage: '',
    isMessageInputFocused: false
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
    })),
    messages: state.messages.map((message) => ({ ...message })),
    errorMessage: state.errorMessage,
    isMessageInputFocused: state.isMessageInputFocused
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
    lastRuleEvents: [],
    messages: [],
    errorMessage: '',
    isMessageInputFocused: false
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
      level: clampNumber(parsed.level ?? 0.32, 0.12, 0.9),
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
  return GAME_TEXT.settings.difficultyName(difficulty)
}

export function getGameModeName(gameMode: GameMode): string {
  return GAME_TEXT.settings.gameModeName(gameMode)
}

function createDefaultAdaptiveProfile(): AdaptiveProfile {
  return {
    level: 0.32,
    recentQuality: [],
    updatedAt: Date.now()
  }
}

function createStartMessages(settings: GameSettings) {
  const modeLine = settings.gameMode === 'human-vs-ai'
    ? `${getGameModeName(settings.gameMode)} 电脑(${getDifficultyName(settings.aiDifficulty)})`
    : getGameModeName(settings.gameMode)

  return [
    {
      id: `start-${Date.now()}`,
      type: 'system' as const,
      text: GAME_TEXT.record.gameStart(modeLine, GAME_TEXT.player.defaultName(X))
    }
  ]
}

function normalizeGameMode(value: unknown): GameMode {
  return value === 'local' || value === 'online' || value === 'human-vs-ai'
    ? value
    : DEFAULT_GAME_SETTINGS.gameMode
}

function normalizeDifficulty(value: unknown): AIDifficulty {
  if (value === 'adaptive') return 'normal'

  return value === 'easy' || value === 'normal' || value === 'hard' || value === 'nightmare'
    ? value
    : DEFAULT_GAME_SETTINGS.aiDifficulty
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
