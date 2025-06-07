import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// 在ES模块中获取当前文件路径
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 获取docs目录的绝对路径
const docsPath = path.resolve(__dirname, '../../')

// 替换图片路径的正则表达式合集 - 这里是反向替换
const pathPatterns = [
  { regex: /\/images\//g, replacement: '/public/images/' },
  { regex: /!\[\[\/images\//g, replacement: '![[public/images/' },
  { regex: /\(\/images\//g, replacement: '(public/images/' }
]

function restoreImagePaths(directoryPath) {
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
          const subDirStats = restoreImagePaths(fullPath)
          filesProcessed += subDirStats.filesProcessed
          filesFixed += subDirStats.filesFixed
        } else if (file.endsWith('.md')) {
          filesProcessed++
          
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
            console.log(`已还原图片路径: ${fullPath}`)
            filesFixed++
          }
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
      const stats = restoreImagePaths(fullPath)
      totalProcessed += stats.filesProcessed
      totalFixed += stats.filesFixed
    } else if (dir.endsWith('.md')) {
      // 单独处理根目录下的md文件
      totalProcessed++
      
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
        console.log(`已还原图片路径: ${fullPath}`)
        totalFixed++
      }
    }
  } catch (error) {
    console.error(`处理 ${fullPath} 时出错:`, error.message)
  }
})

console.log(`图片路径还原完成！检查了 ${totalProcessed} 个文件，还原了 ${totalFixed} 个文件。`) 