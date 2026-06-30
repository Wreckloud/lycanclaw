import { formatBigBoardIndex, formatSmallCellPosition, getEffectiveNextBoard, getOpponent, isPlayer } from './rules'
import {
  TUTORIAL_CLAIM_CELL_INDEX,
  TUTORIAL_CLAIM_BOARD_INDEX,
  TUTORIAL_SETTLEMENT_BOARD_INDEX
} from './tutorial'
import { O, X, type GameCoreState, type GameMove, type Player } from './types'

export interface MessageLinePart {
  text: string
  player: Player | null
}

export type TutorialStep =
  | 'welcome'
  | 'boardIntro'
  | 'controlGoal'
  | 'victoryGoal'
  | 'practiceIntro'
  | 'previousMoveIntro'
  | 'limitIntro'
  | 'awaitFirstMove'
  | 'afterFirstMove'
  | 'claimIntro'
  | 'awaitClaimMove'
  | 'claimSuccess'
  | 'lineRule'
  | 'centerMoveIntro'
  | 'awaitCenterMove'
  | 'centerSuccess'
  | 'centerRule'
  | 'freeMoveIntro'
  | 'settlementReady'
  | 'settlementIntro'
  | 'settlementReward'
  | 'settlementCurrent'
  | 'drawSettlement'
  | 'fullTargetRule'
  | 'done'

export interface TutorialState {
  active: boolean
  step: TutorialStep
  dialogOpen: boolean
  inputEnabled: boolean
  realAiEnabled: boolean
  allowedMoves: GameMove[] | null
}

export interface TutorialDialog {
  title: string
  lines: MessageLinePart[][]
  buttonText: string
}

type PlayerNameResolver = (player: Player, currentState: GameCoreState) => string

export function createInactiveTutorialState(): TutorialState {
  return {
    active: false,
    step: 'welcome',
    dialogOpen: false,
    inputEnabled: false,
    realAiEnabled: false,
    allowedMoves: null
  }
}

