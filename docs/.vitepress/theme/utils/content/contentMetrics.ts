export function countWords(content: string = ''): number {
  const text = content || ''
  const pattern =
    /[a-zA-Z0-9_\u0392-\u03C9\u00C0-\u00FF\u0600-\u06FF\u0400-\u04FF]+|[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF\u3040-\u309F\uAC00-\uD7AF]+/g
  const tokens = text.match(pattern)

  if (!tokens) {
    return 0
  }

  let count = 0
  for (const token of tokens) {
    count += token.charCodeAt(0) >= 0x4e00 ? token.length : 1
  }
  return count
}

export function estimateReadMinutes(content: string = '', wordsPerMinute = 300): number {
  const safeWpm = Number.isFinite(wordsPerMinute) && wordsPerMinute > 0 ? wordsPerMinute : 300
  const words = countWords(content)
  return Math.max(1, Math.ceil(words / safeWpm))
}
