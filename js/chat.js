/**
 * 旅行规划师小周 - 聊天功能处理模块
 * 连接用户界面与API
 */

// 聊天功能JavaScript文件，用于处理聊天界面和与API的交互

/**
 * 全局变量
 */
let conversationHistory = []; // 存储对话历史
let isTyping = false; // 控制是否正在显示"正在输入"状态
let chatInitialized = false; // 控制是否已初始化聊天
let chatOptions = {}; // 存储聊天选项

/**
 * 消息类型枚举
 * @type {Object}
 */
const MessageType = {
    TEXT: 'text',           // 普通文本消息
    FORM: 'form',           // 表单类型消息
    ITINERARY: 'itinerary', // 行程安排消息
    CARD: 'card',           // 卡片类消息
    GALLERY: 'gallery'      // 图片/卡片画廊
};

/**
 * 初始化聊天功能
 * @param {Object} options - 初始化选项
 * @param {boolean} options.skipWelcomeMessage - 是否跳过欢迎消息
 * @param {boolean} options.useLocalMode - 是否使用本地模式
 */
function initChat(options = {}) {
    // 已经初始化过则不再重复初始化
    if (chatInitialized) {
        console.log('聊天已经初始化过，跳过重复初始化');
        return;
    }
    
    // 保存选项
    chatOptions = {...options};
    console.log('初始化聊天选项:', chatOptions);
    
    // 添加额外样式
    addExtraStyles();
    
    // 获取聊天元素
    const chatContainer = document.getElementById('chat-container');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const suggestionButtons = document.querySelectorAll('.suggestion-btn');
    
    if (!chatContainer || !messageInput || !sendButton) {
        console.error('聊天界面元素未找到');
        return;
    }
    
    // 优化聊天界面样式
    applyAppleStyleToChatUI();
    
    // 移除现有的事件监听器（如果有）
    const newSendButton = sendButton.cloneNode(true);
    sendButton.parentNode.replaceChild(newSendButton, sendButton);
    
    const newMessageInput = messageInput.cloneNode(true);
    messageInput.parentNode.replaceChild(newMessageInput, messageInput);
    
    // 重新注册事件监听器
    newSendButton.addEventListener('click', () => sendMessage());
    newMessageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // 为输入框添加自动调整高度功能
    newMessageInput.addEventListener('input', () => {
        autoResizeTextarea(newMessageInput);
    });
    
    // 注册建议按钮点击事件
    suggestionButtons.forEach(button => {
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        newButton.addEventListener('click', () => {
            const text = newButton.textContent.trim();
            newMessageInput.value = text;
            sendMessage();
            
            // 点击后添加动画效果
            newButton.classList.add('suggestion-btn-clicked');
            setTimeout(() => {
                newButton.classList.remove('suggestion-btn-clicked');
            }, 300);
        });
    });
    
    // 显示欢迎消息，除非选项中指定跳过
    if (!chatOptions.skipWelcomeMessage) {
        setTimeout(() => {
            addBotMessage('你好！我是旅行规划师小周。请告诉我你想去哪里旅行，或者你需要什么帮助？', true);
            updateSuggestionButtons(['帮我计划日本之旅', '我想去海边度假', '推荐一个适合11月的旅行地', '预算5000元可以去哪里']);
        }, 500);
    }
    
    // 标记为已初始化
    chatInitialized = true;
}

/**
 * 应用苹果风格到聊天UI
 */
function applyAppleStyleToChatUI() {
    // 获取聊天相关元素
    const chatContainer = document.getElementById('chat-container');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const suggestionContainer = document.querySelector('.suggestion-container');
    
    if (chatContainer) {
        // 设置聊天容器样式
        chatContainer.style.borderRadius = '16px';
        chatContainer.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
        chatContainer.style.backgroundColor = '#fff';
    }
    
    if (messageInput) {
        // 设置输入框样式
        messageInput.style.borderRadius = '20px';
        messageInput.style.border = '1px solid rgba(0,0,0,0.1)';
        messageInput.style.padding = '12px 15px';
        messageInput.style.fontSize = '15px';
        messageInput.style.boxShadow = 'inset 0 1px 3px rgba(0,0,0,0.05)';
        messageInput.style.fontFamily = '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';
        messageInput.style.transition = 'border-color 0.2s ease, box-shadow 0.2s ease';
        
        // 添加焦点样式
        messageInput.addEventListener('focus', () => {
            messageInput.style.borderColor = '#0071e3';
            messageInput.style.boxShadow = '0 0 0 3px rgba(0, 113, 227, 0.2)';
        });
        
        messageInput.addEventListener('blur', () => {
            messageInput.style.borderColor = 'rgba(0,0,0,0.1)';
            messageInput.style.boxShadow = 'inset 0 1px 3px rgba(0,0,0,0.05)';
        });
    }
    
    if (sendButton) {
        // 设置发送按钮样式
        sendButton.style.backgroundColor = '#0071e3';
        sendButton.style.borderRadius = '50%';
        sendButton.style.width = '42px';
        sendButton.style.height = '42px';
        sendButton.style.display = 'flex';
        sendButton.style.alignItems = 'center';
        sendButton.style.justifyContent = 'center';
        sendButton.style.boxShadow = '0 2px 8px rgba(0, 113, 227, 0.3)';
        sendButton.style.transition = 'all 0.2s ease';
        
        // 添加悬停效果
        sendButton.addEventListener('mouseenter', () => {
            sendButton.style.backgroundColor = '#0051a2';
            sendButton.style.transform = 'translateY(-1px)';
            sendButton.style.boxShadow = '0 4px 12px rgba(0, 113, 227, 0.4)';
        });
        
        sendButton.addEventListener('mouseleave', () => {
            sendButton.style.backgroundColor = '#0071e3';
            sendButton.style.transform = 'translateY(0)';
            sendButton.style.boxShadow = '0 2px 8px rgba(0, 113, 227, 0.3)';
        });
        
        // 添加按下效果
        sendButton.addEventListener('mousedown', () => {
            sendButton.style.transform = 'translateY(1px)';
            sendButton.style.boxShadow = '0 1px 4px rgba(0, 113, 227, 0.4)';
        });
        
        sendButton.addEventListener('mouseup', () => {
            sendButton.style.transform = 'translateY(0)';
            sendButton.style.boxShadow = '0 2px 8px rgba(0, 113, 227, 0.3)';
        });
    }
    
    if (suggestionContainer) {
        // 设置建议容器样式
        suggestionContainer.style.display = 'flex';
        suggestionContainer.style.flexWrap = 'wrap';
        suggestionContainer.style.gap = '10px';
        suggestionContainer.style.margin = '15px 0';
        
        // 设置所有建议按钮的样式
        const suggestionButtons = suggestionContainer.querySelectorAll('.suggestion-btn');
        suggestionButtons.forEach(button => {
            button.style.backgroundColor = '#f5f5f7';
            button.style.color = '#1d1d1f';
            button.style.border = 'none';
            button.style.borderRadius = '20px';
            button.style.padding = '10px 15px';
            button.style.fontSize = '14px';
            button.style.fontWeight = '500';
            button.style.cursor = 'pointer';
            button.style.transition = 'all 0.2s ease';
            
            // 添加悬停效果
            button.addEventListener('mouseenter', () => {
                button.style.backgroundColor = '#e8e8e8';
                button.style.transform = 'translateY(-1px)';
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.backgroundColor = '#f5f5f7';
                button.style.transform = 'translateY(0)';
            });
            
            // 添加CSS类
            button.classList.add('apple-suggestion-btn');
        });
        
        // 添加CSS样式到head
        const style = document.createElement('style');
        style.textContent = `
            .apple-suggestion-btn.suggestion-btn-clicked {
                animation: pulse 0.3s ease;
            }
            
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(0.95); }
                100% { transform: scale(1); }
            }
        `;
        document.head.appendChild(style);
    }

    // 添加消息样式到head
    const style = document.createElement('style');
    style.textContent = `
        .message {
            opacity: 0;
            transform: translateY(10px);
            animation: messageAppear 0.3s ease forwards;
        }
        
        .message-complete {
            animation: messageComplete 0.3s ease forwards;
        }
        
        .typing-content {
            line-height: 1.6;
            font-size: 15px;
            color: #333;
        }
        
        .bot-message .message-content {
            background-color: #f5f5f7;
            border-radius: 18px;
            padding: 12px 16px;
            max-width: 85%;
            margin-bottom: 4px;
            position: relative;
            transition: all 0.3s ease;
        }
        
        .bot-message .message-content:hover {
            background-color: #f0f0f2;
        }
        
        .message-timestamp {
            font-size: 12px;
            color: #8e8e93;
            margin-top: 4px;
        }
        
        .message-status {
            font-size: 12px;
            color: #8e8e93;
            display: flex;
            align-items: center;
            gap: 4px;
        }
        
        .message-actions {
            opacity: 0;
            transition: opacity 0.2s ease;
        }
        
        .message:hover .message-actions {
            opacity: 1;
        }
        
        .action-button {
            background: none;
            border: none;
            padding: 4px 8px;
            color: #8e8e93;
            cursor: pointer;
            transition: color 0.2s ease;
        }
        
        .action-button:hover {
            color: #0071e3;
        }
        
        @keyframes messageAppear {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes messageComplete {
            0% {
                transform: scale(1);
            }
            50% {
                transform: scale(1.02);
            }
            100% {
                transform: scale(1);
            }
        }
        
        /* 优化行程内容的显示 */
        .itinerary-container {
            margin: 15px 0;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        
        .itinerary-overview {
            background-color: #f8f9fa;
            padding: 15px;
            border-bottom: 1px solid #e1e4e8;
        }
        
        .day-card {
            background-color: white;
            margin: 10px 0;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .day-title {
            background-color: #0071e3;
            color: white;
            padding: 8px 12px;
            font-weight: 500;
        }
        
        .schedule-list {
            padding: 10px 15px;
            margin: 0;
        }
        
        .schedule-list li {
            margin: 8px 0;
            padding-left: 20px;
            position: relative;
        }
        
        .schedule-list li:before {
            content: "•";
            position: absolute;
            left: 0;
            color: #0071e3;
        }
        
        .time-slot {
            color: #0071e3;
            font-weight: 500;
            margin-right: 8px;
        }
    `;
    document.head.appendChild(style);
}

/**
 * 自动调整文本域高度
 */
function autoResizeTextarea(textarea) {
    if (!textarea) return;
    
    // 重置高度以获取正确的scrollHeight
    textarea.style.height = 'auto';
    
    // 根据内容调整高度
    const newHeight = Math.min(Math.max(textarea.scrollHeight, 42), 120);
    textarea.style.height = newHeight + 'px';
}

/**
 * 发送消息
 */
async function sendMessage() {
    try {
        const input = document.getElementById('message-input');
        if (!input) return;
        
        const text = input.value.trim();
        if (!text) return;
        
        // 清空输入框
        input.value = '';
        
        // 重置输入框高度
        if (typeof autoResizeTextarea === 'function') {
            autoResizeTextarea(input);
        }
        
        // 添加用户消息到界面
        addUserMessage(text);
        
        // 确保API模块已就绪
        if (!window.TravelAI) {
            console.error('TravelAI API 模块未加载');
            addBotMessage('您好！我是旅行规划师小周。我可以帮您规划旅行行程，推荐景点，提供美食和住宿建议。请告诉我您想去哪里旅行，或者您需要什么帮助？');
            return;
        }
        
        if (!window.TravelAI.isInitialized) {
            console.warn('TravelAI API 模块未就绪，使用本地模式');
            window.TravelAI.useOfflineMode = true;
            window.TravelAI.isInitialized = true;
        }
        
        // 处理用户消息
        await processUserMessage(text);
        
    } catch (error) {
        console.error('发送消息失败:', error);
        addBotMessage('抱歉，发送消息时遇到了问题。请再试一次。');
    }
}

/**
 * 处理用户消息
 * @param {string} text - 用户消息文本
 */
async function processUserMessage(text) {
    // 显示正在输入状态
    showTypingIndicator();
    
    // 设置响应超时，5秒后如果仍未收到回复则显示提示
    const responseTimeout = setTimeout(() => {
        if (isTyping) {
            addBotMessage('正在努力思考中，请稍等片刻...');
        }
    }, 5000);
    
    try {
        // 检查是否是旅行计划查询
        if (isTravelPlanQuery(text)) {
            // 隐藏输入指示器
            hideTypingIndicator();
            clearTimeout(responseTimeout);
            
            console.log('检测到旅行计划查询，准备显示表单');
            
            // 先添加文本消息
            addBotMessage('您好！看起来您正在计划一次旅行。为了给您提供更好的建议，请填写以下信息：');
            
            // 创建并显示表单
            const travelForm = createTravelPlanForm();
            console.log('创建的表单对象:', travelForm);
            
            // 确保表单对象是有效的
            if (travelForm && travelForm.type === MessageType.FORM && travelForm.content) {
                setTimeout(() => {
                    addBotMessage(travelForm);
                }, 500);
            } else {
                console.error('表单对象无效:', travelForm);
                addBotMessage('抱歉，创建表单时出现了问题。请直接告诉我您想去哪里旅行，以及您的偏好。');
            }
            return;
        }

        let botResponse;
        
        // 尝试使用API获取回复
        if (window.TravelAI && window.TravelAI.generateItinerary) {
            try {
                // 提取目的地和天数信息
                const destinationMatch = text.match(/去(.+?)(?:旅行|旅游|玩|游玩)/);
                const durationMatch = text.match(/(\d+)\s*天/);
                
                const params = {
                    destination: destinationMatch ? destinationMatch[1] : '未指定目的地',
                    duration: durationMatch ? parseInt(durationMatch[1]) : 3,
                    travelers: 1,
                    budget: '中等',
                    interests: ['文化历史']
                };

                // 记录请求
                console.log('请求参数:', params);
                console.log('是否使用离线模式:', window.TravelAI.useOfflineMode);

                const result = await window.TravelAI.generateItinerary(params);
                console.log('API返回结果:', result);
                
                if (result && result.itinerary) {
                    botResponse = result.itinerary;
                } else {
                    throw new Error('API返回无效结果');
                }
            } catch (error) {
                console.error('API请求失败:', error);
                botResponse = `抱歉，我暂时无法处理您的请求。请稍后再试。错误信息: ${error.message || '未知错误'}`;
            }
        } else {
            console.warn('API模块未加载，使用默认响应');
            botResponse = '您好！我是旅行规划师小周。我可以帮您规划旅行行程，推荐景点，提供美食和住宿建议。请告诉我您想去哪里旅行，或者您需要什么帮助？';
        }
        
        // 隐藏输入状态
        hideTypingIndicator();
        clearTimeout(responseTimeout);
        
        // 添加机器人回复
        addBotMessage(botResponse);
        
        // 生成建议按钮
        updateSuggestionButtons(generateSuggestions(text, botResponse));
        
        // 保存对话历史
        saveConversationHistory();
    } catch (error) {
        console.error('处理消息时出错:', error);
        hideTypingIndicator();
        clearTimeout(responseTimeout);
        
        // 添加错误消息
        const errorMessage = `抱歉，处理您的请求时出现了问题。${error.message || '请稍后再试。'}`;
        addBotMessage(errorMessage);
    }
}

/**
 * 将旅行计划保存为PDF
 * @param {string} planText - 行程计划文本
 */
function saveTravelPlanAsPDF(planText) {
    alert('PDF下载功能即将上线');
    // 这里将来实现PDF生成和下载功能
}

/**
 * 添加用户消息到聊天界面
 * @param {string} text - 用户消息文本
 */
function addUserMessage(text) {
    const messagesContainer = document.querySelector('.chat-messages');
    if (!messagesContainer) return;
    
    // 创建消息容器
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message message-user';
    
    // 创建消息内容
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = text;
    
    // 创建时间戳
    const timestampDiv = document.createElement('div');
    timestampDiv.className = 'message-timestamp';
    timestampDiv.textContent = getCurrentTime();
    
    // 创建消息状态
    const statusDiv = document.createElement('div');
    statusDiv.className = 'message-status delivered';
    statusDiv.innerHTML = '<i class="fas fa-check"></i> 已发送';
    
    // 创建消息操作按钮
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'message-actions';
    actionsDiv.innerHTML = `
        <button class="message-action-btn share-button" title="分享">
            <i class="fas fa-share-alt"></i>
        </button>
        <button class="message-action-btn copy-button" title="复制">
            <i class="fas fa-copy"></i>
        </button>
    `;
    
    // 添加组件到消息
    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(timestampDiv);
    messageDiv.appendChild(statusDiv);
    messageDiv.appendChild(actionsDiv);
    
    // 添加消息到对话
    messagesContainer.appendChild(messageDiv);
    
    // 保存到对话历史
    conversationHistory.push({ role: 'user', content: text });
    
    // 滚动到底部
    scrollToBottom();
    
    // 绑定操作按钮事件
    bindMessageActions(messageDiv);
}

/**
 * 添加机器人消息到聊天界面
 * @param {string|Object} content - 消息内容，可以是字符串或消息对象
 * @param {boolean} isFirstMessage - 是否是首条消息
 * @returns {HTMLElement} 创建的消息元素
 */
