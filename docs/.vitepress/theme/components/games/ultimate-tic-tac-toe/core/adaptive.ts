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

interface DifficultyConfig {
  minLevel: number
  maxLevel: number
  lowProfile: ProfileConfig
  highProfile: ProfileConfig
  softenAhead: SofteningConfig
}

interface ProfileConfig {
  targetDepth: number
  randomness: number
  candidatePool: number
  maxBranching: number
  deadlineMs: number
}

interface SofteningConfig {
  enabled: boolean
  minPositionState: 'ahead' | 'crushing'
  windowSize: number
  startIndex: number
  maxScoreDrop: number
  safeFloor: number
}

export interface ResolvedAIProfile {
  targetDepth: number
  randomness: number
  candidatePool: number
  maxBranching: number
  adaptiveLevel: number
  deadlineMs: number
  softening: SofteningConfig
}

const DIFFICULTY_CONFIGS: Record<AIDifficulty, DifficultyConfig> = {
  easy: {
    minLevel: 0.12,
    maxLevel: 0.42,
    lowProfile: {
      targetDepth: 2,
      randomness: 0.34,
      candidatePool: 5,
      maxBranching: 9,
      deadlineMs: 520
    },
    highProfile: {
      targetDepth: 3,
      randomness: 0.28,
      candidatePool: 5,
      maxBranching: 11,
      deadlineMs: 650
    },
    softenAhead: {
      enabled: true,
      minPositionState: 'ahead',
      windowSize: 6,
      startIndex: 1,
      maxScoreDrop: 16_000,
      safeFloor: -5_000
    }
  },
  normal: {
    minLevel: 0.32,
    maxLevel: 0.62,
    lowProfile: {
      targetDepth: 3,
      randomness: 0.22,
      candidatePool: 4,
      maxBranching: 11,
      deadlineMs: 650
    },
    highProfile: {
      targetDepth: 4,
      randomness: 0.16,
      candidatePool: 3,
      maxBranching: 14,
      deadlineMs: 850
    },
    softenAhead: {
      enabled: true,
      minPositionState: 'ahead',
      windowSize: 5,
      startIndex: 1,
      maxScoreDrop: 10_000,
      safeFloor: -2_500
    }
  },
  hard: {
    minLevel: 0.58,
    maxLevel: 0.82,
    lowProfile: {
      targetDepth: 4,
      randomness: 0.08,
      candidatePool: 3,
      maxBranching: 16,
      deadlineMs: 950
    },
    highProfile: {
      targetDepth: 5,
      randomness: 0.04,
      candidatePool: 2,
      maxBranching: 20,
      deadlineMs: 1150
    },
    softenAhead: {
      enabled: true,
      minPositionState: 'crushing',
      windowSize: 4,
      startIndex: 1,
      maxScoreDrop: 5_000,
      safeFloor: 0
    }
  },
  nightmare: {
    minLevel: 0.86,
    maxLevel: 1,
    lowProfile: {
      targetDepth: 5,
      randomness: 0.02,
      candidatePool: 2,
      maxBranching: 24,
      deadlineMs: 1300
    },
    highProfile: {
      targetDepth: 6,
      randomness: 0,
      candidatePool: 1,
      maxBranching: 28,
      deadlineMs: 1500
    },
    softenAhead: {
      enabled: false,
      minPositionState: 'crushing',
      windowSize: 1,
      startIndex: 0,
      maxScoreDrop: 0,
      safeFloor: 0
    }
  }
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
  const config = DIFFICULTY_CONFIGS[difficulty]
  const playerLevel = resolveAdaptiveLevel(adaptiveProfile.level)
  const adaptiveLevel = lerp(config.minLevel, config.maxLevel, playerLevel)

  return {
    targetDepth: Math.round(lerp(config.lowProfile.targetDepth, config.highProfile.targetDepth, playerLevel)),
    randomness: lerp(config.lowProfile.randomness, config.highProfile.randomness, playerLevel),
    candidatePool: Math.round(lerp(config.lowProfile.candidatePool, config.highProfile.candidatePool, playerLevel)),
    maxBranching: Math.round(lerp(config.lowProfile.maxBranching, config.highProfile.maxBranching, playerLevel)),
    adaptiveLevel,
    deadlineMs: Math.round(lerp(config.lowProfile.deadlineMs, config.highProfile.deadlineMs, playerLevel)),
    softening: config.softenAhead
  }
}

function resolveAdaptiveLevel(playerLevel: number): number {
  return clamp((playerLevel * ADAPTIVE_STRENGTH_RATIO) - ADAPTIVE_STRENGTH_OFFSET, 0, 1)
}

function lerp(min: number, max: number, ratio: number): number {
  return min + ((max - min) * ratio)
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
