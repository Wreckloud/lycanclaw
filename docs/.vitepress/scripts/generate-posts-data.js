// 生成博客文章数据脚本
// 用于开发时手动生成posts.json

import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const docsDir = path.resolve(__dirname, '../../')
const thoughtsDir = path.join(docsDir, 'thoughts')
const publicDir = path.join(docsDir, 'public')

// 确保public目录存在
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true })
}

// 读取thoughts目录下的所有markdown文件
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
    url: '/thoughts/' + file.replace('.md', '.html'),
    frontmatter,
    content: markdownContent,
    relativePath: 'thoughts/' + file,
    excerpt: extractedExcerpt
  }
})

// 按日期排序（从新到旧）
posts.sort((a, b) => {
  if (!a.frontmatter.date) return 1
  if (!b.frontmatter.date) return -1
  return new Date(b.frontmatter.date) - new Date(a.frontmatter.date)
})

// 写入JSON文件
fs.writeFileSync(
  path.join(publicDir, 'posts.json'),
  JSON.stringify(posts),
  'utf-8'
)

console.log(`成功生成了 ${posts.length} 篇文章的数据到 public/posts.json`) 