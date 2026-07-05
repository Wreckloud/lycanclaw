<template>
  <section class="utt-game-page">
    <div class="utt-app">
      <section class="utt-game-area" aria-label="九宫叠阵棋盘">
        <div
          class="utt-board"
          :class="{
            'utt-board-closed': isGameClosed,
            'utt-board-tutorial-clickable': tutorialDialogOpen
          }"
          @touchmove="handleBoardTouchMove"
          @touchend="handleBoardTouchEnd"
          @touchcancel="handleBoardTouchCancel"
          @click="handleBoardClick"
        >
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
              :style="getCellStyle(bigIndex, smallIndex)"
              :data-big-index="bigIndex"
              :data-small-index="smallIndex"
              type="button"
              :aria-disabled="!canPlayCell(bigIndex, smallIndex)"
              :aria-label="`${formatBigBoardIndex(bigIndex)} 棋盘 ${formatSmallCellPosition(smallIndex)}`"
              @click.stop="handleCellClick(bigIndex, smallIndex)"
              @touchstart="handleCellTouchStart(bigIndex, smallIndex, $event)"
              @mouseenter="showNextBoardPreview(bigIndex, smallIndex)"
              @mouseleave="scheduleClearNextBoardPreview"
              @focus="showNextBoardPreview(bigIndex, smallIndex)"
              @blur="scheduleClearNextBoardPreview"
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
            v-if="visiblePreviewFrameStyle"
            class="utt-preview-frame"
            :class="{
              'utt-preview-frame-visible': isVisiblePreviewFrameVisible,
              'utt-preview-frame-free': isVisiblePreviewFrameFree
            }"
            :style="visiblePreviewFrameStyle"
          />

          <Transition name="utt-settlement-cue">
            <div v-if="isSettlementCueVisible" class="utt-settlement-cue" aria-live="polite">
              <div class="utt-settlement-cue-title" :class="settlementCueTitleClass">{{ settlementCueTitle }}</div>
              <div class="utt-settlement-cue-subtitle">
                <span
                  v-for="(part, partIndex) in settlementCueLines"
                  :key="`settlement-cue-${partIndex}`"
                  :class="getPlayerTextClass(part.player)"
                >
                  {{ part.text }}
                </span>
              </div>
            </div>
          </Transition>

          <Transition name="utt-settlement-cue">
            <div v-if="isVictoryCueVisible" class="utt-settlement-cue" aria-live="polite">
              <div class="utt-settlement-cue-title" :class="victoryCueTitleClass">{{ victoryCueTitle }}</div>
              <div class="utt-settlement-cue-subtitle">
                <span
                  v-for="(part, partIndex) in victoryCueLines"
                  :key="`victory-cue-${partIndex}`"
                  :class="getPlayerTextClass(part.player)"
                >
                  {{ part.text }}
                </span>
              </div>
            </div>
          </Transition>

          <span v-if="visiblePreviewHintStyle" class="utt-preview-hint" :style="visiblePreviewHintStyle">
            <span
              v-for="(line, lineIndex) in visiblePreviewHintLines"
              :key="`preview-hint-${lineIndex}`"
              class="utt-preview-hint-line"
            >
              <span
                v-for="(part, partIndex) in line"
                :key="`preview-hint-${lineIndex}-${partIndex}`"
                :class="getPlayerTextClass(part.player)"
              >
                {{ part.text }}
              </span>
            </span>
          </span>

          <div
            v-if="tutorialDialogOpen"
            class="utt-tutorial-prompt"
            role="button"
            tabindex="0"
            aria-live="polite"
            :class="tutorialPromptClass"
            @click.stop="handleTutorialDialogNext"
            @keydown.enter.prevent="handleTutorialDialogNext"
            @keydown.space.prevent="handleTutorialDialogNext"
          >
            <div v-if="tutorialDialog.title" class="utt-tutorial-prompt-title">{{ tutorialDialog.title }}</div>
            <div
              v-for="(line, lineIndex) in tutorialDialog.lines"
              :key="`tutorial-line-${lineIndex}`"
              class="utt-tutorial-prompt-line"
            >
              <span
                v-for="(part, partIndex) in line"
                :key="`tutorial-line-${lineIndex}-${partIndex}`"
                :class="getPlayerTextClass(part.player)"
              >
                {{ part.text }}
              </span>
            </div>
            <div class="utt-tutorial-prompt-action">{{ tutorialPromptActionText }}</div>
          </div>

        </div>
      </section>

      <aside class="utt-side-panel">
        <section class="utt-game-menu">
          <h2 class="utt-panel-title utt-menu-panel-title">对局菜单</h2>

          <label class="utt-menu-control">
            <span class="utt-menu-label">对战模式</span>
            <select
              :value="modeSelectValue"
              class="utt-menu-select"
              :disabled="isTutorialMode"
              @change="handleModeSelectChange"
            >
              <option v-if="isTutorialMode" value="tutorial">教学模式</option>
              <option value="human-vs-ai">人机对战</option>
              <option value="local">本地对战</option>
              <option value="online">在线对战</option>
            </select>
          </label>

          <label v-if="settings.gameMode === 'human-vs-ai' || isTutorialMode" class="utt-menu-control">
            <span class="utt-menu-label">电脑难度</span>
            <select
              :value="difficultySelectValue"
              class="utt-menu-select"
              :disabled="isTutorialMode || settings.gameMode !== 'human-vs-ai'"
              @change="handleDifficultySelectChange"
            >
              <option v-if="isTutorialMode" value="tutorial">教学</option>
              <option value="easy">简单</option>
              <option value="normal">普通</option>
              <option value="hard">困难</option>
              <option value="nightmare">噩梦</option>
            </select>
          </label>
          <div v-else class="utt-menu-control">
            <span class="utt-menu-label">{{ statusControlLabel }}</span>
            <button
              type="button"
              class="utt-turn-button"
              :class="currentTurnButtonClass"
              :disabled="settings.gameMode !== 'online'"
              @click="handleOnlineStatusClick"
            >
              {{ statusControlText }}
            </button>
            <div v-if="isOnlineMemberMenuOpen && hasOnlineRoom" class="utt-online-member-menu">
              <div
                v-for="(player, playerIndex) in onlinePlayers"
                :key="`${player.nickname}-${playerIndex}`"
                class="utt-online-member-row"
              >
                <span>{{ getOnlineMemberDisplayName(player) }}</span>
                <span>{{ getOnlineMemberStatusText(player) }}</span>
              </div>
              <button type="button" class="utt-online-leave-button" @click="handleLeaveOnlineRoomClick">
                离开房间
              </button>
            </div>
          </div>

          <button type="button" class="utt-menu-button" @click="handleSecondaryAction">{{ secondaryActionText }}</button>
          <button
            type="button"
            class="utt-menu-button"
            :class="primaryActionClass"
            :disabled="isPrimaryActionDisabled"
            @click="handleResignOrRematch"
          >
            {{ primaryActionText }}
          </button>
        </section>

        <section class="utt-log-panel">
          <h2 class="utt-panel-title">对局记录</h2>

          <ul ref="logRef" class="utt-game-log">
            <li
              v-for="message in state.messages"
              :key="message.id"
              class="utt-log-message"
              :class="getMessageClass(message)"
            >
              <span
                v-for="(line, lineIndex) in splitMessageLines(message.text)"
                :key="`${message.id}-${lineIndex}`"
                class="utt-log-line"
              >
                <span
                  v-for="(part, partIndex) in splitMessageLineParts(line, message)"
                  :key="`${message.id}-${lineIndex}-${partIndex}`"
                  :class="getPlayerTextClass(part.player)"
                >
                  {{ part.text }}
                </span>
              </span>
            </li>
          </ul>

          <form ref="messageInputFormRef" class="utt-message-input" @submit.prevent="handleSendMessage">
            <div
              class="utt-message-field"
              :class="{ 'utt-message-field-error': Boolean(state.errorMessage) && !state.isMessageInputFocused }"
            >
              <span v-if="state.errorMessage && !state.isMessageInputFocused" class="utt-message-field-hint">
                {{ state.errorMessage }}
              </span>
              <template v-else>
                <button
                  v-if="settings.gameMode === 'online'"
                  type="button"
                  class="utt-message-user-line"
                  :class="{ 'utt-message-user-line-clickable': !hasOnlineRoom }"
                  @click="editOnlineNickname"
                >
                  {{ messageUserLineText }}
                </button>
                <input
                  v-model="messageDraft"
                  type="text"
                  maxlength="200"
                  :placeholder="messagePlaceholder"
                  @focus="handleMessageFocus"
                  @blur="handleMessageBlur"
                >
              </template>
            </div>
            <button type="submit" class="utt-message-send-button">发送</button>
          </form>
        </section>
      </aside>
    </div>

    <Teleport to="body">
      <div
        v-if="isRulesOpen"
        class="utt-rules-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="游戏规则"
        @click.self="closeRulesDialog"
        @wheel.stop
        @touchmove.stop
      >
        <div class="utt-rules-card">
          <div class="utt-rules-content" v-html="rulesHtml"></div>
          <div class="utt-rules-actions">
            <button type="button" class="utt-menu-button" @click="closeRulesDialog">知道了</button>
            <button
              v-if="canShowTutorialButton"
              type="button"
              class="utt-menu-button utt-menu-button-primary"
              @click="handleStartTutorial"
            >
              进入教学
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="isOnlineRoomDialogOpen"
        class="utt-rules-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="加入在线房间"
        @click.self="closeOnlineRoomDialog"
        @wheel.stop
        @touchmove.stop
      >
        <div class="utt-rules-card utt-online-room-card">
          <div class="utt-online-room-header">
            <h2>加入房间</h2>
            <p>{{ onlineRoomDialogHint }}</p>
          </div>
          <div class="utt-online-room-list">
            <button
              v-for="room in onlineRooms"
              :key="room.roomId"
              type="button"
              class="utt-online-room-item"
              :disabled="!room.joinable"
              @click="joinOnlineRoomFromList(room)"
            >
              <span>{{ room.roomId }}</span>
              <span>{{ getOnlineRoomListStatusText(room) }}</span>
            </button>
            <p v-if="!isOnlineRoomsLoading && onlineRooms.length === 0" class="utt-online-room-empty">暂无房间</p>
            <p v-if="isOnlineRoomsLoading" class="utt-online-room-empty">正在读取房间列表...</p>
          </div>
          <div class="utt-rules-actions">
            <button type="button" class="utt-menu-button" @click="randomJoinOnlineRoom">随机加入</button>
            <button type="button" class="utt-menu-button utt-menu-button-primary" @click="createOnlineRoomFromDialog">
              创建房间
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import rulesMarkdown from './rules.md?raw'
import { createAdaptiveProfileFromReports } from './core/adaptive'
import { chooseAIMoveWithDeadline } from './core/ai'
import { GAME_TEXT } from './core/game-text'
import type { AIWorkerResponse } from './core/ai.worker'
import { renderRulesMarkdown } from './core/markdown'
import { createTurnReport } from './core/report'
import { applyMoveImmutable, forceWinnerByResign } from './core/reducer'
import {
  createInitialGameState,
  getDifficultyName,
  loadAdaptiveProfile,
  loadGameSettings,
  saveAdaptiveProfile,
  saveGameSettings
} from './core/state'
import {
  TUTORIAL_AI_SEND_TO_CENTER_MOVE,
  TUTORIAL_AI_SEND_TO_CLAIM_CELL_INDEX,
  TUTORIAL_AI_SEND_TO_SETTLEMENT_MOVE,
  TUTORIAL_CENTER_BOARD_INDEX,
  TUTORIAL_CENTER_CELL_INDEX,
  TUTORIAL_CLAIM_BOARD_INDEX,
  TUTORIAL_CLAIM_CELL_INDEX,
  TUTORIAL_FIRST_MOVE_CELL_INDEXES,
  TUTORIAL_OPENING_BOARD_INDEX,
  TUTORIAL_SETTLEMENT_BOARD_INDEX,
  TUTORIAL_SETTLEMENT_CELL_INDEX,
  createTutorialOpeningState
} from './core/tutorial'
import {
  createInactiveTutorialState,
  createTutorialDialog,
  type MessageLinePart,
  type TutorialDialog,
  type TutorialState,
  type TutorialStep
} from './core/tutorial-dialog'
import {
  OnlineGameClient,
  createOnlinePlayerToken,
  createOnlineRoom,
  fetchOnlineRooms,
  type OnlineGameMessage,
  type OnlinePlayerSnapshot,
  type OnlineRecordedMove,
  type OnlineRoomListItem,
  type OnlineRoomSnapshot,
  type OnlineRoomStatus,
  type OnlineRuleEvent
} from './core/online-client'
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
  type AIDifficulty,
  type GameCoreState,
  type GameMessage,
  type GameMode,
  type GameMove,
  type GameSettings,
  type Player,
  type RuleEvent
} from './core/types'

const boardIndexes = Array.from({ length: 9 }, (_, index) => index)
const PLAYER_MOVE_SETTLE_DELAY_MS = 360
const AI_MIN_THINKING_MS = 820
const AUTO_FILL_BASE_DELAY_MS = 220
const AUTO_FILL_STEP_DELAY_MS = 180
const AUTO_FILL_ANIMATION_MS = 780
const AFTER_AUTO_FILL_PAUSE_MS = 260
const SETTLEMENT_CUE_MIN_DELAY_MS = 7200
const SETTLEMENT_CUE_AUTO_HIDE_MS = 3000
const PREVIEW_SHOW_DELAY_MS = 70
const PREVIEW_HIDE_DELAY_MS = 160
const TOUCH_PREVIEW_COMMIT_MS = 280
const TOUCH_PREVIEW_MOVE_THRESHOLD = 8
const TUTORIAL_AI_MOVE_DELAY_MS = 1000
const TUTORIAL_SETTLEMENT_DIALOG_DELAY_MS = 1800
const ONLINE_NICKNAME_STORAGE_KEY = 'lycan:utt:online:nickname'
const ONLINE_INTRO_SHOWN_STORAGE_KEY = 'lycan:utt:online:intro-shown'
const ONLINE_SESSION_TOKENS_STORAGE_KEY = 'lycan:utt:online:session-tokens'
const DEFAULT_ONLINE_NICKNAME = GAME_TEXT.room.defaultNickname
type OnlineConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'expired'
const settings = ref<GameSettings>(loadGameSettings())
const adaptiveProfile = ref(loadAdaptiveProfile())
const state = ref<GameCoreState>(createInitialGameState(settings.value))
const isThinking = ref(false)
const worker = ref<Worker | null>(null)
const isRulesOpen = ref(false)
const tutorialState = ref<TutorialState>(createInactiveTutorialState())
const previousTutorialSettings = ref<GameSettings | null>(null)
const messageDraft = ref('')
const onlineRoomId = ref('')
const onlinePlayerToken = ref('')
const onlineNickname = ref(loadOnlineNickname())
const hasCustomOnlineNickname = ref(loadHasCustomOnlineNickname())
const onlineRoomStatus = ref<OnlineRoomStatus | 'NOT_JOINED'>('NOT_JOINED')
const onlineConnectionStatus = ref<OnlineConnectionStatus>('idle')
const onlineSelfSide = ref<Player | null>(null)
const onlinePlayers = ref<OnlinePlayerSnapshot[]>([])
const onlineClient = ref<OnlineGameClient | null>(null)
const isOnlineRoomDialogOpen = ref(false)
const isOnlineRoomsLoading = ref(false)
const onlineRooms = ref<OnlineRoomListItem[]>([])
const isOnlineMemberMenuOpen = ref(false)
const dismissedSettlementCueKey = ref('')
const activePreviewTarget = ref<PreviewTarget | null>(null)
const lastPreviewTarget = ref<PreviewTarget | null>(null)
const logRef = ref<HTMLElement | null>(null)
const messageInputFormRef = ref<HTMLFormElement | null>(null)
let requestId = 0
let aiRequestTimer: number | null = null
let aiDecisionApplyTimer: number | null = null
let aiThinkingStartedAt = 0
let previewTimer: number | null = null
let previewHideTimer: number | null = null
let tutorialTimer: number | null = null
let settlementCueTimer: number | null = null
let previousRulesBodyOverflow: string | null = null
let previousRulesHtmlOverflow: string | null = null
let touchPreviewState: {
  startedAt: number
  startX: number
  startY: number
  bigIndex: number
  smallIndex: number
  moved: boolean
} | null = null
let suppressCellClickUntil = 0

