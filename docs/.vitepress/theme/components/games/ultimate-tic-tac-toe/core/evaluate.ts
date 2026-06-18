import { getLegalMoves, getBoardCells, getCellIndex, getOpponent, isPlayer, WIN_LINES } from './rules'
import { DRAW, EMPTY, type CellValue, type GameCoreState, type Player } from './types'

const BIG_BOARD_POSITION_WEIGHTS = [
  3, 2, 3,
  2, 4, 2,
  3, 2, 3
]

const SMALL_CELL_POSITION_WEIGHTS = [
  3, 2, 3,
  2, 4, 2,
  3, 2, 3
]

export function evaluateState(state: GameCoreState, aiPlayer: Player): number {
  const humanPlayer = getOpponent(aiPlayer)

  if (state.winner === aiPlayer) return 1_000_000
  if (state.winner === humanPlayer) return -1_000_000
  if (state.winner === DRAW) return 0

  let score = 0

  score += evaluateBigBoard(state, aiPlayer) * 100
  score += evaluateSmallBoards(state, aiPlayer)
  score += evaluateSettlementPotential(state, aiPlayer)
  score += evaluateStrategicTactics(state, aiPlayer)
  score += evaluateMobility(state, aiPlayer)

  return score
}

function evaluateBigBoard(state: GameCoreState, aiPlayer: Player): number {
  const opponent = getOpponent(aiPlayer)
  let score = 0

  for (let i = 0; i < 9; i += 1) {
    const owner = state.smallBoardStatus[i]

    if (owner === aiPlayer) score += BIG_BOARD_POSITION_WEIGHTS[i] * 120
    if (owner === opponent) score -= BIG_BOARD_POSITION_WEIGHTS[i] * 140
  }

  for (const line of WIN_LINES) {
    const cells = line.map((index) => state.smallBoardStatus[index])
    score += evaluateLine(cells, aiPlayer, 950, 1200)
  }

  return score
}

function evaluateSmallBoards(state: GameCoreState, aiPlayer: Player): number {
  const opponent = getOpponent(aiPlayer)
  let score = 0

  for (let bigIndex = 0; bigIndex < 9; bigIndex += 1) {
    const owner = state.smallBoardStatus[bigIndex]
    const boardWeight = BIG_BOARD_POSITION_WEIGHTS[bigIndex]

    if (owner === DRAW) continue
    if (owner === aiPlayer) {
      score += boardWeight * 90
      continue
    }
    if (owner === opponent) {
      score -= boardWeight * 105
      continue
    }

    const smallBoard = getBoardCells(state, bigIndex)

    for (let smallIndex = 0; smallIndex < 9; smallIndex += 1) {
      const cell = smallBoard[smallIndex]
      if (cell === aiPlayer) score += SMALL_CELL_POSITION_WEIGHTS[smallIndex] * boardWeight * 2
      if (cell === opponent) score -= SMALL_CELL_POSITION_WEIGHTS[smallIndex] * boardWeight * 2
    }

    for (const line of WIN_LINES) {
      const cells = line.map((index) => smallBoard[index])
      score += evaluateLine(cells, aiPlayer, 72 * boardWeight, 96 * boardWeight)
    }
  }

  return score
}

function evaluateLine(cells: CellValue[], aiPlayer: Player, attackValue: number, defendValue: number): number {
  const opponent = getOpponent(aiPlayer)
  const aiCount = cells.filter((cell) => cell === aiPlayer).length
  const opponentCount = cells.filter((cell) => cell === opponent).length
  const emptyCount = cells.filter((cell) => cell === EMPTY).length

  if (aiCount > 0 && opponentCount > 0) return 0
  if (aiCount === 2 && emptyCount === 1) return attackValue
  if (aiCount === 1 && emptyCount === 2) return Math.floor(attackValue * 0.2)
  if (opponentCount === 2 && emptyCount === 1) return -defendValue
  if (opponentCount === 1 && emptyCount === 2) return -Math.floor(defendValue * 0.2)

  return 0
}

