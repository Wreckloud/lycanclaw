import { evaluateState } from './evaluate'
import { CENTER_INDEX, formatBigBoardIndex, formatSmallCellPosition, getOpponent, getPlayerName, isPlayer } from './rules'
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
  const quality = classifyMoveQuality(delta, afterState.winner, movePlayer)
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
      opponentBefore: opponentBeforeScore,
      opponentAfter: opponentAfterScore,
      opponentDelta: opponentAfterScore - opponentBeforeScore
    },
    aiDecision,
    tags,
    summary: createTurnSummary(afterState, movePlayer, bigIndex, smallIndex, quality)
  }
}

export function classifyMoveQuality(scoreDelta: number, winner: number, movePlayer: Player): MoveQuality {
  if (winner === movePlayer) return 'winning_move'
  if (scoreDelta >= 20000) return 'decisive_gain'
  if (scoreDelta >= 6000) return 'strong_gain'
  if (scoreDelta >= 1200) return 'good_gain'
  if (scoreDelta > -1200) return 'neutral'
  if (scoreDelta > -6000) return 'small_loss'
  if (scoreDelta > -20000) return 'bad_loss'

  return 'blunder'
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
    `${actorName} 下在 ${formatBigBoardIndex(bigIndex)} 棋盘 ${formatSmallCellPosition(smallIndex)}。`,
    getMoveQualityText(quality)
  ]

  if (state.lastRuleEvents.length > 0) {
    const rewardCount = state.lastRuleEvents.filter((event) => isPlayer(event.owner)).length
    if (rewardCount > 0) parts.push(`触发 ${rewardCount} 次入口奖励。`)
  }

  if (state.winner === DRAW) {
    parts.push('整局平局。')
  } else if (isPlayer(state.winner)) {
    parts.push(`${getPlayerName(state.winner, state)} 赢下整局。`)
  } else if (state.winner === EMPTY) {
    parts.push(state.nextBoard === null ? '下一手自由落子。' : `下一手进入 ${formatBigBoardIndex(state.nextBoard)} 棋盘。`)
  }

  return parts.join(' ')
}
