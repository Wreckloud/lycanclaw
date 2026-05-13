import { logError } from './logger'
import { getHitokotoApiUrl } from './runtimeConfig'

interface HitokotoResponse {
  hitokoto?: string
}

export async function fetchHitokoto(defaultText: string): Promise<string> {
  try {
    const response = await fetch(getHitokotoApiUrl())
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
