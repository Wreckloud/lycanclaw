import { getBackendApiBase } from '../../../../utils/runtimePolicy'

export type OnlineRoomStatus = 'WAITING' | 'PLAYING' | 'FINISHED'
export type OnlineServerMessageType = 'snapshot' | 'error'

export interface OnlineGameMove {
  bigIndex: number
  smallIndex: number
}

export interface OnlineRecordedMove extends OnlineGameMove {
  player: number
  source: 'manual' | 'auto'
  settlementBoardIndex?: number | null
}

export interface OnlineRuleEvent {
  boardIndex: number
  owner: number
  filledCount: number
  filledCells: OnlineRecordedMove[]
}

export interface OnlineGameMessage {
  id: string
  type: 'system' | 'move' | 'chat'
  player?: number | null
  sender?: number | null
  senderName?: string | null
  text: string
}

export interface OnlinePlayerSnapshot {
  side: number
  nickname: string
  connected: boolean
  ready: boolean
}

export interface OnlineStateSnapshot {
  board: number[]
  smallBoardStatus: number[]
  smallBoardResolved: boolean[]
  smallBoardWinningLines: Array<number[] | null>
  currentPlayer: number
  nextBoard: number | null
  winner: number
  bigBoardWinningLine: number[] | null
  isStarted: boolean
  moveHistory: OnlineRecordedMove[]
  lastTurnMoves: OnlineRecordedMove[]
  lastRuleEvents: OnlineRuleEvent[]
}

export interface OnlineRoomSnapshot {
  roomId: string
  roomStatus: OnlineRoomStatus
  selfSide: number | null
  players: OnlinePlayerSnapshot[]
  state: OnlineStateSnapshot
  messages: OnlineGameMessage[]
}

export interface CreateOnlineRoomResult {
  roomId: string
  playerToken: string
}

interface OnlineServerMessage {
  type: OnlineServerMessageType
  data?: OnlineRoomSnapshot
  message?: string
}

export interface OnlineGameClientOptions {
  onSnapshot: (snapshot: OnlineRoomSnapshot) => void
  onError: (message: string) => void
  onClose: () => void
}

export class OnlineGameClient {
  private socket: WebSocket | null = null

  constructor(private readonly options: OnlineGameClientOptions) {
  }

  connect(roomId: string, playerToken: string, nickname: string): void {
    this.close()
    this.socket = new WebSocket(createWebSocketUrl())
    this.socket.addEventListener('open', () => {
      this.send({
        type: 'join',
        roomId,
        playerToken,
        nickname
      })
    })
    this.socket.addEventListener('message', (event) => this.handleMessage(event))
    this.socket.addEventListener('close', () => this.options.onClose())
    this.socket.addEventListener('error', () => this.options.onError('在线对战连接失败'))
  }

  move(roomId: string, playerToken: string, move: OnlineGameMove): void {
    this.send({
      type: 'move',
      roomId,
      playerToken,
      bigIndex: move.bigIndex,
      smallIndex: move.smallIndex
    })
  }

  chat(roomId: string, playerToken: string, text: string): void {
    this.send({
      type: 'chat',
      roomId,
      playerToken,
      text
    })
  }

  resign(roomId: string, playerToken: string): void {
    this.send({
      type: 'resign',
      roomId,
      playerToken
    })
  }

  ready(roomId: string, playerToken: string): void {
    this.send({
      type: 'ready',
      roomId,
      playerToken
    })
  }

  close(): void {
    if (!this.socket) return
    this.socket.close()
    this.socket = null
  }

  private send(payload: Record<string, unknown>): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.options.onError('在线对战尚未连接')
      return
    }
    this.socket.send(JSON.stringify(payload))
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(String(event.data)) as OnlineServerMessage
      if (message.type === 'snapshot' && message.data) {
        this.options.onSnapshot(message.data)
        return
      }
      if (message.type === 'error') {
        this.options.onError(message.message || '在线对战操作失败')
      }
    } catch {
      this.options.onError('在线对战消息格式错误')
    }
  }
}

export async function createOnlineRoom(nickname: string): Promise<CreateOnlineRoomResult> {
  const response = await fetch(`${getBackendApiBase()}/api/game/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ nickname })
  })
  const payload = await response.json() as {
    success: boolean
    data?: CreateOnlineRoomResult
    error?: { message?: string }
  }
  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(payload.error?.message || '创建房间失败')
  }
  return payload.data
}

export function createOnlinePlayerToken(): string {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  return btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
}

function createWebSocketUrl(): string {
  const backendBase = getBackendApiBase()
  const base = backendBase || window.location.origin
  const url = new URL('/api/game/ws', base)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  return url.toString()
}
