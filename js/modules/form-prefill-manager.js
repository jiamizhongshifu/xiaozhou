/**
 * 表单预填充管理器
 * 负责将对话分析器提取的信息转换为表单字段值
 * 
 * @version 1.0.0
 */

class FormPrefillManager {
    constructor(conversationAnalyzer = null) {
        this.logPrefix = '[FormPrefillManager]';
        this.conversationAnalyzer = conversationAnalyzer;
        this.initialized = false;
    }
    
    /**
     * 初始化预填充管理器
     */
    async init() {
        if (this.initialized) {
            console.log(`${this.logPrefix} 已经初始化，跳过重复初始化`);
            return this;
        }
        
        console.log(`${this.logPrefix} 开始初始化预填充管理器`);
        
        try {
            // 尝试多种方式获取ConversationAnalyzer
            if (!this.conversationAnalyzer) {
                console.log(`${this.logPrefix} 尝试获取ConversationAnalyzer实例`);
                
                // 方法1: 从window全局对象获取现有实例
                if (window.ConversationAnalyzer) {
                    console.log(`${this.logPrefix} 从window获取ConversationAnalyzer`);
                    
                    // 优先使用静态获取方法
                    if (window.getConversationAnalyzerInstance && typeof window.getConversationAnalyzerInstance === 'function') {
                        console.log(`${this.logPrefix} 使用静态方法获取ConversationAnalyzer实例`);
                        try {
                            this.conversationAnalyzer = window.getConversationAnalyzerInstance();
                        } catch (error) {
                            console.warn(`${this.logPrefix} 使用静态方法获取实例失败:`, error);
                        }
                    }
                    // 如果静态方法失败，尝试其他方式
                    else if (typeof window.ConversationAnalyzer === 'function') {
                        console.log(`${this.logPrefix} ConversationAnalyzer是构造函数，创建新实例`);
                        try {
                            this.conversationAnalyzer = new window.ConversationAnalyzer();
                            if (typeof this.conversationAnalyzer.init === 'function') {
                                await this.conversationAnalyzer.init();
                            }
                        } catch (error) {
                            console.warn(`${this.logPrefix} 创建ConversationAnalyzer实例失败:`, error);
                            // 尝试直接使用
                            this.conversationAnalyzer = window.ConversationAnalyzer;
                        }
                    } else {
                        // 直接使用现有实例
                        console.log(`${this.logPrefix} 直接使用ConversationAnalyzer实例`);
                        this.conversationAnalyzer = window.ConversationAnalyzer;
                    }
                } 
                // 方法2: 从ModuleBootstrap获取
                else if (window.getModuleBootstrap && window.getModuleBootstrap().initialized) {
                    console.log(`${this.logPrefix} 从ModuleBootstrap获取ConversationAnalyzer实例`);
                    const bootstrap = window.getModuleBootstrap();
                    const analyzerInstance = bootstrap.getModule('conversationAnalyzer');
                    if (analyzerInstance) {
                        this.conversationAnalyzer = analyzerInstance;
                        console.log(`${this.logPrefix} 成功从ModuleBootstrap获取实例`);
                    }
                }
                
                if (!this.conversationAnalyzer) {
                    console.warn(`${this.logPrefix} 无法获取ConversationAnalyzer，部分功能可能不可用`);
                    // 创建一个简单的兼容对象，避免null错误
                    this.conversationAnalyzer = {
                        extractTravelInfo: async () => {
                            console.log(`${this.logPrefix} 使用兼容模式extractTravelInfo`);
                            return { destination: null, dates: {}, travelers: null, budget: null, interests: null };
                        }
                    };
                }
            }
            
            this.initialized = true;
            console.log(`${this.logPrefix} 预填充管理器初始化完成`);
            return this;
        } catch (error) {
            console.error(`${this.logPrefix} 初始化预填充管理器时出错:`, error);
            // 即使出错，也尝试创建兼容对象避免阻断功能
            this.conversationAnalyzer = {
                extractTravelInfo: async () => {
                    console.log(`${this.logPrefix} 使用错误恢复模式extractTravelInfo`);
                    return { destination: null, dates: {}, travelers: null, budget: null, interests: null };
                }
            };
            this.initialized = true;
            return this;
        }
    }
    