export function createTutorialDialog(
  tutorial: TutorialState,
  currentState: GameCoreState,
  resolvePlayerName: PlayerNameResolver
): TutorialDialog {
  const settlementEvent = currentState.lastRuleEvents[0]
  const settlementOwner = settlementEvent && isPlayer(settlementEvent.owner) ? settlementEvent.owner : X
  const settlementOpponent = getOpponent(settlementOwner)
  const nextBoard = getEffectiveNextBoard(currentState)

  switch (tutorial.step) {
    case 'welcome':
      return {
        title: '教学模式',
        lines: [
          line(textPart('欢迎！先来点关于九宫叠阵的介绍：'))
        ],
        buttonText: '继续'
      }
    case 'boardIntro':
      return {
        title: '',
        lines: [
          line(textPart('如你所见，九宫叠阵由 9 格小棋盘组成，每个小棋盘都是一个 3x3 的井字棋。'))
        ],
        buttonText: '继续'
      }
    case 'controlGoal':
      return {
        title: '',
        lines: [
          line(textPart('获胜规则也类似于井字棋：只需要先在小棋盘上完成三连，就能控制小棋盘。'))
        ],
        buttonText: '继续'
      }
    case 'victoryGoal':
      return {
        title: '',
        lines: [
          line(textPart('接着再让控制的小棋盘在大棋盘上完成三连，就能获得最终胜利。'))
        ],
        buttonText: '继续'
      }
    case 'practiceIntro':
      return {
        title: '',
        lines: [
          line(textPart('这么说可能有点复杂，我们动手试试！'))
        ],
        buttonText: '继续'
      }
    case 'previousMoveIntro':
      return {
        title: '落子限制',
        lines: [
          line(textPart('由于上一步对手的行动，将棋子落在了 5号 棋盘的右下角。'))
        ],
        buttonText: '继续'
      }
    case 'limitIntro':
      return {
        title: '',
        lines: [
          line(textPart('因此，我们只能在大棋盘对应的右下角小棋盘落子。'))
        ],
        buttonText: '继续'
      }
    case 'awaitFirstMove':
      return {
        title: '',
        lines: [
          line(textPart('尝试在这里落子吧！'))
        ],
        buttonText: '落子继续'
      }
    case 'afterFirstMove':
      return {
        title: '',
        lines: [
          line(textPart(`就是这样！你的上一步行动也限制了对手只能在 ${nextBoard === null ? '任意棋盘' : `${formatBigBoardIndex(nextBoard)} 棋盘`} 落子。`))
        ],
        buttonText: '让电脑落子'
      }
    case 'claimIntro':
      return {
        title: '',
        lines: [
          line(textPart(`对手落在了正上方，同理，我们只能去 ${formatBigBoardIndex(TUTORIAL_CLAIM_BOARD_INDEX)} 棋盘落子。`))
        ],
        buttonText: '继续'
      }
    case 'awaitClaimMove':
      return {
        title: '',
        lines: [
          line(textPart(`只差一步了。请落在 ${formatSmallCellPosition(TUTORIAL_CLAIM_CELL_INDEX)}，完成这个小棋盘的三连。`))
        ],
        buttonText: '落子继续'
      }
    case 'claimSuccess':
      return {
        title: '控制棋盘',
        lines: [
          line(textPart('真厉害！我们拿下了 '), playerPart(`${formatBigBoardIndex(TUTORIAL_CLAIM_BOARD_INDEX)} 棋盘`, X), textPart(' 的控制权。'))
        ],
        buttonText: '继续'
      }
    case 'lineRule':
      return {
        title: '整局胜利条件',
        lines: [
          line(textPart('只要拥有控制权的棋盘，在大棋盘上也连成三连，就能赢得整局胜利。'))
        ],
        buttonText: '让电脑落子'
      }
    case 'centerMoveIntro':
      return {
        title: '',
        lines: [
          line(textPart('对手落在七号棋盘的正下方，轮到你在大棋盘正下方的棋盘落子。'))
        ],
        buttonText: '继续'
      }
    case 'awaitCenterMove':
      return {
        title: '',
        lines: [
          line(textPart('尝试落在八号棋盘的中心，拿下第二个小棋盘的控制权吧！'))
        ],
        buttonText: '落子继续'
      }
    case 'centerSuccess':
      return {
        title: '',
        lines: [
          line(textPart('不过这里需要注意，落在小棋盘正中间，会让下回合对手可以任意落子。'))
        ],
        buttonText: '继续'
      }
    case 'centerRule':
      return {
        title: '',
        lines: [
          line(textPart('因为传统井字棋中间位置有一定优势，所以增加了这个规则削弱中间优势。'))
        ],
        buttonText: '继续'
      }
    case 'freeMoveIntro':
      return {
        title: '',
        lines: [
          line(textPart('轮到对手任意落子。'))
        ],
        buttonText: '继续'
      }
    case 'settlementReady':
      return {
        title: '满盘结算',
        lines: [
          line(textPart('拿下控制权的棋盘仍可落子，尝试占满这个小棋盘吧！'))
        ],
        buttonText: '落子继续'
      }
    case 'settlementIntro':
      return {
        title: '',
        lines: [
          line(textPart('触发满盘结算了！当棋盘被填满时，会触发满盘结算。'))
        ],
        buttonText: '继续'
      }
    case 'settlementReward':
      return {
        title: '入口奖励',
        lines: [
          line(textPart('如果满格的小棋盘有控制者，控制者会获得入口奖励：所有通向该小棋盘的空入口，都会自动填入控制者的棋子。'))
        ],
        buttonText: '继续'
      }
    case 'settlementCurrent':
      return {
        title: '',
        lines: [
          line(
            textPart('正左方的小棋盘被 '),
            playerPart(resolvePlayerName(settlementOwner, currentState), settlementOwner),
            textPart(' 占领，因此所有小棋盘的正左方此时还空着，就会被填上你的棋子。')
          ),
          line(textPart('为了弥补棋子数量的优势，会重置回合，让 '), playerPart(resolvePlayerName(settlementOpponent, currentState), settlementOpponent), textPart(' 获得自由落子的能力，这一点需要注意。'))
        ],
        buttonText: '继续'
      }
    case 'drawSettlement':
      return {
        title: '',
        lines: [
          line(textPart('如果小棋盘满格但无人控制，则不触发入口奖励。'))
        ],
        buttonText: '继续'
      }
    case 'fullTargetRule':
      return {
        title: '',
        lines: [
          line(textPart('极端情况下，平局小棋盘会导致下一步要去的棋盘已被填满。')),
          line(textPart('这个时候也会让对手获得自由落子。'))
        ],
        buttonText: '继续'
      }
    case 'done':
      return {
        title: '',
        lines: [
          line(textPart(isPlayer(currentState.winner) ? '恭喜，你已经通过满盘结算赢下这局教学。' : '以上，就是游戏的全部规则。')),
          line(textPart('点击后会退出教学模式，你可以重新开一局正式练习。'))
        ],
        buttonText: '完成教程'
      }
  }
}

function line(...parts: MessageLinePart[]): MessageLinePart[] {
  return parts
}

function textPart(text: string): MessageLinePart {
  return {
    text,
    player: null
  }
}

function playerPart(text: string, player: Player): MessageLinePart {
  return {
    text,
    player
  }
}