type PreviewTarget =
  | {
      type: 'board'
      boardIndex: number
      hintLines: MessageLinePart[][]
      hintPosition: PreviewHintPosition
      hintBoardIndex: number | null
      rewardCells: PreviewRewardCell[]
    }
  | {
      type: 'free'
      hintLines: MessageLinePart[][]
      hintPosition: PreviewHintPosition
      hintBoardIndex: number | null
      rewardCells: PreviewRewardCell[]
    }

interface PreviewRewardCell {
  bigIndex: number
  smallIndex: number
  player: Player
}

type PreviewHintPosition = 'above' | 'below'

const isFinished = computed(() => state.value.winner !== EMPTY)
const isAwaitingStart = computed(() => !state.value.isStarted)
const isGameClosed = computed(() => isAwaitingStart.value || isFinished.value)
const isTutorialMode = computed(() => tutorialState.value.active)
const tutorialDialogOpen = computed(() => tutorialState.value.active && tutorialState.value.dialogOpen)
const modeSelectValue = computed(() => isTutorialMode.value ? 'tutorial' : settings.value.gameMode)
const difficultySelectValue = computed(() => isTutorialMode.value ? 'tutorial' : settings.value.aiDifficulty)
const rulesHtml = computed(() => renderRulesMarkdown(rulesMarkdown))
const primaryActionText = computed(() => {
  if (isTutorialMode.value) return '退出教学'
  if (settings.value.gameMode === 'online') return getOnlinePrimaryActionText()
  if (isAwaitingStart.value) return '开始游戏!'
  return isFinished.value ? '再来一把!' : '投降'
})
const primaryActionClass = computed(() => ({
  'utt-menu-button-primary': !isTutorialMode.value && (
    settings.value.gameMode === 'online'
      ? onlineRoomStatus.value !== 'PLAYING'
      : (isAwaitingStart.value || isFinished.value)
  ),
  'utt-menu-button-danger': isTutorialMode.value || (
    settings.value.gameMode === 'online'
      ? onlineRoomStatus.value === 'PLAYING'
      : (!isAwaitingStart.value && !isFinished.value)
  )
}))
const secondaryActionText = computed(() => {
  if (settings.value.gameMode === 'online' && hasOnlineRoom.value && onlineRoomStatus.value === 'WAITING') {
    return '邀请房间'
  }
  return settings.value.gameMode === 'online' && !hasOnlineRoom.value ? '加入房间' : '游戏规则'
})
const hasOnlineRoom = computed(() => settings.value.gameMode === 'online' && Boolean(onlineRoomId.value))
const onlinePlayerCount = computed(() => onlinePlayers.value.length)
const onlineReadyCount = computed(() => onlinePlayers.value.filter((player) => player.ready).length)
const onlineSelfPlayer = computed(() => onlinePlayers.value.find((player) => player.self) ?? null)
const onlineSelfReady = computed(() => {
  return onlineSelfPlayer.value?.ready ?? false
})
const onlineSelfRoleText = computed(() => {
  if (!hasOnlineRoom.value) return GAME_TEXT.room.notJoined
  if (!onlineSelfPlayer.value || !onlineSelfSide.value) return GAME_TEXT.room.spectator
  return GAME_TEXT.player.sideName(onlineSelfSide.value)
})
const onlineSelfIsActivePlayer = computed(() => onlineSelfSide.value === X || onlineSelfSide.value === O)
const isPrimaryActionDisabled = computed(() => {
  return settings.value.gameMode === 'online'
    && (
      onlineConnectionStatus.value === 'connecting'
      || (onlineRoomStatus.value === 'PLAYING' && !onlineSelfIsActivePlayer.value)
    )
})
const canShowTutorialButton = computed(() => {
  return !isTutorialMode.value && (!state.value.isStarted || settings.value.gameMode === 'online')
})
const statusControlLabel = computed(() => {
  return settings.value.gameMode === 'online'
    ? '房间状态'
    : '当前棋手'
})
const statusControlText = computed(() => {
  return settings.value.gameMode === 'online'
    ? getOnlineRoomStatusText()
    : currentTurnLabel.value
})
const currentTurnLabel = computed(() => {
  if (settings.value.gameMode === 'online' && onlineRoomStatus.value === 'PLAYING') {
    return getOnlineSideDisplayName(state.value.currentPlayer)
  }
  return getPlayerName(state.value.currentPlayer, state.value)
})
const currentTurnButtonClass = computed(() => ({
  'utt-turn-button-x': state.value.isStarted && state.value.currentPlayer === X,
  'utt-turn-button-o': state.value.isStarted && state.value.currentPlayer === O
}))
const isPreviewFrameVisible = computed(() => activePreviewTarget.value !== null)
const isPreviewFrameFree = computed(() => (activePreviewTarget.value ?? lastPreviewTarget.value)?.type === 'free')
const previewFrameStyle = computed<Record<string, string> | null>(() => createPreviewFrameStyle(activePreviewTarget.value ?? lastPreviewTarget.value))
const previewHintLines = computed(() => activePreviewTarget.value?.hintLines ?? [])
const tutorialPreviewTarget = computed<PreviewTarget | null>(() => createTutorialPreviewTarget())
const visiblePreviewTarget = computed(() => activePreviewTarget.value ?? tutorialPreviewTarget.value ?? lastPreviewTarget.value)
const visiblePreviewFrameStyle = computed(() => {
  return activePreviewTarget.value || !tutorialPreviewTarget.value
    ? previewFrameStyle.value
    : createPreviewFrameStyle(tutorialPreviewTarget.value)
})
const isVisiblePreviewFrameVisible = computed(() => activePreviewTarget.value !== null || tutorialPreviewTarget.value !== null)
const isVisiblePreviewFrameFree = computed(() => visiblePreviewTarget.value?.type === 'free')
const visiblePreviewHintLines = computed(() => activePreviewTarget.value?.hintLines ?? tutorialPreviewTarget.value?.hintLines ?? [])
const settlementCueLines = computed<MessageLinePart[] | null>(() => {
  const event = state.value.lastRuleEvents[0]
  if (!event) return null

  if (isPlayer(state.value.winner)) {
    return createVictoryCueLines(state.value.winner)
  }

  if (!isPlayer(event.owner)) {
    return [
      { text: `${formatBigBoardIndex(event.boardIndex)} 棋盘无人占领，不触发入口奖励`, player: null }
    ]
  }

  const nextPlayer = getOpponent(event.owner)
  return [
    { text: '由于 ', player: null },
    { text: getDisplayPlayerName(event.owner, state.value), player: event.owner },
    { text: ` 占领了 ${formatBigBoardIndex(event.boardIndex)} 棋盘，回合重置给 `, player: null },
    { text: getDisplayPlayerName(nextPlayer, state.value), player: nextPlayer }
  ]
})
const isSettlementCueVisible = computed(() => {
  if (!settlementCueLines.value) return false
  if (isPlayer(state.value.winner)) return true
  if (dismissedSettlementCueKey.value === settlementCueKey.value) return false
  if (!isTutorialMode.value) return true

  return tutorialState.value.step === 'settlementIntro'
})
const settlementCueTitle = computed(() => {
  const event = state.value.lastRuleEvents[0]
  return isPlayer(state.value.winner) && event && event.filledCount > 0
    ? '满盘终结'
    : '满盘结算'
})
const settlementCueTitleClass = computed(() => {
  return isPlayer(state.value.winner) ? getPlayerTextClass(state.value.winner) : ''
})
const isVictoryCueVisible = computed(() => isPlayer(state.value.winner) && !isSettlementCueVisible.value)
const victoryCueTitle = computed(() => isPlayer(state.value.winner) ? `${getPlayerSideName(state.value.winner)}获胜` : '')
const victoryCueTitleClass = computed(() => isPlayer(state.value.winner) ? getPlayerTextClass(state.value.winner) : '')
const victoryCueLines = computed<MessageLinePart[]>(() => {
  return isPlayer(state.value.winner) ? createVictoryCueLines(state.value.winner) : []
})
const previewHintStyle = computed<Record<string, string> | null>(() => createPreviewHintStyle(activePreviewTarget.value))
const visiblePreviewHintStyle = computed(() => activePreviewTarget.value ? previewHintStyle.value : createPreviewHintStyle(tutorialPreviewTarget.value))
const settlementBoardIndex = computed(() => state.value.lastRuleEvents[0]?.boardIndex ?? null)
const settlementCueKey = computed(() => {
  const event = state.value.lastRuleEvents[0]
  if (!event) return ''
  return `${state.value.moveHistory.length}-${event.boardIndex}-${event.filledCount}-${state.value.winner}`
})
const tutorialDialog = computed<TutorialDialog>(() => createTutorialDialog(tutorialState.value, state.value, getDisplayPlayerName))
const tutorialPromptActionText = computed(() => {
  return tutorialDialog.value.buttonText === '继续'
    ? '点击继续>'
    : `${tutorialDialog.value.buttonText}>`
})
const tutorialPromptClass = computed(() => ({
  'utt-tutorial-prompt-top': shouldPlaceTutorialPromptTop(),
  'utt-tutorial-prompt-after-top-board': shouldPlaceTutorialPromptAfterTopBoard(),
  'utt-tutorial-prompt-near-center-board': shouldPlaceTutorialPromptNearCenterBoard(),
  'utt-tutorial-prompt-below-middle-row': shouldPlaceTutorialPromptBelowMiddleRow()
}))
const messagePlaceholder = computed(() => {
  if (state.value.isMessageInputFocused) return ''
  if (settings.value.gameMode === 'online' && !hasOnlineRoom.value) return '加入房间后聊天'

  return '输入消息'
})
const messageUserLineText = computed(() => {
  const editHint = !hasOnlineRoom.value && !hasCustomOnlineNickname.value ? '(点击修改)' : ''
  return `${onlineNickname.value || DEFAULT_ONLINE_NICKNAME}${editHint}:`
})

onMounted(() => {
  worker.value = new Worker(new URL('./core/ai.worker.ts', import.meta.url), { type: 'module' })
  worker.value.addEventListener('message', handleWorkerMessage)
  window.addEventListener('beforeunload', handleBeforeUnload)
  window.addEventListener('online', reconnectOnlineRoomIfNeeded)
  document.addEventListener('visibilitychange', handleVisibilityChange)
  document.addEventListener('click', handleDocumentClick)
  handleInitialOnlineRoomFromUrl()
  requestAIMoveIfNeeded()
  scrollLogToBottom()
})

onBeforeUnmount(() => {
  setRulesDialogScrollLock(false)
  clearNextBoardPreview()
  clearAIRequestTimer()
  clearAIDecisionApplyTimer()
  clearTutorialTimer()
  clearSettlementCueTimer()
  closeOnlineClient()
  window.removeEventListener('beforeunload', handleBeforeUnload)
  window.removeEventListener('online', reconnectOnlineRoomIfNeeded)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  document.removeEventListener('click', handleDocumentClick)
  worker.value?.removeEventListener('message', handleWorkerMessage)
  worker.value?.terminate()
})

watch(isRulesOpen, (open) => {
  setRulesDialogScrollLock(open)
})

watch(isOnlineRoomDialogOpen, (open) => {
  setRulesDialogScrollLock(open)
})

watch(
  () => state.value.messages.length,
  () => scrollLogToBottom()
)

watch(settlementCueKey, (key) => {
  clearSettlementCueTimer()
  if (!key || isPlayer(state.value.winner)) return
  dismissedSettlementCueKey.value = ''
  settlementCueTimer = window.setTimeout(() => {
    dismissedSettlementCueKey.value = key
    settlementCueTimer = null
  }, SETTLEMENT_CUE_AUTO_HIDE_MS)
})

function handleCellClick(bigIndex: number, smallIndex: number): void {
  if (tutorialDialogOpen.value && !tutorialState.value.inputEnabled) {
    handleTutorialDialogNext()
    return
  }
  if (Date.now() < suppressCellClickUntil) return
  playCellFromInput(bigIndex, smallIndex)
}

function handleBoardClick(): void {
  if (!tutorialDialogOpen.value || tutorialState.value.inputEnabled) return
  handleTutorialDialogNext()
}

function playCellFromInput(bigIndex: number, smallIndex: number): void {
  if (settings.value.gameMode === 'online') {
    playOnlineCell(bigIndex, smallIndex)
    return
  }

  if (isThinking.value || isAITurn(state.value)) {
    setError(`${getPlayerName(state.value.currentPlayer, state.value)} 正在思考`)
    return
  }

  if (isTutorialMode.value && tutorialState.value.inputEnabled) {
    if (!canMove(state.value, bigIndex, smallIndex)) {
      setError(getInvalidMoveReason(state.value, bigIndex, smallIndex))
      return
    }
    if (!canPlayTutorialCell(bigIndex, smallIndex)) {
      setError(getTutorialMoveRestrictionMessage())
      return
    }
  }

  if (!canPlayCell(bigIndex, smallIndex)) {
    setError(getInvalidMoveReason(state.value, bigIndex, smallIndex))
    return
  }

  playMove({ bigIndex, smallIndex })
}

function handleCellTouchStart(bigIndex: number, smallIndex: number, event: TouchEvent): void {
  if (tutorialDialogOpen.value) return
  preventCancelableDefault(event)
  const touch = event.touches[0] ?? event.changedTouches[0]
  if (!touch) return

  touchPreviewState = {
    startedAt: Date.now(),
    startX: touch.clientX,
    startY: touch.clientY,
    bigIndex,
    smallIndex,
    moved: false
  }
  showNextBoardPreviewNow(bigIndex, smallIndex)
}

function handleBoardTouchMove(event: TouchEvent): void {
  if (!touchPreviewState) return
  preventCancelableDefault(event)
  const touch = event.touches[0] ?? event.changedTouches[0]
  if (!touch) return

  const distance = Math.hypot(touch.clientX - touchPreviewState.startX, touch.clientY - touchPreviewState.startY)
  if (distance > TOUCH_PREVIEW_MOVE_THRESHOLD) {
    touchPreviewState.moved = true
  }

  const target = getTouchCellTarget(touch)
  if (!target) return
  if (target.bigIndex === touchPreviewState.bigIndex && target.smallIndex === touchPreviewState.smallIndex) return

  touchPreviewState.bigIndex = target.bigIndex
  touchPreviewState.smallIndex = target.smallIndex
  showNextBoardPreviewNow(target.bigIndex, target.smallIndex)
}

function handleBoardTouchEnd(event: TouchEvent): void {
  if (!touchPreviewState) return
  preventCancelableDefault(event)
  const stateAtEnd = touchPreviewState
  touchPreviewState = null
  suppressCellClickUntil = Date.now() + 350
  scheduleClearNextBoardPreview()

  const longPressed = Date.now() - stateAtEnd.startedAt > TOUCH_PREVIEW_COMMIT_MS
  if (stateAtEnd.moved || longPressed) return
  playCellFromInput(stateAtEnd.bigIndex, stateAtEnd.smallIndex)
}

