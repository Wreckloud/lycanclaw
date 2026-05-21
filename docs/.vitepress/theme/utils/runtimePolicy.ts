/**
 * 运行时配置读取策略：
 * 优先级为 window 注入配置 > 环境变量 > 默认值。
 */
// 评论服务默认指向自建 Waline，本地开发可直接联调。
const DEFAULT_WALINE_SERVER_URL = 'http://127.0.0.1:8360'
const DEFAULT_HITOKOTO_API = 'https://v1.hitokoto.cn'
const DEFAULT_MUSIC_API_BASE = 'https://apis.netstart.cn/music'
const DEFAULT_MUSIC_UID = '629126546'
const DEFAULT_BACKEND_API_BASE = 'http://127.0.0.1:8080'

export interface LycanRuntimeConfig {
  musicApiBase?: string
  musicUid?: string
  walineServerUrl?: string
  hitokotoApi?: string
  backendApiBase?: string
}

declare global {
  interface Window {
    __LYCAN_CONFIG?: LycanRuntimeConfig
  }
}

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '')
}

// 仅在浏览器端读取 window 注入值。
function readRuntimeValue(key: keyof LycanRuntimeConfig): string | undefined {
  if (typeof window === 'undefined') return undefined
  const value = window.__LYCAN_CONFIG?.[key]
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

export function resolveRuntimeBaseUrl(options: {
  runtimeKey: keyof LycanRuntimeConfig
  envKey?: string
  defaultValue: string
}): string {
  const runtimeValue = readRuntimeValue(options.runtimeKey)
  if (runtimeValue) return normalizeBaseUrl(runtimeValue)

  if (options.envKey) {
    const envValue = import.meta.env?.[options.envKey]
    if (typeof envValue === 'string' && envValue.trim()) {
      return normalizeBaseUrl(envValue)
    }
  }

  return normalizeBaseUrl(options.defaultValue)
}

export function resolveRuntimeValue(options: {
  runtimeKey: keyof LycanRuntimeConfig
  envKey?: string
  defaultValue: string
}): string {
  const runtimeValue = readRuntimeValue(options.runtimeKey)
  if (runtimeValue) return runtimeValue

  if (options.envKey) {
    const envValue = import.meta.env?.[options.envKey]
    if (typeof envValue === 'string' && envValue.trim()) {
      return envValue.trim()
    }
  }

  return options.defaultValue
}

export function getWalineServerUrl(): string {
  return resolveRuntimeBaseUrl({
    runtimeKey: 'walineServerUrl',
    envKey: 'VITE_WALINE_SERVER_URL',
    defaultValue: DEFAULT_WALINE_SERVER_URL
  })
}

export function getHitokotoApiUrl(): string {
  return resolveRuntimeBaseUrl({
    runtimeKey: 'hitokotoApi',
    envKey: 'VITE_HITOKOTO_API',
    defaultValue: DEFAULT_HITOKOTO_API
  })
}

export function getMusicApiBase(): string {
  return resolveRuntimeBaseUrl({
    runtimeKey: 'musicApiBase',
    envKey: 'VITE_MUSIC_API_BASE',
    defaultValue: DEFAULT_MUSIC_API_BASE
  })
}

export function getMusicUid(): string {
  return resolveRuntimeValue({
    runtimeKey: 'musicUid',
    envKey: 'VITE_MUSIC_UID',
    defaultValue: DEFAULT_MUSIC_UID
  })
}

export function getBackendApiBase(): string {
  return resolveRuntimeBaseUrl({
    runtimeKey: 'backendApiBase',
    envKey: 'VITE_BACKEND_API_BASE',
    defaultValue: DEFAULT_BACKEND_API_BASE
  })
}
