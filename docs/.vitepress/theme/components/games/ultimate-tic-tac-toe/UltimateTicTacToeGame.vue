<template>
  <section class="utt-shell">
    <header class="utt-hero">
      <p class="utt-eyebrow">Ultimate Tic-Tac-Toe</p>
      <h1>九宫叠阵</h1>
      <p>九个棋盘互相牵引。落子不只是抢三连，也是把对手送往哪里。</p>
    </header>

    <div class="utt-layout">
      <section class="utt-board-card" aria-label="九宫叠阵棋盘">
        <div class="utt-board" :class="{ 'utt-board-finished': isFinished }">
          <div
            v-for="bigIndex in boardIndexes"
            :key="bigIndex"
            class="utt-small-board"
            :class="getSmallBoardClass(bigIndex)"
          >
            <button
              v-for="smallIndex in boardIndexes"
              :key="smallIndex"
              class="utt-cell"
              :class="getCellClass(bigIndex, smallIndex)"
              type="button"
              :disabled="!canPlayCell(bigIndex, smallIndex)"
              :aria-label="`${formatBigBoardIndex(bigIndex)} 棋盘 ${formatSmallCellPosition(smallIndex)}`"
              @click="handleCellClick(bigIndex, smallIndex)"
            >
              {{ getCellMark(bigIndex, smallIndex) }}
            </button>

            <div
              v-if="state.smallBoardWinningLines[bigIndex]"
              class="utt-win-line"
              :class="`utt-win-line-${state.smallBoardWinningLines[bigIndex]?.join('-')}`"
            />
          </div>
        </div>
      </section>

      <aside class="utt-side">
        <section class="utt-panel utt-status-panel">
          <div>
            <p class="utt-panel-label">当前局势</p>
            <h2>{{ statusTitle }}</h2>
            <p>{{ statusText }}</p>
          </div>
          <div class="utt-status-tags">
            <span>{{ getGameModeName(settings.gameMode) }}</span>
            <span>{{ getDifficultyName(settings.aiDifficulty) }}</span>
            <span>{{ state.moveHistory.length }} 手</span>
          </div>
        </section>

        <section class="utt-panel">
          <h2>对局设置</h2>
          <label class="utt-control">
            <span>模式</span>
            <select v-model="settings.gameMode" @change="handleModeChange">
              <option value="human-vs-ai">人机对战</option>
              <option value="local">本地对战</option>
              <option value="online">在线对战（预留）</option>
            </select>
          </label>

          <label class="utt-control">
            <span>电脑强度</span>
            <select v-model="settings.aiDifficulty" @change="handleDifficultyChange">
              <option value="adaptive">自适应</option>
              <option value="normal">普通</option>
              <option value="hard">困难</option>
              <option value="nightmare">噩梦</option>
            </select>
          </label>

          <p class="utt-help">{{ difficultyDescription }}</p>

          <div class="utt-actions">
            <button type="button" class="utt-primary-btn" @click="restartGame">再开一局</button>
            <button type="button" class="utt-ghost-btn" @click="handleResignOrRematch">{{ resignButtonText }}</button>
          </div>
        </section>

        <section class="utt-panel">
          <h2>电脑思路</h2>
          <div v-if="isThinking" class="utt-thinking">电脑正在搜索局面。</div>
          <div v-else-if="latestAIAnalysis" class="utt-ai-grid">
            <span>深度 {{ latestAIAnalysis.completedDepth }}/{{ latestAIAnalysis.targetDepth }}</span>
            <span>{{ latestAIAnalysis.calculationTimeMs }}ms</span>
            <span>{{ latestAIAnalysis.tactic }}</span>
            <span>节点 {{ latestAIAnalysis.nodeCount }}</span>
          </div>
          <p v-else class="utt-muted">电脑落子后会显示搜索深度、战术和候选评分。</p>
        </section>

        <section class="utt-panel utt-log-panel">
          <h2>对局记录</h2>
          <ol class="utt-log">
            <li v-for="item in visibleLog" :key="item.id">
              <strong>{{ item.title }}</strong>
              <span>{{ item.text }}</span>
            </li>
          </ol>
        </section>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { createAdaptiveProfileFromReports } from './core/adaptive'
