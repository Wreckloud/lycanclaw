/**
 * VitePress 自定义主题入口。
 */
import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import { onMounted } from 'vue'
import { useRoute } from 'vitepress'

import MyLayout from './components/MyLayout.vue'
import { registerGlobalComponents } from './setup/registerGlobalComponents'
import {
  preloadSiteData,
  setupRouteSideEffects,
  syncAudioOnMounted
} from './setup/runtimeEffects'
import { useImageZoom } from './setup/useImageZoom'

import './styles/index.css'
import './styles/codeblock-fix.css'
import './styles/fade-mask.css'
import './styles/music-progress.css'
import '@waline/client/style'

const theme: Theme = {
  extends: DefaultTheme,

  enhanceApp({ app, router }) {
    registerGlobalComponents(app)
    setupRouteSideEffects(router)
  },

  Layout: MyLayout,

  setup() {
    const route = useRoute()

    useImageZoom(route)

    onMounted(() => {
      preloadSiteData()
      syncAudioOnMounted()
    })
  }
}

export default theme
