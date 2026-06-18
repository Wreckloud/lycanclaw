import { chooseAIMoveWithDeadline } from './ai'
import { type AdaptiveProfile, type AIDecision, type AIDifficulty, type GameCoreState, type Player } from './types'

export interface AIWorkerRequest {
  requestId: number
  state: GameCoreState
  aiPlayer: Player
  difficulty: AIDifficulty
  adaptiveProfile: AdaptiveProfile
  deadlineMs: number
}

export interface AIWorkerResponse {
  requestId: number
  decision: AIDecision
}

self.addEventListener('message', (event: MessageEvent<AIWorkerRequest>) => {
  const payload = event.data
  const decision = chooseAIMoveWithDeadline(
    payload.state,
    payload.aiPlayer,
    payload.difficulty,
    payload.adaptiveProfile,
    payload.deadlineMs
  )

  self.postMessage({
    requestId: payload.requestId,
    decision
  } satisfies AIWorkerResponse)
})
