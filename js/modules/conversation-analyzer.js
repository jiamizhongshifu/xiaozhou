/**
 * 对话分析器模块
 * 从聊天对话中提取旅行相关信息
 * 
 * @version 1.0.0
 */

class ConversationAnalyzer {
    constructor() {
        this.logPrefix = '[ConversationAnalyzer]';
        this.contextCache = null;
        this.initialized = false;
        
        // 正则表达式定义
        this.patterns = {
            // 目的地识别模式
            destination: [
                /(?:想|打算|计划)(?:去|前往|到达|游览|游玩|旅游|访问)(?:一下|一趟)?([^，。？！,.?!]{2,15})/,
                /(?:去|前往|到达|游览|游玩|旅游|访问)(?:一下|一趟)?([^，。？！,.?!]{2,15})(?:怎么样|如何|可以吗)/,
                /(?:想|打算|计划)(?:在|于)([^，。？！,.?!]{2,15})(?:玩|游玩|旅游|度假)/
            ],
            
            // 日期识别模式
            date: [
                /(20\d{2})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/,
                /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})/,
                /(\d{1,2})月(\d{1,2})(?:号|日)/,
                /下个?(?:周|星期)([一二三四五六日天])/,
                /(\d{1,2})天(?:后|内)/
            ],
            
            // 旅行天数
            duration: [
                /(\d{1,2})(?:天|日)(?:的|左右|之内)?(?:行程|旅行|旅游|游玩|玩)/,
                /玩(?:个|)(\d{1,2})(?:天|日)/,
                /(?:行程|旅行|旅游|游玩)(\d{1,2})(?:天|日)/
            ],
            
            // 人数
            travelers: [
                /(\d{1,2})(?:个|位|名)?(?:人|成人|大人)/,
                /(?:我们|一行|一共)(\d{1,2})(?:个|位|名)?人/
            ],
            
