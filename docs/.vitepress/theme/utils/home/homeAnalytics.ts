import { parseDateInput } from './time'
import { countWords } from './contentMetrics'
import type { KnowledgeStatRecord, ThoughtPost } from './contentData'

function formatDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isSameMonth(date: Date, now = new Date()): boolean {
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  )
}

export function calculateHomeStats(
  thoughtsPosts: ThoughtPost[] = [],
  knowledgeStats: KnowledgeStatRecord[] = []
): { totalWords: number; totalPostsCount: number; currentMonthPosts: number } {
  let totalWords = 0
  let currentMonthPosts = 0

  for (const post of thoughtsPosts) {
    const content = typeof post?.content === 'string' ? post.content : ''
    totalWords += countWords(content)
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

export function getOneYearDateRange(): { start: string; end: string } {
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