function handleBoardTouchCancel(event: TouchEvent): void {
  preventCancelableDefault(event)
  touchPreviewState = null
  scheduleClearNextBoardPreview()
}

function canPlayCell(bigIndex: number, smallIndex: number): boolean {
  if (!state.value.isStarted) return false
  if (settings.value.gameMode === 'online') {
    return onlineRoomStatus.value === 'PLAYING'
      && onlineSelfSide.value === state.value.currentPlayer
      && canMove(state.value, bigIndex, smallIndex)
  }
  if (isTutorialMode.value && !canPlayTutorialCell(bigIndex, smallIndex)) return false
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
  nextState.messages.push(...createMoveMessages(nextState, movePlayer, move, report.id))
  nextState.errorMessage = ''
  state.value = nextState
  clearNextBoardPreview()

  if (!report.actor.isAI && !isTutorialMode.value) {
    adaptiveProfile.value = createAdaptiveProfileFromReports(adaptiveProfile.value, nextState.turnReports)
    saveAdaptiveProfile(adaptiveProfile.value)
  }

  if (isTutorialMode.value && !tutorialState.value.realAiEnabled) {
    handleTutorialMoveCompleted(movePlayer, move)
  } else {
    scheduleAIMoveIfNeeded()
  }
}

function scheduleAIMoveIfNeeded(): void {
  clearAIRequestTimer()
  if (isTutorialMode.value && !tutorialState.value.realAiEnabled) return
  if (!isAITurn(state.value) || state.value.winner !== EMPTY) return
  const delayMs = getPostMoveDelay(state.value)

  // 等本次落子和入口奖励动画完成后再进入电脑搜索，避免连续闪跳。
  void nextTick(() => {
    aiRequestTimer = window.setTimeout(() => {
      aiRequestTimer = null
      requestAIMoveIfNeeded()
    }, delayMs)
  })
}

function clearAIRequestTimer(): void {
  if (aiRequestTimer === null) return
  window.clearTimeout(aiRequestTimer)
  aiRequestTimer = null
}

function clearAIDecisionApplyTimer(): void {
  if (aiDecisionApplyTimer === null) return
  window.clearTimeout(aiDecisionApplyTimer)
  aiDecisionApplyTimer = null
}

function requestAIMoveIfNeeded(): void {
  clearAIRequestTimer()
  clearAIDecisionApplyTimer()
  if (isTutorialMode.value && !tutorialState.value.realAiEnabled) return
  if (!state.value.isStarted || !isAITurn(state.value) || state.value.winner !== EMPTY || isThinking.value) return

  isThinking.value = true
  aiThinkingStartedAt = Date.now()
  setError(`${getPlayerName(state.value.currentPlayer, state.value)} 正在思考`)
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
  const remainingDelay = AI_MIN_THINKING_MS - (Date.now() - aiThinkingStartedAt)
  if (remainingDelay > 0) {
    clearAIDecisionApplyTimer()
    aiDecisionApplyTimer = window.setTimeout(() => {
      aiDecisionApplyTimer = null
      applyAIDecision(responseId, decision)
    }, remainingDelay)
    return
  }

  isThinking.value = false
  if (!isAITurn(state.value)) return

  if (decision.resign) {
    const nextState = forceWinnerByResign(state.value, O)
    nextState.errorMessage = ''
    nextState.messages.push({
      id: `ai-resign-${Date.now()}`,
      type: 'system',
      player: O,
      text: GAME_TEXT.record.resign(getPlayerName(O, nextState), getPlayerName(X, nextState))
    })
    state.value = nextState
    return
  }

  if (decision.move) {
    playMove(decision.move, decision.analysis)
  }
}

function isAITurn(currentState: GameCoreState): boolean {
  return currentState.isStarted && currentState.gameMode === 'human-vs-ai' && currentState.currentPlayer === O && currentState.winner === EMPTY
}

function getCellMark(bigIndex: number, smallIndex: number): string {
  return getMarkText(state.value.board[getCellIndex(bigIndex, smallIndex)])
}

function getCellClass(bigIndex: number, smallIndex: number): Record<string, boolean> {
  const value = state.value.board[getCellIndex(bigIndex, smallIndex)]
  const lastTurnMove = state.value.lastTurnMoves.find((move) => move.bigIndex === bigIndex && move.smallIndex === smallIndex)
  const previewRewardPlayer = getPreviewRewardPlayer(bigIndex, smallIndex)
  const canPlay = canPlayCell(bigIndex, smallIndex)
  const isTutorialTarget = isTutorialTargetCell(bigIndex, smallIndex)

  return {
    'utt-cell-x': value === X,
    'utt-cell-o': value === O,
    'utt-cell-last-move': Boolean(lastTurnMove),
    'utt-cell-last-turn-manual': lastTurnMove?.source === 'manual',
    'utt-cell-last-turn-auto': lastTurnMove?.source === 'auto',
    'utt-cell-disabled': !canPlay,
    'utt-hoverable-x': canPlay && state.value.currentPlayer === X,
    'utt-hoverable-o': canPlay && state.value.currentPlayer === O,
    'utt-cell-tutorial-target': isTutorialTarget,
    'utt-cell-preview-reward-x': previewRewardPlayer === X,
    'utt-cell-preview-reward-o': previewRewardPlayer === O
  }
}

function isTutorialTargetCell(bigIndex: number, smallIndex: number): boolean {
  if (!tutorialState.value.active || !tutorialState.value.inputEnabled) return false
  if (!shouldHighlightTutorialTargets()) return false

  return tutorialState.value.allowedMoves?.some((move) => (
    move.bigIndex === bigIndex && move.smallIndex === smallIndex
  )) ?? false
}

function shouldHighlightTutorialTargets(): boolean {
  const allowedMoves = tutorialState.value.allowedMoves
  if (!allowedMoves || allowedMoves.length !== 1) return false

  return countLegalMoves() > 1
}

function countLegalMoves(): number {
  let moveCount = 0

  for (let bigIndex = 0; bigIndex < 9; bigIndex += 1) {
    for (let smallIndex = 0; smallIndex < 9; smallIndex += 1) {
      if (canMove(state.value, bigIndex, smallIndex)) {
        moveCount += 1
      }
      if (moveCount > 1) return moveCount
    }
  }

  return moveCount
}

function getPreviewRewardPlayer(bigIndex: number, smallIndex: number): Player | null {
  const rewardCell = activePreviewTarget.value?.rewardCells.find(
    (cell) => cell.bigIndex === bigIndex && cell.smallIndex === smallIndex
  )

  return rewardCell?.player ?? null
}

function getCellStyle(bigIndex: number, smallIndex: number): Record<string, string> {
  const autoIndex = state.value.lastTurnMoves.findIndex(
    (move) => move.source === 'auto' && move.bigIndex === bigIndex && move.smallIndex === smallIndex
  )

  return autoIndex >= 0
    ? { '--utt-auto-fill-delay': `${AUTO_FILL_BASE_DELAY_MS + (autoIndex * AUTO_FILL_STEP_DELAY_MS)}ms` }
    : {}
}

function getPostMoveDelay(currentState: GameCoreState): number {
  if (currentState.lastRuleEvents.length === 0) return PLAYER_MOVE_SETTLE_DELAY_MS

  const autoFillCount = currentState.lastRuleEvents.reduce((total, event) => total + event.filledCount, 0)
  if (autoFillCount === 0) return SETTLEMENT_CUE_MIN_DELAY_MS

  return Math.max(
    SETTLEMENT_CUE_MIN_DELAY_MS,
    AUTO_FILL_BASE_DELAY_MS
      + (Math.max(0, autoFillCount - 1) * AUTO_FILL_STEP_DELAY_MS)
      + AUTO_FILL_ANIMATION_MS
      + AFTER_AUTO_FILL_PAUSE_MS
  )
}

function getSmallBoardClass(bigIndex: number): Record<string, boolean> {
  const status = state.value.smallBoardStatus[bigIndex]
  const boardFull = isBoardFull(state.value, bigIndex)
  const effectiveNextBoard = getEffectiveNextBoard(state.value)
  const lastManualMoveBoardIndex = getLastManualMoveBoardIndex()
  const tutorialFocusBoards = getTutorialFocusBoards()
  const hasTutorialFocus = tutorialFocusBoards.length > 0
  const isTutorialFocus = tutorialFocusBoards.includes(bigIndex)
  const shouldDimBoard = shouldDimAllTutorialBoards()
  const isGameActive = state.value.isStarted
    && state.value.winner === EMPTY
    && (!isTutorialMode.value || tutorialState.value.inputEnabled)
  const isPlayableBoard = isGameActive && !boardFull && (effectiveNextBoard === null || effectiveNextBoard === bigIndex)
  const isLockedBoard = isGameActive && !boardFull && !isPlayableBoard
  const hasBigBoardWinner = state.value.winner === X || state.value.winner === O
  const bigBoardWinningLine = state.value.bigBoardWinningLine ?? []
  const currentSettlementBoardIndex = settlementBoardIndex.value

  return {
    'utt-small-board-active': isPlayableBoard || (hasTutorialFocus && isTutorialFocus && !boardFull),
    'utt-small-board-last-move': lastManualMoveBoardIndex === bigIndex && !boardFull,
    'utt-small-board-full': boardFull,
    'utt-small-board-locked': shouldDimBoard || isLockedBoard || (hasTutorialFocus && !isTutorialFocus && !boardFull),
    'utt-small-board-settled': currentSettlementBoardIndex === bigIndex,
    'utt-small-board-claimed-x': status === X,
    'utt-small-board-claimed-o': status === O,
    'utt-small-board-draw': status === DRAW,
    'utt-small-board-big-win': hasBigBoardWinner && bigBoardWinningLine.includes(bigIndex)
  }
}

function getLastManualMoveBoardIndex(): number | null {
  return state.value.lastTurnMoves.find((move) => move.source === 'manual')?.bigIndex ?? null
}

function getTutorialFocusBoards(): number[] {
  if (!tutorialState.value.active || state.value.winner !== EMPTY) return []

  switch (tutorialState.value.step) {
    case 'previousMoveIntro':
      return [4]
    case 'limitIntro':
    case 'awaitFirstMove':
      return [4, TUTORIAL_OPENING_BOARD_INDEX]
    case 'afterFirstMove': {
      const nextBoard = getEffectiveNextBoard(state.value)
      return nextBoard === null ? [] : [nextBoard]
    }
    case 'claimIntro':
    case 'awaitClaimMove':
    case 'claimSuccess':
    case 'lineRule':
      return [TUTORIAL_CLAIM_BOARD_INDEX]
    case 'centerMoveIntro':
    case 'awaitCenterMove':
    case 'centerSuccess':
    case 'centerRule':
    case 'freeMoveIntro':
      return [TUTORIAL_CENTER_BOARD_INDEX]
    case 'settlementReady':
    case 'settlementIntro':
    case 'settlementReward':
    case 'settlementCurrent':
    case 'drawSettlement':
    case 'fullTargetRule':
    case 'done':
      return [TUTORIAL_SETTLEMENT_BOARD_INDEX]
    default:
      return []
  }
}

function shouldDimAllTutorialBoards(): boolean {
  if (!tutorialState.value.active) return false

  switch (tutorialState.value.step) {
    case 'welcome':
    case 'boardIntro':
    case 'controlGoal':
    case 'victoryGoal':
    case 'practiceIntro':
      return true
    default:
      return false
  }
}

function createTutorialPreviewTarget(): PreviewTarget | null {
  const boardIndex = getTutorialPreviewBoardIndex()
  if (boardIndex === null) return null

  return {
    type: 'board',
    boardIndex,
    hintLines: [],
    hintPosition: getPreviewHintPosition(boardIndex),
    hintBoardIndex: null,
    rewardCells: []
  }
}

function getTutorialPreviewBoardIndex(): number | null {
  if (!tutorialDialogOpen.value || state.value.winner !== EMPTY) return null

  switch (tutorialState.value.step) {
    case 'limitIntro':
    case 'awaitFirstMove':
      return TUTORIAL_OPENING_BOARD_INDEX
    case 'afterFirstMove':
      return getEffectiveNextBoard(state.value)
    case 'claimIntro':
    case 'awaitClaimMove':
    case 'claimSuccess':
    case 'lineRule':
      return TUTORIAL_CLAIM_BOARD_INDEX
    case 'centerMoveIntro':
    case 'awaitCenterMove':
    case 'centerSuccess':
    case 'centerRule':
    case 'freeMoveIntro':
      return TUTORIAL_CENTER_BOARD_INDEX
    case 'settlementReady':
    case 'settlementIntro':
    case 'settlementReward':
    case 'settlementCurrent':
    case 'drawSettlement':
    case 'fullTargetRule':
    case 'done':
      return TUTORIAL_SETTLEMENT_BOARD_INDEX
    default:
      return null
  }
}

function shouldPlaceTutorialPromptTop(): boolean {
  switch (tutorialState.value.step) {
    case 'welcome':
    case 'boardIntro':
    case 'controlGoal':
    case 'victoryGoal':
    case 'practiceIntro':
    case 'previousMoveIntro':
    case 'limitIntro':
    case 'awaitFirstMove':
    case 'afterFirstMove':
      return true
    default:
      return false
  }
}

function shouldPlaceTutorialPromptAfterTopBoard(): boolean {
  switch (tutorialState.value.step) {
    case 'claimIntro':
    case 'awaitClaimMove':
    case 'claimSuccess':
    case 'lineRule':
      return true
    default:
      return false
  }
}

function shouldPlaceTutorialPromptNearCenterBoard(): boolean {
  switch (tutorialState.value.step) {
    case 'centerMoveIntro':
    case 'awaitCenterMove':
    case 'centerSuccess':
    case 'centerRule':
    case 'freeMoveIntro':
      return true
    default:
      return false
  }
}

function shouldPlaceTutorialPromptBelowMiddleRow(): boolean {
  switch (tutorialState.value.step) {
    case 'settlementReady':
    case 'settlementIntro':
    case 'settlementReward':
    case 'settlementCurrent':
    case 'drawSettlement':
    case 'fullTargetRule':
    case 'done':
      return true
    default:
      return false
  }
}

function showNextBoardPreview(bigIndex: number, smallIndex: number): void {
  clearPreviewTimer()
  clearPreviewHideTimer()
  if (!canPreviewCell(bigIndex, smallIndex)) return

  previewTimer = window.setTimeout(() => {
    previewTimer = null
    resolveNextBoardPreview(bigIndex, smallIndex)
  }, PREVIEW_SHOW_DELAY_MS)
}

function showNextBoardPreviewNow(bigIndex: number, smallIndex: number): void {
  clearPreviewTimer()
  clearPreviewHideTimer()
  if (!canPreviewCell(bigIndex, smallIndex)) return
  resolveNextBoardPreview(bigIndex, smallIndex)
}

function canPreviewCell(bigIndex: number, smallIndex: number): boolean {
  if (!state.value.isStarted) return false
  if (settings.value.gameMode === 'online') {
    return onlineRoomStatus.value === 'PLAYING'
      && onlineSelfSide.value === state.value.currentPlayer
      && canMove(state.value, bigIndex, smallIndex)
  }
  if (isAITurn(state.value)) return false

  return canMove(state.value, bigIndex, smallIndex)
}

