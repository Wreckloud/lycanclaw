/**
 * 代理配置 - 用于解决本地开发环境中的CORS问题
 * 
 * 这个文件定义了API代理配置，可以在vite.config.js中使用
 */

export const proxyConfig = {
  '/api/netease': {
    target: 'https://163api.qijieya.cn',
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/api\/netease/, ''),
    headers: {
      'Referer': 'https://lycanclaw.xyz',
      'Origin': 'https://lycanclaw.xyz'
    }
  }
};

/**
 * 获取代理URL
 * 根据环境自动选择直接URL或代理URL
 * 
 * @param originalUrl 原始URL
 * @returns 处理后的URL
 */
export function getProxyUrl(originalUrl: string): string {
  if (!originalUrl) return '';
  
  // 如果是网易云音乐API，且在本地开发环境
  if (originalUrl.includes('163api.qijieya.cn') && 
      typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    
    // 替换为本地代理路径
    return originalUrl.replace('https://163api.qijieya.cn', '/api/netease');
  }
  
  // 其他情况直接返回原始URL
  return originalUrl;
}

/**
 * 添加CORS代理
 * 用于动态处理需要跨域的请求
 * 
 * @param url 原始URL
 * @returns 处理后的URL
 */
export function addCorsProxy(url: string): string {
  if (!url) return '';
  
  // 确保所有URL都使用HTTPS协议
  if (url.startsWith('http:')) {
    url = url.replace('http:', 'https:');
  }
  
  // 使用getProxyUrl函数处理网易云API的URL
  if (url.includes('163api.qijieya.cn')) {
    return getProxyUrl(url);
  }
  
  // 网易云音乐内容确保使用HTTPS，包括音乐和图片资源
  if (url.includes('music.163.com') || 
      url.includes('music.126.net') || 
      url.includes('m7.music.126.net') || 
      url.includes('m8.music.126.net') || 
      url.includes('m10.music.126.net')) {
    // 确保使用HTTPS协议
    if (url.startsWith('http:')) {
      url = url.replace('http:', 'https:');
    }
    return url;
  }
  
  return url;
}

export default {
  proxyConfig,
  getProxyUrl,
  addCorsProxy
}; 