import { chooseAIMoveWithDeadline } from './core/ai'
import type { AIWorkerResponse } from './core/ai.worker'
import { createTurnReport, getMoveQualityText } from './core/report'
import { applyMoveImmutable, forceWinnerByResign } from './core/reducer'
import {
  createInitialGameState,
  getDifficultyName,
  getGameModeName,
  loadAdaptiveProfile,
  loadGameSettings,
  saveAdaptiveProfile,
  saveGameSettings
} from './core/state'
import {
  canMove,
  formatBigBoardIndex,
  formatSmallCellPosition,
  getCellIndex,
  getEffectiveNextBoard,
  getInvalidMoveReason,
  getMarkText,
  getPlayerName,
  isPlayer
} from './core/rules'
import { EMPTY, O, X, type AIDecision, type AIDecisionAnalysis, type GameCoreState, type GameMove, type GameSettings, type Player } from './core/types'

interface LogItem {
  id: string
  title: string
  text: string
}

const boardIndexes = Array.from({ length: 9 }, (_, index) => index)
const settings = ref<GameSettings>(loadGameSettings())
const adaptiveProfile = ref(loadAdaptiveProfile())
const state = ref<GameCoreState>(createInitialGameState(settings.value))
const systemLog = ref<LogItem[]>([
  {
    id: 'start',
    title: '新的对局',
    text: '蓝方先手。中心格会让对手自由选择棋盘。'
  }
])
const errorMessage = ref('')
const isThinking = ref(false)
const worker = ref<Worker | null>(null)
let requestId = 0

const isFinished = computed(() => state.value.winner !== EMPTY)
const latestAIAnalysis = computed<AIDecisionAnalysis | null>(() => {
  return [...state.value.turnReports].reverse().find((report) => report.aiDecision)?.aiDecision ?? null
})

const difficultyDescription = computed(() => {
  switch (settings.value.aiDifficulty) {
    case 'normal':
      return '普通模式：适合休闲对局，电脑会防守基础威胁。'
    case 'hard':
      return '困难模式：适合认真挑战，电脑较少犯错。'
    case 'nightmare':
      return '噩梦模式：电脑不放水，尽量选择 deadline 内的最优手。'
    case 'adaptive':
      return '自适应模式：默认推荐，会根据玩家最近几手表现动态调整强度。'
  }
})

const statusTitle = computed(() => {
  if (state.value.winner === X) return '蓝方获胜'
  if (state.value.winner === O) return '红方获胜'
  if (isThinking.value) return '电脑思考中'

  return `${getPlayerName(state.value.currentPlayer, state.value)} 行动`
})

const statusText = computed(() => {
  if (state.value.winner === X || state.value.winner === O) {
    return `${getPlayerName(state.value.winner, state.value)} 赢下了整局。`
  }

  if (errorMessage.value) return errorMessage.value

  const nextBoard = getEffectiveNextBoard(state.value)
  if (nextBoard === null) return '当前可自由选择任意未满棋盘。'

  return `必须在 ${formatBigBoardIndex(nextBoard)} 棋盘落子。`
})

const resignButtonText = computed(() => {
  return isFinished.value ? '清空记录' : '投降'
})

const visibleLog = computed<LogItem[]>(() => {
  const reportLog = state.value.turnReports.slice(-8).map((report) => ({
    id: `turn-${report.id}`,
    title: `${report.actor.name} · ${getMoveQualityText(report.evaluation.quality)}`,
    text: report.summary
  }))

  return [...systemLog.value, ...reportLog].slice(-10)
})

onMounted(() => {
  worker.value = new Worker(new URL('./core/ai.worker.ts', import.meta.url), { type: 'module' })
  worker.value.addEventListener('message', handleWorkerMessage)
  requestAIMoveIfNeeded()
})

onBeforeUnmount(() => {
  worker.value?.removeEventListener('message', handleWorkerMessage)
  worker.value?.terminate()
})

