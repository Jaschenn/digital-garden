// 页面过渡优化 - 消除闪烁
(function() {
  'use strict';
  
  // 优化页面加载，避免闪烁
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  function init() {
    // 平滑显示页面内容
    if (!document.body.hasAttribute('data-loaded')) {
      document.body.style.opacity = '0';
      requestAnimationFrame(() => {
        document.body.style.transition = 'opacity 0.15s ease-in-out';
        document.body.style.opacity = '1';
        document.body.setAttribute('data-loaded', 'true');
      });
    }
    
    // 优化内部链接跳转
    optimizeInternalLinks();
  }
  
  function optimizeInternalLinks() {
    document.addEventListener('click', function(event) {
      const anchor = event.target.closest('a.internal-link');
      if (!anchor || !anchor.href) return;
      
      // 只处理内部链接
      const url = new URL(anchor.href, window.location.href);
      if (url.origin === window.location.origin) {
        // 添加过渡效果
        const content = document.querySelector('.content');
        if (content) {
          content.style.opacity = '0.7';
          content.style.transition = 'opacity 0.1s ease-out';
        }
      }
    });
  }
  
  // 页面可见性变化时优化
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
      // 页面重新可见时，确保内容正常显示
      const content = document.querySelector('.content');
      if (content) {
        content.style.opacity = '1';
      }
    }
  });
})();
