<script setup lang="ts">
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'

const { frontmatter, page } = useData()

const tags = computed(() => {
  const source = frontmatter.value.tags
  if (!Array.isArray(source)) return []
  return source
    .filter((tag): tag is string => typeof tag === 'string')
    .map((tag) => tag.trim())
    .filter(Boolean)
})

const showTags = computed(() => page.value.relativePath.startsWith('thoughts/') && tags.value.length > 0)

function buildTagUrl(tag: string): string {
  return withBase(`/thoughts/?tag=${encodeURIComponent(tag)}`)
}
</script>

<template>
  <div v-if="showTags" class="article-tags-footer">
    <a
      v-for="tag in tags"
      :key="tag"
      class="article-tag-link"
      :href="buildTagUrl(tag)"
    >
      #{{ tag }}
    </a>
  </div>
</template>

<style scoped>
.article-tags-footer {
  margin-top: 6px;
  margin-bottom: 6px;
  line-height: 24px;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-2);
}

.article-tag-link {
  margin-right: 10px;
  color: inherit;
  text-decoration: none;
  transition: color var(--lc-motion-duration-fast) var(--lc-motion-ease-standard);
}

.article-tag-link:hover {
  color: var(--vp-c-brand-1);
}

@media (min-width: 640px) {
  .article-tags-footer {
    line-height: 32px;
  }
}
</style>
