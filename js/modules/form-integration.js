/**
 * 表单集成模块
 * 负责将预填充功能非侵入式地集成到现有表单系统中
 * 
 * @version 1.0.0
 */

// 表单集成类
class FormIntegration {
    constructor() {
        this.logPrefix = '[FormIntegration]';
        this.formPrefillManager = null;
        this.conversationAnalyzer = null;
        this.initialized = false;
        this.originalCreateTravelPlanForm = null;
        this.originalRenderFormMessage = null;
    }
    
    /**
     * 初始化表单集成
     */
    async init() {
        if (this.initialized) {
            console.log(`${this.logPrefix} 已经初始化，跳过重复初始化`);
            return;
        }
        
        console.log(`${this.logPrefix} 开始初始化表单集成`);
        
        try {
            // 获取必要模块
            await this.loadDependencies();
            
            // 保存原始函数引用
            this.backupOriginalFunctions();
            
            // 应用函数增强
            this.enhanceFunctions();
            
            // 添加测试消息，确保有数据可用于预填充
            if (this.conversationAnalyzer && this.conversationAnalyzer.contextCache) {
                console.log(`${this.logPrefix} 添加测试数据到缓存，确保有预填充数据可用`);
                const testTravelInfo = {
                    destination: null,  // 不预设目的地，让用户输入决定
                    dates: {
                        startDate: null,
                        endDate: null
                    },
                    travelers: null,
                    budget: null,
                    interests: null,
                    requirements: null
                };
                
                try {
                    await this.conversationAnalyzer.contextCache.set('travelInfo', testTravelInfo, 60 * 60); // 1小时过期
                } catch (cacheError) {
                    console.warn(`${this.logPrefix} 添加测试数据到缓存失败:`, cacheError);
                }
            }
            
            this.initialized = true;
            console.log(`${this.logPrefix} 表单集成初始化完成`);
            
            // 触发初始化完成事件
            document.dispatchEvent(new CustomEvent('form-integration-ready', {
                detail: { success: true }
            }));
        } catch (error) {
            console.error(`${this.logPrefix} 初始化表单集成时出错:`, error);
            
            // 触发错误事件
            document.dispatchEvent(new CustomEvent('form-integration-error', {
                detail: { error }
            }));
        }
    }
    
    /**
     * 加载依赖模块
     */
    async loadDependencies() {
        console.log(`${this.logPrefix} 加载依赖模块`);
        
        // 尝试从ModuleBootstrap获取模块实例
        if (window.getModuleBootstrap) {
            const bootstrap = window.getModuleBootstrap();
            if (bootstrap.initialized) {
                this.formPrefillManager = bootstrap.getModule('formPrefillManager');
                this.conversationAnalyzer = bootstrap.getModule('conversationAnalyzer');
            } else {
                console.log(`${this.logPrefix} ModuleBootstrap未初始化，尝试初始化`);
                await bootstrap.init();
                this.formPrefillManager = bootstrap.getModule('formPrefillManager');
                this.conversationAnalyzer = bootstrap.getModule('conversationAnalyzer');
            }
        }
        
        // 如果无法从ModuleBootstrap获取，尝试直接创建
        if (!this.formPrefillManager && window.FormPrefillManager) {
            console.log(`${this.logPrefix} 直接创建FormPrefillManager实例`);
            
            // 先创建ConversationAnalyzer
            if (!this.conversationAnalyzer && window.ConversationAnalyzer) {
                this.conversationAnalyzer = new window.ConversationAnalyzer();
            }
            
            this.formPrefillManager = new window.FormPrefillManager(this.conversationAnalyzer);
        }
        
        if (!this.formPrefillManager) {
            console.warn(`${this.logPrefix} 无法加载FormPrefillManager，预填充功能将不可用`);
        } else {
            console.log(`${this.logPrefix} 依赖模块加载完成`);
        }
    }
    
