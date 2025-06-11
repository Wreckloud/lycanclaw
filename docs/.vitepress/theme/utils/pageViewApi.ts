/**
 * 页面浏览量API封装
 * 提供稳定的页面浏览量获取和更新功能
 * 使用Waline的API接口，并实现本地缓存
 */

// 服务器URL配置
const WALINE_SERVER_URL = 'https://lycanclaw-comment.netlify.app/.netlify/functions/comment';

// 缓存相关常量
const PAGEVIEW_CACHE_PREFIX = 'lycan_pageview_';
const PAGEVIEW_CACHE_TIME_SUFFIX = '_time';
const CACHE_EXPIRATION = 30 * 60 * 1000; // 30分钟缓存

// 站点访问量缓存键
const SITE_UV_CACHE_KEY = 'lycan_site_uv';
const SITE_UV_CACHE_TIME_KEY = 'lycan_site_uv_time';
const SITE_UV_CACHE_EXPIRATION = 6 * 60 * 60 * 1000; // 6小时缓存

// 访问记录键前缀，用于防止重复计数
const VISIT_RECORD_PREFIX = 'lycan_visit_record_';
const VISIT_RECORD_EXPIRATION = 30 * 60 * 1000; // 30分钟内不重复计数

// 是否开启调试模式
const DEBUG = false;

// 存储更新中的路径，避免并发更新同一页面
const updatingPaths = new Set();

/**
 * 调试日志函数
 */
function debug(...args: any[]) {
  if (DEBUG) {
    console.log('[PageView API]', ...args);
  }
}

/**
 * 创建一个简单的HTTP客户端
 */
const http = {
  async get(url: string): Promise<any> {
    debug(`GET请求: ${url}`);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      mode: 'cors', // 尝试解决CORS问题
      credentials: 'omit' // 不发送cookie
    });
    
    if (!response.ok) {
      throw new Error(`请求失败: ${response.status}`);
    }
    
    const data = await response.json();
    debug(`GET响应:`, data);
    return data;
  },
  
  async post(url: string, body: any): Promise<any> {
    debug(`POST请求: ${url}, 请求体:`, body);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      mode: 'cors', // 尝试解决CORS问题
      credentials: 'omit' // 不发送cookie
    });
    
    if (!response.ok) {
      throw new Error(`请求失败: ${response.status}`);
    }
    
    try {
      const data = await response.json();
      debug(`POST响应:`, data);
      return data;
    } catch (e) {
      // 有些POST请求可能没有响应体
      debug(`POST请求成功，但没有响应体`);
      return null;
    }
  }
};

/**
 * 从缓存中获取页面访问量
 * @param path 页面路径
 * @returns 缓存的访问量或null
 */
export function getPageViewFromCache(path: string): number | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  
  try {
    const cacheKey = `${PAGEVIEW_CACHE_PREFIX}${path}`;
    const cachedData = localStorage.getItem(cacheKey);
    
    // 检查缓存是否存在
    if (!cachedData) return null;
    
    // 检查缓存是否过期
    const cacheTime = localStorage.getItem(`${cacheKey}${PAGEVIEW_CACHE_TIME_SUFFIX}`);
    if (!cacheTime) return null;
    
    const now = Date.now();
    if ((now - parseInt(cacheTime)) > CACHE_EXPIRATION) return null;
    
    const count = parseInt(cachedData);
    debug(`从缓存获取页面访问量: ${path} => ${count}`);
    return count;
  } catch (e) {
    console.error('从缓存获取页面访问量失败:', e);
    return null;
  }
}

/**
 * 将页面访问量保存到缓存
 * @param path 页面路径
 * @param count 页面访问量
 */
function savePageViewToCache(path: string, count: number): void {
  if (typeof window === 'undefined' || !window.localStorage || !count) return;
  
  try {
    const cacheKey = `${PAGEVIEW_CACHE_PREFIX}${path}`;
    localStorage.setItem(cacheKey, count.toString());
    localStorage.setItem(`${cacheKey}${PAGEVIEW_CACHE_TIME_SUFFIX}`, Date.now().toString());
    debug(`保存页面访问量到缓存: ${path} => ${count}`);
  } catch (e) {
    console.error('保存页面访问量到缓存失败:', e);
  }
}

