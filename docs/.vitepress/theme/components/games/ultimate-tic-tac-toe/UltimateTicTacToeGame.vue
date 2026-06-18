<template>
  <section class="utt-game-page">
    <div class="utt-app">
      <section class="utt-game-area" aria-label="九宫叠阵棋盘">
        <div class="utt-board">
          <div
            v-for="bigIndex in boardIndexes"
            :key="bigIndex"
            class="utt-small-board"
            :data-big-index="bigIndex"
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
              @mouseenter="showNextBoardPreview(bigIndex, smallIndex)"
              @mouseleave="clearNextBoardPreview"
              @focus="showNextBoardPreview(bigIndex, smallIndex)"
              @blur="clearNextBoardPreview"
            >
              {{ getCellMark(bigIndex, smallIndex) }}
            </button>

            <div
              v-if="state.smallBoardWinningLines[bigIndex]"
              class="utt-win-line"
              :class="[
                `utt-win-line-${state.smallBoardWinningLines[bigIndex]?.join('-')}`,
                state.smallBoardStatus[bigIndex] === X ? 'utt-win-line-blue' : 'utt-win-line-red'
              ]"
            />
          </div>

          <div
            v-if="previewFrameStyle"
            class="utt-preview-frame"
            :class="{
              'utt-preview-frame-visible': isPreviewFrameVisible,
              'utt-preview-frame-free': isPreviewFrameFree
            }"
            :style="previewFrameStyle"
          />
        </div>
      </section>

      <aside class="utt-side-panel">
        <section class="utt-game-menu">
          <h2 class="utt-panel-title utt-menu-panel-title">对局菜单</h2>

          <label class="utt-menu-control">
            <span class="utt-menu-label">对战模式</span>
            <select v-model="settings.gameMode" class="utt-menu-select" @change="handleModeChange">
              <option value="human-vs-ai">人机对战</option>
              <option value="local">本地对战</option>
              <option value="online">在线对战</option>
            </select>
          </label>

          <label class="utt-menu-control">
            <span class="utt-menu-label">电脑难度</span>
            <select
              v-model="settings.aiDifficulty"
              class="utt-menu-select"
              :disabled="settings.gameMode !== 'human-vs-ai'"
              @change="handleDifficultyChange"
            >
              <option value="adaptive">自适应</option>
              <option value="normal">普通</option>
              <option value="hard">困难</option>
              <option value="nightmare">噩梦</option>
            </select>
          </label>

          <button type="button" class="utt-menu-button" @click="isRulesOpen = true">游戏规则</button>
          <button
            type="button"
            class="utt-menu-button"
            :class="isFinished ? 'utt-menu-button-primary' : 'utt-menu-button-danger'"
            @click="handleResignOrRematch"
          >
            {{ resignButtonText }}
          </button>
        </section>

        <section class="utt-log-panel">
          <h2 class="utt-panel-title">对局记录</h2>

          <ul ref="logRef" class="utt-game-log">
            <li
              v-for="(message, index) in state.messages"
              :key="message.id"
              class="utt-log-message"
              :class="getMessageClass(message)"
              :style="{ opacity: getMessageOpacity(index) }"
            >
              {{ message.text }}
            </li>
          </ul>

          <form class="utt-message-input" @submit.prevent="handleSendMessage">
            <input
              v-model="messageDraft"
              type="text"
              :placeholder="messagePlaceholder"
              :class="{ 'utt-input-error': !state.isMessageInputFocused && state.errorMessage }"
              @focus="handleMessageFocus"
              @blur="handleMessageBlur"
            >
            <button type="submit">发送</button>
          </form>
        </section>
      </aside>
    </div>

    <div v-if="isRulesOpen" class="utt-rules-dialog" role="dialog" aria-modal="true" aria-label="游戏规则">
      <div class="utt-rules-card">
        <h2>游戏规则</h2>
        <p>游戏由 9 个小棋盘组成，每个小棋盘都是一个 3×3 井字棋。</p>
        <p>玩家落子后，通常会把对手送到对应编号的小棋盘。例如下在第 1 格，对手下一步通常要去 1 号小棋盘。</p>
        <p>下在中心格时，对手下一步可以自由选择任意可落子的棋盘。</p>
        <p>当玩家在某个小棋盘里完成三连，该小棋盘会被该玩家控制。控制权一旦确定，不会因为后续落子改变。</p>
        <p>被控制的小棋盘如果还没满，仍然可以继续落子。只有小棋盘满格时，才会触发满格结算。</p>
        <p>如果满格的小棋盘有控制者，控制者会获得入口奖励：所有通向该小棋盘的空入口都会自动填入控制者的棋子；已有棋子的入口不变。随后控制者的对手获得自由落子。</p>
        <p>如果小棋盘满格但无人控制，则记为平局，不触发入口奖励。</p>
        <p>当一方控制的大棋盘位置连成三连时，该方赢得整局游戏。</p>
        <button type="button" class="utt-menu-button" @click="isRulesOpen = false">知道了</button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { createAdaptiveProfileFromReports } from './core/adaptive'
