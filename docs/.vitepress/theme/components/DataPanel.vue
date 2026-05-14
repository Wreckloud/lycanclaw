<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useSidebar } from 'vitepress/theme'
import { fetchHitokoto } from '../utils/siteApi'

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

const hourText = computed(() => formatTwoDigits(hours.value))
const minuteText = computed(() => formatTwoDigits(minutes.value))
const secondText = computed(() => formatTwoDigits(seconds.value))
const secondTensText = computed(() => secondText.value[0] ?? '0')
const secondUnitsText = computed(() => secondText.value[1] ?? '0')

const secondTensAnim = ref<'idle' | 'step' | 'wrap'>('idle')
const secondUnitsAnim = ref<'idle' | 'step' | 'wrap'>('idle')
const secondTensKey = ref(0)
const secondUnitsKey = ref(0)

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

function getDigitAnimationType(previousDigit: string, nextDigit: string): 'idle' | 'step' | 'wrap' {
  if (previousDigit === nextDigit) {
    return 'idle'
  }

  if (previousDigit === '9' && nextDigit === '0') {
    return 'wrap'
  }

  return 'step'
}

watch(secondText, (nextSecond, previousSecond) => {
  if (!previousSecond) {
    return
  }

  const [previousTens = '0', previousUnits = '0'] = previousSecond.split('')
  const [nextTens = '0', nextUnits = '0'] = nextSecond.split('')

  secondTensAnim.value = getDigitAnimationType(previousTens, nextTens)
  secondUnitsAnim.value = getDigitAnimationType(previousUnits, nextUnits)

  if (secondTensAnim.value !== 'idle') {
    secondTensKey.value += 1
  }

  if (secondUnitsAnim.value !== 'idle') {
    secondUnitsKey.value += 1
  }
})

onMounted(() => {
  if (!isBrowser) return

  updateTimer()
  timer = window.setInterval(updateTimer, 1000)

  void updateHitokoto()
})

onBeforeUnmount(() => {
  if (timer !== null && isBrowser) {
    clearInterval(timer)
    timer = null
  }
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
              <span v-if="years > 0" class="time-unit">{{ years }} 年 </span>&nbsp;
              <span class="time-unit">{{ days }}</span> 天 
              <span class="time-unit time-unit-fixed">{{ hourText }}</span> 时 
              <span class="time-unit time-unit-fixed">{{ minuteText }}</span> 分 
              <span class="time-value time-unit-fixed" aria-label="秒">
                <span class="time-roll-window">
                  <span
                    :key="`second-tens-${secondTensKey}-${secondTensText}`"
                    class="time-roll-value"
                    :class="`is-${secondTensAnim}`"
                  >
                    {{ secondTensText }}
                  </span>
                </span>
                <span class="time-roll-window">
                  <span
                    :key="`second-units-${secondUnitsKey}-${secondUnitsText}`"
                    class="time-roll-value"
                    :class="`is-${secondUnitsAnim}`"
                  >
                    {{ secondUnitsText }}
                  </span>
                </span>
              </span> 秒
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

.time-roll-window {
  display: inline-flex;
  width: calc(var(--lc-time-2digit-width) / 2);
  overflow: hidden;
  line-height: 1;
}

.time-roll-value {
  display: inline-block;
  min-width: calc(var(--lc-time-2digit-width) / 2);
  text-align: center;
  will-change: transform, opacity;
}

.time-roll-value.is-step {
  animation: timer-roll-step var(--lc-motion-duration-fast) var(--lc-motion-ease-emphasis) both;
}

.time-roll-value.is-wrap {
  animation: timer-roll-wrap 260ms cubic-bezier(0.2, 0.72, 0, 1) both;
}

@keyframes timer-roll-step {
  from {
    opacity: 0;
    transform: translateY(-0.35em);
    filter: blur(0.4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
}

@keyframes timer-roll-wrap {
  0% {
    opacity: 0.75;
    transform: translateY(-0.65em) scale(1.02);
    filter: blur(0.6px);
  }
  55% {
    opacity: 1;
    transform: translateY(0.08em) scale(0.98);
    filter: blur(0);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
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
