import { resolveAIProfile } from './adaptive'
import { evaluateState } from './evaluate'
import { applyMoveMutable } from './reducer'
import { cloneGameSearchState } from './state'
import { getLegalMoves, getOpponent, getCellIndex } from './rules'
import { EMPTY, type AdaptiveProfile, type AIDecision, type AIDecisionAnalysis, type AIDifficulty, type GameCoreState, type GameMove, type Player } from './types'

interface SearchContext {
  aiPlayer: Player
  deadlineAt: number
  nodeCount: number
  transpositionHits: number
  table: Map<string, TableEntry>
  maxBranching: number
}

interface TableEntry {
  depth: number
  score: number
  flag: 'exact' | 'lower' | 'upper'
}

const DEFAULT_DEADLINE_MS = 900

export function chooseAIMoveWithDeadline(
  state: GameCoreState,
  aiPlayer: Player,
  difficulty: AIDifficulty,
  adaptiveProfile: AdaptiveProfile,
  deadlineMs = DEFAULT_DEADLINE_MS
): AIDecision {
  const startedAt = now()
  const profile = resolveAIProfile(difficulty, adaptiveProfile)
  const legalMoves = getLegalMoves(state)
  const baseAnalysis: AIDecisionAnalysis = {
    difficulty,
    completedDepth: 0,
    targetDepth: profile.targetDepth,
    calculationTimeMs: 0,
    legalMoveCount: legalMoves.length,
    candidateMoveCount: 0,
    nodeCount: 0,
    transpositionHits: 0,
    tactic: 'none',
    selection: 'none',
    chosenScore: null,
    adaptiveLevel: profile.adaptiveLevel,
    topCandidates: []
  }

  if (legalMoves.length === 0) {
    return {
      move: null,
      resign: false,
      analysis: {
        ...baseAnalysis,
        tactic: 'no_legal_move',
        calculationTimeMs: Math.round(now() - startedAt)
      }
    }
  }

  const immediateWin = findImmediateWinningMove(state, legalMoves, aiPlayer)
  if (immediateWin) {
    return {
      move: immediateWin,
      resign: false,
      analysis: {
        ...baseAnalysis,
        completedDepth: 1,
        candidateMoveCount: legalMoves.length,
        tactic: 'immediate_win',
        selection: 'forced_win',
        chosenScore: 1_000_000,
        calculationTimeMs: Math.round(now() - startedAt),
        topCandidates: [{ ...immediateWin, score: 1_000_000 }]
      }
    }
  }

  const tacticalMoves = getTacticalMoves(state, legalMoves, aiPlayer)
  let bestMove = tacticalMoves.moves[0] ?? legalMoves[0]
  let bestScore = -Infinity
  let bestCandidates: Array<{ move: GameMove; score: number }> = []
  const context: SearchContext = {
    aiPlayer,
    deadlineAt: startedAt + deadlineMs,
    nodeCount: 0,
    transpositionHits: 0,
    table: new Map(),
    maxBranching: profile.maxBranching
  }

  for (let depth = 1; depth <= profile.targetDepth; depth += 1) {
    try {
      const scoredMoves = scoreRootMoves(state, tacticalMoves.moves, depth, context)
      if (scoredMoves.length === 0) break

      bestCandidates = scoredMoves
      const picked = pickScoredMove(scoredMoves, profile.randomness, profile.candidatePool)
      bestMove = picked.move
      bestScore = picked.score
      baseAnalysis.completedDepth = depth
      baseAnalysis.selection = picked.selection
      baseAnalysis.chosenScore = picked.score
    } catch (error) {
      if (error instanceof DeadlineExceededError) break
      throw error
    }
  }

  const resign = shouldAIResign(state, bestScore, baseAnalysis.completedDepth)

  return {
    move: resign ? null : bestMove,
    resign,
    analysis: {
      ...baseAnalysis,
      candidateMoveCount: tacticalMoves.moves.length,
      nodeCount: context.nodeCount,
      transpositionHits: context.transpositionHits,
      tactic: tacticalMoves.tactic,
      calculationTimeMs: Math.round(now() - startedAt),
      topCandidates: bestCandidates.slice(0, 5).map((item) => ({
        ...item.move,
        score: Math.round(item.score)
      }))
    }
  }
}

function scoreRootMoves(
  state: GameCoreState,
  moves: GameMove[],
  depth: number,
  context: SearchContext
): Array<{ move: GameMove; score: number; selection: 'best_score' | 'random_top_candidate' }> {
  const orderedMoves = orderMoves(state, moves, context.aiPlayer, true, context.maxBranching)
  const scoredMoves: Array<{ move: GameMove; score: number; selection: 'best_score' | 'random_top_candidate' }> = []

  for (const move of orderedMoves) {
    assertDeadline(context)
    const nextState = cloneGameSearchState(state)
    applyMoveMutable(nextState, move.bigIndex, move.smallIndex)

    scoredMoves.push({
      move,
      score: minimax(nextState, depth - 1, -Infinity, Infinity, context),
      selection: 'best_score'
    })
  }

  scoredMoves.sort((left, right) => right.score - left.score)

  return scoredMoves
}

