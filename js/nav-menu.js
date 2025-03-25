/**
 * 全局导航菜单的交互功能
 */
document.addEventListener('DOMContentLoaded', function() {
    // 获取菜单按钮和下拉菜单元素
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
}); 