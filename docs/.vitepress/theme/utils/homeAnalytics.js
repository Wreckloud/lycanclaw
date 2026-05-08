import { parseDateInput } from './time.js'
import { countWords } from './contentMetrics.js'

function formatDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isSameMonth(date, now = new Date()) {
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  )
}

export function calculateHomeStats(thoughtsPosts = [], knowledgeStats = []) {
  let totalWords = 0
  let currentMonthPosts = 0

  for (const post of thoughtsPosts) {
    totalWords += countWords(post?.content || '')
    const parsedDate = parseDateInput(post?.frontmatter?.date)
    if (parsedDate && isSameMonth(parsedDate)) {
      currentMonthPosts++
    }
  }

  for (const item of knowledgeStats) {
    if (item?.wordCount) {
      totalWords += item.wordCount
    }
    const parsedDate = parseDateInput(item?.date)
    if (parsedDate && isSameMonth(parsedDate)) {
      currentMonthPosts++
    }
  }

  return {
    totalWords,
    totalPostsCount: thoughtsPosts.length + knowledgeStats.length,
    currentMonthPosts
  }
}

export function buildDateWordCountMap(thoughtsPosts = [], knowledgeStats = []) {
  const dateWordCountMap = {}

  for (const post of thoughtsPosts) {
    const parsedDate = parseDateInput(post?.frontmatter?.date)
    if (!parsedDate) continue

    const dateKey = formatDateKey(parsedDate)
    const words = countWords(post?.content || '')
    dateWordCountMap[dateKey] = (dateWordCountMap[dateKey] || 0) + words
  }

  for (const item of knowledgeStats) {
    const parsedDate = parseDateInput(item?.date)
    if (!parsedDate) continue

    const dateKey = formatDateKey(parsedDate)
    const words = Number(item?.wordCount || 0)
    dateWordCountMap[dateKey] = (dateWordCountMap[dateKey] || 0) + words
  }

  return dateWordCountMap
}

export function getOneYearDateRange() {
  const today = new Date()
  const end = formatDateKey(today)

  const startDate = new Date(today)
  startDate.setFullYear(today.getFullYear() - 1)
  startDate.setDate(startDate.getDate() + 1)

  return {
    start: formatDateKey(startDate),
    end
  }
}
