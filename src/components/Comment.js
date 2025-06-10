import { useEffect, useRef } from 'react';
import { init } from '@waline/client';

// 自定义样式
import './Comment.css';

const Comment = ({ path }) => {
  const walineRef = useRef(null);
  const walineInstanceRef = useRef(null);

  useEffect(() => {
    // 检测当前主题模式
    const isDarkMode = () => {
      return document.documentElement.getAttribute('data-theme') === 'dark' || 
             document.body.classList.contains('dark-theme');
    };

    // 如果已存在实例，先销毁
    if (walineInstanceRef.current) {
      walineInstanceRef.current.destroy();
    }

    // 初始化评论
    if (walineRef.current) {
      walineInstanceRef.current = init({
        el: walineRef.current,
        serverURL: 'https://lycanclaw-comment.netlify.app/.netlify/functions/comment',
        path: path || window.location.pathname,
        dark: isDarkMode(),
        meta: ['nick', 'mail', 'link'],
        requiredMeta: ['nick', 'mail'],
        pageSize: 10,
        locale: {
          placeholder: '欢迎留下您的评论~',
        },
        emoji: [
          'https://unpkg.com/@waline/emojis@1.1.0/weibo',
        ],
        login: 'enable'
      });
    }

    // 监听主题变化
    const observer = new MutationObserver(() => {
      if (walineInstanceRef.current) {
        walineInstanceRef.current.update({ dark: isDarkMode() });
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class']
    });
    
    if (document.body) {
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['class']
      });
    }

    // 清理函数
    return () => {
      if (walineInstanceRef.current) {
        walineInstanceRef.current.destroy();
      }
      observer.disconnect();
    };
  }, [path]);

  return (
    <div className="comment-section">
      <h2 className="comment-title">评论</h2>
      <div ref={walineRef} className="waline-container"></div>
    </div>
  );
};

export default Comment; 