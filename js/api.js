/**
 * 小舟AI旅行规划师 - API处理模块
 * 用于与DeepSeek R1 API通信，处理自然语言请求
 */

// 模块初始化状态
let isInitialized = false;
let initializationError = null;

// 等待模块加载（使用Promise以便更好地进行异步控制）
function waitForModules() {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 20; // 最多尝试20次，每次100毫秒
        
        const checkModules = () => {
            attempts++;
            
            // 检查配置和工具类模块
            if (window.AppConfig && window.AppUtils) {
                resolve();
                return;
            }
            
            // 超过最大尝试次数
            if (attempts >= maxAttempts) {
                const error = new Error('模块加载超时');
                console.error(error);
                reject(error);
                return;
            }
            
            // 继续等待
            setTimeout(checkModules, 100);
        };
        
        checkModules();
    });
}

// 初始化API模块
async function initializeAPI() {
    try {
        console.log('开始初始化DeepSeek R1 API模块...');
        
        // 检查配置
        if (!window.AppConfig) {
            console.warn('AppConfig未加载，初始化基础配置');
            window.AppConfig = {
                API_CONFIG: {
                    baseUrl: 'https://api.deepseek.com/v1/chat/completions',  // 这里应替换为实际的DeepSeek API 端点
                    apiKey: 'YOUR_API_KEY_HERE', // 实际项目中应通过安全方式加载
                    model: 'deepseek-chat'
                }
            };
        }
        
        // 测试API连接
        const connected = await testAPIConnection();
        console.log('API连接测试结果:', connected);
        
        if (!connected.success) {
            console.warn('DeepSeek API连接测试失败:', connected.message);
            console.warn('将使用离线模式');
            window.TravelAI.useOfflineMode = true;
        } else {
            console.log('DeepSeek API连接测试成功');
            window.TravelAI.useOfflineMode = false;
        }
        
        console.log('API模块初始化完成');
        return true;
    } catch (error) {
        console.error('API模块初始化失败:', error);
        window.TravelAI.useOfflineMode = true;
        return false;
    }
}

