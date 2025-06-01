import { defineConfig } from 'vitepress'
import { generateSidebar } from './plugins/index.js'

// 使用自定义插件生成侧边栏
const sidebar = generateSidebar({
  docsRoot: 'docs',
  scanDirs: ['knowledge'], // 只为knowledge目录生成侧边栏
  useTitleFromFrontmatter: true,
  sortByName: true
});

// VitePress配置
export default defineConfig({
  // 基础配置
  lang: 'zh-CN', // 设置语言为中文
  title: "LycanClaw", // 站点标题
  description: "渊痕爪记", // 站点描述
  
  // fav图标配置
  head: [
    ['link', { rel: 'icon', href: '/logo.png' }], // 网站图标，需要在public文件夹中添加logo.png
  ],

  // 启用深色模式
  appearance: 'dark', // 默认使用深色模式，可选值：true(默认浅色且可切换)、'dark'、'force-dark'、false(关闭)

  // 启用最后更新时间
  lastUpdated: true, // 显示页面的最后更新时间（需要Git支持）
  
  // Markdown配置
  markdown: {
    // 在h1标题下插入文章元数据组件
    config: (md) => {
      md.renderer.rules.heading_close = (tokens, idx, options, env, slf) => {
        let htmlResult = slf.renderToken(tokens, idx, options);
        if (tokens[idx].tag === 'h1') htmlResult += `<ArticleMetadata />`; 
        return htmlResult;
      }
    }
  },

  // 默认主题配置
  themeConfig: {
    // 站点Logo
    logo: '/logo.png', // 需要在public文件夹中添加logo.png

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
      level: [2, 3], // 显示2-3级标题
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
    sidebar
  }
})
