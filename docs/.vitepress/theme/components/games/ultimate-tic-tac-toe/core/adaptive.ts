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

const ADAPTIVE_STRENGTH_OFFSET = 0.05
const ADAPTIVE_STRENGTH_RATIO = 0.85

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

  const level = resolveAdaptiveLevel(adaptiveProfile.level)
  const isStrong = level >= 0.68
  const isMiddle = level >= 0.45

  return {
    targetDepth: isStrong ? 4 : 3,
    randomness: isStrong ? 0.16 : isMiddle ? 0.22 : 0.28,
    candidatePool: isStrong ? 3 : isMiddle ? 4 : 5,
    maxBranching: isStrong ? 14 : isMiddle ? 12 : 10,
    adaptiveLevel: level,
    deadlineMs: isStrong ? 900 : isMiddle ? 750 : 650,
    pressureStyle: 'adaptive',
    softenWhenAhead: true
  }
}

function resolveAdaptiveLevel(playerLevel: number): number {
  return clamp((playerLevel * ADAPTIVE_STRENGTH_RATIO) - ADAPTIVE_STRENGTH_OFFSET, 0.12, 0.74)
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