            // 预算
            budget: [
                /预算(?:大概|大约|是|为)?(\d+)(?:元|块|人民币)/,
                /(\d+)(?:元|块|人民币)(?:左右|上下|的预算)/
            ]
        };
        
        // 兴趣词汇映射
        this.interestKeywords = {
            '景点': 'sightseeing',
            '自然': 'nature',
            '文化': 'culture',
            '历史': 'history',
            '美食': 'food',
            '购物': 'shopping',
            '休闲': 'relaxation',
            '冒险': 'adventure',
            '家庭': 'family',
            '浪漫': 'romance'
        };
    }
    
    /**
     * 初始化对话分析器
     */
    async init() {
        if (this.initialized) {
            console.log(`${this.logPrefix} 已经初始化，跳过重复初始化`);
            return this;
        }
        
        console.log(`${this.logPrefix} 开始初始化对话分析器`);
        
        try {
            // 尝试加载上下文缓存
            await this.loadDependencies();
            
            this.initialized = true;
            console.log(`${this.logPrefix} 对话分析器初始化完成`);
            return this;
        } catch (error) {
            console.error(`${this.logPrefix} 初始化对话分析器时出错:`, error);
            // 初始化失败但仍可使用基本功能
            return this;
        }
    }
    
    /**
     * 加载依赖模块
     */
    async loadDependencies() {
        // 尝试加载上下文缓存
        if (window.getModuleBootstrap) {
            const bootstrap = window.getModuleBootstrap();
            if (bootstrap.initialized) {
                this.contextCache = bootstrap.getModule('contextCache');
            } else {
                await bootstrap.init();
                this.contextCache = bootstrap.getModule('contextCache');
            }
        }
        
        // 如果无法从ModuleBootstrap获取，尝试直接创建
        if (!this.contextCache && window.ContextCache) {
            this.contextCache = new window.ContextCache();
        }
    }
    
    /**
     * 紧急提取模式-直接从最后几条消息中查找关键信息
     * 当常规方法失败时使用
     */
    emergencyExtraction(messages) {
        console.log(`${this.logPrefix} 启动紧急提取模式，尝试快速识别目的地`);
        
        // 只分析最近的5条消息
        const recentMessages = messages.slice(-5);
        let userMessages = [];
        
        // 提取用户消息
        for (const msg of recentMessages) {
            if (msg.role === 'user' && typeof msg.content === 'string') {
                userMessages.push(msg.content);
            }
        }
        
        console.log(`${this.logPrefix} 紧急模式分析${userMessages.length}条最近消息`);
        
        // 目的地关键词列表 - 常见旅游目的地
        const destinations = [
            '日本', '东京', '大阪', '京都', '北海道',
            '泰国', '普吉岛', '曼谷', '清迈',
            '韩国', '首尔', '釜山',
            '法国', '巴黎', '尼斯',
            '意大利', '罗马', '威尼斯', '佛罗伦萨',
            '美国', '纽约', '洛杉矶', '旧金山',
            '新加坡', '马来西亚', '吉隆坡',
            '澳大利亚', '悉尼', '墨尔本',
            '新西兰', '英国', '伦敦',
            '西班牙', '巴塞罗那', '马德里',
            '三亚', '丽江', '大理', '西藏', '新疆',
            '云南', '四川', '北京', '上海'
        ];
        
        // 直接在消息中搜索目的地关键词
        for (const message of userMessages) {
            for (const destination of destinations) {
                if (message.includes(destination)) {
                    console.log(`${this.logPrefix} 紧急模式找到目的地: ${destination}`);
                    return {
                        destination: destination,
                        dates: { startDate: null, endDate: null },
                        travelers: null,
                        budget: null,
                        interests: null,
                        requirements: null
                    };
                }
            }
        }
        
        console.log(`${this.logPrefix} 紧急模式也未能提取到目的地`);
        return {};
    }
    
    /**
     * 从对话中提取旅行信息
     * @param {Array} messages 对话消息数组
     * @returns {Object} 提取的旅行信息
     */
    async extractTravelInfo(messages) {
        if (!Array.isArray(messages) || messages.length === 0) {
            console.log(`${this.logPrefix} 没有可分析的消息`);
            return {};
        }
        
        console.log(`${this.logPrefix} 开始从${messages.length}条消息中提取旅行信息`);
        
        // 检查缓存
        if (this.contextCache) {
            const cachedInfo = await this.contextCache.get('travelInfo');
            if (cachedInfo) {
                console.log(`${this.logPrefix} 从缓存获取到旅行信息:`, cachedInfo);
                return cachedInfo;
            }
        }
        
        // 提取信息
        const travelInfo = {
            destination: this.extractDestination(messages),
            dates: this.extractDates(messages),
            travelers: this.extractTravelers(messages),
            budget: this.extractBudget(messages),
            interests: this.extractInterests(messages),
            requirements: this.extractRequirements(messages)
        };
        
        console.log(`${this.logPrefix} 提取的旅行信息:`, travelInfo);
        
        // 检查是否提取到目的地，如果没有则尝试紧急提取
        if (!travelInfo.destination) {
            console.log(`${this.logPrefix} 常规提取未获得目的地，尝试紧急提取`);
            const emergencyInfo = this.emergencyExtraction(messages);
            if (emergencyInfo.destination) {
                // 合并信息，保留原有的其他字段
                travelInfo.destination = emergencyInfo.destination;
                console.log(`${this.logPrefix} 紧急提取成功，更新目的地为: ${travelInfo.destination}`);
            }
        }
        
        // 保存到缓存
        if (this.contextCache) {
            await this.contextCache.set('travelInfo', travelInfo, 30 * 60); // 30分钟过期
        }
        
        return travelInfo;
    }
    
    /**
     * 提取目的地信息
     */
    extractDestination(messages) {
        const userMessages = this.getUserMessages(messages);
        
        console.log(`${this.logPrefix} 开始从${userMessages.length}条用户消息中提取目的地信息`);
        
        for (const message of userMessages) {
            console.log(`${this.logPrefix} 分析用户消息: "${message}"`);
            
            for (const pattern of this.patterns.destination) {
                console.log(`${this.logPrefix} 使用模式: ${pattern}`);
                const match = message.match(pattern);
                if (match && match[1]) {
                    const destination = this.cleanDestination(match[1]);
                    console.log(`${this.logPrefix} 成功提取到目的地: ${destination}`);
                    return destination;
                }
            }
        }
        
        console.log(`${this.logPrefix} 未能提取到目的地信息`);
        return null;
    }
    
    /**
     * 清理目的地文本
     */
    cleanDestination(text) {
        // 移除常见的修饰词
        return text.replace(/一下|一趟|的|地方|城市/g, '').trim();
    }
    
    /**
     * 提取日期信息
     */
    extractDates(messages) {
        const userMessages = this.getUserMessages(messages);
        const dates = {
            startDate: null,
            endDate: null
        };
        
        // 简单提取，实际场景需要更复杂的逻辑
        for (const message of userMessages) {
            for (const pattern of this.patterns.date) {
                const match = message.match(pattern);
                if (match) {
                    // 这里只是简单示例，实际需要解析日期并推断出起止日期
                    if (!dates.startDate) {
                        dates.startDate = this.parseDate(match);
                    }
                }
            }
            
            // 查找旅行天数
            for (const pattern of this.patterns.duration) {
                const match = message.match(pattern);
                if (match && match[1]) {
                    const days = parseInt(match[1], 10);
                    if (days && dates.startDate) {
                        // 如果有开始日期和天数，计算结束日期
                        dates.endDate = this.addDays(dates.startDate, days);
                    }
                }
            }
        }
        
        return dates;
    }
    
    /**
     * 解析日期文本
     * 简化版本，实际使用需要更健壮的解析
     */
    parseDate(match) {
        // 简单日期解析，返回YYYY-MM-DD格式
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        
        return `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
    }
    
    /**
     * 增加天数到日期
     */
    addDays(dateString, days) {
        const date = new Date(dateString);
        date.setDate(date.getDate() + days);
        
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
        return `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
    }
    
    /**
     * 提取旅行人数
     */
    extractTravelers(messages) {
        const userMessages = this.getUserMessages(messages);
        
        for (const message of userMessages) {
            for (const pattern of this.patterns.travelers) {
                const match = message.match(pattern);
                if (match && match[1]) {
                    const count = parseInt(match[1], 10);
                    if (!isNaN(count) && count > 0) {
                        return count;
                    }
                }
            }
        }
        
        return null;
    }
    
    /**
     * 提取预算信息
     */
    extractBudget(messages) {
        const userMessages = this.getUserMessages(messages);
        
        for (const message of userMessages) {
            for (const pattern of this.patterns.budget) {
                const match = message.match(pattern);
                if (match && match[1]) {
                    const amount = parseInt(match[1], 10);
                    if (!isNaN(amount) && amount > 0) {
                        return amount;
                    }
                }
            }
        }
        
        return null;
    }
    
    /**
     * 提取兴趣爱好
     */
    extractInterests(messages) {
        const userMessages = this.getUserMessages(messages);
        const interestsFound = [];
        
        // 检查每个用户消息中是否包含兴趣关键词
        for (const message of userMessages) {
            for (const [keyword, value] of Object.entries(this.interestKeywords)) {
                if (message.includes(keyword) && !interestsFound.includes(value)) {
                    interestsFound.push(value);
                }
            }
        }
        
        return interestsFound.length > 0 ? interestsFound : null;
    }
    
    /**
     * 提取额外需求
     */
    extractRequirements(messages) {
        // 简单实现，仅提取最后一条用户消息作为需求
        const userMessages = this.getUserMessages(messages);
        
        if (userMessages.length > 0) {
            const lastMessage = userMessages[userMessages.length - 1];
            
            // 如果消息长度适合作为需求，则返回
            if (lastMessage.length >= 10 && lastMessage.length <= 200) {
                return lastMessage;
            }
        }
        
        return null;
    }
    
    /**
     * 获取用户消息
     */
    getUserMessages(messages) {
        if (!Array.isArray(messages)) return [];
        
        // 只提取用户发送的消息，假设消息结构包含role或type字段
        return messages
            .filter(msg => {
                if (msg.role === 'user' || msg.type === 'user') return true;
                if (typeof msg === 'object' && msg.content && (msg.isUser || msg.fromUser)) return true;
                return false;
            })
            .map(msg => {
                // 提取消息内容
                if (typeof msg === 'string') return msg;
                if (msg.content && typeof msg.content === 'string') return msg.content;
                if (msg.text && typeof msg.text === 'string') return msg.text;
                if (msg.message && typeof msg.message === 'string') return msg.message;
                return '';
            })
            .filter(text => text.length > 0);
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConversationAnalyzer;
} else {
    // 浏览器环境
    window.ConversationAnalyzer = ConversationAnalyzer;
    
    // 添加一个静态方法获取实例，确保兼容性
    window.getConversationAnalyzerInstance = function() {
        console.log('[ConversationAnalyzer] 通过静态方法获取实例');
        
        // 如果已经有实例在ModuleBootstrap中，优先使用它
        if (window.getModuleBootstrap && window.getModuleBootstrap().initialized) {
            const instance = window.getModuleBootstrap().getModule('conversationAnalyzer');
            if (instance) {
                console.log('[ConversationAnalyzer] 返回ModuleBootstrap中的实例');
                return instance;
            }
        }
        
        // 否则创建一个新实例
        console.log('[ConversationAnalyzer] 创建新实例');
        return new ConversationAnalyzer();
    };
} 