// 统一生成网站数据脚本
// 处理博客文章和知识笔记的数据生成

import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { fileURLToPath } from 'url'

// 统计字数的函数
function countWord(data) {
  const pattern = /[a-zA-Z0-9_\u0392-\u03C9\u00C0-\u00FF\u0600-\u06FF\u0400-\u04FF]+|[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF\u3040-\u309F\uAC00-\uD7AF]+/g
  const m = data.match(pattern)
  let count = 0
  if (!m) {
    return 0
  }
  for (let i = 0; i < m.length; i += 1) {
    if (m[i].charCodeAt(0) >= 0x4E00) {
      count += m[i].length
    }
    else {
      count += 1
    }
  }
  return count
}

// 递归获取目录下的所有md文件
function getAllMarkdownFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) {
    return fileList;
  }
  
  const files = fs.readdirSync(dir)
  
  files.forEach(file => {
    const filePath = path.join(dir, file)
    if (fs.statSync(filePath).isDirectory()) {
      // 递归处理子目录，但排除特定目录
      if (file !== '.obsidian' && file !== '.git' && !file.startsWith('.')) {
        getAllMarkdownFiles(filePath, fileList)
      }
    } else if (file.endsWith('.md') && file !== 'index.md' && file !== 'tags.md') {
      fileList.push(filePath)
    }
  })
  
  return fileList
}

