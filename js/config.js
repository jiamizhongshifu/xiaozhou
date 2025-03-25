/**
 * 小舟AI旅行规划师 - 配置文件
 * 集中管理所有应用配置
 */

// 立即将配置导出到全局作用域
window.AppConfig = {
  // API 配置
  API_CONFIG: {
    apiKey: 'sk-5cc05eb59de1476792e079d19130c274', // 实际使用时应替换为真实的API密钥
    baseUrl: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat',
    temperature: 0.7,
    maxTokens: 1000
  },

  // API 错误类型定义
  API_ERRORS: {
    RATE_LIMIT: 'rate_limit_exceeded',
    INVALID_KEY: 'invalid_api_key',
    TIMEOUT: 'request_timeout',
    NETWORK: 'network_error',
    SERVER: 'server_error',
    VALIDATION: 'validation_error'
  },

  // 缓存配置
  CACHE_CONFIG: {
    DURATION: 5 * 60 * 1000, // 5分钟缓存
    MAX_SIZE: 100 // 最大缓存条目数
  },

  // 请求配置
  REQUEST_CONFIG: {
    MAX_RETRIES: 3,
    TIMEOUT_MS: 15000, // 15秒超时
    RETRY_DELAY: 1000  // 初始重试延迟1秒
  },

  // 监控指标
  metrics: {
    requestCount: 0,
    successCount: 0,
    errorCount: 0,
    totalResponseTime: 0,
    averageResponseTime: 0
  }
};

// 自检配置是否成功加载
(function() {
  if (!window.AppConfig) {
    console.error('配置模块初始化失败');
    throw new Error('配置模块初始化失败');
  }
  console.log('配置模块加载成功', window.AppConfig);
})(); 