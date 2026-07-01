import { evaluateState } from './evaluate'
import { GAME_TEXT } from './game-text'
import { applyMoveMutable } from './reducer'
import { CENTER_INDEX, formatBigBoardIndex, formatSmallCellPosition, getLegalMoves, getOpponent, getPlayerName, isPlayer } from './rules'
import { cloneGameSearchState } from './state'
import { DRAW, EMPTY, O, type AIDecisionAnalysis, type GameCoreState, type MoveQuality, type Player, type TurnReport } from './types'

export function createTurnReport(
  beforeState: GameCoreState,
  afterState: GameCoreState,
  movePlayer: Player,
  bigIndex: number,
  smallIndex: number,
  aiDecision: AIDecisionAnalysis | null = null
): TurnReport {
  const opponent = getOpponent(movePlayer)
  const beforeScore = evaluateState(beforeState, movePlayer)
  const afterScore = evaluateState(afterState, movePlayer)
  const opponentBeforeScore = evaluateState(beforeState, opponent)
  const opponentAfterScore = evaluateState(afterState, opponent)
  const delta = afterScore - beforeScore
  const moveRank = rankMove(beforeState, movePlayer, bigIndex, smallIndex)
  const quality = classifyMoveQuality(delta, afterState.winner, movePlayer, moveRank.percentile)
  const tags = createTurnTags(afterState, movePlayer, smallIndex, quality, delta, aiDecision)

  return {
    id: afterState.moveHistory.length,
    actor: {
      player: movePlayer,
      name: getPlayerName(movePlayer, afterState),
      isAI: afterState.gameMode === 'human-vs-ai' && movePlayer === O
    },
    move: {
      bigIndex,
      smallIndex,
      boardText: formatBigBoardIndex(bigIndex),
      cellText: formatSmallCellPosition(smallIndex),
      isCenter: smallIndex === CENTER_INDEX
    },
    evaluation: {
      perspectivePlayer: movePlayer,
      before: beforeScore,
      after: afterScore,
      delta,
      quality,
      moveRank: moveRank.rank,
      movePercentile: moveRank.percentile,
      opponentBefore: opponentBeforeScore,
      opponentAfter: opponentAfterScore,
      opponentDelta: opponentAfterScore - opponentBeforeScore
    },
    aiDecision,
    tags,
    summary: createTurnSummary(afterState, movePlayer, bigIndex, smallIndex, quality)
  }
}

export function classifyMoveQuality(scoreDelta: number, winner: number, movePlayer: Player, movePercentile = 0.5): MoveQuality {
  if (winner === movePlayer) return 'winning_move'
  if (movePercentile >= 0.92) {
    if (scoreDelta >= 6000) return 'decisive_gain'
    if (scoreDelta >= 1200) return 'strong_gain'
    return scoreDelta >= -12000 ? 'neutral' : 'small_loss'
  }
  if (movePercentile >= 0.78) {
    if (scoreDelta >= 1200) return 'strong_gain'
    if (scoreDelta >= 0) return 'good_gain'
    return scoreDelta >= -12000 ? 'neutral' : 'small_loss'
  }
  if (movePercentile >= 0.62) return scoreDelta >= 0 ? 'good_gain' : 'neutral'
  if (movePercentile >= 0.38) return scoreDelta >= -20000 ? 'neutral' : 'small_loss'
  if (movePercentile >= 0.22) return 'small_loss'
  if (movePercentile >= 0.1) return 'bad_loss'
  if (scoreDelta > -6000) return 'small_loss'
  if (scoreDelta > -20000) return 'bad_loss'

  return 'blunder'
}

function rankMove(
  beforeState: GameCoreState,
  movePlayer: Player,
  bigIndex: number,
  smallIndex: number
): { rank: number; percentile: number } {
  const legalMoves = getLegalMoves(beforeState)
  if (legalMoves.length <= 1) {
    return {
      rank: 1,
      percentile: 1
    }
  }

  const scoredMoves = legalMoves.map((move) => {
    const nextState = cloneGameSearchState(beforeState)
    applyMoveMutable(nextState, move.bigIndex, move.smallIndex)

    return {
      move,
      score: evaluateState(nextState, movePlayer)
    }
  })

  scoredMoves.sort((left, right) => right.score - left.score)
  const index = scoredMoves.findIndex((item) => item.move.bigIndex === bigIndex && item.move.smallIndex === smallIndex)
  const rank = index >= 0 ? index + 1 : scoredMoves.length

  return {
    rank,
    percentile: 1 - ((rank - 1) / (scoredMoves.length - 1))
  }
}

export function getMoveQualityText(quality: MoveQuality): string {
  switch (quality) {
    case 'winning_move':
      return '终局一手'
    case 'decisive_gain':
      return '决定优势'
    case 'strong_gain':
      return '扩大优势'
    case 'good_gain':
      return '稳健收益'
    case 'neutral':
      return '局势平稳'
    case 'small_loss':
      return '略有让步'
    case 'bad_loss':
      return '危险选择'
    case 'blunder':
      return '严重失误'
  }
}

function createTurnTags(
  state: GameCoreState,
  movePlayer: Player,
  smallIndex: number,
  quality: MoveQuality,
  scoreDelta: number,
  aiDecision: AIDecisionAnalysis | null
): string[] {
  const tags: string[] = [quality]

  if (smallIndex === CENTER_INDEX) tags.push('center_move')
  if (state.nextBoard === null) tags.push('free_move')
  if (state.lastRuleEvents.some((event) => isPlayer(event.owner))) tags.push('entrance_reward')
  if (state.lastRuleEvents.length > 1) tags.push('chain_settlement')
  if (state.winner === movePlayer) tags.push('game_winning_move')
  if (scoreDelta <= -6000) tags.push('risky_move')
  if (aiDecision) {
    tags.push('ai_move')
    tags.push(`ai_${aiDecision.tactic}`)
  }

  return tags
}

function createTurnSummary(
  state: GameCoreState,
  movePlayer: Player,
  bigIndex: number,
  smallIndex: number,
  quality: MoveQuality
): string {
  const actorName = getPlayerName(movePlayer, state)
  const parts = [
    GAME_TEXT.record.moveBoard(actorName, formatBigBoardIndex(bigIndex)),
    formatSmallCellPosition(smallIndex),
    getMoveQualityText(quality)
  ]

  if (state.lastRuleEvents.length > 0) {
    const rewardCount = state.lastRuleEvents.filter((event) => isPlayer(event.owner)).length
    if (rewardCount > 0) parts.push(`入口奖励 ${rewardCount} 次`)
  }

  if (state.winner === DRAW) {
    parts.push(GAME_TEXT.record.gameDraw())
  } else if (isPlayer(state.winner)) {
    parts.push(GAME_TEXT.record.wholeWinner(getPlayerName(state.winner, state)))
  } else if (state.winner === EMPTY) {
    parts.push(state.nextBoard === null ? '下一手自由落子' : `下一手 ${formatBigBoardIndex(state.nextBoard)} 棋盘`)
  }

  return parts.join('\n')
}