function handleCellClick(bigIndex: number, smallIndex: number): void {
  if (isThinking.value || isAITurn(state.value)) {
    errorMessage.value = '电脑正在思考，先让它把这一步走完。'
    return
  }

  if (!canPlayCell(bigIndex, smallIndex)) {
    errorMessage.value = getInvalidMoveReason(state.value, bigIndex, smallIndex)
    return
  }

  playMove({ bigIndex, smallIndex })
}

function canPlayCell(bigIndex: number, smallIndex: number): boolean {
  if (settings.value.gameMode === 'online') return false
  if (isAITurn(state.value)) return false

  return canMove(state.value, bigIndex, smallIndex)
}

function playMove(move: GameMove, aiDecision: AIDecisionAnalysis | null = null): void {
  const beforeState = state.value
  const result = applyMoveImmutable(beforeState, move)
  if (!result.success) return

  const nextState = result.state
  const movePlayer = beforeState.currentPlayer
  const report = createTurnReport(beforeState, nextState, movePlayer, move.bigIndex, move.smallIndex, aiDecision)
  nextState.turnReports = [...nextState.turnReports, report]
  state.value = nextState
  errorMessage.value = ''

  if (!report.actor.isAI) {
    adaptiveProfile.value = createAdaptiveProfileFromReports(adaptiveProfile.value, nextState.turnReports)
    saveAdaptiveProfile(adaptiveProfile.value)
  }

  requestAIMoveIfNeeded()
}

function requestAIMoveIfNeeded(): void {
  if (!isAITurn(state.value) || state.value.winner !== EMPTY || isThinking.value) return

  isThinking.value = true
  const nextRequestId = requestId + 1
  requestId = nextRequestId

  const payload = {
    requestId: nextRequestId,
    state: state.value,
    aiPlayer: O as Player,
    difficulty: settings.value.aiDifficulty,
    adaptiveProfile: adaptiveProfile.value,
    deadlineMs: 900
  }

  try {
    worker.value?.postMessage(payload)
  } catch {
    const decision = chooseAIMoveWithDeadline(
      payload.state,
      payload.aiPlayer,
      payload.difficulty,
      payload.adaptiveProfile,
      payload.deadlineMs
    )
    applyAIDecision(nextRequestId, decision)
  }
}

function handleWorkerMessage(event: MessageEvent<AIWorkerResponse>): void {
  applyAIDecision(event.data.requestId, event.data.decision)
}

function applyAIDecision(responseId: number, decision: AIDecision): void {
  if (responseId !== requestId) return
  isThinking.value = false
  if (!isAITurn(state.value)) return

  if (decision.resign) {
    state.value = forceWinnerByResign(state.value, O)
    systemLog.value.push({
      id: `resign-${Date.now()}`,
      title: '电脑认输',
      text: '局势已经没有可见反打点，红方选择投降。'
    })
    return
  }

  if (decision.move) {
    playMove(decision.move, decision.analysis)
  }
}

function isAITurn(currentState: GameCoreState): boolean {
  return currentState.gameMode === 'human-vs-ai' && currentState.currentPlayer === O && currentState.winner === EMPTY
}

function getCellMark(bigIndex: number, smallIndex: number): string {
  return getMarkText(state.value.board[getCellIndex(bigIndex, smallIndex)])
}

function getCellClass(bigIndex: number, smallIndex: number): Record<string, boolean> {
  const value = state.value.board[getCellIndex(bigIndex, smallIndex)]
  const isLastMove = state.value.lastTurnMoves.some((move) => move.bigIndex === bigIndex && move.smallIndex === smallIndex)

  return {
    'utt-cell-x': value === X,
    'utt-cell-o': value === O,
    'utt-cell-last': isLastMove,
    'utt-cell-playable': canPlayCell(bigIndex, smallIndex)
  }
}

function getSmallBoardClass(bigIndex: number): Record<string, boolean> {
  const status = state.value.smallBoardStatus[bigIndex]
  const nextBoard = getEffectiveNextBoard(state.value)

  return {
    'utt-small-board-active': state.value.winner === EMPTY && (nextBoard === null || nextBoard === bigIndex),
    'utt-small-board-locked': state.value.winner === EMPTY && nextBoard !== null && nextBoard !== bigIndex,
    'utt-small-board-x': status === X,
    'utt-small-board-o': status === O,
    'utt-small-board-draw': status !== EMPTY && !isPlayer(status)
  }
}

