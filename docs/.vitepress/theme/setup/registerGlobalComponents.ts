import { defineAsyncComponent } from 'vue'
import type { App } from 'vue'
import * as echarts from 'echarts'

import GlobalMusicPlayer from '../components/common/GlobalMusicPlayer.vue'
import SimpleMusicPlayer from '../components/common/SimpleMusicPlayer.vue'
import BilibiliPlayer from '../components/common/BilibiliPlayer.vue'
import HomeMusicPlayer from '../components/home/HomeMusicPlayer.vue'

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

export function registerGlobalRuntime(app: App): void {
  app.config.globalProperties.$echarts = echarts
}
