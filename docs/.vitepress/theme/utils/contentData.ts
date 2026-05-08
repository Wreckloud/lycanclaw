const THOUGHTS_PREFIX = 'thoughts/'
const THOUGHTS_INDEX_PATH = 'thoughts/index.md'
const THOUGHTS_TAGS_PATH = 'thoughts/tags.md'

export interface ThoughtPost {
  relativePath?: string
  content?: string
  url?: string
  excerpt?: string
  frontmatter?: {
    publish?: boolean
    date?: string
    title?: string
    description?: string
    tags?: string[]
    [key: string]: unknown
  }
  [key: string]: unknown
}

export interface KnowledgeStatRecord {
  date?: string
  wordCount?: number
  relativePath?: string
  [key: string]: unknown
}

export type BasePathResolver = (path: string) => string

function isPublishedThoughtPost(post: ThoughtPost): boolean {
  return (
    post?.frontmatter?.publish === true &&
    typeof post?.relativePath === 'string' &&
    post.relativePath.startsWith(THOUGHTS_PREFIX) &&
    post.relativePath !== THOUGHTS_INDEX_PATH &&
    post.relativePath !== THOUGHTS_TAGS_PATH
  )
}

export async function fetchJson<T>(withBase: BasePathResolver, path: string): Promise<T> {
  const response = await fetch(withBase(path))
  if (!response.ok) {
    throw new Error(`加载数据失败: ${path}`)
  }
  return response.json() as Promise<T>
}

export async function fetchSitePosts(withBase: BasePathResolver): Promise<ThoughtPost[]> {
  return fetchJson<ThoughtPost[]>(withBase, '/posts.json')
}

export async function fetchPublishedThoughtPosts(withBase: BasePathResolver): Promise<ThoughtPost[]> {
  const posts = await fetchSitePosts(withBase)
  return posts.filter(isPublishedThoughtPost)
}

export async function fetchKnowledgeStats(withBase: BasePathResolver): Promise<KnowledgeStatRecord[]> {
  try {
    return await fetchJson<KnowledgeStatRecord[]>(withBase, '/knowledge-stats.json')
  } catch {
    return []
  }
}