function evaluateSettlementPotential(state: GameCoreState, aiPlayer: Player): number {
  const opponent = getOpponent(aiPlayer)
  let score = 0

  for (let boardIndex = 0; boardIndex < 9; boardIndex += 1) {
    if (state.smallBoardResolved[boardIndex]) continue

    const owner = state.smallBoardStatus[boardIndex]
    if (!isPlayer(owner)) continue

    const emptyCount = countEmptyCells(state, boardIndex)
    if (emptyCount > 3) continue

    const fillableEntranceCount = countFillableEntranceCells(state, boardIndex)
    const bigBoardWeight = BIG_BOARD_POSITION_WEIGHTS[boardIndex]
    const pressure = createsBigBoardThreatAfterClaim(state, boardIndex, owner) ? 2 : 1
    const value = fillableEntranceCount * (4 - emptyCount) * bigBoardWeight * pressure * 28

    if (owner === aiPlayer) score += value
    if (owner === opponent) score -= Math.floor(value * 1.18)
  }

  return score
}

function evaluateStrategicTactics(state: GameCoreState, aiPlayer: Player): number {
  const opponent = getOpponent(aiPlayer)
  let score = 0

  score += countBoardThreats(state, aiPlayer) * 260
  score -= countBoardThreats(state, opponent) * 330
  score += countLocalThreats(state, aiPlayer) * 42
  score -= countLocalThreats(state, opponent) * 58

  if (state.nextBoard !== null && state.smallBoardStatus[state.nextBoard] === EMPTY) {
    score += state.currentPlayer === aiPlayer
      ? BIG_BOARD_POSITION_WEIGHTS[state.nextBoard] * 28
      : -BIG_BOARD_POSITION_WEIGHTS[state.nextBoard] * 34
  }

  return score
}

function evaluateMobility(state: GameCoreState, aiPlayer: Player): number {
  if (state.nextBoard !== null) return 0

  const moveCount = getLegalMoves(state).length
  const value = Math.min(220, moveCount * 4)

  return state.currentPlayer === aiPlayer ? value : -value
}

function countEmptyCells(state: GameCoreState, bigIndex: number): number {
  let count = 0
  const offset = bigIndex * 9

  for (let smallIndex = 0; smallIndex < 9; smallIndex += 1) {
    if (state.board[offset + smallIndex] === EMPTY) count += 1
  }

  return count
}

function countFillableEntranceCells(state: GameCoreState, targetBoardIndex: number): number {
  let count = 0

  for (let bigIndex = 0; bigIndex < 9; bigIndex += 1) {
    if (state.board[getCellIndex(bigIndex, targetBoardIndex)] === EMPTY) count += 1
  }

  return count
}

function createsBigBoardThreatAfterClaim(state: GameCoreState, boardIndex: number, owner: Player): boolean {
  return WIN_LINES.some((line) => {
    if (!line.some((index) => index === boardIndex)) return false
    const owners = line.map((index) => (index === boardIndex ? owner : state.smallBoardStatus[index]))
    return owners.filter((cell) => cell === owner).length === 2 && owners.filter((cell) => cell === EMPTY).length === 1
  })
}

function countBoardThreats(state: GameCoreState, player: Player): number {
  return WIN_LINES.filter((line) => {
    const cells = line.map((index) => state.smallBoardStatus[index])
    return cells.filter((cell) => cell === player).length === 2 && cells.filter((cell) => cell === EMPTY).length === 1
  }).length
}

function countLocalThreats(state: GameCoreState, player: Player): number {
  let count = 0

  for (let bigIndex = 0; bigIndex < 9; bigIndex += 1) {
    if (state.smallBoardStatus[bigIndex] !== EMPTY) continue
    const cells = getBoardCells(state, bigIndex)

    for (const line of WIN_LINES) {
      const lineCells = line.map((index) => cells[index])
      if (lineCells.filter((cell) => cell === player).length === 2 && lineCells.filter((cell) => cell === EMPTY).length === 1) {
        count += 1
      }
    }
  }

  return count
}