function addBotMessage(content, isFirstMessage = false) {
    try {
        console.log('添加机器人消息:', content);
        
        // 创建消息容器
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        
        // 如果消息内容是对象
        if (typeof content === 'object' && content !== null && !(content instanceof HTMLElement)) {
            console.log('处理对象类型消息:', content.type || 'unknown');
            
            if (content.type === MessageType.FORM) {
                renderFormMessage(messageDiv, content.content);
            } else if (content.type === MessageType.CARD) {
                renderCardMessage(messageDiv, content.content);
            } else if (content.type === MessageType.GALLERY) {
                renderGalleryMessage(messageDiv, content.content);
            } else if (content.type === MessageType.ITINERARY) {
                renderItineraryMessage(messageDiv, content.content);
            } else if (content.type === MessageType.IMAGE) {
                const img = document.createElement('img');
                img.src = content.src;
                img.alt = content.alt || '图片';
                img.className = 'message-image';
                messageDiv.appendChild(img);
            } else {
                // 尝试将对象转换为字符串
                const contentStr = typeof content.toString === 'function' ? 
                    content.toString() : JSON.stringify(content);
                renderTextMessage(messageDiv, contentStr);
            }
        } else if (content instanceof HTMLElement) {
            // 如果是HTML元素，直接添加
            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            contentDiv.appendChild(content);
            messageDiv.appendChild(contentDiv);
        } else {
            // 常规文本消息
            renderTextMessage(messageDiv, content);
        }
        
        // 渲染消息
        const chatMessages = document.querySelector('.chat-messages');
        if (chatMessages) {
            if (isFirstMessage) {
                // 如果是第一条消息，添加到最前面（日期分隔线后）
                const firstChild = chatMessages.firstChild;
                if (firstChild && firstChild.className === 'date-separator') {
                    chatMessages.insertBefore(messageDiv, firstChild.nextSibling);
                } else {
                    chatMessages.insertBefore(messageDiv, firstChild);
                }
            } else {
                // 否则添加到最后
                chatMessages.appendChild(messageDiv);
            }
            
            // 绑定消息操作
            bindMessageActions(messageDiv);
            
            // 滚动到底部
            scrollToBottom();
        }
    } catch (error) {
        console.error('添加机器人消息时出错:', error);
        // 发生错误时添加简单文本消息作为备份
        try {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message bot-message';
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            contentDiv.textContent = '抱歉，渲染消息时出现问题。';
            
            messageDiv.appendChild(contentDiv);
            
            const chatMessages = document.querySelector('.chat-messages');
            if (chatMessages) {
                chatMessages.appendChild(messageDiv);
                scrollToBottom();
            }
        } catch (fallbackError) {
            console.error('备份错误处理也失败:', fallbackError);
        }
    }
}

// 辅助函数：渲染文本消息
function renderTextMessage(container, content) {
    console.log('渲染消息，类型: text');
    try {
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        // 检查是否为HTML内容
        if (typeof content === 'string' && (content.trim().startsWith('<') || content.includes('<div') || content.includes('<p'))) {
            console.log('检测到HTML内容，使用innerHTML渲染');
            contentDiv.innerHTML = content;
        } else if (typeof content === 'string') {
            // 普通文本，使用formatMessageContent处理
            contentDiv.innerHTML = formatMessageContent(content);
        } else if (content instanceof HTMLElement) {
            // HTML元素直接附加
            contentDiv.appendChild(content);
        } else {
            // 其他类型转为字符串
            contentDiv.textContent = String(content);
        }
        
        container.appendChild(contentDiv);
    } catch (error) {
        console.error('渲染文本消息时出错:', error);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'message-content error';
        errorDiv.textContent = '抱歉，无法渲染此消息。';
        container.appendChild(errorDiv);
    }
}

/**
 * 渲染表单类型消息
 * @param {HTMLElement} container - 容器元素
 * @param {Object} formData - 表单数据
 */
function renderFormMessage(container, formData) {
    console.log('开始渲染表单:', formData);
    
    try {
        // 验证表单数据格式
        if (!formData || typeof formData !== 'object') {
            throw new Error('表单数据无效');
        }
        
        // 创建表单容器
        const formContainer = document.createElement('div');
        formContainer.className = 'form-message-container';
        
        // 添加表单标题
        if (formData.title) {
            const title = document.createElement('h3');
            title.className = 'form-title';
            title.textContent = formData.title;
            formContainer.appendChild(title);
        }
        
        // 添加表单描述
        if (formData.description) {
            const description = document.createElement('p');
            description.className = 'form-description';
            description.textContent = formData.description;
            formContainer.appendChild(description);
        }
        
        // 创建表单元素
        const form = document.createElement('form');
        form.className = 'interactive-form';
        form.id = `form-${Date.now()}`;
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('表单提交，ID:', formData.id);
            processFormSubmission(this, formData.id);
        });
        
        // 添加表单字段
        if (Array.isArray(formData.fields) && formData.fields.length > 0) {
            formData.fields.forEach((field, index) => {
                const fieldContainer = document.createElement('div');
                fieldContainer.className = 'form-field';
                
                // 检查字段是否有效
                if (!field || !field.name) {
                    console.warn(`跳过无效字段 #${index}:`, field);
                    return;
                }
                
                // 添加标签
                const label = document.createElement('label');
                label.textContent = field.label || field.name;
                label.htmlFor = `field-${field.name}-${Date.now()}`;
                if (field.required) {
                    label.innerHTML += ' <span class="required">*</span>';
                }
                fieldContainer.appendChild(label);
                
                // 根据字段类型创建输入元素
                let input;
                switch (field.type) {
                    case 'select':
                        input = document.createElement('select');
                        input.id = label.htmlFor;
                        if (Array.isArray(field.options)) {
                            field.options.forEach(option => {
                                const optionEl = document.createElement('option');
                                optionEl.value = option.value || option;
                                optionEl.textContent = option.label || option;
                                input.appendChild(optionEl);
                            });
                        } else {
                            console.warn(`字段 "${field.name}" 的选项不是数组:`, field.options);
                        }
                        break;
                    case 'textarea':
                        input = document.createElement('textarea');
                        input.id = label.htmlFor;
                        input.rows = field.rows || 3;
                        break;
                    case 'checkbox':
                        fieldContainer.className += ' checkbox-field';
                        input = document.createElement('input');
                        input.id = label.htmlFor;
                        input.type = 'checkbox';
                        label.insertBefore(input, label.firstChild);
                        break;
                    case 'radio-group':
                        fieldContainer.className += ' radio-group';
                        // 特殊处理旅行兴趣字段，使用复选框而不是单选按钮
                        const isInterestField = field.name === 'interests';
                        
                        if (Array.isArray(field.options)) {
                            const radioGroup = document.createElement('div');
                            radioGroup.className = 'radio-options';
                            
                            field.options.forEach((option, optIndex) => {
                                const radioContainer = document.createElement('label');
                                radioContainer.className = 'radio-option';
                                
                                const radioInput = document.createElement('input');
                                // 对于interests字段使用checkbox，对于其他radio-group使用radio
                                radioInput.type = isInterestField ? 'checkbox' : 'radio';
                                radioInput.id = `${label.htmlFor}-option-${optIndex}`;
                                radioInput.name = field.name;
                                radioInput.value = option.value || option;
                                
                                radioContainer.appendChild(radioInput);
                                radioContainer.appendChild(document.createTextNode(' ' + (option.label || option)));
                                radioGroup.appendChild(radioContainer);
                            });
                            
                            fieldContainer.appendChild(radioGroup);
                            input = null;
                        } else {
                            console.warn(`字段 "${field.name}" 的选项不是数组:`, field.options);
                        }
                        break;
                    default:
                        input = document.createElement('input');
                        input.id = label.htmlFor;
                        input.type = field.type || 'text';
                }
                
                // 设置输入元素属性
                if (input) {
                    input.name = field.name || '';
                    input.placeholder = field.placeholder || '';
                    input.required = !!field.required;
                    if (field.value !== undefined) input.value = field.value;
                    
                    if (field.type !== 'checkbox') {
                        fieldContainer.appendChild(input);
                    }
                }
                
                form.appendChild(fieldContainer);
            });
        } else {
            console.warn('表单字段不是数组或为空:', formData.fields);
            const errorMessage = document.createElement('div');
            errorMessage.className = 'form-error';
            errorMessage.textContent = '表单字段配置有误';
            form.appendChild(errorMessage);
        }
        
        // 添加提交按钮
        const submitButton = document.createElement('button');
        submitButton.type = 'submit';
        submitButton.className = 'form-submit-btn';
        submitButton.textContent = formData.submitText || '提交';
        form.appendChild(submitButton);
        
        formContainer.appendChild(form);
        container.appendChild(formContainer);
        
        console.log('表单渲染完成');
    } catch (error) {
        console.error('渲染表单时出错:', error);
        container.innerHTML = `<div class="error-message">抱歉，表单加载失败。请直接告诉我您的旅行需求。错误详情: ${error.message}</div>`;
    }
}

/**
 * 处理表单提交
 * @param {HTMLFormElement} form - 表单元素
 * @param {string} formId - 表单ID
 */
function processFormSubmission(form, formId) {
    console.log('处理表单提交:', formId);
    
    try {
        const formData = new FormData(form);
        const data = {};
        
        // 收集表单数据
        for (const [key, value] of formData.entries()) {
            // 如果字段是interests，创建一个数组
            if (key === 'interests') {
                if (!data.interests) {
                    data.interests = [];
                }
                data.interests.push(value);
            } else {
                data[key] = value;
            }
            console.log(`表单字段 ${key}:`, value);
        }
        
        // 修复表单数据
        if (formId === 'travel-form') {
            // 手动收集所有选中的checkbox
            if (!data.interests || data.interests.length === 0) {
                const interestCheckboxes = form.querySelectorAll('input[name="interests"]:checked');
                if (interestCheckboxes.length > 0) {
                    data.interests = Array.from(interestCheckboxes).map(cb => cb.value);
                } else {
                    data.interests = ['文化历史']; // 默认兴趣
                }
            }
            
            // 确保interests是数组
            if (typeof data.interests === 'string') {
                data.interests = [data.interests];
            }
            
            console.log('最终兴趣数组:', data.interests);
        }
        
        // 表单验证
        if (formId === 'travel-form') {
            // 验证必填字段
            if (!data.destination || data.destination.trim() === '') {
                alert('请填写目的地');
                return false;
            }
            
            if (!data.startDate) {
                alert('请选择出发日期');
                return false;
            }
            
            if (!data.endDate) {
                alert('请选择结束日期');
                return false;
            }
            
            // 验证日期范围
            const startDate = new Date(data.startDate);
            const endDate = new Date(data.endDate);
            
            if (endDate < startDate) {
                alert('结束日期不能早于开始日期');
                return false;
            }
        }
        
        // 禁用提交按钮，防止重复提交
        const submitButton = form.querySelector('.form-submit-btn');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = '处理中...';
        }
        
        // 确认提交信息
        const formContainer = form.closest('.form-message-container');
        if (formContainer) {
            // 显示提交成功信息
            formContainer.innerHTML = `
                <div class="form-success">
                    <i class="fas fa-check-circle success-icon"></i>
                    <h3>信息已提交</h3>
                    <p>正在为您生成回复...</p>
                </div>
            `;
        }
        
        // 处理不同类型的表单
        if (formId === 'travel-form') {
            console.log('处理旅行规划表单:', data);
            console.log('interests类型:', typeof data.interests, '值:', data.interests);
            
            // 处理旅行规划表单
            if (typeof generateTravelPlan === 'function') {
                generateTravelPlan(data);
            } else {
                console.error('generateTravelPlan函数未定义');
                
                // 尝试使用全局函数
                if (window.ChatModule && typeof window.ChatModule.generateTravelPlan === 'function') {
                    window.ChatModule.generateTravelPlan(data);
                } else if (window.generateTravelPlan) {
                    window.generateTravelPlan(data);
                } else {
                    alert('系统正在初始化，请稍后再试');
                    // 恢复表单
                    if (formContainer) {
                        formContainer.innerHTML = '表单处理失败，请稍后再试';
                    }
                }
            }
        } else {
            // 处理通用表单，将表单数据作为用户消息发送
            const message = `表单信息: ${JSON.stringify(data)}`;
            console.log('发送表单数据作为消息');
            processUserMessage(message);
        }
        
        return true;
    } catch (error) {
        console.error('处理表单提交时出错:', error);
        alert(`提交表单时遇到错误: ${error.message}`);
        return false;
    }
}

/**
 * 渲染行程消息
 * @param {HTMLElement} container - 容器元素
 * @param {string} content - 行程内容
 */
function renderItineraryMessage(container, content) {
    // 格式化行程内容
    const formattedItinerary = formatItinerary(content);
    container.innerHTML = formattedItinerary;
}

/**
 * 渲染卡片消息
 * @param {HTMLElement} container - 容器元素
 * @param {Object} cardData - 卡片数据
 */
function renderCardMessage(container, cardData) {
    const cardContainer = document.createElement('div');
    cardContainer.className = 'card-container';
    
    // 卡片图片
    if (cardData.image) {
        const cardImageContainer = document.createElement('div');
        cardImageContainer.className = 'card-image-container';
        
        const cardImage = document.createElement('img');
        cardImage.src = cardData.image;
        cardImage.alt = cardData.title || '卡片图片';
        cardImage.className = 'card-image';
        
        cardImageContainer.appendChild(cardImage);
        cardContainer.appendChild(cardImageContainer);
    }
    
    // 卡片内容区域
    const cardContent = document.createElement('div');
    cardContent.className = 'card-content';
    
    // 卡片标题
    if (cardData.title) {
        const cardTitle = document.createElement('h3');
        cardTitle.className = 'card-title';
        cardTitle.textContent = cardData.title;
        cardContent.appendChild(cardTitle);
    }
    
    // 卡片副标题
    if (cardData.subtitle) {
        const cardSubtitle = document.createElement('div');
        cardSubtitle.className = 'card-subtitle';
        cardSubtitle.textContent = cardData.subtitle;
        cardContent.appendChild(cardSubtitle);
    }
    
    // 卡片描述
    if (cardData.description) {
        const cardDescription = document.createElement('p');
        cardDescription.className = 'card-description';
        cardDescription.textContent = cardData.description;
        cardContent.appendChild(cardDescription);
    }
    
    // 卡片按钮
    if (Array.isArray(cardData.buttons) && cardData.buttons.length > 0) {
        const cardActions = document.createElement('div');
        cardActions.className = 'card-actions';
        
        cardData.buttons.forEach(button => {
            const cardButton = document.createElement('button');
            cardButton.textContent = button.text || '';
            cardButton.className = `card-button ${button.type || 'primary'}`;
            
            // 添加点击事件
            cardButton.addEventListener('click', () => {
                if (typeof button.action === 'function') {
                    button.action();
                } else if (button.url) {
                    window.open(button.url, '_blank');
                }
            });
            
            cardActions.appendChild(cardButton);
        });
        
        cardContent.appendChild(cardActions);
    }
    
    cardContainer.appendChild(cardContent);
    container.appendChild(cardContainer);
}

/**
 * 渲染图片/卡片画廊消息
 * @param {HTMLElement} container - 容器元素
 * @param {Object[]} galleryItems - 画廊项目数组
 */
function renderGalleryMessage(container, galleryItems) {
    if (!Array.isArray(galleryItems) || galleryItems.length === 0) {
        container.innerHTML = '<p>无可显示的图片</p>';
        return;
    }
    
    const galleryContainer = document.createElement('div');
    galleryContainer.className = 'gallery-container';
    
    // 创建画廊导航
    const galleryNav = document.createElement('div');
    galleryNav.className = 'gallery-nav';
    
    // 创建左箭头
    const leftArrow = document.createElement('button');
    leftArrow.className = 'gallery-arrow gallery-arrow-left';
    leftArrow.innerHTML = '<i class="fas fa-chevron-left"></i>';
    leftArrow.addEventListener('click', () => navigateGallery(galleryContainer, 'prev'));
    
    // 创建右箭头
    const rightArrow = document.createElement('button');
    rightArrow.className = 'gallery-arrow gallery-arrow-right';
    rightArrow.innerHTML = '<i class="fas fa-chevron-right"></i>';
    rightArrow.addEventListener('click', () => navigateGallery(galleryContainer, 'next'));
    
    // 创建图片/卡片容器
    const itemsContainer = document.createElement('div');
    itemsContainer.className = 'gallery-items';
    
    // 添加画廊项目
    galleryItems.forEach((item, index) => {
        const itemElement = document.createElement('div');
        itemElement.className = 'gallery-item';
        itemElement.dataset.index = index;
        
        if (index === 0) {
            itemElement.classList.add('active');
        }
        
        // 添加图片
        if (item.image) {
            const img = document.createElement('img');
            img.src = item.image;
            img.alt = item.title || `画廊图片 ${index + 1}`;
            img.className = 'gallery-image';
            itemElement.appendChild(img);
        }
        
        // 添加内容
        const content = document.createElement('div');
        content.className = 'gallery-item-content';
        
        if (item.title) {
            const title = document.createElement('h3');
            title.className = 'gallery-item-title';
            title.textContent = item.title;
            content.appendChild(title);
        }
        
        if (item.description) {
            const description = document.createElement('p');
            description.className = 'gallery-item-description';
            description.textContent = item.description;
            content.appendChild(description);
        }
        
        itemElement.appendChild(content);
        itemsContainer.appendChild(itemElement);
    });
    
    // 添加指示器
    const indicators = document.createElement('div');
    indicators.className = 'gallery-indicators';
    
    galleryItems.forEach((_, index) => {
        const indicator = document.createElement('span');
        indicator.className = 'gallery-indicator';
        indicator.dataset.index = index;
        
        if (index === 0) {
            indicator.classList.add('active');
        }
        
        indicator.addEventListener('click', () => {
            // 激活对应的项目
            const items = itemsContainer.querySelectorAll('.gallery-item');
            const currentActive = itemsContainer.querySelector('.gallery-item.active');
            if (currentActive) {
                currentActive.classList.remove('active');
            }
            
            const targetItem = items[index];
            if (targetItem) {
                targetItem.classList.add('active');
            }
            
            // 更新指示器状态
            const indicatorElements = indicators.querySelectorAll('.gallery-indicator');
            indicatorElements.forEach(el => el.classList.remove('active'));
            indicator.classList.add('active');
        });
        
        indicators.appendChild(indicator);
    });
    
    // 将所有元素添加到画廊容器
    galleryNav.appendChild(leftArrow);
    galleryNav.appendChild(rightArrow);
    galleryContainer.appendChild(galleryNav);
    galleryContainer.appendChild(itemsContainer);
    galleryContainer.appendChild(indicators);
    
    container.appendChild(galleryContainer);
}

