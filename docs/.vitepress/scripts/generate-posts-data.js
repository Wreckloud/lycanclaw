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
  let existingPosts = []
  
  if (fs.existsSync(postsJsonPath)) {
    postsJsonModTime = fs.statSync(postsJsonPath).mtimeMs
    try {
      // 读取现有的posts.json文件
      const postsJsonContent = fs.readFileSync(postsJsonPath, 'utf-8')
      existingPosts = JSON.parse(postsJsonContent)
    } catch (err) {
      // 如果解析失败，视为需要重新生成
      existingPosts = []
    }
  }
  
  // 读取所有markdown文件并检查是否有更新
  const files = fs.readdirSync(thoughtsDir)
  const mdFiles = files.filter(file => file.endsWith('.md') && file !== 'index.md')
  
  // 检查是否有文件变化（新增、修改或删除）
  let needsUpdate = !fs.existsSync(postsJsonPath)
  
  // 检查是否有文件被删除
  if (!needsUpdate && existingPosts.length > 0) {
    const existingFilePaths = existingPosts.map(post => post.relativePath.replace('thoughts/', ''))
    const currentFilePaths = mdFiles
    
    // 如果有文件被删除，需要更新
    if (existingFilePaths.some(file => !currentFilePaths.includes(file))) {
      needsUpdate = true
    }
  }
  
  // 检查是否有新文件或修改的文件
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
    
    // 直接从文件内容中提取原始日期字符串
    const dateMatch = content.match(/date:\s*(['"]?)([^\n]+)\1/)
    const originalDate = dateMatch && dateMatch[2] ? dateMatch[2].trim() : null
    
    // 使用gray-matter解析frontmatter
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

    // 使用原始日期字符串替换frontmatter中的日期
    if (originalDate) {
      // 确保日期是字符串格式，而不是Date对象
      frontmatter.date = originalDate
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
      frontmatter: {
        ...frontmatter,
        // 确保日期是原始字符串
        date: originalDate || frontmatter.date
      },
      content: markdownContent,
      relativePath: 'thoughts/' + file,
      excerpt: extractedExcerpt
    }
  })

  // 按日期排序（从新到旧）
  posts.sort((a, b) => {
    if (!a.frontmatter.date) return 1
    if (!b.frontmatter.date) return -1
    
    // 处理可能带引号的日期字符串
    const dateStrA = String(a.frontmatter.date).replace(/^['"]|['"]$/g, '')
    const dateStrB = String(b.frontmatter.date).replace(/^['"]|['"]$/g, '')
    
    // 提取年月日时分秒
    const getDateParts = (dateStr) => {
      const match = dateStr.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/)
      if (match) {
        return {
          year: parseInt(match[1], 10),
          month: parseInt(match[2], 10),
          day: parseInt(match[3], 10),
          hour: parseInt(match[4], 10),
          minute: parseInt(match[5], 10),
          second: parseInt(match[6], 10)
        }
      }
      return null
    }
    
    const datePartsA = getDateParts(dateStrA)
    const datePartsB = getDateParts(dateStrB)
    
    // 如果无法解析日期，则使用Date对象比较
    if (!datePartsA || !datePartsB) {
      return new Date(dateStrB) - new Date(dateStrA)
    }
    
    // 按年、月、日、时、分、秒依次比较
    if (datePartsA.year !== datePartsB.year) return datePartsB.year - datePartsA.year
    if (datePartsA.month !== datePartsB.month) return datePartsB.month - datePartsA.month
    if (datePartsA.day !== datePartsB.day) return datePartsB.day - datePartsA.day
    if (datePartsA.hour !== datePartsB.hour) return datePartsB.hour - datePartsA.hour
    if (datePartsA.minute !== datePartsB.minute) return datePartsB.minute - datePartsA.minute
    return datePartsB.second - datePartsA.second
  })

  // 将数据写入JSON文件
  fs.writeFileSync(
    postsJsonPath,
    JSON.stringify(posts, null, 2),
    'utf-8'
  )

} catch (error) {
  // 仅在出错时输出信息，更易于调试
  console.error('生成文章数据时出错:', error)
  process.exit(1)
} 