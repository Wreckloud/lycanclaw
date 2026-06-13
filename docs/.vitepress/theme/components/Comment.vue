<script setup lang="ts">
/**
 * 文章评论区。
 * 负责初始化 Waline，并统一主题、OAuth 入口和头像兜底。
 */

import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRoute, useData } from 'vitepress'
import { logError } from '../utils/logger'
import { getWalineServerUrl } from '../utils/runtimePolicy'
import { syncWalineVisitorIdentity } from '../utils/visitorIdentity'

// 获取当前路由和主题模式
const route = useRoute()
const { isDark } = useData()

// Waline实例引用
interface WalineInstanceLike {
  destroy: () => void
  update: (options: { dark: string | false }) => void
}

const walineRef = ref<HTMLElement | null>(null)
let walineInstance: WalineInstanceLike | null = null
let cleanupThemeWatcher: (() => void) | null = null
let cleanupWalineDomWatcher: (() => void) | null = null

const DEFAULT_AVATAR = '/default.png'
const ALLOWED_OAUTH_PROVIDERS = new Set(['github', 'qq'])

// 计算当前路径作为评论标识
const commentPath = computed(() => route.path)
const isThoughtArticle = computed(() =>
  /^\/thoughts\/(?!index(?:\.html)?$)(?!tags(?:\.html)?$).+/i.test(route.path)
)

/**
 * 初始化 Waline 评论系统。
 */
const initWaline = async () => {
  if (!walineRef.value) return
  
  try {
    const { init } = await import('@waline/client')
    
    if (walineInstance) {
      walineInstance.destroy()
    }
    
    walineInstance = init({
      el: walineRef.value,
      serverURL: getWalineServerUrl(),
      path: commentPath.value,
      dark: isDark.value ? 'html.dark' : false,
      meta: ['nick', 'mail', 'link'],
      requiredMeta: ['nick', 'mail'],
      pageSize: 10,
      emoji: [
        'https://unpkg.com/@waline/emojis@1.2.0/bilibili',
      ],
      search: false,
      reaction: isThoughtArticle.value ? ['/reaction-like.svg'] : false,
      pageview: '.waline-pageview-count',
      comment: true,
      texRenderer: undefined,
      locale: {
        nick: '称谓',
        nickError: '昵称不能少于3个字符',
        mail: '邮箱',
        mailError: '请填写正确的邮件地址',
        link: '网址',
        optional: '可选',
        placeholder: '行者,欲留下何言？',
        sofa: '风静人稀，尚无行者留声。',
        submit: '提交',
        like: '点赞',
        cancelLike: '取消点赞',
        reply: '回复',
        cancelReply: '取消回复',
        comment: '评论',
        refresh: '刷新',
        more: '加载更多...',
        preview: '预览',
        emoji: '表情',
        uploadImage: '上传图片',
        seconds: '秒前',
        minutes: '分钟前',
        hours: '小时前',
        days: '天前',
        now: '刚刚',
        uploading: '正在上传',
        login: '登录',
        logout: '退出',
        admin: '管理员',
        sticky: '置顶',
        word: '字',
        wordHint: '评论字数应在 $0 到 $1 字之间',
        anonymous: '匿名',
        gif: '表情包',
        gifSearchPlaceholder: '搜索表情包',
        replyPlaceholder: '回复 @{at}',
        reactionTitle: '喜欢这篇随想吗？',
        reaction0: '喜欢',
      },
      login: 'enable',
      errorHandler: (err: unknown) => {
        logError('Comment', 'Waline 运行错误', err)
      }
    }) as WalineInstanceLike
  } catch (err) {
    logError('Comment', 'Waline 初始化失败', err)
  }
}

/**
 * 设置主题变化监听器。
 */
const setupThemeWatcher = (): (() => void) => {
  const observer = new MutationObserver(() => {
    if (walineInstance) {
      walineInstance.update({ dark: isDark.value ? 'html.dark' : false })
    }
  })
  
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'class']
  })
  
  return () => observer.disconnect()
}

const oauthProviderFromHref = (href: string): string => {
  if (!href) return ''
  try {
    return new URL(href, window.location.origin).searchParams.get('type')?.toLowerCase() ?? ''
  } catch {
    return ''
  }
}

