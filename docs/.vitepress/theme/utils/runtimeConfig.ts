const DEFAULT_WALINE_SERVER_URL = 'https://lycanclaw-comment.netlify.app/.netlify/functions/comment'
const DEFAULT_HITOKOTO_API = 'https://v1.hitokoto.cn'
const DEFAULT_MUSIC_API_BASE = 'https://163api.qijieya.cn'
const DEFAULT_MUSIC_UID = '629126546'

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