    /**
     * 准备表单数据
     * @param {Array} messages 消息数组
     * @returns {Object} 处理后的表单数据
     */
    async prepareFormData(messages) {
        // 确保初始化
        if (!this.initialized) {
            console.log(`${this.logPrefix} 管理器未初始化，尝试初始化`);
            await this.init();
        }
        
        if (!this.conversationAnalyzer) {
            console.error(`${this.logPrefix} ConversationAnalyzer不可用，无法准备表单数据`);
            return {};  // 返回空对象而不是null，避免后续判断错误
        }
        
        console.log(`${this.logPrefix} 开始准备表单数据，消息数量:`, Array.isArray(messages) ? messages.length : '无效消息');
        
        // 验证messages参数
        if (!Array.isArray(messages) || messages.length === 0) {
            console.warn(`${this.logPrefix} 无效的消息数组，使用空数据`);
            return {};
        }
        
        try {
            // 检查是否有用户消息
            let hasUserMessages = false;
            for (const msg of messages) {
                if (msg && msg.role === 'user' && typeof msg.content === 'string') {
                    hasUserMessages = true;
                    break;
                }
            }
            
            if (!hasUserMessages) {
                console.warn(`${this.logPrefix} 消息数组中没有有效的用户消息`);
                return {};
            }
            
            console.log(`${this.logPrefix} 提取旅行信息...`);
            // 从对话中提取旅行信息
            const travelInfo = await this.conversationAnalyzer.extractTravelInfo(messages);
            console.log(`${this.logPrefix} 提取结果:`, travelInfo);
            
            if (!travelInfo || typeof travelInfo !== 'object') {
                console.warn(`${this.logPrefix} 提取的旅行信息无效`);
                return {};
            }
            
            // 将旅行信息转换为表单字段
            const formData = this.convertToFormFields(travelInfo);
            
            console.log(`${this.logPrefix} 表单数据准备完成:`, formData);
            return formData;
        } catch (error) {
            console.error(`${this.logPrefix} 准备表单数据时出错:`, error);
            return {};  // 返回空对象而不是null
        }
    }
    
    /**
     * 将旅行信息转换为表单字段
     * @param {Object} travelInfo 旅行信息
     * @returns {Object} 表单字段数据
     */
    convertToFormFields(travelInfo) {
        const formData = {};
        
        // 目的地
        if (travelInfo.destination) {
            formData.destination = travelInfo.destination;
        }
        
        // 日期
        if (travelInfo.dates) {
            if (travelInfo.dates.startDate) {
                formData.startDate = travelInfo.dates.startDate;
            }
            
            if (travelInfo.dates.endDate) {
                formData.endDate = travelInfo.dates.endDate;
            }
        }
        
        // 人数
        if (typeof travelInfo.travelers === 'number' && travelInfo.travelers > 0) {
            formData.travelers = travelInfo.travelers;
        }
        
        // 预算
        if (typeof travelInfo.budget === 'number' && travelInfo.budget > 0) {
            // 转换预算为范围选项
            formData.budget = this.convertBudgetToRange(travelInfo.budget);
        }
        
        // 兴趣爱好
        if (Array.isArray(travelInfo.interests) && travelInfo.interests.length > 0) {
            formData.interests = travelInfo.interests;
        }
        
        // 额外需求
        if (travelInfo.requirements) {
            formData.requirements = travelInfo.requirements;
        }
        
        return formData;
    }
    
    /**
     * 将预算金额转换为预定义范围
     * @param {number} budget 预算金额
     * @returns {string} 预算范围
     */
    convertBudgetToRange(budget) {
        if (budget <= 3000) {
            return 'economy';
        } else if (budget <= 8000) {
            return 'standard';
        } else if (budget <= 15000) {
            return 'comfort';
        } else {
            return 'luxury';
        }
    }
    
    /**
     * 验证预填充数据
     * @param {Object} prefillData 预填充数据
     * @returns {boolean} 是否有效
     */
    validatePrefillData(prefillData) {
        if (!prefillData || typeof prefillData !== 'object') {
            return false;
        }
        
        // 至少要有一个有效字段才进行预填充
        const validFields = [
            'destination',
            'startDate',
            'endDate',
            'travelers',
            'budget',
            'interests',
            'requirements'
        ];
        
        return validFields.some(field => {
            if (!prefillData[field]) return false;
            
            // 检查具体值是否有效
            if (field === 'interests' && Array.isArray(prefillData[field])) {
                return prefillData[field].length > 0;
            }
            
            return true;
        });
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FormPrefillManager;
} else {
    // 浏览器环境
    window.FormPrefillManager = FormPrefillManager;
} 