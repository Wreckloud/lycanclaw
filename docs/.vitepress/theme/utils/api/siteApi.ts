/**
 * 站点轻量 API：
 * 当前仅封装一言，失败时返回调用方提供的兜底文案。
 */
import { logError } from '../logger'
import { getHitokotoApiUrl } from '../runtimePolicy'

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
