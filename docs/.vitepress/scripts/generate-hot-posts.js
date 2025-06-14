/**
 * generate-hot-posts.js
 * 生成热门文章数据，用于首页推荐阅读模块
 * 热度计算综合考虑：评论数、浏览量和时间新鲜度
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

// 确保脚本开始运行时显示明确的输出
console.log('======================================')
console.log('      开始生成热门文章数据')
console.log('======================================')

// 使用现有的Waline API
// 注意：Node环境下需要模拟window和localStorage，或使用适合的替代方案

// Waline API 地址配置，与utils/commentApi.ts和pageViewApi.ts一致
const WALINE_SERVER_URL = 'https://lycanclaw-comment.netlify.app/.netlify/functions/comment';

// 创建Node环境下的API工具
// 这里我们模拟浏览器环境中的localStorage
class NodeLocalStorage {
  constructor() {
    this.store = {};
  }
  
  getItem(key) {
    return this.store[key] === undefined ? null : this.store[key];
  }
  
  setItem(key, value) {
    this.store[key] = String(value);
  }
  
  removeItem(key) {
    delete this.store[key];
  }
}

// 模拟window对象
global.window = {
  localStorage: new NodeLocalStorage()
};

// 是否开启调试模式
const DEBUG = true;

// 配置
const config = {
  // 热度分数权重
  weights: {
    comments: 5,      // 每条评论的权重
    pageviews: 0.5,   // 每次浏览的权重
    recency: {        // 时间新鲜度加权
      week: 50,       // 一周内
      month: 30,      // 一月内
      quarter: 10     // 三月内
    }
  },
  // 输出的热门文章数量
  topCount: 10,
  // 缓存有效期（毫秒）
  cacheExpiry: 24 * 60 * 60 * 1000, // 24小时
  // 请求重试次数
  maxRetries: 3,
  // 重试延迟（毫秒）
  retryDelay: 1000
}

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 目录定义
const docsDir = path.join(path.resolve(), 'docs');
const publicDir = path.join(docsDir, '.vitepress', 'public');
const docsPublicDir = path.join(docsDir, 'public'); // 添加docs/public目录
const tempDir = path.join(docsDir, '.vitepress', 'temp');
const outputPath = path.join(publicDir, 'hot-posts.json');
const docsOutputPath = path.join(docsPublicDir, 'hot-posts.json'); // 添加docs/public输出路径
const cachePath = path.join(tempDir, 'hot-posts-cache.json');

// 确保临时目录存在
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// 确保输出目录存在
if (!fs.existsSync(path.dirname(outputPath))) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
}

// 确保docs/public目录存在
if (!fs.existsSync(docsPublicDir)) {
  fs.mkdirSync(docsPublicDir, { recursive: true });
}

// 创建基本的HTTP客户端
const http = {
  async get(url) {
    console.log(`GET请求: ${url}`);
    
    let retries = config.maxRetries;
    
    while (retries >= 0) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Node.js/HotPostsGenerator',
          'Accept': 'application/json'
        },
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`请求失败: ${response.status} ${response.statusText}`);
          console.error(`响应内容: ${errorText.substring(0, 500)}`);
        throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
      }
      
      // 先克隆响应，再读取内容
      const responseClone = response.clone();
      
      // 尝试解析JSON
      try {
          const contentType = response.headers.get('content-type');
          if (DEBUG) console.log(`响应Content-Type: ${contentType}`);
          
          if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
            if (DEBUG) console.log(`JSON响应: ${JSON.stringify(data).substring(0, 200)}`);
        return data;
          } else {
            // 非JSON响应，读取为文本
            const text = await response.text();
            console.log(`非JSON响应(${contentType}): ${text.substring(0, 200)}`);
            try {
              // 尝试将文本解析为JSON
              return JSON.parse(text);
            } catch {
              // 不是JSON，返回原始文本
              return text;
            }
          }
      } catch (jsonError) {
        // 如果JSON解析失败，尝试获取原始文本
        const text = await responseClone.text();
        console.error(`JSON解析失败: ${jsonError.message}`);
          console.error(`原始响应: ${text.substring(0, 500)}`);
        throw new Error(`JSON解析失败: ${jsonError.message}`);
      }
    } catch (error) {
        retries--;
        if (retries >= 0) {
          console.log(`请求失败，将在${config.retryDelay}ms后重试，剩余重试次数: ${retries}`);
          await new Promise(resolve => setTimeout(resolve, config.retryDelay));
          continue;
        }
        console.error(`请求错误(已重试${config.maxRetries}次): ${url}`, error);
      throw error;
      }
    }
  },
  
  async post(url, data) {
    console.log(`POST请求: ${url}`);
    if (DEBUG) console.log(`请求体: ${JSON.stringify(data)}`);
    
    let retries = config.maxRetries;
    
    while (retries >= 0) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Node.js/HotPostsGenerator',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data),
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`请求失败: ${response.status} ${response.statusText}`);
          console.error(`响应内容: ${errorText.substring(0, 500)}`);
        throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
      }
      
      // 先克隆响应，再读取内容
      const responseClone = response.clone();
      
      // 尝试解析JSON
      try {
          const contentType = response.headers.get('content-type');
          if (DEBUG) console.log(`响应Content-Type: ${contentType}`);
          
          if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
            if (DEBUG) console.log(`JSON响应: ${JSON.stringify(data).substring(0, 200)}`);
        return data;
          } else {
            // 非JSON响应，读取为文本
            const text = await response.text();
            console.log(`非JSON响应(${contentType}): ${text.substring(0, 200)}`);
            try {
              // 尝试将文本解析为JSON
              return JSON.parse(text);
            } catch {
              // 不是JSON，返回原始文本
              return text;
            }
          }
      } catch (jsonError) {
        // 如果JSON解析失败，尝试获取原始文本
        const text = await responseClone.text();
        console.error(`JSON解析失败: ${jsonError.message}`);
          console.error(`原始响应: ${text.substring(0, 500)}`);
        throw new Error(`JSON解析失败: ${jsonError.message}`);
      }
    } catch (error) {
        retries--;
        if (retries >= 0) {
          console.log(`请求失败，将在${config.retryDelay}ms后重试，剩余重试次数: ${retries}`);
          await new Promise(resolve => setTimeout(resolve, config.retryDelay));
          continue;
        }
        console.error(`请求错误(已重试${config.maxRetries}次): ${url}`, error);
      throw error;
      }
    }
  }
};

// 缓存管理
let cache = {
  comments: {},
  pageviews: {},
  lastFetched: null
};

// 加载缓存
function loadCache() {
  try {
    if (fs.existsSync(cachePath)) {
      const cacheData = fs.readFileSync(cachePath, 'utf-8');
      cache = JSON.parse(cacheData);
      console.log('✓ 已加载缓存数据');
    }
  } catch (err) {
    console.log('! 无法加载缓存，将使用空缓存');
    cache = {
      comments: {},
      pageviews: {},
      lastFetched: null
    };
  }
}

// 保存缓存
function saveCache() {
  try {
    fs.writeFileSync(cachePath, JSON.stringify(cache), 'utf-8');
    console.log('✓ 已保存缓存数据');
  } catch (err) {
    console.error('✗ 保存缓存失败', err);
  }
}

// 检查缓存是否过期
function isCacheExpired() {
  return !cache.lastFetched || 
    (new Date() - new Date(cache.lastFetched)) > config.cacheExpiry;
}

// 从Waline API获取评论数据
async function fetchCommentCounts() {
  try {
    // 获取所有文章路径
    const postsJsonPath = path.join(docsDir, 'public', 'posts.json');
    if (!fs.existsSync(postsJsonPath)) {
      throw new Error('posts.json文件不存在');
    }
    
    const posts = JSON.parse(fs.readFileSync(postsJsonPath, 'utf-8'));
    const paths = posts.map(post => post.url);
    
    // 使用Waline API获取评论数
    console.log('获取评论数据...');
    console.log(`文章路径数量: ${paths.length}`);
    
    // 使用与浏览器环境相同的API路径格式
    // 参考commentApi.ts中的实现
    const response = await http.get(`${WALINE_SERVER_URL}/comment?type=count&_t=${Date.now()}`);
    
    // 处理API响应
    if (response) {
      console.log(`✓ 已获取评论数据`);
      
      // API返回数字时，表示总评论数，但不是我们需要的按路径分组的数据
      if (typeof response === 'number') {
        console.log(`API返回总评论数: ${response}`);
        console.log(`但需要按路径分组的评论数，将使用空数据`);
        cache.comments = {};
      } 
      // API返回对象时，是按路径分组的评论数
      else if (typeof response === 'object') {
        console.log('评论数据示例:', JSON.stringify(response).substring(0, 100) + '...');
        cache.comments = response;
      } 
      else {
        console.error('✗ 评论数据格式不正确', response);
        console.error('响应类型:', typeof response);
      }
    } else {
      console.error('✗ 评论数据响应为空');
    }
  } catch (err) {
    console.error('✗ 获取评论数据失败', err);
    console.error('错误详情:', err.message);
    if (err.response) {
      console.error('响应状态:', err.response.status);
      console.error('响应数据:', err.response.data);
    }
  }
}

// 从Waline API获取浏览量数据
async function fetchPageViews() {
  try {
    // 获取所有文章路径
    const postsJsonPath = path.join(docsDir, 'public', 'posts.json');
    if (!fs.existsSync(postsJsonPath)) {
      throw new Error('posts.json文件不存在');
    }
    
    const posts = JSON.parse(fs.readFileSync(postsJsonPath, 'utf-8'));
    const paths = posts.map(post => post.url);
    
    console.log('获取浏览量数据...');
    console.log(`准备获取 ${paths.length} 篇文章的浏览量`);
    
    // 方法1: 一次性获取所有文章浏览量
    console.log('尝试方法1: 批量获取文章浏览量');
    try {
      // 根据API文档，使用逗号分隔多个path
      // 参考: https://waline.js.org/reference/server/api.html#获取阅读统计数
      const pathsParam = paths.slice(0, 50).join(','); // 限制请求长度，避免URL过长
      const batchUrl = `${WALINE_SERVER_URL}/article?path=${encodeURIComponent(pathsParam)}&_t=${Date.now()}`;
      console.log(`批量请求URL: ${batchUrl.substring(0, 100)}...`);
      
      const batchResponse = await http.get(batchUrl);
      
      if (Array.isArray(batchResponse)) {
        console.log(`✓ 批量获取成功，收到 ${batchResponse.length} 条数据`);
        
        const pageviewsByPath = {};
        batchResponse.forEach(item => {
          if (item && item.url && typeof item.time === 'number') {
            pageviewsByPath[item.url] = item.time;
          }
        });
        cache.pageviews = pageviewsByPath;
        return;
      } else {
        console.log('批量获取失败，返回格式不是数组，尝试方法2');
      }
    } catch (batchError) {
      console.error('批量获取失败:', batchError.message);
      console.log('尝试方法2: 获取所有浏览量');
    }
    
    // 方法2: 获取所有浏览量数据
    console.log('尝试方法2: 获取所有浏览量数据');
    const response = await http.get(`${WALINE_SERVER_URL}/article?_t=${Date.now()}`);
    
    console.log(`API响应类型: ${typeof response}`);
    if (response !== undefined) {
      console.log(`API响应示例: ${JSON.stringify(response).substring(0, 200)}`);
    }
    
    // 处理API响应
    if (response !== undefined && response !== null) {
      console.log(`✓ 已获取浏览量数据`);
      
      // API返回数字时，表示总浏览量，但不是我们需要的按路径分组的数据
      if (typeof response === 'number') {
        console.log(`API返回总浏览量: ${response}`);
        console.log(`但需要按路径分组的浏览量，将使用空数据`);
        cache.pageviews = {};
      }
      // API返回数组时，是按路径分组的浏览量
      else if (Array.isArray(response)) {
        console.log('浏览量数据示例:', JSON.stringify(response).substring(0, 100) + '...');
        
        const pageviewsByPath = {};
        response.forEach(item => {
          if (item && item.url && typeof item.time === 'number') {
            pageviewsByPath[item.url] = item.time;
          }
        });
        cache.pageviews = pageviewsByPath;
      } 
      // API返回对象时，可能已经是我们需要的格式
      else if (typeof response === 'object') {
        console.log('浏览量数据示例:', JSON.stringify(response).substring(0, 100) + '...');
        cache.pageviews = response;
      } 
      else {
        console.error('✗ 浏览量数据格式不正确', response);
        console.error('响应类型:', typeof response);
      }
    } else {
      console.error('✗ 浏览量数据响应为空');
    }
  } catch (err) {
    console.error('✗ 获取浏览量数据失败', err);
    console.error('错误详情:', err.message);
    if (err.response) {
      console.error('响应状态:', err.response.status);
      console.error('响应数据:', err.response.data);
    }
  }
}

// 更新Waline数据缓存
async function updateWalineCache(forceRefresh = false) {
  // 检查缓存是否过期，或是否强制刷新
  if (!forceRefresh && !isCacheExpired()) {
    console.log('✓ 缓存有效，跳过更新');
    return;
  }
  
  // 强制更新缓存
  console.log('强制更新数据缓存...');
  
  // 并行获取评论和浏览量数据
  await Promise.all([
    fetchCommentCounts(),
    fetchPageViews()
  ]);
  
  cache.lastFetched = new Date().toISOString();
  saveCache();
}

// 获取指定路径的评论数
function getCommentCount(path) {
  // 处理路径格式
  // 有时缓存中的路径可能带有域名，而传入的path可能只有相对路径
  // 尝试多种可能的路径格式
  let count = cache.comments[path] || 0;
  
  // 如果找不到，尝试其他可能的路径格式
  if (count === 0) {
    // 尝试移除开头的斜杠
    if (path.startsWith('/')) {
      count = cache.comments[path.substring(1)] || 0;
    }
    // 尝试添加开头的斜杠
    else {
      count = cache.comments[`/${path}`] || 0;
    }
  }
  
  return count;
}

// 获取指定路径的浏览量
function getPageViews(path) {
  // 处理路径格式，与getCommentCount类似
  let views = cache.pageviews[path] || 0;
  
  // 如果找不到，尝试其他可能的路径格式
  if (views === 0) {
    // 尝试移除开头的斜杠
    if (path.startsWith('/')) {
      views = cache.pageviews[path.substring(1)] || 0;
    }
    // 尝试添加开头的斜杠
    else {
      views = cache.pageviews[`/${path}`] || 0;
    }
    
    // 尝试完整URL格式
    if (views === 0) {
      const possibleKeys = Object.keys(cache.pageviews);
      const matchingKey = possibleKeys.find(key => key.includes(path));
      if (matchingKey) {
        views = cache.pageviews[matchingKey];
      }
    }
  }
  
  return views;
}

// 计算文章热度分数
function calculateHotScore(post) {
  const url = post.url;
  const date = new Date(post.frontmatter.date);
  const now = new Date();
  
  // 获取评论数和浏览量
  const commentCount = getCommentCount(url);
  const pageviews = getPageViews(url);
  
  // 计算时间差（天）
  const daysDiff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  
  // 计算新鲜度加权
  let freshnessBonus = 0;
  if (daysDiff <= 7) {
    freshnessBonus = config.weights.recency.week;
  } else if (daysDiff <= 30) {
    freshnessBonus = config.weights.recency.month;
  } else if (daysDiff <= 90) {
    freshnessBonus = config.weights.recency.quarter;
  }
  
  // 计算最终热度
  const hotScore = (commentCount * config.weights.comments) + 
                   (pageviews * config.weights.pageviews) + 
                   freshnessBonus;
  
  // 输出调试信息到控制台
  console.log(`计算热度: ${post.frontmatter.title}`);
  console.log(`  - 评论数: ${commentCount} (得分: ${commentCount * config.weights.comments})`);
  console.log(`  - 浏览量: ${pageviews} (得分: ${pageviews * config.weights.pageviews})`);
  console.log(`  - 新鲜度加分: ${freshnessBonus}`);
  console.log(`  - 总热度: ${hotScore}`);
  
  return {
    ...post,
    hotScore,
    commentCount,
    pageviews
  };
}

// 主函数
async function generateHotPosts() {
  console.log('开始生成热门文章数据...');

  try {
    // 1. 加载缓存
    loadCache();
    
    // 2. 更新Waline数据（强制刷新）
    await updateWalineCache(true);
    
    // 3. 读取所有文章数据
    const postsJsonPath = path.join(docsDir, 'public', 'posts.json');
    if (!fs.existsSync(postsJsonPath)) {
      throw new Error('posts.json文件不存在，请先运行generate-posts-data.js');
    }
    
    const posts = JSON.parse(fs.readFileSync(postsJsonPath, 'utf-8'));
    console.log(`已加载 ${posts.length} 篇文章`);
    
    // 4. 计算热度并排序
    const postsWithHotScore = posts.map(calculateHotScore);
    postsWithHotScore.sort((a, b) => b.hotScore - a.hotScore);
    
    // 5. 取前N篇
    const topHotPosts = postsWithHotScore.slice(0, config.topCount);
    
    // 6. 生成热门文章数据，只保留必要字段
    const hotPostsData = topHotPosts.map(post => ({
      url: post.url,
      title: post.frontmatter.title,
      description: post.frontmatter.description || post.excerpt || '',
      date: post.frontmatter.date,
      tags: post.frontmatter.tags || [],
      hotScore: post.hotScore,
      commentCount: post.commentCount,
      pageviews: post.pageviews
    }));
    
    // 7. 写入JSON文件
    fs.writeFileSync(outputPath, JSON.stringify(hotPostsData, null, 2));
    // 同时写入到docs/public目录
    fs.writeFileSync(docsOutputPath, JSON.stringify(hotPostsData, null, 2));
    
    console.log(`✓ 已成功生成热门文章数据: ${hotPostsData.length} 篇文章`);
    console.log(`✓ 输出文件1: ${outputPath}`);
    console.log(`✓ 输出文件2: ${docsOutputPath}`);
    
    // 8. 打印前5篇热门文章作为示例
    console.log('\n热门文章TOP 5:');
    hotPostsData.slice(0, 5).forEach((post, index) => {
      console.log(`${index + 1}. ${post.title} (热度: ${post.hotScore.toFixed(1)})`);
    });
    
    return hotPostsData;
  } catch (err) {
    console.error('✗ 生成热门文章数据失败', err);
    process.exit(1);
  }
}

// 执行
generateHotPosts(); 