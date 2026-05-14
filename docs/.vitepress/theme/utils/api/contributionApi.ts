import { getBackendApiBase } from '../runtimePolicy'

export interface DailyContributionRecord {
  date: string
  additions: number
  deletions: number
  total: number
}

interface ApiResponse<T> {
  success: boolean
  data: T | null
  error?: {
    code: string
    message: string
  } | null
}

interface DailyContributionResponse {
  generatedAt: string
  timezone: string
  metric: string
  days: number
  scope: string[]
  data: DailyContributionRecord[]
}

function buildDailyContributionsUrl(days?: number): string {
  const query = typeof days === 'number' && days > 0 ? `?days=${Math.floor(days)}` : ''
  return `${getBackendApiBase()}/api/contributions/daily${query}`
}

export async function fetchDailyContributions(days?: number): Promise<DailyContributionRecord[]> {
  const response = await fetch(buildDailyContributionsUrl(days), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`加载日贡献数据失败: ${response.status}`)
  }

  const payload = (await response.json()) as ApiResponse<DailyContributionResponse>
  if (!payload?.success || !payload.data || !Array.isArray(payload.data.data)) {
    throw new Error(payload?.error?.message || '日贡献接口返回格式错误')
  }

  return payload.data.data
}
