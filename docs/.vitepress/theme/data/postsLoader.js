import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const docsDir = path.resolve(__dirname, '../../../..')
const thoughtsDir = path.join(docsDir, 'thoughts')

/**
 * 自动加载thoughts目录下的所有文章
 * @returns {Array} 文章数据数组
 */
export function loadPosts() {
  const files = fs.readdirSync(thoughtsDir)
  
  // 过滤出markdown文件，排除index.md
  const mdFiles = files.filter(file => 
    file.endsWith('.md') && file !== 'index.md'
  )
  
  // 读取每个文件的内容和frontmatter
  const posts = mdFiles.map(file => {
    const filePath = path.join(thoughtsDir, file)
    const content = fs.readFileSync(filePath, 'utf-8')
    const { data: frontmatter, content: markdownContent, excerpt } = matter(content, {
      excerpt: true,
      excerpt_separator: '<!-- more -->'
    })
    
    // 确保tags是数组格式
    if (frontmatter.tags && typeof frontmatter.tags === 'string') {
      frontmatter.tags = frontmatter.tags.split(',').map(tag => tag.trim())
    } else if (!frontmatter.tags) {
      frontmatter.tags = []
    }

    // 从内容中提取摘要（如果没有指定摘要分隔符）
    let extractedExcerpt = excerpt || ''
    if (!extractedExcerpt) {
      // 从内容中提取第一段落作为摘要
      const firstParagraph = markdownContent.split('\n\n')[0]
      extractedExcerpt = firstParagraph.replace(/^#+\s+.+\n/, '').trim() // 移除标题
      
      // 如果摘要太长，截断它
      if (extractedExcerpt.length > 200) {
        extractedExcerpt = extractedExcerpt.substring(0, 200) + '...'
      }
    }
    
    return {
      url: '/' + path.join('thoughts', file.replace('.md', '.html')),
      frontmatter,
      content: markdownContent,
      relativePath: path.join('thoughts', file),
      excerpt: extractedExcerpt
    }
  })
  
  // 按日期排序（从新到旧）
  return posts.sort((a, b) => {
    if (!a.frontmatter.date) return 1
    if (!b.frontmatter.date) return -1
    return new Date(b.frontmatter.date) - new Date(a.frontmatter.date)
  })
}

// 导出文章数据
export const posts = loadPosts() 