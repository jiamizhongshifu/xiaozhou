/**
 * 小舟AI旅行规划师 - 主程序入口
 * 初始化应用程序和各个模块
 */

// 全局应用对象
const XiaozhouApp = (function() {
  // 私有变量
  let currentPage = '';
  
  // 依赖检查
  function checkDependencies() {
    if (!window.AppConfig) {
      console.error('配置模块未找到，请确保config.js已正确加载');
      return false;
    }
    
    if (!window.AppUtils) {
      console.error('工具类模块未找到，请确保utils.js已正确加载');
      return false;
    }
    
    if (!window.TravelAI && window.location.pathname.includes('planner.html')) {
      console.warn('API模块未找到，某些功能可能无法正常工作');
    }
    
    return true;
  }
  
  // 初始化当前页面
  function initCurrentPage() {
    // 获取当前页面
    const path = window.location.pathname;
    currentPage = path.substring(path.lastIndexOf('/') + 1);
    
    // 根据页面类型初始化特定功能
    if (currentPage === 'planner.html' || currentPage === '') {
      // 初始化聊天界面
      if (typeof window.initChatModule === 'function') {
        window.initChatModule();
      }
    } else if (currentPage === 'home.html' || currentPage === 'index.html') {
      // 首页特定初始化
      initHomePage();
    } else if (currentPage === 'inspiration.html') {
      // 灵感页面特定初始化
      initInspirationPage();
    }
    
    // 为活动导航项添加样式
    highlightCurrentNavItem();
  }
  
  // 高亮当前导航项
  function highlightCurrentNavItem() {
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href && (href.includes(currentPage) || (currentPage === '' && href.includes('index.html')))) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }
  
  // 初始化首页
  function initHomePage() {
    const hoverCards = document.querySelectorAll('.hover-card');
    hoverCards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-5px)';
        card.style.boxShadow = 'var(--shadow-md)';
      });
      
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = 'var(--shadow-sm)';
      });
    });
  }
  
  // 初始化灵感页面
  function initInspirationPage() {
    // 灵感页面特定的初始化代码
    console.log('初始化灵感页面');
  }
  
  // 切换到指定页面
  function changeFrame(url) {
    if (window.parent && window.parent !== window) {
      // 如果在iframe中，调用父窗口的changeFrame
      window.parent.changeFrame(url);
    } else {
      // 否则直接导航
      window.location.href = url;
    }
  }
  
  // 绑定全局事件
  function bindGlobalEvents() {
    // 为所有带有data-navigate属性的元素添加导航功能
    document.querySelectorAll('[data-navigate]').forEach(element => {
      element.addEventListener('click', function() {
        const url = this.getAttribute('data-navigate');
        if (url) {
          changeFrame(url);
        }
      });
    });
    
    // 移动端菜单切换
    const menuToggle = document.getElementById('mobile-menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const overlay = document.getElementById('overlay');
    
    if (menuToggle && mobileMenu) {
      menuToggle.addEventListener('click', function() {
        mobileMenu.classList.toggle('hidden');
        
        if (overlay) {
          overlay.classList.toggle('hidden');
        }
      });
      
      if (overlay) {
        overlay.addEventListener('click', function() {
          mobileMenu.classList.add('hidden');
          overlay.classList.add('hidden');
        });
      }
    }
  }
  
  // 监听窗口大小变化，处理响应式布局
  function handleResponsiveLayout() {
    window.addEventListener('resize', function() {
      const width = window.innerWidth;
      
      // 移动端时自动关闭侧边栏
      if (width < 768) {
        const sidebar = document.getElementById('sidebar');
        const chatContainer = document.getElementById('chat-container');
        
        if (sidebar && chatContainer) {
          sidebar.classList.add('hidden');
          chatContainer.classList.remove('md:ml-64');
        }
      }
    });
  }
  
  // 初始化应用程序
  function init() {
    // 检查依赖
    if (!checkDependencies()) {
      return;
    }
    
    // 初始化各个模块
    initCurrentPage();
    bindGlobalEvents();
    handleResponsiveLayout();
  }
  
  // 返回公共接口
  return {
    init: init,
    changeFrame: changeFrame
  };
})();

// 在文档加载完成后初始化应用
document.addEventListener('DOMContentLoaded', function() {
  XiaozhouApp.init();
}); 