const applyWalineDomEnhancements = () => {
  const root = walineRef.value
  if (!root) return

  root.querySelectorAll<HTMLAnchorElement>('a[href*="oauth"]').forEach((link) => {
    const provider = oauthProviderFromHref(link.getAttribute('href') ?? '')
    if (provider && !ALLOWED_OAUTH_PROVIDERS.has(provider)) {
      link.remove()
    }
  })

  root.querySelectorAll<HTMLImageElement>(
    '.wl-user img, .wl-avatar img, img.wl-avatar, .wl-login-info img'
  ).forEach((image) => {
    if (image.dataset.lycanAvatarReady === 'true') return
    image.dataset.lycanAvatarReady = 'true'
    image.draggable = false
    image.addEventListener('error', () => {
      if (image.dataset.lycanAvatarFallback === 'true') return
      image.dataset.lycanAvatarFallback = 'true'
      image.src = DEFAULT_AVATAR
    })
    if (!image.getAttribute('src')) {
      image.dataset.lycanAvatarFallback = 'true'
      image.src = DEFAULT_AVATAR
    }
  })

  const placeholders: Array<[string, string]> = [
    ['.wl-header .wl-nick', '愿世人以何之称'],
    ['.wl-header .wl-mail', '传信之途用于回应'],
    ['.wl-header .wl-link', '可跳转进汝之博客'],
  ]
  placeholders.forEach(([selector, placeholder]) => {
    root.querySelector<HTMLInputElement>(selector)?.setAttribute('placeholder', placeholder)
  })

  void syncWalineVisitorIdentity().catch((error) => {
    logError('Comment', '关联 Waline 访客身份失败', error)
  })
}

/**
 * 监听 Waline 动态渲染内容，并持续应用 OAuth 与头像规则。
 */
const setupWalineDomWatcher = (): (() => void) => {
  const root = walineRef.value
  if (!root) return () => undefined

  applyWalineDomEnhancements()
  const observer = new MutationObserver(applyWalineDomEnhancements)
  observer.observe(root, { childList: true, subtree: true })
  return () => observer.disconnect()
}

onMounted(async () => {
  if (typeof window === 'undefined') return
  await initWaline()
  cleanupThemeWatcher = setupThemeWatcher()
  cleanupWalineDomWatcher = setupWalineDomWatcher()
})

onBeforeUnmount(() => {
  if (cleanupThemeWatcher) {
    cleanupThemeWatcher()
    cleanupThemeWatcher = null
  }
  if (cleanupWalineDomWatcher) {
    cleanupWalineDomWatcher()
    cleanupWalineDomWatcher = null
  }
  if (walineInstance) {
    walineInstance.destroy()
    walineInstance = null
  }
})
</script>

<template>
  <div class="comment-section">
    <h2 class="comment-title">评论</h2>
    <div ref="walineRef" class="waline-container"></div>
  </div>
</template>

<style>
.comment-section {
  margin-top: 2rem;
  margin-bottom: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--vp-c-divider);
}

.comment-title {
  display: none;
}

.waline-container {
  color: var(--vp-c-text-1);
  --waline-theme-color: var(--vp-c-brand-1);
  --waline-active-color: var(--vp-c-brand-2);
  --waline-font-size: 14px;
  --waline-avatar-size: 40px;
  --waline-badge-font-size: 11px;
  --waline-info-font-size: 11px;
  --waline-border-color: var(--vp-c-divider);
  --waline-border: 1px solid var(--waline-border-color);
  --waline-box-shadow: none;
  --waline-avatar-radius: 50%;
  --waline-bg-color: transparent;
}

.waline-container a[href*="type=weibo"],
.waline-container a[href*="type=twitter"],
.waline-container a[href*="type=facebook"],
.waline-container a[href*="type%3Dweibo"],
.waline-container a[href*="type%3Dtwitter"],
.waline-container a[href*="type%3Dfacebook"] {
  display: none !important;
}

