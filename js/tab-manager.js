/**
 * Tab管理器
 * 负责处理Tab间的数据同步和状态管理
 */
class TabManager {
    constructor() {
        this.tabs = new Map();
        this.activeTab = null;
        this.preferences = new window.AppUtils.PreferencesManager();
        this.eventHandlers = new Map();
        
        // 初始化
        this.init();
    }
    
    /**
     * 初始化Tab管理器
     * @private
     */
    init() {
        // 恢复上次激活的Tab
        const lastActiveTab = this.preferences.get('activeTab');
        if (lastActiveTab) {
            this.activateTab(lastActiveTab);
        }
        
        // 绑定Tab切换事件
        document.querySelectorAll('[data-tab]').forEach(tab => {
            const tabId = tab.dataset.tab;
            this.tabs.set(tabId, {
                element: tab,
                content: document.querySelector(`[data-tab-content="${tabId}"]`),
                data: null,
                needsUpdate: false
            });
            
            tab.addEventListener('click', () => this.activateTab(tabId));
        });
    }
    
    /**
     * 激活指定Tab
     * @param {string} tabId - Tab ID
     */
    activateTab(tabId) {
        const tab = this.tabs.get(tabId);
        if (!tab) return;
        
        // 更新UI
        this.tabs.forEach((value, key) => {
            if (key === tabId) {
                value.element.classList.add('active');
                value.content.classList.remove('hidden');
            } else {
                value.element.classList.remove('active');
                value.content.classList.add('hidden');
            }
        });
        
        // 保存状态
        this.activeTab = tabId;
        this.preferences.set('activeTab', tabId);
        
        // 如果需要更新，触发数据更新
        if (tab.needsUpdate) {
            this.updateTabData(tabId);
        }
        
        // 触发Tab切换事件
        this.emit('tabChanged', { tabId, tab });
    }
    
    /**
     * 更新Tab数据
     * @param {string} tabId - Tab ID
     * @param {Object} [data] - 新数据
     */
    updateTabData(tabId, data = null) {
        const tab = this.tabs.get(tabId);
        if (!tab) return;
        
        if (data) {
            tab.data = data;
            tab.needsUpdate = false;
        }
        
        // 触发数据更新事件
        this.emit('dataUpdated', { tabId, data: tab.data });
    }
    
    /**
     * 标记Tab需要更新
     * @param {string} tabId - Tab ID
     */
    markForUpdate(tabId) {
        const tab = this.tabs.get(tabId);
        if (tab) {
            tab.needsUpdate = true;
            
            // 如果是当前激活的Tab，立即更新
            if (this.activeTab === tabId) {
                this.updateTabData(tabId);
            }
        }
    }
    
    /**
     * 获取Tab数据
     * @param {string} tabId - Tab ID
     * @returns {Object|null} Tab数据
     */
    getTabData(tabId) {
        return this.tabs.get(tabId)?.data || null;
    }
    
    /**
     * 注册事件处理器
     * @param {string} event - 事件名称
     * @param {Function} handler - 处理函数
     */
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, new Set());
        }
        this.eventHandlers.get(event).add(handler);
    }
    
    /**
     * 移除事件处理器
     * @param {string} event - 事件名称
     * @param {Function} handler - 处理函数
     */
    off(event, handler) {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            handlers.delete(handler);
        }
    }
    
    /**
     * 触发事件
     * @param {string} event - 事件名称
     * @param {Object} data - 事件数据
     * @private
     */
    emit(event, data) {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            handlers.forEach(handler => handler(data));
        }
    }
}

// 导出Tab管理器
window.TabManager = TabManager; 