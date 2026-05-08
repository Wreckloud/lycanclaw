import { formatRelativeTimeCn } from './time.js'

/**
 * 首页近期动态时间策略：
 * - 1~6天 => X天前
 * - 7~13天 => 1周前
 * - 14天+ => 绝对日期（同年 MM月DD日，跨年 YYYY年MM月DD日）
 */
export const RECENT_POST_TIME_OPTIONS = Object.freeze({
  relativeMonths: 3,
  maxRelativeWeeks: 1,
  absoluteStyle: 'auto'
})

/**
 * 首页最新评论时间策略：
 * - 1~6天 => X天前
 * - 7天起 => X周前
 * - 超过1个月 => 绝对日期（同年 MM月DD日，跨年 YYYY年MM月DD日）
 */
export const RECENT_COMMENT_TIME_OPTIONS = Object.freeze({
  relativeMonths: 1,
  absoluteStyle: 'auto'
})

export function formatRecentPostTime(input, overrides = {}) {
  return formatRelativeTimeCn(input, {
    ...RECENT_POST_TIME_OPTIONS,
    ...overrides
  })
}

export function formatRecentCommentTime(input, overrides = {}) {
  return formatRelativeTimeCn(input, {
    ...RECENT_COMMENT_TIME_OPTIONS,
    ...overrides
  })
}
