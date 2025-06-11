// 生成知识笔记统计数据脚本
// 只收集知识笔记的日期和字数信息，不包含全文内容，保持隐私

import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { fileURLToPath } from 'url'

// 统计字数的函数（与其他地方保持一致）
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
  const files = fs.readdirSync(dir)
  
  files.forEach(file => {
    const filePath = path.join(dir, file)
    if (fs.statSync(filePath).isDirectory()) {
      // 递归处理子目录，但排除特定目录
      if (file !== '.obsidian' && file !== '.git' && !file.startsWith('.')) {
        getAllMarkdownFiles(filePath, fileList)
      }
    } else if (file.endsWith('.md') && file !== 'index.md') {
      fileList.push(filePath)
    }
  })
  
  return fileList
}

try {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const docsDir = path.resolve(__dirname, '../../')
  const knowledgeDir = path.join(docsDir, 'knowledge')
  const publicDir = path.join(docsDir, 'public')

  // 确保public目录存在
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true })
  }

  // 检查knowledge-stats.json是否存在，获取其修改时间
  const statsJsonPath = path.join(publicDir, 'knowledge-stats.json')
  let statsJsonModTime = 0
  let existingStats = []
  
  if (fs.existsSync(statsJsonPath)) {
    statsJsonModTime = fs.statSync(statsJsonPath).mtimeMs
    try {
      // 读取现有的统计数据
      const statsJsonContent = fs.readFileSync(statsJsonPath, 'utf-8')
      existingStats = JSON.parse(statsJsonContent)
    } catch (err) {
      // 如果解析失败，视为需要重新生成
      existingStats = []
    }
  }
  
  // 检查knowledge目录是否存在
  if (!fs.existsSync(knowledgeDir)) {
    process.exit(0)
  }

  // 获取所有markdown文件
  const mdFilePaths = getAllMarkdownFiles(knowledgeDir)
  
  // 检查是否有文件变化（新增或修改）
  let needsUpdate = !fs.existsSync(statsJsonPath)
  
  // 如果没有找到markdown文件，删除旧的统计文件
  if (mdFilePaths.length === 0 && fs.existsSync(statsJsonPath)) {
    fs.unlinkSync(statsJsonPath)
    process.exit(0)
  }
  
  // 检查是否有文件被删除
  if (!needsUpdate && existingStats.length > 0) {
    const existingFilePaths = existingStats.map(stat => stat.relativePath)
    const currentFilePaths = mdFilePaths.map(filePath => 
      path.relative(docsDir, filePath).replace(/\\/g, '/'))
    
    // 如果有文件被删除，需要更新
    if (existingFilePaths.some(file => !currentFilePaths.includes(file))) {
      needsUpdate = true
    }
  }
  
  // 检查是否有新文件或修改的文件
  if (!needsUpdate) {
    for (const filePath of mdFilePaths) {
      const fileModTime = fs.statSync(filePath).mtimeMs
      if (fileModTime > statsJsonModTime) {
        needsUpdate = true
        break
      }
    }
  }
  
  // 如果不需要更新，则直接返回
  if (!needsUpdate) {
    process.exit(0)
  }

  // 需要更新，生成新的统计数据
  const stats = []
  
  mdFilePaths.forEach(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      
      // 提取日期字符串
      const dateMatch = content.match(/date:\s*(['"]?)([^\n]+)\1/)
      const originalDate = dateMatch && dateMatch[2] ? dateMatch[2].trim() : null
      
      // 使用gray-matter解析frontmatter
      const { data: frontmatter, content: markdownContent } = matter(content)
      
      // 获取publish状态，默认为true
      const isPublish = frontmatter.publish !== undefined ? frontmatter.publish : true
      
      // 只处理publish为true的文章
      if (!isPublish) {
        return
      }
      
      // 确保有日期信息
      const date = originalDate || frontmatter.date || new Date().toISOString()
      
      // 计算字数
      const wordCount = countWord(markdownContent)
      
      // 获取相对路径（用于日志和调试）
      const relativePath = path.relative(docsDir, filePath).replace(/\\/g, '/')
      
      stats.push({
        date,
        wordCount,
        relativePath // 只用于调试，不会用于前端展示
      })
    } catch (err) {
      console.error(`处理文件失败: ${filePath}`, err)
    }
  })
  
  // 检查是否有有效数据
  if (stats.length === 0) {
    process.exit(0)
  }

  // 将数据写入JSON文件
  fs.writeFileSync(
    statsJsonPath,
    JSON.stringify(stats, null, 2),
    'utf-8'
  )

} catch (error) {
  console.error('生成知识笔记统计数据时出错:', error)
  process.exit(1)
} 