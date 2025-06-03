import { defineConfig } from 'vitepress'
import { generateSidebar } from './plugins/index.js'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

// 使用自定义插件生成侧边栏
const sidebar = generateSidebar({
  docsRoot: 'docs',
  scanDirs: ['knowledge'], // 只为knowledge目录生成侧边栏
  useTitleFromFrontmatter: true,
  sortByName: true
});

// 生成博客文章数据JSON文件
function generatePostsData() {
  try {
    const thoughtsDir = path.resolve(__dirname, '../thoughts')
    const publicDir = path.resolve(__dirname, '../public')
    
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
      return
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
  }
}

// VitePress配置
export default defineConfig({
  // 基础配置
  lang: 'zh-CN', // 设置语言为中文
  title: "LycanClaw", // 站点标题
  description: "渊痕爪记", // 站点描述
  
  // fav图标配置
  head: [
    ['link', { rel: 'icon', href: '/logo.png' }], // 网站图标，需要在public文件夹中添加logo.png
    // 添加Content-Security-Policy，允许加载不蒜子统计脚本
    ['meta', { 
      'http-equiv': 'Content-Security-Policy', 
      content: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://busuanzi.ibruce.info http://busuanzi.ibruce.info; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://v1.hitokoto.cn https://busuanzi.ibruce.info http://busuanzi.ibruce.info; font-src 'self' data:; frame-src 'self';"
    }],
    // 添加跨域预获取策略，提前连接不蒜子服务
    ['link', { rel: 'preconnect', href: 'https://busuanzi.ibruce.info' }],
  ],

  // 启用深色模式
  appearance: 'dark', // 默认使用深色模式，可选值：true(默认浅色且可切换)、'dark'、'force-dark'、false(关闭)

  // 启用最后更新时间
  lastUpdated: true, // 显示页面的最后更新时间（需要Git支持）
  
  // Markdown配置
  markdown: {
    // 移除在h1标题下自动插入文章元数据组件的配置
    breaks: true, // 启用换行转换，单个换行符会转为 <br>
    
    // 代码块配置
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    },
    
    // 代码块行号
    lineNumbers: true,
  },

  // Vue配置
  vue: {
    template: {
      compilerOptions: {
        // 不再需要这些自定义元素配置，因为我们已经移除了所有相关组件
        isCustomElement: (tag) => false
      }
    }
  },

  // 构建钩子
  buildEnd: generatePostsData,

  // 默认主题配置
  themeConfig: {
    // 站点Logo
    logo: '/logo.png', // 需要在public文件夹中添加logo.png

    // 禁用默认页脚
    footer: false,

    // 导航栏
    nav: [
      { text: '首页', link: '/' },
      { text: '知识笔记', link: '/knowledge/' },
      { text: '思考随笔', link: '/thoughts/' },
      { text: '项目展示', link: '/projects/' },
      { text: '关于', link: '/about' }
    ],

    // 社交链接
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Wreckloud/lycanclaw' } // 修改为您的GitHub仓库
    ],

    // 移动端菜单文字
    sidebarMenuLabel: '目录',
    darkModeSwitchLabel: '深浅模式', 

    // 返回顶部文字
    returnToTopLabel: '返回顶部',

    // 启用本地搜索
    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: {
                buttonText: '搜索文档',
                buttonAriaLabel: '搜索文档'
              },
              modal: {
                noResultsText: '无法找到相关结果',
                resetButtonTitle: '清除查询条件',
                footer: {
                  selectText: '选择',
                  navigateText: '切换',
                  closeText: '关闭'
                }
              }
            }
          }
        }
      }
    },

    // 大纲设置
    outline: {
      level: [1, 3], // 显示2-3级标题
      label: '当前页大纲'
    },

    // 编辑链接
    editLink: false,

    // 上次更新时间文本
    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'full',
        timeStyle: 'medium'
      }
    },

    // 自定义上下页名
    docFooter: {
      prev: '上一页',
      next: '下一页'
    },

    // 使用自动生成的侧边栏
    sidebar,
  }
})
