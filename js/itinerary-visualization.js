/**
 * 行程可视化整合模块
 * 集成地图和时间轴组件，实现两者的联动展示
 */

class ItineraryVisualization {
    /**
     * 初始化行程可视化
     * @param {Object} options - 配置选项
     */
    constructor(options = {}) {
        this.options = {
            mapContainerId: 'map-container',
            timelineContainerId: 'timeline-container',
            ...options
        };
        
        // 初始化组件
        this.map = null;
        this.timeline = null;
        this.itineraryData = null;
        this.currentDay = 0;
        this.locationService = null;
        this.initialized = false;
        
        // 初始化事件处理器
        this.eventHandlers = {};

        // 初始化偏好管理器
        this.preferences = new window.AppUtils.PreferencesManager();
        
        // 初始化Tab管理器
        this.tabManager = new window.TabManager();
        
        this.init().catch(error => {
            console.error('[ItineraryVisualization] Initialization failed:', error);
        });
    }
    
    /**
     * 初始化可视化组件
     * @returns {Promise<boolean>} 初始化结果
     */
    async init() {
        try {
            console.log('[ItineraryVisualization] Starting initialization...');
            
            // 初始化地图
            this.map = new MapIntegration(this.options.mapContainerId);
            if (!this.map) {
                throw new Error('Failed to initialize map');
            }
            
            // 初始化时间线
            this.timeline = new ItineraryTimeline(this.options.timelineContainerId, {
                itemHeight: 80,
                spacing: 20,
                showTime: true
            });
            
            if (!this.timeline) {
                throw new Error('Failed to initialize timeline');
            }
            
            // 恢复用户偏好设置
            this.restorePreferences();
            
            // 绑定组件间的交互
            this.bindInteractions();
            
            // 绑定Tab事件
            this.bindTabEvents();
            
            console.log('[ItineraryVisualization] Initialization completed successfully');
            this.initialized = true;
            return true;
        } catch (error) {
            console.error('[ItineraryVisualization] Initialization error:', error);
            throw error;
        }
    }
    
    bindInteractions() {
        // 时间线项目点击事件
        if (this.timeline) {
            this.timeline.on('itemClick', (item) => {
                if (item.location) {
                    this.map.setCenter(item.location);
                }
            });
        }
        
        // 地图标记点击事件由MapIntegration内部处理
    }
    
    /**
     * 设置行程数据
     * @param {Object} data - 行程数据
     * @returns {boolean} 设置结果
     */
    setItineraryData(data) {
        try {
            if (!data || !data.days || !data.days.length) {
                console.error('无效的行程数据');
                return false;
            }
            
            this.itineraryData = data;
            this.currentDay = 0;
            
            // 处理缺失坐标
            if (this.options.enableMissingPlaceFinder && this.locationService) {
                this.handleMissingLocations(data);
            }
            
            // 同步到地图
            if (this.map && typeof this.map.initMarkers === 'function') {
                const mapData = this.prepareMapData(data);
                this.map.initMarkers(mapData);
            }
            
            // 同步到时间轴
            if (this.timeline && typeof this.timeline.setData === 'function') {
                const timelineData = this.prepareTimelineData(data);
                this.timeline.setData(timelineData);
            }
            
            // 显示第一天行程
            this.showDayItinerary(0);
            
            this.triggerEvent('dataLoaded', { data: data });
            
            return true;
        } catch (error) {
            console.error('设置行程数据失败', error);
            this.triggerEvent('error', { error: error, component: 'data' });
            return false;
        }
    }
    
    /**
     * 显示特定天数的行程
     * @param {number} dayIndex - 天数索引(0开始)
     * @returns {boolean} 操作结果
     */
    showDayItinerary(dayIndex) {
        try {
            if (!this.itineraryData || !this.itineraryData.days || dayIndex >= this.itineraryData.days.length) {
                return false;
            }
            
            this.currentDay = dayIndex;
            
            // 更新地图
            if (this.map && typeof this.map.showDayItinerary === 'function') {
                this.map.showDayItinerary(dayIndex);
            }
            
            // 更新时间轴
            if (this.timeline && typeof this.timeline.showDay === 'function') {
                this.timeline.showDay(dayIndex);
            }
            
            // 保存最后查看的日期
            this.preferences.set('lastViewedDay', dayIndex);
            
            // 触发日期变更事件
            this.triggerEvent('dayChanged', {
                day: dayIndex,
                dayData: this.itineraryData.days[dayIndex]
            });
            
            return true;
        } catch (error) {
            console.error('显示天数行程失败', error);
            return false;
        }
    }
    