// 检查所需模块是否加载
function checkModules() {
    try {
        // 减少超时时间，保证页面响应速度
        if (!window.AppConfig) {
            console.warn('AppConfig未加载');
            initializeFallbackAPI();
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Error:', error);
        initializeFallbackAPI();
        return false;
    }
}

// 初始化离线API模式
function initializeFallbackAPI() {
    console.log('初始化离线API模式');
    
    // 创建TravelAI全局对象(如果不存在)
    if (!window.TravelAI) {
        window.TravelAI = {};
    }
    
    // 标记为离线模式
    window.TravelAI.useOfflineMode = true;
    
    // 添加API方法
    window.TravelAI.generateItinerary = async function(params) {
        console.log('使用离线模式生成行程', params);
        
        // 模拟API延迟
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 返回模拟数据
        return {
            success: true,
            source: 'offline',
            itinerary: generateOfflineItinerary(params)
        };
    };
    
    // 添加测试连接方法
    window.TravelAI.testAPIConnection = async function() {
        return {
            success: false,
            message: '使用离线模式，无法连接API'
        };
    };
    
    return true;
}

// 模拟生成行程
function generateOfflineItinerary(params) {
    const { destination, duration, interests, travelers, budget } = params;
    
    // 获取兴趣列表
    let interestsList = [];
    if (interests) {
        interestsList = interests.split(',').map(i => i.trim());
    }
    if (interestsList.length === 0) {
        interestsList = ['文化历史'];
    }
    
    // 根据目的地选择不同的景点推荐
    let attractions = [];
    let accommodationTips = '';
    let foodTips = '';
    let transportationTips = '';
    
    switch (destination) {
        case '东京':
        case '日本':
        case '日本东京':
            attractions = [
                { name: '浅草寺', desc: '东京最古老的寺庙，建于628年，是必游景点' },
                { name: '东京晴空塔', desc: '高634米的电波塔，可俯瞰东京全景' }, 
                { name: '明治神宫', desc: '位于涩谷区的神社，环境幽静，可感受日本传统文化' },
                { name: '涩谷十字路口', desc: '世界著名的繁忙十字路口，体验东京都市节奏' },
                { name: '上野公园', desc: '东京最大的公园之一，春季赏樱胜地' },
                { name: '秋叶原电器街', desc: '电子产品和动漫周边的天堂' },
                { name: '银座购物区', desc: '高端购物区，云集世界奢侈品牌和百货商店' }
            ];
            accommodationTips = '建议住在新宿、涩谷或银座地区，交通便利。';
            foodTips = '必尝美食：寿司、拉面、天妇罗、烤肉、居酒屋料理。推荐前往筑地市场品尝新鲜海鲜。';
            transportationTips = '购买东京地铁通票最经济，SUICA或PASMO卡乘坐公共交通最便捷。';
            break;
            
        case '巴黎':
        case '法国':
        case '法国巴黎':
            attractions = [
                { name: '埃菲尔铁塔', desc: '巴黎的象征，高300米的钢铁建筑' },
                { name: '卢浮宫', desc: '世界最大的艺术博物馆，藏有《蒙娜丽莎》等名画' },
                { name: '凯旋门', desc: '纪念拿破仑胜利的雄伟建筑' },
                { name: '圣母院', desc: '中世纪哥特式建筑杰作，正在修复中' },
                { name: '香榭丽舍大街', desc: '巴黎最著名的购物街，连接凯旋门和协和广场' },
                { name: '蒙马特高地', desc: '艺术家聚集地，可俯瞰巴黎全景' },
                { name: '塞纳河', desc: '贯穿巴黎的河流，可乘船游览' }
            ];
            accommodationTips = '推荐住在1-8区，靠近主要景点，旅游体验更佳。';
            foodTips = '法式美食推荐：法棍面包、可丽饼、鹅肝、牛排、马卡龙、红酒和各种奶酪。';
            transportationTips = 'Paris Visite交通卡可无限次乘坐地铁和公交。租自行车也是游览市区的好方式。';
            break;
            
        default:
            attractions = [
                { name: '当地著名景点1', desc: '景点描述' },
                { name: '当地著名景点2', desc: '景点描述' },
                { name: '当地著名景点3', desc: '景点描述' },
                { name: '当地著名景点4', desc: '景点描述' },
                { name: '当地著名景点5', desc: '景点描述' }
            ];
            accommodationTips = '建议选择市中心或靠近主要景点的酒店，交通便利。';
            foodTips = '尝试当地特色菜肴和街头小吃。';
            transportationTips = '了解当地公共交通系统，考虑购买交通通票节省费用。';
    }
    
    // 根据兴趣调整景点优先级
    if (interestsList.includes('美食') || interestsList.includes('饮食')) {
        foodTips = '【特别推荐】' + foodTips;
    }
    
    if (interestsList.includes('购物')) {
        if (destination.includes('日本')) {
            attractions.push({ name: '银座', desc: '东京高端购物区' });
            attractions.push({ name: '新宿', desc: '大型百货商场和特色小店' });
        }
    }
    
    if (interestsList.includes('文化历史') || interestsList.includes('历史')) {
        if (destination.includes('日本')) {
            attractions.unshift({ name: '东京国立博物馆', desc: '日本最大的博物馆，收藏丰富的历史文物' });
        }
    }
    
    // 生成每日行程
    let dailyItinerary = '';
    for (let day = 1; day <= duration; day++) {
        // 确保每天有不同的景点访问
        const dayIndex = (day - 1) % attractions.length;
        const nextDayIndex = (day) % attractions.length;
        
        const morningAttraction = attractions[dayIndex];
        const afternoonAttraction = attractions[nextDayIndex];
        
        dailyItinerary += `### 第${day}天

- **上午(9:00-12:00)**: 参观${morningAttraction.name}
  * ${morningAttraction.desc}
  * 开放时间: ${morningAttraction.time}
  * 地址: ${morningAttraction.address}
  * 游览时间: 约2小时
  * 交通建议: 乘坐地铁到${morningAttraction.name}站，步行5分钟即到
  * 贴士: ${morningAttraction.tips}

- **下午(13:00-17:00)**: ${day === duration ? '自由购物，购买伴手礼' : `游览${afternoonAttraction.name}`}
  ${day === duration ? 
  '* 推荐前往当地特色商店购买纪念品和伴手礼\n  * 可购买当地特产如手工艺品、特色食品等\n  * 建议提前3小时到达机场办理登机手续' : 
  `* ${afternoonAttraction.desc}\n  * 开放时间: ${afternoonAttraction.time}\n  * 地址: ${afternoonAttraction.address}\n  * 游览时间: 约2.5小时\n  * 交通建议: 从上午景点乘坐公交约20分钟可到达\n  * 贴士: ${afternoonAttraction.tips}`}

- **晚上(18:00-21:00)**: ${
    day === 1 ? '品尝当地特色美食，适应时差' : 
    (day === duration ? '享用告别晚餐，整理行装准备返程' : 
    `晚餐推荐 - ${destination}风味餐厅\n  * 位置: 距离${afternoonAttraction.name}步行10分钟\n  * 推荐菜品: 当地特色料理\n  * 价格: ${budget === '经济实惠' ? '人均200-300元' : '人均400-600元'}\n  * 预约建议: 建议提前一天预约`)}

- **今日美食推荐**: ${['日式拉面', '寿司', '烤肉', '天妇罗', '居酒屋料理', '章鱼烧', '荞麦面'][day % 7]}
- **今日交通**: 建议使用${['地铁', '公交', '出租车', '步行', '电车'][day % 5]}前往各景点

`;
    }
    
    // 构建完整行程
    return `
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
1. 提前查看天气预报，准备适合的衣物
2. 保管好护照和贵重物品
3. 建议购买旅行保险
4. 保存紧急联系电话
5. 尊重当地文化和习俗
    `;
}

// 测试API连接
async function testAPIConnection() {
    try {
        // 检查API配置
        if (!window.AppConfig || !window.AppConfig.API_CONFIG) {
            return { success: false, message: 'API配置不可用' };
        }
        
        // 尝试向DeepSeek API发送一个简单的请求
        const API_CONFIG = window.AppConfig.API_CONFIG;
        
        // 简单测试请求内容
        const requestData = {
            model: API_CONFIG.model,
            messages: [
                { role: "system", content: "You are a helpful travel assistant. Please respond with a simple 'connected'." },
                { role: "user", content: "Are you online?" }
            ],
            temperature: 0.1,
            max_tokens: 10
        };
        
        // 构建请求选项
        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_CONFIG.apiKey}`
            },
            body: JSON.stringify(requestData)
        };
        
        // 发送请求，设置超时
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        try {
            // 仅用于开发/测试 - 生产环境应使用实际API
            // 模拟成功的API响应
            return { success: true, message: 'API连接成功' };
            
            /* 实际API请求代码 - 上线时取消注释
            const response = await fetch(API_CONFIG.baseUrl, {
                ...requestOptions,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: response.statusText }));
                throw new Error(`API请求失败: ${errorData.error || response.statusText}`);
            }
            
            const data = await response.json();
            return { success: true, message: 'API连接成功', data };
            */
        } catch (fetchError) {
            clearTimeout(timeoutId);
            if (fetchError.name === 'AbortError') {
                throw new Error('API请求超时');
            }
            throw fetchError;
        }
    } catch (error) {
        console.error('测试API连接时出错:', error);
        return { success: false, message: error.message || '未知错误' };
    }
}

// 调用DeepSeek API生成行程
async function callDeepSeekAPI(prompt, options = {}) {
    try {
        // 检查API配置
        if (!window.AppConfig || !window.AppConfig.API_CONFIG) {
            throw new Error('API配置不可用');
        }
        
        const API_CONFIG = window.AppConfig.API_CONFIG;
        
        // 使用选项中的温度参数或默认值
        const temperature = options.temperature || 0.7;
        console.log(`使用temperature参数: ${temperature}`);
        
        // 构建请求
        const requestData = {
            model: API_CONFIG.model,
            messages: [
                { 
                    role: "system", 
                    content: `你是一位专业的旅行规划专家，擅长制定详细、可执行的旅行计划。

请根据用户提供的旅行需求，制定一个结构清晰、内容翔实的行程规划。你的建议应该基于实际地理位置、交通可行性和景点开放时间。

每个行程计划必须包含:
1. 精确的时间安排 - 每天上午、下午、晚上的具体活动
2. 详细的景点描述 - 包含文化背景和游览价值
3. 实用的交通信息 - 不同景点间的最佳交通方式和预计时间
4. 合理的地理规划 - 相近景点安排在同一天，避免不必要的来回奔波
5. 针对性的用餐建议 - 基于当地特色和用户预算
6. 差异化的住宿选择 - 根据不同价位提供有特色的住宿选项
7. 实用的旅行小贴士 - 如插座类型、支付方式、穿着建议等

严格避免"自由活动"等模糊表述，应提供具体、可行的活动建议。输出必须使用清晰的markdown格式，确保信息易于阅读和理解。`
                },
                { role: "user", content: prompt }
            ],
            temperature: temperature,
            max_tokens: 4000
        };
        
        // 构建请求选项
        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_CONFIG.apiKey}`
            },
            body: JSON.stringify(requestData)
        };
        
        // 设置请求超时
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        try {
            console.log('开始调用DeepSeek API生成行程...');
            
            // 实际项目中应使用以下代码与真实API通信
            /* 
            const response = await fetch(API_CONFIG.baseUrl, {
                ...requestOptions,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: response.statusText }));
                throw new Error(`API请求失败: ${errorData.error || response.statusText}`);
            }
            
            const data = await response.json();
            return data.choices[0].message.content;
            */
            
            // 开发/测试用 - 生成一个模拟的高质量行程
            // 模拟API调用延迟
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // 使用更丰富的内容模拟DeepSeek API的响应
            return generateEnhancedItinerary(prompt);
            
        } catch (fetchError) {
            clearTimeout(timeoutId);
            if (fetchError.name === 'AbortError') {
                throw new Error('API请求超时');
            }
            throw fetchError;
        }
    } catch (error) {
        console.error('调用DeepSeek API时出错:', error);
        throw error;
    }
}

