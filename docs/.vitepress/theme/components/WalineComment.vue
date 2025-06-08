<script setup>
import { computed, ref, onMounted, watch } from 'vue';
import { useData, useRoute } from 'vitepress';
import { init } from '@waline/client';
import '@waline/client/style';

const route = useRoute();
const { isDark, frontmatter } = useData();
const walineInstanceRef = ref(null);
const walineContainer = ref(null);
const mounted = ref(false);

// 计算当前页面的路径作为评论区的标识
const path = computed(() => {
  // 使用相对路径作为评论ID
  return route.path;
});

// 初始化或更新 Waline 实例
const updateWaline = async () => {
  if (!mounted.value) return;
  
  // 如果已经有实例，先销毁
  if (walineInstanceRef.value) {
    walineInstanceRef.value.destroy();
  }
  
  // 如果页面设置了 `hideComments: true`，则不加载评论
  if (frontmatter.value.hideComments) {
    return;
  }

  try {
    // 创建新的 Waline 实例
    walineInstanceRef.value = init({
      el: walineContainer.value,
      serverURL: 'https://wreckloud.com/',
      path: path.value,
      dark: isDark.value,
      locale: {
        placeholder: '欢迎评论！请注意文明发言~',
        // 设置反应表情的提示文字
        reactionTitle: '感觉如何?',
        reaction0: '赞同',
        reaction1: '思考',
        reaction2: '学到了',
        reaction3: '有趣',
        reaction4: '喜爱',
        reaction5: '不赞同',
      },
      // 基础配置
      comment: true,
      pageview: true,
      // 启用文章反应功能，使用本地SVG图标
      reaction: [
        '/images/评论区反应/赞同.svg',      // 赞同
        '/images/评论区反应/思考.svg',      // 思考
        '/images/评论区反应/学到了.svg',    // 学到了
        '/images/评论区反应/有趣.svg',      // 有趣
        '/images/评论区反应/喜爱.svg',      // 喜爱
        '/images/评论区反应/不赞同.svg',    // 不赞同
      ],
      emoji: [
        '//unpkg.com/@waline/emojis@1.1.0/bilibili',
        '//unpkg.com/@waline/emojis@1.1.0/weibo',
      ],
      // 默认头像
      avatar: 'mp',
      // 默认评论者身份
      login: 'enable',
      // 元信息
      meta: ['nick', 'mail', 'link'],
      requiredMeta: ['nick'],
      // 设置超时时间
      timeout: 10000,
    });
  } catch (error) {
    console.error('Failed to initialize Waline:', error);
  }
};

// 监听主题变化
watch(() => isDark.value, () => {
  updateWaline();
});

// 监听路由变化
watch(() => route.path, () => {
  updateWaline();
});

onMounted(() => {
  mounted.value = true;
  updateWaline();
});
</script>

<template>
  <div class="waline-comment-container">
    <div class="comment-title">
      <h2>评论区</h2>
    </div>
    <div ref="walineContainer"></div>
  </div>
</template>

<style>
.waline-comment-container {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--vp-c-divider);
}

.comment-title {
  margin-bottom: 1rem;
}

.comment-title h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

/* 修改 Waline 样式以匹配 VitePress 主题 */
:root {
  /* 颜色变量 */
  --waline-theme-color: var(--vp-c-brand-1);
  --waline-active-color: var(--vp-c-brand-2);
  --waline-font-size: var(--vp-font-size-1);
  --waline-border-color: var(--vp-c-divider);
  --waline-bg-color: var(--vp-c-bg);
  --waline-bg-color-light: var(--vp-c-bg-soft);
  --waline-bg-color-hover: var(--vp-c-bg-soft);
  --waline-text-color: var(--vp-c-text-1);
  --waline-disable-color: var(--vp-c-text-3);
  
  /* 字体变量 */
  --waline-font-family: var(--vp-font-family-base);
}

/* 强制应用字体到所有评论区元素 */
.wl-panel, 
.wl-header, 
.wl-content, 
.wl-footer,
.wl-card,
.wl-meta,
.wl-editor,
.wl-input,
.wl-btn,
.wl-action,
.wl-emoji,
.wl-login-info,
.wl-avatar,
.wl-comment,
.wl-reactions,
.wl-counter {
  font-family: var(--vp-font-family-base) !important;
}

/* 评论输入区域字体 */
.wl-editor {
  font-family: var(--vp-font-family-base) !important;
  font-size: var(--vp-font-size-1) !important;
  border-radius: 0 !important;
}

/* 所有输入框去除圆角 */
.wl-input,
#wl-nick, #wl-mail, #wl-link,
.wl-nick, .wl-mail, .wl-link,
.wl-panel,
.wl-editor,
.wl-footer {
  border-radius: 0 !important;
  border: none !important;
}

/* 输入框渐变背景 - 删除单独元素的背景 */
.wl-editor, 
.wl-input {
  padding: 8px 10px !important;
}

/* 给整个表单添加背景 */
.wl-panel {
  background: linear-gradient(to right, rgba(125, 125, 125, 0.05), rgba(125, 125, 125, 0.1)) !important;
  padding: 10px !important;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05) !important;
}