    /**
     * 处理缺失坐标
     * @param {Object} data - 行程数据
     * @private
     */
    async handleMissingLocations(data) {
        // 如果没有位置服务或者没有行程数据，直接返回
        if (!this.locationService || !data.days || !data.days.length) {
            return;
        }
        
        try {
            let modified = false;
            
            // 为每天的活动查找缺失的坐标
            for (let dayIndex = 0; dayIndex < data.days.length; dayIndex++) {
                const day = data.days[dayIndex];
                
                if (!day.activities || !day.activities.length) continue;
                
                for (let actIndex = 0; actIndex < day.activities.length; actIndex++) {
                    const activity = day.activities[actIndex];
                    
                    // 检查位置是否缺失
                    if (!activity.location || !Array.isArray(activity.location) || activity.location.length !== 2) {
                        // 如果有名称或地址，尝试地理编码
                        const placeName = activity.name || activity.address;
                        
                        if (placeName) {
                            try {
                                // 使用位置服务获取坐标
                                const coordinates = await this.locationService.getCoordinatesByAddress(
                                    placeName, this.options.defaultCity
                                );
                                
                                if (coordinates && coordinates.length === 2) {
                                    // 更新活动位置
                                    activity.location = coordinates;
                                    modified = true;
                                    console.log(`已为 "${placeName}" 获取坐标: [${coordinates.join(', ')}]`);
                                }
                            } catch (error) {
                                console.warn(`无法为 "${placeName}" 获取坐标:`, error);
                            }
                        }
                    }
                }
            }
            
            return modified;
        } catch (error) {
            console.error('处理缺失坐标时出错:', error);
            return false;
        }
    }
    
    /**
     * 准备地图数据
     * @param {Object} data - 原始行程数据
     * @returns {Object} 地图格式数据
     * @private
     */
    prepareMapData(data) {
        // 地图组件可以直接使用原始数据格式
        return data;
    }
    
    /**
     * 准备时间轴数据
     * @param {Object} data - 原始行程数据
     * @returns {Object} 时间轴格式数据
     * @private
     */
    prepareTimelineData(data) {
        // 转换为时间轴数据格式
        const timelineData = {
            days: []
        };
        
        data.days.forEach((day, dayIndex) => {
            const timelineDay = {
                title: day.title || `第${dayIndex + 1}天`,
                date: day.date || '',
                points: []
            };
            
            if (day.activities && day.activities.length) {
                day.activities.forEach(activity => {
                    const timelinePoint = {
                        name: activity.name || '未命名地点',
                        time: activity.time || '',
                        description: activity.description || '',
                        location: activity.location || null,
                        address: activity.address || '',
                        tags: activity.tags || [],
                        type: activity.type || 'activity'
                    };
                    
                    timelineDay.points.push(timelinePoint);
                });
            }
            
            timelineData.days.push(timelineDay);
        });
        
        return timelineData;
    }
    
    /**
     * 设置地图中心
     * @param {Array|Object} position - 坐标 [lng, lat] 或 {lng, lat}
     * @returns {boolean} 操作结果
     */
    setMapCenter(position) {
        if (!this.map || typeof this.map.setMapCenter !== 'function') return false;
        
        return this.map.setMapCenter(position);
    }
    
    /**
     * 更改时间轴方向
     * @param {string} direction - 方向('vertical'或'horizontal')
     * @returns {boolean} 操作结果
     */
    changeTimelineDirection(direction) {
        if (!this.timeline || typeof this.timeline.changeDirection !== 'function') return false;
        
        return this.timeline.changeDirection(direction);
    }
    