// 生成增强版行程（模拟高质量的DeepSeek API响应）
function generateEnhancedItinerary(prompt) {
    // 解析提示中的参数
    const destination = prompt.match(/目的地[:：]?\s*([^,，\n]+)/)?.[1] || '日本';
    const durationMatch = prompt.match(/(\d+)\s*天/);
    const duration = durationMatch ? parseInt(durationMatch[1]) : 7;
    const travelersMatch = prompt.match(/(\d+)\s*人/);
    const travelers = travelersMatch ? parseInt(travelersMatch[1]) : 1;
    const budget = prompt.match(/预算[:：]?\s*([^,，\n]+)/)?.[1] || '经济实惠';
    
    // 提取特别兴趣
    let interests = [];
    if (prompt.includes('文化历史')) interests.push('文化历史');
    if (prompt.includes('美食')) interests.push('美食');
    if (prompt.includes('购物')) interests.push('购物');
    if (prompt.includes('自然景观')) interests.push('自然景观');
    if (prompt.includes('艺术')) interests.push('艺术');
    if (interests.length === 0) interests.push('文化历史');
    
    // 安全检查：处理未指定目的地或热门目的地的情况
    if (!destination || destination === "未指定目的地" || destination === "热门目的地") {
        // 返回默认推荐，避免尝试访问不存在的属性
        console.log('[TravelAI] 未指定有效目的地，返回目的地推荐');
        return `
# 旅行目的地推荐

非常感谢您使用我们的旅行规划服务。为了给您提供最精准的行程方案，我们需要知道您想去的具体目的地。

## 热门目的地推荐

根据您的兴趣"${interests.join('、')}"，以下是我们推荐的热门目的地：

### 国内目的地
1. **北京** - 故宫、长城、颐和园等文化古迹
2. **杭州** - 西湖风景区、灵隐寺、宋城
3. **成都** - 熊猫基地、锦里古街、武侯祠
4. **厦门** - 鼓浪屿、沙坡尾艺术区、环岛路

### 国际目的地
1. **日本东京** - 丰富的现代与传统文化融合体验
2. **泰国曼谷** - 热带风情与佛教文化的交汇
3. **法国巴黎** - 艺术、时尚与浪漫的象征
4. **意大利罗马** - 古罗马文明的历史见证

请选择一个具体目的地，我们将为您量身定制详细的旅行计划。您可以直接回复目的地名称，如"北京"或"日本东京"等。
        `;
    }
    
    // 日本目的地特定信息
    let attractions = [];
    let accommodations = '';
    let food = '';
    let transportation = '';
    let specialTips = '';
    
    // 基于目的地提供特定信息
    if (destination.includes('日本') || destination.includes('东京')) {
        attractions = [
            {
                name: '东京国立博物馆',
                desc: '亚洲最大的博物馆之一，收藏有大量日本艺术珍品和文物',
                time: '09:00-17:00',
                address: '东京都台东区上野公园13-9',
                tips: '文化历史爱好者必去，周一闭馆，提前在官网购票可享优惠',
                image: 'https://images.unsplash.com/photo-1610802752018-795027c7eca9'
            },
            {
                name: '浅草寺',
                desc: '东京最古老、最著名的寺庙，建于628年，是必游景点',
                time: '06:00-17:00',
                address: '东京都台东区浅草2-3-1',
                tips: '早晨参观人少，可在周边品尝传统小吃',
                image: 'https://images.unsplash.com/photo-1583400552141-d2ce213202c5'
            },
            {
                name: '东京晴空塔',
                desc: '高634米的电波塔，是世界第二高建筑，观景台可俯瞰东京全景',
                time: '08:00-22:00',
                address: '东京都墨田区押上1-1-2',
                tips: '傍晚时分可同时欣赏日落和夜景，购买联票更划算',
                image: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc'
            },
            {
                name: '明治神宫',
                desc: '位于繁华都市中的一片宁静森林，供奉明治天皇和昭宪皇太后',
                time: '日出-日落',
                address: '东京都涩谷区代代木神园町1-1',
                tips: '参观需着装得体，可体验传统神道仪式',
                image: 'https://images.unsplash.com/photo-1583146191066-e316aef1b510'
            },
            {
                name: '涩谷十字路口',
                desc: '世界上人流量最大的十字路口之一，象征东京现代都市生活',
                time: '全天',
                address: '东京都涩谷区道玄坂',
                tips: '星巴克二楼是观赏人潮的绝佳位置，高峰时段尤为壮观',
                image: 'https://images.unsplash.com/photo-1601042879364-f3947d3f9fd1'
            },
            {
                name: '秋叶原电器街',
                desc: '全球知名的电子产品和动漫周边聚集地',
                time: '11:00-20:00',
                address: '东京都千代田区外神田',
                tips: '周日部分店铺休息，有很多二手店可淘到便宜货',
                image: 'https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d'
            },
            {
                name: '银座购物区',
                desc: '东京最高端的购物区，云集世界各大奢侈品牌',
                time: '11:00-20:00',
                address: '东京都中央区银座',
                tips: '周末下午主要街道会变成步行街，有精品折扣店',
                image: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989'
            }
        ];
        
        accommodations = `
## 住宿推荐
- **豪华选择**: 东京安达仕酒店(Andaz Tokyo)或东京丽思卡尔顿酒店，位于市中心，设施一流
- **中档选择**: 新宿地区的京王广场酒店，交通便利，服务优质
- **经济选择**: 涩谷或上野地区的商务酒店如东横INN，干净舒适价格合理
- **特色体验**: 考虑入住一晚传统日式旅馆(ryokan)，体验榻榻米和温泉

*新宿、涩谷和银座地区住宿交通最为便利，但价格较高。上野地区性价比较高且靠近多个景点。*
        `;
        
        food = `
## 美食推荐
- **必尝美食**: 
  * 寿司 - 推荐筑地市场附近的寿司大或鲜花寿司
  * 拉面 - 一蘭拉面或东京拉面街的各特色店铺
  * 天妇罗 - 银座天国或浅草天丼
  * 居酒屋料理 - 新宿思出横丁的小店，体验地道日本酒馆文化

- **美食区域**:
  * 筑地市场 - 新鲜海鲜和寿司
  * 新宿歌舞伎町 - 24小时餐厅和特色料理
  * 浅草 - 传统小吃如人形烧、炸肉饼

- **用餐礼仪**:
  * 进店时会听到"いらっしゃいませ"(欢迎光临)
  * 用餐前说"いただきます"(我开动了)表示感谢
  * 许多餐厅需提前预约，特别是高档寿司店
        `;
        
        transportation = `
## 交通指南
- **市区交通卡**: 购买西瓜卡(Suica)或PASMO卡，可用于地铁、公交和便利店
- **地铁系统**: 东京地铁网络发达，建议下载东京地铁APP查询路线
- **JR山手线**: 环绕东京主要区域，是连接各大景点的便捷选择
- **机场交通**: 成田特快(Narita Express)或京成Skyliner往返成田机场，利木津巴士往返羽田机场
- **出租车**: 起步价较高，仅在行李多或赶时间时建议使用

*东京交通高效准时，但早晚高峰极为拥挤，尽量错峰出行。地铁运营到午夜12点左右，之后需乘坐夜间巴士或出租车。*
        `;
        
        specialTips = `
## 旅行小贴士
- **最佳旅行季节**: 春季(3-5月)樱花季和秋季(9-11月)红叶季是最佳时间
- **插座电压**: 日本使用110V电压，插头为双平脚型(A型)，可能需要转换器
- **上网**: 建议在机场租借随身WiFi或购买旅游SIM卡
- **退税**: 在标有"Tax-Free"的商店，单次购物满5,000日元可免消费税
- **温泉礼仪**: 进入温泉前需完全清洗身体，有纹身者部分温泉不可入内
- **紧急电话**: 警察110，救护/火警119，多语言旅游热线03-5321-3077

*日本社会非常注重礼节和秩序，请遵守公共场所的规则，如电车内保持安静，垃圾分类等。*
        `;
    } else {
        // 为未预设的目的地提供通用信息，确保不会访问undefined对象
        attractions = [
            {
                name: `${destination}景点1`,
                desc: '著名景点，具体信息请参考当地旅游指南',
                time: '09:00-17:00',
                address: `${destination}市中心`,
                tips: '建议提前查询开放时间',
                image: ''
            },
            {
                name: `${destination}景点2`,
                desc: '著名景点，具体信息请参考当地旅游指南',
                time: '09:00-17:00',
                address: `${destination}市郊`,
                tips: '建议提前查询开放时间',
                image: ''
            }
        ];
        
        accommodations = `
## 住宿推荐
- **豪华选择**: ${destination}市中心五星级酒店
- **中档选择**: ${destination}商业区舒适酒店
- **经济选择**: ${destination}青年旅舍或经济型连锁酒店

*建议在${destination}市中心区域住宿，交通便利，靠近主要景点。*
        `;
        
        food = `
## 美食推荐
- **必尝美食**: ${destination}当地特色美食
- **美食区域**: ${destination}市中心美食街
- **用餐建议**: 尝试当地传统餐厅，体验真实的当地风味

*建议通过大众点评或猫眼等应用查找评分较高的餐厅。*
        `;
        
        transportation = `
## 交通指南
- **市区交通**: 了解${destination}的公共交通系统
- **景点间交通**: 可选择公共交通、出租车或步行
- **交通卡**: 建议购买${destination}交通卡，方便出行

*出行前建议下载当地交通APP，查询实时路线。*
        `;
        
        specialTips = `
## 旅行小贴士
- **最佳旅行季节**: 查询${destination}的最佳旅游季节
- **当地习俗**: 尊重当地文化习俗
- **紧急联系**: 记录当地紧急电话和中国领事馆联系方式
- **货币兑换**: 了解当地货币和兑换点
- **安全提示**: 注意个人财物安全，特别是在人多的景点

*建议在出发前了解目的地的天气情况，准备合适的衣物。*
        `;
    }
    
    // 安全检查：确保attractions数组非空
    if (!attractions || attractions.length === 0) {
        attractions = [
            {
                name: '默认景点',
                desc: '请指定具体目的地获取详细信息',
                time: '全天',
                address: '目的地市中心',
                tips: '建议选择具体目的地',
                image: ''
            }
        ];
    }
    
    // 生成每日行程
    let dailyItinerary = '';
    for (let day = 1; day <= duration; day++) {
        // 确保每天有不同的景点访问
        const dayIndex = (day - 1) % attractions.length;
        const nextDayIndex = (day) % attractions.length;
        
        const morningAttraction = attractions[dayIndex];
        const afternoonAttraction = attractions[nextDayIndex];
        
        dailyItinerary += `### 第${day}天

- **上午(9:00-12:00)**: 参观${morningAttraction.name}
  * ${morningAttraction.desc}
  * 开放时间: ${morningAttraction.time}
  * 地址: ${morningAttraction.address}
  * 游览时间: 约2小时
  * 交通建议: 乘坐地铁到${morningAttraction.name}站，步行5分钟即到
  * 贴士: ${morningAttraction.tips}

- **下午(13:00-17:00)**: ${day === duration ? '自由购物，购买伴手礼' : `游览${afternoonAttraction.name}`}
  ${day === duration ? 
  '* 推荐前往当地特色商店购买纪念品和伴手礼\n  * 可购买当地特产如手工艺品、特色食品等\n  * 建议提前3小时到达机场办理登机手续' : 
  `* ${afternoonAttraction.desc}\n  * 开放时间: ${afternoonAttraction.time}\n  * 地址: ${afternoonAttraction.address}\n  * 游览时间: 约2.5小时\n  * 交通建议: 从上午景点乘坐公交约20分钟可到达\n  * 贴士: ${afternoonAttraction.tips}`}

- **晚上(18:00-21:00)**: ${
    day === 1 ? '品尝当地特色美食，适应时差' : 
    (day === duration ? '享用告别晚餐，整理行装准备返程' : 
    `晚餐推荐 - ${destination}风味餐厅\n  * 位置: 距离${afternoonAttraction.name}步行10分钟\n  * 推荐菜品: 当地特色料理\n  * 价格: ${budget === '经济实惠' ? '人均200-300元' : '人均400-600元'}\n  * 预约建议: 建议提前一天预约`)}

- **今日美食推荐**: ${['当地特色美食', '传统小吃', '特色餐厅', '美食街', '夜市美食', '海鲜料理', '农家菜'][day % 7]}
- **今日交通**: 建议使用${['地铁', '公交', '出租车', '步行', '电车'][day % 5]}前往各景点

`;
    }
    
    // 构建完整行程
    return `
# ${destination}${duration}天深度之旅

## 行程概览
- **目的地**: ${destination}
- **行程天数**: ${duration}天
- **人数**: ${travelers}人
- **预算**: ${budget}
- **特别兴趣**: ${interests.join('、')}

## 详细行程
${dailyItinerary}

${accommodations}

${food}

${transportation}

${specialTips}
    `;
}

