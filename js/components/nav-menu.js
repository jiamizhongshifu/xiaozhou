/**
 * 全局导航菜单组件
 * 提供一个可复用的导航菜单，可以被添加到任何页面
 */

class GlobalNavMenu {
    constructor() {
        this.init();
    }

    /**
     * 初始化导航菜单
     */
    init() {
        // 检查导航菜单是否已存在
        if (document.querySelector('.nav-menu-container')) {
            return;
        }

        // 添加顶部导航栏
        this.addTopNavbar();
        
        // 创建导航菜单容器
        const navMenuContainer = document.createElement('div');
        navMenuContainer.className = 'nav-menu-container';
        
        // 添加导航菜单HTML
        navMenuContainer.innerHTML = `
            <div class="nav-menu-toggle">
                <i class="fas fa-bars"></i>
            </div>
            <div class="nav-dropdown">
                <ul class="nav-dropdown-list">
                    <li class="nav-dropdown-item">
                        <a href="planner.html" class="nav-dropdown-link">旅行规划</a>
                    </li>
                    <li class="nav-dropdown-item">
                        <a href="inspiration.html" class="nav-dropdown-link">旅行灵感</a>
                    </li>
                    <li class="nav-dropdown-item">
                        <a href="saved.html" class="nav-dropdown-link">我的行程</a>
                    </li>
                    <div class="nav-dropdown-divider"></div>
                    <li class="nav-dropdown-item">
                        <a href="about.html" class="nav-dropdown-link">关于我们</a>
                    </li>
                </ul>
            </div>
        `;

        // 将导航菜单添加到页面
        document.body.appendChild(navMenuContainer);

        // 添加事件监听
        this.addEventListeners();
    }
    
    /**
     * 添加顶部导航栏
     */
    addTopNavbar() {
        // 如果已存在顶部导航栏，则返回
        if (document.querySelector('.navbar')) {
            return;
        }
        
        // 创建顶部导航栏
        const navbar = document.createElement('nav');
        navbar.className = 'navbar';
        
        // 导航栏HTML结构
        navbar.innerHTML = `
            <div class="nav-container">
                <a href="index.html" class="logo">
                    <i class="fas fa-ship logo-icon"></i>
                    <span>旅行规划师小周</span>
                </a>
                <div class="nav-links">
                    <a href="index.html" class="nav-link">首页</a>
                    <a href="planner.html" class="nav-link">旅行规划</a>
                    <a href="inspiration.html" class="nav-link">旅行灵感</a>
                    <a href="saved.html" class="nav-link">我的行程</a>
                    <a href="about.html" class="nav-link">关于我们</a>
                </div>
                <button class="mobile-menu-toggle" id="mobile-menu-toggle">
                    <i class="fas fa-bars"></i>
                </button>
            </div>
        `;
        
        // 设置当前页面对应导航链接为激活状态
        this.setActiveNavLink(navbar);
        
        // 将导航栏添加到body的开头
        document.body.insertBefore(navbar, document.body.firstChild);
        
        // 添加基本样式，确保即使CSS未加载也能显示
        this.addNavbarStyles();
    }
    
    /**
     * 设置当前页面对应的导航链接为激活状态
     */
    setActiveNavLink(navbar) {
        // 获取当前页面路径
        const currentPath = window.location.pathname;
        const filename = currentPath.split('/').pop();
        
        // 找到所有导航链接
        const navLinks = navbar.querySelectorAll('.nav-link');
        
        // 移除所有active类
        navLinks.forEach(link => {
            link.classList.remove('active');
            
            // 如果链接href与当前页面匹配，添加active类
            if (link.getAttribute('href') === filename || 
               (filename === '' && link.getAttribute('href') === 'index.html')) {
                link.classList.add('active');
            }
        });
    }
    
    /**
     * 添加基本导航栏样式
     */
    addNavbarStyles() {
        // 检查是否已存在样式标签
        if (document.getElementById('nav-menu-inline-styles')) {
            return;
        }
        
        // 创建样式标签
        const style = document.createElement('style');
        style.id = 'nav-menu-inline-styles';
        
        // 添加基本样式
        style.innerHTML = `
            /* 基本导航栏样式 */
            .navbar {
                position: fixed;
                width: 100%;
                top: 0;
                left: 0;
                background-color: rgba(255, 255, 255, 0.9);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                z-index: 1000;
                padding: 16px 24px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
            }
            
            .nav-container {
                max-width: 1440px;
                margin: 0 auto;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .logo {
                font-size: 20px;
                font-weight: 600;
                color: #165DFF;
                display: flex;
                align-items: center;
                gap: 8px;
                text-decoration: none;
            }
            
            .logo-icon {
                color: #165DFF;
            }
            
            .nav-links {
                display: flex;
                gap: 32px;
            }
            
            .nav-link {
                color: #4E5969;
                text-decoration: none;
                font-weight: 500;
                transition: color 0.2s ease;
                font-size: 15px;
            }
            
            .nav-link:hover,
            .nav-link.active {
                color: #165DFF;
            }
            
            .mobile-menu-toggle {
                display: none;
                cursor: pointer;
                font-size: 24px;
                color: #4E5969;
                background: none;
                border: none;
            }
            
            /* 响应式样式 */
            @media (max-width: 768px) {
                .nav-links {
                    display: none;
                }
                
                .mobile-menu-toggle {
                    display: block;
                }
            }
            
            /* 调整页面内容，避免被导航栏遮挡 */
            body {
                padding-top: 70px;
            }
        `;
        
        // 添加到页面头部
        document.head.appendChild(style);
    }

