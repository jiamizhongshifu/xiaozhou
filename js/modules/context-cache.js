/**
 * 上下文缓存模块
 * 用于管理上下文数据的缓存，支持多种存储方式
 * 
 * @version 1.0.0
 */

class ContextCache {
    constructor(options = {}) {
        this.logPrefix = '[ContextCache]';
        this.options = Object.assign({
            // 默认配置
            storage: 'localStorage', // 存储方式: localStorage, sessionStorage, memory
            keyPrefix: 'xiaozhou_cache_', // 缓存键前缀
            defaultTTL: 30 * 60, // 默认过期时间，单位：秒 (30分钟)
            version: '1.0.0' // 缓存版本，版本变更时自动清除旧缓存
        }, options);
        
        // 内存存储
        this.memoryStorage = new Map();
        
        // 初始化
        this.init();
    }
    
    /**
     * 初始化上下文缓存
     */
    init() {
        console.log(`${this.logPrefix} 初始化上下文缓存，存储方式: ${this.options.storage}`);
        
        // 检查版本并清理旧版本缓存
        this.checkVersion();
    }
    
    /**
     * 检查缓存版本
     */
    checkVersion() {
        // 仅对非内存存储进行版本检查
        if (this.options.storage === 'memory') {
            return;
        }
        
        const versionKey = this.options.keyPrefix + 'version';
        const storage = this.getStorageObject();
        
        try {
            const storedVersion = storage.getItem(versionKey);
            
            if (storedVersion !== this.options.version) {
                console.log(`${this.logPrefix} 缓存版本变更: ${storedVersion || '无'} -> ${this.options.version}，清理旧缓存`);
                
                // 清理带有前缀的旧缓存
                this.clearAll();
                
                // 保存新版本
                storage.setItem(versionKey, this.options.version);
            }
        } catch (error) {
            console.warn(`${this.logPrefix} 检查缓存版本时出错:`, error);
        }
    }
    
    /**
     * 获取存储对象
     * @returns {Object} 存储对象
     */
    getStorageObject() {
        switch (this.options.storage) {
            case 'localStorage':
                return window.localStorage;
            case 'sessionStorage':
                return window.sessionStorage;
            case 'memory':
            default:
                return {
                    getItem: (key) => this.memoryStorage.get(key),
                    setItem: (key, value) => this.memoryStorage.set(key, value),
                    removeItem: (key) => this.memoryStorage.delete(key),
                    clear: () => this.memoryStorage.clear(),
                    length: this.memoryStorage.size,
                    key: (index) => {
                        const keys = Array.from(this.memoryStorage.keys());
                        return keys[index];
                    }
                };
        }
    }
    
    /**
     * 生成完整的缓存键
     * @param {string} key 缓存键
     * @returns {string} 完整的缓存键
     */
    getFullKey(key) {
        return this.options.keyPrefix + key;
    }
    
    /**
     * 设置缓存
     * @param {string} key 缓存键
     * @param {*} value 缓存值
     * @param {number} ttl 过期时间，单位：秒
     * @returns {Promise<boolean>} 是否成功
     */
    async set(key, value, ttl = this.options.defaultTTL) {
        try {
            const storage = this.getStorageObject();
            const fullKey = this.getFullKey(key);
            
            // 包装数据，添加过期时间
            const data = {
                value,
                expires: ttl ? Date.now() + (ttl * 1000) : null
            };
            
            // 序列化并存储
            storage.setItem(fullKey, JSON.stringify(data));
            
            console.log(`${this.logPrefix} 缓存设置成功: ${key}, TTL: ${ttl}秒`);
            return true;
        } catch (error) {
            console.error(`${this.logPrefix} 设置缓存时出错:`, error);
            return false;
        }
    }
    
    /**
     * 获取缓存
     * @param {string} key 缓存键
     * @returns {Promise<*>} 缓存值
     */
    async get(key) {
        try {
            const storage = this.getStorageObject();
            const fullKey = this.getFullKey(key);
            
            const rawData = storage.getItem(fullKey);
            if (!rawData) {
                return null;
            }
            
            // 解析数据
            const data = JSON.parse(rawData);
            
            // 检查是否过期
            if (data.expires && Date.now() > data.expires) {
                // 已过期，删除缓存
                storage.removeItem(fullKey);
                console.log(`${this.logPrefix} 缓存已过期: ${key}`);
                return null;
            }
            
            console.log(`${this.logPrefix} 缓存命中: ${key}`);
            return data.value;
        } catch (error) {
            console.error(`${this.logPrefix} 获取缓存时出错:`, error);
            return null;
        }
    }
    
    /**
     * 删除缓存
     * @param {string} key 缓存键
     * @returns {Promise<boolean>} 是否成功
     */
    async remove(key) {
        try {
            const storage = this.getStorageObject();
            const fullKey = this.getFullKey(key);
            
            storage.removeItem(fullKey);
            
            console.log(`${this.logPrefix} 缓存已删除: ${key}`);
            return true;
        } catch (error) {
            console.error(`${this.logPrefix} 删除缓存时出错:`, error);
            return false;
        }
    }
    
    /**
     * 清除所有缓存
     * @returns {Promise<boolean>} 是否成功
     */
    async clearAll() {
        try {
            const storage = this.getStorageObject();
            
            if (this.options.storage === 'memory') {
                // 内存存储直接清空
                this.memoryStorage.clear();
            } else {
                // 浏览器存储只清除带有前缀的项
                const keysToRemove = [];
                
                for (let i = 0; i < storage.length; i++) {
                    const key = storage.key(i);
                    if (key && key.startsWith(this.options.keyPrefix)) {
                        keysToRemove.push(key);
                    }
                }
                
                // 删除匹配的键
                keysToRemove.forEach(key => {
                    storage.removeItem(key);
                });
            }
            
            console.log(`${this.logPrefix} 所有缓存已清除`);
            return true;
        } catch (error) {
            console.error(`${this.logPrefix} 清除所有缓存时出错:`, error);
            return false;
        }
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContextCache;
} else {
    // 浏览器环境
    window.ContextCache = ContextCache;
} 