/* 适配暗黑模式 */
.waline-container .wl-card {
  position: relative;
  padding: 12px 0;
  border-top: 1px solid var(--waline-border-color);
  margin-bottom: 0;
  background: transparent;
}

.waline-container .wl-user img,
.waline-container .wl-avatar img,
.waline-container img.wl-avatar,
.waline-container .wl-login-info img {
  width: var(--waline-avatar-size) !important;
  height: var(--waline-avatar-size) !important;
  object-fit: cover;
  border: 0 !important;
  border-radius: 50% !important;
  background: var(--vp-c-bg-soft);
}

.waline-container .wl-badge {
  min-height: 18px;
  padding: 1px 6px !important;
  border: 0 !important;
  border-radius: 0 !important;
  color: var(--vp-c-brand-1) !important;
  background: color-mix(in srgb, var(--vp-c-brand-1) 12%, transparent) !important;
  font-size: 11px !important;
  line-height: 16px !important;
}

.waline-container .wl-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.waline-container .wl-meta span {
  padding: 0 !important;
  border: 0 !important;
  border-radius: 0 !important;
  font-size: 11px !important;
  color: var(--vp-c-text-3);
  background: transparent !important;
  opacity: 0.82;
}

.waline-container .wl-actions {
  display: flex;
  align-items: center;
  gap: 9px;
}

