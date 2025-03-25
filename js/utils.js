/**
 * 小舟AI旅行规划师 - 工具类
 */

// 等待配置加载
function waitForConfig() {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 20;
        
        const checkConfig = () => {
            attempts++;
            if (window.AppConfig) {
                resolve();
                return;
            }
            if (attempts >= maxAttempts) {
                reject(new Error('配置加载超时'));
                return;
            }
            setTimeout(checkConfig, 100);
        };
        
        checkConfig();
    });
}

// 初始化工具类
async function initializeUtils() {
    try {
        await waitForConfig();
        
        // 缓存管理器
        class CacheManager {
          constructor() {
            this.cache = new Map();
            this.maxSize = window.AppConfig.CACHE_CONFIG.MAX_SIZE;
            this.duration = window.AppConfig.CACHE_CONFIG.DURATION;
          }

          // 获取缓存
          get(key) {
            const item = this.cache.get(key);
            if (!item) return null;

            // 检查是否过期
            if (Date.now() - item.timestamp > this.duration) {
              this.cache.delete(key);
              return null;
            }

            return item.data;
          }

          // 设置缓存
          set(key, data) {
            // 如果缓存已满，删除最早的条目
            if (this.cache.size >= this.maxSize) {
              const oldestKey = this.cache.keys().next().value;
              this.cache.delete(oldestKey);
            }

            this.cache.set(key, {
              data,
              timestamp: Date.now()
            });
          }

          // 清除缓存
          clear() {
            this.cache.clear();
          }
        }
        
        // 监控管理器
        class MetricsManager {
          constructor() {
            this.metrics = window.AppConfig.metrics;
          }

          // 记录请求开始
          recordRequestStart() {
            this.metrics.requestCount++;
          }

          // 记录请求成功
          recordSuccess(responseTime) {
            this.metrics.successCount++;
            this.metrics.totalResponseTime += responseTime;
            this.metrics.averageResponseTime = 
              this.metrics.totalResponseTime / this.metrics.successCount;
          }

          // 记录请求失败
          recordError() {
            this.metrics.errorCount++;
          }

          // 获取统计信息
          getStats() {
            return {
              ...this.metrics,
              successRate: this.metrics.requestCount > 0 
                ? (this.metrics.successCount / this.metrics.requestCount * 100).toFixed(2) + '%'
                : '0%'
            };
          }

          // 重置统计
          reset() {
            Object.keys(this.metrics).forEach(key => {
              this.metrics[key] = 0;
            });
          }
        }
        
        // 错误处理器
        class ErrorHandler {
          static handle(error) {
            console.error('API错误:', error);

            // 根据错误类型返回用户友好的消息
            switch(error.type) {
              case window.AppConfig.API_ERRORS.RATE_LIMIT:
                return '请求过于频繁，请稍后再试';
              case window.AppConfig.API_ERRORS.INVALID_KEY:
                return 'API密钥无效，请检查配置';
              case window.AppConfig.API_ERRORS.TIMEOUT:
                return '请求超时，请检查网络连接';
              case window.AppConfig.API_ERRORS.NETWORK:
                return '网络连接错误，请检查网络设置';
              default:
                return '发生未知错误，请稍后再试';
            }
          }

          // 创建错误对象
          static createError(type, message, details = {}) {
            return {
              type,
              message,
              details,
              timestamp: Date.now()
            };
          }
        }
        
        // 导出工具类
        window.AppUtils = {
            CacheManager,
            MetricsManager,
            ErrorHandler,
            isInitialized: true
        };
        
        console.log('工具类初始化完成');
    } catch (error) {
        console.error('工具类初始化失败:', error);
        // 导出基础工具类
        window.AppUtils = {
            isInitialized: false,
            error: error
        };
    }
}

// 立即初始化
initializeUtils(); 