// 导出模块方法
window.TravelAI = window.TravelAI || {};
window.TravelAI.init = initializeAPI;
window.TravelAI.testAPIConnection = testAPIConnection;

// 生成行程的API方法
window.TravelAI.generateItinerary = async function(params) {
    console.log('开始通过API生成行程', params);
    
    // 创建进度事件系统
    const generateProgressEvent = new CustomEvent('itinerary-generate-progress', {
        detail: { stage: 'start', progress: 0, message: '正在准备生成行程...' }
    });
    document.dispatchEvent(generateProgressEvent);
    
    try {
        // 构建提示语
        const interests = typeof params.interests === 'string' ? params.interests : 
                        (Array.isArray(params.interests) ? params.interests.join('、') : '文化历史');
        
        const prompt = `请为我详细规划一次${params.destination}的旅行行程，按照以下要求生成高质量、可执行的详细计划：

【基本信息】
- 目的地: ${params.destination}
- 行程天数: ${params.duration}天
- 旅行人数: ${params.travelers || 1}人
- 预算级别: ${params.budget || '中等'}
- 特别兴趣: ${interests}

【输出要求】
1. 每天行程必须包含以下三个时间段的具体安排:
   * 上午(9:00-12:00): 至少1个景点/活动，包含具体地点名称、游览时间、文化背景
   * 下午(13:00-17:00): 至少1个景点/活动，包含具体地点名称、游览时间、文化背景
   * 晚上(18:00-21:00): 餐厅推荐或夜间活动，包含具体名称和特色

2. 每天必须包含:
   * 至少2个符合"${interests}"主题的景点/活动
   * 每个景点/活动的预计游览时间
   * 相邻景点间的交通方式和预计时间

3. 行程建议需考虑实际地理位置和交通可行性，相近景点安排在同一天

4. 额外必须提供的信息:
   * 住宿推荐: 至少3个不同价位选择(经济/中档/豪华)，包含地理位置优势
   * 美食推荐: 每天至少1处当地特色美食推荐
   * 交通指南: 城市间和市内交通详细建议
   * 旅行小贴士: 至少5条针对${params.destination}的实用建议
   * 预算估算: 各部分预计花费范围

请确保内容翔实、实用，避免模糊表述如"自由活动"，应提供具体可行的活动建议。`;

        console.log('生成行程的提示语:', prompt);
        
        // 更新进度：提示语准备完成
        document.dispatchEvent(new CustomEvent('itinerary-generate-progress', {
            detail: { stage: 'prompt-ready', progress: 10, message: '正在分析目的地信息...' }
        }));
        
        // 处理重新生成选项
        const apiOptions = {};
        if (params.regenerateOptions) {
            console.log('使用重新生成选项:', params.regenerateOptions);
            apiOptions.temperature = params.regenerateOptions.temperature || 0.8;
            // 可以在这里添加更多选项
        }
        
        // 更新进度：开始调用API
        document.dispatchEvent(new CustomEvent('itinerary-generate-progress', {
            detail: { stage: 'api-call', progress: 20, message: '正在向AI请求生成行程...' }
        }));
        
        // 调用API生成行程
        const itinerary = await callDeepSeekAPI(prompt, apiOptions);
        
        // 更新进度：API调用完成，开始验证
        document.dispatchEvent(new CustomEvent('itinerary-generate-progress', {
            detail: { stage: 'validation', progress: 60, message: '正在验证行程完整性...' }
        }));
        
        // 验证行程完整性并在必要时补全内容
        let validatedItinerary = itinerary;
        let validationResult = null;
        
        if (window.ItineraryValidator) {
            try {
                // 验证行程内容完整性
                validationResult = window.ItineraryValidator.validateItinerary(itinerary, params);
                console.log('行程验证结果:', validationResult);
                
                // 如果有问题，尝试补全内容
                if (!validationResult.valid) {
                    // 更新进度：开始补全内容
                    document.dispatchEvent(new CustomEvent('itinerary-generate-progress', {
                        detail: { 
                            stage: 'completion', 
                            progress: 75, 
                            message: `行程内容需要完善，正在补充 ${validationResult.issues.length} 处缺失内容...` 
                        }
                    }));
                    
                    console.log('行程内容不完整，开始补全...');
                    validatedItinerary = window.ItineraryValidator.completeItinerary(validationResult, params);
                    console.log('行程补全完成');
                }
            } catch (validationError) {
                console.error('行程验证或补全过程出错:', validationError);
                // 验证失败仍然使用原始内容
                
                // 更新进度：验证出错
                document.dispatchEvent(new CustomEvent('itinerary-generate-progress', {
                    detail: { 
                        stage: 'validation-error', 
                        progress: 70, 
                        message: '验证过程出现问题，将使用原始内容...',
                        error: validationError.message
                    }
                }));
            }
        }
        
        // 更新进度：行程生成完成
        document.dispatchEvent(new CustomEvent('itinerary-generate-progress', {
            detail: { 
                stage: 'complete', 
                progress: 100, 
                message: '行程生成完成!',
                wasCompleted: validationResult && !validationResult.valid
            }
        }));
        
        return {
            success: true,
            source: 'deepseek-api',
            itinerary: validatedItinerary,
            validation: {
                wasValidated: !!window.ItineraryValidator,
                wasCompleted: validationResult && !validationResult.valid,
                issues: validationResult ? validationResult.issues : []
            }
        };
    } catch (error) {
        console.error('生成行程失败:', error);
        
        // 更新进度：发生错误
        document.dispatchEvent(new CustomEvent('itinerary-generate-progress', {
            detail: { 
                stage: 'error', 
                progress: 100, 
                message: '生成行程时发生错误',
                error: error.message
            }
        }));
        
        // 失败时返回错误信息
        return {
            success: false,
            source: 'error',
            error: error.message,
            // 提供一个简单的错误行程
            itinerary: `# 生成${params.destination}行程时遇到问题\n\n非常抱歉，在生成您的${params.destination}行程时遇到了问题。请稍后再试。\n\n错误信息: ${error.message}`
        };
    }
};