import { chooseAIMoveWithDeadline } from './core/ai'
import type { AIWorkerResponse } from './core/ai.worker'
import { createTurnReport } from './core/report'
import { applyMoveImmutable, forceWinnerByResign } from './core/reducer'
import {
  createInitialGameState,
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
  getOpponent,
  getPlayerName,
  isBoardFull,
  isPlayer
} from './core/rules'
import {
  DRAW,
  EMPTY,
  O,
  X,
  type AIDecision,
  type AIDecisionAnalysis,
  type GameCoreState,
  type GameMessage,
  type GameMove,
  type GameSettings,
  type Player
} from './core/types'

const boardIndexes = Array.from({ length: 9 }, (_, index) => index)
const settings = ref<GameSettings>(loadGameSettings())
const adaptiveProfile = ref(loadAdaptiveProfile())
const state = ref<GameCoreState>(createInitialGameState(settings.value))
const isThinking = ref(false)
const worker = ref<Worker | null>(null)
const isRulesOpen = ref(false)
const messageDraft = ref('')
const activePreviewTarget = ref<PreviewTarget | null>(null)
const lastPreviewTarget = ref<PreviewTarget | null>(null)
const logRef = ref<HTMLElement | null>(null)
let requestId = 0
let aiRequestTimer: number | null = null

type PreviewTarget =
  | {
      type: 'board'
      boardIndex: number
    }
  | {
      type: 'free'
    }

const isFinished = computed(() => state.value.winner !== EMPTY)
const resignButtonText = computed(() => (isFinished.value ? '再来一把！' : '投降'))
const isPreviewFrameVisible = computed(() => activePreviewTarget.value !== null)
const isPreviewFrameFree = computed(() => (activePreviewTarget.value ?? lastPreviewTarget.value)?.type === 'free')
const previewFrameStyle = computed<Record<string, string> | null>(() => {
  const target = activePreviewTarget.value ?? lastPreviewTarget.value
  if (!target) return null

  if (target.type === 'free') {
    return {
      left: 'calc(var(--utt-board-padding) - var(--utt-indicator-offset) - var(--utt-indicator-width))',
      top: 'calc(var(--utt-board-padding) - var(--utt-indicator-offset) - var(--utt-indicator-width))',
      width: 'calc(100% - var(--utt-board-padding) - var(--utt-board-padding) + var(--utt-indicator-offset) + var(--utt-indicator-offset) + var(--utt-indicator-width) + var(--utt-indicator-width))',
      height: 'calc(100% - var(--utt-board-padding) - var(--utt-board-padding) + var(--utt-indicator-offset) + var(--utt-indicator-offset) + var(--utt-indicator-width) + var(--utt-indicator-width))'
    }
  }

  const col = target.boardIndex % 3
  const row = Math.floor(target.boardIndex / 3)
  const boardSize = 'calc((100% - var(--utt-board-padding) - var(--utt-board-padding) - var(--utt-board-gap) - var(--utt-board-gap)) / 3)'
  const step = `calc(${boardSize} + var(--utt-board-gap))`
  const colOffset = repeatCssAddition(step, col)
  const rowOffset = repeatCssAddition(step, row)

  return {
    left: `calc(var(--utt-board-padding)${colOffset} - var(--utt-indicator-offset) - var(--utt-indicator-width))`,
    top: `calc(var(--utt-board-padding)${rowOffset} - var(--utt-indicator-offset) - var(--utt-indicator-width))`,
    width: `calc(${boardSize} + var(--utt-indicator-offset) + var(--utt-indicator-offset) + var(--utt-indicator-width) + var(--utt-indicator-width))`,
    height: `calc(${boardSize} + var(--utt-indicator-offset) + var(--utt-indicator-offset) + var(--utt-indicator-width) + var(--utt-indicator-width))`
  }
})
const messagePlaceholder = computed(() => {
  if (state.value.isMessageInputFocused) return ''
  if (state.value.errorMessage) return state.value.errorMessage

  return '输入消息...'
})