.waline-container .wl-comment-actions {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.waline-container .wl-comment-actions .wl-edit,
.waline-container .wl-comment-actions .wl-delete,
.waline-container .wl-comment-actions .wl-reply {
  width: 24px;
  height: 24px;
  padding: 0;
  display: inline-grid;
  place-items: center;
  border: 0;
  background: transparent;
}

.waline-container .wl-comment-actions .wl-edit svg,
.waline-container .wl-comment-actions .wl-delete svg,
.waline-container .wl-comment-actions .wl-reply svg {
  width: 15px;
  height: 15px;
  margin: 0;
}

.waline-container .wl-actions .wl-action {
  cursor: pointer;
  color: var(--vp-c-text-2);
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 2px 0;
}

.waline-container .wl-actions .wl-action:hover {
  color: var(--vp-c-brand-1);
}

.waline-container .wl-actions svg,
.waline-container .wl-like svg,
.waline-container .wl-reply svg {
  width: 14px;
  height: 14px;
  margin-right: 3px;
}

.waline-container .wl-admin-actions,
.waline-container .wl-comment-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.waline-container .wl-admin-actions button,
.waline-container .wl-comment-status button {
  min-width: 42px;
  min-height: 26px;
  padding: 3px 8px !important;
  border: 1px solid var(--vp-c-divider) !important;
  border-radius: 0 !important;
  line-height: 18px;
}

.waline-container .wl-reaction {
  margin: 0 0 1.6rem;
  padding: 0 0 1.2rem;
  border-bottom: 1px solid var(--vp-c-divider);
}

.waline-container .wl-reaction-title {
  margin-bottom: 8px;
  color: var(--vp-c-text-2);
  font-size: 13px;
}

.waline-container .wl-reaction-list {
  justify-content: flex-start;
  gap: 0;
}

.waline-container .wl-reaction-item {
  min-width: 64px;
  margin: 0;
  padding: 6px 8px;
  border: 0;
  border-radius: 0;
  background: transparent;
}

.waline-container .wl-reaction-item:hover,
.waline-container .wl-reaction-item.active {
  color: var(--vp-c-brand-1);
  background: color-mix(in srgb, var(--vp-c-brand-1) 8%, transparent);
}

.waline-container .wl-reaction-img {
  width: 28px;
  height: 28px;
}

.waline-container .wl-reaction-img img {
  width: 28px;
  height: 28px;
}

.waline-container .wl-reaction-text,
.waline-container .wl-reaction-votes {
  font-size: 11px;
}

.waline-container .wl-quote {
  border-left: 1px dashed var(--vp-c-divider) !important;
  color: var(--vp-c-text-2);
}

.waline-container .wl-panel {
  margin-bottom: 16px;
  border: 1px solid var(--waline-border-color) !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}

.waline-container .wl-header .wl-header-item {
  flex: 1;
  min-width: 120px;
}

.waline-container .wl-header .wl-header-item label {
  color: var(--vp-c-text-2);
}

.waline-container .wl-header .wl-input {
  width: 100%;
  background-color: var(--vp-c-bg);
  font-size: 13px;
}

.waline-container .wl-editor {
  min-height: 80px;
  padding: 8px;
  border: none !important;
  font-family: var(--vp-font-family-base) !important;
  font-size: var(--vp-font-size-1, 14px) !important;
  line-height: var(--vp-line-height-1, 1.7) !important;
  color: var(--vp-c-text-1) !important;
  background-color: transparent !important;
}

.waline-container .wl-footer .wl-action {
  padding: 4px;
  cursor: pointer;
  border-radius: 0;
  color: var(--vp-c-text-2);
}

.waline-container .wl-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.waline-container .wl-text-number {
  font-size: 12px;
  color: var(--vp-c-text-2);
}

.waline-container .wl-sort li.active {
  color: var(--vp-c-brand-1);
  font-weight: 500;
}

.waline-container .wl-like,
.waline-container .wl-reply {
  background: none;
  border: none;
  font-size: 12px;
  color: var(--vp-c-text-2);
  padding: 2px 4px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
}

.waline-container .wl-like:hover,
.waline-container .wl-reply:hover {
  color: var(--vp-c-brand-1);
}

.waline-container .wl-emoji-popup {
  position: absolute;
  z-index: 100;
  border: 1px solid var(--waline-border-color);
  border-radius: 0;
  background-color: var(--vp-c-bg-soft) !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  max-height: 300px;
  overflow-y: auto;
}

.waline-container .wl-gif-popup {
  position: absolute;
  z-index: 100;
  border: 1px solid var(--waline-border-color);
  border-radius: 0;
  background-color: var(--vp-c-bg-soft) !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  max-height: 300px;
  overflow-y: auto;
}

.waline-container .wl-tab {
  background-color: var(--vp-c-bg) !important;
  border-bottom: 1px solid var(--waline-border-color);
}

.waline-container .wl-tabs {
  background-color: var(--vp-c-bg-soft) !important;
}

.waline-container .wl-tab-content {
  background-color: var(--vp-c-bg-soft) !important;
}

.waline-container .wl-emoji-item:hover {
  background-color: var(--vp-c-bg-alt) !important;
  border-radius: 0;
}

.waline-container .wl-footer .wl-action[title="Markdown Guide"] {
  display: none !important;
}

.waline-container .wl-editor:focus,
.waline-container .wl-input:focus,
.waline-container textarea:focus,
.waline-container input:focus {
  outline: none !important;
  border-color: transparent !important;
  background-color: transparent !important;
}

.waline-container .wl-input,
.waline-container .wl-editor {
  border: none !important;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .waline-container {
    --waline-avatar-size: 32px;
  }
  .waline-container .wl-header .wl-header-item label{
    width: 50px;
  }
  
  .waline-container .wl-card {
    padding: 10px 0;
  }
  
  .waline-container .wl-reply .wl-card {
    margin-left: 16px;
    padding-left: 10px;
  }
  
  .waline-container .wl-header .wl-header-item {
    flex: 100%;
  }
}

.waline-container .wl-content div p,
.waline-container .wl-content > div,
.waline-container .wl-content p,
.waline-container .wl-preview .wl-content p {
  font-family: var(--vp-font-family-base);
  font-size: var(--vp-font-size-1, 14px);
  line-height: var(--vp-line-height-1, 1.7);
  color: var(--vp-c-text-1);
  margin: 6px 0;
  word-break: break-word;
  overflow-wrap: break-word;
}

.waline-container .wl-quote .wl-content p,
.waline-container .wl-quote .wl-content div p {
  font-family: var(--vp-font-family-base);
  font-size: var(--vp-font-size-1, 14px);
  line-height: var(--vp-line-height-1, 1.7);
  color: var(--vp-c-text-1);
}

.waline-container .wl-content > p > a,
.waline-container .wl-content > p > span {
  font-family: var(--vp-font-family-base);
  font-size: var(--vp-font-size-1, 14px);
  color: var(--vp-c-text-2);
}
</style> 