    /**
     * 应用颜色方案
     * @param {Object} colorScheme - 颜色方案配置
     * @returns {boolean} 操作结果
     */
    applyColorScheme(colorScheme) {
        if (!colorScheme) return false;
        
        try {
            this.options.colorScheme = colorScheme;
            
            // 应用到时间轴
            if (this.timeline && typeof this.timeline.setColorScheme === 'function') {
                this.timeline.setColorScheme(colorScheme);
            }
            
            // TODO: 应用到地图(可能需要重绘标记)
            
            return true;
        } catch (error) {
            console.error('应用颜色方案失败', error);
            return false;
        }
    }
    
    /**
     * 创建日期选择器
     * @param {string} containerId - 容器ID
     * @returns {boolean} 操作结果
     */
    createDaySelector(containerId) {
        if (!containerId || !this.itineraryData) return false;
        
        try {
            const container = document.getElementById(containerId);
            if (!container) return false;
            
            // 清空容器
            container.innerHTML = '';
            
            // 创建日期选择器标题
            const title = document.createElement('div');
            title.className = 'day-selector-title';
            title.textContent = '选择日期';
            container.appendChild(title);
            
            // 创建日期按钮容器
            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'day-selector-buttons';
            container.appendChild(buttonsContainer);
            
            // 为每天创建按钮
            this.itineraryData.days.forEach((day, index) => {
                const button = document.createElement('button');
                button.className = `day-button ${index === this.currentDay ? 'active' : ''}`;
                button.textContent = day.title || `第${index + 1}天`;
                button.dataset.day = index;
                
                button.addEventListener('click', () => {
                    // 移除所有按钮的活动状态
                    buttonsContainer.querySelectorAll('.day-button').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    
                    // 激活当前按钮
                    button.classList.add('active');
                    
                    // 显示对应天数的行程
                    this.showDayItinerary(index);
                });
                
                buttonsContainer.appendChild(button);
            });
            
            // 添加样式
            if (!document.getElementById('day-selector-style')) {
                const style = document.createElement('style');
                style.id = 'day-selector-style';
                style.textContent = `
                    .day-selector-title {
                        font-size: 14px;
                        color: #666;
                        margin-bottom: 8px;
                    }
                    
                    .day-selector-buttons {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 8px;
                    }
                    
                    .day-button {
                        padding: 6px 12px;
                        border: 1px solid #ddd;
                        border-radius: 16px;
                        background: #f8f8f8;
                        cursor: pointer;
                        transition: all 0.2s;
                        font-size: 13px;
                    }
                    
                    .day-button:hover {
                        background: #e9e9e9;
                    }
                    
                    .day-button.active {
                        background: #0071e3;
                        color: white;
                        border-color: #0071e3;
                    }
                `;
                document.head.appendChild(style);
            }
            
            return true;
        } catch (error) {
            console.error('创建日期选择器失败', error);
            return false;
        }
    }
    
    /**
     * 注册事件监听器
     * @param {string} event - 事件名称
     * @param {Function} handler - 处理函数
     */
    on(event, handler) {
        if (!this.eventHandlers[event]) {
            this.eventHandlers[event] = [];
        }
        this.eventHandlers[event].push(handler);
    }
    