onMounted(() => {
  worker.value = new Worker(new URL('./core/ai.worker.ts', import.meta.url), { type: 'module' })
  worker.value.addEventListener('message', handleWorkerMessage)
  requestAIMoveIfNeeded()
  scrollLogToBottom()
})

onBeforeUnmount(() => {
  clearAIRequestTimer()
  worker.value?.removeEventListener('message', handleWorkerMessage)
  worker.value?.terminate()
})

watch(
  () => state.value.messages.length,
  () => scrollLogToBottom()
)

function handleCellClick(bigIndex: number, smallIndex: number): void {
  if (isThinking.value || isAITurn(state.value)) {
    setError(`${getPlayerName(state.value.currentPlayer, state.value)}正在思考。`)
    return
  }

  if (!canPlayCell(bigIndex, smallIndex)) {
    setError(getInvalidMoveReason(state.value, bigIndex, smallIndex))
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
  nextState.messages.push(createMoveMessage(nextState, movePlayer, move, report.id))
  nextState.errorMessage = ''
  state.value = nextState
  clearNextBoardPreview()

  if (!report.actor.isAI) {
    adaptiveProfile.value = createAdaptiveProfileFromReports(adaptiveProfile.value, nextState.turnReports)
    saveAdaptiveProfile(adaptiveProfile.value)
  }

  scheduleAIMoveIfNeeded()
}

function scheduleAIMoveIfNeeded(): void {
  clearAIRequestTimer()
  if (!isAITurn(state.value) || state.value.winner !== EMPTY) return

  // 先让玩家落子渲染出来，再进入电脑搜索，避免同一帧里连续显示两步。
  void nextTick(() => {
    aiRequestTimer = window.setTimeout(() => {
      aiRequestTimer = null
      requestAIMoveIfNeeded()
    }, 180)
  })
}

function clearAIRequestTimer(): void {
  if (aiRequestTimer === null) return
  window.clearTimeout(aiRequestTimer)
  aiRequestTimer = null
}

function requestAIMoveIfNeeded(): void {
  clearAIRequestTimer()
  if (!isAITurn(state.value) || state.value.winner !== EMPTY || isThinking.value) return

  isThinking.value = true
  setError(`${getPlayerName(state.value.currentPlayer, state.value)}正在思考。`)
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
    const nextState = forceWinnerByResign(state.value, O)
    nextState.errorMessage = ''
    nextState.messages.push({
      id: `ai-resign-${Date.now()}`,
      type: 'system',
      text: '局势已经没有可见反打点，红方选择投降。'
    })
    state.value = nextState
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
  const lastTurnMove = state.value.lastTurnMoves.find((move) => move.bigIndex === bigIndex && move.smallIndex === smallIndex)
  const canPlay = canPlayCell(bigIndex, smallIndex)

  return {
    'utt-cell-x': value === X,
    'utt-cell-o': value === O,
    'utt-cell-last-move': Boolean(lastTurnMove),
    'utt-cell-last-turn-manual': lastTurnMove?.source === 'manual',
    'utt-cell-last-turn-auto': lastTurnMove?.source === 'auto',
    'utt-cell-disabled': !canPlay,
    'utt-hoverable-x': canPlay && state.value.currentPlayer === X,
    'utt-hoverable-o': canPlay && state.value.currentPlayer === O
  }
}

function getSmallBoardClass(bigIndex: number): Record<string, boolean> {
  const status = state.value.smallBoardStatus[bigIndex]
  const boardFull = isBoardFull(state.value, bigIndex)
  const effectiveNextBoard = getEffectiveNextBoard(state.value)
  const isPlayableBoard = state.value.winner === EMPTY && !boardFull && (effectiveNextBoard === null || effectiveNextBoard === bigIndex)
  const isLockedBoard = state.value.winner === EMPTY && !boardFull && !isPlayableBoard
  const hasBigBoardWinner = state.value.winner === X || state.value.winner === O
  const bigBoardWinningLine = state.value.bigBoardWinningLine ?? []

  return {
    'utt-small-board-full': boardFull,
    'utt-small-board-locked': isLockedBoard,
    'utt-small-board-claimed-x': status === X,
    'utt-small-board-claimed-o': status === O,
    'utt-small-board-draw': status === DRAW,
    'utt-small-board-big-win': hasBigBoardWinner && bigBoardWinningLine.includes(bigIndex),
    'utt-small-board-big-dimmed': hasBigBoardWinner && !bigBoardWinningLine.includes(bigIndex)
  }
}

function showNextBoardPreview(bigIndex: number, smallIndex: number): void {
  clearNextBoardPreview()
  if (!canPlayCell(bigIndex, smallIndex)) return

  const result = applyMoveImmutable(state.value, { bigIndex, smallIndex })
  if (!result.success || result.state.winner !== EMPTY) return

  const targetBoard = getEffectiveNextBoard(result.state)
  if (targetBoard === null) {
    setPreviewTarget({ type: 'free' })
    return
  }

  setPreviewTarget({ type: 'board', boardIndex: targetBoard })
}

function clearNextBoardPreview(): void {
  activePreviewTarget.value = null
}

function setPreviewTarget(target: PreviewTarget): void {
  activePreviewTarget.value = target
  lastPreviewTarget.value = target
}

function repeatCssAddition(value: string, times: number): string {
  return Array.from({ length: times }, () => ` + ${value}`).join('')
}

function restartGame(): void {
  isThinking.value = false
  clearAIRequestTimer()
  requestId += 1
  state.value = createInitialGameState(settings.value)
  clearNextBoardPreview()
  requestAIMoveIfNeeded()
}

function handleResignOrRematch(): void {
  clearAIRequestTimer()

  if (isFinished.value) {
    restartGame()
    return
  }

  const loser = state.value.currentPlayer
  const winner = getOpponent(loser)
  const confirmed = window.confirm(`${getPlayerName(loser, state.value)} 确定要投降吗？`)
  if (!confirmed) return

  const nextState = forceWinnerByResign(state.value, loser)
  nextState.errorMessage = ''
  nextState.messages.push({
    id: `human-resign-${Date.now()}`,
    type: 'system',
    text: `${getPlayerName(loser, nextState)} 选择投降，${getPlayerName(winner, nextState)} 赢得了本局。`
  })
  state.value = nextState
}

function handleModeChange(): void {
  if (settings.value.gameMode === 'online') {
    window.alert('在线对战模式先预留，后续接入房间和后端后再开启。')
    settings.value.gameMode = state.value.gameMode
    return
  }

  if (!confirmRestart('切换对战模式会重新开始当前对局，确定要切换吗？')) {
    settings.value.gameMode = state.value.gameMode
    return
  }

  saveGameSettings(settings.value)
  restartGame()
}

function handleDifficultyChange(): void {
  if (!confirmRestart('切换电脑玩家难度会重新开始当前对局，确定要切换吗？')) {
    settings.value.aiDifficulty = state.value.aiDifficulty
    return
  }

  saveGameSettings(settings.value)
  restartGame()
}

function handleMessageFocus(): void {
  state.value.errorMessage = ''
  state.value.isMessageInputFocused = true
}

function handleMessageBlur(): void {
  state.value.isMessageInputFocused = false
}

function handleSendMessage(): void {
  const text = messageDraft.value.trim()
  if (!text) return

  state.value.errorMessage = ''
  const sender = state.value.currentPlayer
  const message: GameMessage = {
    id: `chat-${Date.now()}-${state.value.messages.length}`,
    type: 'chat',
    sender,
    senderName: getPlayerName(sender, state.value),
    text: `${getPlayerName(sender, state.value)} 说：${text}`
  }
  state.value.messages.push(message)
  messageDraft.value = ''
}

function getMessageClass(message: GameMessage): Record<string, boolean> {
  return {
    'utt-log-message-system': message.type === 'system',
    'utt-log-message-blue': message.player === X || message.sender === X,
    'utt-log-message-red': message.player === O || message.sender === O
  }
}

function getMessageOpacity(index: number): number {
  const distanceFromLatest = state.value.messages.length - 1 - index

  return Math.max(0.35, 1 - distanceFromLatest * 0.15)
}

function createMoveMessage(nextState: GameCoreState, movePlayer: Player, move: GameMove, reportId: number): GameMessage {
  const playerName = getPlayerName(movePlayer, nextState)
  let text = `${playerName} 下在了 ${formatBigBoardIndex(move.bigIndex)} 棋盘的第 ${formatSmallCellPosition(move.smallIndex)} 格`

  if (nextState.lastRuleEvents.length > 0) {
    const mainEvent = nextState.lastRuleEvents[0]

    if (mainEvent.owner === DRAW) {
      text += `\n${formatBigBoardIndex(mainEvent.boardIndex)} 棋盘平局了`
    } else if (isPlayer(mainEvent.owner)) {
      text += `\n${formatBigBoardIndex(mainEvent.boardIndex)} 棋盘满格，${getPlayerName(mainEvent.owner, nextState)}获得入口奖励，填充了 ${mainEvent.filledCount} 个入口`
      text += `\n${getPlayerName(getOpponent(mainEvent.owner), nextState)} 获得自由落子。`
    }

    if (nextState.lastRuleEvents.length > 1) {
      text += `\n由于连锁反应，另外 ${nextState.lastRuleEvents.length - 1} 个棋盘也被结算了。`
    }
  }

  if (isPlayer(nextState.winner)) {
    text += `\n${getPlayerName(nextState.winner, nextState)} 赢得了整局游戏。`
  } else if (nextState.winner === DRAW) {
    text += '\n整局游戏平局。'
  } else if (nextState.nextBoard === null) {
    text += `\n${getPlayerName(nextState.currentPlayer, nextState)} 可自由选择棋盘`
  } else {
    text += `\n轮到 ${getPlayerName(nextState.currentPlayer, nextState)} 在 ${formatBigBoardIndex(nextState.nextBoard)} 棋盘落子`
  }

  return {
    id: `move-${Date.now()}-${reportId}`,
    type: 'move',
    player: movePlayer,
    reportId,
    text
  }
}

function confirmRestart(message: string): boolean {
  if (state.value.winner !== EMPTY || state.value.moveHistory.length === 0) return true

  return window.confirm(message)
}

function setError(message: string): void {
  state.value.errorMessage = message
  scrollLogToBottom()
}

function scrollLogToBottom(): void {
  void nextTick(() => {
    if (!logRef.value) return
    logRef.value.scrollTop = logRef.value.scrollHeight
  })
}
</script>

<style scoped>
.utt-game-page {
  width: min(1480px, calc(100vw - 24px));
  margin: 0 0 4rem 50%;
  transform: translateX(-50%);
}

:global(.VPDoc:has(.utt-game-page)) {
  padding-top: 16px;
}

:global(.VPDoc:has(.utt-game-page) .container),
:global(.VPDoc:has(.utt-game-page) .content),
:global(.VPDoc:has(.utt-game-page) .content-container) {
  max-width: none;
}

:global(.VPDoc:has(.utt-game-page) .content) {
  padding-left: 12px;
  padding-right: 12px;
}

.utt-app {
  --utt-panel-width: clamp(300px, 23vw, 340px);
  --utt-game-gap: clamp(14px, 1.6vw, 24px);

  display: grid;
  grid-template-columns: minmax(0, 1fr) var(--utt-panel-width);
  align-items: stretch;
  gap: var(--utt-game-gap);
  height: min(840px, calc(100vh - 112px));
  min-height: 0;
}

.utt-game-area {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.utt-board {
  --utt-board-padding: 8px;
  --utt-board-gap: 8px;
  --utt-indicator-color: #16a346;
  --utt-indicator-width: 3px;
  --utt-indicator-offset: 2px;
  --utt-indicator-mask: rgba(255, 255, 255, 0.08);
  --utt-indicator-glow:
    0 0 0 1px color-mix(in srgb, var(--utt-indicator-color) 42%, transparent),
    0 0 12px color-mix(in srgb, var(--utt-indicator-color) 22%, transparent);
  --utt-claim-x-color: #2563eb;
  --utt-claim-o-color: #dc2626;
  --utt-claim-draw-color: #555;
  --utt-claim-x-overlay: rgba(37, 99, 235, 0.08);
  --utt-claim-o-overlay: rgba(220, 38, 38, 0.08);
  --utt-claim-draw-overlay: rgba(0, 0, 0, 0.08);
  --utt-board-bg: #d9dee6;
  --utt-small-board-bg: #eef1f5;
  --utt-small-board-border: #b5bdc9;
  --utt-cell-bg: #ffffff;
  --utt-cell-text: #1f2933;

  position: relative;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: var(--utt-board-gap);
  width: min(100%, calc(100vh - 112px));
  max-width: 860px;
  aspect-ratio: 1 / 1;
  margin: 0 auto;
  padding: var(--utt-board-padding);
  background: var(--utt-board-bg);
  border: 2px solid var(--utt-board-bg);
}

:root.dark .utt-board {
  --utt-indicator-color: #12500b;
  --utt-indicator-mask: rgba(255, 255, 255, 0.1);
  --utt-board-bg: color-mix(in srgb, var(--vp-c-bg) 62%, #303030);
  --utt-small-board-bg: color-mix(in srgb, #bdbdbd 18%, var(--vp-c-bg-soft));
  --utt-small-board-border: color-mix(in srgb, #5f5f5f 74%, var(--vp-c-divider));
  --utt-cell-bg: color-mix(in srgb, #f8f8f8 8%, var(--vp-c-bg));
  --utt-cell-text: var(--vp-c-text-1);
}

.utt-small-board {
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 3px;
  padding: 4px;
  overflow: hidden;
  background: var(--utt-small-board-bg);
  border: 3px solid var(--utt-small-board-border);
  transition:
    border-color 0.16s ease,
    background-color 0.16s ease,
    box-shadow 0.16s ease,
    opacity 0.16s ease,
    filter 0.16s ease;
}

.utt-small-board-locked {
  opacity: 0.62;
}

.utt-small-board-claimed-x {
  --utt-claim-color: var(--utt-claim-x-color);
  --utt-claim-overlay: var(--utt-claim-x-overlay);
  border-color: var(--utt-claim-color);
  box-shadow:
    0 0 0 2px rgba(37, 99, 235, 0.18),
    inset 0 0 0 1px rgba(37, 99, 235, 0.22);
}

.utt-small-board-claimed-o {
  --utt-claim-color: var(--utt-claim-o-color);
  --utt-claim-overlay: var(--utt-claim-o-overlay);
  border-color: var(--utt-claim-color);
  box-shadow:
    0 0 0 2px rgba(220, 38, 38, 0.18),
    inset 0 0 0 1px rgba(220, 38, 38, 0.22);
}

.utt-small-board-draw {
  --utt-claim-color: var(--utt-claim-draw-color);
  --utt-claim-overlay: var(--utt-claim-draw-overlay);
  border-color: var(--utt-claim-color);
  box-shadow:
    0 0 0 2px rgba(85, 85, 85, 0.18),
    inset 0 0 0 1px rgba(85, 85, 85, 0.24);
}

.utt-small-board-claimed-x::before,
.utt-small-board-claimed-o::before,
.utt-small-board-draw::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  background: var(--utt-claim-overlay);
}

.utt-small-board-full {
  opacity: 0.76;
  filter: saturate(0.72) brightness(0.9);
}

.utt-preview-frame {
  position: absolute;
  z-index: 8;
  border: var(--utt-indicator-width) solid var(--utt-indicator-color);
  background: var(--utt-indicator-mask);
  box-shadow: var(--utt-indicator-glow);
  opacity: 0;
  pointer-events: none;
  transform: scale(0.98);
  transform-origin: center;
  transition:
    left var(--lc-motion-duration-normal) var(--lc-motion-ease-emphasis),
    top var(--lc-motion-duration-normal) var(--lc-motion-ease-emphasis),
    width var(--lc-motion-duration-normal) var(--lc-motion-ease-emphasis),
    height var(--lc-motion-duration-normal) var(--lc-motion-ease-emphasis),
    opacity var(--lc-motion-duration-fast) var(--lc-motion-ease-standard),
    transform var(--lc-motion-duration-normal) var(--lc-motion-ease-emphasis);
}

.utt-preview-frame-visible {
  opacity: 1;
  transform: scale(1);
}

.utt-preview-frame-free.utt-preview-frame-visible {
  animation: utt-preview-expand var(--lc-motion-duration-normal) var(--lc-motion-ease-emphasis);
}

@keyframes utt-preview-expand {
  from {
    transform: scale(0.94);
  }

  to {
    transform: scale(1);
  }
}

.utt-small-board-big-win {
  opacity: 1;
  filter: none;
}

.utt-small-board-big-dimmed {
  opacity: 0.52;
  filter: saturate(0.55) brightness(0.82);
}

.utt-small-board-big-dimmed::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 7;
  pointer-events: none;
  background: rgba(245, 245, 245, 0.25);
}

.utt-cell {
  position: relative;
  z-index: 1;
  padding: 0;
  border: 0;
  background: var(--utt-cell-bg);
  color: var(--utt-cell-text);
  font-size: clamp(18px, 4vw, 28px);
  font-weight: 800;
  cursor: pointer;
  transition:
    background-color 0.12s ease,
    color 0.12s ease,
    transform 0.08s ease;
}

.utt-cell:hover {
  background: #eeeeee;
}

:root.dark .utt-cell:hover {
  background: color-mix(in srgb, var(--vp-c-bg-soft) 70%, #eeeeee 12%);
}

.utt-hoverable-x:hover {
  background: #eff6ff;
}

.utt-hoverable-o:hover {
  background: #fff5f5;
}

:root.dark .utt-hoverable-x:hover {
  background: rgba(37, 99, 235, 0.18);
}

:root.dark .utt-hoverable-o:hover {
  background: rgba(220, 38, 38, 0.18);
}

.utt-cell-x {
  color: #2563eb;
}

.utt-cell-o {
  color: #dc2626;
}

.utt-cell-disabled {
  cursor: not-allowed;
}

.utt-cell-disabled:hover {
  background: var(--utt-cell-bg);
}

.utt-cell-last-move {
  background: #dbeafe;
}

.utt-cell-o.utt-cell-last-move {
  background: #fee2e2;
}

:root.dark .utt-cell-last-move {
  background: rgba(37, 99, 235, 0.22);
}

:root.dark .utt-cell-o.utt-cell-last-move {
  background: rgba(220, 38, 38, 0.22);
}

.utt-cell-last-move:hover,
.utt-cell-last-move.utt-cell-disabled:hover {
  background-color: #dbeafe;
}

.utt-cell-o.utt-cell-last-move:hover,
.utt-cell-o.utt-cell-last-move.utt-cell-disabled:hover {
  background-color: #fee2e2;
}

:root.dark .utt-cell-last-move:hover,
:root.dark .utt-cell-last-move.utt-cell-disabled:hover {
  background-color: rgba(37, 99, 235, 0.22);
}

:root.dark .utt-cell-o.utt-cell-last-move:hover,
:root.dark .utt-cell-o.utt-cell-last-move.utt-cell-disabled:hover {
  background-color: rgba(220, 38, 38, 0.22);
}

.utt-cell-last-turn-auto::after {
  content: "";
  position: absolute;
  right: 5px;
  top: 5px;
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: rgba(17, 24, 39, 0.45);
  pointer-events: none;
}

.utt-win-line {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 4;
  width: 74%;
  height: 5px;
  border-radius: 999px;
  pointer-events: none;
  transform-origin: center;
}

.utt-win-line-blue {
  background: #2563eb;
}

.utt-win-line-red {
  background: #dc2626;
}

.utt-win-line-0-1-2 { top: 16.666%; transform: translate(-50%, -50%); }
.utt-win-line-3-4-5 { top: 50%; transform: translate(-50%, -50%); }
.utt-win-line-6-7-8 { top: 83.333%; transform: translate(-50%, -50%); }
.utt-win-line-0-3-6 { left: 16.666%; transform: translate(-50%, -50%) rotate(90deg); }
.utt-win-line-1-4-7 { left: 50%; transform: translate(-50%, -50%) rotate(90deg); }
.utt-win-line-2-5-8 { left: 83.333%; transform: translate(-50%, -50%) rotate(90deg); }
.utt-win-line-0-4-8 { width: 104%; transform: translate(-50%, -50%) rotate(45deg); }
.utt-win-line-2-4-6 { width: 104%; transform: translate(-50%, -50%) rotate(-45deg); }

.utt-side-panel {
  width: var(--utt-panel-width);
  display: flex;
  flex-direction: column;
  min-height: 0;
  max-height: 100%;
}

.utt-game-menu {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--vp-c-divider);
}

.utt-log-panel {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.utt-panel-title {
  margin: 0 0 12px;
  color: var(--vp-c-text-1);
  font-size: 18px;
  text-align: left;
}

.utt-menu-panel-title {
  display: block;
}

.utt-menu-control,
.utt-menu-button {
  width: 100%;
  min-height: 38px;
  margin-bottom: 8px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  font-size: 14px;
}

.utt-menu-control {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 0 0 0 12px;
  text-align: left;
}

.utt-menu-label {
  flex: 0 0 auto;
  color: var(--vp-c-text-1);
}

.utt-menu-select {
  width: 120px;
  height: 36px;
  padding: 0 8px;
  border: 0;
  border-left: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 14px;
  cursor: pointer;
}

.utt-menu-select:disabled {
  color: var(--vp-c-text-3);
  cursor: not-allowed;
}

.utt-menu-select:focus {
  outline: 0;
}

.utt-menu-button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  cursor: pointer;
}

.utt-menu-button:hover,
.utt-menu-control:hover {
  background: color-mix(in srgb, var(--vp-c-bg-soft) 82%, var(--vp-c-brand-1) 8%);
}

.utt-menu-button-danger {
  border-color: #dc2626;
  color: #dc2626;
}

.utt-menu-button-primary {
  border-color: #2563eb;
  color: #2563eb;
}

.utt-game-log {
  flex: 1 1 auto;
  min-height: 0;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  list-style: none;
}

.utt-game-log .utt-log-message:first-child {
  margin-top: auto;
}

.utt-log-message {
  margin-bottom: 10px;
  padding: 0 10px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  font-size: 14px;
  line-height: 1.5;
  text-align: left;
  white-space: pre-line;
}

.utt-log-message-system {
  color: var(--vp-c-text-2);
}

.utt-log-message-blue {
  border-left: 4px solid #2563eb;
}

.utt-log-message-red {
  border-left: 4px solid #dc2626;
}

.utt-message-input {
  flex: 0 0 auto;
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid var(--vp-c-divider);
}

.utt-message-input input {
  flex: 1;
  min-width: 0;
  height: 38px;
  padding: 0 10px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 14px;
}

.utt-message-input input:focus {
  outline: 0;
}

.utt-message-input button {
  height: 38px;
  padding: 0 16px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  font-size: 14px;
  cursor: pointer;
}

.utt-message-input input.utt-input-error::placeholder {
  color: #dc2626;
}

.utt-rules-dialog {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.32);
}

.utt-rules-card {
  width: min(560px, 100%);
  max-height: min(720px, 90vh);
  overflow-y: auto;
  padding: 22px;
  background: var(--vp-c-bg);
  border: 2px solid var(--vp-c-text-1);
}

.utt-rules-card h2 {
  margin: 0 0 14px;
  font-size: 20px;
}

.utt-rules-card p {
  margin: 0 0 12px;
  color: var(--vp-c-text-2);
  font-size: 14px;
  line-height: 1.7;
  text-align: left;
}

@media (max-width: 768px) {
  .utt-game-page {
    --utt-mobile-nav-height: 64px;

    width: calc(100vw - 24px);
    height: calc(100dvh - var(--utt-mobile-nav-height) - 8px - env(safe-area-inset-bottom));
    margin-top: 0;
    margin-bottom: 0;
    overflow: hidden;
  }

  .utt-app {
    display: flex;
    height: 98%;
    min-height: 0;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .utt-game-area {
    width: 100%;
    max-width: 560px;
    flex: 0 0 auto;
  }

  .utt-board {
    --utt-board-padding: 6px;
    --utt-board-gap: 6px;
    width: clamp(210px, min(92vw, calc(100dvh - var(--utt-mobile-nav-height) - 250px)), 410px);
    max-width: none;
    padding: var(--utt-board-padding);
  }

  .utt-small-board {
    gap: 2px;
    padding: 3px;
    border-width: 3px;
  }

  .utt-cell {
    font-size: clamp(18px, 6vw, 28px);
  }

  .utt-side-panel {
    width: 100%;
    max-width: 560px;
    flex: 1 1 auto;
    min-height: 0;
    overflow: hidden;
    padding-bottom: env(safe-area-inset-bottom);
  }

  .utt-game-menu {
    width: 100%;
    flex: 0 0 auto;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 6px;
    margin-bottom: 6px;
    padding-bottom: 6px;
  }

  .utt-menu-panel-title {
    display: none;
  }

  .utt-menu-control {
    min-height: 40px;
    display: block;
    margin: 0;
    padding: 0;
    overflow: hidden;
  }

  .utt-menu-label {
    display: none;
  }

  .utt-menu-select {
    width: 100%;
    height: 40px;
    padding: 0 6px;
    border: 1px solid var(--vp-c-divider);
    background: var(--vp-c-bg-soft);
    font-size: 13px;
    text-align: center;
  }

  .utt-menu-button {
    min-height: 40px;
    justify-content: center;
    margin: 0;
    padding: 0 6px;
    font-size: 13px;
  }

  .utt-log-panel {
    width: 100%;
    flex: 1 1 auto;
    min-height: 0;
    overflow: hidden;
  }

  .utt-panel-title {
    margin: 0 0 6px;
    font-size: 16px;
  }

  .utt-game-log {
    flex: 1 1 auto;
    min-height: 0;
    max-height: none;
  }

  .utt-message-input {
    margin-top: 6px;
    padding-top: 6px;
  }

  .utt-message-input input,
  .utt-message-input button {
    height: 40px;
  }
}
</style>
