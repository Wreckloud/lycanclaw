/**
 * 页面浏览量统计脚本
 * 使用封装的页面浏览量API
 */
import { getAndUpdatePageView, getPageViewFromCache } from '../utils/pageViewApi';

/**
 * 初始化页面浏览量统计
 * @param {string} selector - 要更新浏览量的元素选择器，默认为 '.waline-pageview-count'
 */
export async function initPageView(selector = '.waline-pageview-count') {
  // 确保在浏览器环境中执行
  if (typeof window === 'undefined') return;
  
  try {
    // 先检查缓存
    const currentPath = window.location.pathname;
    const cachedCount = getPageViewFromCache(currentPath);
    
    // 如果有缓存值，立即更新显示
    if (cachedCount !== null && cachedCount > 0) {
      updateElements(selector, cachedCount);
    } else {
      // 无缓存值，显示默认值1
      updateElements(selector, 1);
    }
    
    // 获取并更新当前页面的浏览量
    const count = await getAndUpdatePageView(undefined, 1);
    
    // 更新页面上所有匹配选择器的元素
    if (count && count > 0) {
      updateElements(selector, count);
    }
  } catch (error) {
    console.error('页面浏览量统计初始化失败:', error);
    // 出错时显示默认值1
    updateElements(selector, 1);
  }
}

/**
 * 更新页面上的计数器元素
 * @param {string} selector - 元素选择器
 * @param {number} count - 计数值
 */
function updateElements(selector, count) {
  const elements = document.querySelectorAll(selector);
  if (elements.length > 0) {
    elements.forEach(el => {
      el.textContent = count.toString();
    });
  }
} 