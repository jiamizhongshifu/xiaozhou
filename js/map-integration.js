/**
 * 地图集成功能模块
 * 基于高德地图API和MCP服务实现行程地图显示和交互
 */

class MapIntegration {
    /**
     * 初始化地图
     * @param {Object} options - 配置选项
     * @param {string} options.containerId - 地图容器ID
     * @param {string} options.apiKey - 高德地图API密钥（可选，如果已全局配置）
     * @param {boolean} options.useMcp - 是否使用MCP服务（默认true）
     * @param {boolean} options.enableScrollWheel - 是否启用滚轮缩放（默认false）
     * @param {string} options.theme - 地图主题（可选）
     */
    constructor(options = {}) {
        // 兼容旧版本API（接受containerId作为第一个参数）
        if (typeof options === 'string') {
            console.warn('传递containerId作为第一个参数的方式已过时，请使用options对象');
            this.containerId = options;
            this.container = document.getElementById(options);
            options = arguments[1] || {};
        } else {
            this.container = options.container || document.getElementById(options.containerId);
            this.containerId = options.containerId || this.container?.id || 'map-container';
        }
        
        // 检查容器是否存在
        if (!this.container) {
            console.error(`地图容器 ${this.containerId} 不存在`);
            return;
        }
        
        this.map = null;
        this.markers = [];
        this.polylines = [];
        this.infoWindows = [];
        this.locationService = null;
        this.dayColors = options.dayColors || [
            '#1E88E5', '#43A047', '#FB8C00', '#E53935', 
            '#5E35B1', '#00ACC1', '#FFB300', '#8E24AA'
        ];
        
        // 地图选项
        this.options = {
            zoom: options.zoom || 11,
            center: options.center || [116.397428, 39.90923],
            ...options
        };
        
        // 事件处理器
        this.eventHandlers = {};
        
        this.initLoadState();
    }
    
    /**
     * 初始化加载状态
     */
    initLoadState() {
        if (!this.container) {
            console.error(`地图容器 ${this.containerId} 不存在`);
            return;
        }
        
        // 添加加载指示器
        const loadingEl = document.createElement('div');
        loadingEl.className = 'map-loading';
        loadingEl.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="sr-only">加载中...</span></div>';
        this.container.appendChild(loadingEl);
        this.loadingEl = loadingEl;
    }
    
    /**
     * 初始化位置服务
     * @returns {Promise<MapIntegration>} - 地图实例
     */
    async initLocationService() {
        if (!window.LocationService) {
            console.error('LocationService未找到，请确保location-service.js已加载');
            return false;
        }
        
        try {
            this.locationService = new LocationService(this.options.apiKey);
            
            // 配置MCP
            if (this.options.useMcp) {
                this.locationService.enableMcpService(true);
                
                // 如果有MCP配置，则使用配置的端点
                if (window.AppConfig && window.AppConfig.MCP_CONFIG && window.AppConfig.MCP_CONFIG.ENDPOINT) {
                    this.locationService.setMcpEndpoint(window.AppConfig.MCP_CONFIG.ENDPOINT);
                }
            } else {
                this.locationService.enableMcpService(false);
            }
            
            await this.locationService.init();
            console.log('位置服务初始化完成', this.locationService.mcpConfig.enabled ? '使用MCP模式' : '使用SDK模式');
            
            return true;
        } catch (error) {
            console.error('位置服务初始化失败', error);
            return false;
        }
    }
    
    /**
     * 初始化地图
     * @returns {Promise<boolean>} - 初始化结果
     */
    async init() {
        try {
            // 等待高德地图API加载完成
            if (!window.AMap) {
                console.warn('[MapIntegration] AMap API not loaded, waiting...');
                await new Promise((resolve) => {
                    const checkAMap = setInterval(() => {
                        if (window.AMap) {
                            clearInterval(checkAMap);
                            resolve();
                        }
                    }, 100);
                });
            }
            
            // 初始化地图
            this.map = new AMap.Map(this.containerId, {
                zoom: this.options.zoom,
                center: this.options.center,
                resizeEnable: true
            });
            
            // 等待地图加载完成
            await new Promise((resolve) => {
                this.map.on('complete', resolve);
            });

            // 添加地图控件
            await this.addMapControls();

            console.log('[MapIntegration] Map initialized successfully');
            return true;
        } catch (error) {
            console.error('[MapIntegration] Failed to initialize map:', error);
            return false;
        }
    }
    
