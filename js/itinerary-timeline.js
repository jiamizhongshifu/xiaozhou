class ItineraryTimeline {
    constructor(options = {}) {
        // 验证必要的参数
        if (!options.container && !options.containerId) {
            throw new Error('Timeline container is required');
        }

        this.container = typeof options.container === 'string' ? 
            document.getElementById(options.container) : 
            (options.container || document.getElementById(options.containerId));

        if (!this.container) {
            throw new Error('Timeline container not found');
        }

        this.options = {
            ...{
                itemHeight: 80,
                spacing: 20,
                dateFormat: 'YYYY-MM-DD HH:mm',
                showTime: true
            },
            ...options
        };

        this.events = {};
        this.init();
    }

    init() {
        try {
            this.createTimelineStructure();
            this.bindEvents();
            console.log('[Timeline] Initialized successfully');
        } catch (error) {
            console.error('[Timeline] Initialization failed:', error);
            throw error;
        }
    }

    createTimelineStructure() {
        // 创建基本结构
        this.container.innerHTML = `
            <div class="timeline-wrapper">
                <div class="timeline-content">
                    <div class="timeline-line"></div>
                    <div class="timeline-items"></div>
                </div>
            </div>
        `;

        // 添加基本样式
        if (!document.getElementById('timeline-styles')) {
            const style = document.createElement('style');
            style.id = 'timeline-styles';
            style.textContent = `
                .timeline-wrapper {
                    position: relative;
                    height: 100%;
                    overflow-y: auto;
                    padding: 20px;
                }
                .timeline-content {
                    position: relative;
                    min-height: 100%;
                }
                .timeline-line {
                    position: absolute;
                    left: 20px;
                    top: 0;
                    bottom: 0;
                    width: 2px;
                    background: #e0e0e0;
                }
                .timeline-items {
                    position: relative;
                    padding-left: 50px;
                }
                .timeline-item {
                    position: relative;
                    margin-bottom: ${this.options.spacing}px;
                    min-height: ${this.options.itemHeight}px;
                    background: #fff;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .timeline-item:hover {
                    transform: translateX(5px);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
                }
                .timeline-point {
                    position: absolute;
                    left: -40px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: #4CAF50;
                    border: 2px solid #fff;
                    box-shadow: 0 0 0 2px #4CAF50;
                }
            `;
            document.head.appendChild(style);
        }
    }

    bindEvents() {
        // 事件委托处理点击事件
        this.container.addEventListener('click', (e) => {
            const item = e.target.closest('.timeline-item');
            if (item) {
                const itemData = JSON.parse(item.dataset.item || '{}');
                this.trigger('itemClick', itemData);
            }
        });
    }

    // 事件处理
    on(eventName, handler) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(handler);
    }

    off(eventName, handler) {
        if (!this.events[eventName]) return;
        if (handler) {
            this.events[eventName] = this.events[eventName].filter(h => h !== handler);
        } else {
            this.events[eventName] = [];
        }
    }

    trigger(eventName, data) {
        if (!this.events[eventName]) return;
        this.events[eventName].forEach(handler => {
            try {
                handler(data);
            } catch (error) {
                console.error(`Error in ${eventName} event handler:`, error);
            }
        });
    }

    // 渲染时间线项目
    renderItems(items) {
        if (!Array.isArray(items)) {
            console.error('[Timeline] Items must be an array');
            return;
        }

        const itemsContainer = this.container.querySelector('.timeline-items');
        if (!itemsContainer) {
            console.error('[Timeline] Items container not found');
            return;
        }

        itemsContainer.innerHTML = items.map((item, index) => {
            const itemHtml = this.createItemHtml(item, index);
            return itemHtml;
        }).join('');
    }

    createItemHtml(item, index) {
        const time = this.options.showTime ? 
            `<div class="timeline-time">${this.formatDate(item.time)}</div>` : '';
        
        return `
            <div class="timeline-item" data-item='${JSON.stringify(item)}'>
                <div class="timeline-point"></div>
                ${time}
                <div class="timeline-content">
                    <h3>${item.title || ''}</h3>
                    <p>${item.description || ''}</p>
                </div>
            </div>
        `;
    }

    formatDate(date) {
        if (!date) return '';
        try {
            const d = new Date(date);
            return d.toLocaleString();
        } catch (error) {
            console.error('[Timeline] Date format error:', error);
            return date.toString();
        }
    }

    // 清空时间线
    clear() {
        const itemsContainer = this.container.querySelector('.timeline-items');
        if (itemsContainer) {
            itemsContainer.innerHTML = '';
        }
    }

    // 更新配置
    updateOptions(newOptions) {
        this.options = {
            ...this.options,
            ...newOptions
        };
        // 重新渲染以应用新配置
        this.init();
    }

    // 销毁实例
    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
            this.events = {};
        }
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ItineraryTimeline;
} else if (typeof window !== 'undefined') {
    window.ItineraryTimeline = ItineraryTimeline;
} 