// 检查文件是否需要更新
function checkNeedsUpdate(jsonPath, filePaths, baseDir, relativePathPrefix = '') {
  // 如果JSON文件不存在，需要更新
  if (!fs.existsSync(jsonPath)) {
    return { needsUpdate: true, existingData: [] }
  }
  
  // 获取JSON文件修改时间
  const jsonModTime = fs.statSync(jsonPath).mtimeMs
  let existingData = []
  
  try {
    // 读取现有的JSON文件
    const jsonContent = fs.readFileSync(jsonPath, 'utf-8')
    existingData = JSON.parse(jsonContent)
  } catch (err) {
    console.error(`解析 ${jsonPath} 失败:`, err)
    // 如果解析失败，视为需要重新生成
    return { needsUpdate: true, existingData: [] }
  }
  
  // 如果没有找到Markdown文件，但JSON文件存在
  if (filePaths.length === 0) {
    if (fs.existsSync(jsonPath)) {
      console.log(`没有找到Markdown文件，删除 ${jsonPath}`)
      fs.unlinkSync(jsonPath)
    }
    return { needsUpdate: false, existingData: [] }
  }
  
  // 获取当前文件的相对路径列表（用于比较删除的文件）
  const currentRelativePaths = filePaths.map(filePath => {
    const relativePath = path.relative(baseDir, filePath).replace(/\\/g, '/')
    return relativePathPrefix ? `${relativePathPrefix}/${relativePath}` : relativePath
  })
  
  // 检查是否有文件被删除
  let hasDeletedFiles = false
  if (existingData.length > 0) {
    const existingPaths = existingData.map(item => {
      // 处理不同数据结构
      if (item.relativePath) {
        return item.relativePath
      } else if (relativePathPrefix && item.url) {
        // 从URL中提取相对路径（针对posts.json）
        return item.url.replace(/^\//, '').replace(/\.html$/, '.md')
      }
      return null
    }).filter(Boolean)
    
    hasDeletedFiles = existingPaths.some(existingPath => !currentRelativePaths.includes(existingPath))
    
    if (hasDeletedFiles) {
      console.log(`检测到文件被删除，需要更新 ${jsonPath}`)
      return { needsUpdate: true, existingData }
    }
  }
  
  // 检查是否有新文件或修改的文件
  for (const filePath of filePaths) {
    const fileModTime = fs.statSync(filePath).mtimeMs
    if (fileModTime > jsonModTime) {
      console.log(`检测到文件 ${filePath} 有更新，需要更新 ${jsonPath}`)
      return { needsUpdate: true, existingData }
    }
  }
  
  return { needsUpdate: false, existingData }
}

// 从内容中提取日期
function extractDate(content, frontmatter) {
  // 直接从文件内容中提取原始日期字符串
  const dateMatch = content.match(/date:\s*(['"]?)([^\n]+)\1/)
  const originalDate = dateMatch && dateMatch[2] ? dateMatch[2].trim() : null
  
  // 确保有日期信息
  return originalDate || frontmatter.date || new Date().toISOString()
}

// 处理博客文章数据
function generatePostsData(thoughtsDir, publicDir, docsDir) {
  console.log('开始处理博客文章数据...')
  
  const postsJsonPath = path.join(publicDir, 'posts.json')
  
  // 检查thoughts目录是否存在
  if (!fs.existsSync(thoughtsDir)) {
    console.log('博客文章目录不存在，跳过处理')
    // 如果JSON文件存在，删除它
    if (fs.existsSync(postsJsonPath)) {
      fs.unlinkSync(postsJsonPath)
    }
    return
  }
  
  const mdFiles = fs.readdirSync(thoughtsDir).filter(file => 
    file.endsWith('.md') && file !== 'index.md' && file !== 'tags.md'
  )
  
  const mdFilePaths = mdFiles.map(file => path.join(thoughtsDir, file))
  const { needsUpdate } = checkNeedsUpdate(postsJsonPath, mdFilePaths, docsDir, 'thoughts')
  
  if (!needsUpdate) {
    console.log('博客文章数据无变化，跳过更新')
    return
  }
  
  console.log('检测到博客文章变化，开始更新...')
  
  // 生成新的数据
  const posts = mdFiles.map(file => {
    const filePath = path.join(thoughtsDir, file)
    const content = fs.readFileSync(filePath, 'utf-8')
    
    // 使用gray-matter解析frontmatter
    const { data: frontmatter, content: markdownContent, excerpt } = matter(content, {
      excerpt: true,
      excerpt_separator: '<!-- more -->'
    })
    
    // 提取日期
    const date = extractDate(content, frontmatter)
    
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
      frontmatter: {
        ...frontmatter,
        // 确保日期是原始字符串
        date
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
  
  console.log(`成功更新博客文章数据，共 ${posts.length} 篇文章`)
}

// 处理知识笔记数据
function generateKnowledgeStats(knowledgeDir, publicDir, docsDir) {
  console.log('开始处理知识笔记数据...')
  
  const statsJsonPath = path.join(publicDir, 'knowledge-stats.json')
  
  if (!fs.existsSync(knowledgeDir)) {
    console.log('知识笔记目录不存在，跳过处理')
    // 如果JSON文件存在，删除它
    if (fs.existsSync(statsJsonPath)) {
      fs.unlinkSync(statsJsonPath)
    }
    return
  }
  
  const mdFilePaths = getAllMarkdownFiles(knowledgeDir)
  
  const { needsUpdate } = checkNeedsUpdate(statsJsonPath, mdFilePaths, docsDir)
  
  if (!needsUpdate) {
    console.log('知识笔记数据无变化，跳过更新')
    return
  }
  
  console.log('检测到知识笔记变化，开始更新...')
  
  // 需要更新，生成新的统计数据
  const stats = []
  
  mdFilePaths.forEach(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      
      // 使用gray-matter解析frontmatter
      const { data: frontmatter, content: markdownContent } = matter(content)
      
      // 获取publish状态，默认为true
      const isPublish = frontmatter.publish !== undefined ? frontmatter.publish : true
      
      // 只处理publish为true的文章
      if (!isPublish) {
        return
      }
      
      // 提取日期
      const date = extractDate(content, frontmatter)
      
      // 计算字数
      const wordCount = countWord(markdownContent)
      
      // 获取相对路径
      const relativePath = path.relative(docsDir, filePath).replace(/\\/g, '/')
      
      stats.push({
        date,
        wordCount,
        relativePath // 用于调试和文件变更检测
      })
    } catch (err) {
      console.error(`处理知识笔记文件失败: ${filePath}`, err)
    }
  })
  
  // 检查是否有有效数据
  if (stats.length === 0) {
    console.log('没有找到有效的知识笔记数据')
    // 如果JSON文件存在，删除它
    if (fs.existsSync(statsJsonPath)) {
      fs.unlinkSync(statsJsonPath)
    }
    return
  }
  
  // 将数据写入JSON文件
  fs.writeFileSync(
    statsJsonPath,
    JSON.stringify(stats, null, 2),
    'utf-8'
  )
  
  console.log(`成功更新知识笔记数据，共 ${stats.length} 篇笔记`)
}

// 主函数
async function main() {
  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url))
    const docsDir = path.resolve(__dirname, '../../')
    const thoughtsDir = path.join(docsDir, 'thoughts')
    const knowledgeDir = path.join(docsDir, 'knowledge')
    const publicDir = path.join(docsDir, 'public')
    
    console.log('开始生成网站数据...')
    console.log(`文档根目录: ${docsDir}`)
    console.log(`博客文章目录: ${thoughtsDir}`)
    console.log(`知识笔记目录: ${knowledgeDir}`)
    console.log(`公共资源目录: ${publicDir}`)
    
    // 确保public目录存在
    if (!fs.existsSync(publicDir)) {
      console.log('创建公共资源目录')
      fs.mkdirSync(publicDir, { recursive: true })
    }
    
    // 处理博客文章数据
    generatePostsData(thoughtsDir, publicDir, docsDir)
    
    // 处理知识笔记数据
    generateKnowledgeStats(knowledgeDir, publicDir, docsDir)
    
    console.log('所有数据生成完成')
  } catch (error) {
    console.error('生成网站数据时出错:', error)
    process.exit(1)
  }
}

// 执行主函数
main(); 