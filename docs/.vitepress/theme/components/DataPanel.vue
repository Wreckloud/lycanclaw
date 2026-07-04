<script setup lang="ts">
/**
 * DataPanel.vue：
 * 定义DataPanel组件的交互与展示逻辑。
 */

import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useSidebar } from 'vitepress/theme'
import { fetchHitokoto } from '../utils/api'

const { hasSidebar } = useSidebar()
const isBrowser = typeof window !== 'undefined'
const currentYear = new Date().getFullYear()
const startYear = 2023
const yearString = startYear === currentYear 
  ? currentYear.toString() 
  : `${startYear}-${currentYear}`

const SITE_START_AT = new Date('2023-09-17T14:00:00')
const MILLISECOND_PER_SECOND = 1000
const SECOND_PER_MINUTE = 60
const MINUTE_PER_HOUR = 60
const HOUR_PER_DAY = 24
const DAY_PER_YEAR = 365.25
const years = ref(0)
const days = ref(0)
const hours = ref(0)
const minutes = ref(0)
const seconds = ref(0)
let timer: number | null = null

function formatTwoDigits(value: number): string {
  return String(Math.max(0, Math.trunc(value))).padStart(2, '0')
}

const ROLL_DIGIT_SEQUENCE = ['9', '8', '7', '6', '5', '4', '3', '2', '1', '0', '9', '8', '7', '6', '5', '4', '3', '2', '1', '0', '9', '8', '7', '6', '5', '4', '3', '2', '1', '0']
const DIGIT_STEP_DURATION_MS = 180
const DIGIT_WRAP_DURATION_MS = 360
const DIGIT_SEQUENCE_SIZE = 10
const DIGIT_MIDDLE_OFFSET = 10
const DIGIT_SEQUENCE_EASE = 'cubic-bezier(0.2, 0.72, 0, 1)'

const hourTensRollIndex = ref(DIGIT_MIDDLE_OFFSET)
const hourUnitsRollIndex = ref(DIGIT_MIDDLE_OFFSET)
const minuteTensRollIndex = ref(DIGIT_MIDDLE_OFFSET)
const minuteUnitsRollIndex = ref(DIGIT_MIDDLE_OFFSET)
const secondTensRollIndex = ref(DIGIT_MIDDLE_OFFSET)
const secondUnitsRollIndex = ref(DIGIT_MIDDLE_OFFSET)
const hourTensRollDurationMs = ref(0)
const hourUnitsRollDurationMs = ref(0)
const minuteTensRollDurationMs = ref(0)
const minuteUnitsRollDurationMs = ref(0)
const secondTensRollDurationMs = ref(0)
const secondUnitsRollDurationMs = ref(0)

const hourText = computed(() => formatTwoDigits(hours.value))
const minuteText = computed(() => formatTwoDigits(minutes.value))
const secondText = computed(() => formatTwoDigits(seconds.value))

const hourTensTransform = computed(() => `translateY(-${hourTensRollIndex.value}em)`)
const hourUnitsTransform = computed(() => `translateY(-${hourUnitsRollIndex.value}em)`)
const minuteTensTransform = computed(() => `translateY(-${minuteTensRollIndex.value}em)`)
const minuteUnitsTransform = computed(() => `translateY(-${minuteUnitsRollIndex.value}em)`)
const secondTensTransform = computed(() => `translateY(-${secondTensRollIndex.value}em)`)
const secondUnitsTransform = computed(() => `translateY(-${secondUnitsRollIndex.value}em)`)
const hourTensTransition = computed(() => hourTensRollDurationMs.value > 0 ? `transform ${hourTensRollDurationMs.value}ms ${DIGIT_SEQUENCE_EASE}` : 'none')
const hourUnitsTransition = computed(() => hourUnitsRollDurationMs.value > 0 ? `transform ${hourUnitsRollDurationMs.value}ms ${DIGIT_SEQUENCE_EASE}` : 'none')
const minuteTensTransition = computed(() => minuteTensRollDurationMs.value > 0 ? `transform ${minuteTensRollDurationMs.value}ms ${DIGIT_SEQUENCE_EASE}` : 'none')
const minuteUnitsTransition = computed(() => minuteUnitsRollDurationMs.value > 0 ? `transform ${minuteUnitsRollDurationMs.value}ms ${DIGIT_SEQUENCE_EASE}` : 'none')
const secondTensTransition = computed(() => secondTensRollDurationMs.value > 0 ? `transform ${secondTensRollDurationMs.value}ms ${DIGIT_SEQUENCE_EASE}` : 'none')
const secondUnitsTransition = computed(() => secondUnitsRollDurationMs.value > 0 ? `transform ${secondUnitsRollDurationMs.value}ms ${DIGIT_SEQUENCE_EASE}` : 'none')

