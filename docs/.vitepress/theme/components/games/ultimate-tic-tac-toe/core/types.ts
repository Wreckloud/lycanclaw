export const EMPTY = 0
export const X = 1
export const O = 2
export const DRAW = 3

export type CellValue = typeof EMPTY | typeof X | typeof O | typeof DRAW
export type Player = typeof X | typeof O
export type BoardResult = typeof EMPTY | typeof X | typeof O | typeof DRAW

export type GameMode = 'human-vs-ai' | 'local' | 'online'
export type AIDifficulty = 'normal' | 'hard' | 'nightmare' | 'adaptive'

export interface PlayerInfo {
  sideName: string
  name: string
}

export interface GameMove {
  bigIndex: number
  smallIndex: number
}

export interface RecordedMove extends GameMove {
  player: Player
  source: 'manual' | 'auto'
  settlementBoardIndex?: number
}

export interface RuleEvent {
  boardIndex: number
  owner: BoardResult
  filledCount: number
  filledCells: RecordedMove[]
}

export interface GameCoreState {
  board: CellValue[]
  smallBoardStatus: BoardResult[]
  smallBoardResolved: boolean[]
  smallBoardWinningLines: Array<number[] | null>
  currentPlayer: Player
  nextBoard: number | null
  winner: BoardResult
  bigBoardWinningLine: number[] | null
  gameMode: GameMode
  aiDifficulty: AIDifficulty
  players: Record<Player, PlayerInfo>
  moveHistory: RecordedMove[]
  turnReports: TurnReport[]
  lastTurnMoves: RecordedMove[]
  lastRuleEvents: RuleEvent[]
}

export interface GameSettings {
  gameMode: GameMode
  aiDifficulty: AIDifficulty
}

export type MoveQuality =
  | 'winning_move'
  | 'decisive_gain'
  | 'strong_gain'
  | 'good_gain'
  | 'neutral'
  | 'small_loss'
  | 'bad_loss'
  | 'blunder'

export interface AITopCandidate {
  bigIndex: number
  smallIndex: number
  score: number
}

export interface AIDecisionAnalysis {
  difficulty: AIDifficulty
  completedDepth: number
  targetDepth: number
  calculationTimeMs: number
  legalMoveCount: number
  candidateMoveCount: number
  nodeCount: number
  transpositionHits: number
  tactic: string
  selection: string
  chosenScore: number | null
  adaptiveLevel: number
  topCandidates: AITopCandidate[]
}

export interface AIDecision {
  move: GameMove | null
  resign: boolean
  analysis: AIDecisionAnalysis
}

export interface TurnReport {
  id: number
  actor: {
    player: Player
    name: string
    isAI: boolean
  }
  move: GameMove & {
    boardText: string
    cellText: string
    isCenter: boolean
  }
  evaluation: {
    perspectivePlayer: Player
    before: number
    after: number
    delta: number
    quality: MoveQuality
    opponentBefore: number
    opponentAfter: number
    opponentDelta: number
  }
  aiDecision: AIDecisionAnalysis | null
  tags: string[]
  summary: string
}

export interface AdaptiveProfile {
  level: number
  recentQuality: MoveQuality[]
  updatedAt: number
}

export interface GameSessionAdapter {
  mode: GameMode
  applyLocalMove: (state: GameCoreState, move: GameMove) => GameCoreState
}
