import { cloneGameCoreState } from './state'
import { CENTER_INDEX, getBoardCells, getBoardResult, getCellIndex, getOpponent, isBoardFull, isPlayer, canMove } from './rules'
import { DRAW, EMPTY, type GameCoreState, type GameMove, type Player, type RecordedMove, type RuleEvent } from './types'

export interface ApplyMoveResult {
  state: GameCoreState
  success: boolean
}

export function applyMoveImmutable(state: GameCoreState, move: GameMove): ApplyMoveResult {
  const nextState = cloneGameCoreState(state)
  const success = applyMoveMutable(nextState, move.bigIndex, move.smallIndex)

  return {
    state: nextState,
    success
  }
}

export function applyMoveMutable(state: GameCoreState, bigIndex: number, smallIndex: number): boolean {
  if (!canMove(state, bigIndex, smallIndex)) return false

  const movePlayer = state.currentPlayer
  state.lastRuleEvents = []
  state.lastTurnMoves = []
  state.board[getCellIndex(bigIndex, smallIndex)] = movePlayer

  const manualMove: RecordedMove = {
    source: 'manual',
    player: movePlayer,
    bigIndex,
    smallIndex
  }

  state.moveHistory.push(manualMove)
  state.lastTurnMoves.push(manualMove)

  claimSmallBoardIfNeeded(state, bigIndex)

  const settlementEvents = settleFullBoards(state, [bigIndex])
  state.lastRuleEvents = settlementEvents
  recordAutomaticMovesFromEvents(state, settlementEvents)
  refreshBigBoardWinner(state)

  if (state.winner !== EMPTY) return true

  const directSettlement = settlementEvents.find((event) => event.boardIndex === bigIndex)

  if (directSettlement && isPlayer(directSettlement.owner)) {
    state.nextBoard = null
    state.currentPlayer = getOpponent(directSettlement.owner)
    return true
  }

  state.currentPlayer = getOpponent(movePlayer)

  if (smallIndex === CENTER_INDEX || isBoardFull(state, smallIndex)) {
    state.nextBoard = null
    return true
  }

  state.nextBoard = smallIndex

  return true
}

export function forceWinnerByResign(state: GameCoreState, loser: Player): GameCoreState {
  const nextState = cloneGameCoreState(state)
  nextState.winner = getOpponent(loser)
  nextState.bigBoardWinningLine = null
  nextState.nextBoard = null

  return nextState
}

function recordAutomaticMovesFromEvents(state: GameCoreState, settlementEvents: RuleEvent[]): void {
  for (const event of settlementEvents) {
    state.lastTurnMoves.push(...event.filledCells)
  }
}

function claimSmallBoardIfNeeded(state: GameCoreState, bigIndex: number): void {
  if (state.smallBoardStatus[bigIndex] !== EMPTY) return

  const result = getBoardResult(getBoardCells(state, bigIndex))

  if (isPlayer(result.status)) {
    state.smallBoardStatus[bigIndex] = result.status
    state.smallBoardWinningLines[bigIndex] = result.winningLine
  }
}

function settleFullBoards(state: GameCoreState, initialBoardIndexes: number[]): RuleEvent[] {
  const events: RuleEvent[] = []
  const queue = [...initialBoardIndexes]

  while (queue.length > 0) {
    const boardIndex = queue.shift()
    if (boardIndex === undefined) break
    if (state.smallBoardResolved[boardIndex]) continue
    if (!isBoardFull(state, boardIndex)) continue

    claimSmallBoardIfNeeded(state, boardIndex)

    if (state.smallBoardStatus[boardIndex] === EMPTY) {
      state.smallBoardStatus[boardIndex] = DRAW
      state.smallBoardWinningLines[boardIndex] = null
    }

    state.smallBoardResolved[boardIndex] = true
    const owner = state.smallBoardStatus[boardIndex]

    if (!isPlayer(owner)) {
      events.push({
        boardIndex,
        owner: DRAW,
        filledCount: 0,
        filledCells: []
      })
      continue
    }

    const filledCells = fillEntranceCells(state, boardIndex, owner)
    events.push({
      boardIndex,
      owner,
      filledCount: filledCells.length,
      filledCells
    })

    const affectedBoardIndexes = new Set<number>()
    for (const cell of filledCells) {
      affectedBoardIndexes.add(cell.bigIndex)
      claimSmallBoardIfNeeded(state, cell.bigIndex)
    }

    for (const affectedBoardIndex of affectedBoardIndexes) {
      if (isBoardFull(state, affectedBoardIndex) && !state.smallBoardResolved[affectedBoardIndex]) {
        queue.push(affectedBoardIndex)
      }
    }
  }

  return events
}

function fillEntranceCells(state: GameCoreState, targetBoardIndex: number, owner: Player): RecordedMove[] {
  const filledCells: RecordedMove[] = []

  for (let bigIndex = 0; bigIndex < 9; bigIndex += 1) {
    const cellIndex = getCellIndex(bigIndex, targetBoardIndex)

    if (state.board[cellIndex] !== EMPTY) continue

    state.board[cellIndex] = owner
    filledCells.push({
      bigIndex,
      smallIndex: targetBoardIndex,
      player: owner,
      source: 'auto',
      settlementBoardIndex: targetBoardIndex
    })
  }

  return filledCells
}

function refreshBigBoardWinner(state: GameCoreState): void {
  const result = getBoardResult(state.smallBoardStatus)
  state.winner = result.status
  state.bigBoardWinningLine = result.winningLine
}
