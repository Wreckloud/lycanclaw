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
}

export function createAdaptiveProfileFromReports(previous: AdaptiveProfile, reports: TurnReport[]): AdaptiveProfile {
  const humanQualities = reports
    .filter((report) => !report.actor.isAI)
    .map((report) => report.evaluation.quality)
    .slice(-12)

  if (humanQualities.length === 0) return previous

  const average = humanQualities.reduce((sum, quality) => sum + QUALITY_SCORES[quality], 0) / humanQualities.length
  const nextLevel = clamp(previous.level * 0.58 + average * 0.42, 0, 1)

  return {
    level: nextLevel,
    recentQuality: humanQualities,
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
      adaptiveLevel: 0.35
    }
  }

  if (difficulty === 'hard') {
    return {
      targetDepth: 4,
      randomness: 0.05,
      candidatePool: 2,
      maxBranching: 16,
      adaptiveLevel: 0.68
    }
  }

  if (difficulty === 'nightmare') {
    return {
      targetDepth: 5,
      randomness: 0,
      candidatePool: 1,
      maxBranching: 22,
      adaptiveLevel: 1
    }
  }

  const level = clamp(adaptiveProfile.level, 0, 1)

  return {
    targetDepth: level > 0.72 ? 5 : level > 0.42 ? 4 : 3,
    randomness: level > 0.72 ? 0.03 : level > 0.42 ? 0.08 : 0.16,
    candidatePool: level > 0.72 ? 1 : level > 0.42 ? 2 : 3,
    maxBranching: level > 0.72 ? 20 : level > 0.42 ? 16 : 12,
    adaptiveLevel: level
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
