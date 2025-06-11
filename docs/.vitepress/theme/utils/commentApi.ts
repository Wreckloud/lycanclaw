/**
 * 评论API封装
 * 提供获取最新评论等功能
 */

// 服务器URL配置
const WALINE_SERVER_URL = 'https://lycanclaw-comment.netlify.app/.netlify/functions/comment';

// 缓存相关常量
const RECENT_COMMENTS_CACHE_KEY = 'lycan_recent_comments';
const RECENT_COMMENTS_CACHE_TIME_KEY = 'lycan_recent_comments_time';
const CACHE_EXPIRATION = 10 * 60 * 1000; // 调整为10分钟缓存，平衡性能和及时性

/**
 * 评论数据结构
 */
export interface WalineComment {
  objectId: string;
  comment: string;
  nick: string;
  mail: string;
  link: string;
  url: string;
  insertedAt: string;
  browser?: string;
  os?: string;
  level?: number;
  avatar?: string;
  addr?: string;
  ip?: string;
  pid?: string;
  rid?: string;
  status?: string;
  ua?: string;
  like?: number;
  sticky?: boolean;
  user_id?: string;
  createdAt?: string;
  updatedAt?: string;
  ACL?: any;
}

// 预加载标志，防止多次重复请求
let isPreloading = false;
let preloadPromise: Promise<WalineComment[]> | null = null;

/**
 * HTTP请求工具
 */
const http = {
  async get(url: string): Promise<any> {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`[CommentAPI] 请求错误:`, error);
      throw error;
    }
  }
};

/**
 * 从缓存中获取最新评论
 */
function getRecentCommentsFromCache(): WalineComment[] | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  
  try {
    const cachedData = localStorage.getItem(RECENT_COMMENTS_CACHE_KEY);
    
    // 检查缓存是否存在
    if (!cachedData) return null;
    
    // 检查缓存是否过期
    const cacheTime = localStorage.getItem(RECENT_COMMENTS_CACHE_TIME_KEY);
    if (!cacheTime) return null;
    
    const now = Date.now();
    if ((now - parseInt(cacheTime)) > CACHE_EXPIRATION) {
      return null;
    }
    
    return JSON.parse(cachedData);
  } catch (e) {
    return null;
  }
}

/**
 * 将最新评论保存到缓存
 */
function saveRecentCommentsToCache(comments: WalineComment[]): void {
  if (typeof window === 'undefined' || !window.localStorage || !comments?.length) return;
  
  try {
    localStorage.setItem(RECENT_COMMENTS_CACHE_KEY, JSON.stringify(comments));
    localStorage.setItem(RECENT_COMMENTS_CACHE_TIME_KEY, Date.now().toString());
  } catch (e) {
  }
}

/**
 * 清除评论缓存
 * 在需要强制刷新评论数据的情况下使用
 */
export function clearCommentsCache(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  
  try {
    localStorage.removeItem(RECENT_COMMENTS_CACHE_KEY);
    localStorage.removeItem(RECENT_COMMENTS_CACHE_TIME_KEY);
  } catch (e) {
  }
}

/**
 * 预加载评论数据
 * 在页面空闲时调用，提前加载评论数据到缓存
 */
export function preloadRecentComments(count: number = 5): void {
  if (typeof window === 'undefined' || isPreloading) return;
  
  isPreloading = true;
  
  // 使用requestIdleCallback在浏览器空闲时执行
  const requestIdle = (window as any).requestIdleCallback || 
    ((cb: Function) => setTimeout(() => cb(), 1000));
  
  requestIdle(() => {
    getRecentComments(count).finally(() => {
      isPreloading = false;
    });
  });
}

/**
 * 获取最新评论
 * @param count 获取的评论数量，默认为5
 * @param forceRefresh 是否强制刷新（忽略缓存）
 * @returns 评论数组
 */
export async function getRecentComments(count: number = 5, forceRefresh: boolean = false): Promise<WalineComment[]> {
  // 如果强制刷新，清除缓存
  if (forceRefresh) {
    clearCommentsCache();
  }
  
  // 如果正在预加载且不是强制刷新，复用相同的请求
  if (isPreloading && preloadPromise && !forceRefresh) {
    return preloadPromise;
  }
  
  // 先检查缓存（除非强制刷新）
  if (!forceRefresh) {
    const cachedComments = getRecentCommentsFromCache();
    if (cachedComments) {
      return cachedComments;
    }
  }
  
  // 创建获取评论的Promise
  const fetchPromise = (async () => {
    try {
      // 获取最新评论
      const url = `${WALINE_SERVER_URL}/comment?type=recent&count=${count}&_t=${Date.now()}`;
      const data = await http.get(url);
      
      // Waline最新评论API返回的是数组
      if (Array.isArray(data)) {
        saveRecentCommentsToCache(data);
        return data;
      } else {
        console.error('[CommentAPI] 评论数据格式不正确', data);
        return [];
      }
    } catch (error) {
      console.error('[CommentAPI] 获取最新评论失败:', error);
      return [];
    }
  })();
  
  // 保存Promise以便预加载时复用
  preloadPromise = fetchPromise;
  
  // 请求完成后重置预加载状态
  fetchPromise.finally(() => {
    preloadPromise = null;
    isPreloading = false;
  });
  
  return fetchPromise;
}

/**
 * 获取特定文章的评论数
 * @param path 文章路径
 * @returns 评论数量
 */
export async function getCommentCount(path: string): Promise<number> {
  if (!path) return 0;
  
  try {
    const url = `${WALINE_SERVER_URL}/comment?type=count&url=${encodeURIComponent(path)}`;
    const data = await http.get(url);
    
    return typeof data === 'number' ? data : 0;
  } catch (error) {
    console.error('[CommentAPI] 获取评论数失败:', error);
    return 0;
  }
}

/**
 * 格式化评论发布时间
 * @param dateString 日期字符串
 * @returns 格式化后的字符串
 */
export function formatCommentDate(dateString: string): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diff / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 7) {
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  } else if (diffDays > 0) {
    return `${diffDays}天前`;
  } else if (diffHours > 0) {
    return `${diffHours}小时前`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes}分钟前`;
  } else {
    return '刚刚';
  }
} 