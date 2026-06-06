<script setup lang="ts">
/**
 * 猎识印记概念云图。
 *
 * 读取知识笔记构建数据，以 tag 频次生成椭圆形概念云和概览统计。
 */

import { computed, onMounted, ref } from 'vue'
import { withBase } from 'vitepress'
import { fetchKnowledgeStats, type KnowledgeStatRecord } from '../../utils/content'
import { logError } from '../../utils/logger'

interface TagStat {
  name: string
  count: number
  wordCount: number
  weight: number
}

interface CloudTag extends TagStat {
  x: number
  y: number
  size: number
  opacity: number
  rotate: number
  zIndex: number
}

interface RecentContact {
  name: string
  count: number
}

const MAX_CLOUD_TAGS = 56
const RECENT_RECORD_LIMIT = 8
const CLOUD_ANCHORS: Array<[number, number]> = [
  [50, 50],
  [34, 42],
  [66, 57],
  [61, 38],
  [42, 64],
  [27, 55],
  [73, 43],
  [49, 29],
  [52, 72],
  [22, 39],
  [79, 61],
  [31, 72],
  [70, 27],
  [18, 61],
  [83, 38],
  [40, 25],
  [61, 76],
  [24, 25],
  [87, 72],
  [13, 48]
]

const records = ref<KnowledgeStatRecord[]>([])
const isLoading = ref(true)

const publishedRecords = computed(() =>
  records.value.filter(record => Array.isArray(record.tags) && record.tags.length > 0)
)

const totalWords = computed(() =>
  publishedRecords.value.reduce((total, record) => total + Number(record.wordCount || 0), 0)
)

const tagStats = computed<TagStat[]>(() => {
  const map = new Map<string, TagStat>()

  for (const record of publishedRecords.value) {
    const tags = record.tags || []

    for (const tag of tags) {
      const name = tag.trim()
      if (!name) continue

      const current = map.get(name) || {
        name,
        count: 0,
        wordCount: 0,
        weight: 0
      }
      current.count += 1
      current.wordCount += Number(record.wordCount || 0)
      map.set(name, current)
    }
  }

  const stats = Array.from(map.values()).sort((a, b) =>
    b.count - a.count ||
    b.wordCount - a.wordCount ||
    a.name.localeCompare(b.name, 'zh-Hans-CN')
  )
  const maxCount = Math.max(1, stats[0]?.count || 1)

  return stats.map(stat => ({
    ...stat,
    weight: stat.count / maxCount
  }))
})

const cloudTags = computed<CloudTag[]>(() => {
  const tags = tagStats.value.slice(0, MAX_CLOUD_TAGS)
  const total = Math.max(1, tags.length - 1)

  return tags
    .map((tag, index) => {
      const point = getCloudPoint(tag.name, index, total)
      const size = 0.62 + Math.pow(Math.max(0.03, tag.weight), 0.74) * 3.18
      const opacity = 0.28 + Math.pow(Math.max(0.03, tag.weight), 0.44) * 0.68
      const rotate = ((tagHash(tag.name) % 17) - 8) * 1.25

      return {
        ...tag,
        x: point[0],
        y: point[1],
        size,
        opacity,
        rotate,
        zIndex: MAX_CLOUD_TAGS - index
      }
    })
    .sort((a, b) => a.zIndex - b.zIndex)
})

const recentContact = computed<RecentContact>(() => {
  const recentRecords = [...publishedRecords.value]
    .sort((a, b) => parseRecordTime(b.date) - parseRecordTime(a.date))
    .slice(0, RECENT_RECORD_LIMIT)
  const map = new Map<string, { count: number; latestTime: number }>()

  for (const record of recentRecords) {
    const time = parseRecordTime(record.date)
    for (const tag of record.tags || []) {
      const name = tag.trim()
      if (!name) continue

      const current = map.get(name) || { count: 0, latestTime: 0 }
      current.count += 1
      current.latestTime = Math.max(current.latestTime, time)
      map.set(name, current)
    }
  }

  const [name, stat] = Array.from(map.entries()).sort((a, b) =>
    b[1].count - a[1].count ||
    b[1].latestTime - a[1].latestTime ||
    a[0].localeCompare(b[0], 'zh-Hans-CN')
  )[0] || ['暂无', { count: 0 }]

  return {
    name,
    count: stat.count
  }
})

const cloudDescription = computed(() =>
  tagStats.value
    .slice(0, 8)
    .map(tag => `${tag.name} ${tag.count} 篇`)
    .join('，')
)

