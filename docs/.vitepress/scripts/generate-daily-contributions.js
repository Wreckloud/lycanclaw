import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const OUTPUT_FILE = path.resolve('docs/public/daily-contributions.json')
const DEFAULT_DAYS = 365
const DATE_MARKER = '__DATE__'

const TARGETS = [
  'docs/thoughts',
  'docs/knowledge',
  'docs/.vitepress/theme',
  'docs/.vitepress/config.mjs',
  'docs/.vitepress/scripts'
]

function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function buildDateRange(days) {
  const end = new Date()
  const result = []
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(end)
    d.setDate(end.getDate() - i)
    result.push(formatDate(d))
  }
  return result
}

function parseNumstatLine(line) {
  const parts = line.split('\t')
  if (parts.length < 3) return null

  const additionsRaw = parts[0]
  const deletionsRaw = parts[1]
  if (additionsRaw === '-' || deletionsRaw === '-') return null

  const additions = Number.parseInt(additionsRaw, 10)
  const deletions = Number.parseInt(deletionsRaw, 10)

  if (Number.isNaN(additions) || Number.isNaN(deletions)) return null
  return { additions, deletions }
}

function readGitContributions(days, targets) {
  const args = [
    'log',
    `--since=${days} days ago`,
    '--date=short',
    `--pretty=format:${DATE_MARKER}%ad`,
    '--numstat',
    '--',
    ...targets
  ]
  const output = execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 16 * 1024 * 1024
  })

  const records = new Map()
  let currentDate = null

  for (const rawLine of output.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) continue

    if (line.startsWith(DATE_MARKER)) {
      currentDate = line.slice(DATE_MARKER.length)
      if (!records.has(currentDate)) {
        records.set(currentDate, { additions: 0, deletions: 0 })
      }
      continue
    }

    if (!currentDate) continue
    const stat = parseNumstatLine(line)
    if (!stat) continue

    const bucket = records.get(currentDate)
    bucket.additions += stat.additions
    bucket.deletions += stat.deletions
  }

  return records
}

function buildPayload(days, targets) {
  const dates = buildDateRange(days)
  const contributions = readGitContributions(days, targets)

  const data = dates.map((date) => {
    const item = contributions.get(date) || { additions: 0, deletions: 0 }
    return {
      date,
      additions: item.additions,
      deletions: item.deletions,
      total: item.additions + item.deletions
    }
  })

  return {
    generatedAt: new Date().toISOString(),
    timezone: 'Asia/Shanghai',
    metric: 'additions_plus_deletions',
    days,
    scope: targets,
    data
  }
}

function main() {
  try {
    const payload = buildPayload(DEFAULT_DAYS, TARGETS)
    fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true })
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(payload, null, 2), 'utf8')
    console.log(`日贡献数据生成完成: ${OUTPUT_FILE} (${payload.data.length} 天)`)
  } catch (error) {
    console.error('生成日贡献数据失败:', error)
    process.exit(1)
  }
}

main()
