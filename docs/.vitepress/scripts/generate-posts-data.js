// 生成博客文章数据脚本
// 用于开发时手动生成posts.json

import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { fileURLToPath } from 'url'

try {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const docsDir = path.resolve(__dirname, '../../')
  const thoughtsDir = path.join(docsDir, 'thoughts')
  const publicDir = path.join(docsDir, 'public')

  // 确保public目录存在
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true })
  }

  // 检查posts.json是否存在，获取其修改时间
  const postsJsonPath = path.join(publicDir, 'posts.json')
  let postsJsonModTime = 0
  if (fs.existsSync(postsJsonPath)) {
    postsJsonModTime = fs.statSync(postsJsonPath).mtimeMs
  }
  
  // 读取所有markdown文件并检查是否有更新
  const files = fs.readdirSync(thoughtsDir)
  const mdFiles = files.filter(file => file.endsWith('.md') && file !== 'index.md')
  
  // 检查是否有文件比posts.json更新
  let needsUpdate = !fs.existsSync(postsJsonPath)
  if (!needsUpdate) {
    for (const file of mdFiles) {
      const filePath = path.join(thoughtsDir, file)
      const fileModTime = fs.statSync(filePath).mtimeMs
      if (fileModTime > postsJsonModTime) {
        needsUpdate = true
        break
      }
    }
  }
  
  // 如果不需要更新，则直接返回
  if (!needsUpdate) {
    process.exit(0)
  }

  // 需要更新，生成新的数据
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

    // 确保date是标准格式
    if (frontmatter.date && !(frontmatter.date instanceof Date)) {
      try {
        frontmatter.date = new Date(frontmatter.date).toISOString()
      } catch (e) {
        // 如果日期格式无效，使用当前时间
        frontmatter.date = new Date().toISOString()
      }
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
    postsJsonPath,
    JSON.stringify(posts),
    'utf-8'
  )

  // 不再输出控制台信息
} catch (error) {
  // 仅在出错时输出信息，更易于调试
  console.error('生成文章数据时出错:', error)
  process.exit(1)
} 