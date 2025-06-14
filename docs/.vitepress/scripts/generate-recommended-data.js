// 预生成推荐文章数据脚本
// 用于在构建时预先生成推荐文章数据，减少首页加载时的API请求

import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { fileURLToPath } from 'url'

// 导入推荐文章配置
import { recommendedPosts } from '../config/recommended-posts.js'

try {
  // 设置路径
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const docsDir = path.resolve(__dirname, '../../')
  const publicDir = path.join(docsDir, 'public')
  const configFilePath = path.resolve(__dirname, '../config/recommended-posts.js')

  // 确保public目录存在
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true })
  }

  // 检查posts.json是否存在
  const postsJsonPath = path.join(publicDir, 'posts.json')
  const recommendedJsonPath = path.join(publicDir, 'recommended-posts.json')
  
  // 如果posts.json不存在，则退出
  if (!fs.existsSync(postsJsonPath)) {
    console.error('posts.json不存在，请先运行generate-posts-data脚本')
    process.exit(1)
  }

  // 检查是否需要更新
  let needsUpdate = true
  if (fs.existsSync(recommendedJsonPath)) {
    const postsJsonModTime = fs.statSync(postsJsonPath).mtimeMs
    const configFileModTime = fs.statSync(configFilePath).mtimeMs
    const recommendedJsonModTime = fs.statSync(recommendedJsonPath).mtimeMs
    
    // 如果配置文件和posts.json都没有更新，则不需要更新
    if (recommendedJsonModTime > postsJsonModTime && recommendedJsonModTime > configFileModTime) {
      // 检查是否有强制更新参数
      if (!process.argv.includes('--force')) {
        needsUpdate = false
      }
    }
  }

  // 如果不需要更新，则退出
  if (!needsUpdate) {
    process.exit(0)
  }

  // 读取posts.json
  const postsData = JSON.parse(fs.readFileSync(postsJsonPath, 'utf8'))
  
  // 处理推荐文章数据
  const recommendedPostsData = recommendedPosts.map(postPath => {
    // 查找对应的文章数据
    const originalPost = postsData.find(post => post.url === postPath)
    
    if (!originalPost) {
      console.warn(`推荐文章未找到: ${postPath}`)
      return null
    }
    
    // 提取需要的数据
    return {
      url: originalPost.url,
      title: originalPost.frontmatter.title,
      description: originalPost.frontmatter.description || originalPost.excerpt || '',
      date: originalPost.frontmatter.date || '',
      tags: originalPost.frontmatter.tags || []
    }
  }).filter(post => post !== null)

  // 将数据写入JSON文件
  fs.writeFileSync(
    recommendedJsonPath,
    JSON.stringify(recommendedPostsData, null, 2),
    'utf-8'
  )

} catch (error) {
  console.error('生成推荐文章数据时出错:', error)
  process.exit(1)
} 