function restartGame(): void {
  isThinking.value = false
  requestId += 1
  state.value = createInitialGameState(settings.value)
  errorMessage.value = ''
  systemLog.value = [
    {
      id: `restart-${Date.now()}`,
      title: '新的对局',
      text: `${getGameModeName(settings.value.gameMode)} · ${getDifficultyName(settings.value.aiDifficulty)}。`
    }
  ]
  requestAIMoveIfNeeded()
}

function handleResignOrRematch(): void {
  if (isFinished.value) {
    restartGame()
    return
  }

  state.value = forceWinnerByResign(state.value, state.value.currentPlayer)
  systemLog.value.push({
    id: `human-resign-${Date.now()}`,
    title: '主动投降',
    text: `${getPlayerName(state.value.currentPlayer, state.value)} 交出了这一局。`
  })
}

function handleModeChange(): void {
  if (settings.value.gameMode === 'online') {
    window.alert('在线对战模式先预留，后续接入房间和后端后再开启。')
    settings.value.gameMode = state.value.gameMode
    return
  }

  saveGameSettings(settings.value)
  restartGame()
}

function handleDifficultyChange(): void {
  saveGameSettings(settings.value)
  restartGame()
}
</script>

<style scoped>
.utt-shell {
  margin: 2rem 0 4rem;
}

.utt-hero {
  margin-bottom: 1.5rem;
  padding: 1.2rem 0;
  border-bottom: 1px solid var(--vp-c-divider);
}

