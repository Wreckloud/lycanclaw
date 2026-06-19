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
  '有什么东西从阴影里看了你一眼，又缩了回去',
  '这次催更被收下了，虽然收下的人看起来很想赖账',
  '里面传来一阵敷衍的嚎叫声',
  '有谁小声嘀咕：“知道了知道了……”',
  '催更信号已送达，但狼正假装没看见',
  '洞口的草动了一下，可能是某只在装死的东西',
  '你留下了一次催更！',
  '催更成功！！至于有没有用，是另一个故事',
  '一阵窸窸窣窣之后，里面又没动静了',
  '一枚小石子被丢了进去',
  '你的催更击中了目标，但目标选择原地趴下',
  '催更的声音回荡了一下',
  '里面好像有什么东西翻了个身'
] as const

const combo100Messages = [
  '你敲得太密了，里面的东西开始警觉',
  '你再敲下去，洞口可能会伸出一只爪子挠你！',
  '催更频率过高，已惊动窝里最懒的那一只',
  '他开始假装自己不在家，但尾巴露出来了',
  '里面有东西低低地哼了一声，听起来不像答应',
  '洞口的空气变得紧张起来，像有什么东西正在炸毛',
  '作者试图撤退，但被催更声堵在了角落',
  '催更过载，洞穴进入防御姿态',
  '你敲得太认真了，懒癌正在遭受精神攻击',
  '洞里传来一句很小声又委屈的：“再给我一点时间……”',
  '某只狼试图用睡觉抵抗现实，但失败了一点点',
  '狼开始认真思考：要不还是写一点吧？',
  '你的连续催更很有力气！',
  '里面传来防御性咕咕低吼，但明显没底气'
] as const

const combo200Messages = [
  '催更声太密，作者的装死技能进入冷却',
  '洞里传来一声：“我真的知道了！”',
  '你把一只拖延中的生物逼到了存稿边缘',
  '某个隐藏进度条似乎往前爬了一毫米',
  '里面的东西终于动起来了，虽然表情很不情愿',
  '触发了强制开机，但系统仍在加载意志',
  '催更次数过于离谱，懒癌受到了暴击',
  '他开始翻找文档了，也可能是在找借口'
] as const

const combo300Messages = [
  '狼试图躲进更深处',
  '你把拖延症从窝里拖出来了一半',
  '某只狼开始认真怀疑，你是不是比他更闲',
  '催更压力突破阈值，产出概率小幅上升',
  '洞里传来一声长叹，听起来像败北宣言',
  '你已经把“快了快了”敲成了“马上马上”',
  '某个家伙正在被迫新建文件',
  '作者进入被催更驯化状态，效果未知'
] as const

const milestoneMessages: Record<number, string> = {
  1: '第一次敲响洞口，里面还在装作没听见',
  10: '十次催更达成，洞里传来很轻的狼嚎',
  13: '不耐烦地甩甩尾巴，灰尘被扫起来了一点',
  21: '你已经很熟练地找到催更的位置了',
  33: '洞里的东西开始把自己埋得更深',
  49: '再敲一下，某种奇怪的催更仪式就要成立了',
  50: '第五十次催更达成，里面终于承认：你有点执着',
  66: '你似乎掌握了某种古老的催更仪式',
  97: '已经 97 次了，作者再装死就不礼貌了',
  99: '只差一点，某个隐藏的东西正在醒来',
  100: '第 100 次催更达成！洞里丢出一句：“我会写的。”',
  123: '一二三，狼被迫向前挪了一步',
  200: '第二百次催更达成。洞里沉默良久，最后传来一句：“你赢了。”',
  233: '洞里传来一阵很不严肃的笑声233',
  365: '一年有三百六十五天，而狼可以每天都想明天再写。',
  404: '更新未找到，但发现一只正在逃避的狼',
  500: '这里本该有更新，但作者把它藏进了更深的地方',
  666: '你似乎真的完成了某种古老仪式，洞里亮起了不妙的光',
  777: '幸运数字出现了，但更新仍然要靠作者本人',
  888: '催更声堆成了小山，狼仍然装死',
  900: '你已经接近传说中的区域，前方禁止普通访客进入',
  998: '只差一次，洞穴深处有什么东西睁开了眼',
  999: '第 999 次催更达成！',
  1000: '第 1000 次催更达成。洞门短暂打开了一瞬，里面传来一句：“这下真的记住你了。”'
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
  return clamp(2600 + (message.length * 55), 3200, 6200)
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
