/**
 * 页面浏览量统计脚本
 * 使用Waline的pageviewCount API
 */

/**
 * 初始化页面浏览量统计
 */
export function initPageView() {
  // 确保在浏览器环境中执行
  if (typeof window === 'undefined') return;
  
  // 防止多次加载同一脚本
  const scriptId = 'waline-pageview-script';
  if (document.getElementById(scriptId)) return;
  
  // 创建并加载Waline页面浏览量脚本
  const script = document.createElement('script');
  script.id = scriptId;
  script.src = 'https://unpkg.com/@waline/client@v3/dist/pageview.js';
  script.onload = function() {
    if (typeof window.pageviewCount === 'function') {
      // 获取当前路径
      const path = window.location.pathname;
      
      // 初始化Waline浏览量统计
      window.pageviewCount({
        serverURL: 'https://lycanclaw-comment.netlify.app/.netlify/functions/comment',
        path: path,
        selector: '.waline-pageview-count',
        update: true,
      }).catch(err => {
        console.error('Waline页面浏览量统计初始化失败:', err);
      });
    }
  };
  
  document.head.appendChild(script);
} 