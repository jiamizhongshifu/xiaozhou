/**
 * 模块引导文件
 * 负责加载和初始化所有模块，确保模块间正确协调
 * 
 * @version 1.0.0
 */

// 模块引导类
class ModuleBootstrap {
    constructor() {
        this.logPrefix = '[ModuleBootstrap]';
        this.moduleLoader = null;
        this.initialized = false;
        this.moduleInstances = {};
    }
    
    /**
     * 初始化引导程序
     */
    async init() {
        if (this.initialized) {
            console.log(`${this.logPrefix} 已经初始化，跳过重复初始化`);
            return;
        }
        
        console.log(`${this.logPrefix} 开始初始化模块引导程序`);
        
        try {
            // 获取模块加载器
            this.moduleLoader = window.getModuleLoader();
            
            // 加载必要模块
            await this.loadCoreModules();
            
            this.initialized = true;
            console.log(`${this.logPrefix} 模块引导程序初始化完成`);
        } catch (error) {
            console.error(`${this.logPrefix} 初始化引导程序时出错:`, error);
        }
    }
    
    /**
     * 加载核心模块
     */
    async loadCoreModules() {
        try {
            console.log(`${this.logPrefix} 开始加载核心模块`);
            
            // 加载上下文缓存模块
            this.moduleInstances.contextCache = await this.moduleLoader.load('ContextCache');
            
            // 加载对话分析器
            this.moduleInstances.conversationAnalyzer = await this.moduleLoader.load('ConversationAnalyzer');
            
            // 加载表单预填充管理器
            this.moduleInstances.formPrefillManager = await this.moduleLoader.load('FormPrefillManager');
            
            // 加载表单集成模块
            try {
                this.moduleInstances.formIntegration = await this.moduleLoader.load('FormIntegration');
                console.log(`${this.logPrefix} 表单集成模块加载完成`);
            } catch (formIntegrationError) {
                console.warn(`${this.logPrefix} 加载表单集成模块失败:`, formIntegrationError);
            }
            
            console.log(`${this.logPrefix} 核心模块加载完成`);
        } catch (error) {
            console.error(`${this.logPrefix} 加载核心模块时出错:`, error);
            throw error;
        }
    }
    
    /**
     * 获取模块实例
     * @param {string} name - 模块名称
     * @returns {Object} 模块实例
     */
    getModule(name) {
        return this.moduleInstances[name] || null;
    }
    
    /**
     * 添加模块到现有系统
     * @param {Object} target - 目标对象（通常是window或App对象）
     */
    integrateWithSystem(target = window) {
        if (!this.initialized) {
            console.warn(`${this.logPrefix} 模块引导程序未初始化，无法集成`);
            return;
        }
        
        try {
            // 将模块实例添加到目标对象
            Object.entries(this.moduleInstances).forEach(([name, instance]) => {
                if (instance) {
                    const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
                    target[capitalizedName] = instance;
                    console.log(`${this.logPrefix} 已将${capitalizedName}模块集成到全局对象`);
                }
            });
            
            // 特别确保关键模块的可用性
            if (this.moduleInstances.conversationAnalyzer && !target.ConversationAnalyzer) {
                target.ConversationAnalyzer = this.moduleInstances.conversationAnalyzer;
                console.log(`${this.logPrefix} 已特别确保ConversationAnalyzer模块可用`);
            }
            
            console.log(`${this.logPrefix} 模块已集成到系统中`);
        } catch (error) {
            console.error(`${this.logPrefix} 集成模块到系统时出错:`, error);
        }
    }
}

// 创建并导出单例实例
let moduleBootstrap = null;

/**
 * 获取模块引导实例
 * @returns {ModuleBootstrap} 模块引导实例
 */
function getModuleBootstrap() {
    if (!moduleBootstrap) {
        moduleBootstrap = new ModuleBootstrap();
    }
    return moduleBootstrap;
}

// 自动初始化
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('[ModuleBootstrap] DOMContentLoaded事件触发，开始初始化');
        
        const bootstrap = getModuleBootstrap();
        await bootstrap.init();
        bootstrap.integrateWithSystem();
        
        // 延迟触发初始化完成事件，确保所有模块有时间完成初始化
        setTimeout(() => {
            console.log('[ModuleBootstrap] 延迟触发模块引导完成事件');
            // 触发自定义事件，通知其他模块引导完成
            document.dispatchEvent(new CustomEvent('module-bootstrap-complete', {
                detail: { success: true }
            }));
        }, 100); // 100毫秒延迟
    } catch (error) {
        console.error('[ModuleBootstrap] 自动初始化时出错:', error);
        
        // 触发错误事件
        document.dispatchEvent(new CustomEvent('module-bootstrap-error', {
            detail: { error }
        }));
    }
});

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ModuleBootstrap, getModuleBootstrap };
} else {
    // 浏览器环境
    window.ModuleBootstrap = ModuleBootstrap;
    window.getModuleBootstrap = getModuleBootstrap;
} 