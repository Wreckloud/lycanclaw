import test from 'node:test'
import assert from 'node:assert/strict'
import {
  parseDateInput,
  formatDateCn,
  formatRelativeTimeCn
} from '../docs/.vitepress/theme/utils/time.js'
import {
  formatRecentPostTime,
  formatRecentCommentTime
} from '../docs/.vitepress/theme/utils/timeDisplayPolicy.js'

const now = new Date('2026-05-08T12:00:00+08:00')

test('parseDateInput parses common datetime string', () => {
  const date = parseDateInput('2026-05-08 11:30:45')
  assert.ok(date instanceof Date)
  assert.equal(date.getFullYear(), 2026)
  assert.equal(date.getMonth(), 4)
  assert.equal(date.getDate(), 8)
  assert.equal(date.getHours(), 11)
  assert.equal(date.getMinutes(), 30)
  assert.equal(date.getSeconds(), 45)
})

test('formatDateCn includes year for cross-year dates', () => {
  assert.equal(formatDateCn('2025-12-30'), '2025年12月30日')
  assert.equal(formatDateCn('2026-03-12', { withYear: false }), '03月12日')
})

test('formatRelativeTimeCn supports days, weeks and absolute fallback', () => {
  assert.equal(
    formatRelativeTimeCn('2026-05-08T11:45:00+08:00', { now }),
    '15分钟前'
  )
  assert.equal(
    formatRelativeTimeCn('2026-05-06T12:00:00+08:00', { now }),
    '2天前'
  )
  assert.equal(
    formatRelativeTimeCn('2026-04-29T12:00:00+08:00', {
      now,
      relativeMonths: 3,
      maxRelativeWeeks: 1
    }),
    '1周前'
  )
  assert.equal(
    formatRelativeTimeCn('2026-04-20T12:00:00+08:00', {
      now,
      relativeMonths: 3,
      maxRelativeWeeks: 1,
      absoluteStyle: 'auto'
    }),
    '04月20日'
  )
})

test('homepage time policies match expected behavior', () => {
  assert.equal(
    formatRecentPostTime('2026-04-28T12:00:00+08:00', { now }),
    '1周前'
  )
  assert.equal(
    formatRecentPostTime('2026-04-20T12:00:00+08:00', { now }),
    '04月20日'
  )
  assert.equal(
    formatRecentPostTime('2025-12-30T12:00:00+08:00', { now }),
    '2025年12月30日'
  )

  assert.equal(
    formatRecentCommentTime('2026-04-17T12:00:00+08:00', { now }),
    '3周前'
  )
  assert.equal(
    formatRecentCommentTime('2026-03-20T12:00:00+08:00', { now }),
    '03月20日'
  )
})
