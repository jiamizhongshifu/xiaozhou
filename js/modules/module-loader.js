/**
 * 模块加载器
 * 负责协调各模块的加载和初始化，提供版本控制和兼容性检查
 * 
 * @version 1.0.0
 */

class ModuleLoader {
    constructor() {
        this.modules = new Map();
        this.dependencies = new Map();
        this.moduleStatus = new Map();
        this.logPrefix = '[ModuleLoader]';
        
        // 模块版本信息
        this.versions = {
            'ConversationAnalyzer': '1.0.0',
            'FormPrefillManager': '1.0.0',
            'ContextCache': '1.0.0'
        };
    }
    
    /**
     * 注册模块
     * @param {string} name - 模块名称
     * @param {Object} module - 模块对象或构造函数
     * @param {Array} dependencies - 依赖模块列表
     * @returns {boolean} 是否注册成功
     */
    register(name, module, dependencies = []) {
        if (!name || !module) {
            console.error(`${this.logPrefix} 模块注册失败：名称或模块对象为空`);
            return false;
        }
        
        try {
            this.modules.set(name, module);
            this.dependencies.set(name, dependencies);
            this.moduleStatus.set(name, 'registered');
            
            console.log(`${this.logPrefix} 注册模块: ${name}`);
            return true;
        } catch (error) {
            console.error(`${this.logPrefix} 注册模块 ${name} 时出错:`, error);
            return false;
        }
    }
    
    /**
     * 加载模块
     * @param {string} name - 模块名称
     * @returns {Promise} 模块加载Promise
     */
    async load(name) {
        if (!this.modules.has(name)) {
            console.error(`${this.logPrefix} 模块未注册: ${name}`);
            return null;
        }
        
        // 如果模块已经加载，直接返回
        if (this.moduleStatus.get(name) === 'loaded') {
            return this.modules.get(name);
        }
        
        try {
            // 更新状态
            this.moduleStatus.set(name, 'loading');
            
            // 加载依赖
            const dependencies = this.dependencies.get(name) || [];
            for (const dep of dependencies) {
                if (this.moduleStatus.get(dep) !== 'loaded') {
                    await this.load(dep);
                }
            }
            
            // 获取模块
            const module = this.modules.get(name);
            
            // 如果是构造函数，创建实例
            const instance = typeof module === 'function' ? new module() : module;
            
            // 更新模块和状态
            this.modules.set(name, instance);
            this.moduleStatus.set(name, 'loaded');
            
            console.log(`${this.logPrefix} 加载模块: ${name}`);
            return instance;
        } catch (error) {
            this.moduleStatus.set(name, 'error');
            console.error(`${this.logPrefix} 加载模块 ${name} 时出错:`, error);
            return null;
        }
    }
    
    /**
     * 获取模块实例
     * @param {string} name - 模块名称
     * @returns {Object} 模块实例
     */
    get(name) {
        if (!this.modules.has(name)) {
            console.warn(`${this.logPrefix} 模块未注册: ${name}`);
            return null;
        }
        
        const status = this.moduleStatus.get(name);
        if (status !== 'loaded') {
            console.warn(`${this.logPrefix} 模块 ${name} 未加载，当前状态: ${status}`);
            return null;
        }
        
        return this.modules.get(name);
    }
    
    /**
     * 检查模块版本兼容性
     * @param {string} name - 模块名称
     * @param {string} requiredVersion - 所需版本
     * @returns {boolean} 是否兼容
     */
    checkVersion(name, requiredVersion) {
        if (!this.versions[name]) {
            return false;
        }
        
        // 简单版本比较，实际应用中可能需要更复杂的语义版本比较
        const currentVersion = this.versions[name].split('.');
        const required = requiredVersion.split('.');
        
        // 主版本必须相同
        if (currentVersion[0] !== required[0]) {
            return false;
        }
        
        // 次版本必须大于等于所需版本
        if (parseInt(currentVersion[1]) < parseInt(required[1])) {
            return false;
        }
        
        return true;
    }
    
    /**
     * 获取模块状态
     * @returns {Object} 模块状态映射
     */
    getStatus() {
        const status = {};
        this.moduleStatus.forEach((value, key) => {
            status[key] = value;
        });
        return status;
    }
    
    /**
     * 重置模块状态
     * @param {string} name - 模块名称，不提供则重置所有模块
     */
    reset(name = null) {
        if (name) {
            if (this.modules.has(name)) {
                this.moduleStatus.set(name, 'registered');
                console.log(`${this.logPrefix} 重置模块: ${name}`);
            }
        } else {
            // 重置所有模块
            this.moduleStatus.forEach((_, key) => {
                this.moduleStatus.set(key, 'registered');
            });
            console.log(`${this.logPrefix} 重置所有模块`);
        }
    }
}

// 单例模式，确保只有一个ModuleLoader实例
let moduleLoader = null;

/**
 * 获取模块加载器实例
 * @returns {ModuleLoader} 模块加载器实例
 */
function getModuleLoader() {
    if (!moduleLoader) {
        moduleLoader = new ModuleLoader();
        console.log('[ModuleLoader] 创建模块加载器实例');
        
        // 注册核心模块
        if (typeof window !== 'undefined') {
            if (window.ConversationAnalyzer) {
                moduleLoader.register('ConversationAnalyzer', window.ConversationAnalyzer);
            }
            if (window.FormPrefillManager) {
                moduleLoader.register('FormPrefillManager', window.FormPrefillManager, ['ConversationAnalyzer']);
            }
            if (window.ContextCache) {
                moduleLoader.register('ContextCache', window.ContextCache);
            }
            if (window.FormIntegration) {
                moduleLoader.register('FormIntegration', window.FormIntegration, ['FormPrefillManager', 'ConversationAnalyzer']);
                console.log('[ModuleLoader] 注册模块: FormIntegration');
            }
        }
    }
    return moduleLoader;
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ModuleLoader, getModuleLoader };
} else {
    // 浏览器环境
    window.ModuleLoader = ModuleLoader;
    window.getModuleLoader = getModuleLoader;
} 