/**
 * 清除特定路径的页面访问量缓存
 * @param path 页面路径
 */
function clearPageViewCache(path: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  
  try {
    const cacheKey = `${PAGEVIEW_CACHE_PREFIX}${path}`;
    localStorage.removeItem(cacheKey);
    localStorage.removeItem(`${cacheKey}${PAGEVIEW_CACHE_TIME_SUFFIX}`);
    debug(`清除页面访问量缓存: ${path}`);
  } catch (e) {
    console.error('清除页面访问量缓存失败:', e);
  }
}

/**
 * 检查是否需要更新访问量（防止重复计数）
 * @param path 页面路径
 * @returns 是否需要更新
 */
function shouldUpdateVisit(path: string): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return true;
  
  try {
    const now = Date.now();
    const recordKey = `${VISIT_RECORD_PREFIX}${path}`;
    const lastVisitTime = localStorage.getItem(recordKey);
    
    // 如果没有访问记录或者已过期，则需要更新
    if (!lastVisitTime || (now - parseInt(lastVisitTime)) > VISIT_RECORD_EXPIRATION) {
      // 记录当前访问时间
      localStorage.setItem(recordKey, now.toString());
      debug(`记录新的访问: ${path}`);
      return true;
    }
    
    debug(`忽略重复访问: ${path}`);
    return false;
  } catch (e) {
    console.error('检查访问记录失败:', e);
    return true;
  }
}

/**
 * 获取页面浏览量
 * @param path 页面路径，默认为当前页面路径
 * @param fallbackValue 默认值，当获取失败时返回此值
 * @returns 页面浏览量，获取失败时返回fallbackValue或默认值1
 */
export async function getPageView(path?: string, fallbackValue: number = 1): Promise<number> {
  // 使用传入的路径或当前页面路径
  const currentPath = path || (typeof window !== 'undefined' ? window.location.pathname : '');
  if (!currentPath) return fallbackValue;

  debug(`开始获取页面浏览量: ${currentPath}`);

  // 先尝试从缓存获取
  const cachedCount = getPageViewFromCache(currentPath);
  if (cachedCount !== null) {
    debug(`使用缓存的页面浏览量: ${currentPath} => ${cachedCount}`);
    return cachedCount;
  }
  
  try {
    // 从Waline API获取
    const url = `${WALINE_SERVER_URL}/article?path=${encodeURIComponent(currentPath)}`;
    const data = await http.get(url);
    
    // Waline返回的是数字
    if (typeof data === 'number') {
      // 保存到缓存
      if (data > 0) {
        savePageViewToCache(currentPath, data);
        return data;
      } else {
        // 如果API返回0，使用兜底值
        debug(`API返回值为0，使用兜底值: ${fallbackValue}`);
        return fallbackValue;
      }
    }
    
    debug(`页面浏览量响应数据类型不正确，期望数字，实际:`, typeof data);
    return fallbackValue;
  } catch (error) {
    console.error('获取页面浏览量失败:', error);
    
    // 本地开发环境下返回一个模拟值
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      const mockCount = Math.floor(Math.random() * 100) + 10;
      debug(`本地开发环境，返回模拟浏览量: ${mockCount}`);
      savePageViewToCache(currentPath, mockCount);
      return mockCount;
    }
    
    return fallbackValue;
  }
}

/**
 * 更新页面浏览量
 * @param path 页面路径，默认为当前页面路径
 * @returns 是否更新成功
 */
export async function updatePageView(path?: string): Promise<boolean> {
  // 使用传入的路径或当前页面路径
  const currentPath = path || (typeof window !== 'undefined' ? window.location.pathname : '');
  if (!currentPath) return false;

  debug(`开始更新页面浏览量: ${currentPath}`);
  
  // 防止重复计数
  if (!shouldUpdateVisit(currentPath)) {
    debug(`短时间内已访问过该页面，跳过更新: ${currentPath}`);
    return false;
  }
  
  // 避免并发更新同一页面
  if (updatingPaths.has(currentPath)) {
    debug(`该页面正在更新中，跳过重复更新: ${currentPath}`);
    return false;
  }
  
  try {
    // 标记该路径正在更新
    updatingPaths.add(currentPath);
    
    // 更新Waline的浏览量统计
    const url = `${WALINE_SERVER_URL}/article`;
    const body = { path: currentPath };
    
    await http.post(url, body);
    
    // 更新成功后清除缓存，强制下次重新获取
    clearPageViewCache(currentPath);
    return true;
  } catch (error) {
    console.error('更新页面浏览量失败:', error);
    
    // 本地开发环境不显示错误
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      debug('本地开发环境，忽略更新错误');
      return true;
    }
    
    return false;
  } finally {
    // 无论成功失败，移除更新标记
    updatingPaths.delete(currentPath);
  }
}