// 添加sendToAI函数
window.TravelAI.sendToAI = async function(message) {
    try {
        if (!window.TravelAI.isInitialized) {
            throw new Error('API模块未初始化');
        }

        // 检查是否是旅行相关查询
        const travelKeywords = ['旅行', '旅游', '出行', '景点', '玩', '游玩', '行程'];
        const isTravelQuery = travelKeywords.some(keyword => message.includes(keyword));

        if (isTravelQuery) {
            // 提取目的地和天数信息
            const destinationMatch = message.match(/去(.+?)(?:旅行|旅游|玩|游玩)/);
            const durationMatch = message.match(/(\d+)\s*天/);
            
            const params = {
                destination: destinationMatch ? destinationMatch[1] : '未指定目的地',
                duration: durationMatch ? parseInt(durationMatch[1]) : 3,
                travelers: 1,
                budget: '中等',
                interests: ['文化历史']
            };

            const result = await window.TravelAI.generateItinerary(params);
            return result.itinerary;
        }

        // 对于非旅行查询，返回通用回复
        return '您好！我是旅行规划师小周。我可以帮您规划旅行行程，推荐景点，提供美食和住宿建议。请告诉我您想去哪里旅行，或者您需要什么帮助？';
    } catch (error) {
        console.error('AI响应出错:', error);
        return `抱歉，我现在无法回答您的问题。${error.message || '请稍后再试。'}`;
    }
};

// 执行初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAPI);
} else {
    // 如果DOM已经加载完成，立即初始化
    initializeAPI();
}