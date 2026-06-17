<script setup lang="ts">
/**
 * 猎识印记概念云图。
 *
 * 读取知识笔记构建数据，以 tag 频次生成椭圆形概念云。
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
  zIndex: number
}

const MAX_CLOUD_TAGS = 56
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

      return {
        ...tag,
        x: point[0],
        y: point[1],
        size,
        zIndex: MAX_CLOUD_TAGS - index
      }
    })
    .sort((a, b) => a.zIndex - b.zIndex)
})

const cloudDescription = computed(() =>
  tagStats.value
    .slice(0, 8)
    .map(tag => `${tag.name} ${tag.count} 篇`)
    .join('，')
)

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

function cloudTagStyle(tag: CloudTag): Record<string, string> {
  const accentRatio = Math.round(18 + tag.weight * 42)

  return {
    '--tag-x': `${tag.x.toFixed(2)}%`,
    '--tag-y': `${tag.y.toFixed(2)}%`,
    '--tag-size': `${tag.size.toFixed(2)}rem`,
    '--tag-accent-ratio': `${accentRatio}%`,
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
  --tag-accent-ratio: 36%;
  --tag-z-index: 1;
  position: absolute;
  z-index: var(--tag-z-index);
  top: var(--tag-y);
  left: var(--tag-x);
  color: color-mix(in srgb, var(--vp-c-brand-1) var(--tag-accent-ratio), var(--vp-c-text-1));
  font-size: var(--tag-size);
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  text-shadow:
    0 1px 0 var(--vp-c-bg),
    1px 0 0 var(--vp-c-bg),
    -1px 0 0 var(--vp-c-bg);
  transform: translate(-50%, -50%);
  transform-origin: center;
  user-select: none;
}

@media (max-width: 959px) {
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
