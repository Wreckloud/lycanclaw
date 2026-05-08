const THOUGHTS_PREFIX = 'thoughts/'
const THOUGHTS_INDEX_PATH = 'thoughts/index.md'
const THOUGHTS_TAGS_PATH = 'thoughts/tags.md'

function isPublishedThoughtPost(post) {
  return (
    post?.frontmatter?.publish === true &&
    typeof post?.relativePath === 'string' &&
    post.relativePath.startsWith(THOUGHTS_PREFIX) &&
    post.relativePath !== THOUGHTS_INDEX_PATH &&
    post.relativePath !== THOUGHTS_TAGS_PATH
  )
}

export async function fetchJson(withBase, path) {
  const response = await fetch(withBase(path))
  if (!response.ok) {
    throw new Error(`加载数据失败: ${path}`)
  }
  return response.json()
}

export async function fetchSitePosts(withBase) {
  return fetchJson(withBase, '/posts.json')
}

export async function fetchPublishedThoughtPosts(withBase) {
  const posts = await fetchSitePosts(withBase)
  return posts.filter(isPublishedThoughtPost)
}

export async function fetchKnowledgeStats(withBase) {
  try {
    return await fetchJson(withBase, '/knowledge-stats.json')
  } catch {
    return []
  }
}
