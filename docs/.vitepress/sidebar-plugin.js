import fs from 'fs'
import path from 'path'
import matter from 'front-matter'

/**
 * 为VitePress生成侧边栏配置
 * @param {Object} options - 配置选项
 * @param {string} options.docsRoot - 文档根目录路径
 * @param {string[]} options.scanDirs - 要扫描的目录数组
 * @param {boolean} options.useTitleFromFrontmatter - 是否使用frontmatter中的标题
 * @param {boolean} options.sortByName - 是否按名称排序
 * @returns {Object} - 侧边栏配置对象
 */
export function generateSidebar(options = {}) {
  const {
    docsRoot = 'docs',
    scanDirs = ['knowledge'],
    useTitleFromFrontmatter = true,
    sortByName = true,
  } = options;
  
  const sidebar = {};
  
  // 为每个扫描目录生成侧边栏
  for (const dirName of scanDirs) {
    const dirPath = path.join(process.cwd(), docsRoot, dirName);
    
    if (fs.existsSync(dirPath)) {
      sidebar[`/${dirName}/`] = processSidebarStructure(dirPath, `/${dirName}/`, useTitleFromFrontmatter, sortByName);
    }
  }
  
  return sidebar;
}

/**
 * 处理目录结构并生成侧边栏项
 * @param {string} dirPath - 目录路径
 * @param {string} urlPrefix - URL前缀
 * @param {boolean} useTitleFromFrontmatter - 是否使用frontmatter中的标题
 * @param {boolean} sortByName - 是否按名称排序
 * @returns {Array} - 侧边栏项数组
 */
function processSidebarStructure(dirPath, urlPrefix, useTitleFromFrontmatter, sortByName) {
  const items = [];
  const files = fs.readdirSync(dirPath);
  
  // 过滤和排序文件
  let mdFiles = files
    .filter(file => file.endsWith('.md') && file !== 'index.md')
    .map(file => ({ 
      name: file, 
      path: path.join(dirPath, file)
    }));
  
  // 处理index.md（如果存在）
  const indexFile = files.find(file => file === 'index.md');
  if (indexFile) {
    const indexPath = path.join(dirPath, indexFile);
    const title = extractTitle(indexPath, useTitleFromFrontmatter, '概览');
    items.push({
      text: title,
      link: `${urlPrefix}`
    });
  }
  
  // 按名称排序
  if (sortByName) {
    mdFiles.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
  }
  
  // 处理Markdown文件
  for (const file of mdFiles) {
    const fileName = file.name.replace('.md', '');
    const title = extractTitle(file.path, useTitleFromFrontmatter, fileName);
    
    items.push({
      text: title,
      link: `${urlPrefix}${fileName}`
    });
  }
  
  // 处理子目录
  const subDirs = files.filter(file => {
    const fullPath = path.join(dirPath, file);
    return fs.statSync(fullPath).isDirectory() && !file.startsWith('.');
  });
  
  // 按名称排序子目录
  if (sortByName) {
    subDirs.sort((a, b) => a.localeCompare(b, 'zh-CN'));
  }
  
  // 处理每个子目录
  for (const subDir of subDirs) {
    const subDirPath = path.join(dirPath, subDir);
    const subItems = processSidebarStructure(
      subDirPath, 
      `${urlPrefix}${subDir}/`, 
      useTitleFromFrontmatter,
      sortByName
    );
    
    // 获取子目录名称或索引文件中的标题
    let subDirTitle = getFormattedTitle(subDir);
    const subDirIndexPath = path.join(subDirPath, 'index.md');
    
    if (fs.existsSync(subDirIndexPath) && useTitleFromFrontmatter) {
      subDirTitle = extractTitle(subDirIndexPath, useTitleFromFrontmatter, subDirTitle);
    }
    
    // 添加子目录到侧边栏
    items.push({
      text: subDirTitle,
      collapsed: false,
      items: subItems
    });
  }
  
  return items;
}

/**
 * 格式化标题（如将programming转换为Programming）
 * @param {string} title - 原始标题
 * @returns {string} - 格式化后的标题
 */
function getFormattedTitle(title) {
  // 将连字符或下划线转换为空格
  let formatted = title.replace(/[-_]/g, ' ');
  
  // 首字母大写
  formatted = formatted
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return formatted;
}

/**
 * 从文件中提取标题
 * @param {string} filePath - 文件路径
 * @param {boolean} useFrontmatter - 是否使用frontmatter
 * @param {string} defaultTitle - 默认标题
 * @returns {string} - 提取的标题
 */
function extractTitle(filePath, useFrontmatter, defaultTitle) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    if (useFrontmatter) {
      // 尝试从frontmatter中获取标题
      const { attributes } = matter(content);
      if (attributes && attributes.title) {
        return attributes.title;
      }
    }
    
    // 尝试从第一个标题获取
    const titleMatch = content.match(/^#\s+(.*)/m);
    if (titleMatch && titleMatch[1]) {
      return titleMatch[1];
    }
  } catch (error) {
    console.error(`Error extracting title from ${filePath}:`, error);
  }
  
  return defaultTitle;
} 