    /**
     * 添加事件监听
     */
    addEventListeners() {
        const navMenuToggle = document.querySelector('.nav-menu-toggle');
        const navDropdown = document.querySelector('.nav-dropdown');
        
        // 点击菜单按钮显示/隐藏下拉菜单
        navMenuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            navDropdown.classList.toggle('show');
        });
        
        // 点击页面其他区域隐藏下拉菜单
        document.addEventListener('click', function(e) {
            if (!navDropdown.contains(e.target) && e.target !== navMenuToggle) {
                navDropdown.classList.remove('show');
            }
        });
        
        // 点击ESC键隐藏下拉菜单
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && navDropdown.classList.contains('show')) {
                navDropdown.classList.remove('show');
            }
        });
        
        // 移动端菜单切换
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        if (mobileMenuToggle) {
            const mobileMenu = document.getElementById('mobile-menu');
            const overlay = document.getElementById('overlay');
            
            // 如果移动端菜单不存在，则创建
            if (!mobileMenu) {
                this.createMobileMenu();
            }
        }
    }
    
    /**
     * 创建移动端菜单
     */
    createMobileMenu() {
        // 检查移动端菜单是否已存在
        if (document.getElementById('mobile-menu')) {
            return;
        }
        
        // 创建移动端菜单
        const mobileMenu = document.createElement('div');
        mobileMenu.id = 'mobile-menu';
        mobileMenu.className = 'mobile-menu';
        
        // 创建遮罩层
        const overlay = document.createElement('div');
        overlay.id = 'overlay';
        overlay.className = 'overlay';
        
        // 移动端菜单HTML结构
        mobileMenu.innerHTML = `
            <div class="mobile-menu-header">
                <a href="index.html" class="logo">
                    <i class="fas fa-ship logo-icon"></i>
                    <span>旅行规划师小周</span>
                </a>
                <button class="mobile-menu-close" id="mobile-menu-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="mobile-nav-links">
                <a href="index.html" class="mobile-nav-link">首页</a>
                <a href="planner.html" class="mobile-nav-link">旅行规划</a>
                <a href="inspiration.html" class="mobile-nav-link">旅行灵感</a>
                <a href="saved.html" class="mobile-nav-link">我的行程</a>
                <a href="about.html" class="mobile-nav-link">关于我们</a>
            </div>
        `;
        
        // 添加移动端菜单和遮罩层到页面
        document.body.appendChild(mobileMenu);
        document.body.appendChild(overlay);
        
        // 添加移动端菜单样式
        this.addMobileMenuStyles();
        
        // 添加移动端菜单事件监听
        this.addMobileMenuEventListeners();
    }
    
    /**
     * 添加移动端菜单样式
     */
    addMobileMenuStyles() {
        // 检查是否已存在样式标签
        if (document.getElementById('mobile-menu-inline-styles')) {
            return;
        }
        
        // 创建样式标签
        const style = document.createElement('style');
        style.id = 'mobile-menu-inline-styles';
        
        // 添加移动端菜单样式
        style.innerHTML = `
            /* 移动端菜单样式 */
            .mobile-menu {
                position: fixed;
                top: 0;
                right: -280px;
                width: 280px;
                height: 100vh;
                background-color: #fff;
                z-index: 1100;
                box-shadow: -5px 0 15px rgba(0, 0, 0, 0.1);
                transition: right 0.3s ease;
                padding: 24px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
            }
            
            .mobile-menu.active {
                right: 0;
            }
            
            .mobile-menu-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 32px;
            }
            
            .mobile-menu-close {
                font-size: 24px;
                color: #4E5969;
                background: none;
                border: none;
                cursor: pointer;
            }
            
            .mobile-nav-links {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }
            
            .mobile-nav-link {
                color: #1D2129;
                text-decoration: none;
                font-size: 18px;
                padding: 12px 0;
                border-bottom: 1px solid #E5E6EB;
                transition: color 0.2s ease;
            }
            
            .mobile-nav-link:hover {
                color: #165DFF;
            }
            
            .overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.4);
                z-index: 1050;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.3s ease, visibility 0.3s ease;
            }
            
            .overlay.active {
                opacity: 1;
                visibility: visible;
            }
        `;
        
        // 添加到页面头部
        document.head.appendChild(style);
    }
    
    /**
     * 添加移动端菜单事件监听
     */
    addMobileMenuEventListeners() {
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const mobileMenu = document.getElementById('mobile-menu');
        const mobileMenuClose = document.getElementById('mobile-menu-close');
        const overlay = document.getElementById('overlay');
        
        if (mobileMenuToggle && mobileMenu && mobileMenuClose && overlay) {
            mobileMenuToggle.addEventListener('click', () => {
                mobileMenu.classList.add('active');
                overlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
            
            mobileMenuClose.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            });
            
            overlay.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            });
        }
    }
}

// 在文档加载完成后初始化导航菜单
document.addEventListener('DOMContentLoaded', function() {
    new GlobalNavMenu();
}); 