/* 暗黑模式表单背景 */
html.dark .wl-panel {
  background: linear-gradient(to right, rgba(200, 200, 200, 0.05), rgba(200, 200, 200, 0.02)) !important;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1) !important;
}

/* 移除表单元素选中效果 */
.wl-input:focus,
.wl-editor:focus,
#wl-nick:focus, 
#wl-mail:focus, 
#wl-link:focus,
.wl-nick:focus, 
.wl-mail:focus, 
.wl-link:focus {
  outline: none !important;
  box-shadow: none !important;
  border-color: transparent !important;
}

/* 隐藏Markdown指南元素 */
.wl-actions a[href*="mastering-markdown"] {
  display: none !important;
}

/* 隐藏GIF按钮 */
.wl-actions button[title="表情包"] {
  display: none !important;
}

/* 统一表单字体大小 - 完全重写 */
.wl-header-item label,
.wl-header-item input,
#wl-nick, #wl-mail, #wl-link,
.wl-nick, .wl-mail, .wl-link {
  font-size: 14px !important;
  font-family: var(--vp-font-family-base) !important;
  line-height: 1.6 !important;
}

/* 限制昵称输入框宽度 */
.wl-header-item:first-child input,
#wl-nick,
.wl-nick {
  max-width: 120px !important; /* 约7个汉字的宽度 */
}

/* 桌面布局下的表单排版优化 */
@media (min-width: 580px) {

}

/* 移动设备布局下标签宽度统一 */
@media (max-width: 579px) {
  .wl-header {
    display: block;
  }
  
  .wl-header-item {
    margin-bottom: 10px;
    display: flex;
    align-items: center;
  }
  
  .wl-header-item label {
    display: inline-block;
    width: 80px !important; /* 以"网址(可选)"的宽度为准 */
    text-align: left;
    flex-shrink: 0;
  }
  
  .wl-header-item input {
    flex-grow: 1;
  }
  
  /* 移动设备下取消昵称宽度限制 */
  .wl-header-item:first-child input,
  #wl-nick,
  .wl-nick {
    max-width: none !important;
  }
}

html.dark .wl-card {
  background-color: transparent;
}

html.dark .wl-meta > span {
  color: var(--vp-c-text-2);
}

.wl-btn {
  background-color: var(--vp-c-brand-1) !important;
  color: white !important;
  border-radius: 4px !important;
}

.wl-btn:hover {
  background-color: var(--vp-c-brand-2) !important;
}

/* 评论项样式 */
.wl-card {
  border-radius: 0 !important;
  background-color: transparent !important;
  transition: all 0.3s !important;
}

/* 确保表情符号不受字体影响 */
.wl-emoji {
  font-family: sans-serif !important;
}

/* 提高反应元素的层级，避免被遮挡 */
.wl-reaction, 
.wl-reaction-list,
.wl-reaction-img {
  z-index: 10 !important;
  position: relative !important;
}

.wl-reaction:hover {
  z-index: 999 !important;
}

.wl-reaction-list {
  overflow: visible !important;
}

/* 调整反应项样式 */
.wl-reaction-item {
  margin: 0 10px 10px !important;
  padding: 6px 8px !important;
  min-height: auto !important;
  min-width: auto !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
}

/* 调整图标大小 */
.wl-reaction-img {
  height: 36px !important;
  width: 36px !important;
  padding: 0 !important;
  margin-bottom: 2px !important;
}

/* 调整文本样式 */
.wl-reaction-text {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  margin-top: 4px !important;
  font-size: 13px !important;
}

/* 隐藏原来的计数器 */
.wl-reaction-counter {
  display: none !important;
}

/* 自定义JS来添加计数 */
@keyframes none {
  from { opacity: 0.99; }
  to { opacity: 1; }
}

/* 监听DOM变化的技巧，触发自定义CSS */
.wl-reaction {
  animation: none 1ms;
  animation-iteration-count: infinite;
}

/* 确保反应元素在悬停时有足够空间 */
.wl-reaction-item:hover .wl-reaction-img {
  transform: scale(1.2) !important;
  transition: transform 0.2s ease !important;
}
</style>

<script>
// 在组件加载后修改反应文本显示
document.addEventListener('DOMContentLoaded', function() {
  // 创建MutationObserver监听DOM变化
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList' && document.querySelector('.wl-reaction')) {
        updateReactionText();
      }
    });
  });
  
  // 开始观察
  observer.observe(document.body, { childList: true, subtree: true });
  
  // 定期检查并更新反应文本
  setInterval(updateReactionText, 1000);
  
  function updateReactionText() {
    const reactionItems = document.querySelectorAll('.wl-reaction-item');
    reactionItems.forEach(item => {
      const text = item.querySelector('.wl-reaction-text');
      const counter = item.querySelector('.wl-reaction-counter');
      if (text && counter) {
        const count = counter.textContent.trim() || '0';
        const label = text.getAttribute('data-reaction-text');
        if (label) {
          text.textContent = `${label}(${count})`;
        }
      }
    });
  }
});
</script> 