const DEFAULT_HITOKOTO = '死亡是涅灭，亦或是永恒？'
const hitokoto = ref(DEFAULT_HITOKOTO)

const updateHitokoto = async () => {
  hitokoto.value = await fetchHitokoto(DEFAULT_HITOKOTO)
}

const updateTimer = () => {
  const now = new Date()
  const diff = now.getTime() - SITE_START_AT.getTime()

  const millisecondsPerYear =
    MILLISECOND_PER_SECOND * SECOND_PER_MINUTE * MINUTE_PER_HOUR * HOUR_PER_DAY * DAY_PER_YEAR
  const millisecondsPerDay =
    MILLISECOND_PER_SECOND * SECOND_PER_MINUTE * MINUTE_PER_HOUR * HOUR_PER_DAY
  const millisecondsPerHour = MILLISECOND_PER_SECOND * SECOND_PER_MINUTE * MINUTE_PER_HOUR
  const millisecondsPerMinute = MILLISECOND_PER_SECOND * SECOND_PER_MINUTE
  years.value = Math.floor(diff / millisecondsPerYear)
  const remainingAfterYears = diff % millisecondsPerYear
  
  days.value = Math.floor(remainingAfterYears / millisecondsPerDay)
  hours.value = Math.floor((remainingAfterYears % millisecondsPerDay) / millisecondsPerHour)
  minutes.value = Math.floor((remainingAfterYears % millisecondsPerHour) / millisecondsPerMinute)
  seconds.value = Math.floor((remainingAfterYears % millisecondsPerMinute) / MILLISECOND_PER_SECOND)
}

function toDigit(value: string): number {
  const numericValue = Number.parseInt(value, 10)
  if (Number.isNaN(numericValue)) {
    return 0
  }
  return Math.min(9, Math.max(0, numericValue))
}

function toDescendingOffset(digit: number): number {
  return (DIGIT_SEQUENCE_SIZE - 1) - digit
}

function getDigitFromRollIndex(index: number): number {
  const normalizedOffset = (((index - DIGIT_MIDDLE_OFFSET) % DIGIT_SEQUENCE_SIZE) + DIGIT_SEQUENCE_SIZE) % DIGIT_SEQUENCE_SIZE
  return (DIGIT_SEQUENCE_SIZE - 1) - normalizedOffset
}

function setRollIndexImmediately(indexRef: { value: number }, durationRef: { value: number }, digit: number): void {
  durationRef.value = 0
  indexRef.value = DIGIT_MIDDLE_OFFSET + toDescendingOffset(digit)
}

const rollPositions = {
  'hour-tens': [hourTensRollIndex, hourTensRollDurationMs],
  'hour-units': [hourUnitsRollIndex, hourUnitsRollDurationMs],
  'minute-tens': [minuteTensRollIndex, minuteTensRollDurationMs],
  'minute-units': [minuteUnitsRollIndex, minuteUnitsRollDurationMs],
  'second-tens': [secondTensRollIndex, secondTensRollDurationMs],
  'second-units': [secondUnitsRollIndex, secondUnitsRollDurationMs]
} as const

type RollPositionKey = keyof typeof rollPositions

function normalizeRollPosition(key: RollPositionKey): void {
  const [indexRef, durationRef] = rollPositions[key]
  if (
    indexRef.value >= DIGIT_MIDDLE_OFFSET
    && indexRef.value < DIGIT_MIDDLE_OFFSET + DIGIT_SEQUENCE_SIZE
  ) {
    return
  }

  setRollIndexImmediately(indexRef, durationRef, getDigitFromRollIndex(indexRef.value))
}

function applyForwardRoll(indexRef: { value: number }, durationRef: { value: number }, nextDigit: number): void {
  const currentDigit = getDigitFromRollIndex(indexRef.value)
  if (currentDigit === nextDigit) {
    durationRef.value = 0
    return
  }

  if (nextDigit < currentDigit) {
    durationRef.value = DIGIT_WRAP_DURATION_MS
    indexRef.value += currentDigit - nextDigit
    return
  }

  const forwardStep = nextDigit - currentDigit
  durationRef.value = DIGIT_STEP_DURATION_MS
  indexRef.value -= forwardStep
}

function updateDiscreteClockDigits(): void {
  const [nextHourTens = '0', nextHourUnits = '0'] = hourText.value.split('')
  const [nextMinuteTens = '0', nextMinuteUnits = '0'] = minuteText.value.split('')
  const [nextSecondTens = '0', nextSecondUnits = '0'] = secondText.value.split('')

  applyForwardRoll(hourTensRollIndex, hourTensRollDurationMs, toDigit(nextHourTens))
  applyForwardRoll(hourUnitsRollIndex, hourUnitsRollDurationMs, toDigit(nextHourUnits))
  applyForwardRoll(minuteTensRollIndex, minuteTensRollDurationMs, toDigit(nextMinuteTens))
  applyForwardRoll(minuteUnitsRollIndex, minuteUnitsRollDurationMs, toDigit(nextMinuteUnits))
  applyForwardRoll(secondTensRollIndex, secondTensRollDurationMs, toDigit(nextSecondTens))
  applyForwardRoll(secondUnitsRollIndex, secondUnitsRollDurationMs, toDigit(nextSecondUnits))
}