function resolveNextBoardPreview(bigIndex: number, smallIndex: number): void {
  const result = applyMoveImmutable(state.value, { bigIndex, smallIndex })
  if (!result.success) return

  const target = createPreviewTarget(result.state)
  if (target) setPreviewTarget(target)
}

function scheduleClearNextBoardPreview(): void {
  clearPreviewTimer()
  clearPreviewHideTimer()
  previewHideTimer = window.setTimeout(() => {
    previewHideTimer = null
    activePreviewTarget.value = null
  }, PREVIEW_HIDE_DELAY_MS)
}

function clearNextBoardPreview(): void {
  clearPreviewTimer()
  clearPreviewHideTimer()
  activePreviewTarget.value = null
}

function clearPreviewTimer(): void {
  if (previewTimer === null) return
  window.clearTimeout(previewTimer)
  previewTimer = null
}

function clearPreviewHideTimer(): void {
  if (previewHideTimer === null) return
  window.clearTimeout(previewHideTimer)
  previewHideTimer = null
}

function setPreviewTarget(target: PreviewTarget): void {
  activePreviewTarget.value = target
  lastPreviewTarget.value = target
}

function createPreviewFrameStyle(target: PreviewTarget | null): Record<string, string> | null {
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
}

function createPreviewHintStyle(target: PreviewTarget | null): Record<string, string> | null {
  if (!target || target.hintLines.length === 0 || target.hintBoardIndex === null) return null

  const col = target.hintBoardIndex % 3
  const row = Math.floor(target.hintBoardIndex / 3)
  const boardSize = 'calc((100% - var(--utt-board-padding) - var(--utt-board-padding) - var(--utt-board-gap) - var(--utt-board-gap)) / 3)'
  const step = `calc(${boardSize} + var(--utt-board-gap))`
  const colOffset = repeatCssAddition(step, col)
  const rowOffset = repeatCssAddition(step, row)
  const left = `calc(var(--utt-board-padding)${colOffset} + (${boardSize} / 2))`

  return target.hintPosition === 'below'
    ? {
        left,
        top: `calc(var(--utt-board-padding)${rowOffset} + ${boardSize} + 8px)`,
        '--utt-preview-hint-transform': 'translateX(-50%)',
        '--utt-preview-hint-from-transform': 'translate(-50%, -6px)'
      }
    : {
        left,
        top: `calc(var(--utt-board-padding)${rowOffset} - 8px)`,
        '--utt-preview-hint-transform': 'translate(-50%, -100%)',
        '--utt-preview-hint-from-transform': 'translate(-50%, calc(-100% - 6px))'
      }
}

function createPreviewTarget(nextState: GameCoreState): PreviewTarget | null {
  const event = nextState.lastRuleEvents[0]
  if (!event && (isPlayer(nextState.winner) || nextState.winner === DRAW)) return null

  const targetBoard = isPlayer(nextState.winner) || nextState.winner === DRAW
    ? null
    : getEffectiveNextBoard(nextState)
  const hintLines = event ? createSettlementPreviewHint(nextState, event) : []
  const hintPosition = event ? getPreviewHintPosition(event.boardIndex) : 'above'
  const hintBoardIndex = event?.boardIndex ?? null
  const rewardCells = event?.filledCells.map((cell) => ({
    bigIndex: cell.bigIndex,
    smallIndex: cell.smallIndex,
    player: cell.player
  })) ?? []

  return targetBoard === null
    ? {
        type: 'free',
        hintLines,
        hintPosition,
        hintBoardIndex,
        rewardCells
      }
    : {
        type: 'board',
        boardIndex: targetBoard,
        hintLines,
        hintPosition,
        hintBoardIndex,
        rewardCells
      }
}

function getPreviewHintPosition(boardIndex: number): PreviewHintPosition {
  return Math.floor(boardIndex / 3) === 0 ? 'below' : 'above'
}

function createSettlementPreviewHint(nextState: GameCoreState, event: RuleEvent): MessageLinePart[][] {
  if (!isPlayer(event.owner)) {
    return [
      [{ text: '即将触发满盘结算！', player: null }],
      [{ text: '无人占领，不触发入口奖励。', player: null }]
    ]
  }

  const nextPlayer = getOpponent(event.owner)

  return [
    [{ text: '即将触发满盘结算！', player: null }],
    [
      { text: '由 ', player: null },
      { text: getDisplayPlayerName(event.owner, nextState), player: event.owner },
      { text: ' 占领，结算后 ', player: null },
      { text: getDisplayPlayerName(nextPlayer, nextState), player: nextPlayer },
      { text: ' 自由落子', player: null }
    ]
  ]
}

function createVictoryCueLines(winner: Player): MessageLinePart[] {
  const winningLine = state.value.bigBoardWinningLine ?? []
  if (winningLine.length === 0) {
    return [
      { text: GAME_TEXT.record.winner(getCuePlayerName(winner)), player: winner }
    ]
  }

  return [
    { text: GAME_TEXT.record.lineWinner(getCuePlayerName(winner), formatBoardList(winningLine)), player: winner }
  ]
}

function formatBoardList(boardIndexes: number[]): string {
  if (boardIndexes.length === 1) return `${formatBigBoardIndex(boardIndexes[0])} 棋盘`
  if (boardIndexes.length === 2) {
    return `${formatBigBoardIndex(boardIndexes[0])} 棋盘和 ${formatBigBoardIndex(boardIndexes[1])} 棋盘`
  }

  const leadingBoards = boardIndexes.slice(0, -1).map((boardIndex) => `${formatBigBoardIndex(boardIndex)} 棋盘`)
  const lastBoard = `${formatBigBoardIndex(boardIndexes[boardIndexes.length - 1])} 棋盘`
  return `${leadingBoards.join('、')}和 ${lastBoard}`
}

function getCuePlayerName(player: Player): string {
  if (settings.value.gameMode === 'online') {
    return getOnlineSideDisplayName(player, false)
  }
  return player === X ? '蓝方' : '红方'
}

function getPlayerSideName(player: Player): string {
  return GAME_TEXT.player.sideName(player)
}

function getDisplayPlayerName(player: Player, currentState: GameCoreState): string {
  if (settings.value.gameMode === 'online') {
    return getOnlineSideDisplayName(player)
  }
  if (currentState.gameMode === 'human-vs-ai') {
    return player === X ? '你' : `电脑(${getDifficultyName(currentState.aiDifficulty)})`
  }

  return getPlayerName(player, currentState)
}

function getOnlineSideDisplayName(player: Player, _withRole = true): string {
  const onlinePlayer = onlinePlayers.value.find((item) => toOnlinePlayer(item.side) === player)
  const fallback = GAME_TEXT.player.defaultName(player)
  return onlinePlayer ? getOnlinePlayerDisplayName(onlinePlayer) : fallback
}

function repeatCssAddition(value: string, times: number): string {
  return Array.from({ length: times }, () => ` + ${value}`).join('')
}

function preventCancelableDefault(event: Event): void {
  if (event.cancelable) {
    event.preventDefault()
  }
}

function getTouchCellTarget(touch: Touch): GameMove | null {
  const element = document.elementFromPoint(touch.clientX, touch.clientY)
  const cell = element?.closest<HTMLElement>('.utt-cell')
  if (!cell) return null

  const bigIndex = Number(cell.dataset.bigIndex)
  const smallIndex = Number(cell.dataset.smallIndex)
  if (!Number.isInteger(bigIndex) || !Number.isInteger(smallIndex)) return null
  if (bigIndex < 0 || bigIndex > 8 || smallIndex < 0 || smallIndex > 8) return null
  return { bigIndex, smallIndex }
}

function resetGameToReady(): void {
  isThinking.value = false
  clearAIRequestTimer()
  clearAIDecisionApplyTimer()
  requestId += 1
  state.value = createInitialGameState(settings.value)
  clearNextBoardPreview()
}

function closeRulesDialog(): void {
  isRulesOpen.value = false
}

function handleSecondaryAction(): void {
  if (settings.value.gameMode === 'online' && !hasOnlineRoom.value) {
    void openOnlineRoomDialog()
    return
  }
  if (settings.value.gameMode === 'online' && hasOnlineRoom.value && onlineRoomStatus.value === 'WAITING') {
    void shareOnlineRoom()
    return
  }
  isRulesOpen.value = true
}

function setRulesDialogScrollLock(locked: boolean): void {
  if (typeof document === 'undefined') return

  if (locked) {
    if (previousRulesBodyOverflow === null) previousRulesBodyOverflow = document.body.style.overflow
    if (previousRulesHtmlOverflow === null) previousRulesHtmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    return
  }

  if (previousRulesBodyOverflow !== null) {
    document.body.style.overflow = previousRulesBodyOverflow
    previousRulesBodyOverflow = null
  }
  if (previousRulesHtmlOverflow !== null) {
    document.documentElement.style.overflow = previousRulesHtmlOverflow
    previousRulesHtmlOverflow = null
  }
}

function handleStartTutorial(): void {
  if (isTutorialMode.value) {
    window.alert('你已经进入教学模式了。')
    return
  }
  if (hasOnlineRoom.value && !confirmLeaveOnlineRoom('这么做会离开房间，确定要继续吗？')) {
    return
  }
  if (hasOnlineRoom.value) {
    leaveOnlineRoom(true)
  }
  if (state.value.isStarted && settings.value.gameMode !== 'online') {
    window.alert('当前已有对局，只能查看游戏规则。')
    return
  }

  closeRulesDialog()
  clearAIRequestTimer()
  clearAIDecisionApplyTimer()
  clearTutorialTimer()
  isThinking.value = false
  previousTutorialSettings.value = { ...settings.value }
  settings.value = {
    gameMode: 'human-vs-ai',
    aiDifficulty: 'easy'
  }
  tutorialState.value = {
    active: true,
    step: 'welcome',
    dialogOpen: true,
    inputEnabled: false,
    realAiEnabled: false,
    allowedMoves: null
  }
  state.value = createTutorialOpeningState(settings.value)
  appendTutorialStepMessage('welcome')
  clearNextBoardPreview()
}

function startGame(): void {
  isThinking.value = false
  clearAIRequestTimer()
  clearAIDecisionApplyTimer()
  requestId += 1
  state.value = createInitialGameState(settings.value, { started: true })
  clearNextBoardPreview()
  requestAIMoveIfNeeded()
}

function handleResignOrRematch(): void {
  clearAIRequestTimer()
  clearAIDecisionApplyTimer()

  if (isTutorialMode.value) {
    exitTutorialWithConfirm()
    return
  }

  if (settings.value.gameMode === 'online') {
    void handleOnlinePrimaryAction()
    return
  }

  if (!state.value.isStarted || isFinished.value) {
    startGame()
    return
  }

  const loser = state.value.currentPlayer
  const winner = getOpponent(loser)
  const confirmed = window.confirm(`${getPlayerName(loser, state.value)}\n确认投降`)
  if (!confirmed) return

  const nextState = forceWinnerByResign(state.value, loser)
  nextState.errorMessage = ''
  nextState.messages.push({
    id: `human-resign-${Date.now()}`,
    type: 'system',
    player: loser,
    text: GAME_TEXT.record.resign(getPlayerName(loser, nextState), getPlayerName(winner, nextState))
  })
  state.value = nextState
}

function handleModeSelectChange(event: Event): void {
  if (isTutorialMode.value) return
  const gameMode = (event.target as HTMLSelectElement).value as GameMode
  const shouldOpenOnlineIntro = gameMode === 'online' && settings.value.gameMode !== 'online' && shouldShowOnlineIntro()

  if (gameMode === 'online' && !ensureOnlineNicknameForEntry()) {
    return
  }

  if (settings.value.gameMode === 'online' && gameMode !== 'online' && hasOnlineRoom.value) {
    if (!confirmLeaveOnlineRoom('切换模式会离开当前房间，确定要继续吗？')) {
      return
    }
    leaveOnlineRoom(true)
  }
  settings.value = {
    ...settings.value,
    gameMode
  }
  handleModeChange()

  if (shouldOpenOnlineIntro) {
    markOnlineIntroShown()
    isRulesOpen.value = true
  }
}

function handleDifficultySelectChange(event: Event): void {
  if (isTutorialMode.value) return
  const aiDifficulty = (event.target as HTMLSelectElement).value as AIDifficulty
  settings.value = {
    ...settings.value,
    aiDifficulty
  }
  handleDifficultyChange()
}

function handleModeChange(): void {
  if (settings.value.gameMode !== 'online') {
    leaveOnlineRoom(false)
  }

  saveGameSettings(settings.value)
  resetGameToReady()
}

function handleDifficultyChange(): void {
  saveGameSettings(settings.value)
  resetGameToReady()
}

async function handleOnlinePrimaryAction(): Promise<void> {
  if (onlineRoomStatus.value === 'PLAYING') {
    resignOnlineGame()
    return
  }
  if (onlineRoomStatus.value === 'WAITING' || onlineRoomStatus.value === 'FINISHED') {
    readyOnlineGame()
    return
  }
  await createOnlineRoomFromCurrentPlayer()
}

async function createOnlineRoomFromCurrentPlayer(): Promise<void> {
  const nickname = ensureOnlineNickname()
  if (!nickname) return

  try {
    setError('正在创建在线房间')
    const room = await createOnlineRoom(nickname)
    saveOnlineRoomToken(room.roomId, room.playerToken)
    connectOnlineRoom(room.roomId, room.playerToken, nickname)
    updateOnlineRoomUrl(room.roomId)
    closeOnlineRoomDialog()
  } catch (error) {
    setError(error instanceof Error ? error.message : '创建房间失败')
  }
}

async function openOnlineRoomDialog(): Promise<void> {
  isOnlineRoomDialogOpen.value = true
  await refreshOnlineRooms()
}

function closeOnlineRoomDialog(): void {
  isOnlineRoomDialogOpen.value = false
}

async function refreshOnlineRooms(): Promise<void> {
  isOnlineRoomsLoading.value = true
  try {
    onlineRooms.value = await fetchOnlineRooms()
  } catch (error) {
    setError(error instanceof Error ? error.message : '获取房间列表失败')
  } finally {
    isOnlineRoomsLoading.value = false
  }
}

function joinOnlineRoomFromList(room: OnlineRoomListItem): void {
  if (!room.joinable) return
  const nickname = ensureOnlineNickname()
  if (!nickname) return
  joinOnlineRoom(room.roomId, nickname)
  closeOnlineRoomDialog()
}

function randomJoinOnlineRoom(): void {
  const targetRoom = [...onlineRooms.value]
    .filter((room) => room.joinable)
    .sort((left, right) => getRandomJoinRoomScore(left) - getRandomJoinRoomScore(right))[0]
  if (!targetRoom) {
    setError('当前没有可加入的房间，建议创建一个新房间。')
    return
  }
  joinOnlineRoomFromList(targetRoom)
}

async function createOnlineRoomFromDialog(): Promise<void> {
  await createOnlineRoomFromCurrentPlayer()
}

function joinOnlineRoom(roomId: string, nickname: string): void {
  const normalizedRoomId = normalizeOnlineRoomId(roomId)
  const playerToken = loadOnlineRoomToken(normalizedRoomId) || createOnlinePlayerToken()
  saveOnlineRoomToken(normalizedRoomId, playerToken)
  connectOnlineRoom(normalizedRoomId, playerToken, nickname)
  updateOnlineRoomUrl(normalizedRoomId)
}

