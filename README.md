# LycanClaw 个人博客

基于VitePress构建的个人博客网站，专注于前端技术分享和个人随笔。


## 项目结构

```
docs/
  ├── .vitepress/               # VitePress配置目录
  │   ├── config/               # 配置文件目录
  │   │   ├── navbar.ts         # 导航栏配置
  │   │   ├── sidebar.ts        # 侧边栏配置
  │   │   └── recommended-posts.js # 推荐文章配置
  │   ├── theme/                # 主题定制目录
  │   │   ├── components/       # 组件目录
  │   │   │   ├── home/         # 首页组件
  │   │   │   │   ├── EncourageWidget.vue    # 催更组件
  │   │   │   │   ├── RecentComments.vue     # 最新评论组件
  │   │   │   │   ├── RecommendedReading.vue # 推荐阅读组件
  │   │   │   │   └── StatsPanel.vue         # 数据统计面板
  │   │   │   └── global/       # 全局组件
  │   │   ├── styles/           # 样式文件
  │   │   ├── utils/            # 工具函数
  │   │   └── index.ts          # 主题入口文件
  │   └── config.ts             # VitePress主配置文件
  ├── public/                   # 静态资源目录
  ├── thoughts/                 # 随想文章目录
  └── knowledge/                # 知识笔记目录
```