function formatNumber(value: number): string {
  if (value >= 10000) return `${(value / 10000).toFixed(1)}w`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`
  return String(value)
}

function tagHash(value: string): number {
  return Array.from(value).reduce((hash, char) => {
    return (hash * 31 + char.charCodeAt(0)) % 997
  }, 7)
}

function getCloudPoint(name: string, index: number, total: number): [number, number] {
  if (index < CLOUD_ANCHORS.length) return CLOUD_ANCHORS[index]

  const overflowIndex = index - CLOUD_ANCHORS.length
  const overflowTotal = Math.max(1, total - CLOUD_ANCHORS.length)
  const radius = 0.48 + Math.sqrt(overflowIndex / overflowTotal) * 0.52
  const angle = overflowIndex * 2.399963229728653 + tagHash(name) * 0.008

  return [
    50 + Math.cos(angle) * radius * 45,
    50 + Math.sin(angle) * radius * 34
  ]
}

function parseRecordTime(value?: string): number {
  if (!value) return 0

  const direct = Date.parse(value)
  if (!Number.isNaN(direct)) return direct

  const normalized = Date.parse(value.replace(' ', 'T'))
  return Number.isNaN(normalized) ? 0 : normalized
}

function cloudTagStyle(tag: CloudTag): Record<string, string> {
  return {
    '--tag-x': `${tag.x.toFixed(2)}%`,
    '--tag-y': `${tag.y.toFixed(2)}%`,
    '--tag-size': `${tag.size.toFixed(2)}rem`,
    '--tag-opacity': tag.opacity.toFixed(2),
    '--tag-rotate': `${tag.rotate.toFixed(2)}deg`,
    '--tag-z-index': String(tag.zIndex)
  }
}

onMounted(async () => {
  try {
    records.value = await fetchKnowledgeStats(withBase)
  } catch (error) {
    logError('KnowledgeTagAtlas', '加载知识标签统计失败', error)
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <section class="knowledge-tag-atlas" aria-label="猎识印记标签统计">
    <div v-if="isLoading" class="atlas-empty">正在绘制概念云图...</div>

    <template v-else>
      <div class="tag-cloud-panel" aria-label="知识标签云图">
        <div
          class="tag-cloud"
          role="list"
          :aria-label="cloudDescription"
        >
          <span
            v-for="tag in cloudTags"
            :key="tag.name"
            role="listitem"
            class="tag-orb"
            :style="cloudTagStyle(tag)"
            :aria-label="`${tag.name}，${tag.count} 篇相关笔记`"
          >
            {{ tag.name }}
          </span>
        </div>
      </div>

      <div class="atlas-stats">
        <div class="stat-card">
          <span class="stat-value">{{ publishedRecords.length }}</span>
          <span class="stat-label">领域笔记</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ tagStats.length }}</span>
          <span class="stat-label">知识标签</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ formatNumber(totalWords) }}</span>
          <span class="stat-label">沉淀字数</span>
        </div>
        <div class="stat-card">
          <span class="stat-value stat-value--tag">{{ recentContact.name }}</span>
          <span class="stat-label">最近接触</span>
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.knowledge-tag-atlas {
  margin-top: 2rem;
  color: var(--vp-c-text-1);
}

.atlas-empty {
  padding: 2rem 0;
  color: var(--vp-c-text-2);
  font-style: italic;
  text-align: center;
}

.atlas-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  margin: 1.1rem 0 0;
}

.stat-card {
  min-width: 0;
  padding: 1.5rem 0.5rem;
  border-radius: 8px;
  background-color: var(--vp-c-bg-soft);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  text-align: center;
  user-select: none;
}

.stat-value {
  display: block;
  color: var(--vp-c-brand-1);
  font-size: 1.8rem;
  line-height: 1;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.stat-label {
  display: block;
  margin-top: 0.55rem;
  color: var(--vp-c-text-2);
  font-size: 0.82rem;
}

.stat-value--tag {
  overflow: hidden;
  font-size: clamp(1.08rem, 2vw, 1.65rem);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag-cloud-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  min-height: 430px;
  padding: 1.4rem 0 1rem;
}

.tag-cloud {
  position: relative;
  width: min(100%, 780px);
  aspect-ratio: 1.85;
  min-height: 330px;
  overflow: hidden;
  -webkit-mask-image: radial-gradient(ellipse at center, #000 62%, rgba(0, 0, 0, 0.78) 78%, transparent 98%);
  mask-image: radial-gradient(ellipse at center, #000 62%, rgba(0, 0, 0, 0.78) 78%, transparent 98%);
}

.tag-orb {
  --tag-x: 50%;
  --tag-y: 50%;
  --tag-size: 1rem;
  --tag-opacity: 0.7;
  --tag-rotate: 0deg;
  --tag-z-index: 1;
  position: absolute;
  z-index: var(--tag-z-index);
  top: var(--tag-y);
  left: var(--tag-x);
  color: var(--vp-c-text-1);
  opacity: var(--tag-opacity);
  font-size: var(--tag-size);
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  transform: translate(-50%, -50%) rotate(var(--tag-rotate));
  transform-origin: center;
  user-select: none;
}

@media (max-width: 959px) {
  .atlas-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .tag-cloud-panel {
    min-height: 350px;
  }

  .tag-cloud {
    aspect-ratio: 1.45;
    min-height: 300px;
  }

  .tag-orb {
    font-size: calc(var(--tag-size) * 0.82);
  }
}

@media (max-width: 480px) {
  .atlas-stats {
    grid-template-columns: 1fr 1fr;
  }

  .tag-cloud {
    width: 100%;
    min-height: 250px;
  }

  .tag-cloud-panel {
    min-height: 280px;
    padding: 0.4rem 0;
  }

  .tag-orb {
    font-size: calc(var(--tag-size) * 0.68);
  }
}
</style>