function connectOnlineRoom(roomId: string, playerToken: string, nickname: string): void {
  closeOnlineClient()
  settings.value = {
    ...settings.value,
    gameMode: 'online'
  }
  saveGameSettings(settings.value)
  onlineRoomId.value = normalizeOnlineRoomId(roomId)
  onlinePlayerToken.value = playerToken
  onlineNickname.value = nickname
  onlineRoomStatus.value = 'NOT_JOINED'
  onlineConnectionStatus.value = 'connecting'
  state.value = createInitialGameState(settings.value)
  clearNextBoardPreview()

  const client = new OnlineGameClient({
    onSnapshot: applyOnlineSnapshot,
    onError: handleOnlineRoomError,
    onClose: () => {
      if (onlineClient.value === client) {
        handleOnlineSocketClosed()
      }
    }
  })
  onlineClient.value = client
  client.connect(onlineRoomId.value, onlinePlayerToken.value, nickname)
}

function handleOnlineRoomError(message: string): void {
  setError(message)
  if (isExpiredOnlineRoomError(message)) {
    expireOnlineRoom(message)
  }
}

function isExpiredOnlineRoomError(message: string): boolean {
  return message.includes('房间不存在')
    || message.includes('已过期')
    || message.includes('房间失效')
}

function expireOnlineRoom(message = '房间已失效，请重新创建或加入房间'): void {
  const expiredRoomId = onlineRoomId.value
  closeOnlineClient()
  onlineRoomId.value = ''
  onlinePlayerToken.value = ''
  onlineRoomStatus.value = 'NOT_JOINED'
  onlineConnectionStatus.value = 'expired'
  onlineSelfSide.value = null
  onlinePlayers.value = []
  isOnlineMemberMenuOpen.value = false
  if (expiredRoomId) {
    removeOnlineRoomToken(expiredRoomId)
  }
  clearOnlineRoomUrl()
  state.value = createInitialGameState(settings.value)
  clearNextBoardPreview()
  setError(message)
}

function playOnlineCell(bigIndex: number, smallIndex: number): void {
  if (!canPlayCell(bigIndex, smallIndex)) {
    setError(getOnlineMoveError())
    return
  }
  onlineClient.value?.move(onlineRoomId.value, onlinePlayerToken.value, { bigIndex, smallIndex })
}

function resignOnlineGame(): void {
  if (!onlineClient.value || !onlineRoomId.value || !onlinePlayerToken.value) {
    setError('尚未加入在线房间')
    return
  }
  const confirmed = window.confirm('确认投降当前在线对局？')
  if (!confirmed) return
  onlineClient.value.resign(onlineRoomId.value, onlinePlayerToken.value)
}

function readyOnlineGame(): void {
  if (!onlineClient.value || !onlineRoomId.value || !onlinePlayerToken.value) {
    setError('尚未加入在线房间')
    return
  }
  onlineClient.value.ready(onlineRoomId.value, onlinePlayerToken.value)
}

async function shareOnlineRoom(): Promise<void> {
  if (!onlineRoomId.value) {
    setError('尚未加入在线房间')
    return
  }
  const inviteLink = createOnlineInviteLink(onlineRoomId.value)
  try {
    await navigator.clipboard.writeText(inviteLink)
    setError('房间邀请链接已复制')
  } catch {
    window.prompt('复制房间邀请链接', inviteLink)
  }
}

function applyOnlineSnapshot(snapshot: OnlineRoomSnapshot): void {
  onlineRoomId.value = snapshot.roomId
  onlineRoomStatus.value = snapshot.roomStatus
  onlineConnectionStatus.value = 'connected'
  onlineSelfSide.value = toOnlinePlayer(snapshot.selfSide)
  onlinePlayers.value = snapshot.players

  const nextState = createInitialGameState(settings.value, { started: snapshot.state.isStarted })
  nextState.board = snapshot.state.board.slice() as GameCoreState['board']
  nextState.smallBoardStatus = snapshot.state.smallBoardStatus.slice() as GameCoreState['smallBoardStatus']
  nextState.smallBoardResolved = snapshot.state.smallBoardResolved.slice()
  nextState.smallBoardWinningLines = snapshot.state.smallBoardWinningLines.map((line) => line?.slice() ?? null)
  nextState.currentPlayer = snapshot.state.currentPlayer as Player
  nextState.nextBoard = snapshot.state.nextBoard
  nextState.winner = snapshot.state.winner as GameCoreState['winner']
  nextState.bigBoardWinningLine = snapshot.state.bigBoardWinningLine?.slice() ?? null
  nextState.gameMode = 'online'
  nextState.moveHistory = snapshot.state.moveHistory.map(toRecordedMove)
  nextState.lastTurnMoves = snapshot.state.lastTurnMoves.map(toRecordedMove)
  nextState.lastRuleEvents = snapshot.state.lastRuleEvents.map(toRuleEvent)
  nextState.turnReports = []
  nextState.messages = snapshot.messages.map(toGameMessage)
  nextState.errorMessage = ''
  nextState.isMessageInputFocused = state.value.isMessageInputFocused

  for (const player of snapshot.players) {
    const side = toOnlinePlayer(player.side)
    if (side) {
      nextState.players[side] = {
        sideName: side === X ? '蓝方' : '红方',
        name: player.nickname
      }
    }
  }

  state.value = nextState
  clearNextBoardPreview()
}

function toRecordedMove(move: OnlineRecordedMove): GameCoreState['moveHistory'][number] {
  return {
    bigIndex: move.bigIndex,
    smallIndex: move.smallIndex,
    player: toOnlinePlayer(move.player) ?? X,
    source: move.source,
    settlementBoardIndex: move.settlementBoardIndex ?? undefined
  }
}

function toRuleEvent(event: OnlineRuleEvent): RuleEvent {
  return {
    boardIndex: event.boardIndex,
    owner: event.owner as RuleEvent['owner'],
    filledCount: event.filledCount,
    filledCells: event.filledCells.map(toRecordedMove)
  }
}

function toGameMessage(message: OnlineGameMessage): GameMessage {
  return {
    id: message.id,
    type: message.type,
    player: toOnlinePlayer(message.player) ?? undefined,
    sender: toOnlinePlayer(message.sender) ?? undefined,
    senderName: message.senderName ?? undefined,
    text: formatOnlineMessageText(message)
  }
}

function formatOnlineMessageText(message: OnlineGameMessage): string {
  const eventText = formatOnlineEventMessage(message)
  if (eventText !== null) return eventText

  if (message.type === 'chat' && message.senderName) {
    const separator = '说：'
    const separatorIndex = message.text.indexOf(separator)
    const content = separatorIndex >= 0 ? message.text.slice(separatorIndex + separator.length) : message.text
    const senderPlayer = findOnlineMessageSender(message)
    const senderName = senderPlayer?.self ? '你' : message.senderName
    return GAME_TEXT.record.chat(senderName, content)
  }

  return message.text
}

function formatOnlineEventMessage(message: OnlineGameMessage): string | null {
  if (!message.eventType) return null

  const eventData = message.eventData ?? {}
  switch (message.eventType) {
    case 'ROOM_CREATED':
      return `${readEventNickname(eventData, 'nickname')} 创建并加入了 ${readEventString(eventData, 'roomId')} 房间`
    case 'PLAYER_JOINED':
      return `${readEventNickname(eventData, 'nickname')} 加入了游戏`
    case 'PLAYER_LEFT':
      return `${readEventNickname(eventData, 'nickname')} 离开了房间`
    case 'PLAYER_READY':
      return `${readEventNickname(eventData, 'nickname')} 已准备`
    case 'PLAYER_UNREADY':
      return `${readEventNickname(eventData, 'nickname')} 取消准备`
    case 'GAME_STARTED':
      return GAME_TEXT.record.gameStart(GAME_TEXT.settings.gameModeName('online'), readEventPlayerName(eventData, 'firstPlayer'))
    case 'MOVE_PLAYED':
      return formatOnlineMoveEvent(eventData)
    case 'BOARD_DRAW':
      return formatOnlineDrawBoardEvent(eventData)
    case 'BOARD_SETTLEMENT':
      return formatOnlineSettlementEvent(eventData)
    case 'GAME_DRAW':
      return GAME_TEXT.record.gameDraw()
    case 'LINE_WIN':
      return formatOnlineLineWinnerEvent(eventData)
    case 'RESIGN_WIN':
      return GAME_TEXT.record.resign(readEventPlayerName(eventData, 'loser'), readEventPlayerName(eventData, 'winner'))
    case 'LEAVE_WIN':
      return GAME_TEXT.record.leaveWinner(readEventPlayerName(eventData, 'loser'), readEventPlayerName(eventData, 'winner'))
    case 'CHAT_SENT':
      return GAME_TEXT.record.chat(readEventNickname(eventData, 'nickname'), readEventString(eventData, 'text'))
  }
}

function formatOnlineMoveEvent(eventData: Record<string, unknown>): string {
  const playerName = readEventPlayerName(eventData, 'player')
  const bigIndex = readEventNumber(eventData, 'bigIndex')
  const smallIndex = readEventNumber(eventData, 'smallIndex')
  const lines = [
    GAME_TEXT.record.move(playerName, formatBigBoardIndex(bigIndex), GAME_TEXT.board.smallCell(smallIndex))
  ]

  const filledBoardIndex = readOptionalEventNumber(eventData, 'filledBoardIndex')
  if (filledBoardIndex !== null) {
    lines.push(GAME_TEXT.record.filledBoard(formatBigBoardIndex(filledBoardIndex)))
  }

  const nextTurnText = formatOnlineNextTurnEvent(eventData)
  if (nextTurnText) lines.push(nextTurnText)
  return lines.join('\n')
}

function formatOnlineDrawBoardEvent(eventData: Record<string, unknown>): string {
  const lines = [GAME_TEXT.record.drawBoard(formatBigBoardIndex(readEventNumber(eventData, 'boardIndex')))]
  const nextTurnText = formatOnlineNextTurnEvent(eventData)
  if (nextTurnText) lines.push(nextTurnText)
  return lines.join('\n')
}

function formatOnlineSettlementEvent(eventData: Record<string, unknown>): string {
  const lines = [
    GAME_TEXT.record.settlement(
      readEventPlayerName(eventData, 'owner'),
      formatBigBoardIndex(readEventNumber(eventData, 'boardIndex')),
      readEventNumber(eventData, 'filledCount')
    ),
    GAME_TEXT.record.settlementNext(readEventPlayerName(eventData, 'nextPlayer'))
  ]
  const chainCount = readOptionalEventNumber(eventData, 'chainCount') ?? 0
  if (chainCount > 0) {
    lines.push(GAME_TEXT.record.chainSettlement(chainCount))
  }
  return lines.join('\n')
}

function formatOnlineLineWinnerEvent(eventData: Record<string, unknown>): string {
  const winnerName = readEventPlayerName(eventData, 'winner')
  const winningLine = readEventNumberArray(eventData, 'line')
  return winningLine.length > 0
    ? GAME_TEXT.record.lineWinner(winnerName, formatBoardList(winningLine))
    : GAME_TEXT.record.winner(winnerName)
}

function formatOnlineNextTurnEvent(eventData: Record<string, unknown>): string | null {
  const nextPlayer = readOptionalEventPlayer(eventData, 'nextPlayer')
  if (!nextPlayer) return null

  const nextPlayerName = getOnlineSideDisplayName(nextPlayer, false)
  const nextBoard = readOptionalEventNumber(eventData, 'nextBoard')
  return nextBoard === null
    ? GAME_TEXT.record.nextFree(nextPlayerName)
    : GAME_TEXT.record.nextBoard(nextPlayerName, formatBigBoardIndex(nextBoard))
}

function readEventNickname(eventData: Record<string, unknown>, key: string): string {
  const playerNumber = readOptionalEventNumber(eventData, 'playerNumber')
  const eventPlayer = findOnlinePlayerByNumber(playerNumber)
  if (eventPlayer) return getOnlinePlayerDisplayName(eventPlayer)
  if (playerNumber !== null) return `${DEFAULT_ONLINE_NICKNAME}${playerNumber}`

  const nickname = readEventString(eventData, key)
  return nickname || GAME_TEXT.room.defaultNickname
}

function readEventPlayerName(eventData: Record<string, unknown>, key: string): string {
  const playerNumber = readOptionalEventNumber(eventData, `${key}Number`)
  const eventPlayer = findOnlinePlayerByNumber(playerNumber)
  if (eventPlayer) return getOnlinePlayerDisplayName(eventPlayer)
  if (playerNumber !== null) return `${DEFAULT_ONLINE_NICKNAME}${playerNumber}`

  const player = readOptionalEventPlayer(eventData, key)
  return player ? getOnlineSideDisplayName(player, false) : GAME_TEXT.player.defaultName(X)
}

function readOptionalEventPlayer(eventData: Record<string, unknown>, key: string): Player | null {
  return toOnlinePlayer(readOptionalEventNumber(eventData, key))
}

function readEventString(eventData: Record<string, unknown>, key: string): string {
  const value = eventData[key]
  return typeof value === 'string' ? value : ''
}

function readEventNumber(eventData: Record<string, unknown>, key: string): number {
  return readOptionalEventNumber(eventData, key) ?? 0
}

function readOptionalEventNumber(eventData: Record<string, unknown>, key: string): number | null {
  const value = eventData[key]
  return typeof value === 'number' && Number.isInteger(value) ? value : null
}

function readEventNumberArray(eventData: Record<string, unknown>, key: string): number[] {
  const value = eventData[key]
  if (!Array.isArray(value)) return []
  return value.filter((item): item is number => typeof item === 'number' && Number.isInteger(item))
}

function findOnlineMessageSender(message: OnlineGameMessage): OnlinePlayerSnapshot | null {
  const eventPlayer = findOnlinePlayerByNumber(readOptionalEventNumber(message.eventData ?? {}, 'playerNumber'))
  if (eventPlayer) return eventPlayer

  const sender = toOnlinePlayer(message.sender)
  if (sender) {
    return onlinePlayers.value.find((player) => toOnlinePlayer(player.side) === sender) ?? null
  }
  return onlinePlayers.value.find((player) => player.nickname === message.senderName) ?? null
}

function findOnlinePlayerByNumber(playerNumber: number | null): OnlinePlayerSnapshot | null {
  if (playerNumber === null) return null
  return onlinePlayers.value.find((player) => player.playerNumber === playerNumber) ?? null
}

function toOnlinePlayer(value: unknown): Player | null {
  return value === X || value === O ? value : null
}

function handleOnlineSocketClosed(): void {
  if (settings.value.gameMode !== 'online') return
  onlineConnectionStatus.value = onlineRoomId.value ? 'disconnected' : 'idle'
}

function handleVisibilityChange(): void {
  if (document.visibilityState === 'visible') {
    reconnectOnlineRoomIfNeeded()
  }
}

function reconnectOnlineRoomIfNeeded(): void {
  if (settings.value.gameMode !== 'online') return
  if (onlineConnectionStatus.value !== 'disconnected') return
  if (!onlineRoomId.value || !onlinePlayerToken.value || !onlineNickname.value) return
  connectOnlineRoom(onlineRoomId.value, onlinePlayerToken.value, onlineNickname.value)
}

function handleInitialOnlineRoomFromUrl(): void {
  if (typeof window === 'undefined') return
  const roomId = new URLSearchParams(window.location.search).get('room')
  if (!roomId) return
  const nickname = ensureOnlineNicknameForEntry()
  if (!nickname) return
  if (shouldShowOnlineIntro()) {
    markOnlineIntroShown()
    isRulesOpen.value = true
  }
  joinOnlineRoom(roomId, nickname)
}

function ensureOnlineNickname(): string | null {
  if (onlineNickname.value) return onlineNickname.value
  onlineNickname.value = DEFAULT_ONLINE_NICKNAME
  return onlineNickname.value
}