    /**
     * 触发事件
     * @param {string} event - 事件名称
     * @param {Object} data - 事件数据
     */
    triggerEvent(event, data) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event].forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`事件处理器 ${event} 执行失败:`, error);
                }
            });
        }
    }
    
    /**
     * 设置事件处理器
     * @private
     */
    setupEventHandlers() {
        try {
            // 处理窗口调整大小
            window.addEventListener('resize', () => {
                this.triggerEvent('resize', {
                    width: window.innerWidth,
                    height: window.innerHeight
                });
                
                // 调整地图视图
                if (this.map && this.map.map) {
                    this.map.map.resize();
                }
            });
        } catch (error) {
            console.error('设置事件处理器失败:', error);
        }
    }

    // 清除所有数据
    clear() {
        if (this.timeline) {
            this.timeline.clear();
        }
        if (this.map) {
            this.map.clearMarkers();
        }
    }

    // 销毁实例
    destroy() {
        if (this.timeline) {
            this.timeline.destroy();
        }
        // 地图实例的销毁由MapIntegration处理
        this.map = null;
        this.timeline = null;
    }

    // 设置行程数据
    setItinerary(items) {
        if (!Array.isArray(items)) {
            console.error('[ItineraryVisualization] Invalid itinerary data');
            return;
        }
        
        try {
            // 清除现有数据
            this.clear();
            
            // 渲染时间线项目
            if (this.timeline) {
                this.timeline.setItems(items);
            }
            
            // 添加地图标记
            if (this.map) {
                items.forEach(item => {
                    if (item.location) {
                        this.map.addMarker(item.location, {
                            title: item.title,
                            content: item.description || item.title
                        });
                    }
                });
                
                // 调整地图视图以显示所有标记
                this.map.setFitView();
            }
            
            console.log('[ItineraryVisualization] Itinerary data set successfully');
            
        } catch (error) {
            console.error('[ItineraryVisualization] Failed to set itinerary:', error);
            throw error;
        }
    }

    /**
     * 恢复用户偏好设置
     * @private
     */
    restorePreferences() {
        try {
            // 恢复展开状态
            const expandedCards = this.preferences.get('expandedCards') || [];
            expandedCards.forEach(dayIndex => {
                this.expandDayCard(dayIndex, false); // false表示不保存状态
            });

            // 恢复上次查看的日期
            const lastViewedDay = this.preferences.get('lastViewedDay') || 0;
            if (lastViewedDay > 0) {
                this.showDayItinerary(lastViewedDay);
            }

            // 恢复主题设置
            const theme = this.preferences.get('theme') || 'light';
            this.applyTheme(theme);

            // 恢复字体大小
            const fontSize = this.preferences.get('fontSize') || 'medium';
            this.applyFontSize(fontSize);
        } catch (error) {
            console.error('恢复用户偏好设置失败:', error);
        }
    }

    /**
     * 保存卡片展开状态
     * @param {number} dayIndex - 天数索引
     * @param {boolean} isExpanded - 是否展开
     */
    saveCardState(dayIndex, isExpanded) {
        try {
            let expandedCards = this.preferences.get('expandedCards') || [];
            
            if (isExpanded && !expandedCards.includes(dayIndex)) {
                expandedCards.push(dayIndex);
            } else if (!isExpanded) {
                expandedCards = expandedCards.filter(index => index !== dayIndex);
            }
            
            this.preferences.set('expandedCards', expandedCards);
        } catch (error) {
            console.error('保存卡片状态失败:', error);
        }
    }

    /**
     * 展开/折叠日卡片
     * @param {number} dayIndex - 天数索引
     * @param {boolean} [saveState=true] - 是否保存状态
     */
    expandDayCard(dayIndex, saveState = true) {
        try {
            const dayCard = document.querySelector(`#day-${dayIndex}`);
            if (!dayCard) return;

            const isExpanded = dayCard.classList.contains('expanded');
            const content = dayCard.querySelector('.day-content');
            
            if (!isExpanded) {
                dayCard.classList.add('expanded');
                content.style.maxHeight = content.scrollHeight + 'px';
            } else {
                dayCard.classList.remove('expanded');
                content.style.maxHeight = null;
            }

            if (saveState) {
                this.saveCardState(dayIndex, !isExpanded);
            }
        } catch (error) {
            console.error('展开/折叠卡片失败:', error);
        }
    }

    /**
     * 应用主题
     * @param {string} theme - 主题名称 ('light'|'dark')
     */
    applyTheme(theme) {
        try {
            document.body.setAttribute('data-theme', theme);
            this.preferences.set('theme', theme);
        } catch (error) {
            console.error('应用主题失败:', error);
        }
    }

    /**
     * 应用字体大小
     * @param {string} size - 字体大小 ('small'|'medium'|'large')
     */
    applyFontSize(size) {
        try {
            document.body.setAttribute('data-font-size', size);
            this.preferences.set('fontSize', size);
        } catch (error) {
            console.error('应用字体大小失败:', error);
        }
    }

    /**
     * 绑定Tab事件
     * @private
     */
    bindTabEvents() {
        // 监听Tab切换事件
        this.tabManager.on('tabChanged', ({ tabId }) => {
            switch (tabId) {
                case 'overview':
                    this.updateOverviewTab();
                    break;
                case 'details':
                    this.updateDetailsTab();
                    break;
                case 'map':
                    this.updateMapTab();
                    break;
                case 'timeline':
                    this.updateTimelineTab();
                    break;
            }
        });

        // 监听数据更新事件
        this.tabManager.on('dataUpdated', ({ tabId, data }) => {
            // 标记其他相关Tab需要更新
            if (tabId === 'details') {
                this.tabManager.markForUpdate('map');
                this.tabManager.markForUpdate('timeline');
            } else if (tabId === 'map') {
                this.tabManager.markForUpdate('details');
            }
        });
    }

    /**
     * 更新概览Tab
     * @private
     */
    updateOverviewTab() {
        if (!this.itineraryData) return;
        
        const overviewData = {
            totalDays: this.itineraryData.days.length,
            destinations: this.extractDestinations(),
            highlights: this.extractHighlights(),
            statistics: this.calculateStatistics()
        };
        
        this.tabManager.updateTabData('overview', overviewData);
    }

    /**
     * 更新详情Tab
     * @private
     */
    updateDetailsTab() {
        if (!this.itineraryData) return;
        
        const detailsData = {
            days: this.itineraryData.days,
            currentDay: this.currentDay,
            expandedCards: this.preferences.get('expandedCards') || []
        };
        
        this.tabManager.updateTabData('details', detailsData);
    }

    /**
     * 更新地图Tab
     * @private
     */
    updateMapTab() {
        if (!this.itineraryData || !this.map) return;
        
        const mapData = this.prepareMapData(this.itineraryData);
        this.map.updateData(mapData);
        this.tabManager.updateTabData('map', mapData);
    }

    /**
     * 更新时间线Tab
     * @private
     */
    updateTimelineTab() {
        if (!this.itineraryData || !this.timeline) return;
        
        const timelineData = this.prepareTimelineData(this.itineraryData);
        this.timeline.updateData(timelineData);
        this.tabManager.updateTabData('timeline', timelineData);
    }

    /**
     * 提取目的地信息
     * @private
     * @returns {Array} 目的地列表
     */
    extractDestinations() {
        if (!this.itineraryData || !this.itineraryData.days) return [];
        
        const destinations = new Set();
        this.itineraryData.days.forEach(day => {
            day.activities.forEach(activity => {
                if (activity.location) {
                    destinations.add(activity.destination || activity.name);
                }
            });
        });
        
        return Array.from(destinations);
    }

    /**
     * 提取行程亮点
     * @private
     * @returns {Array} 亮点列表
     */
    extractHighlights() {
        if (!this.itineraryData || !this.itineraryData.days) return [];
        
        return this.itineraryData.days.reduce((highlights, day) => {
            day.activities.forEach(activity => {
                if (activity.isHighlight) {
                    highlights.push({
                        day: day.dayNumber,
                        activity: activity.name,
                        description: activity.description
                    });
                }
            });
            return highlights;
        }, []);
    }

    /**
     * 计算行程统计信息
     * @private
     * @returns {Object} 统计信息
     */
    calculateStatistics() {
        if (!this.itineraryData || !this.itineraryData.days) {
            return {
                totalActivities: 0,
                totalDistance: 0,
                averageActivitiesPerDay: 0
            };
        }
        
        const stats = this.itineraryData.days.reduce((acc, day) => {
            acc.totalActivities += day.activities.length;
            day.activities.forEach(activity => {
                if (activity.distance) {
                    acc.totalDistance += activity.distance;
                }
            });
            return acc;
        }, { totalActivities: 0, totalDistance: 0 });
        
        stats.averageActivitiesPerDay = stats.totalActivities / this.itineraryData.days.length;
        
        return stats;
    }
}

// 导出可视化类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ItineraryVisualization;
} else if (typeof window !== 'undefined') {
    window.ItineraryVisualization = ItineraryVisualization;
} 