/**
 * 获取并更新页面浏览量
 * 这是一个便捷方法，先更新浏览量，然后获取最新的浏览量
 * @param path 页面路径，默认为当前页面路径
 * @param fallbackValue 默认值，当获取失败时返回此值
 * @returns 更新后的页面浏览量
 */
export async function getAndUpdatePageView(path?: string, fallbackValue: number = 1): Promise<number> {
  // 使用传入的路径或当前页面路径
  const currentPath = path || (typeof window !== 'undefined' ? window.location.pathname : '');
  if (!currentPath) return fallbackValue;
  
  debug(`获取并更新页面浏览量: ${currentPath}`);
  
  try {
    // 先更新浏览量，如果不需要更新（比如短时间内已访问过）则跳过
    const updated = await updatePageView(currentPath);
    
    // 获取当前缓存值，可能已经被其他调用更新了
    let currentCachedValue = getPageViewFromCache(currentPath);
    if (currentCachedValue !== null) {
      debug(`直接返回缓存的浏览量: ${currentPath} => ${currentCachedValue}`);
      return currentCachedValue;
    }
    
    // 如果没有缓存值或更新成功，则获取最新值
    if (updated || currentCachedValue === null) {
      // 然后获取最新的浏览量
      return await getPageView(currentPath, fallbackValue);
    } else {
      // 更新失败，但尝试获取当前值
      return await getPageView(currentPath, fallbackValue);
    }
  } catch (error) {
    console.error('获取并更新页面浏览量失败:', error);
    
    // 本地开发环境下返回一个模拟值
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      const mockCount = Math.floor(Math.random() * 100) + 10;
      debug(`本地开发环境，返回模拟浏览量: ${mockCount}`);
      return mockCount;
    }
    
    return fallbackValue;
  }
}

/**
 * 从缓存中获取站点访问量
 * @returns 缓存的站点访问量或null
 */
function getSiteUVFromCache(): number | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  
  try {
    const cachedData = localStorage.getItem(SITE_UV_CACHE_KEY);
    
    // 检查缓存是否存在
    if (!cachedData) return null;
    
    // 检查缓存是否过期
    const cacheTime = localStorage.getItem(SITE_UV_CACHE_TIME_KEY);
    if (!cacheTime) return null;
    
    const now = Date.now();
    if ((now - parseInt(cacheTime)) > SITE_UV_CACHE_EXPIRATION) return null;
    
    const count = parseInt(cachedData);
    debug(`从缓存获取站点访问量: ${count}`);
    return count;
  } catch (e) {
    console.error('从缓存获取站点访问量失败:', e);
    return null;
  }
}

/**
 * 将站点访问量保存到缓存
 * @param count 站点访问量
 */
function saveSiteUVToCache(count: number): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  
  try {
    localStorage.setItem(SITE_UV_CACHE_KEY, count.toString());
    localStorage.setItem(SITE_UV_CACHE_TIME_KEY, Date.now().toString());
    debug(`保存站点访问量到缓存: ${count}`);
  } catch (e) {
    console.error('保存站点访问量到缓存失败:', e);
  }
}

/**
 * 获取站点访问量
 * 注意：此API目前使用不蒜子统计的UV，将来可能会更换为Waline的统计API
 * @param fallbackValue 默认值，当获取失败时返回此值
 * @returns 站点访问量，获取失败时返回fallbackValue或默认值100
 */
