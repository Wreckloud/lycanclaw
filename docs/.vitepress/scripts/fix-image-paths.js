import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// 在ES模块中获取当前文件路径
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 缓存文件路径
const CACHE_FILE = path.join(__dirname, '.image-paths-cache.json')

// 加载缓存
function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const cacheData = fs.readFileSync(CACHE_FILE, 'utf-8')
      return JSON.parse(cacheData)
    }
  } catch (error) {
    console.error('读取缓存文件失败:', error.message)
  }
  return {}
}

// 保存缓存
function saveCache(cache) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8')
  } catch (error) {
    console.error('保存缓存文件失败:', error.message)
  }
}

// 检查文件是否需要处理
function shouldProcessFile(filePath, cache) {
  if (!cache[filePath]) {
    return true // 缓存中不存在，需要处理
  }
  
  try {
    const stats = fs.statSync(filePath)
    const lastModified = stats.mtimeMs
    
    // 如果文件比缓存中记录的修改时间新，则需要处理
    return lastModified > cache[filePath].lastModified
  } catch (error) {
    return true // 出错则处理
  }
}

// 更新缓存
function updateCache(filePath, cache, wasFixed) {
  try {
    const stats = fs.statSync(filePath)
    cache[filePath] = {
      lastModified: stats.mtimeMs,
      wasFixed: wasFixed
    }
  } catch (error) {
    console.error(`更新缓存失败 ${filePath}:`, error.message)
  }
}

// 替换图片路径的正则表达式合集
const pathPatterns = [
  { regex: /\/public\/images\//g, replacement: '/images/' },
  { regex: /!\[\[public\/images\//g, replacement: '![[/images/' },
  { regex: /\(public\/images\//g, replacement: '(/images/' }
]

function fixImagePaths(directoryPath, cache) {
  try {
    const files = fs.readdirSync(directoryPath)
    let filesProcessed = 0
    let filesFixed = 0
    
    files.forEach(file => {
      try {
        const fullPath = path.join(directoryPath, file)
        const stat = fs.statSync(fullPath)
        
        if (stat.isDirectory()) {
          // 递归处理子目录
          const subDirStats = fixImagePaths(fullPath, cache)
          filesProcessed += subDirStats.filesProcessed
          filesFixed += subDirStats.filesFixed
        } else if (file.endsWith('.md')) {
          filesProcessed++
          
          // 检查文件是否需要处理
          if (!shouldProcessFile(fullPath, cache)) {
            return // 跳过不需要处理的文件
          }
          
          // 处理 markdown 文件
          let content = fs.readFileSync(fullPath, 'utf-8')
          let newContent = content
          let wasModified = false
          
          // 一次应用所有替换
          for (const pattern of pathPatterns) {
            if (pattern.regex.test(newContent)) {
              // 重置正则表达式的lastIndex
              pattern.regex.lastIndex = 0
              newContent = newContent.replace(pattern.regex, pattern.replacement)
              wasModified = true
            }
          }
          
          if (wasModified) {
            fs.writeFileSync(fullPath, newContent, 'utf-8')
            console.log(`已修复图片路径: ${fullPath}`)
            filesFixed++
          }
          
          // 更新缓存
          updateCache(fullPath, cache, wasModified)
        }
      } catch (fileError) {
        console.error(`处理文件 ${path.join(directoryPath, file)} 时出错:`, fileError.message)
      }
    })
    
    return { filesProcessed, filesFixed }
  } catch (dirError) {
    console.error(`读取目录 ${directoryPath} 时出错:`, dirError.message)
    return { filesProcessed: 0, filesFixed: 0 }
  }
}

// 获取docs目录的绝对路径
const docsPath = path.resolve(__dirname, '../../')

// 加载缓存
const cache = loadCache()

// 处理所有可能包含 Markdown 文件的目录
const directories = [
  'thoughts', 
  'knowledge', 
  'projects',
  'index.md',   // 处理根目录下的md文件
  'about.md'
]

let totalProcessed = 0
let totalFixed = 0

directories.forEach(dir => {
  const fullPath = path.join(docsPath, dir)
  try {
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      console.log(`处理目录: ${fullPath}`)
      const stats = fixImagePaths(fullPath, cache)
      totalProcessed += stats.filesProcessed
      totalFixed += stats.filesFixed
    } else if (dir.endsWith('.md')) {
      // 单独处理根目录下的md文件
      totalProcessed++
      
      // 检查文件是否需要处理
      if (!shouldProcessFile(fullPath, cache)) {
        return // 跳过不需要处理的文件
      }
      
      let content = fs.readFileSync(fullPath, 'utf-8')
      let newContent = content
      let wasModified = false
      
      // 应用所有替换
      for (const pattern of pathPatterns) {
        if (pattern.regex.test(newContent)) {
          pattern.regex.lastIndex = 0
          newContent = newContent.replace(pattern.regex, pattern.replacement)
          wasModified = true
        }
      }
      
      if (wasModified) {
        fs.writeFileSync(fullPath, newContent, 'utf-8')
        console.log(`已修复图片路径: ${fullPath}`)
        totalFixed++
      }
      
      // 更新缓存
      updateCache(fullPath, cache, wasModified)
    }
  } catch (error) {
    console.error(`处理 ${fullPath} 时出错:`, error.message)
  }
})

// 保存缓存
saveCache(cache)

console.log(`图片路径修复完成！检查了 ${totalProcessed} 个文件，修复了 ${totalFixed} 个文件。`)