watch([hourText, minuteText, secondText], () => {
  updateDiscreteClockDigits()
})

function clearTimer(): void {
  if (timer === null) return
  window.clearTimeout(timer)
  timer = null
}

function scheduleTimerTick(): void {
  updateTimer()
  const delayUntilNextSecond = 1000 - (Date.now() % 1000) + 16
  timer = window.setTimeout(scheduleTimerTick, delayUntilNextSecond)
}

function handleVisibilityChange(): void {
  if (document.visibilityState !== 'visible') return
  clearTimer()
  scheduleTimerTick()
}

onMounted(() => {
  if (!isBrowser) return

  updateTimer()
  setRollIndexImmediately(hourTensRollIndex, hourTensRollDurationMs, toDigit(hourText.value[0] ?? '0'))
  setRollIndexImmediately(hourUnitsRollIndex, hourUnitsRollDurationMs, toDigit(hourText.value[1] ?? '0'))
  setRollIndexImmediately(minuteTensRollIndex, minuteTensRollDurationMs, toDigit(minuteText.value[0] ?? '0'))
  setRollIndexImmediately(minuteUnitsRollIndex, minuteUnitsRollDurationMs, toDigit(minuteText.value[1] ?? '0'))
  setRollIndexImmediately(secondTensRollIndex, secondTensRollDurationMs, toDigit(secondText.value[0] ?? '0'))
  setRollIndexImmediately(secondUnitsRollIndex, secondUnitsRollDurationMs, toDigit(secondText.value[1] ?? '0'))
  scheduleTimerTick()
  document.addEventListener('visibilitychange', handleVisibilityChange)

  void updateHitokoto()
})