.utt-eyebrow {
  margin: 0 0 0.35rem;
  color: var(--vp-c-brand-1);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.utt-hero h1 {
  margin: 0;
  font-size: clamp(2rem, 5vw, 4rem);
  line-height: 1;
  letter-spacing: -0.05em;
}

.utt-hero p:last-child {
  margin: 0.75rem 0 0;
  color: var(--vp-c-text-2);
}

.utt-layout {
  display: grid;
  grid-template-columns: minmax(360px, 1fr) 340px;
  gap: 1.2rem;
  align-items: stretch;
}

.utt-board-card,
.utt-panel {
  background:
    linear-gradient(135deg, rgba(22, 163, 70, 0.08), transparent 44%),
    var(--vp-c-bg-soft);
}

.utt-board-card {
  padding: clamp(0.7rem, 2vw, 1.4rem);
}

.utt-board {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: clamp(0.35rem, 1vw, 0.65rem);
  width: min(100%, 720px);
  aspect-ratio: 1;
  margin: 0 auto;
}

.utt-small-board {
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 3px;
  padding: 4px;
  background: rgba(125, 125, 125, 0.12);
  box-shadow: inset 0 0 0 1px rgba(125, 125, 125, 0.18);
  overflow: hidden;
  transition:
    opacity var(--lc-motion-duration-fast) var(--lc-motion-ease-standard),
    background var(--lc-motion-duration-fast) var(--lc-motion-ease-standard),
    box-shadow var(--lc-motion-duration-fast) var(--lc-motion-ease-standard);
}

.utt-small-board-active {
  box-shadow:
    inset 0 0 0 1px rgba(22, 163, 70, 0.34),
    0 0 0 1px rgba(22, 163, 70, 0.08);
}

.utt-small-board-locked {
  opacity: 0.48;
}

.utt-small-board-x {
  background: rgba(62, 117, 255, 0.12);
}

.utt-small-board-o {
  background: rgba(255, 84, 84, 0.11);
}

.utt-small-board-draw {
  opacity: 0.62;
}

.utt-cell {
  min-width: 0;
  aspect-ratio: 1;
  border: 0;
  background: rgba(255, 255, 255, 0.035);
  color: var(--vp-c-text-1);
  font-weight: 900;
  font-size: clamp(1rem, 3vw, 1.8rem);
  cursor: not-allowed;
  transition:
    background var(--lc-motion-duration-fast) var(--lc-motion-ease-standard),
    color var(--lc-motion-duration-fast) var(--lc-motion-ease-standard),
    transform var(--lc-motion-duration-fast) var(--lc-motion-ease-standard);
}

.utt-cell-playable {
  cursor: pointer;
}

.utt-cell-playable:hover {
  background: rgba(22, 163, 70, 0.14);
  transform: translateY(-1px);
}

.utt-cell-x {
  color: #5b7dff;
}

.utt-cell-o {
  color: #ff6a6a;
}

.utt-cell-last {
  background: rgba(22, 163, 70, 0.22);
}

.utt-win-line {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 2;
  width: 76%;
  height: 4px;
  background: var(--vp-c-brand-1);
  transform-origin: center;
  pointer-events: none;
}

.utt-win-line-0-1-2 { top: 17%; transform: translate(-50%, -50%); }
.utt-win-line-3-4-5 { top: 50%; transform: translate(-50%, -50%); }
.utt-win-line-6-7-8 { top: 83%; transform: translate(-50%, -50%); }
.utt-win-line-0-3-6 { left: 17%; transform: translate(-50%, -50%) rotate(90deg); }
.utt-win-line-1-4-7 { left: 50%; transform: translate(-50%, -50%) rotate(90deg); }
.utt-win-line-2-5-8 { left: 83%; transform: translate(-50%, -50%) rotate(90deg); }
.utt-win-line-0-4-8 { width: 104%; transform: translate(-50%, -50%) rotate(45deg); }
.utt-win-line-2-4-6 { width: 104%; transform: translate(-50%, -50%) rotate(-45deg); }

.utt-side {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  min-width: 0;
}

.utt-panel {
  padding: 1rem;
}

.utt-panel h2 {
  margin: 0 0 0.75rem;
  font-size: 1rem;
}

.utt-panel p {
  margin: 0;
  color: var(--vp-c-text-2);
  line-height: 1.65;
}

.utt-panel-label {
  margin-bottom: 0.35rem !important;
  color: var(--vp-c-brand-1) !important;
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.utt-status-panel {
  display: grid;
  gap: 0.85rem;
}

.utt-status-tags,
.utt-actions,
.utt-ai-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.utt-status-tags span,
.utt-ai-grid span {
  padding: 0.28rem 0.48rem;
  color: var(--vp-c-text-2);
  background: rgba(125, 125, 125, 0.1);
  font-size: 0.78rem;
}

.utt-control {
  display: grid;
  gap: 0.35rem;
  margin-bottom: 0.7rem;
  color: var(--vp-c-text-2);
  font-size: 0.86rem;
}

.utt-control select {
  width: 100%;
  padding: 0.5rem 0.65rem;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
}

.utt-help,
.utt-muted {
  font-size: 0.84rem;
}

.utt-primary-btn,
.utt-ghost-btn {
  flex: 1;
  min-height: 38px;
  border: 0;
  padding: 0 0.8rem;
  font-weight: 800;
  cursor: pointer;
}

.utt-primary-btn {
  background: var(--vp-c-brand-1);
  color: #fff;
}

.utt-ghost-btn {
  background: rgba(125, 125, 125, 0.12);
  color: var(--vp-c-text-1);
}

.utt-thinking {
  color: var(--vp-c-brand-1);
}

.utt-log {
  display: grid;
  gap: 0.7rem;
  max-height: 330px;
  margin: 0;
  padding: 0;
  overflow: auto;
  list-style: none;
}

.utt-log li {
  display: grid;
  gap: 0.25rem;
  padding-bottom: 0.65rem;
  border-bottom: 1px dashed var(--vp-c-divider);
}

.utt-log strong {
  color: var(--vp-c-text-1);
  font-size: 0.86rem;
}

.utt-log span {
  color: var(--vp-c-text-2);
  font-size: 0.82rem;
  line-height: 1.55;
}

@media (max-width: 960px) {
  .utt-layout {
    grid-template-columns: 1fr;
  }

  .utt-side {
    grid-row: 2;
  }
}

@media (max-width: 640px) {
  .utt-shell {
    margin-top: 1rem;
  }

  .utt-board {
    gap: 0.32rem;
  }

  .utt-small-board {
    gap: 2px;
    padding: 3px;
  }
}
</style>
