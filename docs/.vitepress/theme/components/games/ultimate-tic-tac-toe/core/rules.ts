import { DRAW, EMPTY, O, X, type BoardResult, type CellValue, type GameCoreState, type Player } from './types'
import { GAME_TEXT } from './game-text'

export const CENTER_INDEX = 4

export const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
] as const

export function getOpponent(player: Player): Player {
  return player === X ? O : X
}

export function isPlayer(value: BoardResult): value is Player {
  return value === X || value === O
}

export function getCellIndex(bigIndex: number, smallIndex: number): number {
  return bigIndex * 9 + smallIndex
}

export function getBoardCells(state: GameCoreState, bigIndex: number): CellValue[] {
  return state.board.slice(bigIndex * 9, bigIndex * 9 + 9)
}

export function isBoardFull(state: GameCoreState, bigIndex: number): boolean {
  const offset = bigIndex * 9

  for (let i = 0; i < 9; i += 1) {
    if (state.board[offset + i] === EMPTY) return false
  }

  return true
}

export function getEffectiveNextBoard(state: GameCoreState): number | null {
  if (state.nextBoard === null) return null
  if (isBoardFull(state, state.nextBoard)) return null

  return state.nextBoard
}

export function getBoardResult(cells: CellValue[]): { status: BoardResult; winningLine: number[] | null } {
  for (const [a, b, c] of WIN_LINES) {
    if (cells[a] !== EMPTY && cells[a] !== DRAW && cells[a] === cells[b] && cells[a] === cells[c]) {
      return {
        status: cells[a],
        winningLine: [a, b, c]
      }
    }
  }

  if (cells.every((cell) => cell !== EMPTY)) {
    return {
      status: DRAW,
      winningLine: null
    }
  }

  return {
    status: EMPTY,
    winningLine: null
  }
}

export function canMove(state: GameCoreState, bigIndex: number, smallIndex: number): boolean {
  if (!state.isStarted) return false
  if (state.winner !== EMPTY) return false
  if (bigIndex < 0 || bigIndex > 8 || smallIndex < 0 || smallIndex > 8) return false
  if (isBoardFull(state, bigIndex)) return false
  if (state.board[getCellIndex(bigIndex, smallIndex)] !== EMPTY) return false

  const effectiveNextBoard = getEffectiveNextBoard(state)

  return effectiveNextBoard === null || effectiveNextBoard === bigIndex
}

export function getLegalMoves(state: GameCoreState): Array<{ bigIndex: number; smallIndex: number }> {
  const moves: Array<{ bigIndex: number; smallIndex: number }> = []

  for (let bigIndex = 0; bigIndex < 9; bigIndex += 1) {
    for (let smallIndex = 0; smallIndex < 9; smallIndex += 1) {
      if (canMove(state, bigIndex, smallIndex)) {
        moves.push({ bigIndex, smallIndex })
      }
    }
  }

  return moves
}

export function getInvalidMoveReason(state: GameCoreState, bigIndex: number, smallIndex: number): string {
  if (!state.isStarted) return GAME_TEXT.invalidMove.notStarted
  if (state.winner !== EMPTY) return GAME_TEXT.invalidMove.finished
  if (isBoardFull(state, bigIndex)) return GAME_TEXT.invalidMove.boardFinished(formatBigBoardIndex(bigIndex))
  if (state.board[getCellIndex(bigIndex, smallIndex)] !== EMPTY) return GAME_TEXT.invalidMove.occupied

  const effectiveNextBoard = getEffectiveNextBoard(state)
  if (effectiveNextBoard !== null && effectiveNextBoard !== bigIndex) {
    return GAME_TEXT.invalidMove.requiredBoard(formatBigBoardIndex(effectiveNextBoard))
  }

  return GAME_TEXT.invalidMove.fallback
}

export function formatBigBoardIndex(bigIndex: number): string {
  return GAME_TEXT.board.bigBoard(bigIndex)
}

export function formatSmallCellPosition(smallIndex: number): string {
  return GAME_TEXT.board.smallCell(smallIndex)
}

export function getMarkText(value: BoardResult): string {
  return GAME_TEXT.player.mark(value)
}

export function getPlayerSideName(player: Player): string {
  return GAME_TEXT.player.sideName(player)
}

export function getPlayerName(player: Player, state: GameCoreState): string {
  return state.players[player]?.name || getPlayerSideName(player)
}
