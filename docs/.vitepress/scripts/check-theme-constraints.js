import fs from 'node:fs'
import path from 'node:path'

const rootDir = path.resolve('docs/.vitepress/theme')
const componentsDir = path.join(rootDir, 'components')
const loggerFile = path.join(rootDir, 'utils', 'logger.ts')

const violations = []

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(fullPath)
      continue
    }
    checkFile(fullPath)
  }
}

function toRelative(filePath) {
  return path.relative(process.cwd(), filePath).replaceAll('\\', '/')
}

function addViolation(filePath, rule, detail) {
  violations.push(`[${rule}] ${toRelative(filePath)}: ${detail}`)
}

function checkThemeNoJs(filePath) {
  if (filePath.endsWith('.js')) {
    addViolation(filePath, 'no-theme-js', 'theme 目录内禁止新增 .js 文件')
  }
}

function checkComponentScriptTs(filePath, content) {
  if (!filePath.endsWith('.vue')) return
  if (!content.includes('<script setup lang="ts">')) {
    addViolation(filePath, 'script-ts', '组件必须使用 <script setup lang="ts">')
  }
}

function checkComponentNoFetch(filePath, content) {
  if (!filePath.endsWith('.vue')) return
  if (content.includes('fetch(')) {
    addViolation(filePath, 'no-component-fetch', '组件内禁止直接 fetch，请改走 utils/*Api.ts')
  }
}

function checkNoConsole(filePath, content) {
  if (filePath === loggerFile) return
  if (/\bconsole\./.test(content)) {
    addViolation(filePath, 'no-console', '请改用 utils/logger.ts')
  }
}

function checkNoAny(filePath, content) {
  if (!/\.(ts|vue)$/.test(filePath)) return
  if (/\bany\b/.test(content)) {
    addViolation(filePath, 'no-any', '禁止新增 any，请补充明确类型')
  }
}

function checkFile(filePath) {
  checkThemeNoJs(filePath)
  const content = fs.readFileSync(filePath, 'utf8')
  checkComponentScriptTs(filePath, content)
  checkComponentNoFetch(filePath, content)
  checkNoConsole(filePath, content)
  checkNoAny(filePath, content)
}

walk(rootDir)

if (violations.length > 0) {
  console.error('主题约束检查失败:\n')
  for (const violation of violations) {
    console.error(`- ${violation}`)
  }
  process.exit(1)
}

console.log('主题约束检查通过')
