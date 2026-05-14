/**
 * 推荐阅读数据源：
 * - 优先读取预生成 recommended-posts.json
 * - 缺失时退回 posts.json 按配置路径映射
 */
import {
  fetchJson,
  fetchSitePosts,
  type BasePathResolver,
  type ThoughtPost
} from '../content/contentData'
import { logError } from '../logger'

export interface RecommendedPost {
  url: string
  title: string
  description: string
  date: string
  tags: string[]
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

// 统一字段，确保推荐卡片可安全渲染。
function normalizePost(post: ThoughtPost): RecommendedPost | null {
  if (!post?.url || !post?.frontmatter?.title || !post?.frontmatter?.date) {
    return null
  }

  return {
    url: post.url,
    title: post.frontmatter.title,
    description: post.frontmatter.description || post.excerpt || '',
    date: post.frontmatter.date,
    tags: isStringArray(post.frontmatter.tags) ? post.frontmatter.tags : []
  }
}

// 仅保留配置中声明的文章，避免推荐区出现意外内容。
function mapConfiguredPosts(allPosts: ThoughtPost[], configuredPaths: string[]): RecommendedPost[] {
  return configuredPaths
    .map((postPath) => {
      const originalPost = allPosts.find((post) => post.url === postPath)
      return originalPost ? normalizePost(originalPost) : null
    })
    .filter((post): post is RecommendedPost => post !== null)
}

export async function fetchRecommendedPosts(
  withBase: BasePathResolver,
  configuredPaths: string[],
  maxPosts: number
): Promise<RecommendedPost[]> {
  try {
    const prebuilt = await fetchJson<RecommendedPost[]>(withBase, '/recommended-posts.json')
    if (Array.isArray(prebuilt) && prebuilt.length > 0) {
      return prebuilt.slice(0, maxPosts)
    }
  } catch {
    // Fallback to full posts list below.
  }

  try {
    const allPosts = await fetchSitePosts(withBase)
    return mapConfiguredPosts(allPosts, configuredPaths).slice(0, maxPosts)
  } catch (error) {
    logError('recommendedApi', '加载推荐文章数据失败', error)
    return []
  }
}