function ensureOnlineNicknameForEntry(): string | null {
  if (hasCustomOnlineNickname.value && onlineNickname.value.trim()) {
    return onlineNickname.value.trim()
  }

  const nickname = window.prompt('首次进入在线对战，请先输入昵称（1-16 字）', onlineNickname.value || DEFAULT_ONLINE_NICKNAME)
  if (nickname === null) return null

  const cleanNickname = nickname.trim()
  if (!cleanNickname || cleanNickname.length > 16) {
    window.alert('昵称需要 1-16 字')
    return null
  }

  onlineNickname.value = cleanNickname
  saveOnlineNickname(cleanNickname)
  return cleanNickname
}

function editOnlineNickname(): void {
  if (hasOnlineRoom.value) return
  const nickname = window.prompt('请输入在线对战昵称（1-16 字）', onlineNickname.value)
  if (!nickname) return
  const cleanNickname = nickname.trim()
  if (!cleanNickname || cleanNickname.length > 16) {
    window.alert('昵称需要 1-16 字')
    return
  }
  onlineNickname.value = cleanNickname
  saveOnlineNickname(cleanNickname)
}

function confirmLeaveOnlineRoom(message: string): boolean {
  if (!hasOnlineRoom.value) return true
  return window.confirm(message)
}

function leaveOnlineRoom(notifyServer: boolean): void {
  if (notifyServer && onlineClient.value && onlineRoomId.value && onlinePlayerToken.value) {
    onlineClient.value.leave(onlineRoomId.value, onlinePlayerToken.value)
  }
  resetOnlineRoom()
  clearOnlineRoomUrl()
}

function resetOnlineRoom(): void {
  closeOnlineClient()
  onlineRoomId.value = ''
  onlinePlayerToken.value = ''
  onlineRoomStatus.value = 'NOT_JOINED'
  onlineConnectionStatus.value = 'idle'
  onlineSelfSide.value = null
  onlinePlayers.value = []
  isOnlineMemberMenuOpen.value = false
}

function closeOnlineClient(): void {
  const client = onlineClient.value
  onlineClient.value = null
  client?.close()
}

function handleBeforeUnload(event: BeforeUnloadEvent): void {
  if (!hasOnlineRoom.value) return
  event.preventDefault()
  event.returnValue = ''
}

function getOnlinePrimaryActionText(): string {
  if (onlineRoomStatus.value === 'PLAYING') return onlineSelfIsActivePlayer.value ? '投降' : '观战中'
  if (onlineRoomStatus.value === 'WAITING') {
    if (onlineSelfReady.value) return `取消(${onlineReadyCount.value}/2)`
    return `准备(${onlineReadyCount.value}/2)`
  }
  if (onlineRoomStatus.value === 'FINISHED') {
    if (onlineSelfReady.value) return `取消(${onlineReadyCount.value}/2)`
    return `再来!(${onlineReadyCount.value}/2)`
  }
  return '创建房间'
}

function getOnlineRoomStatusText(): string {
  if (onlineConnectionStatus.value === 'expired') return GAME_TEXT.room.expired
  if (onlineConnectionStatus.value === 'connecting') return GAME_TEXT.room.connecting
  if (onlineConnectionStatus.value === 'disconnected') return GAME_TEXT.room.disconnected
  if (!hasOnlineRoom.value) return GAME_TEXT.room.notJoined
  switch (onlineRoomStatus.value) {
    case 'WAITING':
      return GAME_TEXT.room.waitingReady
    case 'PLAYING':
      return getOnlineTurnStatusText()
    case 'FINISHED':
      return GAME_TEXT.room.finished
    case 'NOT_JOINED':
      return onlineSelfRoleText.value
  }
}

function getOnlineTurnStatusText(): string {
  const currentPlayer = state.value.currentPlayer
  if (!isPlayer(currentPlayer)) return GAME_TEXT.room.playing
  if (onlineSelfSide.value === X || onlineSelfSide.value === O) {
    return currentPlayer === onlineSelfSide.value ? GAME_TEXT.room.turnSelf : GAME_TEXT.room.turnOpponent
  }
  return currentPlayer === X ? GAME_TEXT.room.turnBlue : GAME_TEXT.room.turnRed
}

const onlineRoomDialogHint = computed(() => {
  if (isOnlineRoomsLoading.value) return '正在读取当前在线房间。'
  if (onlineRooms.value.length === 0) return '当前没有可加入的房间，建议创建一个新房间。'
  return '选择一个房间加入；对局中或已结束的房间会以观战身份进入。'
})

function getOnlineRoomListStatusText(room: OnlineRoomListItem): string {
  const statusText = room.roomStatus === 'WAITING'
    ? '等待中'
    : room.roomStatus === 'PLAYING'
      ? '对局中'
      : '已结束'
  return `${room.playerCount}/${room.maxPlayerCount} · ${statusText}`
}

function getRandomJoinRoomScore(room: OnlineRoomListItem): number {
  if (room.roomStatus === 'WAITING' && room.playable) return 0
  if (room.roomStatus === 'WAITING') return 1
  if (room.roomStatus === 'PLAYING') return 2
  return 3
}

function handleOnlineStatusClick(): void {
  if (settings.value.gameMode !== 'online') return
  if (!hasOnlineRoom.value) {
    editOnlineNickname()
    return
  }
  isOnlineMemberMenuOpen.value = !isOnlineMemberMenuOpen.value
}

function handleDocumentClick(event: MouseEvent): void {
  if (!isOnlineMemberMenuOpen.value) return
  const target = event.target
  if (!(target instanceof Element)) return
  if (target.closest('.utt-menu-control')) return
  isOnlineMemberMenuOpen.value = false
}

function handleLeaveOnlineRoomClick(): void {
  const message = onlineRoomStatus.value === 'PLAYING' && onlineSelfIsActivePlayer.value
    ? '离开房间会直接判负。确定要离开吗？'
    : '确定要离开当前房间吗？'
  if (!confirmLeaveOnlineRoom(message)) return
  leaveOnlineRoom(true)
  resetGameToReady()
}

function getOnlineMemberDisplayName(player: OnlinePlayerSnapshot): string {
  return getOnlinePlayerDisplayName(player)
}

function getOnlineMemberStatusText(player: OnlinePlayerSnapshot): string {
  const role = toOnlinePlayer(player.side)
  const roleText = role === X ? '蓝方' : role === O ? '红方' : '观战'
  const readyText = player.ready ? ' · 已准备' : ''
  const offlineText = player.connected ? '' : ' · 离线'
  return `${roleText}${readyText}${offlineText}`
}

function getOnlinePlayerDisplayName(player: OnlinePlayerSnapshot): string {
  if (player.self) return '你'
  const nickname = getOnlinePlayerNickname(player)
  if (shouldAppendOnlinePlayerNumber(player)) return `${nickname}${player.playerNumber}`
  return player.nickname
}

function shouldAppendOnlinePlayerNumber(player: OnlinePlayerSnapshot): boolean {
  const nickname = getOnlinePlayerNickname(player)
  if (!nickname || nickname === DEFAULT_ONLINE_NICKNAME) return true
  return onlinePlayers.value.filter((item) => item.nickname.trim() === nickname).length > 1
}

function getOnlinePlayerNickname(player: OnlinePlayerSnapshot): string {
  return player.nickname.trim() || DEFAULT_ONLINE_NICKNAME
}

function getOnlineMoveError(): string {
  if (onlineRoomStatus.value !== 'PLAYING') return '在线对局尚未开始'
  if (onlineSelfSide.value !== state.value.currentPlayer) return '还没轮到你落子'
  return '这里不能落子'
}

function createOnlineInviteLink(roomId: string): string {
  const url = new URL(window.location.href)
  url.searchParams.set('room', roomId)
  return url.toString()
}

function updateOnlineRoomUrl(roomId: string): void {
  if (typeof window === 'undefined') return
  window.history.replaceState(window.history.state, '', createOnlineInviteLink(roomId))
}

function clearOnlineRoomUrl(): void {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  url.searchParams.delete('room')
  window.history.replaceState(window.history.state, '', url.toString())
}

function normalizeOnlineRoomId(roomId: string): string {
  return roomId.trim().toUpperCase()
}

function loadOnlineNickname(): string {
  if (typeof window === 'undefined') return DEFAULT_ONLINE_NICKNAME
  return window.localStorage.getItem(ONLINE_NICKNAME_STORAGE_KEY)?.trim() || DEFAULT_ONLINE_NICKNAME
}

function loadHasCustomOnlineNickname(): boolean {
  if (typeof window === 'undefined') return false
  return Boolean(window.localStorage.getItem(ONLINE_NICKNAME_STORAGE_KEY)?.trim())
}

function shouldShowOnlineIntro(): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(ONLINE_INTRO_SHOWN_STORAGE_KEY) !== 'true'
}

function markOnlineIntroShown(): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(ONLINE_INTRO_SHOWN_STORAGE_KEY, 'true')
}

function saveOnlineNickname(nickname: string): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(ONLINE_NICKNAME_STORAGE_KEY, nickname)
  hasCustomOnlineNickname.value = true
}

function loadOnlineRoomToken(roomId: string): string {
  if (typeof window === 'undefined') return ''
  try {
    const raw = window.sessionStorage.getItem(ONLINE_SESSION_TOKENS_STORAGE_KEY)
    if (!raw) return ''
    const tokens = JSON.parse(raw) as Record<string, string>
    return typeof tokens[roomId] === 'string' ? tokens[roomId] : ''
  } catch {
    return ''
  }
}

function saveOnlineRoomToken(roomId: string, token: string): void {
  if (typeof window === 'undefined') return
  const tokens: Record<string, string> = {}
  try {
    Object.assign(tokens, JSON.parse(window.sessionStorage.getItem(ONLINE_SESSION_TOKENS_STORAGE_KEY) || '{}'))
  } catch {
    // 损坏的标签页 token 映射直接覆盖，避免影响新房间加入。
  }
  tokens[roomId] = token
  window.sessionStorage.setItem(ONLINE_SESSION_TOKENS_STORAGE_KEY, JSON.stringify(tokens))
}

function removeOnlineRoomToken(roomId: string): void {
  if (typeof window === 'undefined') return
  try {
    const tokens = JSON.parse(window.sessionStorage.getItem(ONLINE_SESSION_TOKENS_STORAGE_KEY) || '{}') as Record<string, string>
    delete tokens[roomId]
    window.sessionStorage.setItem(ONLINE_SESSION_TOKENS_STORAGE_KEY, JSON.stringify(tokens))
  } catch {
    window.sessionStorage.removeItem(ONLINE_SESSION_TOKENS_STORAGE_KEY)
  }
}

function handleTutorialDialogNext(): void {
  switch (tutorialState.value.step) {
    case 'welcome':
      showTutorialStep('boardIntro')
      return
    case 'boardIntro':
      showTutorialStep('controlGoal')
      return
    case 'controlGoal':
      showTutorialStep('victoryGoal')
      return
    case 'victoryGoal':
      showTutorialStep('practiceIntro')
      return
    case 'practiceIntro':
      showTutorialStep('previousMoveIntro')
      return
    case 'previousMoveIntro':
      showTutorialStep('limitIntro')
      return
    case 'limitIntro':
      beginTutorialInput(
        'awaitFirstMove',
        TUTORIAL_FIRST_MOVE_CELL_INDEXES.map((smallIndex) => ({
          bigIndex: TUTORIAL_OPENING_BOARD_INDEX,
          smallIndex
        })),
        true
      )
      return
    case 'afterFirstMove':
      runTutorialFirstAIMove()
      return
    case 'claimIntro':
      beginTutorialInput('awaitClaimMove', [{
        bigIndex: TUTORIAL_CLAIM_BOARD_INDEX,
        smallIndex: TUTORIAL_CLAIM_CELL_INDEX
      }], true)
      return
    case 'claimSuccess':
      showTutorialStep('lineRule')
      return
    case 'lineRule':
      runTutorialAIMove(TUTORIAL_AI_SEND_TO_CENTER_MOVE, () => showTutorialStep('centerMoveIntro'))
      return
    case 'centerMoveIntro':
      beginTutorialInput('awaitCenterMove', [{
        bigIndex: TUTORIAL_CENTER_BOARD_INDEX,
        smallIndex: TUTORIAL_CENTER_CELL_INDEX
      }], true)
      return
    case 'centerSuccess':
      showTutorialStep('centerRule')
      return
    case 'centerRule':
      showTutorialStep('freeMoveIntro')
      return
    case 'freeMoveIntro':
      runTutorialAIMove(TUTORIAL_AI_SEND_TO_SETTLEMENT_MOVE, () => {
        beginTutorialInput('settlementReady', [{
          bigIndex: TUTORIAL_SETTLEMENT_BOARD_INDEX,
          smallIndex: TUTORIAL_SETTLEMENT_CELL_INDEX
        }], true)
      })
      return
    case 'settlementReady':
      return
    case 'settlementIntro':
      showTutorialStep('settlementReward')
      return
    case 'settlementReward':
      showTutorialStep('settlementCurrent')
      return
    case 'settlementCurrent':
      showTutorialStep('drawSettlement')
      return
    case 'drawSettlement':
      showTutorialStep('fullTargetRule')
      return
    case 'fullTargetRule':
      showTutorialStep('done')
      return
    case 'done':
      finishTutorialNarration()
      return
    case 'awaitFirstMove':
    case 'awaitClaimMove':
    case 'awaitCenterMove':
      return
  }
}

function canPlayTutorialCell(bigIndex: number, smallIndex: number): boolean {
  if (!tutorialState.value.active) return true
  if (!tutorialState.value.inputEnabled) return false
  const allowedMoves = tutorialState.value.allowedMoves
  if (!allowedMoves) return true

  return allowedMoves.some((move) => move.bigIndex === bigIndex && move.smallIndex === smallIndex)
}

function getTutorialMoveRestrictionMessage(): string {
  return '请按指示落子。'
}

function handleTutorialMoveCompleted(movePlayer: Player, move: GameMove): void {
  if (!tutorialState.value.active || movePlayer !== X) return

  switch (tutorialState.value.step) {
    case 'awaitFirstMove':
      showTutorialStep('afterFirstMove')
      return
    case 'awaitClaimMove':
      showTutorialStep('claimSuccess')
      return
    case 'awaitCenterMove':
      showTutorialStep('centerSuccess')
      return
    case 'settlementReady':
      tutorialState.value = {
        ...tutorialState.value,
        inputEnabled: false,
        allowedMoves: null
      }
      clearTutorialTimer()
      tutorialTimer = window.setTimeout(() => {
        tutorialTimer = null
        showTutorialStep('settlementIntro')
      }, TUTORIAL_SETTLEMENT_DIALOG_DELAY_MS)
      return
    default:
      return
  }
}

function showTutorialStep(step: TutorialStep): void {
  tutorialState.value = {
    ...tutorialState.value,
    step,
    dialogOpen: true,
    inputEnabled: false,
    allowedMoves: null
  }
  appendTutorialStepMessage(step)
}

function beginTutorialInput(step: TutorialStep, allowedMoves: GameMove[] | null = null, keepDialog = false): void {
  tutorialState.value = {
    ...tutorialState.value,
    step,
    dialogOpen: keepDialog,
    inputEnabled: true,
    allowedMoves
  }
  appendTutorialStepMessage(step)
}