onBeforeUnmount(() => {
  if (!isBrowser) return
  clearTimer()
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<template>
  <footer v-if="!hasSidebar" class="VPFooter">
    <div class="container">
      <div class="footer-content">
        <div class="left-content">
          <p class="timer">
            <span class="timer-prefix">孤狼踏雪，已行于世间</span><br class="timer-break">
            <span class="timer-count">第
              <span v-if="years > 0" class="time-unit-group">
                <span class="time-unit">{{ years }}</span><span class="time-unit-label">年</span>
              </span>
              <span class="time-unit-group">
                <span class="time-unit">{{ days }}</span><span class="time-unit-label">天</span>
              </span>
              <span class="time-unit-group">
                <span class="time-unit time-unit-fixed time-roll-group" aria-label="时">
                <span class="time-roll-window">
                  <span class="time-roll-strip" :style="{ transform: hourTensTransform, transition: hourTensTransition }" @transitionend="normalizeRollPosition('hour-tens')">
                    <span v-for="(digit, index) in ROLL_DIGIT_SEQUENCE" :key="`hour-tens-digit-${index}`" class="time-roll-digit">
                      {{ digit }}
                    </span>
                  </span>
                </span>
                <span class="time-roll-window">
                  <span class="time-roll-strip" :style="{ transform: hourUnitsTransform, transition: hourUnitsTransition }" @transitionend="normalizeRollPosition('hour-units')">
                    <span v-for="(digit, index) in ROLL_DIGIT_SEQUENCE" :key="`hour-units-digit-${index}`" class="time-roll-digit">
                      {{ digit }}
                    </span>
                  </span>
                </span>
                </span><span class="time-unit-label">时</span>
              </span>
              <span class="time-unit-group">
                <span class="time-unit time-unit-fixed time-roll-group" aria-label="分">
                <span class="time-roll-window">
                  <span class="time-roll-strip" :style="{ transform: minuteTensTransform, transition: minuteTensTransition }" @transitionend="normalizeRollPosition('minute-tens')">
                    <span v-for="(digit, index) in ROLL_DIGIT_SEQUENCE" :key="`minute-tens-digit-${index}`" class="time-roll-digit">
                      {{ digit }}
                    </span>
                  </span>
                </span>
                <span class="time-roll-window">
                  <span class="time-roll-strip" :style="{ transform: minuteUnitsTransform, transition: minuteUnitsTransition }" @transitionend="normalizeRollPosition('minute-units')">
                    <span v-for="(digit, index) in ROLL_DIGIT_SEQUENCE" :key="`minute-units-digit-${index}`" class="time-roll-digit">
                      {{ digit }}
                    </span>
                  </span>
                </span>
                </span><span class="time-unit-label">分</span>
              </span>
              <span class="time-unit-group time-unit-group-last">
                <span class="time-value time-unit-fixed" aria-label="秒">
                <span class="time-roll-window">
                  <span class="time-roll-strip" :style="{ transform: secondTensTransform, transition: secondTensTransition }" @transitionend="normalizeRollPosition('second-tens')">
                    <span v-for="(digit, index) in ROLL_DIGIT_SEQUENCE" :key="`second-tens-digit-${index}`" class="time-roll-digit">
                      {{ digit }}
                    </span>
                  </span>
                </span>
                <span class="time-roll-window">
                  <span class="time-roll-strip" :style="{ transform: secondUnitsTransform, transition: secondUnitsTransition }" @transitionend="normalizeRollPosition('second-units')">
                    <span v-for="(digit, index) in ROLL_DIGIT_SEQUENCE" :key="`second-units-digit-${index}`" class="time-roll-digit">
                      {{ digit }}
                    </span>
                  </span>
                </span>
                </span><span class="time-unit-label">秒</span>
              </span>
            </span>
          </p>
          <p class="credits">
            <span>Powered by <a href="https://www.netlify.com/" target="_blank" rel="noreferrer noopener">netlify</a> | </span>
            <span>Theme by <a href="https://vitepress.dev/" target="_blank" rel="noreferrer noopener">vitepress</a> | </span>
            <span>
              <a href="https://beian.miit.gov.cn/" target="_blank" rel="noreferrer noopener">
                蜀ICP备2026024065号
              </a>
            </span>
          </p>
        </div>
        
        <div class="right-content">
          <p class="copyright">© {{ yearString }} <a href="/about">Wreckloud</a>.</p>
          <p class="motto">{{ hitokoto }}</p>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.VPFooter {
  border-top: 1px solid var(--vp-c-gutter);
  padding: 24px 24px;
  background-color: var(--vp-c-bg);
}

.container {
  margin: 0 auto;
  max-width: 1152px;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.left-content, .right-content {
  flex: 1;
}

.left-content {
  text-align: left;
}

.right-content {
  text-align: right;
}

.copyright, .timer, .motto, .credits {
  margin: 4px 0;
  line-height: 1.6;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-3);
}

.timer-prefix {
  display: inline-block;
}

.timer-count {
  display: inline-block;
}

@media (min-width: 769px) {
  .timer-break {
    display: none;
  }
}

@media (max-width: 768px) {
  .timer-break {
    display: block;
  }
}

.time-unit {
  display: inline-block;
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
  font-variant-numeric: tabular-nums lining-nums;
  font-feature-settings: 'tnum' 1, 'lnum' 1;
}

.time-unit-fixed {
  width: var(--lc-time-2digit-width);
  min-width: var(--lc-time-2digit-width);
  max-width: var(--lc-time-2digit-width);
  text-align: center;
}

.time-value {
  display: inline-block;
  min-width: var(--lc-time-2digit-width);
  white-space: nowrap;
  text-align: center;
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
  font-variant-numeric: tabular-nums lining-nums;
  font-feature-settings: 'tnum' 1, 'lnum' 1;
  color: var(--lc-c-accent);
}

.time-unit-group {
  display: inline-flex;
  align-items: baseline;
  margin-right: 0.52em;
}

.time-unit-group-last {
  margin-right: 0;
}

.time-unit-label {
  display: inline-block;
  margin-left: 0.14em;
}

.time-roll-group {
  display: inline-block;
  min-width: var(--lc-time-2digit-width);
  white-space: nowrap;
}

.time-roll-window {
  display: inline-flex;
  width: calc(var(--lc-time-2digit-width) / 2);
  height: 1em;
  overflow: hidden;
}

.time-roll-strip {
  display: flex;
  min-width: calc(var(--lc-time-2digit-width) / 2);
  flex-direction: column;
  will-change: transform;
}

.time-roll-digit {
  display: inline-flex;
  width: calc(var(--lc-time-2digit-width) / 2);
  height: 1em;
  min-height: 1em;
  align-items: center;
  justify-content: center;
  line-height: 1;
  text-align: center;
}

.VPFooter a {
  color: var(--vp-c-text-2);
  text-decoration: none;
  transition: color var(--lc-motion-duration-normal) var(--lc-motion-ease-standard);
}

.VPFooter a:hover {
  color: var(--vp-c-text-1);
}

@media (max-width: 768px) {
  .footer-content {
    flex-direction: column;
  }
  
  .left-content, .right-content {
    text-align: center;
    margin: 0 auto;
  }
  
  .left-content {
    margin-bottom: 12px;
  }
}
</style> 