    /**
     * 备份原始函数
     */
    backupOriginalFunctions() {
        if (window.createTravelPlanForm) {
            this.originalCreateTravelPlanForm = window.createTravelPlanForm;
            console.log(`${this.logPrefix} 已备份原始createTravelPlanForm函数`);
        } else {
            console.warn(`${this.logPrefix} 未找到createTravelPlanForm函数`);
        }
        
        if (window.renderFormMessage) {
            this.originalRenderFormMessage = window.renderFormMessage;
            console.log(`${this.logPrefix} 已备份原始renderFormMessage函数`);
        }
    }
    
    /**
     * 增强现有函数
     */
    enhanceFunctions() {
        if (!this.formPrefillManager) {
            console.warn(`${this.logPrefix} FormPrefillManager不可用，跳过函数增强`);
            return;
        }
        
        // 增强createTravelPlanForm函数
        if (this.originalCreateTravelPlanForm) {
            const self = this;
            
            window.createTravelPlanForm = async function() {
                try {
                    console.log(`${self.logPrefix} 调用增强版createTravelPlanForm`);
                    
                    // 调用原始函数获取基础表单
                    const baseForm = self.originalCreateTravelPlanForm.apply(this, arguments);
                    
                    // 检查是否有聊天历史数据
                    let messages = [];
                    if (window.chatHistory && Array.isArray(window.chatHistory)) {
                        messages = window.chatHistory;
                        console.log(`${self.logPrefix} 从window.chatHistory获取到${messages.length}条消息`);
                    } else if (window.getConversationHistory && typeof window.getConversationHistory === 'function') {
                        messages = window.getConversationHistory();
                        console.log(`${self.logPrefix} 从getConversationHistory()获取到${messages.length}条消息`);
                    } else if (window.ChatModule && window.ChatModule.getConversationHistory) {
                        messages = window.ChatModule.getConversationHistory();
                        console.log(`${self.logPrefix} 从ChatModule.getConversationHistory()获取到${messages.length}条消息`);
                    } else {
                        // 尝试手动构建一条消息，使用当前用户输入
                        console.warn(`${self.logPrefix} 未找到聊天历史数据源，尝试使用当前输入`);
                        
                        // 通常最近的用户输入在消息栏或文本区域
                        const inputElement = document.querySelector('#user-input, #message-input, textarea[placeholder*="问题"]');
                        if (inputElement && inputElement.value) {
                            console.log(`${self.logPrefix} 从输入框获取到当前用户输入: ${inputElement.value}`);
                            messages = [
                                { role: 'user', content: inputElement.value }
                            ];
                        } else {
                            // 从最近的消息气泡中提取
                            const messageElements = document.querySelectorAll('.user-message, .message-user');
                            if (messageElements.length > 0) {
                                const latestMessage = messageElements[messageElements.length - 1];
                                const messageText = latestMessage.textContent.trim();
                                if (messageText) {
                                    console.log(`${self.logPrefix} 从DOM中提取最近用户消息: ${messageText}`);
                                    messages = [
                                        { role: 'user', content: messageText }
                                    ];
                                }
                            }
                        }
                        
                        if (messages.length === 0) {
                            console.warn(`${self.logPrefix} 无法获取任何消息内容，将使用空数据`);
                        }
                    }
                    
                    // 准备预填充数据
                    console.log(`${self.logPrefix} 开始准备表单预填充数据`);
                    const prefillData = await self.formPrefillManager.prepareFormData(messages);
                    console.log(`${self.logPrefix} 获取到预填充数据:`, prefillData);
                    
                    // 如果没有有效的预填充数据，直接返回基础表单
                    if (!prefillData || Object.keys(prefillData).length === 0 || !self.formPrefillManager.validatePrefillData(prefillData)) {
                        console.warn(`${self.logPrefix} 预填充数据无效或为空，使用原始表单`);
                        return baseForm;
                    }
                    
                    console.log(`${self.logPrefix} 预填充数据有效，开始应用到表单`);
                    
                    // 深拷贝表单，避免修改原始对象
                    const enhancedForm = JSON.parse(JSON.stringify(baseForm));
                    
                    // 将预填充数据应用到表单字段
                    if (enhancedForm && enhancedForm.content && Array.isArray(enhancedForm.content.fields)) {
                        enhancedForm.content.fields.forEach(field => {
                            // 检查是否有对应的预填充数据
                            if (prefillData[field.name] !== undefined) {
                                console.log(`${self.logPrefix} 为字段 ${field.name} 设置预填充值: ${prefillData[field.name]}`);
                                
                                // 根据字段类型设置预填充值
                                if (field.type === 'select') {
                                    // 检查选项是否存在
                                    const optionExists = Array.isArray(field.options) && 
                                        field.options.some(opt => {
                                            const value = opt.value || opt;
                                            return value === prefillData[field.name];
                                        });
                                    
                                    if (optionExists) {
                                        field.value = prefillData[field.name];
                                        console.log(`${self.logPrefix} 下拉选项 ${field.name} 设置为: ${field.value}`);
                                    } else {
                                        console.warn(`${self.logPrefix} 下拉选项中不存在值: ${prefillData[field.name]}`);
                                    }
                                } else if (field.type === 'radio-group' && field.name === 'interests') {
                                    // 对于兴趣字段特殊处理，因为它是复选框组
                                    // 这里我们只保存预填充数据，实际应用会在renderFormMessage中处理
                                    enhancedForm._prefillInterests = prefillData[field.name];
                                    console.log(`${self.logPrefix} 保存兴趣预填充数据: ${prefillData[field.name]}`);
                                } else {
                                    // 文本、日期等普通字段
                                    field.value = prefillData[field.name];
                                    console.log(`${self.logPrefix} 字段 ${field.name} 设置为: ${field.value}`);
                                }
                            }
                        });
                    }
                    
                    // 添加标记，表示表单已经预填充
                    enhancedForm._prefilled = true;
                    enhancedForm._prefillData = prefillData;
                    
                    console.log(`${self.logPrefix} 表单预填充完成，返回增强表单`);
                    return enhancedForm;
                } catch (error) {
                    console.error(`${self.logPrefix} 增强createTravelPlanForm时出错:`, error);
                    // 出错时调用原始函数作为降级策略
                    return self.originalCreateTravelPlanForm.apply(this, arguments);
                }
            };
            
            console.log(`${this.logPrefix} 已增强createTravelPlanForm函数`);
        }
        
        // 添加表单提交处理增强函数
        function enhanceFormSubmitHandler(form, originalHandler) {
            return function(event) {
                // 阻止默认提交行为
                event.preventDefault();
                
                // 获取表单数据
                const formData = {};
                const formElements = form.elements;
                for (let i = 0; i < formElements.length; i++) {
                    const element = formElements[i];
                    if (element.name) {
                        formData[element.name] = element.value;
                    }
                }
                
                // 数据一致性优先级检查
                // 1. 首先检查对话引导数据
                if (window.userTravelPreferences && window.userTravelPreferences.destination) {
                    console.log("[FormIntegration] 使用对话引导收集的目的地:", window.userTravelPreferences.destination);
                    formData.destination = window.userTravelPreferences.destination;
                }
                // 2. 其次检查表单预填充数据
                else if (formData.destination === "未指定目的地" && form._prefillData && form._prefillData.destination) {
                    // 恢复预填充的目的地数据
                    formData.destination = form._prefillData.destination;
                    console.log("[FormIntegration] 恢复预填充的目的地:", formData.destination);
                }
                
                // 确保目的地不为空
                if (!formData.destination || formData.destination.trim() === "") {
                    formData.destination = "热门目的地";
                    console.log("[FormIntegration] 目的地为空，使用默认值:", formData.destination);
                }
                
                // 处理预算
                if (window.userTravelPreferences && window.userTravelPreferences.budget) {
                    if (formData.budget !== window.userTravelPreferences.budget) {
                        console.log("[FormIntegration] 使用对话引导收集的预算:", window.userTravelPreferences.budget);
                        formData.budget = window.userTravelPreferences.budget;
                    }
                }
                
                // 调用原始处理函数
                return originalHandler.call(this, event, formData);
            };
        }
        
        // 增强renderFormMessage函数
        if (this.originalRenderFormMessage) {
            const self = this;
            
            window.renderFormMessage = function(container, formData) {
                try {
                    console.log(`${self.logPrefix} 调用增强版renderFormMessage`);
                    
                    // 检查是否有对话引导数据，优先使用
                    if (window.userTravelPreferences && window.userTravelPreferences.destination && 
                        formData && formData.content && formData.content.id === 'travel-form') {
                        
                        console.log(`${self.logPrefix} 检测到对话引导数据，优先应用到表单`);
                        
                        // 深拷贝表单，避免修改原始对象
                        if (!formData._prefilled) {
                            formData = JSON.parse(JSON.stringify(formData));
                            formData._prefilled = true;
                        }
                        
                        // 创建或更新预填充数据
                        if (!formData._prefillData) {
                            formData._prefillData = {};
                        }
                        
                        // 合并对话引导数据到预填充数据
                        formData._prefillData.destination = window.userTravelPreferences.destination;
                        if (window.userTravelPreferences.budget) {
                            formData._prefillData.budget = window.userTravelPreferences.budget;
                        }
                        
                        // 直接设置表单字段值
                        if (formData.content && Array.isArray(formData.content.fields)) {
                            formData.content.fields.forEach(field => {
                                if (field.name === 'destination') {
                                    field.value = window.userTravelPreferences.destination;
                                } else if (field.name === 'budget' && window.userTravelPreferences.budget) {
                                    field.value = window.userTravelPreferences.budget;
                                }
                            });
                        }
                        
                        console.log(`${self.logPrefix} 已应用对话引导数据到表单:`, formData._prefillData);
                    }
                    
                    // 调用原始函数渲染表单
                    self.originalRenderFormMessage.call(this, container, formData);
                    
                    // 查找刚渲染的表单
                    const form = container.querySelector('form');
                    if (form) {
                        // 保存预填充数据到表单元素，用于后续恢复
                        if (formData._prefilled && formData._prefillData) {
                            form._prefillData = formData._prefillData;
                            console.log(`${self.logPrefix} 已将预填充数据保存到表单元素`);
                        }
                        
                        // 如果有对话引导数据，也保存到表单元素
                        if (window.userTravelPreferences) {
                            form._guidedData = window.userTravelPreferences;
                            console.log(`${self.logPrefix} 已将对话引导数据保存到表单元素:`, form._guidedData);
                        }
                        
                        // 增强表单提交处理
                        const originalSubmitHandler = form.onsubmit;
                        if (originalSubmitHandler) {
                            form.onsubmit = enhanceFormSubmitHandler(form, originalSubmitHandler);
                            console.log(`${self.logPrefix} 已增强表单提交处理`);
                        }
                    }
                    
                    // 检查是否是预填充表单，以及是否是旅行表单
                    if (formData && formData._prefilled && formData.content && formData.content.id === 'travel-form') {
                        // 对于兴趣字段特殊处理
                        if (formData._prefillInterests && Array.isArray(formData._prefillInterests)) {
                            // 找到所有兴趣复选框
                            const form = container.querySelector('form');
                            if (form) {
                                const checkboxes = form.querySelectorAll('input[name="interests"]');
                                
                                // 设置复选框选中状态
                                checkboxes.forEach(checkbox => {
                                    if (formData._prefillInterests.includes(checkbox.value)) {
                                        checkbox.checked = true;
                                    }
                                });
                            }
                        }
                        
                        // 添加预填充提示信息
                        const prefillNotice = document.createElement('div');
                        prefillNotice.className = 'prefill-notice';
                        
                        // 根据数据来源提供不同提示
                        if (window.userTravelPreferences && window.userTravelPreferences.destination) {
                            prefillNotice.innerHTML = `
                                <i class="fas fa-magic"></i>
                                <span>根据您的选择，我们已为您填充了部分字段</span>
                            `;
                        } else {
                            prefillNotice.innerHTML = `
                                <i class="fas fa-magic"></i>
                                <span>我们已根据您的历史对话自动填充了部分字段</span>
                            `;
                        }
                        
                        // 将提示添加到表单顶部
                        const formContainer = container.querySelector('.form-message-container');
                        if (formContainer && formContainer.firstChild) {
                            formContainer.insertBefore(prefillNotice, formContainer.firstChild);
                        }
                        
                        // 添加简单样式
                        if (!document.getElementById('prefill-styles')) {
                            const style = document.createElement('style');
                            style.id = 'prefill-styles';
                            style.textContent = `
                                .prefill-notice {
                                    background-color: #e8f5ff;
                                    border-left: 3px solid #0366d6;
                                    padding: 8px 12px;
                                    margin-bottom: 12px;
                                    border-radius: 4px;
                                    font-size: 14px;
                                    display: flex;
                                    align-items: center;
                                }
                                .prefill-notice i {
                                    color: #0366d6;
                                    margin-right: 8px;
                                }
                            `;
                            document.head.appendChild(style);
                        }
                    }
                    
                    console.log(`${self.logPrefix} 表单渲染增强完成`);
                } catch (error) {
                    console.error(`${self.logPrefix} 增强renderFormMessage时出错:`, error);
                    // 出错时回退到原始函数
                    self.originalRenderFormMessage.call(this, container, formData);
                }
            };
            
            console.log(`${this.logPrefix} 已增强renderFormMessage函数`);
        }
    }
}

