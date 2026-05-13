import { getMusicApiBase } from './runtimeConfig'

/**
 * 代理配置 - 用于解决本地开发环境中的 CORS 问题
 * 这个对象可在 Vite 代理配置中复用。
 */
export const proxyConfig = {
  '/api/netease': {
    target: getMusicApiBase(),
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/api\/netease/, ''),
    headers: {
      Referer: 'https://lycanclaw.xyz',
      Origin: 'https://lycanclaw.xyz'
    }
  }
}

function isLocalDev(): boolean {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  return host === 'localhost' || host === '127.0.0.1'
}

function replaceApiBase(url: string, replacement: string): string {
  const apiBase = getMusicApiBase()
  return url.startsWith(apiBase) ? url.replace(apiBase, replacement) : url
}

/**
 * 获取代理 URL，根据环境自动选择直接 URL 或代理 URL。
 */
export function getProxyUrl(originalUrl: string): string {
  if (!originalUrl) return ''
  if (isLocalDev()) {
    return replaceApiBase(originalUrl, '/api/netease')
  }
  return originalUrl
}

/**
 * 添加 CORS 代理：统一修正协议并处理网易云接口地址。
 */
export function addCorsProxy(url: string): string {
  if (!url) return ''

  const normalizedUrl = url.startsWith('http:') ? url.replace('http:', 'https:') : url

  if (normalizedUrl.startsWith(getMusicApiBase())) {
    return getProxyUrl(normalizedUrl)
  }

  if (
    normalizedUrl.includes('music.163.com') ||
    normalizedUrl.includes('music.126.net') ||
    normalizedUrl.includes('m7.music.126.net') ||
    normalizedUrl.includes('m8.music.126.net') ||
    normalizedUrl.includes('m10.music.126.net')
  ) {
    return normalizedUrl
  }

  return normalizedUrl
}
