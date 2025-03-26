/**
 * 时间轴组件
 * 提供行程时间轴展示，支持垂直和水平两种布局
 */

class ItineraryTimeline {
    /**
     * 初始化时间轴
     * @param {string} containerId - 容器ID
     * @param {Object} options - 配置选项
     */
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`时间轴容器 ${containerId} 不存在`);
            return;
        }
        
        this.options = Object.assign({
            direction: 'vertical', // vertical or horizontal
            enableMapSync: false,   // 是否启用地图联动
            mapInstance: null,      // 地图实例
            itemClickAction: 'expand', // expand or highlight
            showTimeLabels: true,   // 显示时间标签
            autoScroll: true        // 自动滚动到当前时间点
        }, options);
        
        this.data = [];
        this.currentDay = 1;
        this.currentIndex = -1;
        
        // 时间段颜色
        this.periodColors = {
            'morning': '#7cb5ec',   // 上午 - 浅蓝
            'afternoon': '#f7a35c', // 下午 - 橙色
            'evening': '#8085e9'    // 晚上 - 紫色
        };
        
        // 时间段图标
        this.periodIcons = {
            'morning': 'fas fa-sun',
            'afternoon': 'fas fa-cloud-sun',
            'evening': 'fas fa-moon'
        };
        
        // 初始化
        this.init();
    }
    
    /**
     * 初始化时间轴
     */
    init() {
        // 添加基础类
        this.container.classList.add('timeline-container');
        this.container.classList.add(`timeline-${this.options.direction}`);
        
        // 清空容器
        this.container.innerHTML = '';
        
        if (this.options.direction === 'vertical') {
            this.initVerticalTimeline();
        } else {
            this.initHorizontalTimeline();
        }
    }
    
    /**
     * 初始化垂直时间轴
     */
    initVerticalTimeline() {
        // 创建时间轴线
        const timelineLine = document.createElement('div');
        timelineLine.className = 'timeline-line';
        this.container.appendChild(timelineLine);
        
        // 创建内容容器
        this.contentContainer = document.createElement('div');
        this.contentContainer.className = 'timeline-content-container';
        this.container.appendChild(this.contentContainer);
    }
    
    /**
     * 初始化水平时间轴
     */
    initHorizontalTimeline() {
        // 创建头部控制区
        const header = document.createElement('div');
        header.className = 'timeline-header';
        
        // 标题
        const title = document.createElement('div');
        title.className = 'timeline-title';
        title.textContent = '行程时间表';
        header.appendChild(title);
        
        // 控制按钮
        const controls = document.createElement('div');
        controls.className = 'timeline-controls';
        
        // 左滚动按钮
        const btnLeft = document.createElement('button');
        btnLeft.className = 'timeline-btn';
        btnLeft.type = 'button';
        btnLeft.innerHTML = '<i class="fas fa-chevron-left"></i>';
        btnLeft.addEventListener('click', () => this.scrollTimeline('left'));
        controls.appendChild(btnLeft);
        
        // 右滚动按钮
        const btnRight = document.createElement('button');
        btnRight.className = 'timeline-btn';
        btnRight.type = 'button';
        btnRight.innerHTML = '<i class="fas fa-chevron-right"></i>';
        btnRight.addEventListener('click', () => this.scrollTimeline('right'));
        controls.appendChild(btnRight);
        
        header.appendChild(controls);
        this.container.appendChild(header);
        
        // 创建滚动容器
        const scrollContainer = document.createElement('div');
        scrollContainer.className = 'timeline-scroll';
        
        // 创建内容轨道
        this.timelineTrack = document.createElement('div');
        this.timelineTrack.className = 'timeline-track';
        
        // 创建时间轴线
        const timelineLine = document.createElement('div');
        timelineLine.className = 'timeline-line';
        this.timelineTrack.appendChild(timelineLine);
        
        scrollContainer.appendChild(this.timelineTrack);
        this.container.appendChild(scrollContainer);
        
        // 保存引用
        this.scrollContainer = scrollContainer;
        this.btnLeft = btnLeft;
        this.btnRight = btnRight;
    }
    
    /**
     * 滚动时间轴
     * @param {string} direction - 滚动方向 ('left' 或 'right')
     */
    scrollTimeline(direction) {
        if (!this.scrollContainer) return;
        
        const scrollAmount = 240; // 每次滚动的像素量
        const currentScroll = this.scrollContainer.scrollLeft;
        
        if (direction === 'left') {
            this.scrollContainer.scrollTo({
                left: Math.max(0, currentScroll - scrollAmount),
                behavior: 'smooth'
            });
        } else {
            this.scrollContainer.scrollTo({
                left: currentScroll + scrollAmount,
                behavior: 'smooth'
            });
        }
    }
    
    /**
     * 设置时间轴数据
     * @param {Array} data - 时间轴数据
     * @param {number} dayIndex - 天数索引(1开始)
     */
    setData(data, dayIndex = 1) {
        if (!data || !data.length) {
            console.warn('时间轴数据为空');
            this.clearTimeline();
            return;
        }
        
        this.data = data;
        this.currentDay = dayIndex;
        this.render();
        
        // 重置当前索引
        this.currentIndex = -1;
        
        // 自动同步地图数据
        if (this.options.enableMapSync && this.options.mapInstance) {
            this.syncWithMap();
        }
    }
    
    /**
     * 渲染时间轴
     */
    render() {
        if (this.options.direction === 'vertical') {
            this.renderVerticalTimeline();
        } else {
            this.renderHorizontalTimeline();
        }
    }
    
    /**
     * 渲染垂直时间轴
     */
    renderVerticalTimeline() {
        if (!this.contentContainer) return;
        
        // 清空内容
        this.contentContainer.innerHTML = '';
        
        // 遍历数据创建时间点
        this.data.forEach((item, index) => {
            const timelineItem = document.createElement('div');
            timelineItem.className = 'timeline-item';
            timelineItem.dataset.index = index;
            
            if (item.period) {
                timelineItem.classList.add(item.period.toLowerCase());
            }
            
            // 时间标签
            const timeLabel = document.createElement('div');
            timeLabel.className = 'timeline-time';
            timeLabel.textContent = item.time || '';
            timelineItem.appendChild(timeLabel);
            
            // 时间点
            const timelineDot = document.createElement('div');
            timelineDot.className = 'timeline-dot';
            timelineItem.appendChild(timelineDot);
            
            // 内容区域
            const content = document.createElement('div');
            content.className = 'timeline-content';
            
            // 卡片
            const card = document.createElement('div');
            card.className = 'timeline-card';
            
            // 标题
            const title = document.createElement('div');
            title.className = 'timeline-title';
            
            // 图标
            if (item.period && this.periodIcons[item.period.toLowerCase()]) {
                const icon = document.createElement('i');
                icon.className = `timeline-icon ${this.periodIcons[item.period.toLowerCase()]}`;
                title.appendChild(icon);
            }
            
            title.appendChild(document.createTextNode(item.name || '未命名活动'));
            card.appendChild(title);
            
            // 描述
            if (item.description) {
                const desc = document.createElement('div');
                desc.className = 'timeline-desc';
                desc.textContent = item.description;
                card.appendChild(desc);
            }
            
            // 元数据
            if (item.address || item.duration) {
                const meta = document.createElement('div');
                meta.className = 'timeline-meta';
                
                if (item.address) {
                    const address = document.createElement('div');
                    address.className = 'timeline-badge';
                    address.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${item.address}`;
                    meta.appendChild(address);
                }
                
                if (item.duration) {
                    const duration = document.createElement('div');
                    duration.className = 'timeline-badge';
                    duration.innerHTML = `<i class="far fa-clock"></i> ${item.duration}`;
                    meta.appendChild(duration);
                }
                
                card.appendChild(meta);
            }
            
            content.appendChild(card);
            timelineItem.appendChild(content);
            
            // 添加点击事件
            timelineItem.addEventListener('click', () => this.handleItemClick(index));
            
            // 添加到容器
            this.contentContainer.appendChild(timelineItem);
        });
    }
    
    /**
     * 渲染水平时间轴
     */
    renderHorizontalTimeline() {
        if (!this.timelineTrack) return;
        
        // 保留轴线元素
        const axisLine = this.timelineTrack.querySelector('.timeline-line');
        
        // 清空内容
        this.timelineTrack.innerHTML = '';
        
        // 重新添加轴线
        this.timelineTrack.appendChild(axisLine);
        
        // 遍历数据创建时间点
        this.data.forEach((item, index) => {
            const timelineItem = document.createElement('div');
            timelineItem.className = 'timeline-item';
            timelineItem.dataset.index = index;
            
            if (item.period) {
                timelineItem.classList.add(item.period.toLowerCase());
            }
            
            // 时间标签
            if (this.options.showTimeLabels) {
                const timeLabel = document.createElement('div');
                timeLabel.className = 'timeline-time';
                timeLabel.textContent = item.time || '';
                timelineItem.appendChild(timeLabel);
            }
            
            // 时间点
            const timelineDot = document.createElement('div');
            timelineDot.className = 'timeline-dot';
            timelineItem.appendChild(timelineDot);
            
            // 卡片
            const card = document.createElement('div');
            card.className = 'timeline-card';
            
            // 卡片标题
            const cardTitle = document.createElement('div');
            cardTitle.className = 'timeline-card-title';
            cardTitle.textContent = item.name || '未命名活动';
            card.appendChild(cardTitle);
            
            // 卡片描述
            if (item.description) {
                const cardDesc = document.createElement('div');
                cardDesc.className = 'timeline-card-desc';
                cardDesc.textContent = item.description;
                card.appendChild(cardDesc);
            }
            
            timelineItem.appendChild(card);
            
            // 添加点击事件
            timelineItem.addEventListener('click', () => this.handleItemClick(index));
            
            // 添加到轨道
            this.timelineTrack.appendChild(timelineItem);
        });
        
        // 如果启用自动滚动，滚动到第一个项目
        if (this.options.autoScroll && this.scrollContainer && this.data.length > 0) {
            setTimeout(() => {
                const firstItem = this.timelineTrack.querySelector('.timeline-item');
                if (firstItem) {
                    const itemOffsetLeft = firstItem.offsetLeft;
                    this.scrollContainer.scrollLeft = Math.max(0, itemOffsetLeft - 50);
                }
            }, 300);
        }
    }
    
    /**
     * 处理时间点点击事件
     * @param {number} index - 点击的项目索引
     */
    handleItemClick(index) {
        if (index < 0 || index >= this.data.length) return;
        
        const item = this.data[index];
        
        // 更新当前选中
        this.setActiveItem(index);
        
        // 如果启用地图联动，则调用地图高亮相应点
        if (this.options.enableMapSync && this.options.mapInstance && item.location) {
            this.highlightMapLocation(item.location, index);
        }
        
        // 触发点击回调
        if (this.options.onItemClick && typeof this.options.onItemClick === 'function') {
            this.options.onItemClick(item, index);
        }
    }
    
    /**
     * 设置活动项目
     * @param {number} index - 项目索引
     */
    setActiveItem(index) {
        // 移除所有活动状态
        const allItems = this.container.querySelectorAll('.timeline-item');
        allItems.forEach(item => item.classList.remove('active'));
        
        // 设置新的活动状态
        if (index >= 0 && index < allItems.length) {
            allItems[index].classList.add('active');
            this.currentIndex = index;
            
            // 滚动到视图
            this.scrollToItem(index);
        }
    }
    
    /**
     * 滚动到指定项目
     * @param {number} index - 项目索引
     */
    scrollToItem(index) {
        const items = this.container.querySelectorAll('.timeline-item');
        if (index < 0 || index >= items.length) return;
        
        const targetItem = items[index];
        
        if (this.options.direction === 'horizontal' && this.scrollContainer) {
            // 水平滚动
            const containerWidth = this.scrollContainer.clientWidth;
            const itemOffsetLeft = targetItem.offsetLeft;
            const itemWidth = targetItem.offsetWidth;
            
            // 计算目标滚动位置，使项目居中
            const targetScroll = Math.max(0, itemOffsetLeft - (containerWidth / 2) + (itemWidth / 2));
            
            this.scrollContainer.scrollTo({
                left: targetScroll,
                behavior: 'smooth'
            });
        } else if (this.options.direction === 'vertical') {
            // 垂直滚动
            targetItem.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }
    
    /**
     * 在地图上高亮位置
     * @param {Array} location - 位置坐标
     * @param {number} index - 项目索引
     */
    highlightMapLocation(location, index) {
        if (!this.options.mapInstance || !location) return;
        
        const map = this.options.mapInstance;
        
        // 使用地图实例方法高亮标记
        if (typeof map.highlightMarker === 'function') {
            map.highlightMarker(index);
        }
        
        // 使用地图实例方法设置中心
        if (typeof map.setCenter === 'function') {
            map.setCenter(location);
        }
    }
    
    /**
     * 清空时间轴
     */
    clearTimeline() {
        if (this.options.direction === 'vertical' && this.contentContainer) {
            this.contentContainer.innerHTML = '';
        } else if (this.timelineTrack) {
            // 保留轴线元素
            const axisLine = this.timelineTrack.querySelector('.timeline-line');
            
            // 清空内容
            this.timelineTrack.innerHTML = '';
            
            // 重新添加轴线
            if (axisLine) {
                this.timelineTrack.appendChild(axisLine);
            }
        }
        
        this.data = [];
        this.currentIndex = -1;
    }
    
    /**
     * 与地图同步
     */
    syncWithMap() {
        if (!this.options.mapInstance) return;
        
        const map = this.options.mapInstance;
        
        // 当地图标记被点击时，同步高亮时间轴项目
        if (typeof map.onMarkerClick === 'function') {
            map.onMarkerClick((marker, index) => {
                this.setActiveItem(index);
            });
        }
    }
    
    /**
     * 切换时间轴方向
     * @param {string} direction - 方向 ('vertical' 或 'horizontal')
     */
    changeDirection(direction) {
        if (direction !== 'vertical' && direction !== 'horizontal') return;
        if (direction === this.options.direction) return;
        
        this.options.direction = direction;
        
        // 保存当前数据
        const currentData = [...this.data];
        const currentDay = this.currentDay;
        
        // 重新初始化
        this.container.classList.remove('timeline-vertical', 'timeline-horizontal');
        this.init();
        
        // 重新加载数据
        if (currentData.length > 0) {
            this.setData(currentData, currentDay);
        }
    }
    
    /**
     * 获取指定格式的数据
     * @param {Object} itineraryData - 行程数据
     * @param {number} dayIndex - 天数索引(1开始)
     * @returns {Array} 时间轴数据
     */
    static extractTimelineData(itineraryData, dayIndex) {
        if (!itineraryData || !itineraryData.days || dayIndex < 1 || dayIndex > itineraryData.days.length) {
            return [];
        }
        
        const result = [];
        const day = itineraryData.days[dayIndex - 1];
        
        // 处理上午/下午/晚上的活动
        const periods = [
            { key: 'morning', label: '上午' },
            { key: 'afternoon', label: '下午' },
            { key: 'evening', label: '晚上' }
        ];
        
        periods.forEach(period => {
            if (day[period.key] && Array.isArray(day[period.key].activities)) {
                day[period.key].activities.forEach(activity => {
                    result.push({
                        name: activity.name,
                        description: activity.description,
                        location: activity.location,
                        address: activity.address,
                        time: activity.time,
                        duration: activity.duration,
                        period: period.key
                    });
                });
            }
        });
        
        return result;
    }

    // 添加事件系统
    on(eventName, callback) {
        if (!this._eventListeners) {
            this._eventListeners = {};
        }
        
        if (!this._eventListeners[eventName]) {
            this._eventListeners[eventName] = [];
        }
        
        this._eventListeners[eventName].push(callback);
        return this;
    }

    // 触发事件
    trigger(eventName, data) {
        if (!this._eventListeners || !this._eventListeners[eventName]) {
            return;
        }
        
        this._eventListeners[eventName].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in ${eventName} event handler:`, error);
            }
        });
    }

    // 添加清除方法
    clear() {
        if (this.contentContainer) {
            this.contentContainer.innerHTML = '';
        }
        if (this.timelineTrack) {
            this.timelineTrack.innerHTML = '';
            // 重新添加时间轴线
            const timelineLine = document.createElement('div');
            timelineLine.className = 'timeline-line';
            this.timelineTrack.appendChild(timelineLine);
        }
        this.data = [];
    }

    // 添加设置数据方法
    setItems(items) {
        if (!Array.isArray(items)) {
            console.error('Items must be an array');
            return;
        }
        
        this.data = items;
        this.render();
    }
}

// 导出时间轴类
window.ItineraryTimeline = ItineraryTimeline; 