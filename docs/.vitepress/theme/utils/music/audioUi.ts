/**
 * audioUi.ts：
 * 提供audioUi相关的通用工具能力。
 */
function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value))
}

export function formatAudioTime(seconds: number): string {
  if (Number.isNaN(seconds) || !Number.isFinite(seconds)) return '0:00'

  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}

export function resolveClientXFromPointerEvent(
  event: MouseEvent | TouchEvent
): number | null {
  if ('clientX' in event) return event.clientX
  const touch = event.touches?.[0] || event.changedTouches?.[0]
  return touch ? touch.clientX : null
}

export function calculateProgressPercent(
  event: MouseEvent | TouchEvent,
  element: HTMLElement
): number {
  const clientX = resolveClientXFromPointerEvent(event)
  if (clientX === null) return 0

  const rect = element.getBoundingClientRect()
  if (!rect.width) return 0
  return clamp((clientX - rect.left) / rect.width)
}