function appendTutorialStepMessage(step: TutorialStep): void {
  const dialog = createTutorialDialog(
    {
      ...tutorialState.value,
      step
    },
    state.value,
    getDisplayPlayerName
  )
  const lines = [
    dialog.title,
    ...dialog.lines.map((line) => line.map((part) => part.text).join(''))
  ].filter(Boolean)

  if (lines.length === 0) return
  state.value.messages.push({
    id: `tutorial-step-${step}-${Date.now()}-${state.value.messages.length}`,
    type: 'system',
    text: lines.join('\n')
  })
}

function runTutorialAIMove(move: GameMove, afterMove: () => void, delayMs = TUTORIAL_AI_MOVE_DELAY_MS): void {
  if (!canMove(state.value, move.bigIndex, move.smallIndex)) {
    setError('教程局面异常，请退出教程后重新进入')
    return
  }

  clearTutorialTimer()
  clearAIRequestTimer()
  clearAIDecisionApplyTimer()
  requestId += 1
  isThinking.value = true
  setError(`${getPlayerName(O, state.value)} 正在演示`)
  tutorialTimer = window.setTimeout(() => {
    tutorialTimer = null
    isThinking.value = false
    playMove(move)
    afterMove()
  }, delayMs)
}

function runTutorialFirstAIMove(delayMs = TUTORIAL_AI_MOVE_DELAY_MS): void {
  const targetBoard = getEffectiveNextBoard(state.value)
  if (targetBoard === null) {
    setError('教程局面异常，请退出教程后重新进入')
    return
  }

  runTutorialAIMove({
    bigIndex: targetBoard,
    smallIndex: TUTORIAL_AI_SEND_TO_CLAIM_CELL_INDEX
  }, () => showTutorialStep('claimIntro'), delayMs)
}

function finishTutorialNarration(): void {
  clearTutorialTimer()
  isThinking.value = false
  tutorialState.value = createInactiveTutorialState()
  settings.value = previousTutorialSettings.value ?? loadGameSettings()
  previousTutorialSettings.value = null
  resetGameToReady()
}

function exitTutorialWithConfirm(): void {
  if (state.value.winner === EMPTY) {
    const confirmed = window.confirm('真的要退出教程模式吗？\n对战进度不会保留。')
    if (!confirmed) return
  }

  clearTutorialTimer()
  clearAIRequestTimer()
  clearAIDecisionApplyTimer()
  isThinking.value = false
  tutorialState.value = createInactiveTutorialState()
  settings.value = previousTutorialSettings.value ?? loadGameSettings()
  previousTutorialSettings.value = null
  resetGameToReady()
}

function clearTutorialTimer(): void {
  if (tutorialTimer === null) return
  window.clearTimeout(tutorialTimer)
  tutorialTimer = null
}

function clearSettlementCueTimer(): void {
  if (settlementCueTimer === null) return
  window.clearTimeout(settlementCueTimer)
  settlementCueTimer = null
}

function handleMessageFocus(): void {
  state.value.errorMessage = ''
  state.value.isMessageInputFocused = true
  if (isMobileGameViewport()) return
  scrollMessageInputIntoView()
  window.setTimeout(scrollMessageInputIntoView, 280)
}

function handleMessageBlur(): void {
  state.value.isMessageInputFocused = false
}

function scrollMessageInputIntoView(): void {
  messageInputFormRef.value?.scrollIntoView({ block: 'end', behavior: 'smooth' })
}

function isMobileGameViewport(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
}

function handleSendMessage(): void {
  const text = messageDraft.value.trim()
  if (!text) return

  if (settings.value.gameMode === 'online') {
    if (!onlineClient.value || !onlineRoomId.value || !onlinePlayerToken.value) {
      setError('请先加入在线房间')
      return
    }
    onlineClient.value.chat(onlineRoomId.value, onlinePlayerToken.value, text)
    messageDraft.value = ''
    return
  }

  state.value.errorMessage = ''
  const sender = state.value.currentPlayer
  const message: GameMessage = {
    id: `chat-${Date.now()}-${state.value.messages.length}`,
    type: 'chat',
    sender,
    senderName: getPlayerName(sender, state.value),
    text: GAME_TEXT.record.chat(getPlayerName(sender, state.value), text)
  }
  state.value.messages.push(message)
  messageDraft.value = ''
}

function getMessageClass(message: GameMessage): Record<string, boolean> {
  const isGameRecord = isGameRecordMessage(message)
  return {
    'utt-log-message-system': message.type === 'system' && !isGameRecord,
    'utt-log-message-record': isGameRecord,
    'utt-log-message-chat': message.type === 'chat',
    'utt-log-message-blue': message.type === 'move' && message.player === X,
    'utt-log-message-red': message.type === 'move' && message.player === O
  }
}

function isGameRecordMessage(message: GameMessage): boolean {
  if (message.type === 'move') return true
  if (message.type !== 'system') return false

  return /下在|填满了|控制了|入口|自由落子|轮到|平局|赢下|占领了|投降|离开对局|落下第一步|本局游戏/.test(message.text)
}

function splitMessageLines(text: string): string[] {
  return text.split('\n')
}

function splitMessageLineParts(line: string, message: GameMessage): MessageLinePart[] {
  if (!shouldHighlightMessagePlayers(message)) {
    return [{ text: line, player: null }]
  }

  const parts: MessageLinePart[] = []
  const labels = getColoredPlayerLabels()
  if (labels.length === 0) return [{ text: line, player: null }]

  const pattern = new RegExp(labels.map((label) => escapeRegExp(label.text)).join('|'), 'g')
  let lastIndex = 0

  for (const match of line.matchAll(pattern)) {
    if (match.index === undefined) continue
    if (match.index > lastIndex) {
      parts.push({
        text: line.slice(lastIndex, match.index),
        player: null
      })
    }

    parts.push({
      text: match[0],
      player: labels.find((label) => label.text === match[0])?.player ?? null
    })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < line.length) {
    parts.push({
      text: line.slice(lastIndex),
      player: null
    })
  }

  return parts.length > 0 ? parts : [{ text: line, player: null }]
}

function shouldHighlightMessagePlayers(message: GameMessage): boolean {
  return message.type === 'move' || isGameRecordMessage(message)
}

function getColoredPlayerLabels(): MessageLinePart[] {
  const labels: MessageLinePart[] = [
    { text: GAME_TEXT.player.defaultName(X), player: X },
    { text: GAME_TEXT.player.defaultName(O), player: O }
  ]
  for (const player of onlinePlayers.value) {
    const side = toOnlinePlayer(player.side)
    if (!side) continue
    labels.push({ text: getOnlinePlayerDisplayName(player), player: side })
  }

  return labels
    .filter((label, index, list) => list.findIndex((item) => item.text === label.text) === index)
    .sort((left, right) => right.text.length - left.text.length)
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function getPlayerTextClass(player: Player | null): string {
  if (player === X) return 'utt-player-text-blue'
  if (player === O) return 'utt-player-text-red'

  return ''
}

function createMoveMessages(nextState: GameCoreState, movePlayer: Player, move: GameMove, reportId: number): GameMessage[] {
  const playerName = getPlayerName(movePlayer, nextState)
  const directEvent = nextState.lastRuleEvents.find((event) => event.boardIndex === move.bigIndex)
  const moveLines = [
    GAME_TEXT.record.move(playerName, formatBigBoardIndex(move.bigIndex), formatMoveCellText(move.smallIndex))
  ]

  if (directEvent) {
    moveLines.push(GAME_TEXT.record.filledBoard(formatBigBoardIndex(directEvent.boardIndex)))
  }

  const messages: GameMessage[] = [
    {
      id: `move-${Date.now()}-${reportId}`,
      type: 'move',
      player: movePlayer,
      reportId,
      text: moveLines.join('\n')
    }
  ]

  if (nextState.lastRuleEvents.length > 0) {
    const systemLines: string[] = []
    const mainEvent = nextState.lastRuleEvents[0]

    if (mainEvent.owner === DRAW) {
      systemLines.push(GAME_TEXT.record.drawBoard(formatBigBoardIndex(mainEvent.boardIndex)))
    } else if (isPlayer(mainEvent.owner)) {
      systemLines.push(GAME_TEXT.record.settlement(
        getPlayerName(mainEvent.owner, nextState),
        formatBigBoardIndex(mainEvent.boardIndex),
        mainEvent.filledCount
      ))
      systemLines.push('')
      systemLines.push(GAME_TEXT.record.settlementNext(getPlayerName(getOpponent(mainEvent.owner), nextState)))
    }

    if (nextState.lastRuleEvents.length > 1) {
      systemLines.push(GAME_TEXT.record.chainSettlement(nextState.lastRuleEvents.length - 1))
    }

    if (isPlayer(nextState.winner) || nextState.winner === DRAW) {
      appendResultOrNextTurn(systemLines, nextState)
    } else if (mainEvent.owner === DRAW) {
      appendNextTurn(systemLines, nextState)
    }
    messages.push({
      id: `system-${Date.now()}-${reportId}`,
      type: 'system',
      reportId,
      text: systemLines.join('\n')
    })
    return messages
  }

  appendResultOrNextTurn(moveLines, nextState)
  messages[0].text = moveLines.join('\n')
  return messages
}

function appendResultOrNextTurn(lines: string[], nextState: GameCoreState): void {
  if (isPlayer(nextState.winner)) {
    const lineText = nextState.bigBoardWinningLine?.length
      ? formatBoardList(nextState.bigBoardWinningLine)
      : ''
    lines.push(lineText
      ? GAME_TEXT.record.lineWinner(getPlayerName(nextState.winner, nextState), lineText)
      : GAME_TEXT.record.winner(getPlayerName(nextState.winner, nextState)))
  } else if (nextState.winner === DRAW) {
    lines.push(GAME_TEXT.record.gameDraw())
  } else {
    appendNextTurn(lines, nextState)
  }
}

function appendNextTurn(lines: string[], nextState: GameCoreState): void {
  if (nextState.nextBoard === null) {
    lines.push(GAME_TEXT.record.nextFree(getPlayerName(nextState.currentPlayer, nextState)))
  } else {
    lines.push(GAME_TEXT.record.nextBoard(getPlayerName(nextState.currentPlayer, nextState), formatBigBoardIndex(nextState.nextBoard)))
  }
}

function formatMoveCellText(smallIndex: number): string {
  return GAME_TEXT.board.smallCell(smallIndex)
}

function setError(message: string): void {
  state.value.errorMessage = message
  state.value.isMessageInputFocused = false
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
  --utt-indicator-color: #12500b;
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
  --utt-board-bg: #cbd2dc;
  --utt-small-board-bg: #e3e7ed;
  --utt-small-board-border: #aab4c2;
  --utt-cell-bg: #fafafa;
  --utt-cell-text: #1f2933;
  --utt-disabled-board-opacity: 0.38;
  --utt-disabled-board-filter: saturate(0.55) brightness(0.88);

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
  touch-action: none;
}

.utt-board-closed {
  filter: none;
}

.utt-board-tutorial-clickable {
  cursor: pointer;
}

:root.dark .utt-board {
  --utt-indicator-mask: rgba(255, 255, 255, 0.1);
  --utt-board-bg: color-mix(in srgb, var(--vp-c-bg) 66%, #303030);
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
  opacity: var(--utt-disabled-board-opacity);
  filter: var(--utt-disabled-board-filter);
}

.utt-small-board-last-move {
  opacity: 0.72;
  filter: saturate(0.78) brightness(0.94);
}

.utt-small-board-active {
  border-color: color-mix(in srgb, var(--utt-small-board-border) 56%, var(--vp-c-text-1));
  background: color-mix(in srgb, var(--utt-small-board-bg) 82%, var(--vp-c-bg) 18%);
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--vp-c-text-1) 14%, transparent),
    0 0 0 1px color-mix(in srgb, var(--vp-c-text-1) 8%, transparent);
}

.utt-small-board-active.utt-small-board-last-move,
.utt-small-board-settled.utt-small-board-last-move,
.utt-small-board-big-win.utt-small-board-last-move {
  opacity: 1;
  filter: none;
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

.utt-board:not(.utt-board-closed) .utt-small-board-settled {
  z-index: 3;
  opacity: 1;
  filter: none;
}

.utt-small-board-settled {
  animation: utt-settled-board-pulse 1.9s var(--lc-motion-ease-emphasis, cubic-bezier(0.22, 1, 0.36, 1)) both;
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

.utt-preview-hint {
  position: absolute;
  z-index: 10;
  width: max-content;
  max-width: min(280px, calc(100vw - 64px));
  padding: 5px 8px;
  border: 1px solid color-mix(in srgb, var(--utt-indicator-color) 42%, var(--vp-c-divider));
  background: color-mix(in srgb, var(--vp-c-bg) 88%, transparent);
  color: var(--vp-c-text-1);
  font-size: 12px;
  line-height: 1.35;
  text-align: center;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.16);
  pointer-events: none;
  transform: var(--utt-preview-hint-transform, translate(-50%, -100%));
  animation: utt-preview-hint-in 0.2s var(--lc-motion-ease-emphasis, cubic-bezier(0.22, 1, 0.36, 1)) both;
}

.utt-preview-hint-line {
  display: block;
}

.utt-preview-hint-line + .utt-preview-hint-line {
  margin-top: 3px;
}

.utt-tutorial-prompt {
  --utt-tutorial-board-size: calc((100% - var(--utt-board-padding) - var(--utt-board-padding) - var(--utt-board-gap) - var(--utt-board-gap)) / 3);

  position: absolute;
  left: 50%;
  bottom: 12px;
  z-index: 11;
  width: min(360px, calc(100% - 28px));
  padding: 5px 8px 6px;
  border: 1px solid color-mix(in srgb, var(--vp-c-divider) 72%, var(--vp-c-text-1));
  background: color-mix(in srgb, var(--vp-c-bg) 92%, transparent);
  color: var(--vp-c-text-2);
  cursor: pointer;
  font-size: 12px;
  line-height: 1.04;
  text-align: left;
  user-select: none;
  -webkit-user-select: none;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.16);
  transform: translateX(-50%);
}

.utt-tutorial-prompt-top {
  top: 12px;
  bottom: auto;
}

.utt-tutorial-prompt-after-top-board {
  top: calc(var(--utt-board-padding) + var(--utt-tutorial-board-size) + 8px);
  bottom: auto;
}

.utt-tutorial-prompt-near-center-board {
  top: calc(var(--utt-board-padding) + var(--utt-tutorial-board-size) + var(--utt-board-gap) + var(--utt-tutorial-board-size) + var(--utt-board-gap) - 8px);
  bottom: auto;
  transform: translate(-50%, -100%);
}

.utt-tutorial-prompt-below-middle-row {
  top: calc(var(--utt-board-padding) + var(--utt-tutorial-board-size) + var(--utt-board-gap) + var(--utt-tutorial-board-size) + 8px);
  bottom: auto;
}

.utt-tutorial-prompt:focus-visible {
  outline: 2px solid #1d4fb8;
  outline-offset: 2px;
}

.utt-tutorial-prompt-title {
  margin-bottom: 1px;
  color: var(--vp-c-text-1);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.04;
}

.utt-tutorial-prompt-line {
  display: block;
  margin: 0;
  line-height: 1.3;
}

.utt-tutorial-prompt-action {
  margin-top: 1px;
  color: #1d4fb8;
  font-size: 12px;
  line-height: 1.04;
  text-align: right;
}

.utt-settlement-cue {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 12;
  display: inline-flex;
  width: max-content;
  max-width: calc(100% - 28px);
  flex-direction: column;
  align-items: center;
  gap: 6px;
  pointer-events: none;
  transform: translate(-50%, -50%);
}

