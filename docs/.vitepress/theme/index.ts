/**
 * index.ts：
 * 承载index模块实现。
 */
import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import { onMounted } from 'vue'
import { useRoute } from 'vitepress'

import MyLayout from './components/MyLayout.vue'
import { registerGlobalComponents, registerGlobalRuntime } from './setup/registerGlobalComponents'
import {
  preloadSiteData,
  setupRouteSideEffects,
  syncAudioOnMounted
} from './setup/runtimeEffects'
import { useImageZoom } from './setup/useImageZoom'

import './styles/index.css'
import './styles/codeblock-fix.css'
import './styles/fade-mask.css'

const theme: Theme = {
  extends: DefaultTheme,

  enhanceApp({ app, router }) {
    registerGlobalComponents(app)
    registerGlobalRuntime(app)
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
