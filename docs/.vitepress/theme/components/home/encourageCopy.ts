export type EncourageMessageSource = 'normal' | 'combo100' | 'combo200' | 'combo300' | 'milestone'

export interface ActiveDrawerCopy {
  message: string
  holdUntilCount: number
  source: EncourageMessageSource
}

export interface EncourageCopyResult {
  message: string
  activeCopy: ActiveDrawerCopy
  durationMs: number
}

const normalMessages = [
  '收到催更了',
  '传来一阵敷衍的嚎叫声',
  '狼正假装没看见',
  '从阴影里看了你一眼',
  '有什么东西翻了个身',
  '信号送达',
  '里面没动静',
  '尾巴露了',
  '狼装作没看见',
  '敷衍的一声狼嚎',
  '催更的声音在回荡'
] as const

const combo100Messages = [
  '狼开始警觉了',
  '可能会伸出一只爪子挠你！',
  '尾巴炸毛了',
  '开始假装自己不在家',
  '别再敲啦!!',
  '传来了防御性咕咕低吼',
  '懒癌正在遭受精神攻击',
  '防御姿态',
  '你的连续催更很有力气！'
] as const

const combo200Messages = [
  '成功将拖延中的生物逼到绝境',
  '真的知道了...',
  '触发了强制开机',
  '进度+1',
  '隐藏进度条似乎往前爬了',
  '表情很不情愿地行动了',
  '借口加载中',
  '给懒癌造成了暴击'
] as const

const combo300Messages = [
  '狼试图躲进更深处',
  '马上马上!',
  '已经新建文件了',
  '听到了败北的狼嚎',
  '进入被催更驯化状态',
  '产出概率小幅上升'
] as const

const milestoneMessages: Record<number, string> = {
  1: '收到催更了',
  10: '深夜狼嚎中',
  25: '不耐烦地甩甩尾巴',
  50: '你有点执着',

  100: '我真的会写的',
  123: '狼挪了一步',
  200: '你赢了',
  365: '明天再写...',
  404: '更新未找到',
  900: '传说区域',
  998: '睁眼了',
  999: '九九九达成',
  1000: '千次敲门'
}

export function resolveEncourageCopy(count: number, activeCopy: ActiveDrawerCopy | null): EncourageCopyResult {
  const milestone = milestoneMessages[count]
  if (milestone) {
    return createResult(milestone, count, 'milestone', getMilestoneHold(count))
  }

  if (activeCopy && count <= activeCopy.holdUntilCount) {
    return {
      message: activeCopy.message,
      activeCopy,
      durationMs: getDrawerDuration(activeCopy.message)
    }
  }

  const source = getPoolSource(count)
  const message = pickMessage(createMessagePool(count))

  return createResult(message, count, source, getRandomHold(source))
}

function createResult(
  message: string,
  count: number,
  source: EncourageMessageSource,
  holdClicks: number
): EncourageCopyResult {
  const activeCopy = {
    message,
    holdUntilCount: count + holdClicks,
    source
  }

  return {
    message,
    activeCopy,
    durationMs: getDrawerDuration(message)
  }
}

function createMessagePool(count: number): readonly string[] {
  if (count >= 300) return [...normalMessages, ...combo100Messages, ...combo200Messages, ...combo300Messages]
  if (count >= 200) return [...normalMessages, ...combo100Messages, ...combo200Messages]
  if (count >= 100) return [...normalMessages, ...combo100Messages]

  return normalMessages
}

function getPoolSource(count: number): EncourageMessageSource {
  if (count >= 300) return 'combo300'
  if (count >= 200) return 'combo200'
  if (count >= 100) return 'combo100'

  return 'normal'
}

function getRandomHold(source: EncourageMessageSource): number {
  if (source === 'combo300') return randomInt(8, 12)
  if (source === 'combo200') return randomInt(6, 10)
  if (source === 'combo100') return randomInt(5, 8)

  return randomInt(3, 6)
}

function getMilestoneHold(count: number): number {
  if ([100, 404, 999, 1000].includes(count)) return randomInt(16, 24)

  return randomInt(8, 14)
}

function getDrawerDuration(message: string): number {
  return clamp(2400 + (message.length * 90), 2800, 4200)
}

function pickMessage(messages: readonly string[]): string {
  return messages[Math.floor(Math.random() * messages.length)] ?? normalMessages[0]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
