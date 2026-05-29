/**
 * siteApi.ts：
 * 提供siteApi相关的通用工具能力。
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