export async function getSiteUV(fallbackValue: number = 100): Promise<number> {
  debug('开始获取站点访问量');
  
  // 先尝试从缓存获取
  const cachedCount = getSiteUVFromCache();
  if (cachedCount !== null) {
    debug(`使用缓存的站点访问量: ${cachedCount}`);
    return cachedCount;
  }
  
  try {
    // 目前使用不蒜子统计UV
    // 加载不蒜子脚本
    debug('加载不蒜子脚本...');
    await loadBusuanziScript();
    
    // 尝试获取不蒜子的UV值
    debug('尝试获取不蒜子UV值...');
    return new Promise((resolve) => {
      // 尝试最多10次，每次间隔300ms
      let attempts = 0;
      const maxAttempts = 10;
      
      const checkUV = () => {
        const uvElement = document.getElementById('busuanzi_value_site_uv');
        debug(`尝试 #${attempts+1} 获取UV元素:`, uvElement?.textContent);
        
        if (uvElement && uvElement.textContent && uvElement.textContent !== '0') {
          const count = parseInt(uvElement.textContent);
          if (!isNaN(count) && count > 0) {
            // 保存到缓存
            saveSiteUVToCache(count);
            debug(`成功获取站点访问量: ${count}`);
            resolve(count);
            return;
          }
        }
        
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkUV, 300);
        } else {
          // 超过最大尝试次数，返回默认值
          if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
            const mockCount = Math.floor(Math.random() * 1000) + 100;
            debug(`本地开发环境，返回模拟站点访问量: ${mockCount}`);
            saveSiteUVToCache(mockCount);
            resolve(mockCount);
          } else {
            debug(`获取站点访问量失败，返回默认值: ${fallbackValue}`);
            resolve(fallbackValue);
          }
        }
      };
      
      checkUV();
    });
  } catch (error) {
    console.error('获取站点访问量失败:', error);
    
    // 本地开发环境下返回一个模拟值
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      const mockCount = Math.floor(Math.random() * 1000) + 100;
      debug(`本地开发环境，返回模拟站点访问量: ${mockCount}`);
      return mockCount;
    }
    
    return fallbackValue;
  }
}

/**
 * 加载不蒜子统计脚本
 * @returns Promise
 */
function loadBusuanziScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // 防止重复加载脚本
    if (document.getElementById('busuanzi_script')) {
      // 如果脚本已经加载，尝试重新初始化
      if (typeof window !== 'undefined' && window['busuanzi'] && typeof window['busuanzi'].fetch === 'function') {
        debug('不蒜子脚本已加载，重新初始化');
        window['busuanzi'].fetch();
      }
      resolve();
      return;
    }
    
    // 创建不蒜子脚本
    const script = document.createElement('script');
    script.id = 'busuanzi_script';
    script.src = '//busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js';
    script.async = true;
    
    debug(`加载不蒜子脚本: ${script.src}`);
    
    script.onload = () => {
      // 确保不蒜子初始化
      debug('不蒜子脚本加载成功，初始化');
      if (window['busuanzi'] && typeof window['busuanzi'].fetch === 'function') {
        window['busuanzi'].fetch();
      }
      resolve();
    };
    
    script.onerror = (e) => {
      debug('不蒜子脚本加载失败', e);
      
      // 本地开发环境不显示错误
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        debug('本地开发环境，忽略脚本加载错误');
        resolve();
      } else {
        reject(new Error('不蒜子脚本加载失败'));
      }
    };
    
    // 添加脚本到页面
    document.head.appendChild(script);
  });
}

/**
 * 测试函数：手动设置页面浏览量（仅缓存）
 * 此函数仅用于开发和测试，不应在生产环境中使用
 * @param count 要设置的浏览量
 * @param path 页面路径，默认为当前页面路径
 */
export function __setTestPageView(count: number, path?: string): void {
  if (typeof window === 'undefined') return;
  
  const currentPath = path || window.location.pathname;
  debug(`设置测试页面浏览量: ${currentPath} => ${count}`);
  
  savePageViewToCache(currentPath, count);
}

/**
 * 测试函数：手动设置站点访问量（仅缓存）
 * 此函数仅用于开发和测试，不应在生产环境中使用
 * @param count 要设置的访问量
 */
export function __setTestSiteUV(count: number): void {
  if (typeof window === 'undefined') return;
  
  debug(`设置测试站点访问量: ${count}`);
  
  saveSiteUVToCache(count);
} 