    /**
     * 添加地图控件
     */
    async addMapControls() {
        try {
            await new Promise((resolve, reject) => {
                AMap.plugin(['AMap.ToolBar', 'AMap.Scale'], () => {
                    try {
                        this.map.addControl(new AMap.ToolBar());
                        this.map.addControl(new AMap.Scale());
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                });
            });
        } catch (error) {
            console.warn('[MapIntegration] Failed to add map controls:', error);
        }
    }
    
    /**
     * 根据主题名称获取地图样式
     * @param {string} theme - 主题名称
     * @returns {string} 样式名称
     */
    getMapStyleByTheme(theme) {
        const styleMap = {
            normal: 'normal',
            dark: 'dark',
            light: 'light',
            fresh: 'fresh',
            bluish: 'amap://styles/8fa5c3cff10a2972785e62ac1977d6e1',
            macaron: 'amap://styles/57e72f6a2b5ef66b9aed53b0e40f8e98'
        };
        
        return styleMap[theme] || 'normal';
    }
    
    /**
     * 添加拖拽高亮效果
     */
    addDragHighlight() {
        if (!this.map || !window.AMap || !window.AMap.event) {
            console.warn('地图实例或事件API未就绪，跳过拖拽高亮设置');
            return;
        }
        
        try {
            // 地图拖拽交互高亮效果逻辑
            AMap.event.addListener(this.map, 'dragging', () => {
                if (this.container) {
                    this.container.classList.add('map-dragging');
                }
            });
            
            AMap.event.addListener(this.map, 'dragend', () => {
                if (this.container) {
                    this.container.classList.remove('map-dragging');
                }
            });
        } catch (error) {
            console.warn('添加拖拽高亮效果失败:', error.message);
        }
    }
    
    /**
     * 扩展地图功能
     */
    extendMapFunctions() {
        // 高亮标记方法
        this.highlightMarker = (index) => {
            if (index >= 0 && index < this.markers.length) {
                const targetMarker = this.markers[index];
                // 恢复其他标记样式
                this.markers.forEach(marker => {
                    marker.setAnimation('AMAP_ANIMATION_NONE');
                    if (marker._originalIcon) {
                        marker.setIcon(marker._originalIcon);
                    }
                });
                
                // 高亮当前标记
                targetMarker.setAnimation('AMAP_ANIMATION_BOUNCE');
                this.map.setCenter(targetMarker.getPosition());
                
                // 触发高亮事件
                this.trigger('markerHighlight', {
                    index: index,
                    marker: targetMarker
                });
                
                return true;
            }
            return false;
        };
        
        // 设置地图中心
        this.setMapCenter = (position) => {
            if (Array.isArray(position) && position.length === 2) {
                this.map.setCenter(position);
                return true;
            } else if (position && position.lat && position.lng) {
                this.map.setCenter([position.lng, position.lat]);
                return true;
            }
            return false;
        };
    }
    
    /**
     * 根据行程数据初始化地图标记
     * @param {Object} itineraryData - 行程数据
     * @returns {boolean} - 初始化结果
     */
    initMarkers(itineraryData) {
        if (!this.map || !itineraryData || !itineraryData.days) {
            return false;
        }
        
        try {
            // 清除现有标记
            this.clearMarkers();
            
            const markers = [];
            const polylines = [];
            
            // 为每天创建不同颜色的标记和路线
            itineraryData.days.forEach((day, dayIndex) => {
                const dayColor = this.dayColors[dayIndex % this.dayColors.length];
                const dayMarkers = [];
                
                if (day.activities && day.activities.length) {
                    const validActivities = day.activities.filter(
                        activity => activity.location && Array.isArray(activity.location)
                    );
                    
                    // 创建每个地点的标记
                    validActivities.forEach((activity, actIndex) => {
                        const marker = new AMap.Marker({
                            position: activity.location,
                            title: activity.name || `地点${actIndex + 1}`,
                            label: {
                                content: `<div class="map-marker-label">${activity.name || `地点${actIndex + 1}`}</div>`,
                                direction: 'top'
                            },
                            extData: {
                                day: dayIndex + 1,
                                index: actIndex,
                                activity: activity
                            }
                        });
                        
                        // 设置图标
                        this.setMarkerIcon(marker, dayIndex, actIndex);
                        
                        // 添加点击事件
                        marker.on('click', () => {
                            this.openInfoWindow(marker);
                            this.highlightMarker(markers.length);
                            
                            // 触发点击事件
                            this.trigger('markerClick', {
                                day: dayIndex + 1,
                                index: actIndex,
                                activity: activity,
                                marker: marker
                            });
                        });
                        
                        // 添加到地图和集合
                        marker.setMap(this.map);
                        dayMarkers.push(marker);
                        markers.push(marker);
                    });
                    
                    // 如果有多个活动，创建连接线
                    if (validActivities.length > 1) {
                        const positions = validActivities.map(act => act.location);
                        const polyline = new AMap.Polyline({
                            path: positions,
                            strokeColor: dayColor,
                            strokeWeight: 3,
                            strokeOpacity: 0.7,
                            showDir: true,
                            extData: {
                                day: dayIndex + 1
                            }
                        });
                        
                        polyline.setMap(this.map);
                        polylines.push(polyline);
                    }
                }
            });
            
            this.markers = markers;
            this.polylines = polylines;
            
            // 自动调整地图视野
            if (markers.length > 0) {
                this.map.setFitView();
            }
            
            return true;
        } catch (error) {
            console.error('初始化地图标记失败', error);
            return false;
        }
    }
    
    /**
     * 设置标记图标样式
     * @param {AMap.Marker} marker - 标记对象
     * @param {number} dayIndex - 天数索引
     * @param {number} actIndex - 活动索引
     */
    setMarkerIcon(marker, dayIndex, actIndex) {
        const dayColor = this.dayColors[dayIndex % this.dayColors.length];
        
        // 标记图标默认样式
        const defaultIcon = {
            type: 'image',
            image: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png',
            size: [32, 32],
            anchor: 'bottom-center'
        };
        
        try {
            // 设置自定义图标
            const icon = {
                type: 'svg',
                id: `my-marker-${dayIndex}-${actIndex}`,
                size: [24, 32],
                anchor: 'bottom-center',
                content: `
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32">
                        <path fill="${dayColor}" d="M12 0C5.4 0 0 5.4 0 12c0 7.2 12 20 12 20s12-12.8 12-20c0-6.6-5.4-12-12-12z"/>
                        <circle cx="12" cy="12" r="8" fill="white"/>
                        <text x="12" y="16" text-anchor="middle" font-size="11" font-weight="bold" fill="${dayColor}">${actIndex + 1}</text>
                    </svg>
                `,
                imageOffset: new AMap.Pixel(0, 0),
                imageSize: new AMap.Size(32, 32)
            };
            
            // 保存默认图标，以便恢复时使用
            marker._originalIcon = icon;
            
            // 设置图标
            marker.setIcon(new AMap.Icon(icon));
        } catch (e) {
            console.warn('设置自定义图标失败，使用默认图标', e);
            marker.setIcon(new AMap.Icon(defaultIcon));
        }
    }
    
    /**
     * 打开信息窗口
     * @param {AMap.Marker} marker - 标记对象
     */
    openInfoWindow(marker) {
        try {
            const extData = marker.getExtData();
            const activity = extData.activity;
            
            if (!activity) return;
            
            // 关闭已打开的信息窗口
            this.closeInfoWindows();
            
            // 创建信息窗口内容
            const content = `
                <div class="amap-info-window custom-info">
                    <div class="info-title">${activity.name || '景点'}</div>
                    ${activity.description ? `<div class="info-desc">${activity.description}</div>` : ''}
                    ${activity.address ? `<div class="info-address"><i class="fas fa-map-marker-alt"></i> ${activity.address}</div>` : ''}
                    ${activity.time ? `<div class="info-time"><i class="far fa-clock"></i> ${activity.time}</div>` : ''}
                </div>
            `;
            
            // 创建信息窗口
            const infoWindow = new AMap.InfoWindow({
                content: content,
                offset: new AMap.Pixel(0, -30),
                closeWhenClickMap: true
            });
            
            // 打开信息窗口
            infoWindow.open(this.map, marker.getPosition());
            
            // 添加到信息窗口集合
            this.infoWindows.push(infoWindow);
        } catch (error) {
            console.error('打开信息窗口失败', error);
        }
    }
    
    /**
     * 关闭所有信息窗口
     */
    closeInfoWindows() {
        this.infoWindows.forEach(window => {
            window.close();
        });
        this.infoWindows = [];
    }
    
    /**
     * 清除所有标记和路线
     */
    clearMarkers() {
        // 清除标记
        if (this.markers.length) {
            this.markers.forEach(marker => {
                marker.setMap(null);
            });
            this.markers = [];
        }
        
        // 清除路线
        if (this.polylines.length) {
            this.polylines.forEach(line => {
                line.setMap(null);
            });
            this.polylines = [];
        }
        
        // 关闭信息窗口
        this.closeInfoWindows();
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
    trigger(event, data) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event].forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`Error in ${event} event handler:`, error);
                }
            });
        }
    }
    
    /**
     * 显示特定天数的行程
     * @param {number} dayIndex - 天数索引(0开始)
     */
    showDayItinerary(dayIndex) {
        if (!this.map) return false;
        
        try {
            // 先隐藏所有标记和路线
            this.markers.forEach(marker => {
                const markerDay = marker.getExtData().day - 1;
                marker.show();
                
                if (markerDay !== dayIndex) {
                    marker.hide();
                }
            });
            
            this.polylines.forEach(line => {
                const lineDay = line.getExtData().day - 1;
                line.show();
                
                if (lineDay !== dayIndex) {
                    line.hide();
                }
            });
            
            // 找出当天的标记
            const dayMarkers = this.markers.filter(
                marker => marker.getExtData().day - 1 === dayIndex
            );
            
            // 如果有标记，调整地图视野
            if (dayMarkers.length > 0) {
                const positions = dayMarkers.map(marker => marker.getPosition());
                this.map.setBounds(new AMap.Bounds(positions[0], positions[positions.length - 1]));
            }
            
            return true;
        } catch (error) {
            console.error('显示特定天数行程失败', error);
            return false;
        }
    }

    addMarker(location, options = {}) {
        if (!this.map || !location) return null;
        
        try {
            const marker = new AMap.Marker({
                position: location,
                title: options.title || '',
                map: this.map
            });
            
            // 如果有信息窗口内容，则添加点击事件
            if (options.content) {
                const infoWindow = new AMap.InfoWindow({
                    content: options.content,
                    offset: new AMap.Pixel(0, -30)
                });
                
                marker.on('click', () => {
                    infoWindow.open(this.map, marker.getPosition());
                });
            }
            
            this.markers.push(marker);
            return marker;
        } catch (error) {
            console.error('[MapIntegration] Failed to add marker:', error);
            return null;
        }
    }

    setCenter(location) {
        if (!this.map || !location) return;
        this.map.setCenter(location);
    }

    setFitView() {
        if (!this.map || this.markers.length === 0) return;
        this.map.setFitView(this.markers);
    }

    destroy() {
        if (this.map) {
            this.map.destroy();
            this.map = null;
        }
        this.markers = [];
        this.polylines = [];
        this.infoWindows = [];
    }
}

// 导出地图类
window.MapIntegration = MapIntegration; 