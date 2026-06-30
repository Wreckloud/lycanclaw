import { canMove, getBoardCells, getBoardResult, getCellIndex, isBoardFull, isPlayer } from './rules'
import { applyMoveImmutable } from './reducer'
import { createInitialGameState } from './state'
import { DRAW, EMPTY, O, X, type CellValue, type GameCoreState, type GameMove, type GameSettings } from './types'

export const TUTORIAL_OPENING_BOARD_INDEX = 8
export const TUTORIAL_CLAIM_BOARD_INDEX = 1
export const TUTORIAL_CLAIM_CELL_INDEX = 6
export const TUTORIAL_CENTER_BOARD_INDEX = 7
export const TUTORIAL_CENTER_CELL_INDEX = 4
export const TUTORIAL_SETTLEMENT_BOARD_INDEX = 3
export const TUTORIAL_SETTLEMENT_CELL_INDEX = 8
export const TUTORIAL_FIRST_MOVE_CELL_INDEXES = [6, 7] as const
export const TUTORIAL_AI_SEND_TO_CLAIM_CELL_INDEX = 1
export const TUTORIAL_AI_SEND_TO_CENTER_MOVE: GameMove = {
  bigIndex: 6,
  smallIndex: TUTORIAL_CENTER_BOARD_INDEX
}
export const TUTORIAL_AI_SEND_TO_SETTLEMENT_MOVE: GameMove = {
  bigIndex: 2,
  smallIndex: TUTORIAL_SETTLEMENT_BOARD_INDEX
}

export function createTutorialOpeningState(settings: GameSettings): GameCoreState {
  const state = createInitialGameState({
    ...settings,
    gameMode: 'human-vs-ai',
    aiDifficulty: 'easy'
  }, { started: true })

  state.board = Array.from({ length: 81 }, () => EMPTY)
  state.messages = [
    {
      id: `tutorial-start-${Date.now()}`,
      type: 'system',
      text: '教学模式\n蓝方 X 先手'
    }
  ]

  setBoardCells(state, 0, [X, X, O, O, O, X, X, O, X])
  state.smallBoardStatus[0] = DRAW
  state.smallBoardResolved[0] = true

  setBoardCells(state, 1, [X, O, O, X, O, EMPTY, EMPTY, X, O])
  setBoardCells(state, 2, [EMPTY, O, X, EMPTY, X, O, O, X, O])
  setBoardCells(state, 3, [O, O, X, X, X, X, O, O, EMPTY])
  state.smallBoardStatus[3] = X
  state.smallBoardWinningLines[3] = [3, 4, 5]

  setBoardCells(state, 4, [X, O, X, EMPTY, X, O, O, EMPTY, O])
  setBoardCells(state, 5, [O, X, EMPTY, EMPTY, EMPTY, O, X, O, O])
  setBoardCells(state, 6, [X, EMPTY, O, O, X, EMPTY, X, EMPTY, O])
  setBoardCells(state, 7, [X, EMPTY, O, O, EMPTY, X, EMPTY, O, X])
  setBoardCells(state, 8, [X, O, O, O, O, X, EMPTY, EMPTY, X])

  state.currentPlayer = X
  state.nextBoard = TUTORIAL_OPENING_BOARD_INDEX
  state.lastTurnMoves = [
    {
      source: 'manual',
      player: O,
      bigIndex: 4,
      smallIndex: 8
    }
  ]

  validateTutorialOpeningState(state)

  return state
}

function setBoardCells(state: GameCoreState, bigIndex: number, cells: CellValue[]): void {
  for (let smallIndex = 0; smallIndex < cells.length; smallIndex += 1) {
    state.board[getCellIndex(bigIndex, smallIndex)] = cells[smallIndex]
  }
}

function validateTutorialOpeningState(state: GameCoreState): void {
  validateBoardStatuses(state)

  for (const firstMoveIndex of TUTORIAL_FIRST_MOVE_CELL_INDEXES) {
    let currentState = assertTutorialMove(state, {
      bigIndex: TUTORIAL_OPENING_BOARD_INDEX,
      smallIndex: firstMoveIndex
    }, '玩家第一步')
    const firstAiBoard = currentState.nextBoard
    if (firstAiBoard === null) throw new Error('教程预设棋盘非法：玩家第一步后不应自由落子')

    currentState = assertTutorialMove(currentState, {
      bigIndex: firstAiBoard,
      smallIndex: TUTORIAL_AI_SEND_TO_CLAIM_CELL_INDEX
    }, '电脑限制到控制棋盘')
    currentState = assertTutorialMove(currentState, {
      bigIndex: TUTORIAL_CLAIM_BOARD_INDEX,
      smallIndex: TUTORIAL_CLAIM_CELL_INDEX
    }, '玩家控制小棋盘')
    currentState = assertTutorialMove(currentState, TUTORIAL_AI_SEND_TO_CENTER_MOVE, '电脑限制到中心格棋盘')
    currentState = assertTutorialMove(currentState, {
      bigIndex: TUTORIAL_CENTER_BOARD_INDEX,
      smallIndex: TUTORIAL_CENTER_CELL_INDEX
    }, '玩家中心格控制棋盘')
    currentState = assertTutorialMove(currentState, TUTORIAL_AI_SEND_TO_SETTLEMENT_MOVE, '电脑限制到满盘结算棋盘')
    currentState = assertTutorialMove(currentState, {
      bigIndex: TUTORIAL_SETTLEMENT_BOARD_INDEX,
      smallIndex: TUTORIAL_SETTLEMENT_CELL_INDEX
    }, '玩家触发满盘结算')

    if (currentState.winner !== EMPTY) {
      throw new Error('教程预设棋盘非法：满盘结算不应直接结束整局')
    }
  }
}

function validateBoardStatuses(state: GameCoreState): void {
  for (let bigIndex = 0; bigIndex < 9; bigIndex += 1) {
    const result = getBoardResult(getBoardCells(state, bigIndex))
    const status = state.smallBoardStatus[bigIndex]

    if (status === EMPTY && isPlayer(result.status)) {
      throw new Error(`教程预设棋盘非法：${bigIndex + 1}号棋盘已有三连但未登记控制权`)
    }
    if (isPlayer(status) && result.status !== status) {
      throw new Error(`教程预设棋盘非法：${bigIndex + 1}号棋盘控制权与棋面不一致`)
    }
    if (status === DRAW && result.status !== DRAW) {
      throw new Error(`教程预设棋盘非法：${bigIndex + 1}号棋盘平局状态与棋面不一致`)
    }
    if (state.smallBoardResolved[bigIndex] && !isBoardFull(state, bigIndex)) {
      throw new Error(`教程预设棋盘非法：${bigIndex + 1}号棋盘未满却已结算`)
    }
  }
}

function assertTutorialMove(state: GameCoreState, move: GameMove, label: string): GameCoreState {
  if (!canMove(state, move.bigIndex, move.smallIndex)) {
    throw new Error(`教程预设棋盘非法：${label}不可落子`)
  }

  const result = applyMoveImmutable(state, move)
  if (!result.success) {
    throw new Error(`教程预设棋盘非法：${label}执行失败`)
  }

  return result.state
}
