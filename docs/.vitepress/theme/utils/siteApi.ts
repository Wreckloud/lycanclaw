import { logError } from './logger'

interface HitokotoResponse {
  hitokoto?: string
}

const HITOKOTO_API = 'https://v1.hitokoto.cn'

export async function fetchHitokoto(defaultText: string): Promise<string> {
  try {
    const response = await fetch(HITOKOTO_API)
    if (!response.ok) return defaultText

    const payload = (await response.json()) as HitokotoResponse
    return typeof payload.hitokoto === 'string' && payload.hitokoto.trim()
      ? payload.hitokoto
      : defaultText
  } catch (error) {
    logError('siteApi', '加载一言失败', error)
    return defaultText
  }
}
