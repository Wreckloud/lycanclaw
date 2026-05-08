import DefaultTheme from 'vitepress/theme'
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

export default {
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