/**
 * 导航画廊
 * @param {HTMLElement} galleryContainer - 画廊容器
 * @param {string} direction - 导航方向 ('prev' 或 'next')
 */
function navigateGallery(galleryContainer, direction) {
    const items = galleryContainer.querySelectorAll('.gallery-item');
    const indicators = galleryContainer.querySelectorAll('.gallery-indicator');
    const currentActive = galleryContainer.querySelector('.gallery-item.active');
    
    if (!currentActive) return;
    
    const currentIndex = parseInt(currentActive.dataset.index);
    let newIndex;
    
    if (direction === 'prev') {
        newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
    } else {
        newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
    }
    
    // 激活新项目
    currentActive.classList.remove('active');
    items[newIndex].classList.add('active');
    
    // 更新指示器
    indicators.forEach(indicator => {
        indicator.classList.remove('active');
        if (parseInt(indicator.dataset.index) === newIndex) {
            indicator.classList.add('active');
        }
    });
}

/**
 * 格式化消息内容，处理Markdown和特殊格式
 * @param {string} text - 原始文本
 * @returns {string} - 格式化后的HTML
 */
function formatMessageContent(text) {
    // 首先识别是否是旅行行程内容
    const isItinerary = /第.*天|行程安排|旅行计划|行程规划|旅游攻略/.test(text);
    
    // 首先使用marked库进行Markdown转换（如果可用）
    if (window.marked) {
        try {
            // 设置marked选项
            marked.setOptions({
                breaks: true,         // 支持GitHub风格的换行
                gfm: true,            // 启用GitHub风格的Markdown
                headerIds: true,      // 为标题生成ID
                smartLists: true,     // 使用更智能的列表行为
                smartypants: true     // 使用更智能的标点符号
            });
            
            // 转换Markdown为HTML
            let html = marked.parse(text);
            
            // 添加额外的样式和类
            html = html.replace(/<table>/g, '<table class="ai-table' + (isItinerary ? ' itinerary-table' : '') + '">');
            html = html.replace(/<ul>/g, '<ul class="ai-list">');
            html = html.replace(/<ol>/g, '<ol class="ai-list">');
            html = html.replace(/<h([1-6])>/g, '<h$1 class="ai-heading ai-heading-$1">');
            html = html.replace(/<blockquote>/g, '<blockquote class="ai-blockquote">');
            html = html.replace(/<code>/g, '<code class="ai-code">');
            html = html.replace(/<pre>/g, '<pre class="ai-pre">');
            
            // 让链接在新标签中打开
            html = html.replace(/<a /g, '<a target="_blank" rel="noopener noreferrer" ');
            
            // 为行程内容添加特殊处理
            if (isItinerary) {
                // 为"第X天"添加特殊样式
                html = html.replace(/<h2>第(\d+)天/g, '<div class="day-separator">第$1天');
                html = html.replace(/第(\d+)天<\/h2>/g, '第$1天</div>');
                
                // 增强表格中的时间列
                html = html.replace(/<td>(上午|下午|晚上|早上|中午|清晨|傍晚|[\d:：]+\s*[-~～至到]\s*[\d:：]+|[\d:：]+)/g, 
                                  '<td class="time-cell">$1');
                
                // 识别地点和活动
                html = html.replace(/<td>([^<:：]+)[:：]([^<]+)/g, function(match, location, activity) {
                    return `<td><span class="location">${location}：</span>${activity}`;
                });
            }
            
            return html;
        } catch (e) {
            console.error('Markdown解析失败，回退到基本格式化', e);
            // 如果marked解析失败，回退到基本格式化
        }
    }
    
    // 基本格式化（不依赖marked库）
    
    // 替换URL为链接
    text = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // 如果是行程规划内容，使用特殊格式化
    if (isItinerary) {
        return formatItinerary(text);
    }
    
    // 处理标题
    text = text.replace(/^# (.*?)$/gm, '<h1 class="ai-heading ai-heading-1">$1</h1>');
    text = text.replace(/^## (.*?)$/gm, '<h2 class="ai-heading ai-heading-2">$1</h2>');
    text = text.replace(/^### (.*?)$/gm, '<h3 class="ai-heading ai-heading-3">$1</h3>');
    
    // 处理粗体和斜体
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // 处理段落
    const paragraphs = text.split(/\n\s*\n/);
    text = paragraphs.map(p => {
        // 跳过已经是HTML标签的内容
        if (p.trim().startsWith('<') && p.trim().endsWith('>')) {
            return p;
        }
        // 处理列表
        if (p.trim().match(/^-\s/m) || p.trim().match(/^\d+\.\s/m)) {
            return p;
        }
        // 其他内容包装为段落
        return `<p>${p.trim()}</p>`;
    }).join('\n\n');
    
    // 处理无序列表
    let inList = false;
    const lines = text.split('\n');
    let result = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // 检测无序列表项
        if (line.trim().match(/^-\s/)) {
            if (!inList) {
                result.push('<ul class="ai-list">');
                inList = true;
            }
            const content = line.trim().replace(/^-\s/, '');
            result.push(`<li>${content}</li>`);
        } 
        // 检测有序列表项
        else if (line.trim().match(/^\d+\.\s/)) {
            if (!inList || inList === 'ul') {
                if (inList) result.push('</ul>');
                result.push('<ol class="ai-list">');
                inList = 'ol';
            }
            const content = line.trim().replace(/^\d+\.\s/, '');
            result.push(`<li>${content}</li>`);
        }
        // 非列表项
        else {
            if (inList === 'ul') {
                result.push('</ul>');
                inList = false;
            } else if (inList === 'ol') {
                result.push('</ol>');
                inList = false;
            }
            result.push(line);
        }
    }
    
    // 结束最后的列表
    if (inList === 'ul') {
        result.push('</ul>');
    } else if (inList === 'ol') {
        result.push('</ol>');
    }
    
    return result.join('\n');
}

/**
 * 特殊格式化行程内容
 * @param {string} text - 原始行程文本
 * @returns {string} - 格式化后的HTML
 */
function formatItinerary(text) {
    console.log('开始格式化行程:', typeof text);
    
    // 检查输入是否是字符串
    if (typeof text !== 'string') {
        console.error('formatItinerary: 输入不是字符串类型', text);
        return '<div class="error-formatting"><p>抱歉，行程格式不正确</p></div>';
    }
    
    if (text.trim() === '') {
        console.warn('行程文本为空字符串');
        return '<div class="error-formatting"><p>抱歉，未能生成有效的行程内容</p></div>';
    }
    
    try {
        // 检测是否为行程格式
        const isDayFormat = /第\d+天|行程安排|旅游攻略|旅行计划|详细行程|行程概览|深度之旅/.test(text);
        if (!isDayFormat) {
            console.log('非行程格式，使用普通markdown格式化');
            return formatRegularMarkdown(text);
        }
        
        console.log('检测到行程格式，开始专门格式化');
        
        // 输出完整原始文本用于调试
        console.log('原始行程内容:', text);
        
        // 标准化文本：统一换行符
        const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        
        // 为行程创建容器
        let html = '<div class="itinerary-container">';
        
        // 行程标题
        const titleMatch = normalizedText.match(/^#\s*(.*?)(?=\n|$)/m) || normalizedText.match(/^(.*?)(?=\n|$)/m);
        if (titleMatch) {
            html += `<h2 class="itinerary-title">${titleMatch[1]}</h2>`;
        } else {
            html += `<h2 class="itinerary-title">行程规划</h2>`;
        }
        
        // 提取行程概览
        const overviewMatch = normalizedText.match(/(?:^|\n)##\s*行程概览[\s\S]*?(?=\n##|$)/) || 
                              normalizedText.match(/(?:^|\n)行程概览[\s\S]*?(?=\n##|$)/);
        if (overviewMatch) {
            let overviewContent = overviewMatch[0];
            overviewContent = overviewContent.replace(/^##\s*行程概览\s*/, '').replace(/^行程概览\s*/, '');
            
            html += '<div class="itinerary-overview">';
            html += '<h3 class="section-title">行程概览</h3>';
            
            // 处理概览中的列表项
            if (overviewContent.includes('-') || overviewContent.includes('•') || overviewContent.includes('**')) {
                html += '<ul class="overview-list">';
                
                // 匹配带有粗体标记的项目或常规列表项
                const listItems = overviewContent.match(/[-•]\s*(.*?)(?=\n[-•]|\n\n|$)/g) || 
                                 overviewContent.match(/\*\*(.*?)\*\*[:：]?\s*(.*?)(?=\n|$)/gm) || [];
                
                if (listItems.length > 0) {
                    listItems.forEach(item => {
                        // 检查是否是粗体格式的项目
                        const boldMatch = item.match(/\*\*(.*?)\*\*[:：]?\s*(.*)/);
                        if (boldMatch) {
                            html += `<li><strong>${boldMatch[1]}</strong>: ${boldMatch[2]}</li>`;
                        } else {
                            const cleanItem = item.replace(/^[-•]\s*/, '').trim();
                            // 检查项目是否有冒号分隔的键值对
                            const keyValueMatch = cleanItem.match(/(.*?)[:：]\s*(.*)/);
                            if (keyValueMatch) {
                                html += `<li><strong>${keyValueMatch[1]}</strong>: ${keyValueMatch[2]}</li>`;
                            } else {
                                html += `<li>${cleanItem}</li>`;
                            }
                        }
                    });
                } else {
                    // 如果没有找到列表项，尝试匹配键值对格式的行
                    const lines = overviewContent.trim().split('\n');
                    lines.forEach(line => {
                        const keyValueMatch = line.match(/(.*?)[:：]\s*(.*)/);
                        if (keyValueMatch && keyValueMatch[1] && keyValueMatch[2]) {
                            html += `<li><strong>${keyValueMatch[1]}</strong>: ${keyValueMatch[2]}</li>`;
                        } else if (line.trim()) {
                            html += `<li>${line.trim()}</li>`;
                        }
                    });
                }
                
                html += '</ul>';
            } else {
                // 如果没有列表，按段落处理
                const paragraphs = overviewContent.trim().split(/\n\s*\n/);
                paragraphs.forEach(p => {
                    html += `<p>${p.trim()}</p>`;
                });
            }
            
            html += '</div>';
        }
        
        // 添加标签页结构
        html += '<div class="itinerary-tabs">';
        html += '<div class="tabs-nav">';
        html += '<button class="tab-btn active" data-tab="daily">详细行程</button>';
        html += '<button class="tab-btn" data-tab="accommodations">住宿推荐</button>';
        html += '<button class="tab-btn" data-tab="food">美食推荐</button>';
        html += '<button class="tab-btn" data-tab="tips">旅行贴士</button>';
        html += '</div>';
        html += '<div class="tabs-content">';
        
        // 添加详细行程标签页
        html += '<div class="tab-pane active" id="tab-daily">';
        
        // 提取详细行程 - 改进的方法
        console.log('开始提取详细行程...');
        
        // 检查文本中是否包含关键天数关键词
        const dayKeywords = [];
        for (let i = 1; i <= 10; i++) {
            if (normalizedText.includes(`第${i}天`)) {
                dayKeywords.push(`第${i}天`);
            }
        }
        console.log('文本中包含以下天数关键词:', dayKeywords);
        
        // 首先尝试从 "## 详细行程" 部分提取内容
        let dailyContent = '';
        const detailedSectionMatch = normalizedText.match(/##\s*详细行程[\s\S]*?(?=\n##(?!\s*第)|$)/);
        
        if (detailedSectionMatch) {
            dailyContent = detailedSectionMatch[0];
            console.log('找到详细行程部分，长度:', dailyContent.length);
            console.log('详细行程部分开头:', dailyContent.substring(0, 100).replace(/\n/g, '\\n'));
        } else {
            // 如果没有找到 "## 详细行程" 部分，尝试直接查找天数标记
            console.log('未找到详细行程标记，尝试直接查找天数部分');
            dailyContent = normalizedText;
        }
        
        // 使用简化的正则表达式匹配每一天
        const dayMatches = [];
        
        // 先尝试 ### 第X天 格式 (三级标题)
        const dayPattern1 = /###\s*第\d+天[^#]*?(?=###\s*第\d+天|##\s*[^#第]|$)/gs;
        const days1 = [...dailyContent.matchAll(dayPattern1)];
        
        if (days1.length > 0) {
            console.log('匹配到 ### 第X天 格式天数:', days1.length);
            days1.forEach(match => dayMatches.push(match[0]));
        } else {
            // 如果没找到，尝试 ## 第X天 格式 (二级标题)
            const dayPattern2 = /##\s*第\d+天[^#]*?(?=##\s*第\d+天|##\s*[^#第]|$)/gs;
            const days2 = [...dailyContent.matchAll(dayPattern2)];
            
            if (days2.length > 0) {
                console.log('匹配到 ## 第X天 格式天数:', days2.length);
                days2.forEach(match => dayMatches.push(match[0]));
            } else {
                // 最后尝试不带#的 第X天 格式
                const dayPattern3 = /(?:^|\n)第\d+天.*?(?=\n第\d+天|\n##|$)/gs;
                const days3 = [...dailyContent.matchAll(dayPattern3)];
                
                if (days3.length > 0) {
                    console.log('匹配到 第X天 格式天数:', days3.length);
                    days3.forEach(match => dayMatches.push(match[0]));
                }
            }
        }
        
        console.log('总共匹配到天数:', dayMatches.length);
        
        // 如果依然没有匹配到天数，尝试基于关键词手动分割文本
        if (dayMatches.length === 0 && dayKeywords.length > 0) {
            console.log('使用关键词手动分割文本...');
            
            // 按关键词位置分割文本
            const textParts = [];
            let startPos = 0;
            
            for (let i = 1; i <= dayKeywords.length; i++) {
                const keyword = `第${i}天`;
                const pos = normalizedText.indexOf(keyword, startPos);
                
                if (pos !== -1) {
                    if (i > 1) {
                        textParts.push(normalizedText.substring(startPos, pos));
                    }
                    startPos = pos;
                }
            }
            
            // 添加最后一部分
            if (startPos < normalizedText.length) {
                textParts.push(normalizedText.substring(startPos));
            }
            
            console.log('手动分割得到内容块数:', textParts.length);
            
            // 过滤出包含天数关键词的部分
            for (const part of textParts) {
                for (const keyword of dayKeywords) {
                    if (part.includes(keyword)) {
                        dayMatches.push(part);
                        break;
                    }
                }
            }
            
            console.log('手动分割后匹配到天数:', dayMatches.length);
        }
        
        if (dayMatches.length > 0) {
            // 添加日期导航
            html += '<div class="daily-nav">';
            dayMatches.forEach((_, index) => {
                html += `<button class="day-nav-btn${index === 0 ? ' active' : ''}" data-day="${index + 1}">第${index + 1}天</button>`;
            });
            html += '</div><div class="daily-content">';
            
            // 处理每天的内容
            dayMatches.forEach((dayContent, dayIndex) => {
                console.log(`处理第${dayIndex + 1}天的内容，长度:`, dayContent.length);
                console.log(`第${dayIndex + 1}天内容预览:`, dayContent.substring(0, 50).replace(/\n/g, '\\n'));
                
                html += `<div class="day-detail${dayIndex === 0 ? ' active' : ''}" data-day="${dayIndex + 1}">
                    <div class="day-header">
                        <h3>第${dayIndex + 1}天</h3>
                        <button class="toggle-day-details" aria-expanded="true">
                            <i class="fas fa-chevron-up"></i>
                        </button>
                    </div>
                    <div class="day-content-wrapper">`;
                
                // 提取上午、下午、晚上时间段
                const periods = ['上午', '下午', '晚上'];
                periods.forEach(period => {
                    // 尝试多种格式匹配
                    let periodContent = '';
                    
                    // 检查文本中是否包含该时间段
                    const hasPeriod = dayContent.includes(period);
                    console.log(`- 检查第${dayIndex + 1}天是否包含${period}:`, hasPeriod);
                    
                    // 格式1: **上午(9:00-12:00)**: 参观东京国立博物馆
                    const pattern1 = new RegExp(`\\*\\*${period}[^\\*]*\\*\\*[:：]\\s*([\\s\\S]*?)(?=\\*\\*|###|##|第\\d+天|$)`, 'i');
                    const match1 = dayContent.match(pattern1);
                    
                    if (match1 && match1[1]) {
                        periodContent = match1[1].trim();
                        console.log(`- 匹配到${period}(格式1)，内容长度:`, periodContent.length);
                    }
                    
                    // 格式2: - **上午(9:00-12:00)**: 参观东京国立博物馆
                    if (!periodContent) {
                        const pattern2 = new RegExp(`[-•]\\s*\\*\\*${period}[^\\*]*\\*\\*[:：]\\s*([\\s\\S]*?)(?=\\n\\s*[-•]|###|##|第\\d+天|$)`, 'i');
                        const match2 = dayContent.match(pattern2);
                        
                        if (match2 && match2[1]) {
                            periodContent = match2[1].trim();
                            console.log(`- 匹配到${period}(格式2)，内容长度:`, periodContent.length);
                        }
                    }
                    
                    // 格式3: 上午: 参观东京国立博物馆
                    if (!periodContent) {
                        const pattern3 = new RegExp(`${period}[:：]\\s*([\\s\\S]*?)(?=\\n\\s*${periods.join('|')}|###|##|第\\d+天|$)`, 'i');
                        const match3 = dayContent.match(pattern3);
                        
                        if (match3 && match3[1]) {
                            periodContent = match3[1].trim();
                            console.log(`- 匹配到${period}(格式3)，内容长度:`, periodContent.length);
                        }
                    }
                    
                    // 如果前面的方法都失败，尝试查找包含该时间段的整个段落
                    if (!periodContent && hasPeriod) {
                        const lines = dayContent.split('\n');
                        for (let i = 0; i < lines.length; i++) {
                            if (lines[i].includes(period)) {
                                let content = lines[i];
                                // 向下收集更多内容，直到遇到下一个时间段或天数
                                for (let j = i + 1; j < lines.length; j++) {
                                    if (periods.some(p => lines[j].includes(p)) || 
                                        lines[j].includes('第') && lines[j].includes('天') ||
                                        lines[j].startsWith('##')) {
                                        break;
                                    }
                                    content += '\n' + lines[j];
                                }
                                periodContent = content.trim();
                                console.log(`- 匹配到${period}(段落查找)，内容长度:`, periodContent.length);
                                break;
                            }
                        }
                    }
                    
                    html += `<div class="time-period">
                        <div class="period-header">
                            <span class="period-name">${period}</span>
                            <button class="toggle-period-details" aria-expanded="true">
                                <i class="fas fa-chevron-up"></i>
                            </button>
                        </div>
                        <div class="period-details">`;
                    
                    if (periodContent) {
                        // 提取列表项
                        if (periodContent.includes('-') || periodContent.includes('*') || periodContent.includes('•')) {
                            const items = periodContent.split(/\n\s*[-•*]\s*/).filter(Boolean);
                            
                            if (items.length > 0) {
                                html += '<ul class="period-items">';
                                items.forEach(item => {
                                    const cleanItem = item.trim()
                                        .replace(/^\*\*|\*\*$/g, '')  // 移除首尾的星号
                                        .replace(/\n\s*/g, '<br>');   // 保留换行格式
                                    
                                    if (cleanItem) {
                                        html += `<li>${cleanItem}</li>`;
                                    }
                                });
                                html += '</ul>';
                            } else {
                                html += `<p>${periodContent}</p>`;
                            }
                        } else {
                            html += `<p>${periodContent}</p>`;
                        }
                    } else {
                        html += `<p class="no-content">暂无${period}行程安排</p>`;
                    }
                    
                    html += `</div></div>`;
                });
                
                // 添加当日交通和美食信息
                const transportMatch = dayContent.match(/今日交通[:：]\s*(.+?)(?=\n|$)/im);
                const foodMatch = dayContent.match(/今日美食推荐[:：]\s*(.+?)(?=\n|$)/im);
                
                if (transportMatch || foodMatch) {
                    html += '<div class="day-info-footer">';
                    if (transportMatch) {
                        html += `<div class="transport-info">
                            <i class="fas fa-bus"></i>
                            <strong>交通:</strong> ${transportMatch[1].trim()}
                        </div>`;
                    }
                    if (foodMatch) {
                        html += `<div class="food-info">
                            <i class="fas fa-utensils"></i>
                            <strong>美食:</strong> ${foodMatch[1].trim()}
                        </div>`;
                    }
                    html += '</div>';
                }
                
                html += '</div></div>';
            });
            
            html += '</div>';
        } else {
            console.warn('未找到每日行程详情');
            html += '<div class="no-daily-content">暂无详细行程信息</div>';
        }
        html += '</div>';
        
        // ... 其余代码保持不变（提取住宿、美食、贴士等信息）...
        // 提取住宿推荐
        const accommodationMatch = normalizedText.match(/##\s*住宿推荐[\s\S]*?(?=\n##|$)/);
        const accommodationContent = accommodationMatch ? accommodationMatch[0] : '';
        
        // 添加住宿推荐标签页
        html += '<div class="tab-pane" id="tab-accommodations">';
        html += '<div class="accommodations-content">';
        html += '<h3 class="section-title">住宿推荐</h3>';
        html += '<div class="acc-list">';
        
        if (accommodationContent) {
            const accItems = accommodationContent.match(/[-•]\s*(.*?)(?=\n[-•]|\n\n|$)/g) || [];
            accItems.forEach(item => {
                html += `<div class="acc-item">${item.replace(/^[-•]\s*/, '')}</div>`;
            });
        }
        
        html += '</div></div></div>';
        
        // 提取美食推荐
        const foodMatch = normalizedText.match(/##\s*美食推荐[\s\S]*?(?=\n##|$)/);
        const foodContent = foodMatch ? foodMatch[0] : '';
        
        // 添加美食推荐标签页
        html += '<div class="tab-pane" id="tab-food">';
        html += '<div class="food-content">';
        html += '<h3 class="section-title">美食推荐</h3>';
        html += '<div class="food-list">';
        
        if (foodContent) {
            const foodItems = foodContent.match(/[-•]\s*(.*?)(?=\n[-•]|\n\n|$)/g) || [];
            foodItems.forEach(item => {
                html += `<div class="food-item">${item.replace(/^[-•]\s*/, '')}</div>`;
            });
        }
        
        html += '</div></div></div>';
        
        // 提取旅行小贴士
        const tipsMatch = normalizedText.match(/##\s*旅行小贴士[\s\S]*?(?=\n##|$)/);
        const tipsContent = tipsMatch ? tipsMatch[0] : '';
        
        // 添加旅行贴士标签页
        html += '<div class="tab-pane" id="tab-tips">';
        html += '<div class="tips-content">';
        html += '<h3 class="section-title">旅行贴士</h3>';
        html += '<div class="tips-list">';
        
        if (tipsContent) {
            const tipItems = tipsContent.match(/[-•]\s*(.*?)(?=\n[-•]|\n\n|$)/g) || [];
            tipItems.forEach(item => {
                html += `<div class="tip-item">${item.replace(/^[-•]\s*/, '')}</div>`;
            });
        }
        
        html += '</div></div></div>';
        
        // 关闭标签页结构
        html += '</div></div>';
        
        // 标签页和折叠功能的JavaScript
        html += `<script>
            document.addEventListener('DOMContentLoaded', function() {
                // 标签页切换
                const tabBtns = document.querySelectorAll('.tab-btn');
                tabBtns.forEach(btn => {
                    btn.addEventListener('click', function() {
                        // 移除所有active类
                        tabBtns.forEach(b => b.classList.remove('active'));
                        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
                        
                        // 设置当前标签为active
                        this.classList.add('active');
                        const tabId = this.getAttribute('data-tab');
                        document.getElementById('tab-' + tabId).classList.add('active');
                    });
                });
                
                // 日期导航
                const dayBtns = document.querySelectorAll('.day-nav-btn');
                dayBtns.forEach(btn => {
                    btn.addEventListener('click', function() {
                        dayBtns.forEach(b => b.classList.remove('active'));
                        document.querySelectorAll('.day-detail').forEach(d => d.classList.remove('active'));
                        
                        this.classList.add('active');
                        const dayNum = this.getAttribute('data-day');
                        document.querySelector('.day-detail[data-day="' + dayNum + '"]').classList.add('active');
                    });
                });
                
                // 折叠/展开功能
                document.querySelectorAll('.toggle-day-details, .toggle-period-details').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const expanded = this.getAttribute('aria-expanded') === 'true';
                        this.setAttribute('aria-expanded', !expanded);
                        
                        const icon = this.querySelector('i');
                        if (expanded) {
                            icon.classList.remove('fa-chevron-up');
                            icon.classList.add('fa-chevron-down');
                        } else {
                            icon.classList.remove('fa-chevron-down');
                            icon.classList.add('fa-chevron-up');
                        }
                        
                        // 找到对应的内容元素并切换显示状态
                        const parent = this.closest('.day-header, .period-header');
                        if (parent.classList.contains('day-header')) {
                            const content = parent.nextElementSibling;
                            content.style.display = expanded ? 'none' : 'block';
                        } else {
                            const details = parent.nextElementSibling;
                            details.style.display = expanded ? 'none' : 'block';
                        }
                    });
                });
            });
        </script>`;
        
        html += '</div>'; // 结束 itinerary-container
        
        console.log('行程格式化完成，HTML长度:', html.length);
        return html;
    } catch (error) {
        console.error('格式化行程时出错:', error);
        // 出错时返回原始文本的安全版本和错误信息
        return `<div class="error-formatting">
            <p>格式化内容时出错: ${error.message}</p>
            <pre>${text.toString().replace(/</g, '&lt;').replace(/>/g, '&gt;').substring(0, 1000)}...</pre>
        </div>`;
    }
}

// 提取活动信息（主要内容、描述、地址和提示）
function extractActivityInfo(text) {
    const result = {
        main: '',
        desc: '',
        address: '',
        tips: ''
    };
    
    if (!text) return result;
    
    // 检查是否有分隔符（点、逗号等）
    const sections = text.split(/。|\n/);
    
    if (sections.length > 0) {
        // 第一部分作为主要内容
        result.main = sections[0].trim();
        
        // 检查剩余部分是否包含地址或提示信息
        for (let i = 1; i < sections.length; i++) {
            const section = sections[i].trim();
            if (!section) continue;
            
            if (section.includes('地址') || section.includes('位于') || section.match(/在.*区/)) {
                result.address = section;
            } else if (section.includes('建议') || section.includes('提示') || 
                     section.includes('注意') || section.includes('推荐')) {
                result.tips = section;
            } else {
                // 如果没有明确分类，添加到描述
                result.desc += (result.desc ? ' ' : '') + section;
            }
        }
    } else {
        // 如果没有分隔符，整个文本作为主要内容
        result.main = text.trim();
    }
    
    return result;
}

// 格式化高亮内容
function formatHighlightContent(text) {
    // 替换markdown粗体为HTML粗体
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // 替换markdown斜体为HTML斜体
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    return formatted;
}

/**
 * 绑定消息操作按钮事件
 * @param {HTMLElement} messageDiv - 消息DIV元素
 */
function bindMessageActions(messageDiv) {
    // 分享按钮
    const shareButton = messageDiv.querySelector('.share-button');
    if (shareButton) {
        shareButton.addEventListener('click', function() {
            const shareModal = document.getElementById('share-modal');
            if (shareModal) {
                shareModal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            }
        });
    }
    
    // 复制按钮
    const copyButton = messageDiv.querySelector('.copy-button');
    if (copyButton) {
        copyButton.addEventListener('click', function() {
            const content = messageDiv.querySelector('.message-content').textContent;
            navigator.clipboard.writeText(content)
                .then(() => {
                    // 显示复制成功提示
                    const originalTitle = copyButton.title;
                    copyButton.title = '已复制';
                    copyButton.innerHTML = '<i class="fas fa-check"></i>';
                    setTimeout(() => {
                        copyButton.title = originalTitle;
                        copyButton.innerHTML = '<i class="fas fa-copy"></i>';
                    }, 2000);
                })
                .catch(err => {
                    console.error('复制失败:', err);
                });
        });
    }
}

/**
 * 获取当前时间字符串
 * @returns {string} - 格式化的时间字符串 (HH:MM)
 */
function getCurrentTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

/**
 * 滚动聊天区域到底部
 */
function scrollToBottom() {
    const messagesContainer = document.querySelector('.chat-messages');
    if (messagesContainer) {
        setTimeout(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 100);
    }
}

/**
 * 显示"正在输入"状态
 */
function showTypingIndicator() {
    // 如果已经显示了，则不再添加
    if (document.getElementById('typing-indicator')) {
        return;
    }
    
    const typingIndicator = document.createElement('div');
    typingIndicator.id = 'typing-indicator';
    typingIndicator.className = 'message bot-message';
    
    typingIndicator.innerHTML = `
        <div class="message-content">
            <div class="typing-content">
                <span class="typing-text">小舟正在思考中</span>
                <div class="typing-dots">
                    <span class="dot dot-1"></span>
                    <span class="dot dot-2"></span>
                    <span class="dot dot-3"></span>
                </div>
            </div>
        </div>
        <div class="message-timestamp">${getCurrentTime()}</div>
        <div class="message-status">
            <i class="fas fa-spinner fa-spin"></i> 思考中
        </div>
    `;
    
    const messagesContainer = document.querySelector('.chat-messages');
    messagesContainer.appendChild(typingIndicator);
    scrollToBottom();
}

/**
 * 隐藏"正在输入"状态
 */
function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
    
    isTyping = false;
}

/**
 * 更新建议按钮
 * @param {Array<string>} suggestions - 建议文本数组
 */
function updateSuggestionButtons(suggestions = []) {
    const suggestionContainer = document.getElementById('suggestion-buttons');
    if (!suggestionContainer) return;
    
    // 清空原有的建议
    suggestionContainer.innerHTML = '';
    
    // 如果没有提供建议，则默认提供一些通用的旅行相关建议
    if (!suggestions || suggestions.length === 0) {
        suggestions = [
            '预算5000元旅游推荐',
            '适合5月份旅游的地方',
            '亲子旅游目的地推荐',
            '最适合拍照的旅游景点'
        ];
    }
    
    // 添加新的建议按钮
    suggestions.forEach(text => {
        const button = document.createElement('button');
        button.className = 'suggestion-btn';
        button.textContent = text;
        
        // 添加点击事件
        button.addEventListener('click', () => {
            document.getElementById('message-input').value = text;
            sendMessage();
            
            // 点击后添加动画效果
            button.classList.add('suggestion-btn-clicked');
            setTimeout(() => {
                button.classList.remove('suggestion-btn-clicked');
            }, 300);
        });
        
        suggestionContainer.appendChild(button);
    });
}

/**
 * 生成基于上下文的建议问题
 * @param {string} userQuestion - 用户的上一个问题
 * @param {string} aiResponse - AI的回答
 * @returns {Array<string>} - 建议问题数组
 */
function generateSuggestions(userQuestion, aiResponse) {
    // 根据不同的问题类型提供相应的后续问题建议
    if (userQuestion.includes('旅行计划') || userQuestion.includes('行程')) {
        return [
            '有哪些必去的景点？',
            '需要提前预订什么？',
            '当地有什么美食推荐？',
            '怎么安排交通最方便？'
        ];
    } else if (userQuestion.includes('推荐') || userQuestion.includes('建议')) {
        return [
            '这里的最佳旅游季节是？',
            '大概需要多少预算？',
            '适合待几天？',
            '有哪些独特体验？'
        ];
    } else if (userQuestion.includes('住宿') || userQuestion.includes('酒店')) {
        return [
            '有经济型酒店推荐吗？',
            '哪个位置住最方便？',
            '民宿和酒店哪个更好？',
            '有特色的住宿推荐吗？'
        ];
    } else if (userQuestion.includes('预算') || userQuestion.includes('花费')) {
        return [
            '如何省钱但不影响体验？',
            '当地物价水平如何？',
            '有哪些隐性消费需要注意？',
            '购物有什么建议？'
        ];
    } else {
        // 分析AI回复，提取可能的关键词，生成相关问题
        let suggestions = [];
        
        // 提取常见的地名或旅游项目
        const placesPattern = /(北京|上海|广州|深圳|杭州|成都|西安|三亚|厦门|丽江|香港|澳门|台湾|日本|泰国|新加坡|马尔代夫|欧洲|美国|澳大利亚)/g;
        const places = aiResponse.match(placesPattern);
        
        if (places && places.length > 0) {
            // 使用找到的第一个地名生成问题
            const place = places[0];
            suggestions.push(`${place}有哪些必去景点？`);
            suggestions.push(`去${place}需要准备什么？`);
        }
        
        // 添加一些通用的旅行问题
        suggestions.push('有什么特别的当地体验推荐？');
        suggestions.push('最适合什么时间去？');
        
        // 如果建议不足4个，补充
        if (suggestions.length < 4) {
            const defaultSuggestions = [
                '需要注意什么安全事项？',
                '有没有小众但值得去的地方？',
                '当地有什么特色美食？',
                '有适合拍照的地方推荐吗？'
            ];
            
            for (let i = 0; i < defaultSuggestions.length && suggestions.length < 4; i++) {
                suggestions.push(defaultSuggestions[i]);
            }
        }
        
        // 返回最多4个建议
        return suggestions.slice(0, 4);
    }
}

/**
 * 处理建议点击
 * @param {string} suggestion 建议文本
 */
function handleSuggestion(suggestion) {
    const messageInput = document.getElementById('message-input');
    if (messageInput) {
        messageInput.value = suggestion;
        sendMessage();
    }
}

/**
 * 处理目的地选择
 * @param {string} destination 目的地名称
 */
function handleDestination(destination) {
    const messageInput = document.getElementById('message-input');
    if (messageInput) {
        messageInput.value = `我想去${destination}旅行,请帮我规划行程`;
        sendMessage();
    }
}

/**
 * 处理精选旅行计划点击
 * @param {string} planTitle 计划标题
 */
function handleFeaturedPlan(planTitle) {
    const messageInput = document.getElementById('message-input');
    if (messageInput) {
        messageInput.value = `请详细介绍${planTitle}这个旅行计划`;
        sendMessage();
    }
}

/**
 * 根据旅行参数生成旅行计划，包含景点卡片展示
 * @param {Object} tripData 旅行数据
 */
async function generateTravelPlan(tripData) {
    console.log('生成旅行计划:', tripData);
    
    try {
        // 处理interests数组
        if (tripData.interests) {
            console.log('interests类型:', typeof tripData.interests, '值:', tripData.interests);
            // 如果interests是字符串，尝试将其转换为数组
            if (typeof tripData.interests === 'string') {
                tripData.interests = tripData.interests.split(',').map(item => item.trim());
            }
            
            // 确保interests是数组
            if (!Array.isArray(tripData.interests)) {
                console.warn('interests不是数组，设置为默认值');
                tripData.interests = ['文化历史'];
            }
        } else {
            tripData.interests = ['文化历史'];
        }
        
        console.log('处理后的interests数组:', tripData.interests);
        
        // 计算行程天数
        if (tripData.startDate && tripData.endDate) {
            const startDate = new Date(tripData.startDate);
            const endDate = new Date(tripData.endDate);
            const days = getDaysDifference(startDate, endDate);
            tripData.duration = days > 0 ? days : 3; // 确保至少有1天的行程
        } else if (!tripData.duration) {
            tripData.duration = 3; // 默认3天
        }
        
        let response;
        
        // 检查API模块是否已加载
        if (window.TravelAI && typeof window.TravelAI.generateItinerary === 'function') {
            try {
                // 尝试调用API生成行程
                const apiResponse = await window.TravelAI.generateItinerary({
                    destination: tripData.destination,
                    duration: tripData.duration,
                    travelers: tripData.travelers || 1,
                    budget: tripData.budget || '中等',
                    interests: tripData.interests
                });
                
                console.log('API响应:', apiResponse);
                
                if (apiResponse && apiResponse.success && apiResponse.itinerary) {
                    response = apiResponse.itinerary;
                    
                    // 添加源信息
                    addUserMessage(`我想去${tripData.destination}旅行 ${tripData.duration}天`);
                    
                    const sourceType = apiResponse.source === 'deepseek-api' ? 'DeepSeek AI生成' : '本地生成';
                    const sourceClass = apiResponse.source === 'deepseek-api' ? 'deepseek-source' : '';
                    
                    const formattedItinerary = formatItinerary(response);
                    const messageContent = `
                        <div>
                            <p>这是您的旅行计划:</p>
                            <br>
                            
                            <p><strong>${tripData.destination}</strong>旅行计划 (${tripData.duration}天)</p>
                            <p>人数: ${tripData.travelers || 1}人 | 预算: ${tripData.budget || '中等'}</p>
                            <p>兴趣: ${tripData.interests.join('、')}</p>
                        
                            <div class="itinerary-container">
                                ${formattedItinerary}
                            </div>
                            <button class="share-button">
                                <i class="fas fa-share-alt"></i> 分享行程
                            </button>
                            <div class="source-indicator ${sourceClass}">
                                <i class="${apiResponse.source === 'deepseek-api' ? 'fas fa-robot' : 'fas fa-laptop'}"></i> ${sourceType}
                            </div>
                        </div>
                    `;
                    
                    addBotMessage(messageContent);
                    
                    // 使用setTimeout确保DOM已经更新
                    setTimeout(() => {
                        // 绑定分享按钮事件
                        const shareButtons = document.querySelectorAll('.share-button');
                        const shareModal = document.getElementById('share-modal');
                        const closeShareModal = document.getElementById('close-share-modal');
                        
                        if (shareButtons.length && shareModal) {
                            shareButtons.forEach(button => {
                                button.addEventListener('click', function(e) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    shareModal.style.display = 'flex';
                                    document.body.style.overflow = 'hidden';
                                });
                            });
                            
                            if (closeShareModal) {
                                closeShareModal.addEventListener('click', function() {
                                    shareModal.style.display = 'none';
                                    document.body.style.overflow = '';
                                });
                            }
                            
                            // 点击模态框外部关闭
                            shareModal.addEventListener('click', function(e) {
                                if (e.target === shareModal) {
                                    shareModal.style.display = 'none';
                                    document.body.style.overflow = '';
                                }
                            });
                        }
                    }, 500);
                    
                    return response;
                } else {
                    throw new Error('API返回无效响应');
                }
            } catch (error) {
                console.error('调用API生成行程失败:', error);
                console.warn('将使用本地模式生成行程');
            }
        } else {
            console.warn('API模块不可用，使用本地模式生成行程');
        }
        
        // API调用失败或未加载，使用本地模式生成行程
        response = await generateMockTravelPlan(tripData);
        
        // 添加源信息
        addUserMessage(`我想去${tripData.destination}旅行 ${tripData.duration}天`);
        
        const formattedItinerary = formatItinerary(response);
        const messageContent = `
            <div>
                <p>这是您的旅行计划:</p>
                <br>
                
                <p><strong>${tripData.destination}</strong>旅行计划 (${tripData.duration}天)</p>
                <p>人数: ${tripData.travelers || 1}人 | 预算: ${tripData.budget || '中等'}</p>
                <p>兴趣: ${tripData.interests.join('、')}</p>
            
                <div class="itinerary-container">
                    ${formattedItinerary}
                </div>
                <button class="share-button">
                    <i class="fas fa-share-alt"></i> 分享行程
                </button>
                <div class="source-indicator">
                    <i class="fas fa-laptop"></i> 本地生成
                </div>
            </div>
        `;
        
        addBotMessage(messageContent);
        
        // 使用setTimeout确保DOM已经更新
        setTimeout(() => {
            // 绑定分享按钮事件
            const shareButtons = document.querySelectorAll('.share-button');
            const shareModal = document.getElementById('share-modal');
            const closeShareModal = document.getElementById('close-share-modal');
            
            if (shareButtons.length && shareModal) {
                shareButtons.forEach(button => {
                    button.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        shareModal.style.display = 'flex';
                        document.body.style.overflow = 'hidden';
                    });
                });
                
                if (closeShareModal) {
                    closeShareModal.addEventListener('click', function() {
                        shareModal.style.display = 'none';
                        document.body.style.overflow = '';
                    });
                }
                
                // 点击模态框外部关闭
                shareModal.addEventListener('click', function(e) {
                    if (e.target === shareModal) {
                        shareModal.style.display = 'none';
                        document.body.style.overflow = '';
                    }
                });
                
                // ESC键关闭
                document.addEventListener('keydown', function(e) {
                    if (e.key === 'Escape' && shareModal.style.display === 'flex') {
                        shareModal.style.display = 'none';
                        document.body.style.overflow = '';
                    }
                });
            }
        }, 500);
        
        return response;
    } catch (error) {
        console.error('生成旅行计划时出错:', error);
        
        // 显示错误消息
        addBotMessage(`
            <div class="error-message">
                <p>抱歉，生成旅行计划时遇到错误：</p>
                <p>${error.message || '未知错误'}</p>
                <p>请稍后重试或联系客服获取帮助。</p>
            </div>
        `);
        
        return null;
    }
}

/**
 * 从行程文本中提取景点信息
 * @param {string} itineraryText - 行程文本
 * @param {string} destination - 目的地
 * @returns {Array} - 景点信息数组
 */
function extractAttractionsFromItinerary(itineraryText, destination) {
    const attractions = [];
    
    // 寻找行程中可能包含的景点
    // 方法1：查找冒号后面跟着景点名的模式
    const colonPattern = /：([^，。,\.]+)(?:景点|公园|寺|宫|博物馆|美术馆|塔|城堡|教堂|神社|海滩|广场|花园|湖|山|森林|街|建筑|遗址|村|岛)/g;
    let match;
    
    while ((match = colonPattern.exec(itineraryText)) !== null) {
        if (match[1] && match[1].length > 1 && match[1].length < 20) {
            const name = match[1].trim();
            
            // 避免重复添加
            if (!attractions.some(a => a.name === name)) {
                attractions.push({
                    name: name,
                    description: extractAttractionDescription(itineraryText, name)
                });
            }
        }
    }
    
    // 方法2：查找常见景点关键词
    const attractionKeywords = [
        '景点', '公园', '寺', '宫', '博物馆', '美术馆', '塔', 
        '城堡', '教堂', '神社', '海滩', '广场', '花园', '湖', 
        '山', '森林', '街', '建筑', '遗址', '村', '岛'
    ];
    
    attractionKeywords.forEach(keyword => {
        const pattern = new RegExp(`([^，。,\\.]{2,20}?)${keyword}`, 'g');
        let keywordMatch;
        
        while ((keywordMatch = pattern.exec(itineraryText)) !== null) {
            if (keywordMatch[1] && keywordMatch[1].length > 1) {
                const name = (keywordMatch[1] + keyword).trim();
                
                // 避免重复添加
                if (!attractions.some(a => a.name === name)) {
                    attractions.push({
                        name: name,
                        description: extractAttractionDescription(itineraryText, name)
                    });
                }
            }
        }
    });
    
    // 添加一些特定景点关键词（根据目的地）
    const destinationKeywords = getDestinationSpecificKeywords(destination);
    if (destinationKeywords && destinationKeywords.length > 0) {
        destinationKeywords.forEach(keyword => {
            if (itineraryText.includes(keyword) && 
                !attractions.some(a => a.name === keyword)) {
                attractions.push({
                    name: keyword,
                    description: extractAttractionDescription(itineraryText, keyword)
                });
            }
        });
    }
    
    // 限制返回的景点数量
    return attractions.slice(0, 8);
}

/**
 * 从行程文本中提取景点描述
 * @param {string} text - 行程文本
 * @param {string} attractionName - 景点名称
 * @returns {string} - 景点描述
 */
function extractAttractionDescription(text, attractionName) {
    // 尝试找到包含景点名称的句子
    const sentencePattern = new RegExp(`[^。.!！?？]*${attractionName}[^。.!！?？]*[。.!！?？]`, 'g');
    const sentences = [];
    let sentenceMatch;
    
    while ((sentenceMatch = sentencePattern.exec(text)) !== null) {
        if (sentenceMatch[0] && sentenceMatch[0].length > attractionName.length + 2) {
            sentences.push(sentenceMatch[0].trim());
        }
    }
    
    // 如果找到了相关句子，返回最长的一个
    if (sentences.length > 0) {
        return sentences.sort((a, b) => b.length - a.length)[0];
    }
    
    // 如果没找到相关句子，返回默认描述
    return `${attractionName}是一个值得一游的地方。`;
}

/**
 * 获取特定目的地的景点关键词
 * @param {string} destination - 目的地
 * @returns {Array} - 景点关键词数组
 */
function getDestinationSpecificKeywords(destination) {
    const destinationKeywords = {
        '日本': ['富士山', '东京塔', '秋叶原', '浅草寺', '新宿御苑', '银座', '涩谷十字路口'],
        '东京': ['东京塔', '秋叶原', '浅草寺', '新宿御苑', '银座', '涩谷十字路口', '上野公园'],
        '京都': ['清水寺', '金阁寺', '伏见稻荷大社', '二条城', '岚山', '祇园'],
        '大阪': ['大阪城', '道顿堀', '环球影城', '天王寺动物园', '通天阁'],
        '北海道': ['函馆山', '小樽运河', '札幌钟楼', '旭川动物园', '富良野薰衣草田'],
        
        '泰国': ['大皇宫', '卧佛寺', '考山路', '四面佛', '玉佛寺', '湄南河'],
        '曼谷': ['大皇宫', '卧佛寺', '考山路', '四面佛', '玉佛寺', '湄南河'],
        '普吉岛': ['芭东海滩', '普吉镇', '攀牙湾', '卡塔海滩', '幻多奇乐园'],
        
        '韩国': ['景福宫', '南山塔', '明洞', '乐天世界', '梨泰院'],
        '首尔': ['景福宫', '南山塔', '明洞', '乐天世界', '梨泰院', '仁寺洞'],
        
        '法国': ['埃菲尔铁塔', '卢浮宫', '凯旋门', '圣母院', '香榭丽舍大街'],
        '巴黎': ['埃菲尔铁塔', '卢浮宫', '凯旋门', '圣母院', '香榭丽舍大街', '蒙马特'],
        
        '意大利': ['罗马斗兽场', '梵蒂冈', '比萨斜塔', '威尼斯大运河', '米兰大教堂'],
        '罗马': ['罗马斗兽场', '梵蒂冈', '许愿池', '真理之口', '西班牙广场'],
        
        '美国': ['自由女神像', '时代广场', '好莱坞', '白宫', '中央公园'],
        '纽约': ['自由女神像', '时代广场', '中央公园', '帝国大厦', '华尔街'],
        
        '三亚': ['亚龙湾', '天涯海角', '南山寺', '蜈支洲岛', '大东海'],
        '丽江': ['玉龙雪山', '古城', '拉市海', '束河古镇', '泸沽湖'],
        '西藏': ['布达拉宫', '大昭寺', '羊卓雍措', '纳木错', '扎什伦布寺'],
        '北京': ['故宫', '长城', '颐和园', '天坛', '天安门广场'],
        '上海': ['外滩', '东方明珠', '豫园', '南京路', '上海迪士尼']
    };
    
    // 尝试精确匹配
    if (destinationKeywords[destination]) {
        return destinationKeywords[destination];
    }
    
    // 尝试模糊匹配
    for (const key in destinationKeywords) {
        if (destination.includes(key) || key.includes(destination)) {
            return destinationKeywords[key];
        }
    }
    
    // 默认返回空数组
    return [];
}

/**
 * 保存行程到本地存储
 * @param {Object} tripData - 行程数据
 * @param {string} response - AI回复的行程内容
 */
function saveItinerary(tripData, response) {
    try {
        const itineraryId = 'itin_' + Date.now();
        const savedTrips = JSON.parse(localStorage.getItem('savedTrips') || '[]');
        
        const newTrip = {
            id: itineraryId,
            destination: tripData.destination,
            startDate: tripData.startDate,
            endDate: tripData.endDate,
            travelers: tripData.travelers,
            interests: tripData.interests,
            budget: tripData.budget,
            content: response,
            createdAt: new Date().toISOString()
        };
        
        savedTrips.push(newTrip);
        localStorage.setItem('savedTrips', JSON.stringify(savedTrips));
        
        // 通知用户
        addBotMessage('行程已成功保存。您可以在"我的行程"页面查看它。');
    } catch (error) {
        console.error('保存行程时出错:', error);
        addBotMessage('抱歉，保存行程时出现了问题。请稍后再试。');
    }
}

/**
 * 分享行程
 * @param {string} destination - 目的地
 * @param {number} duration - 行程天数
 */
function shareItinerary(destination, duration) {
    try {
        // 显示分享模态框
        const shareModal = document.getElementById('share-modal');
        if (shareModal) {
            shareModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        } else {
            // 如果没有找到模态框，使用原生共享API
            if (navigator.share) {
                navigator.share({
                    title: `${destination}${duration}天旅行计划`,
                    text: `我用旅行规划师小周为${destination}制定了${duration}天的行程，快来看看吧！`,
                    url: window.location.href
                });
            } else {
                // 复制链接到剪贴板
                const tempInput = document.createElement('input');
                tempInput.value = window.location.href;
                document.body.appendChild(tempInput);
                tempInput.select();
                document.execCommand('copy');
                document.body.removeChild(tempInput);
                
                addBotMessage('链接已复制到剪贴板，您可以将其分享给朋友。');
            }
        }
    } catch (error) {
        console.error('分享行程时出错:', error);
        addBotMessage('抱歉，分享功能暂时不可用。请稍后再试。');
    }
}

/**
 * 生成模拟旅行计划（当API不可用时）
 * @param {Object} tripData 旅行数据
 * @returns {string} 模拟旅行计划
 */
function generateMockTravelPlan(tripData) {
    // 确保interests是数组
    if (!tripData.interests) {
        tripData.interests = ['文化历史'];
    } else if (typeof tripData.interests === 'string') {
        tripData.interests = [tripData.interests];
    } else if (!Array.isArray(tripData.interests)) {
        console.warn('generateMockTravelPlan: interests 不是数组格式:', tripData.interests);
        tripData.interests = ['文化历史'];
    }
    
    const destination = tripData.destination || '未知目的地';
    const duration = getDaysDifference(tripData.startDate, tripData.endDate) || 3; // 默认3天
    const interests = Array.isArray(tripData.interests) ? tripData.interests.join('、') : '文化历史';
    
    console.log('generateMockTravelPlan - 处理后的数据:', {
        destination,
        duration,
        interests,
        startDate: tripData.startDate,
        endDate: tripData.endDate
    });
    
    // 根据目的地生成不同的景点建议
    let attractions = [];
    let foodRecommendations = '';
    let transportationTips = '';
    
    switch (destination) {
        case '日本':
        case '东京':
            attractions = ['东京塔', '浅草寺', '明治神宫', '涩谷十字路口', '秋叶原'];
            foodRecommendations = '寿司、拉面、天妇罗、烤肉、抹茶甜点';
            transportationTips = 'JR Pass、地铁、出租车';
            break;
        case '京都':
            attractions = ['伏见稻荷大社', '清水寺', '金阁寺', '二条城', '岚山竹林'];
            foodRecommendations = '怀石料理、抹茶甜品、乌冬面、章鱼烧';
            transportationTips = '巴士一日券、自行车租赁、地铁';
            break;
        case '法国':
        case '巴黎':
            attractions = ['埃菲尔铁塔', '卢浮宫', '巴黎圣母院', '凯旋门', '塞纳河'];
            foodRecommendations = '法棍面包、可丽饼、牛排、红酒、马卡龙';
            transportationTips = '地铁、巴士、观光船';
            break;
        case '泰国':
        case '曼谷':
            attractions = ['大皇宫', '卧佛寺', '考山路', '曼谷唐人街', '洽图洽周末市场'];
            foodRecommendations = '冬阴功汤、泰式炒河粉、芒果糯米饭、泰式咖喱';
            transportationTips = 'BTS轻轨、嘟嘟车、出租车、快船';
            break;
        case '美国':
        case '纽约':
            attractions = ['自由女神像', '中央公园', '帝国大厦', '时代广场', '大都会博物馆'];
            foodRecommendations = '汉堡、披萨、百老汇表演、热狗、甜甜圈';
            transportationTips = '地铁、巴士、出租车';
            break;
        default:
            attractions = ['当地著名景点1', '当地著名景点2', '当地著名景点3', '当地著名景点4', '当地著名景点5'];
            foodRecommendations = '当地特色美食、知名餐厅';
            transportationTips = '公共交通、租车自驾、出租车';
    }
    
    // 生成每天的行程安排
    let dailyItinerary = '';
    for (let i = 1; i <= duration; i++) {
        let dayContent = '';
        if (i === 1) {
            dayContent = `- 上午：抵达${destination}，办理入住手续\n- 下午：在酒店周边轻松游览，适应当地环境\n- 晚上：品尝当地特色美食`;
        } else if (i === duration) {
            dayContent = `- 上午：自由活动，购买纪念品\n- 中午：享用告别午餐\n- 下午：前往机场，结束愉快旅程`;
        } else {
            // 为中间天数随机安排景点
            const randomIndex1 = Math.floor(Math.random() * attractions.length);
            let randomIndex2 = Math.floor(Math.random() * attractions.length);
            while (randomIndex2 === randomIndex1) {
                randomIndex2 = Math.floor(Math.random() * attractions.length);
            }
            
            dayContent = `- 上午：参观${attractions[randomIndex1]}\n- 下午：游览${attractions[randomIndex2]}\n- 晚上：体验当地夜生活`;
        }
        
        dailyItinerary += `\n### 第${i}天：${i === 1 ? `抵达${destination}` : i === duration ? '返程' : `${destination}游览第${i}天`}\n${dayContent}\n`;
    }
    
    // 格式化行程内容
    return `# ${destination}${duration}天旅行计划

## 行程概览
- 出发日期：${tripData.startDate || '未指定'}
- 返回日期：${tripData.endDate || '未指定'}
- 旅行天数：${duration}天
- 旅行人数：${tripData.travelers || '未指定'}人
- 特别兴趣：${interests}
- 预算范围：${tripData.budget || '未指定'}

## 详细行程安排${dailyItinerary}

## 住宿推荐
- 经济型：${destination}舒适旅馆，约300-500元/晚
- 中档型：${destination}精品酒店，约800-1200元/晚
- 豪华型：${destination}国际大酒店，约1500元以上/晚

## 美食推荐
${destination}有许多特色美食，建议尝试${foodRecommendations}。

## 交通建议
根据您的行程安排，建议在当地选择合适的交通方式，如${transportationTips}。

## 旅行贴士
- 提前了解当地天气，准备合适的衣物
- 备好常用药品和必要证件
- 尊重当地风俗习惯
- 注意人身和财产安全

希望您在${destination}度过愉快的时光！如需调整行程或了解更多细节，请随时告诉我。`;
}

/**
 * 加载现有行程
 * @param {string} tripId 行程ID
 */
function loadTrip(tripId) {
    try {
        // 从本地存储获取行程数据
        const savedTrips = localStorage.getItem('savedTrips');
        if (savedTrips) {
            const trips = JSON.parse(savedTrips);
            const trip = trips.find(t => t.id === tripId);
            
            if (trip) {
                // 显示行程信息
                addBotMessage(`我已经加载了你的"${trip.name || trip.destination}"行程计划。这是一次${getDaysDifference(trip.startDate, trip.endDate)}天的旅行，从${formatDate(trip.startDate)}到${formatDate(trip.endDate)}。你需要我为你做什么调整吗？`);
                
                // 更新建议按钮
                updateSuggestionButtons([
                    '查看详细行程',
                    '修改行程天数',
                    '添加更多景点',
                    '推荐当地美食'
                ]);
                
                // 保存到对话历史
                conversationHistory.push({ 
                    role: 'system', 
                    content: `用户正在查看名为"${trip.name || trip.destination}"的保存行程，这是一次从${formatDate(trip.startDate)}到${formatDate(trip.endDate)}的${getDaysDifference(trip.startDate, trip.endDate)}天旅行。`
                });
            } else {
                addBotMessage('抱歉，我找不到这个行程。要创建新的行程计划吗？');
            }
        } else {
            addBotMessage('你还没有保存任何行程。要创建一个新的行程计划吗？');
        }
    } catch (error) {
        console.error('加载行程时出错:', error);
        addBotMessage('加载行程时出现问题。请再试一次。');
    }
}

/**
 * 编辑现有行程
 * @param {string} tripId 行程ID
 */
function editTripById(tripId) {
    try {
        // 从本地存储获取行程数据
        const savedTrips = localStorage.getItem('savedTrips');
        if (savedTrips) {
            const trips = JSON.parse(savedTrips);
            const trip = trips.find(t => t.id === tripId);
            
            if (trip) {
                // 显示行程信息
                addBotMessage(`我已经打开了"${trip.name || trip.destination}"行程进行编辑。这是一次从${formatDate(trip.startDate)}到${formatDate(trip.endDate)}的${getDaysDifference(trip.startDate, trip.endDate)}天旅行。请告诉我你想要如何修改这个行程？`);
                
                // 更新建议按钮
                updateSuggestionButtons([
                    '延长旅行天数',
                    '更改酒店选择',
                    '添加更多景点',
                    '调整行程安排'
                ]);
                
                // 保存到对话历史
                conversationHistory.push({ 
                    role: 'system', 
                    content: `用户正在编辑名为"${trip.name || trip.destination}"的行程，这是一次从${formatDate(trip.startDate)}到${formatDate(trip.endDate)}的${getDaysDifference(trip.startDate, trip.endDate)}天旅行。`
                });
            } else {
                addBotMessage('抱歉，我找不到这个行程。要创建新的行程计划吗？');
            }
        } else {
            addBotMessage('你还没有保存任何行程。要创建一个新的行程计划吗？');
        }
    } catch (error) {
        console.error('编辑行程时出错:', error);
        addBotMessage('编辑行程时出现问题。请再试一次。');
    }
}

/**
 * 清空聊天历史
 */
function clearChat() {
    // 清空对话历史
    conversationHistory = [];
    
    // 清空聊天界面
    const chatMessages = document.querySelector('.chat-messages');
    if (chatMessages) {
        chatMessages.innerHTML = '';
    }
    
    // 显示欢迎消息
    setTimeout(() => {
        addBotMessage('你好！我是旅行规划师小周。请告诉我你想去哪里旅行，或者你需要什么帮助？', true);
        updateSuggestionButtons(['帮我计划日本之旅', '我想去海边度假', '推荐一个适合11月的旅行地', '预算5000元可以去哪里']);
    }, 300);
}

/**
 * 保存对话历史到本地存储
 */
function saveConversationHistory() {
    try {
        // 限制保存的最大消息数量，防止本地存储过大
        const maxMessages = 20;
        let historyToSave = [...conversationHistory];
        
        // 如果超过最大数量，只保留最新的消息
        if (historyToSave.length > maxMessages) {
            // 保留任何系统消息
            const systemMessages = historyToSave.filter(msg => msg.role === 'system');
            // 保留最近的消息
            const recentMessages = historyToSave.slice(-maxMessages + systemMessages.length);
            historyToSave = [...systemMessages, ...recentMessages];
        }
        
        // 保存当前会话ID
        const sessionId = localStorage.getItem('chatSessionId') || generateSessionId();
        localStorage.setItem('chatSessionId', sessionId);
        
        // 保存对话历史
        localStorage.setItem('chatHistory', JSON.stringify(historyToSave));
        
        // 保存最后更新时间
        localStorage.setItem('chatHistoryUpdated', new Date().toISOString());
        
        console.log('对话历史已保存', historyToSave.length);
    } catch (error) {
        console.error('保存对话历史时出错:', error);
    }
}

/**
 * 加载对话历史
 */
function loadConversationHistory() {
    try {
        // 检查本地存储中是否有对话历史
        const savedHistory = localStorage.getItem('chatHistory');
        if (!savedHistory) {
            console.log('没有找到保存的对话历史');
            return false;
        }
        
        // 检查最后更新时间，如果超过24小时则不加载
        const lastUpdated = localStorage.getItem('chatHistoryUpdated');
        if (lastUpdated) {
            const lastUpdateTime = new Date(lastUpdated).getTime();
            const currentTime = new Date().getTime();
            const hoursDiff = (currentTime - lastUpdateTime) / (1000 * 60 * 60);
            
            if (hoursDiff > 24) {
                console.log('对话历史已过期（超过24小时）');
                localStorage.removeItem('chatHistory');
                localStorage.removeItem('chatHistoryUpdated');
                return false;
            }
        }
        
        // 解析对话历史
        const parsedHistory = JSON.parse(savedHistory);
        if (!Array.isArray(parsedHistory) || parsedHistory.length === 0) {
            return false;
        }
        
        console.log('加载已保存的对话历史', parsedHistory.length);
        
        // 更新全局对话历史
        conversationHistory = parsedHistory;
        
        // 清空当前聊天消息
        const messagesContainer = document.getElementById('chat-messages');
        if (messagesContainer) {
            // 保留欢迎消息（如果有）
            const welcomeMsg = messagesContainer.querySelector('.chat-welcome');
            messagesContainer.innerHTML = '';
            if (welcomeMsg) {
                messagesContainer.appendChild(welcomeMsg);
            }
        }
        
        // 重新创建消息界面
        let userMessages = 0;
        let assistantMessages = 0;
        
        for (const message of parsedHistory) {
            if (message.role === 'user') {
                addUserMessage(message.content, false); // 不使用动画效果
                userMessages++;
            } else if (message.role === 'assistant') {
                addBotMessage(message.content, false); // 不使用动画效果
                assistantMessages++;
            }
        }
        
        console.log(`已加载对话历史: ${userMessages}条用户消息, ${assistantMessages}条AI消息`);
        return true;
    } catch (error) {
        console.error('加载对话历史时出错:', error);
        return false;
    }
}

/**
 * 生成会话ID
 * @returns {string} 随机生成的会话ID
 */
function generateSessionId() {
    return 'chat_' + Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15) + 
           '_' + new Date().getTime();
}

/**
 * 重置对话
 */
function resetConversation() {
    try {
        // 清空对话历史
        conversationHistory = [];
        
        // 清除本地存储中的对话记录
        localStorage.removeItem('chatHistory');
        localStorage.removeItem('chatHistoryUpdated');
        
        // 获取消息容器
        const messagesContainer = document.getElementById('chat-messages');
        if (messagesContainer) {
            // 清空所有消息，但保留欢迎消息（如果有）
            const welcomeMsg = messagesContainer.querySelector('.chat-welcome');
            messagesContainer.innerHTML = '';
            if (welcomeMsg) {
                messagesContainer.appendChild(welcomeMsg);
            }
        }
        
        // 显示欢迎消息
        setTimeout(() => {
            addBotMessage('你好！我是旅行规划师小周。请告诉我你想去哪里旅行，或者你需要什么帮助？', true);
            
            // 更新建议按钮
            updateSuggestionButtons([
                '帮我计划日本之旅',
                '我想去海边度假',
                '推荐一个适合11月的旅行地',
                '预算5000元可以去哪里'
            ]);
        }, 300);
        
        console.log('对话已重置');
        return true;
    } catch (error) {
        console.error('重置对话时出错:', error);
        return false;
    }
}

// 主要功能函数导出到全局范围
window.generateTravelPlan = generateTravelPlan;
window.generateMockTravelPlan = generateMockTravelPlan;
window.formatItinerary = formatItinerary;

/**
 * 初始化聊天模块，暴露公共方法
 * @param {Object} options - 初始化选项
 */
function initChatModule(options = {}) {
    // 声明window.isChatInitialized标记，用于其他模块检查
    window.isChatInitialized = false;

    // 创建聊天模块对象
    const chatModule = {
        // 初始化聊天
        init: (initOptions = {}) => {
            const mergedOptions = {...options, ...initOptions};
            initChat(mergedOptions);
            window.isChatInitialized = true;
            return true;
        },
        
        // 发送消息
        sendMessage: () => {
            const messageInput = document.getElementById('message-input');
            if (messageInput && messageInput.value.trim()) {
                const message = messageInput.value.trim();
                messageInput.value = '';
                processUserMessage(message);
                return true;
            }
            return false;
        },
        
        // 重置对话
        resetConversation: () => {
            resetConversation();
            return true;
        },
        
        // 获取对话历史
        getConversationHistory: () => [...conversationHistory],

        // 生成旅行计划
        generateTravelPlan: (tripData) => {
            return generateTravelPlan(tripData);
        }
    };
    
    // 立即将模块暴露到全局，确保在DOM加载前就可用
    window.ChatModule = chatModule;
    
    // 监听DOM加载完成事件
    document.addEventListener('DOMContentLoaded', () => {
        // 初始化聊天界面
        initChat(options);
        
        // 支持重置聊天的功能
        const resetButtons = document.querySelectorAll('.reset-chat-btn');
        resetButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                
                if (confirm('确定要清空当前对话记录吗？此操作不可撤销。')) {
                    resetConversation();
                }
            });
        });
    });
    
    console.log('聊天模块初始化完成');
    
    // 返回模块对象，方便测试和调试
    return chatModule;
}

// 立即执行初始化，并确保全局变量可用
window.ChatModule = initChatModule();

/**
 * 计算两个日期之间的天数差
 * @param {string} startDate - 开始日期
 * @param {string} endDate - 结束日期
 * @returns {number} - 天数差
 */
function getDaysDifference(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// 添加额外的样式到页面
function addExtraStyles() {
    // 避免重复添加样式
    if (document.getElementById('xiaozhouAssistantStyles')) {
        return;
    }
    
    const styleElement = document.createElement('style');
    styleElement.id = 'xiaozhouAssistantStyles';
    styleElement.textContent = `
        /* 基础消息样式优化 */
        .message {
            margin-bottom: 16px;
            opacity: 1 !important;
            transform: none !important;
            transition: all 0.3s ease;
        }
        
        .bot-message {
            position: relative;
            margin-bottom: 24px;
        }
        
        .bot-message .message-content {
            background-color: #f5f5f7;
            border-radius: 16px;
            padding: 14px 18px;
            box-shadow: 0 1px 4px rgba(0,0,0,0.04);
            max-width: 85%;
            position: relative;
            overflow: hidden;
        }
        
        .bot-message-long .message-content {
            transition: all 0.5s ease;
            animation: fadeIn 0.8s ease;
        }
        
        /* 表单消息样式 */
        .form-message-container {
            width: 100%;
            max-width: 500px;
            background-color: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            margin: 8px 0;
            border: 1px solid #e8e8e8;
        }
        
        .form-title {
            background-color: #0071e3;
            color: white;
            padding: 12px 16px;
            margin: 0;
            font-size: 16px;
            font-weight: 600;
        }
        
        .form-description {
            padding: 12px 16px;
            margin: 0;
            color: #666;
            font-size: 14px;
            background-color: #f9f9f9;
            border-bottom: 1px solid #eee;
        }
        
        .interactive-form {
            padding: 16px;
        }
        
        .form-field {
            margin-bottom: 16px;
        }
        
        .form-field label {
            display: block;
            margin-bottom: 6px;
            font-size: 14px;
            font-weight: 500;
            color: #333;
        }
        
        .form-field input[type="text"],
        .form-field input[type="date"],
        .form-field input[type="number"],
        .form-field select,
        .form-field textarea {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 14px;
            transition: border-color 0.2s ease;
        }
        
        .form-field input:focus,
        .form-field select:focus,
        .form-field textarea:focus {
            border-color: #0071e3;
            outline: none;
            box-shadow: 0 0 0 2px rgba(0,113,227,0.2);
        }
        
        .checkbox-field {
            display: flex;
            align-items: center;
        }
        
        .checkbox-field label {
            margin-bottom: 0;
            display: flex;
            align-items: center;
            cursor: pointer;
        }
        
        .checkbox-field input[type="checkbox"] {
            margin-right: 8px;
        }
        
        .radio-group {
            margin-bottom: 16px;
        }
        
        .radio-options {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .radio-option {
            display: flex;
            align-items: center;
            cursor: pointer;
        }
        
        .radio-option input {
            margin-right: 8px;
        }
        
        .form-submit-btn {
            background-color: #0071e3;
            color: white;
            border: none;
            border-radius: 6px;
            padding: 10px 16px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s ease;
        }
        
        .form-submit-btn:hover {
            background-color: #005bb8;
        }
        
        .form-submit-btn:disabled {
            background-color: #b4d9ff;
            cursor: not-allowed;
        }
        
        .form-success {
            padding: 24px 16px;
            text-align: center;
        }
        
        .success-icon {
            font-size: 40px;
            color: #34c759;
            margin-bottom: 16px;
        }
        
        /* 卡片消息样式 */
        .card-container {
            width: 100%;
            max-width: 450px;
            background-color: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.08);
            margin: 10px 0;
            border: 1px solid #e8e8e8;
        }
        
        .card-image-container {
            width: 100%;
            height: 180px;
            overflow: hidden;
            position: relative;
        }
        
        .card-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s ease;
        }
        
        .card-image:hover {
            transform: scale(1.05);
        }
        
        .card-content {
            padding: 16px;
        }
        
        .card-title {
            margin: 0 0 8px 0;
            font-size: 18px;
            font-weight: 600;
            color: #333;
        }
        
        .card-subtitle {
            font-size: 14px;
            color: #666;
            margin-bottom: 12px;
        }
        
        .card-description {
            font-size: 14px;
            line-height: 1.5;
            color: #444;
            margin-bottom: 16px;
        }
        
        .card-actions {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }
        
        .card-button {
            padding: 8px 16px;
            font-size: 14px;
            border-radius: 6px;
            cursor: pointer;
            border: none;
            font-weight: 500;
            transition: all 0.2s ease;
        }
        
        .card-button.primary {
            background-color: #0071e3;
            color: white;
        }
        
        .card-button.secondary {
            background-color: #f5f5f7;
            color: #333;
            border: 1px solid #ddd;
        }
        
        .card-button:hover {
            opacity: 0.9;
            transform: translateY(-1px);
        }
        
        /* 画廊消息样式 */
        .gallery-container {
            width: 100%;
            max-width: 500px;
            position: relative;
            margin: 15px 0;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .gallery-nav {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 100%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            z-index: 2;
            pointer-events: none;
        }
        
        .gallery-arrow {
            width: 40px;
            height: 40px;
            display: flex;
            justify-content: center;
            align-items: center;
            background-color: rgba(255,255,255,0.8);
            border-radius: 50%;
            cursor: pointer;
            border: none;
            box-shadow: 0 2px 6px rgba(0,0,0,0.15);
            pointer-events: auto;
        }
        
        .gallery-arrow-left {
            margin-left: 10px;
        }
        
        .gallery-arrow-right {
            margin-right: 10px;
        }
        
        .gallery-items {
            position: relative;
            width: 100%;
            height: 300px;
        }
        
        .gallery-item {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0;
            transition: opacity 0.5s ease;
            display: none;
        }
        
        .gallery-item.active {
            opacity: 1;
            z-index: 1;
            display: block;
        }
        
        .gallery-image {
            width: 100%;
            height: 220px;
            object-fit: cover;
        }
        
        .gallery-item-content {
            padding: 15px;
            background-color: white;
            height: 80px;
        }
        
        .gallery-item-title {
            margin: 0 0 6px 0;
            font-size: 16px;
            font-weight: 600;
        }
        
        .gallery-item-description {
            font-size: 14px;
            color: #666;
            margin: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
        }
        
        .gallery-indicators {
            display: flex;
            justify-content: center;
            padding: 10px 0;
            background-color: white;
        }
        
        .gallery-indicator {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: #ddd;
            margin: 0 4px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .gallery-indicator.active {
            background-color: #0071e3;
            transform: scale(1.2);
        }
        
        /* 优化行程显示 */
        .itinerary-container {
            background-color: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 3px 10px rgba(0,0,0,0.08);
            margin: 12px 0;
            border: 1px solid #e8e8e8;
            width: 100%;
        }
        
        .itinerary-title {
            background-color: #0071e3;
            color: white;
            padding: 12px 16px;
            margin: 0;
            font-size: 18px;
            text-align: center;
        }
        
        .itinerary-overview {
            background-color: #f8f9fa;
            padding: 16px;
            border-bottom: 1px solid #eaeaea;
        }
        
        .section-title {
            margin-top: 0;
            margin-bottom: 12px;
            color: #333;
            font-size: 16px;
            font-weight: 600;
        }
        
        .overview-list {
            margin: 0;
            padding-left: 20px;
        }
        
        .overview-list li {
            margin-bottom: 8px;
        }
        
        .itinerary-days {
            padding: 16px;
        }
        
        .day-card {
            margin-bottom: 15px;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 6px rgba(0,0,0,0.06);
            border: 1px solid #eaeaea;
        }
        
        .day-title {
            background-color: #0071e3;
            color: white;
            padding: 10px 14px;
            font-weight: 600;
        }
        
        .day-content {
            padding: 8px 0;
            background-color: white;
        }
        
        .schedule-list {
            list-style: none;
            padding: 0 16px;
            margin: 0;
        }
        
        .schedule-list li {
            padding: 8px 0;
            border-bottom: 1px solid #f0f0f0;
            position: relative;
            padding-left: 0;
        }
        
        .schedule-list li:last-child {
            border-bottom: none;
        }
        
        .time-slot {
            color: #0071e3;
            font-weight: 600;
            display: inline-block;
            min-width: 80px;
        }
        
        .additional-info {
            padding: 16px;
            border-top: 1px solid #eaeaea;
            background-color: #f8f9fa;
        }
        
        .info-section {
            margin-bottom: 16px;
        }
        
        .info-section:last-child {
            margin-bottom: 0;
        }
        
        .info-list {
            margin: 0;
            padding-left: 20px;
        }
        
        .info-list li {
            margin-bottom: 6px;
        }
        
        /* 景点卡片 - 针对行程中的景点 */
        .attraction-card {
            display: flex;
            margin: 10px 0;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 6px rgba(0,0,0,0.08);
            background-color: white;
        }
        
        .attraction-image {
            width: 80px;
            height: 80px;
            object-fit: cover;
        }
        
        .attraction-content {
            flex: 1;
            padding: 10px;
        }
        
        .attraction-name {
            font-weight: 600;
            margin: 0 0 4px 0;
            font-size: 15px;
        }
        
        .attraction-info {
            font-size: 12px;
            color: #666;
            display: flex;
            align-items: center;
            margin-bottom: 4px;
        }
        
        .attraction-info i {
            margin-right: 5px;
            width: 14px;
            text-align: center;
        }
        
        /* 错误格式化显示 */
        .error-formatting {
            background-color: #fff8f8;
            border: 1px solid #ffdddd;
            border-radius: 8px;
            padding: 12px;
            margin: 10px 0;
        }
        
        .error-formatting pre {
            white-space: pre-wrap;
            font-family: monospace;
            font-size: 12px;
            background-color: #f9f9f9;
            padding: 10px;
            border-radius: 4px;
            max-height: 200px;
            overflow: auto;
        }
        
        /* 必填字段标记 */
        .required {
            color: #ff3b30;
            font-weight: bold;
        }
        
        /* 动画效果 */
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes pulseComplete {
            0% { box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
            50% { box-shadow: 0 2px 12px rgba(0,113,227,0.15); }
            100% { box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
        }
        
        .message-complete .message-content {
            animation: pulseComplete 0.8s ease;
        }
    `;
    
    document.head.appendChild(styleElement);
}

/**
 * 创建旅行计划表单
 * @returns {Object} 表单配置对象
 */
function createTravelPlanForm() {
    console.log('创建旅行计划表单');
    
    try {
        // 获取当前日期和一周后的日期（作为默认值）
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        
        // 格式化日期为 YYYY-MM-DD
        const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };
        
        const todayFormatted = formatDate(today);
        const nextWeekFormatted = formatDate(nextWeek);
        
        // 返回表单配置
        const formData = {
            type: MessageType.FORM,
            content: {
                id: 'travel-form',
                title: '旅行计划定制表单',
                description: '请填写以下信息，我们将为您定制个性化的旅行计划',
                fields: [
                    {
                        name: 'destination',
                        label: '目的地',
                        type: 'text',
                        placeholder: '例如：日本、巴黎、峇里岛',
                        required: true
                    },
                    {
                        name: 'startDate',
                        label: '出发日期',
                        type: 'date',
                        value: todayFormatted,
                        required: true
                    },
                    {
                        name: 'endDate',
                        label: '结束日期',
                        type: 'date',
                        value: nextWeekFormatted,
                        required: true
                    },
                    {
                        name: 'travelers',
                        label: '旅行人数',
                        type: 'select',
                        options: [
                            { value: '1', label: '1人' },
                            { value: '2', label: '2人' },
                            { value: '3', label: '3人' },
                            { value: '4', label: '4人' },
                            { value: '5+', label: '5人及以上' }
                        ],
                        required: true
                    },
                    {
                        name: 'budget',
                        label: '预算范围',
                        type: 'select',
                        options: [
                            { value: '经济实惠', label: '经济实惠 (¥2000-5000/人)' },
                            { value: '中等消费', label: '中等消费 (¥5000-10000/人)' },
                            { value: '豪华享受', label: '豪华享受 (¥10000以上/人)' }
                        ],
                        required: true
                    },
                    {
                        name: 'interests',
                        label: '旅行兴趣（可多选）',
                        type: 'radio-group',
                        options: [
                            { value: '美食', label: '美食' },
                            { value: '文化历史', label: '文化历史' },
                            { value: '自然风光', label: '自然风光' },
                            { value: '购物', label: '购物' },
                            { value: '冒险活动', label: '冒险活动' },
                            { value: '度假放松', label: '度假放松' }
                        ]
                    },
                    {
                        name: 'additional',
                        label: '其他要求或备注',
                        type: 'textarea',
                        placeholder: '有什么特别的要求或偏好，请在这里告诉我们...'
                    }
                ],
                submitText: '生成旅行计划'
            }
        };
        
        console.log('表单创建成功:', formData);
        return formData;
    } catch (error) {
        console.error('创建表单出错:', error);
        // 返回一个错误消息
        return {
            type: MessageType.TEXT,
            content: '抱歉，表单创建失败。请直接告诉我您的旅行需求，例如"我想去日本旅行，喜欢美食和文化历史"。'
        };
    }
}

/**
 * 识别用户是否在咨询旅行计划，并决定是否提供表单
 * @param {string} message - 用户消息
 * @returns {boolean} 是否与旅行计划相关
 */
function isTravelPlanQuery(message) {
    const travelKeywords = [
        '旅行', '旅游', '行程', '游玩', '度假', 
        '攻略', '计划', '规划', '景点', '玩什么', 
        '去哪', '路线', '行程', '几天', '一周'
    ];
    
    const destinationKeywords = [
        '日本', '东京', '大阪', '京都', '北海道',
        '泰国', '普吉岛', '曼谷', '清迈',
        '韩国', '首尔', '釜山',
        '法国', '巴黎', '尼斯', '普罗旺斯',
        '意大利', '罗马', '威尼斯', '佛罗伦萨', '米兰',
        '美国', '纽约', '洛杉矶', '旧金山', '夏威夷',
        '新加坡', '马来西亚', '吉隆坡',
        '澳大利亚', '悉尼', '墨尔本',
        '新西兰', '奥克兰',
        '英国', '伦敦', '爱丁堡',
        '西班牙', '巴塞罗那', '马德里',
        '三亚', '丽江', '大理', '西藏', '新疆',
        '云南', '四川', '长城', '北京', '上海'
    ];
    
    // 检查是否包含旅行相关关键词
    const hasTravelKeyword = travelKeywords.some(keyword => 
        message.includes(keyword)
    );
    
    // 检查是否包含目的地关键词
    const hasDestinationKeyword = destinationKeywords.some(keyword => 
        message.includes(keyword)
    );
    
    // 计划相关正则表达式
    const travelPlanPatterns = [
        /计划.{0,10}旅行/,
        /规划.{0,10}行程/,
        /推荐.{0,10}景点/,
        /准备.{0,10}去.{0,10}旅游/,
        /想.{0,10}去.{0,10}玩/,
        /[0-9]+天.{0,5}行程/,
        /去.{1,20}要怎么玩/,
        /去.{1,20}有什么推荐/
    ];
    
    // 检查是否匹配任何计划模式
    const matchesTravelPattern = travelPlanPatterns.some(pattern => 
        pattern.test(message)
    );
    
    // 如果同时满足关键词和目的地，或者匹配了旅行计划模式，则认为是旅行计划查询
    return (hasTravelKeyword && hasDestinationKeyword) || matchesTravelPattern;
}

/**
 * 处理用户消息
 * @param {string} text - 用户消息文本
 */
async function processUserMessage(text) {
    // 显示正在输入状态
    showTypingIndicator();
    
    // 设置响应超时，5秒后如果仍未收到回复则显示提示
    const responseTimeout = setTimeout(() => {
        if (isTyping) {
            addBotMessage('正在努力思考中，请稍等片刻...');
        }
    }, 5000);
    
    try {
        // 检查是否是旅行计划查询
        if (isTravelPlanQuery(text)) {
            // 隐藏输入指示器
            hideTypingIndicator();
            clearTimeout(responseTimeout);
            
            console.log('检测到旅行计划查询，准备显示表单');
            
            // 先添加文本消息
            addBotMessage('您好！看起来您正在计划一次旅行。为了给您提供更好的建议，请填写以下信息：');
            
            // 创建并显示表单
            const travelForm = createTravelPlanForm();
            console.log('创建的表单对象:', travelForm);
            
            // 确保表单对象是有效的
            if (travelForm && travelForm.type === MessageType.FORM && travelForm.content) {
                setTimeout(() => {
                    addBotMessage(travelForm);
                }, 500);
            } else {
                console.error('表单对象无效:', travelForm);
                addBotMessage('抱歉，创建表单时出现了问题。请直接告诉我您想去哪里旅行，以及您的偏好。');
            }
            return;
        }

        let botResponse;
        
        // 尝试使用API获取回复
        if (window.TravelAI && window.TravelAI.generateItinerary) {
            try {
                // 提取目的地和天数信息
                const destinationMatch = text.match(/去(.+?)(?:旅行|旅游|玩|游玩)/);
                const durationMatch = text.match(/(\d+)\s*天/);
                
                const params = {
                    destination: destinationMatch ? destinationMatch[1] : '未指定目的地',
                    duration: durationMatch ? parseInt(durationMatch[1]) : 3,
                    travelers: 1,
                    budget: '中等',
                    interests: ['文化历史']
                };

                // 记录请求
                console.log('请求参数:', params);
                console.log('是否使用离线模式:', window.TravelAI.useOfflineMode);

                const result = await window.TravelAI.generateItinerary(params);
                console.log('API返回结果:', result);
                
                if (result && result.itinerary) {
                    botResponse = result.itinerary;
                } else {
                    throw new Error('API返回无效结果');
                }
            } catch (error) {
                console.error('API请求失败:', error);
                botResponse = `抱歉，我暂时无法处理您的请求。请稍后再试。错误信息: ${error.message || '未知错误'}`;
            }
        } else {
            console.warn('API模块未加载，使用默认响应');
            botResponse = '您好！我是旅行规划师小周。我可以帮您规划旅行行程，推荐景点，提供美食和住宿建议。请告诉我您想去哪里旅行，或者您需要什么帮助？';
        }
        
        // 隐藏输入状态
        hideTypingIndicator();
        clearTimeout(responseTimeout);
        
        // 添加机器人回复
        addBotMessage(botResponse);
        
        // 生成建议按钮
        updateSuggestionButtons(generateSuggestions(text, botResponse));
        
        // 保存对话历史
        saveConversationHistory();
    } catch (error) {
        console.error('处理消息时出错:', error);
        hideTypingIndicator();
        clearTimeout(responseTimeout);
        
        // 添加错误消息
        const errorMessage = `抱歉，处理您的请求时出现了问题。${error.message || '请稍后再试。'}`;
        addBotMessage(errorMessage);
    }
}

// 立即执行初始化，并确保全局变量可用
window.ChatModule = initChatModule();

/**
 * 计算两个日期之间的天数差
 * @param {string} startDate - 开始日期
 * @param {string} endDate - 结束日期
 * @returns {number} - 天数差
 */
function getDaysDifference(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// 添加额外的样式到页面
function addExtraStyles() {
    // 避免重复添加样式
    if (document.getElementById('xiaozhouAssistantStyles')) {
        return;
    }
    
    const styleElement = document.createElement('style');
    styleElement.id = 'xiaozhouAssistantStyles';
    styleElement.textContent = `
        /* 基础消息样式优化 */
        .message {
            margin-bottom: 16px;
            opacity: 1 !important;
            transform: none !important;
            transition: all 0.3s ease;
        }
        
        .bot-message {
            position: relative;
            margin-bottom: 24px;
        }
        
        .bot-message .message-content {
            background-color: #f5f5f7;
            border-radius: 16px;
            padding: 14px 18px;
            box-shadow: 0 1px 4px rgba(0,0,0,0.04);
            max-width: 85%;
            position: relative;
            overflow: hidden;
        }
        
        .bot-message-long .message-content {
            transition: all 0.5s ease;
            animation: fadeIn 0.8s ease;
        }
        
        /* 表单消息样式 */
        .form-message-container {
            width: 100%;
            max-width: 500px;
            background-color: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            margin: 8px 0;
            border: 1px solid #e8e8e8;
        }
        
        .form-title {
            background-color: #0071e3;
            color: white;
            padding: 12px 16px;
            margin: 0;
            font-size: 16px;
            font-weight: 600;
        }
        
        .form-description {
            padding: 12px 16px;
            margin: 0;
            color: #666;
            font-size: 14px;
            background-color: #f9f9f9;
            border-bottom: 1px solid #eee;
        }
        
        .interactive-form {
            padding: 16px;
        }
        
        .form-field {
            margin-bottom: 16px;
        }
        
        .form-field label {
            display: block;
            margin-bottom: 6px;
            font-size: 14px;
            font-weight: 500;
            color: #333;
        }
        
        .form-field input[type="text"],
        .form-field input[type="date"],
        .form-field input[type="number"],
        .form-field select,
        .form-field textarea {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 14px;
            transition: border-color 0.2s ease;
        }
        
        .form-field input:focus,
        .form-field select:focus,
        .form-field textarea:focus {
            border-color: #0071e3;
            outline: none;
            box-shadow: 0 0 0 2px rgba(0,113,227,0.2);
        }
        
        .checkbox-field {
            display: flex;
            align-items: center;
        }
        
        .checkbox-field label {
            margin-bottom: 0;
            display: flex;
            align-items: center;
            cursor: pointer;
        }
        
        .checkbox-field input[type="checkbox"] {
            margin-right: 8px;
        }
        
        .radio-group {
            margin-bottom: 16px;
        }
        
        .radio-options {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .radio-option {
            display: flex;
            align-items: center;
            cursor: pointer;
        }
        
        .radio-option input {
            margin-right: 8px;
        }
        
        .form-submit-btn {
            background-color: #0071e3;
            color: white;
            border: none;
            border-radius: 6px;
            padding: 10px 16px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s ease;
        }
        
        .form-submit-btn:hover {
            background-color: #005bb8;
        }
        
        .form-submit-btn:disabled {
            background-color: #b4d9ff;
            cursor: not-allowed;
        }
        
        .form-success {
            padding: 24px 16px;
            text-align: center;
        }
        
        .success-icon {
            font-size: 40px;
            color: #34c759;
            margin-bottom: 16px;
        }
        
        /* 卡片消息样式 */
        .card-container {
            width: 100%;
            max-width: 450px;
            background-color: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.08);
            margin: 10px 0;
            border: 1px solid #e8e8e8;
        }
        
        .card-image-container {
            width: 100%;
            height: 180px;
            overflow: hidden;
            position: relative;
        }
        
        .card-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s ease;
        }
        
        .card-image:hover {
            transform: scale(1.05);
        }
        
        .card-content {
            padding: 16px;
        }
        
        .card-title {
            margin: 0 0 8px 0;
            font-size: 18px;
            font-weight: 600;
            color: #333;
        }
        
        .card-subtitle {
            font-size: 14px;
            color: #666;
            margin-bottom: 12px;
        }
        
        .card-description {
            font-size: 14px;
            line-height: 1.5;
            color: #444;
            margin-bottom: 16px;
        }
        
        .card-actions {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }
        
        .card-button {
            padding: 8px 16px;
            font-size: 14px;
            border-radius: 6px;
            cursor: pointer;
            border: none;
            font-weight: 500;
            transition: all 0.2s ease;
        }
        
        .card-button.primary {
            background-color: #0071e3;
            color: white;
        }
        
        .card-button.secondary {
            background-color: #f5f5f7;
            color: #333;
            border: 1px solid #ddd;
        }
        
        .card-button:hover {
            opacity: 0.9;
            transform: translateY(-1px);
        }
        
        /* 画廊消息样式 */
        .gallery-container {
            width: 100%;
            max-width: 500px;
            position: relative;
            margin: 15px 0;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .gallery-nav {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 100%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            z-index: 2;
            pointer-events: none;
        }
        
        .gallery-arrow {
            width: 40px;
            height: 40px;
            display: flex;
            justify-content: center;
            align-items: center;
            background-color: rgba(255,255,255,0.8);
            border-radius: 50%;
            cursor: pointer;
            border: none;
            box-shadow: 0 2px 6px rgba(0,0,0,0.15);
            pointer-events: auto;
        }
        
        .gallery-arrow-left {
            margin-left: 10px;
        }
        
        .gallery-arrow-right {
            margin-right: 10px;
        }
        
        .gallery-items {
            position: relative;
            width: 100%;
            height: 300px;
        }
        
        .gallery-item {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0;
            transition: opacity 0.5s ease;
            display: none;
        }
        
        .gallery-item.active {
            opacity: 1;
            z-index: 1;
            display: block;
        }
        
        .gallery-image {
            width: 100%;
            height: 220px;
            object-fit: cover;
        }
        
        .gallery-item-content {
            padding: 15px;
            background-color: white;
            height: 80px;
        }
        
        .gallery-item-title {
            margin: 0 0 6px 0;
            font-size: 16px;
            font-weight: 600;
        }
        
        .gallery-item-description {
            font-size: 14px;
            color: #666;
            margin: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
        }
        
        .gallery-indicators {
            display: flex;
            justify-content: center;
            padding: 10px 0;
            background-color: white;
        }
        
        .gallery-indicator {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: #ddd;
            margin: 0 4px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .gallery-indicator.active {
            background-color: #0071e3;
            transform: scale(1.2);
        }
        
        /* 优化行程显示 */
        .itinerary-container {
            background-color: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 3px 10px rgba(0,0,0,0.08);
            margin: 12px 0;
            border: 1px solid #e8e8e8;
            width: 100%;
        }
        
        .itinerary-title {
            background-color: #0071e3;
            color: white;
            padding: 12px 16px;
            margin: 0;
            font-size: 18px;
            text-align: center;
        }
        
        .itinerary-overview {
            background-color: #f8f9fa;
            padding: 16px;
            border-bottom: 1px solid #eaeaea;
        }
        
        .section-title {
            margin-top: 0;
            margin-bottom: 12px;
            color: #333;
            font-size: 16px;
            font-weight: 600;
        }
        
        .overview-list {
            margin: 0;
            padding-left: 20px;
        }
        
        .overview-list li {
            margin-bottom: 8px;
        }
        
        .itinerary-days {
            padding: 16px;
        }
        
        .day-card {
            margin-bottom: 15px;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 6px rgba(0,0,0,0.06);
            border: 1px solid #eaeaea;
        }
        
        .day-title {
            background-color: #0071e3;
            color: white;
            padding: 10px 14px;
            font-weight: 600;
        }
        
        .day-content {
            padding: 8px 0;
            background-color: white;
        }
        
        .schedule-list {
            list-style: none;
            padding: 0 16px;
            margin: 0;
        }
        
        .schedule-list li {
            padding: 8px 0;
            border-bottom: 1px solid #f0f0f0;
            position: relative;
            padding-left: 0;
        }
        
        .schedule-list li:last-child {
            border-bottom: none;
        }
        
        .time-slot {
            color: #0071e3;
            font-weight: 600;
            display: inline-block;
            min-width: 80px;
        }
        
        .additional-info {
            padding: 16px;
            border-top: 1px solid #eaeaea;
            background-color: #f8f9fa;
        }
        
        .info-section {
            margin-bottom: 16px;
        }
        
        .info-section:last-child {
            margin-bottom: 0;
        }
        
        .info-list {
            margin: 0;
            padding-left: 20px;
        }
        
        .info-list li {
            margin-bottom: 6px;
        }
        
        /* 景点卡片 - 针对行程中的景点 */
        .attraction-card {
            display: flex;
            margin: 10px 0;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 6px rgba(0,0,0,0.08);
            background-color: white;
        }
        
        .attraction-image {
            width: 80px;
            height: 80px;
            object-fit: cover;
        }
        
        .attraction-content {
            flex: 1;
            padding: 10px;
        }
        
        .attraction-name {
            font-weight: 600;
            margin: 0 0 4px 0;
            font-size: 15px;
        }
        
        .attraction-info {
            font-size: 12px;
            color: #666;
            display: flex;
            align-items: center;
            margin-bottom: 4px;
        }
        
        .attraction-info i {
            margin-right: 5px;
            width: 14px;
            text-align: center;
        }
        
        /* 错误格式化显示 */
        .error-formatting {
            background-color: #fff8f8;
            border: 1px solid #ffdddd;
            border-radius: 8px;
            padding: 12px;
            margin: 10px 0;
        }
        
        .error-formatting pre {
            white-space: pre-wrap;
            font-family: monospace;
            font-size: 12px;
            background-color: #f9f9f9;
            padding: 10px;
            border-radius: 4px;
            max-height: 200px;
            overflow: auto;
        }
        
        /* 必填字段标记 */
        .required {
            color: #ff3b30;
            font-weight: bold;
        }
        
        /* 动画效果 */
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes pulseComplete {
            0% { box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
            50% { box-shadow: 0 2px 12px rgba(0,113,227,0.15); }
            100% { box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
        }
        
        .message-complete .message-content {
            animation: pulseComplete 0.8s ease;
        }
    `;
    
    document.head.appendChild(styleElement);
} 

// 导出关键函数到全局作用域
window.isTravelPlanQuery = isTravelPlanQuery;
window.createTravelPlanForm = createTravelPlanForm;
window.generateTravelPlan = generateTravelPlan;
window.formatItinerary = formatItinerary;
window.generateMockTravelPlan = generateMockTravelPlan;

// 导出聊天模块
window.ChatModule = {
    initChat,
    sendMessage,
    processUserMessage,
    addUserMessage,
    addBotMessage,
    generateTravelPlan,
    createTravelPlanForm,
    formatItinerary,
    MessageType
};

// 使用本地生成的模拟旅行计划
async function generateMockTravelPlan(tripData) {
    try {
        console.log('生成模拟旅行计划:', tripData);
        
        // 确保interests是数组
        if (!tripData.interests) {
            tripData.interests = ['文化历史'];
            console.log('No interests provided, defaulting to:', tripData.interests);
        } else if (typeof tripData.interests === 'string') {
            tripData.interests = [tripData.interests];
            console.log('Converted string interests to array:', tripData.interests);
        } else if (!Array.isArray(tripData.interests)) {
            console.warn('Invalid interests format, defaulting to default interests');
            tripData.interests = ['文化历史'];
        }
        
        console.log('处理后的interests数组:', tripData.interests);
        
        // 计算行程天数
        let duration = 3; // 默认3天
        if (tripData.startDate && tripData.endDate) {
            const start = new Date(tripData.startDate);
            const end = new Date(tripData.endDate);
            duration = Math.max(3, Math.ceil((end - start) / (1000 * 60 * 60 * 24))) || 3;
        }
        
        const destination = tripData.destination || '未知目的地';
        const travelers = tripData.travelers || 2;
        const budget = tripData.budget || '中等';
        const interests = tripData.interests.join('、');
        
        // 根据目的地选择不同的景点推荐
        let attractions = [];
        let accommodationTips = '';
        let foodTips = '';
        let transportationTips = '';
        
        switch (destination) {
            case '东京':
            case '日本':
            case '日本东京':
                attractions = ['浅草寺', '东京晴空塔', '明治神宫', '涩谷十字路口', '上野公园', '秋叶原电器街', '银座购物区'];
                accommodationTips = '东京住宿推荐：新宿、涩谷或银座地区的酒店，交通便利。也可考虑东京湾区的温泉酒店。';
                foodTips = '东京美食推荐：寿司、拉面、天妇罗、烤肉、居酒屋料理。推荐前往筑地市场品尝新鲜海鲜。';
                transportationTips = '交通提示：购买东京地铁通票，便于城市内通行。可使用SUICA或PASMO卡乘坐公共交通工具。';
                break;
                
            case '巴黎':
            case '法国':
            case '法国巴黎':
                attractions = ['埃菲尔铁塔', '卢浮宫', '凯旋门', '圣母院', '香榭丽舍大街', '蒙马特高地', '塞纳河'];
                accommodationTips = '巴黎住宿推荐：建议选择位于1-8区的酒店，靠近主要景点和地铁站。';
                foodTips = '巴黎美食推荐：法式可丽饼、牛排、鹅肝、马卡龙、红酒和各种奶酪。推荐体验正宗法式餐厅。';
                transportationTips = '交通提示：购买Paris Visite交通卡，可无限次乘坐地铁和公交。考虑使用Vélib自行车租赁系统游览市区。';
                break;
                
            case '纽约':
            case '美国':
            case '美国纽约':
                attractions = ['自由女神像', '中央公园', '帝国大厦', '时代广场', '大都会艺术博物馆', '布鲁克林大桥', '高线公园'];
                accommodationTips = '纽约住宿推荐：曼哈顿中城区域的酒店位置便利，但价格较高。布鲁克林区的精品酒店性价比较高。';
                foodTips = '纽约美食推荐：纽约披萨、百老汇热狗、贝果、芝士蛋糕和各国美食。推荐前往切尔西市场品尝多元化美食。';
                transportationTips = '交通提示：购买MetroCard使用地铁和公交系统。黄色出租车和Uber在曼哈顿随处可见。';
                break;
                
            case '北京':
            case '中国北京':
                attractions = ['故宫', '长城', '天安门广场', '颐和园', '天坛', '798艺术区', '南锣鼓巷'];
                accommodationTips = '北京住宿推荐：王府井、西单或三里屯地区的酒店，交通便利，靠近购物和餐饮区。';
                foodTips = '北京美食推荐：北京烤鸭、涮羊肉、炸酱面、豆汁、扒糕、爆肚。推荐前往簋街或南锣鼓巷品尝地道美食。';
                transportationTips = '交通提示：地铁是最便捷的交通工具，也可使用滴滴打车。建议提前购买景点门票避免排队。';
                break;
                
            default:
                attractions = ['当地著名景点1', '当地著名景点2', '当地著名景点3', '当地著名景点4', '当地著名景点5'];
                accommodationTips = '住宿推荐：建议选择市中心或靠近主要景点的酒店，交通便利。';
                foodTips = '美食推荐：尝试当地特色菜肴和街头小吃。';
                transportationTips = '交通提示：了解当地公共交通系统，考虑购买交通通票节省费用。';
        }
        
        // 生成每日行程
        let dailyItinerary = '';
        for (let day = 1; day <= duration; day++) {
            const dayAttractions = attractions.slice((day - 1) % attractions.length, day % attractions.length + 1);
            if (dayAttractions.length === 0) {
                dayAttractions.push(attractions[day % attractions.length]);
            }
            
            dailyItinerary += `第${day}天：\n`;
            dailyItinerary += `上午：参观${dayAttractions[0]}\n`;
            
            if (dayAttractions.length > 1) {
                dailyItinerary += `下午：游览${dayAttractions[1]}\n`;
            } else {
                dailyItinerary += `下午：自由活动，建议购物或休息\n`;
            }
            
            if (day === 1) {
                dailyItinerary += `晚上：品尝当地特色美食，适应时差\n\n`;
            } else if (day === duration) {
                dailyItinerary += `晚上：享用告别晚餐，准备返程\n\n`;
            } else {
                dailyItinerary += `晚上：体验当地夜生活或休息\n\n`;
            }
        }
        
        // 构建完整行程
        const itinerary = `
# ${destination}${duration}天行程规划

## 行程概览
- 目的地：${destination}
- 行程天数：${duration}天
- 人数：${travelers}人
- 预算：${budget}
- 特别兴趣：${interests}

## 详细行程
${dailyItinerary}

## 住宿推荐
${accommodationTips}

## 美食推荐
${foodTips}

## 交通指南
${transportationTips}

## 旅行小贴士
1. 提前查看天气预报，准备合适的衣物
2. 重要文件备份，保管好护照和贵重物品
3. 购买旅行保险，以防意外情况
4. 了解当地紧急联系电话和医疗服务信息
5. 尊重当地文化和习俗
        `;
        
        console.log('生成的模拟行程:', itinerary);
        
        // 返回包含itinerary属性的对象
        return {
            success: true,
            itinerary: itinerary,
            source: 'local'
        };
            } catch (error) {
        console.error('生成模拟旅行计划失败:', error);
        return {
            success: false,
            error: error.message,
            itinerary: `抱歉，无法生成${tripData.destination || '目的地'}的旅行计划。请稍后再试。`
        };
    }
}

function parseDayContent(dayContent, dayIndex) {
    console.log(`开始解析第${dayIndex + 1}天的内容`, dayContent.substring(0, 50) + '...');
    
    let html = `<div class="day-detail${dayIndex === 0 ? ' active' : ''}" data-day="${dayIndex + 1}">
        <div class="day-header">
            <h3>第${dayIndex + 1}天</h3>
            <button class="toggle-day-details" aria-expanded="true">
                <i class="fas fa-chevron-up"></i>
            </button>
        </div>
        <div class="day-content-wrapper">`;

    // 解析时间段
    const periods = ['上午', '下午', '晚上'];
    periods.forEach(period => {
        console.log(`尝试匹配${period}时段内容`);
        
        // 尝试多种可能的格式匹配
        let periodContent = '';
        let periodMatch;
        
        // 格式1: **上午(9:00-12:00)**: 参观东京国立博物馆
        periodMatch = dayContent.match(new RegExp(`\\*\\*${period}[^*]*\\*\\*[:：]\\s*(.+?)(?=\\*\\*|###|$)`, 's'));
        if (periodMatch) {
            periodContent = periodMatch[1].trim();
            console.log(`找到${period}内容(格式1):`, periodContent.substring(0, 30) + '...');
        }
        
        // 格式2: - **上午(9:00-12:00)**: 参观东京国立博物馆
        if (!periodContent) {
            periodMatch = dayContent.match(new RegExp(`[-•]\\s*\\*\\*${period}[^*]*\\*\\*[:：]\\s*(.+?)(?=\\n\\s*[-•]\\s*\\*\\*|###|$)`, 's'));
            if (periodMatch) {
                periodContent = periodMatch[1].trim();
                console.log(`找到${period}内容(格式2):`, periodContent.substring(0, 30) + '...');
            }
        }
        
        // 格式3: 上午: 参观东京国立博物馆
        if (!periodContent) {
            periodMatch = dayContent.match(new RegExp(`${period}[:：]\\s*(.+?)(?=\\n\\s*${periods.join('|')}|###|$)`, 's'));
            if (periodMatch) {
                periodContent = periodMatch[1].trim();
                console.log(`找到${period}内容(格式3):`, periodContent.substring(0, 30) + '...');
            }
        }

        html += `<div class="time-period">
            <div class="period-header">
                <span class="period-name">${period}</span>
                <button class="toggle-period-details" aria-expanded="true">
                    <i class="fas fa-chevron-up"></i>
                </button>
            </div>
            <div class="period-details">`;

        if (periodContent) {
            // 处理列表项
            // 首先检查是否有列表项标记
            if (periodContent.includes('-') || periodContent.includes('*') || periodContent.includes('•')) {
                const listItems = periodContent.split(/\n\s*[-•*]\s*/).filter(Boolean);
                if (listItems.length > 0) {
                    html += `<ul class="period-items">`;
                    listItems.forEach(item => {
                        const cleanItem = item.trim()
                            .replace(/^\*\*|\*\*$/g, '')  // 移除首尾的星号
                            .replace(/\n\s*/g, '<br>')    // 保留换行格式
                            .replace(/\*([^*]+)\*/g, '<em>$1</em>'); // 处理斜体
                        
                        if (cleanItem) {
                            // 检查是否包含地址、时间等信息
                            const parts = cleanItem.split(/[。；]\s*/);
                            if (parts.length > 1) {
                                html += `<li>
                                    <div class="activity-main">${parts[0]}</div>
                                    <div class="activity-details">
                                        ${parts.slice(1).map(p => `<div class="detail-item">${p}</div>`).join('')}
                                    </div>
                                </li>`;
                            } else {
                                html += `<li>${cleanItem}</li>`;
                            }
                        }
                    });
                    html += `</ul>`;
                } else {
                    html += `<p>${periodContent}</p>`;
                }
            } else {
                // 没有列表标记，作为普通文本处理
                html += `<p>${periodContent}</p>`;
            }
        } else {
            html += `<p class="no-content">暂无${period}行程安排</p>`;
        }

        html += `</div></div>`;
    });

    // 添加当日交通和美食信息
    const transportMatch = dayContent.match(/今日交通[:：]\s*(.+?)(?=\n|$)/im);
    const foodMatch = dayContent.match(/今日美食推荐[:：]\s*(.+?)(?=\n|$)/im);

    html += `<div class="day-info-footer">`;
    if (transportMatch) {
        html += `<div class="transport-info">
            <i class="fas fa-bus"></i>
            <strong>交通:</strong> ${transportMatch[1].trim()}
        </div>`;
    }
    if (foodMatch) {
        html += `<div class="food-info">
            <i class="fas fa-utensils"></i>
            <strong>美食:</strong> ${foodMatch[1].trim()}
        </div>`;
    }
    html += `</div>`;

    html += `</div></div>`;
    return html;
}