.utt-settlement-cue-title {
  color: var(--vp-c-text-1);
  font-size: clamp(46px, 9.6vw, 92px);
  font-style: italic;
  font-weight: 900;
  line-height: 0.92;
  letter-spacing: 0.07em;
  text-shadow:
    1px 0 0 var(--vp-c-bg),
    -1px 0 0 var(--vp-c-bg),
    0 1px 0 var(--vp-c-bg),
    0 -1px 0 var(--vp-c-bg),
    1px 1px 0 var(--vp-c-bg),
    -1px 1px 0 var(--vp-c-bg),
    1px -1px 0 var(--vp-c-bg),
    -1px -1px 0 var(--vp-c-bg),
    0 6px 16px rgba(15, 23, 42, 0.2);
}

.utt-settlement-cue-title.utt-player-text-blue {
  color: #2563eb;
}

.utt-settlement-cue-title.utt-player-text-red {
  color: #dc2626;
}

.utt-settlement-cue-subtitle {
  color: var(--vp-c-text-2);
  font-size: clamp(11px, 1.9vw, 14px);
  font-weight: 400;
  line-height: 1.4;
  text-align: center;
  text-shadow:
    1px 0 0 var(--vp-c-bg),
    -1px 0 0 var(--vp-c-bg),
    0 1px 0 var(--vp-c-bg),
    0 -1px 0 var(--vp-c-bg),
    0 6px 16px rgba(15, 23, 42, 0.24);
  white-space: nowrap;
}

.utt-settlement-cue-enter-active,
.utt-settlement-cue-leave-active {
  transition:
    opacity 0.42s var(--lc-motion-ease-emphasis, cubic-bezier(0.22, 1, 0.36, 1)),
    transform 0.42s var(--lc-motion-ease-emphasis, cubic-bezier(0.22, 1, 0.36, 1));
}

.utt-settlement-cue-enter-from {
  opacity: 0;
  transform: translate(-50%, -50%) scale(1.16);
}

.utt-settlement-cue-enter-to,
.utt-settlement-cue-leave-from {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}

.utt-settlement-cue-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(1.12);
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

@keyframes utt-preview-hint-in {
  from {
    opacity: 0;
    transform: var(--utt-preview-hint-from-transform, translate(-50%, calc(-100% - 6px)));
  }

  to {
    opacity: 1;
    transform: var(--utt-preview-hint-transform, translate(-50%, -100%));
  }
}

.utt-small-board-big-win {
  opacity: 1;
  filter: none;
}

.utt-board-closed .utt-small-board:not(.utt-small-board-big-win) {
  opacity: var(--utt-disabled-board-opacity);
  filter: var(--utt-disabled-board-filter);
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

.utt-cell-tutorial-target,
.utt-cell-tutorial-target.utt-cell-disabled:hover {
  background: color-mix(in srgb, var(--utt-claim-x-color) 16%, var(--utt-cell-bg));
  box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--utt-claim-x-color) 72%, transparent);
  animation: utt-tutorial-target-pulse 2s ease-in-out infinite;
}

:root.dark .utt-hoverable-x:hover {
  background: rgba(37, 99, 235, 0.18);
}

:root.dark .utt-hoverable-o:hover {
  background: rgba(220, 38, 38, 0.18);
}

:root.dark .utt-cell-tutorial-target,
:root.dark .utt-cell-tutorial-target.utt-cell-disabled:hover {
  background: color-mix(in srgb, var(--utt-claim-x-color) 24%, var(--utt-cell-bg));
}

.utt-cell-preview-reward-x,
.utt-cell-preview-reward-x.utt-cell-disabled:hover {
  --utt-preview-reward-bg: var(--utt-cell-bg);
  --utt-preview-reward-bg-strong: color-mix(in srgb, var(--utt-claim-x-color) 24%, var(--utt-cell-bg));
  background: var(--utt-preview-reward-bg);
  animation: utt-preview-reward-cell 1.8s ease-in-out infinite;
}

.utt-cell-preview-reward-o,
.utt-cell-preview-reward-o.utt-cell-disabled:hover {
  --utt-preview-reward-bg: var(--utt-cell-bg);
  --utt-preview-reward-bg-strong: color-mix(in srgb, var(--utt-claim-o-color) 24%, var(--utt-cell-bg));
  background: var(--utt-preview-reward-bg);
  animation: utt-preview-reward-cell 1.8s ease-in-out infinite;
}

:root.dark .utt-cell-preview-reward-x,
:root.dark .utt-cell-preview-reward-x.utt-cell-disabled:hover {
  --utt-preview-reward-bg: var(--utt-cell-bg);
  --utt-preview-reward-bg-strong: color-mix(in srgb, var(--utt-claim-x-color) 30%, var(--utt-cell-bg));
  background: var(--utt-preview-reward-bg);
}

:root.dark .utt-cell-preview-reward-o,
:root.dark .utt-cell-preview-reward-o.utt-cell-disabled:hover {
  --utt-preview-reward-bg: var(--utt-cell-bg);
  --utt-preview-reward-bg-strong: color-mix(in srgb, var(--utt-claim-o-color) 30%, var(--utt-cell-bg));
  background: var(--utt-preview-reward-bg);
}

.utt-cell-x {
  --utt-auto-mark-color: #2563eb;
  color: #2563eb;
}

.utt-cell-o {
  --utt-auto-mark-color: #dc2626;
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
  animation: utt-auto-fill-dot 0.5s ease both;
  animation-delay: var(--utt-auto-fill-delay, 0ms);
}

.utt-cell-last-turn-auto {
  animation: utt-auto-fill-cell 0.78s var(--lc-motion-ease-standard, cubic-bezier(0.22, 1, 0.36, 1)) both;
  animation-delay: var(--utt-auto-fill-delay, 0ms);
}

@keyframes utt-auto-fill-cell {
  0%,
  45% {
    color: transparent;
    transform: scale(0.92);
    box-shadow: inset 0 0 0 2px transparent;
  }

  72% {
    color: transparent;
    transform: scale(1.05);
    box-shadow: inset 0 0 0 2px var(--utt-indicator-color);
  }

  100% {
    color: var(--utt-auto-mark-color);
    transform: scale(1);
    box-shadow: inset 0 0 0 0 transparent;
  }
}

@keyframes utt-auto-fill-dot {
  0%,
  58% {
    opacity: 0;
    transform: scale(0.2);
  }

  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes utt-preview-reward-cell {
  0%,
  100% {
    background: var(--utt-preview-reward-bg);
  }

  50% {
    background: var(--utt-preview-reward-bg-strong);
  }
}

@keyframes utt-tutorial-target-pulse {
  0%,
  100% {
    box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--utt-claim-x-color) 58%, transparent);
  }

  50% {
    box-shadow: inset 0 0 0 3px color-mix(in srgb, var(--utt-claim-x-color) 92%, transparent);
  }
}

@keyframes utt-settled-board-pulse {
  0% {
    box-shadow:
      0 0 0 0 color-mix(in srgb, var(--utt-claim-color, #d97706) 36%, transparent),
      inset 0 0 0 1px color-mix(in srgb, var(--utt-claim-color, #d97706) 28%, transparent);
    transform: scale(0.985);
  }

  42% {
    box-shadow:
      0 0 0 7px color-mix(in srgb, var(--utt-claim-color, #d97706) 20%, transparent),
      inset 0 0 0 2px color-mix(in srgb, var(--utt-claim-color, #d97706) 44%, transparent);
    transform: scale(1.018);
  }

  100% {
    transform: scale(1);
  }
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
  position: relative;
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

.utt-turn-button {
  width: 120px;
  height: 36px;
  padding: 0 8px;
  border: 0;
  border-left: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  font-size: 14px;
  text-align: left;
  cursor: default;
}

.utt-turn-button:not(:disabled) {
  cursor: pointer;
}

.utt-turn-button-x {
  color: #2563eb;
}

.utt-turn-button-o {
  color: #dc2626;
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
  background: color-mix(in srgb, var(--vp-c-bg-soft) 82%, var(--vp-c-text-1) 6%);
}

.utt-menu-button:disabled {
  cursor: default;
  opacity: 0.72;
}

.utt-menu-button:disabled:hover {
  background: transparent;
}

.utt-menu-button-danger {
  border-color: #9f1d1d;
  color: #9f1d1d;
}

.utt-menu-button-primary {
  border-color: #1d4fb8;
  color: #1d4fb8;
}

.utt-menu-button-danger:hover {
  background: rgba(220, 38, 38, 0.08);
}

.utt-menu-button-primary:hover {
  background: rgba(37, 99, 235, 0.08);
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
  margin-bottom: 3px;
  padding: 0 4px;
  background: transparent;
  color: var(--vp-c-text-1);
  font-size: 13px;
  line-height: 1.34;
  text-align: left;
  white-space: pre-line;
}

.utt-log-message-system {
  align-self: center;
  max-width: 92%;
  margin: 4px 0;
  padding: 0 8px;
  background: transparent;
  color: var(--vp-c-text-3);
  font-size: 12px;
  line-height: 1.34;
  text-align: center;
}

.utt-log-message-record {
  align-self: stretch;
  width: 100%;
  margin-bottom: 0;
  padding: 2px 8px;
  border-left: 4px solid transparent;
  background: var(--vp-c-bg-soft);
  line-height: 1.34;
  text-align: left;
}

.utt-log-message-record + .utt-log-message-record {
  margin-top: -3px;
}

.utt-log-message-chat {
  align-self: stretch;
  margin-bottom: 1px;
  padding: 0 2px;
  background: transparent;
  color: var(--vp-c-text-1);
  line-height: 1.34;
}

.utt-log-message-blue {
  border-left-color: #2563eb;
}

.utt-log-message-red {
  border-left-color: #dc2626;
}

.utt-log-line {
  display: block;
}

.utt-log-line:empty {
  min-height: 1px;
}

.utt-online-member-menu {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 6px);
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.18);
}

.utt-online-member-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: var(--vp-c-text-2);
  font-size: 12px;
  line-height: 1.25;
}

.utt-online-member-row span:first-child {
  color: var(--vp-c-text-1);
}

.utt-online-leave-button {
  height: 30px;
  margin-top: 4px;
  border: 1px solid #9f1d1d;
  background: transparent;
  color: #9f1d1d;
  cursor: pointer;
  font-size: 12px;
}

.utt-player-text-blue {
  color: #2563eb;
}

.utt-player-text-red {
  color: #dc2626;
}

.utt-message-input {
  flex: 0 0 auto;
  display: flex;
  gap: 6px;
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid var(--vp-c-divider);
}

.utt-message-field {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  height: 38px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
}

.utt-message-field-error {
  padding: 0 10px;
}

.utt-message-field-hint {
  flex: 1;
  min-width: 0;
  color: #dc2626;
  font-size: 14px;
  line-height: 36px;
  overflow: hidden;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.utt-message-user-line {
  flex: 0 1 auto;
  max-width: 42%;
  height: 100%;
  padding: 0 0 0 10px;
  border: 0;
  background: transparent;
  color: var(--vp-c-text-2);
  font-size: 14px;
  line-height: 36px;
  overflow: hidden;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.utt-message-user-line-clickable {
  cursor: pointer;
}

.utt-message-input input {
  flex: 1;
  min-width: 0;
  height: 100%;
  padding: 0 10px 0 4px;
  border: 0;
  background: transparent;
  color: var(--vp-c-text-1);
  font-size: 14px;
}

.utt-message-input input:focus {
  outline: 0;
}

.utt-message-send-button {
  flex: 0 0 auto;
  height: 38px;
  padding: 0 16px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  font-size: 14px;
  cursor: pointer;
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
  overscroll-behavior: contain;
}

.utt-rules-card {
  display: flex;
  width: min(560px, 100%);
  max-height: min(720px, 90vh);
  box-sizing: border-box;
  flex-direction: column;
  padding: 22px;
  overflow: hidden;
  background: var(--vp-c-bg);
  border: 2px solid var(--vp-c-text-1);
}

.utt-online-room-card {
  gap: 14px;
}

.utt-online-room-header h2 {
  margin: 0 0 6px;
  color: var(--vp-c-text-1);
  font-size: 20px;
  line-height: 1.2;
}

.utt-online-room-header p,
.utt-online-room-empty {
  margin: 0;
  color: var(--vp-c-text-2);
  font-size: 13px;
  line-height: 1.35;
}

.utt-online-room-list {
  display: flex;
  min-height: 120px;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
}

.utt-online-room-item {
  display: flex;
  min-height: 38px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 10px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  cursor: pointer;
  font-size: 13px;
  text-align: left;
}

.utt-online-room-item:disabled {
  cursor: not-allowed;
  opacity: 0.52;
}

.utt-rules-content {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-right: 2px;
}

.utt-rules-content :deep(h1),
.utt-rules-content :deep(h2),
.utt-rules-content :deep(h3) {
  margin: 0 0 14px;
  font-size: 20px;
  line-height: 1.35;
}

.utt-rules-content :deep(h2) {
  margin-top: 20px;
  font-size: 17px;
}

.utt-rules-content :deep(h3) {
  margin-top: 16px;
  font-size: 15px;
}

.utt-rules-content :deep(p),
.utt-rules-content :deep(li) {
  margin: 0 0 12px;
  color: var(--vp-c-text-2);
  font-size: 14px;
  line-height: 1.7;
  text-align: left;
}

.utt-rules-content :deep(ul) {
  margin: 0 0 14px;
  padding-left: 20px;
}

.utt-rules-content :deep(strong) {
  color: var(--vp-c-text-1);
}

.utt-rules-content :deep(code) {
  padding: 2px 5px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  font-size: 13px;
}

.utt-rules-content :deep(a) {
  color: #2563eb;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.utt-rules-content :deep(img) {
  display: block;
  max-width: 100%;
  max-height: 280px;
  margin: 12px auto 16px;
  border: 1px solid var(--vp-c-divider);
  object-fit: contain;
}

.utt-rules-actions {
  display: grid;
  flex: 0 0 auto;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
}

.utt-rules-actions .utt-menu-button {
  margin-bottom: 0;
  justify-content: center;
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

  .utt-rules-dialog {
    align-items: stretch;
    padding: 0;
  }

  .utt-rules-card {
    width: 100%;
    height: 100dvh;
    max-height: 100dvh;
    min-height: 0;
    padding: 18px 16px calc(14px + env(safe-area-inset-bottom));
    border: 0;
  }

  .utt-rules-actions {
    margin-top: 10px;
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
    min-width: 0;
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
    box-sizing: border-box;
    width: 100%;
    height: 40px;
    padding: 0 6px;
    border: 1px solid var(--vp-c-divider);
    background: var(--vp-c-bg-soft);
    font-size: 13px;
    text-align: center;
    white-space: nowrap;
  }

  .utt-turn-button {
    box-sizing: border-box;
    width: 100%;
    height: 40px;
    border: 1px solid var(--vp-c-divider);
    background: var(--vp-c-bg-soft);
    font-size: 13px;
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .utt-menu-button {
    min-width: 0;
    min-height: 40px;
    justify-content: center;
    margin: 0;
    padding: 0 6px;
    font-size: 13px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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
    z-index: 12;
    margin-top: 6px;
    padding-top: 6px;
    padding-bottom: max(0px, env(safe-area-inset-bottom));
    background: var(--vp-c-bg);
    scroll-margin-bottom: max(24px, env(safe-area-inset-bottom));
  }

  .utt-message-field,
  .utt-message-send-button {
    height: 40px;
  }

  .utt-message-user-line {
    line-height: 38px;
  }

  .utt-message-field-hint {
    line-height: 38px;
  }
}
</style>
