/**
 * runtimePolicy.ts：
 * 提供runtimePolicy相关的通用工具能力。
 */
const DEFAULT_HITOKOTO_API = 'https://v1.hitokoto.cn'
const DEFAULT_BACKEND_API_BASE = import.meta.env.DEV ? 'http://127.0.0.1:8080' : ''

export interface LycanRuntimeConfig {
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

export function getHitokotoApiUrl(): string {
  return DEFAULT_HITOKOTO_API
}

export function getBackendApiBase(): string {
  return resolveRuntimeBaseUrl({
    runtimeKey: 'backendApiBase',
    envKey: 'VITE_BACKEND_API_BASE',
    defaultValue: DEFAULT_BACKEND_API_BASE
  })
}

export function getWalineServerUrl(): string {
  const backendBase = getBackendApiBase()
  try {
    const url = new URL(backendBase)
    const isLocalHost = url.hostname === '127.0.0.1' || url.hostname === 'localhost'
    if (isLocalHost && url.port === '8080') {
      return `${url.protocol}//${url.hostname}:8360`
    }
  } catch {
    // 忽略解析异常，回退到统一路径推导。
  }
  return `${backendBase}/waline`
}