// 创建单例实例
let formIntegration = null;

/**
 * 获取表单集成实例
 * @returns {FormIntegration} 表单集成实例
 */
function getFormIntegration() {
    if (!formIntegration) {
        formIntegration = new FormIntegration();
    }
    return formIntegration;
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FormIntegration, getFormIntegration };
} else {
    // 浏览器环境
    window.FormIntegration = FormIntegration;
    window.getFormIntegration = getFormIntegration;
}

// 等待DOM加载完成后，自动初始化表单集成
document.addEventListener('DOMContentLoaded', () => {
    console.log('[FormIntegration] DOMContentLoaded事件触发，准备初始化');
    
    // 等待模块引导完成后再初始化表单集成
    document.addEventListener('module-bootstrap-complete', async () => {
        console.log('[FormIntegration] 模块引导完成，开始初始化表单集成');
        const integration = getFormIntegration();
        await integration.init();
    });
});

// 如果已经错过了DOMContentLoaded事件，手动检查和初始化
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('[FormIntegration] DOM已加载，检查模块状态');
    
    // 定义一个函数，用于检查并初始化表单集成
    const checkAndInitFormIntegration = async () => {
        console.log('[FormIntegration] 正在检查模块引导状态');
        // 如果模块引导已完成，则初始化表单集成
        if (window.getModuleBootstrap && window.getModuleBootstrap().initialized) {
            console.log('[FormIntegration] 模块引导已完成，手动初始化表单集成');
            const integration = getFormIntegration();
            await integration.init();
        } else {
            console.log('[FormIntegration] 模块引导尚未完成，将在完成后初始化');
            // 添加一次性事件监听器
            document.addEventListener('module-bootstrap-complete', async () => {
                console.log('[FormIntegration] 收到模块引导完成事件，延迟初始化表单集成');
                const integration = getFormIntegration();
                await integration.init();
            }, {once: true});
        }
    };
    
    // 延迟执行检查，确保所有模块都已加载
    setTimeout(checkAndInitFormIntegration, 100);
} 