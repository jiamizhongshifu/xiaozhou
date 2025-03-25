/**
 * 小舟AI旅行规划师 - API测试模块
 * 用于测试与DeepSeek API的连接和响应
 */

// 导入API配置（如果在浏览器中直接使用，请确保已加载api.js）
let API_CONFIG;
try {
  // 尝试直接使用全局变量中的API_CONFIG
  if (typeof window !== 'undefined' && window.API_CONFIG) {
    API_CONFIG = window.API_CONFIG;
  } else {
    // 如果没有全局变量，使用默认配置
    API_CONFIG = {
      apiKey: 'sk-5cc05eb59de1476792e079d19130c274',
      baseUrl: 'https://api.deepseek.com/v1/chat/completions',
      model: 'deepseek-chat',
      temperature: 0.7,
      maxTokens: 1000
    };
  }
} catch (error) {
  console.error('无法加载API配置:', error);
  // 使用默认配置
  API_CONFIG = {
    apiKey: 'sk-5cc05eb59de1476792e079d19130c274',
    baseUrl: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat',
    temperature: 0.7,
    maxTokens: 1000
  };
}

/**
 * 测试API连接
 * @param {Function} onStatus - 状态更新回调函数
 * @param {Function} onResult - 结果回调函数
 * @param {Function} onError - 错误回调函数
 */
async function testAPIConnection(onStatus, onResult, onError) {
  try {
    // 更新状态
    if (onStatus) onStatus('初始化测试...');
    
    // 构建测试消息
    const testMessages = [
      { role: "system", content: "你是小舟AI旅行规划师，一个专业的旅行顾问。请用简短语言回答用户问题。" },
      { role: "user", content: "北京有哪些著名的旅游景点？只需列出5个。" }
    ];
    
    if (onStatus) onStatus('准备API请求参数...');
    
    // 记录请求详情（不包含API密钥）
    const requestDetails = {
      url: API_CONFIG.baseUrl,
      model: API_CONFIG.model,
      messageCount: testMessages.length,
      temperature: API_CONFIG.temperature,
      maxTokens: API_CONFIG.maxTokens
    };
    
    console.log('API请求详情:', requestDetails);
    
    // 构建请求选项
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_CONFIG.apiKey}`
      },
      body: JSON.stringify({
        model: API_CONFIG.model,
        messages: testMessages,
        temperature: API_CONFIG.temperature,
        max_tokens: API_CONFIG.maxTokens
      })
    };
    
    if (onStatus) onStatus('发送API请求...');
    
    // 发送请求，添加超时处理
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时
    
    try {
      // 发送请求
      const response = await fetch(API_CONFIG.baseUrl, {
        ...requestOptions,
        signal: controller.signal
      });
      
      // 清除超时
      clearTimeout(timeoutId);
      
      if (onStatus) onStatus(`收到响应，状态: ${response.status} ${response.statusText}`);
      
      // 处理响应
      if (!response.ok) {
        let errorMessage = `HTTP错误: ${response.status} ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          errorMessage = `API错误: ${errorData.error?.message || errorMessage}`;
          if (onError) onError(errorMessage, errorData);
          return;
        } catch (parseError) {
          errorMessage += ` (无法解析错误详情: ${parseError.message})`;
          if (onError) onError(errorMessage, { parseError: parseError.message });
          return;
        }
      }
      
      // 解析成功的响应
      try {
        if (onStatus) onStatus('正在解析API响应...');
        const data = await response.json();
        
        // 验证响应数据
        if (!data.choices || !data.choices.length) {
          if (onError) onError('API响应缺少choices字段', data);
          return;
        }
        
        if (onStatus) onStatus('API测试成功完成！');
        if (onResult) onResult(data);
        
      } catch (parseError) {
        if (onError) onError(`无法解析API响应: ${parseError.message}`, { error: parseError.message });
      }
      
    } catch (fetchError) {
      // 清除超时
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        if (onError) onError('API请求超时（30秒）', { error: 'TIMEOUT' });
      } else {
        if (onError) onError(`API请求失败: ${fetchError.message}`, { error: fetchError.message });
      }
    }
    
  } catch (error) {
    if (onError) onError(`测试过程发生错误: ${error.message}`, { error: error.message, stack: error.stack });
  }
}

// 如果在浏览器环境中，将函数暴露给全局
if (typeof window !== 'undefined') {
  window.testAPIConnection = testAPIConnection;
}

// 如果支持模块导出，则导出函数
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testAPIConnection, API_CONFIG };
} 