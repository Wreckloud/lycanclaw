import { type AdaptiveProfile, type AIDifficulty, type MoveQuality, type TurnReport } from './types'

const QUALITY_SCORES: Record<MoveQuality, number> = {
  winning_move: 1,
  decisive_gain: 0.94,
  strong_gain: 0.82,
  good_gain: 0.68,
  neutral: 0.52,
  small_loss: 0.36,
  bad_loss: 0.18,
  blunder: 0.05
}

export interface ResolvedAIProfile {
  targetDepth: number
  randomness: number
  candidatePool: number
  maxBranching: number
  adaptiveLevel: number
  deadlineMs: number
  pressureStyle: 'fixed' | 'adaptive'
  softenWhenAhead: boolean
}

export function createAdaptiveProfileFromReports(previous: AdaptiveProfile, reports: TurnReport[]): AdaptiveProfile {
  const humanReports = reports.filter((report) => !report.actor.isAI)
  if (humanReports.length === 0) return previous

  const recentReports = humanReports.slice(-8)
  const recentScore = averageReportScore(recentReports)
  const gameScore = averageReportScore(humanReports)
  const targetLevel = (recentScore * 0.55) + (gameScore * 0.3) + (previous.level * 0.15)
  const nextLevel = clamp((previous.level * 0.72) + (targetLevel * 0.28), 0.12, 0.9)

  return {
    level: nextLevel,
    recentQuality: recentReports.map((report) => report.evaluation.quality),
    updatedAt: Date.now()
  }
}

export function resolveAIProfile(difficulty: AIDifficulty, adaptiveProfile: AdaptiveProfile): ResolvedAIProfile {
  if (difficulty === 'normal') {
    return {
      targetDepth: 3,
      randomness: 0.14,
      candidatePool: 3,
      maxBranching: 12,
      adaptiveLevel: 0.35,
      deadlineMs: 700,
      pressureStyle: 'fixed',
      softenWhenAhead: false
    }
  }

  if (difficulty === 'hard') {
    return {
      targetDepth: 4,
      randomness: 0.05,
      candidatePool: 2,
      maxBranching: 18,
      adaptiveLevel: 0.68,
      deadlineMs: 1000,
      pressureStyle: 'fixed',
      softenWhenAhead: false
    }
  }

  if (difficulty === 'nightmare') {
    return {
      targetDepth: 6,
      randomness: 0,
      candidatePool: 1,
      maxBranching: 28,
      adaptiveLevel: 1,
      deadlineMs: 1500,
      pressureStyle: 'fixed',
      softenWhenAhead: false
    }
  }

  const level = clamp(adaptiveProfile.level, 0.12, 0.9)
  const isStrong = level >= 0.85
  const isMiddle = level >= 0.55

  return {
    targetDepth: isStrong ? 5 : isMiddle ? 4 : 3,
    randomness: isStrong ? 0.08 : isMiddle ? 0.14 : 0.22,
    candidatePool: isStrong ? 2 : isMiddle ? 3 : 4,
    maxBranching: isStrong ? 20 : isMiddle ? 16 : 12,
    adaptiveLevel: level,
    deadlineMs: isStrong ? 1100 : isMiddle ? 900 : 750,
    pressureStyle: 'adaptive',
    softenWhenAhead: true
  }
}

function averageReportScore(reports: TurnReport[]): number {
  if (reports.length === 0) return 0.32

  const total = reports.reduce((sum, report) => {
    const percentile = report.evaluation.movePercentile
    if (Number.isFinite(percentile)) return sum + percentile

    return sum + QUALITY_SCORES[report.evaluation.quality]
  }, 0)

  return total / reports.length
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
