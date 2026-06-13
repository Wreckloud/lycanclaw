/**
 * 注册主题内可由 Markdown 和布局直接使用的全局组件。
 */
import { defineAsyncComponent } from 'vue'
import type { App } from 'vue'

import GlobalMusicPlayer from '../components/music/GlobalMusicPlayer.vue'
import SimpleMusicPlayer from '../components/music/SimpleMusicPlayer.vue'
import BilibiliPlayer from '../components/common/BilibiliPlayer.vue'
import HomeMusicPlayer from '../components/music/HomeMusicPlayer.vue'

const AsyncArticleMetadata = defineAsyncComponent(() =>
  import('../components/ArticleMetadata.vue')
)
const AsyncPostList = defineAsyncComponent(() => import('../components/PostList.vue'))
const AsyncComment = defineAsyncComponent(() => import('../components/Comment.vue'))
const AsyncRecentComments = defineAsyncComponent(() =>
  import('../components/home/RecentComments.vue')
)

export function registerGlobalComponents(app: App): void {
  app.component('ArticleMetadata', AsyncArticleMetadata)
  app.component('PostList', AsyncPostList)
  app.component('Comment', AsyncComment)
  app.component('RecentComments', AsyncRecentComments)

  app.component('SimpleMusicPlayer', SimpleMusicPlayer)
  app.component('GlobalMusicPlayer', GlobalMusicPlayer)
  app.component('HomeMusicPlayer', HomeMusicPlayer)
  app.component('BilibiliPlayer', BilibiliPlayer)
}
