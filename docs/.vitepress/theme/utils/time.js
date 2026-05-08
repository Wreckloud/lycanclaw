function pad2(value) {
  return String(value).padStart(2, '0')
}

function isValidDate(date) {
  return date instanceof Date && !Number.isNaN(date.getTime())
}

function cleanDateString(value) {
  return String(value).trim().replace(/^['"]|['"]$/g, '')
}

export function parseDateInput(input) {
  if (!input) return null

  if (input instanceof Date) {
    return isValidDate(input) ? new Date(input.getTime()) : null
  }

  if (typeof input === 'number') {
    const date = new Date(input)
    return isValidDate(date) ? date : null
  }

  if (typeof input !== 'string') return null

  const normalized = cleanDateString(input)
  if (!normalized) return null

  // Support "YYYY-MM-DD", "YYYY-MM-DD HH:mm:ss" and "YYYY-MM-DDTHH:mm:ss"
  const commonMatch = normalized.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2})(?::(\d{2})(?::(\d{2}))?)?)?/
  )
  if (commonMatch) {
    const [, y, m, d, hh = '00', mm = '00', ss = '00'] = commonMatch
    const date = new Date(
      Number(y),
      Number(m) - 1,
      Number(d),
      Number(hh),
      Number(mm),
      Number(ss)
    )
    if (isValidDate(date)) return date
  }

  const fallback = new Date(normalized)
  return isValidDate(fallback) ? fallback : null
}

export function formatDateCn(input, options = {}) {
  const { withYear = true, withTime = false } = options
  const date = parseDateInput(input)
  if (!date) return ''

  const yyyy = date.getFullYear()
  const MM = pad2(date.getMonth() + 1)
  const dd = pad2(date.getDate())
  const HH = pad2(date.getHours())
  const mm = pad2(date.getMinutes())
  const ss = pad2(date.getSeconds())

  const datePart = withYear ? `${yyyy}年${MM}月${dd}日` : `${MM}月${dd}日`
  if (!withTime) return datePart
  return `${datePart} ${HH}:${mm}:${ss}`
}

export function formatMonthDayCn(input) {
  return formatDateCn(input, { withYear: false, withTime: false })
}

export function formatRelativeTimeCn(input, options = {}) {
  const {
    now = new Date(),
    relativeDays = 7,
    relativeMonths = null,
    maxRelativeWeeks = null,
    maxRelativeDays = null,
    absoluteStyle = 'auto', // auto | ymd | md
    futureAsNow = true
  } = options

  const date = parseDateInput(input)
  if (!date || !isValidDate(now)) return ''

  const diffMs = now.getTime() - date.getTime()
  if (diffMs < 0 && futureAsNow) return '刚刚'

  const seconds = Math.floor(Math.abs(diffMs) / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  const thresholdDays =
    typeof relativeMonths === 'number' && relativeMonths > 0
      ? Math.floor(relativeMonths * 30)
      : relativeDays
  const limitedDays =
    typeof maxRelativeDays === 'number' && maxRelativeDays >= 0
      ? Math.min(days, maxRelativeDays)
      : days

  if (seconds < 60) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${Math.max(1, limitedDays)}天前`
  if (days < thresholdDays) {
    const weeks = Math.max(1, Math.floor(days / 7))
    if (
      typeof maxRelativeWeeks === 'number' &&
      maxRelativeWeeks > 0 &&
      weeks > maxRelativeWeeks
    ) {
      return formatAbsoluteDate(date, now, absoluteStyle)
    }
    return `${weeks}周前`
  }

  return formatAbsoluteDate(date, now, absoluteStyle)
}

function formatAbsoluteDate(date, now, absoluteStyle) {
  if (absoluteStyle === 'md') {
    return formatMonthDayCn(date)
  }

  if (absoluteStyle === 'ymd') {
    return formatDateCn(date, { withYear: true })
  }

  const sameYear = now.getFullYear() === date.getFullYear()
  return sameYear
    ? formatDateCn(date, { withYear: false })
    : formatDateCn(date, { withYear: true })
}