function minimax(state: GameCoreState, depth: number, alpha: number, beta: number, context: SearchContext): number {
  assertDeadline(context)
  context.nodeCount += 1

  if (depth <= 0 || state.winner !== EMPTY) {
    return evaluateState(state, context.aiPlayer)
  }

  const key = createStateKey(state)
  const cached = context.table.get(key)
  if (cached && cached.depth >= depth) {
    context.transpositionHits += 1
    if (cached.flag === 'exact') return cached.score
    if (cached.flag === 'lower') alpha = Math.max(alpha, cached.score)
    if (cached.flag === 'upper') beta = Math.min(beta, cached.score)
    if (alpha >= beta) return cached.score
  }

  const legalMoves = getLegalMoves(state)
  if (legalMoves.length === 0) return evaluateState(state, context.aiPlayer)

  const originalAlpha = alpha
  const originalBeta = beta
  const maximizing = state.currentPlayer === context.aiPlayer
  const orderedMoves = orderMoves(state, legalMoves, context.aiPlayer, maximizing, context.maxBranching)
  let bestScore = maximizing ? -Infinity : Infinity

  for (const move of orderedMoves) {
    const nextState = cloneGameSearchState(state)
    applyMoveMutable(nextState, move.bigIndex, move.smallIndex)
    const score = minimax(nextState, depth - 1, alpha, beta, context)

    if (maximizing) {
      bestScore = Math.max(bestScore, score)
      alpha = Math.max(alpha, score)
    } else {
      bestScore = Math.min(bestScore, score)
      beta = Math.min(beta, score)
    }

    if (beta <= alpha) break
  }

  context.table.set(key, {
    depth,
    score: bestScore,
    flag: bestScore <= originalAlpha ? 'upper' : bestScore >= originalBeta ? 'lower' : 'exact'
  })

  return bestScore
}

function orderMoves(
  state: GameCoreState,
  moves: GameMove[],
  aiPlayer: Player,
  maximizing: boolean,
  maxBranching: number
): GameMove[] {
  const scoredMoves = moves.map((move) => {
    const nextState = cloneGameSearchState(state)
    applyMoveMutable(nextState, move.bigIndex, move.smallIndex)

    return {
      move,
      score: evaluateState(nextState, aiPlayer) + getMoveOrderingBonus(state, move, aiPlayer)
    }
  })

  scoredMoves.sort((left, right) => maximizing ? right.score - left.score : left.score - right.score)

  return scoredMoves.slice(0, maxBranching).map((item) => item.move)
}

function getTacticalMoves(
  state: GameCoreState,
  legalMoves: GameMove[],
  aiPlayer: Player
): { moves: GameMove[]; tactic: string } {
  const opponent = getOpponent(aiPlayer)
  const blockingMoves = legalMoves.filter((move) => {
    const nextState = cloneGameSearchState(state)
    applyMoveMutable(nextState, move.bigIndex, move.smallIndex)

    return findImmediateWinningMove(nextState, getLegalMoves(nextState), opponent) === null
  })

  if (blockingMoves.length > 0 && blockingMoves.length < legalMoves.length) {
    return {
      moves: blockingMoves,
      tactic: 'block_immediate_loss'
    }
  }

  return {
    moves: legalMoves,
    tactic: 'iterative_deepening'
  }
}

function findImmediateWinningMove(state: GameCoreState, legalMoves: GameMove[], player: Player): GameMove | null {
  for (const move of legalMoves) {
    const nextState = cloneGameSearchState(state)
    applyMoveMutable(nextState, move.bigIndex, move.smallIndex)

    if (nextState.winner === player) return move
  }

  return null
}

function pickScoredMove(
  scoredMoves: Array<{ move: GameMove; score: number }>,
  randomness: number,
  candidatePool: number
): { move: GameMove; score: number; selection: 'best_score' | 'random_top_candidate' } {
  if (randomness <= 0 || Math.random() > randomness) {
    return {
      ...scoredMoves[0],
      selection: 'best_score'
    }
  }

  const candidates = scoredMoves.slice(0, Math.max(1, Math.min(candidatePool, scoredMoves.length)))
  const picked = candidates[Math.floor(Math.random() * candidates.length)]

  return {
    ...picked,
    selection: 'random_top_candidate'
  }
}

function shouldAIResign(state: GameCoreState, score: number, completedDepth: number): boolean {
  if (state.moveHistory.length < 28) return false
  if (completedDepth < 3) return false

  return score < -180_000
}

function getMoveOrderingBonus(state: GameCoreState, move: GameMove, aiPlayer: Player): number {
  let bonus = 0

  if (move.smallIndex === 4) bonus += 80
  if ([0, 2, 6, 8].includes(move.smallIndex)) bonus += 32
  if ([0, 2, 4, 6, 8].includes(move.bigIndex)) bonus += 18
  if (state.board[getCellIndex(move.bigIndex, move.smallIndex)] === EMPTY && state.currentPlayer === aiPlayer) bonus += 6

  return bonus
}

function createStateKey(state: GameCoreState): string {
  return [
    state.board.join(''),
    state.smallBoardStatus.join(''),
    state.smallBoardResolved.map((value) => (value ? '1' : '0')).join(''),
    state.currentPlayer,
    state.nextBoard ?? 'n',
    state.winner
  ].join('|')
}

function assertDeadline(context: SearchContext): void {
  if (now() > context.deadlineAt) throw new DeadlineExceededError()
}

function now(): number {
  return typeof performance === 'undefined' ? Date.now() : performance.now()
}

class DeadlineExceededError extends Error {}
