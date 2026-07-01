import { DRAW, O, X, type AIDifficulty, type BoardResult, type GameMode, type Player } from './types'

export const GAME_TEXT = {
  player: {
    sideName(player: Player): string {
      return player === X ? '蓝方' : '红方'
    },
    defaultName(player: Player): string {
      return player === X ? '蓝方 X' : '红方 O'
    },
    mark(value: BoardResult): string {
      if (value === X) return 'X'
      if (value === O) return 'O'
      if (value === DRAW) return '—'

      return ''
    }
  },
  settings: {
    difficultyName(difficulty: AIDifficulty): string {
      switch (difficulty) {
        case 'easy':
          return '简单'
        case 'normal':
          return '普通'
        case 'hard':
          return '困难'
        case 'nightmare':
          return '噩梦'
      }
    },
    gameModeName(gameMode: GameMode): string {
      switch (gameMode) {
        case 'human-vs-ai':
          return '人机对战'
        case 'local':
          return '本地对战'
        case 'online':
          return '在线对战'
      }
    }
  },
  board: {
    bigBoard(bigIndex: number): string {
      return `${bigIndex + 1}号`
    },
    bigBoardWithSuffix(bigIndex: number): string {
      return `${GAME_TEXT.board.bigBoard(bigIndex)} 棋盘`
    },
    smallCell(smallIndex: number): string {
      const row = Math.floor(smallIndex / 3) + 1
      const col = (smallIndex % 3) + 1

      return `${row}行${col}列`
    }
  },
  record: {
    gameStart(modeLine: string, firstPlayerName: string): string {
      return `${modeLine} 现在开始!\n轮到 ${firstPlayerName} 落下第一步`
    },
    move(playerName: string, bigBoardText: string, smallCellText: string): string {
      return `${playerName} 下在 ${bigBoardText} 棋盘 ${smallCellText}`
    },
    moveBoard(playerName: string, bigBoardText: string): string {
      return `${playerName} 下在 ${bigBoardText} 棋盘`
    },
    filledBoard(bigBoardText: string): string {
      return `填满了 ${bigBoardText} 棋盘`
    },
    drawBoard(bigBoardText: string): string {
      return `${bigBoardText} 棋盘平局`
    },
    settlement(ownerName: string, bigBoardText: string, filledCount: number): string {
      return `由于 ${ownerName} 控制了 ${bigBoardText} 棋盘，填充 ${filledCount} 格入口`
    },
    settlementNext(nextPlayerName: string): string {
      return `${nextPlayerName} 获得自由落子`
    },
    chainSettlement(count: number): string {
      return `连锁结算 ${count} 个`
    },
    nextFree(playerName: string): string {
      return `${playerName} 自由落子`
    },
    nextBoard(playerName: string, bigBoardText: string): string {
      return `轮到 ${playerName} 去 ${bigBoardText} 棋盘`
    },
    gameDraw(): string {
      return '双方未能完成大棋盘三连，本局平局。'
    },
    winner(playerName: string): string {
      return `${playerName} 赢下了本局游戏。`
    },
    wholeWinner(playerName: string): string {
      return `${playerName} 赢下了本局游戏。`
    },
    lineWinner(playerName: string, lineText: string): string {
      return `${playerName} 占领了 ${lineText}，赢下了本局游戏。`
    },
    resign(loserName: string, winnerName: string): string {
      return `由于 ${loserName} 投降，${winnerName} 赢下了本局游戏。`
    },
    leaveWinner(loserName: string, winnerName: string): string {
      return `由于 ${loserName} 离开对局，${winnerName} 赢下了本局游戏。`
    },
    chat(senderName: string, text: string): string {
      return `${senderName}说：${text}`
    }
  },
  room: {
    defaultNickname: '行者',
    notJoined: '未加入房间',
    spectator: '观战',
    waitingReady: '等待准备',
    finished: '已结束',
    connecting: '连接中',
    disconnected: '连接已断开',
    playing: '对局中',
    turnSelf: '轮到你落子',
    turnOpponent: '轮到对手落子',
    turnBlue: '轮到蓝方',
    turnRed: '轮到红方'
  },
  invalidMove: {
    notStarted: '请先开始游戏',
    finished: '这一局已经结束',
    occupied: '这个格子已有棋子',
    fallback: '这一步不能下',
    boardFinished(bigBoardText: string): string {
      return `${bigBoardText} 棋盘已结束`
    },
    requiredBoard(bigBoardText: string): string {
      return `请去 ${bigBoardText} 棋盘`
    }
  }
} as const
