/**
 * 行程验证与补全模块
 * 用于检查API返回的行程内容是否完整，并在必要时进行补充
 */

// 行程完整性验证配置
const ITINERARY_REQUIREMENTS = {
    sections: {
        overview: {
            required: true,
            name: "行程概览",
            patterns: [/##?\s*行程概览/, /##?\s*旅行概览/]
        },
        dailyPlan: {
            required: true,
            name: "详细行程",
            patterns: [/##?\s*详细行程/, /##?\s*每日行程/]
        },
        accommodation: {
            required: true,
            name: "住宿推荐",
            patterns: [/##?\s*住宿推荐/, /##?\s*住宿建议/]
        },
        food: {
            required: true,
            name: "美食推荐",
            patterns: [/##?\s*美食推荐/, /##?\s*餐饮建议/]
        },
        transportation: {
            required: true,
            name: "交通指南",
            patterns: [/##?\s*交通指南/, /##?\s*交通建议/]
        },
        tips: {
            required: true,
            name: "旅行小贴士",
            patterns: [/##?\s*旅行小贴士/, /##?\s*旅游贴士/]
        },
        budget: {
            required: false,
            name: "预算估算",
            patterns: [/##?\s*预算估算/, /##?\s*费用估算/]
        }
    },
    dailyRequirements: {
        morning: {
            required: true,
            patterns: [/上午/, /早上/, /早晨/]
        },
        afternoon: {
            required: true,
            patterns: [/下午/]
        },
        evening: {
            required: true,
            patterns: [/晚上/, /傍晚/, /夜晚/]
        },
        specificActivities: {
            required: true, // 不能有"自由活动"等模糊表述
            forbidden: [/自由活动/, /自由安排/, /自由探索/, /自由游览/]
        }
    }
};

/**
 * 验证行程内容是否完整
 * @param {string} itinerary - API返回的行程内容
 * @param {Object} tripData - 行程基本信息
 * @returns {Object} - 验证结果
 */
function validateItinerary(itinerary, tripData) {
    console.log('开始验证行程完整性');
    
    if (!itinerary || typeof itinerary !== 'string') {
        return {
            valid: false,
            issues: ['行程内容为空或格式不正确'],
            itinerary: itinerary
        };
    }
    
    const issues = [];
    const sections = {};
    let hasSectionIssues = false;
    
    // 1. 检查必要的行程部分是否存在
    for (const [key, section] of Object.entries(ITINERARY_REQUIREMENTS.sections)) {
        const found = section.patterns.some(pattern => pattern.test(itinerary));
        sections[key] = found;
        
        if (section.required && !found) {
            issues.push(`缺少"${section.name}"部分`);
            hasSectionIssues = true;
        }
    }
    
    // 2. 检查每日行程
    const duration = tripData.duration || 0;
    const foundDays = [];
    const dayIssues = [];
    
    // 查找所有日期标记
    const dayMatches = itinerary.match(/###?\s*第\d+天|第\d+天|Day\s*\d+/gi) || [];
    dayMatches.forEach(dayMatch => {
        const dayNum = dayMatch.match(/\d+/);
        if (dayNum) {
            foundDays.push(parseInt(dayNum[0]));
        }
    });
    
    // 检查是否所有天数都有对应行程
    for (let day = 1; day <= duration; day++) {
        if (!foundDays.includes(day)) {
            dayIssues.push(`缺少第${day}天的行程安排`);
        }
    }
    
    if (dayIssues.length > 0) {
        issues.push(...dayIssues);
    }
    
    // 3. 详细检查每天的行程内容
    if (sections.dailyPlan) {
        // 提取每天行程部分
        const dailyPlanSection = extractSection(itinerary, ITINERARY_REQUIREMENTS.sections.dailyPlan.patterns);
        if (dailyPlanSection) {
            for (let day = 1; day <= duration; day++) {
                const dayContent = extractDay(dailyPlanSection, day);
                
                if (dayContent) {
                    // 检查每个时间段
                    for (const [timeKey, timeReq] of Object.entries(ITINERARY_REQUIREMENTS.dailyRequirements)) {
                        if (timeKey === 'specificActivities') continue; // 这是特殊检查项
                        
                        const hasTimeSlot = timeReq.patterns.some(pattern => pattern.test(dayContent));
                        if (timeReq.required && !hasTimeSlot) {
                            issues.push(`第${day}天缺少${timeReq.patterns[0].source}的活动安排`);
                        }
                    }
                    
                    // 检查是否有模糊表述
                    const hasForbiddenTerms = ITINERARY_REQUIREMENTS.dailyRequirements.specificActivities.forbidden.some(
                        pattern => pattern.test(dayContent)
                    );
                    
                    if (hasForbiddenTerms) {
                        issues.push(`第${day}天包含模糊表述(如"自由活动")，应提供具体建议`);
                    }
                }
            }
        }
    }
    
    // 判断验证结果
    const isValid = issues.length === 0;
    
    return {
        valid: isValid,
        issues: issues,
        sections: sections,
        itinerary: itinerary
    };
}

/**
 * 补全行程内容中缺失的部分
 * @param {Object} validationResult - 验证结果
 * @param {Object} tripData - 行程基本信息
 * @returns {string} - 补全后的行程内容
 */
function completeItinerary(validationResult, tripData) {
    console.log('开始补全行程内容', tripData);
    
    if (validationResult.valid) {
        console.log('行程内容已完整，无需补全');
        return validationResult.itinerary;
    }
    
    let itinerary = validationResult.itinerary || '';
    
    // 提取行程总天数
    const duration = tripData.duration || 0;
    console.log(`行程总天数: ${duration}天`);
    
    // 1. 补全缺失的部分
    if (!validationResult.sections.overview) {
        const overview = generateOverview(tripData);
        itinerary = overview + '\n\n' + itinerary;
    }
    
    // 2. 确保行程有详细行程部分
    if (!validationResult.sections.dailyPlan) {
        const dailyPlans = generateDailyPlans(tripData);
        
        // 寻找合适的位置插入每日行程
        if (itinerary.includes('## 住宿推荐')) {
            itinerary = itinerary.replace(/## 住宿推荐/, `## 详细行程\n${dailyPlans}\n\n## 住宿推荐`);
        } else {
            itinerary += `\n\n## 详细行程\n${dailyPlans}`;
        }
    }
    // 3. 针对已有但不完整的每日行程进行补全
    else {
        let updatedItinerary = itinerary;
        // 提取详细行程部分
        const dailyPlanSection = extractSection(itinerary, ITINERARY_REQUIREMENTS.sections.dailyPlan.patterns);
        
        if (dailyPlanSection) {
            let updatedDailySection = dailyPlanSection;
            
            // 查找当前已有的天数
            const existingDays = [];
            const dayMatches = dailyPlanSection.match(/###?\s*第(\d+)天|第(\d+)天/g) || [];
            dayMatches.forEach(dayMatch => {
                const dayNum = dayMatch.match(/\d+/);
                if (dayNum) {
                    existingDays.push(parseInt(dayNum[0]));
                }
            });
            
            // 排序并去重当前已有的天数
            const uniqueExistingDays = [...new Set(existingDays)].sort((a, b) => a - b);
            console.log('已有天数:', uniqueExistingDays);
            
            // 补全或修复每一天的内容
            for (let day = 1; day <= duration; day++) {
                // 检查该天是否存在
                const dayContent = extractDay(dailyPlanSection, day);
                
                if (dayContent) {
                    // 该天存在，但可能缺少时间段
                    console.log(`检查第${day}天的内容完整性`);
                    let updatedDayContent = dayContent;
                    
                    // 检查每个时间段并补全
                    for (const [timeKey, timeReq] of Object.entries(ITINERARY_REQUIREMENTS.dailyRequirements)) {
                        if (timeKey === 'specificActivities') continue; // 这是特殊检查项
                        
                        const hasTimeSlot = timeReq.patterns.some(pattern => pattern.test(dayContent));
                        if (timeReq.required && !hasTimeSlot) {
                            console.log(`第${day}天缺少${timeReq.patterns[0].source}时间段，进行补全`);
                            
                            // 根据时间段补全内容
                            const timeSlotContent = generateTimeSlotContent(timeKey, day, tripData, getDestinationAttractions(tripData.destination));
                            
                            // 插入补全内容到适当位置
                            if (updatedDayContent.includes('### 第' + day + '天') || updatedDayContent.includes('## 第' + day + '天')) {
                                // 在标题之后添加
                                updatedDayContent = updatedDayContent.replace(/(###?\s*第\d+天.*?)(\n|$)/, `$1\n\n${timeSlotContent}$2`);
                            } else {
                                // 在内容末尾添加
                                updatedDayContent += `\n\n${timeSlotContent}`;
                            }
                        }
                    }
                    
                    // 检查是否有模糊表述并替换
                    const hasForbiddenTerms = ITINERARY_REQUIREMENTS.dailyRequirements.specificActivities.forbidden.some(
                        pattern => pattern.test(dayContent)
                    );
                    
                    if (hasForbiddenTerms) {
                        console.log(`第${day}天包含模糊表述，替换为具体建议`);
                        // 替换模糊表述
                        ITINERARY_REQUIREMENTS.dailyRequirements.specificActivities.forbidden.forEach(pattern => {
                            if (pattern.test(updatedDayContent)) {
                                const specificActivity = generateSpecificActivity(tripData, getDestinationAttractions(tripData.destination), day);
                                updatedDayContent = updatedDayContent.replace(pattern, specificActivity);
                            }
                        });
                    }
                    
                    // 如果内容有更新，替换原内容
                    if (updatedDayContent !== dayContent) {
                        console.log(`更新第${day}天的内容`);
                        const dayPattern = new RegExp(`(###?\\s*第${day}天[\\s\\S]*?)((?=###?\\s*第\\d+天)|$)`, 'i');
                        updatedDailySection = updatedDailySection.replace(dayPattern, updatedDayContent);
                    }
                }
                else {
                    // 该天不存在，需要创建完整的一天行程
                    console.log(`缺少第${day}天的内容，创建完整日程`);
                    const newDayContent = generateCompleteDayContent(day, tripData, getDestinationAttractions(tripData.destination));
                    
                    // 查找合适的位置添加
                    if (day === 1 || uniqueExistingDays.length === 0) {
                        // 第一天或者没有任何天数，添加到详细行程部分开头
                        updatedDailySection = updatedDailySection.replace(
                            /(##?\s*详细行程[\s\S]*?)(\s*###?\s*第\d+天|\s*$)/i,
                            `$1\n\n${newDayContent}$2`
                        );
                    } else {
                        // 非第一天，找到最接近的前一天
                        let insertAfterDay = 0;
                        for (const existingDay of uniqueExistingDays) {
                            if (existingDay < day && existingDay > insertAfterDay) {
                                insertAfterDay = existingDay;
                            }
                        }
                        
                        if (insertAfterDay > 0) {
                            // 找到前一天后面插入
                            const prevDayPattern = new RegExp(`(###?\\s*第${insertAfterDay}天[\\s\\S]*?)((?=###?\\s*第\\d+天)|$)`, 'i');
                            const hasPrevDay = prevDayPattern.test(updatedDailySection);
                            
                            if (hasPrevDay) {
                                updatedDailySection = updatedDailySection.replace(prevDayPattern, `$1\n\n${newDayContent}`);
                            } else {
                                // 如果找不到前一天，添加到详细行程部分末尾
                                updatedDailySection += `\n\n${newDayContent}`;
                            }
                        } else {
                            // 找不到合适的位置，添加到末尾
                            updatedDailySection += `\n\n${newDayContent}`;
                        }
                    }
                    
                    // 更新已有天数列表
                    uniqueExistingDays.push(day);
                    uniqueExistingDays.sort((a, b) => a - b);
                }
            }
            
            // 更新整个行程的详细行程部分
            updatedItinerary = itinerary.replace(dailyPlanSection, updatedDailySection);
        }
        
        itinerary = updatedItinerary;
    }
    
    // 4. 补全其他缺失的部分
    if (!validationResult.sections.accommodation) {
        itinerary += `\n\n## 住宿推荐\n${generateAccommodation(tripData)}`;
    }
    
    if (!validationResult.sections.food) {
        itinerary += `\n\n## 美食推荐\n${generateFood(tripData)}`;
    }
    
    if (!validationResult.sections.transportation) {
        itinerary += `\n\n## 交通指南\n${generateTransportation(tripData)}`;
    }
    
    if (!validationResult.sections.tips) {
        itinerary += `\n\n## 旅行小贴士\n${generateTips(tripData)}`;
    }
    
    if (!validationResult.sections.budget && ITINERARY_REQUIREMENTS.sections.budget.required) {
        itinerary += `\n\n## 预算估算\n${generateBudget(tripData)}`;
    }
    
    console.log('行程补全完成');
    return itinerary;
}

// 辅助函数
/**
 * 从文本中提取特定部分
 * @param {string} text - 源文本
 * @param {Array<RegExp>} patterns - 查找模式
 * @returns {string|null} - 提取的内容或null
 */
function extractSection(text, patterns) {
    for (const pattern of patterns) {
        const match = text.match(new RegExp(`${pattern.source}[\\s\\S]*?(?=\\n##|$)`, 'i'));
        if (match) {
            return match[0];
        }
    }
    return null;
}

/**
 * 提取特定天的行程内容
 * @param {string} dailyPlanSection - 每日行程部分
 * @param {number} day - 天数
 * @returns {string|null} - 该天的行程内容
 */
function extractDay(dailyPlanSection, day) {
    const patterns = [
        new RegExp(`###?\\s*第${day}天[\\s\\S]*?(?=\\n###?|$)`, 'i'),
        new RegExp(`第${day}天[\\s\\S]*?(?=\\n第\\d+天|$)`, 'i'),
        new RegExp(`Day\\s*${day}[\\s\\S]*?(?=\\nDay\\s*\\d+|$)`, 'i')
    ];
    
    for (const pattern of patterns) {
        const match = dailyPlanSection.match(pattern);
        if (match) {
            return match[0];
        }
    }
    return null;
}

/**
 * 生成行程概览
 * @param {Object} tripData - 行程基本信息
 * @returns {string} - 生成的概览内容
 */
function generateOverview(tripData) {
    const destination = tripData.destination || '未知目的地';
    const duration = tripData.duration || 7;
    const travelers = tripData.travelers || 1;
    const budget = tripData.budget || '中等';
    const interests = Array.isArray(tripData.interests) ? tripData.interests.join('、') : tripData.interests || '文化历史';
    
    return `# ${destination}${duration}天旅行计划\n\n## 行程概览\n- 目的地: ${destination}\n- 行程天数: ${duration}天\n- 人数: ${travelers}人\n- 预算: ${budget}\n- 特别兴趣: ${interests}`;
}

/**
 * 生成每日行程
 * @param {Object} tripData - 行程基本信息
 * @returns {string} - 生成的每日行程内容
 */
function generateDailyPlans(tripData) {
    const destination = tripData.destination || '未知目的地';
    const duration = tripData.duration || 7;
    const budget = tripData.budget || '中等';
    
    let plans = '';
    
    // 根据目的地生成推荐景点库
    const attractions = getDestinationAttractions(destination);
    
    for (let day = 1; day <= duration; day++) {
        // 为每天分配不同的景点
        const morningAttractionIndex = (day - 1) % attractions.attractions.length;
        const afternoonAttractionIndex = (day % attractions.attractions.length !== morningAttractionIndex) 
            ? (day % attractions.attractions.length) 
            : ((day + 1) % attractions.attractions.length);
        
        const morningAttraction = attractions.attractions[morningAttractionIndex];
        const afternoonAttraction = attractions.attractions[afternoonAttractionIndex];
        
        plans += `### 第${day}天\n\n`;
        plans += `- **上午(9:00-12:00)**: 参观${morningAttraction}\n`;
        plans += `  * ${attractions.activities[morningAttractionIndex] || ''}，建议游览2-3小时，可以了解当地的历史文化和自然风光。\n`;
        plans += `  * 游览时间: 约2小时\n`;
        plans += `  * 交通建议: 乘坐公共交通到达\n\n`;
        
        plans += `- **下午(13:00-17:00)**: 游览${afternoonAttraction}\n`;
        plans += `  * ${attractions.activities[afternoonAttractionIndex] || ''}，建议游览约2小时，随后可以在附近的商业区休息片刻。\n`;
        plans += `  * 游览时间: 约2.5小时\n`;
        plans += `  * 交通建议: 从上午景点乘坐公交约20分钟可到达\n\n`;
        
        // 为每天生成不同的晚上活动
        let eveningActivity;
        if (day === 1) {
            eveningActivity = `品尝当地特色美食，适应时差`;
        } else if (day === duration) {
            eveningActivity = `享用告别晚餐，整理行装准备返程`;
        } else {
            const activities = [
                `${destination}特色餐厅晚餐，尝试当地美食`,
                `参观当地夜市，体验民间文化`,
                `欣赏当地传统表演或艺术活动`,
                `在酒店附近散步，感受当地夜景`,
                `品尝当地特色小吃`
            ];
            eveningActivity = activities[(day - 1) % activities.length];
        }
        
        plans += `- **晚上(18:00-21:00)**: ${eveningActivity}\n`;
        plans += `  * 地点: 距离下午景点步行10分钟\n`;
        plans += `  * 价格: ${budget === '经济实惠' ? '人均150-300元' : '人均300-600元'}\n\n`;
    }
    
    return plans;
}

/**
 * 获取特定目的地的景点信息
 * @param {string} destination - 目的地名称
 * @returns {Object} - 目的地景点数组和特色活动
 */
function getDestinationAttractions(destination) {
    let attractions = [];
    let activities = [];
    let foods = [];
    
    // 根据目的地返回不同的景点和活动
    switch(destination.toLowerCase()) {
        case '日本':
        case '东京':
            attractions = [
                '东京塔', '浅草寺', '明治神宫', '新宿御苑', '上野公园', 
                '皇居东御苑', '涩谷十字路口', '六本木之丘', '台场海滨公园',
                '秋叶原电器街', '银座', '东京迪士尼乐园', '富士山'
            ];
            activities = [
                '体验日式温泉', '参加茶道仪式', '穿和服漫步', '观看相扑比赛',
                '学习寿司制作', '赏樱/赏枫', '参观动漫博物馆', '乘坐新干线',
                '体验居酒屋文化', '泡东京咖啡馆'
            ];
            foods = [
                '寿司', '拉面', '天妇罗', '烤肉', '章鱼烧', '大阪烧', 
                '荞麦面', '乌冬面', '咖喱饭', '铁板烧', '和牛'
            ];
            break;
        case '中国':
        case '北京':
            attractions = [
                '故宫博物院', '颐和园', '天坛公园', '八达岭长城', '圆明园',
                '北海公园', '国家博物馆', '798艺术区', '南锣鼓巷', '鸟巢',
                '水立方', '景山公园', '恭王府花园'
            ];
            activities = [
                '品茶文化体验', '京剧表演欣赏', '胡同游览', '皇家园林漫步',
                '四合院参观', '烤鸭制作体验', '太极拳学习', '夜游什刹海',
                '爬长城', '逛王府井'
            ];
            foods = [
                '北京烤鸭', '炸酱面', '豆汁', '爆肚', '涮羊肉', '豆腐脑',
                '驴打滚', '艾窝窝', '卤煮火烧', '糖葫芦'
            ];
            break;
        case '法国':
        case '巴黎':
            attractions = [
                '埃菲尔铁塔', '卢浮宫', '凯旋门', '巴黎圣母院', '凡尔赛宫',
                '蒙马特高地', '奥赛博物馆', '协和广场', '卢森堡公园',
                '塞纳河', '杜乐丽花园', '先贤祠', '红磨坊'
            ];
            activities = [
                '塞纳河游船', '品酒体验', '学做可颂', '巴黎咖啡馆体验',
                '时装街区购物', '参观艺术画廊', '城市夜景观赏', '巴黎歌剧院欣赏表演',
                '花神咖啡馆文化体验', '参观小众博物馆'
            ];
            foods = [
                '法式可颂', '法棍面包', '马卡龙', '焦糖布丁', '法式蜗牛',
                '鹅肝酱', '牛排薯条', '法式奶酪', '可丽饼', '法式洋葱汤',
                '蓝带鸡肉'
            ];
            break;
        case '美国':
        case '纽约':
            attractions = [
                '自由女神像', '中央公园', '帝国大厦', '时代广场', '布鲁克林大桥',
                '第五大道', '现代艺术博物馆', '大都会艺术博物馆', '洛克菲勒中心',
                '华尔街', '高线公园', '9/11纪念馆', '百老汇'
            ];
            activities = [
                '百老汇观剧', '顶层露台观景', '中央公园野餐', '博物馆巡游',
                '乘坐直升机游览', '参观联合国总部', '纽约公共图书馆参观',
                '品尝多元美食', '纽约夜景巡游', '参加体育赛事'
            ];
            foods = [
                '纽约披萨', '百吉饼', '热狗', '芝士蛋糕', '牛排',
                '龙虾卷', '早餐煎饼', '意式美食', '中国城点心', '街边小吃',
                '精酿啤酒'
            ];
            break;
        case '泰国':
        case '曼谷':
            attractions = [
                '大皇宫', '卧佛寺', '郑王庙', '考山路', '洽图洽周末市场',
                '暹罗广场', '湄南河', '泰国国家博物馆', '拉差达火车夜市',
                '四面佛', '素可泰古城', '丹嫩沙多水上市场', '安帕瓦水上市场'
            ];
            activities = [
                '传统泰式按摩', '泰式料理烹饪课', '水上市场游览', '泰拳表演',
                '水灯节体验', '传统长尾船游览', '泰式传统舞蹈学习', '热带水果品尝',
                '清迈夜间动物园', '海岛浮潜'
            ];
            foods = [
                '冬阴功汤', '泰式炒河粉', '绿咖喱', '芒果糯米饭', '泰式炒饭',
                '泰式春卷', '椰香咖喱蟹', '泰式烤鸡', '榴莲糯米饭', '泰式奶茶',
                '水果冰沙'
            ];
            break;
        case '澳大利亚':
        case '悉尼':
            attractions = [
                '悉尼歌剧院', '悉尼海港大桥', '邦迪海滩', '皇家植物园',
                '达令港', '塔隆加动物园', '蓝山国家公园', '悉尼鱼市场',
                '悉尼塔', '库克船长登陆点', '悉尼水族馆', '曼利海滩',
                '悉尼国家公园'
            ];
            activities = [
                '攀登海港大桥', '冲浪体验', '野生动物园探访', '澳洲农场体验',
                '葡萄酒品尝之旅', '悉尼港游船', '观看海豚表演', '澳洲土著文化体验',
                '大堡礁浮潜', '热气球之旅'
            ];
            foods = [
                '澳洲牛排', '海鲜拼盘', '袋鼠肉', '鳄鱼肉', '澳洲派',
                '薰衣草冰淇淋', '蜂蜜蛋糕', '澳洲奶酪', '维吉麦特', '澳洲咖啡',
                '澳洲葡萄酒'
            ];
            break;
        default:
            // 通用景点和活动
            attractions = [
                '中心广场', '历史博物馆', '艺术博物馆', '国家公园', '文化中心',
                '历史古迹', '中央市场', '购物中心', '主题公园', '著名海滩',
                '历史街区', '古城区', '风景区'
            ];
            activities = [
                '当地导览游', '特色美食品尝', '传统工艺体验', '手工艺品制作',
                '风景摄影', '日落/日出观赏', '传统表演欣赏', '当地节日体验',
                '特色店铺购物', '夜景游览'
            ];
            foods = [
                '当地特色菜', '传统小吃', '特色甜点', '地方风味菜', '知名餐厅',
                '街头美食', '海鲜大餐', '农家菜', '国宴菜系', '米制品',
                '面点小吃'
            ];
    }
    
    return {
        attractions: attractions,
        activities: activities,
        foods: foods
    };
}

/**
 * 生成住宿推荐
 * @param {Object} tripData - 行程基本信息
 * @returns {string} - 生成的住宿推荐内容
 */
function generateAccommodation(tripData) {
    const destination = tripData.destination || '未知目的地';
    
    // 根据目的地返回不同的住宿建议
    if (destination.includes('日本') || destination.includes('东京')) {
        return `- **豪华选择**: 东京安达仕酒店(Andaz Tokyo)或东京丽思卡尔顿酒店，位于市中心，设施一流\n- **中档选择**: 新宿地区的京王广场酒店，交通便利，服务优质\n- **经济选择**: 涩谷或上野地区的商务酒店如东横INN，干净舒适价格合理`;
    } else if (destination.includes('巴黎') || destination.includes('法国')) {
        return `- **豪华选择**: 巴黎丽兹酒店或巴黎四季酒店，位于市中心，提供顶级服务\n- **中档选择**: 巴黎歌剧院附近的酒店，交通便利，设施完善\n- **经济选择**: 拉丁区的精品酒店或青年旅舍，价格实惠`;
    } else {
        return `- **豪华选择**: ${destination}市中心五星级酒店，提供优质服务和便利位置\n- **中档选择**: 交通便利区域的四星级酒店，性价比高\n- **经济选择**: 干净舒适的商务酒店或精品旅馆，价格实惠`;
    }
}

/**
 * 生成美食推荐
 * @param {Object} tripData - 行程基本信息
 * @returns {string} - 生成的美食推荐内容
 */
function generateFood(tripData) {
    const destination = tripData.destination || '未知目的地';
    
    // 根据目的地返回不同的美食建议
    if (destination.includes('日本') || destination.includes('东京')) {
        return `- 必尝美食：寿司、拉面、天妇罗、烤肉、居酒屋料理\n- 推荐前往筑地市场品尝新鲜海鲜\n- 新宿思出横丁的小店，体验地道日本酒馆文化`;
    } else if (destination.includes('巴黎') || destination.includes('法国')) {
        return `- 经典法式料理：牛排、鹅肝、焗蜗牛、法式奶酪\n- 甜点推荐：马卡龙、可颂、闪电泡芙\n- 推荐在圣米歇尔区的咖啡馆享用正宗法式早餐`;
    } else {
        return `- 推荐尝试${destination}的当地特色美食\n- 可以在当地市场购买新鲜食材\n- 尝试当地街头小吃，体验真实的本地风味`;
    }
}

/**
 * 生成交通指南
 * @param {Object} tripData - 行程基本信息
 * @returns {string} - 生成的交通指南内容
 */
function generateTransportation(tripData) {
    const destination = tripData.destination || '未知目的地';
    
    // 根据目的地返回不同的交通建议
    if (destination.includes('日本') || destination.includes('东京')) {
        return `- **市区交通卡**: 购买西瓜卡(Suica)或PASMO卡，可用于地铁、公交和便利店\n- **地铁系统**: 东京地铁网络发达，建议下载东京地铁APP查询路线\n- **JR山手线**: 环绕东京主要区域，是连接各大景点的便捷选择`;
    } else if (destination.includes('巴黎') || destination.includes('法国')) {
        return `- **地铁与公交**: 购买Paris Visite卡或Navigo周卡，可无限次乘坐公共交通\n- **出租车**: 在指定站点乘坐，巴黎出租车起步价较高\n- **自行车租赁**: Vélib自行车系统覆盖全城，是观光的好选择`;
    } else {
        return `- 了解${destination}的公共交通系统，选择合适的交通卡\n- 主要景点之间考虑使用公共交通，节省时间和金钱\n- 偏远景点可能需要包车或参加当地一日游`;
    }
}

/**
 * 生成旅行小贴士
 * @param {Object} tripData - 行程基本信息
 * @returns {string} - 生成的旅行小贴士内容
 */
function generateTips(tripData) {
    const destination = tripData.destination || '未知目的地';
    
    // 通用小贴士
    let tips = `1. 提前查看天气预报，准备适合的衣物\n2. 保管好护照和贵重物品\n3. 建议购买旅行保险\n4. 保存紧急联系电话\n5. 尊重当地文化和习俗`;
    
    // 根据目的地添加特定贴士
    if (destination.includes('日本') || destination.includes('东京')) {
        tips += `\n6. 日本社会非常注重礼节，请遵守公共场所规则\n7. 大部分场所可以使用信用卡，但仍建议随身携带现金\n8. 退税需在购物达到5000日元以上，并出示护照`;
    } else if (destination.includes('巴黎') || destination.includes('法国')) {
        tips += `\n6. 法国人习惯用法语交流，学几句简单法语会有帮助\n7. 巴黎部分区域晚上不宜单独行动\n8. 小费文化:餐厅通常已包含服务费，可额外留小费表示满意`;
    }
    
    return tips;
}

/**
 * 生成预算估算
 * @param {Object} tripData - 行程基本信息
 * @returns {string} - 生成的预算估算内容
 */
function generateBudget(tripData) {
    const destination = tripData.destination || '未知目的地';
    const budget = tripData.budget || '中等';
    const duration = tripData.duration || 7;
    
    let budgetEstimation;
    
    if (budget === '经济实惠') {
        budgetEstimation = `- **住宿**: 每晚300-600元人民币\n- **餐饮**: 每人每天150-300元人民币\n- **交通**: 约500元人民币(不含国际机票)\n- **门票**: 约800元人民币\n- **购物**: 视个人情况而定`;
    } else if (budget === '豪华') {
        budgetEstimation = `- **住宿**: 每晚1500元人民币以上\n- **餐饮**: 每人每天500元人民币以上\n- **交通**: 约1500元人民币(不含国际机票)\n- **门票**: 约1200元人民币(含特色体验)\n- **购物**: 视个人情况而定`;
    } else { // 中等
        budgetEstimation = `- **住宿**: 每晚600-1200元人民币\n- **餐饮**: 每人每天300-500元人民币\n- **交通**: 约1000元人民币(不含国际机票)\n- **门票**: 约1000元人民币\n- **购物**: 视个人情况而定`;
    }
    
    // 添加总预算
    let totalBudget;
    if (budget === '经济实惠') {
        totalBudget = 1000 * duration + 1300;
    } else if (budget === '豪华') {
        totalBudget = 2500 * duration + 2700;
    } else { // 中等
        totalBudget = 1800 * duration + 2000;
    }
    
    budgetEstimation += `\n\n**${duration}天总预算估算**: 约${totalBudget}元人民币/人(不含国际机票)`;
    
    return budgetEstimation;
}

/**
 * 生成特定时间段的内容
 * @param {string} timeSlot - 时间段 (morning/afternoon/evening)
 * @param {number} day - 天数
 * @param {Object} tripData - 行程基本信息
 * @param {Object} destinationInfo - 目的地特色信息
 * @returns {string} - 生成的内容
 */
function generateTimeSlotContent(timeSlot, day, tripData, destinationInfo) {
    const destination = tripData.destination;
    const attractions = destinationInfo.attractions || [];
    const activities = destinationInfo.activities || [];
    
    // 根据天数挑选合适的景点或活动
    const index = (day - 1) % attractions.length;
    const nextIndex = (index + 1) % attractions.length;
    
    let timeTitle = '';
    let timeRange = '';
    let content = '';
    
    switch(timeSlot) {
        case 'morning':
            timeTitle = '上午';
            timeRange = '(9:00-12:00)';
            if (attractions[index]) {
                content = `参观${attractions[index]}。这里是${destination}的标志性景点，建议游览2-3小时，可以了解当地的历史文化和自然风光。`;
            }
            break;
        case 'afternoon':
            timeTitle = '下午';
            timeRange = '(13:00-17:00)';
            if (attractions[nextIndex]) {
                content = `前往${attractions[nextIndex]}。这个地方以其独特的${tripData.interests[0] || '文化'}特色而闻名，游览约2小时，随后可以在附近的商业区休息片刻。`;
            }
            break;
        case 'evening':
            timeTitle = '晚上';
            timeRange = '(18:00-21:00)';
            if (activities[index % activities.length]) {
                content = `${activities[index % activities.length]}。晚餐后可以欣赏当地夜景或参加有特色的夜间文化活动。`;
            }
            break;
    }
    
    return `**${timeTitle}${timeRange}**: ${content}`;
}

/**
 * 生成具体活动替代模糊表述
 * @param {Object} tripData - 行程信息
 * @param {Object} destinationInfo - 目的地特色信息
 * @param {number} day - 天数
 * @returns {string} - 具体活动描述
 */
function generateSpecificActivity(tripData, destinationInfo, day) {
    const activities = destinationInfo.activities || [];
    const foods = destinationInfo.foods || [];
    
    // 根据天数和时间生成不同的具体活动
    const activityIndex = (day - 1) % activities.length;
    const foodIndex = (day - 1) % foods.length;
    
    return `参观${destinationInfo.attractions[activityIndex % destinationInfo.attractions.length] || '当地景点'}，体验${activities[activityIndex] || '当地特色活动'}，品尝${foods[foodIndex] || '当地美食'}`;
}

/**
 * 生成完整的一天行程内容
 * @param {number} day - 天数
 * @param {Object} tripData - 行程信息
 * @param {Object} destinationInfo - 目的地特色信息
 * @returns {string} - 完整的一天行程
 */
function generateCompleteDayContent(day, tripData, destinationInfo) {
    const morningContent = generateTimeSlotContent('morning', day, tripData, destinationInfo);
    const afternoonContent = generateTimeSlotContent('afternoon', day, tripData, destinationInfo);
    const eveningContent = generateTimeSlotContent('evening', day, tripData, destinationInfo);
    
    const foodIndex = (day - 1) % destinationInfo.foods.length;
    const food = destinationInfo.foods[foodIndex] || '当地特色美食';
    
    const transportationOptions = ['公交', '地铁', '出租车', '步行', '电车'];
    const transportation = transportationOptions[day % transportationOptions.length];
    
    return `### 第${day}天\n\n${morningContent}\n\n${afternoonContent}\n\n${eveningContent}\n\n**今日美食推荐**: ${food}\n\n**今日交通**: 建议使用${transportation}前往各景点`;
}

// 导出模块方法
window.ItineraryValidator = {
    validateItinerary,
    completeItinerary,
    ITINERARY_REQUIREMENTS
}; 