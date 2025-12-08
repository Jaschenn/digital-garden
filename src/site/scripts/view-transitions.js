// 页面过渡优化 - 消除闪烁，实现 SPA 式导航
(function() {
  'use strict';
  
  let isNavigating = false;
  
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
    
    // 优化内部链接跳转 - 实现 SPA 式导航
    optimizeInternalLinks();
  }
  
  function optimizeInternalLinks() {
    document.addEventListener('click', async function(event) {
      // 检查是否是内部链接
      const anchor = event.target.closest('a.internal-link, a.filename');
      if (!anchor || !anchor.href) return;
      
      // 只处理内部链接
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      
      // 如果是锚点链接（同一页面），不处理
      if (url.pathname === window.location.pathname && url.hash) {
        return;
      }
      
      // 防止重复点击
      if (isNavigating) {
        event.preventDefault();
        return;
      }
      
      event.preventDefault();
      isNavigating = true;
      
      // 添加过渡效果
      const content = document.querySelector('.content');
      if (content) {
        content.style.opacity = '0.6';
        content.style.transition = 'opacity 0.15s ease-out';
      }
      
      try {
        // 获取新页面内容
        const response = await fetch(url.href);
        if (!response.ok) throw new Error('Failed to fetch');
        
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // 提取新页面的内容区域和侧边栏
        const newContent = doc.querySelector('.content');
        const newSidebar = doc.querySelector('.sidebar');
        if (!newContent) {
          // 如果新页面没有内容区域，使用传统跳转
          window.location.href = url.href;
          return;
        }
        
        // 更新 URL（不刷新页面）
        window.history.pushState({}, '', url.href);
        
        // 更新页面标题
        const newTitle = doc.querySelector('title');
        if (newTitle) {
          document.title = newTitle.textContent;
        }
        
        // 更新内容区域
        const currentContent = document.querySelector('.content');
        if (currentContent && newContent) {
          // 淡入新内容
          currentContent.innerHTML = newContent.innerHTML;
          currentContent.style.opacity = '0';
          requestAnimationFrame(() => {
            currentContent.style.transition = 'opacity 0.2s ease-in';
            currentContent.style.opacity = '1';
          });
        }
        
        // 更新侧边栏（如果有）
        if (newSidebar) {
          const currentSidebar = document.querySelector('.sidebar');
          if (currentSidebar) {
            // 清理旧的 graph 实例
            if (window.graph && typeof window.graph._destructor === 'function') {
              try {
                window.graph._destructor();
              } catch (e) {
                console.warn('Graph cleanup error:', e);
              }
              window.graph = null;
            }
            
            // 更新侧边栏内容
            currentSidebar.innerHTML = newSidebar.innerHTML;
            
            // 重新初始化侧边栏中的 Alpine.js 组件
            if (window.Alpine) {
              // 等待 DOM 更新后再初始化
              requestAnimationFrame(() => {
                if (window.Alpine) {
                  try {
                    // 重新初始化整个侧边栏树
                    window.Alpine.initTree(currentSidebar);
                  } catch (e) {
                    console.warn('Alpine init error:', e);
                  }
                }
              });
            }
          }
        }
        
        // 滚动到顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // 更新活动状态（如果有）
        updateActiveState(url.pathname);
        
        // 重新初始化页面脚本（如果需要）
        reinitializeScripts();
        
      } catch (error) {
        console.warn('SPA navigation failed, using traditional navigation:', error);
        // 如果失败，使用传统跳转
        window.location.href = url.href;
      } finally {
        isNavigating = false;
      }
    });
    
    // 处理浏览器前进/后退
    window.addEventListener('popstate', async function() {
      if (isNavigating) return;
      isNavigating = true;
      
      const content = document.querySelector('.content');
      if (content) {
        content.style.opacity = '0.6';
      }
      
      try {
        const response = await fetch(window.location.href);
        if (!response.ok) throw new Error('Failed to fetch');
        
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        const newContent = doc.querySelector('.content');
        const newSidebar = doc.querySelector('.sidebar');
        
        if (newContent) {
          const currentContent = document.querySelector('.content');
          if (currentContent) {
            currentContent.innerHTML = newContent.innerHTML;
            currentContent.style.opacity = '0';
            requestAnimationFrame(() => {
              currentContent.style.transition = 'opacity 0.2s ease-in';
              currentContent.style.opacity = '1';
            });
          }
        }
        
        // 更新侧边栏（如果有）
        if (newSidebar) {
          const currentSidebar = document.querySelector('.sidebar');
          if (currentSidebar) {
            // 清理旧的 graph 实例
            if (window.graph && typeof window.graph._destructor === 'function') {
              try {
                window.graph._destructor();
              } catch (e) {
                console.warn('Graph cleanup error:', e);
              }
              window.graph = null;
            }
            
            currentSidebar.innerHTML = newSidebar.innerHTML;
            
            // 重新初始化侧边栏中的 Alpine.js 组件
            if (window.Alpine) {
              requestAnimationFrame(() => {
                if (window.Alpine) {
                  try {
                    window.Alpine.initTree(currentSidebar);
                  } catch (e) {
                    console.warn('Alpine init error:', e);
                  }
                }
              });
            }
          }
        }
        
        const newTitle = doc.querySelector('title');
        if (newTitle) {
          document.title = newTitle.textContent;
        }
        
        updateActiveState(window.location.pathname);
        reinitializeScripts();
      } catch (error) {
        window.location.reload();
      } finally {
        isNavigating = false;
      }
    });
  }
  
  function updateActiveState(pathname) {
    // 更新文件树中的活动状态
    try {
      document.querySelectorAll('.notelink').forEach(link => {
        if (!link) return;
        
        try {
          link.classList.remove('active-note');
          const linkAnchor = link.querySelector('a');
          if (linkAnchor && linkAnchor.href) {
            const linkUrl = new URL(linkAnchor.href, window.location.href);
            if (linkUrl.pathname === pathname) {
              link.classList.add('active-note');
            }
          }
        } catch (e) {
          console.warn('Error updating link state:', e);
        }
      });
    } catch (e) {
      console.warn('Error in updateActiveState:', e);
    }
  }
  
  function reinitializeScripts() {
    // 重新初始化可能需要重新运行的脚本
    // 例如：代码高亮、数学公式等
    if (window.Prism) {
      try {
        window.Prism.highlightAll();
      } catch (e) {
        console.warn('Prism highlight error:', e);
      }
    }
    
    // 重新初始化 lucide 图标
    if (window.lucide) {
      try {
        window.lucide.createIcons();
      } catch (e) {
        console.warn('Lucide icons error:', e);
      }
    }
    
    // 清理旧的 graph 实例
    if (window.graph && typeof window.graph._destructor === 'function') {
      try {
        window.graph._destructor();
        window.graph = null;
      } catch (e) {
        console.warn('Graph cleanup error:', e);
      }
    }
    
    // 触发自定义事件，让其他脚本知道内容已更新
    // 延迟触发，确保 DOM 已更新
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('contentUpdated'));
    }, 100);
  }
  
  // 页面可见性变化时优化
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
      const content = document.querySelector('.content');
      if (content) {
        content.style.opacity = '1';
      }
    }
  });
})();
