/**
 * 位置服务工具 - 集成高德地图API和MCP服务
 * 提供地理编码、逆地理编码和POI搜索功能
 */

class LocationService {
    /**
     * 初始化位置服务
     * @param {string} apiKey - 高德地图API密钥
     */
    constructor(apiKey) {
        this.apiKey = apiKey || '';
        this.ready = false;
        this.isLoading = false;
        this.callbacks = [];
        this.geocoder = null;
        this.placeSearch = null;

        // MCP集成配置
        this.mcpConfig = {
            enabled: false,
            // 从全局配置中获取MCP端点
            endpoint: window.AppConfig && window.AppConfig.MCP_CONFIG ? 
                window.AppConfig.MCP_CONFIG.ENDPOINT : 
                'https://router.mcp.so/sse/lbdbqom8omdc9p'
        };
        
        console.log("位置服务初始化，MCP端点:", this.mcpConfig.endpoint);
    }

    /**
     * 初始化服务
     * @returns {Promise<LocationService>} 服务实例
     */
    async init() {
        if (this.ready) return this;
        if (this.isLoading) {
            return new Promise(resolve => this.callbacks.push(resolve));
        }

        this.isLoading = true;
        
        try {
            // 尝试使用MCP服务
            if (this.mcpConfig.enabled) {
                try {
                    await this.initMcpService();
                } catch (mcpError) {
                    console.warn('MCP服务初始化失败，自动切换到SDK模式:', mcpError.message);
                    // 失败时自动切换到SDK模式
                    await this.initSdkService();
                }
            } else {
                // 使用传统SDK
                await this.initSdkService();
            }
            
            this.ready = true;
            this.isLoading = false;
            
            // 调用等待的回调
            this.callbacks.forEach(callback => callback(this));
            this.callbacks = [];
            
            return this;
        } catch (error) {
            console.error('位置服务初始化失败', error);
            this.isLoading = false;
            throw error;
        }
    }

    /**
     * 初始化MCP服务
     */
    async initMcpService() {
        // 设置超时，防止MCP加载无限等待
        const mcpTimeout = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('MCP服务加载超时')), 5000);
        });

        return Promise.race([mcpTimeout, this._loadMcpService()]);
    }

    /**
     * 加载MCP服务实现
     */
    async _loadMcpService() {
        // 检查是否已经存在MCP客户端
        if (window.MCP && window.MCP.amap) {
            console.log('使用已存在的MCP Amap客户端');
            this.mcpClient = window.MCP.amap;
            return;
        }

        // 加载MCP客户端
        console.log('初始化高德地图MCP服务');
        
        return new Promise((resolve, reject) => {
            // 使用自定义MCP服务端点URL
            const mcpUrl = this.mcpConfig.endpoint || 'https://router.mcp.so/sse/lbdbqom8omdc9p';
            console.log('使用MCP服务端点:', mcpUrl);
            
            // 如果已经存在MCP对象但没有amap客户端，可能是需要初始化
            if (window.MCP && !window.MCP.amap) {
                try {
                    // 尝试手动初始化MCP客户端
                    console.log('尝试手动初始化MCP客户端');
                    window.MCP.init();
                    
                    if (window.MCP.amap) {
                        console.log('MCP客户端手动初始化成功');
                        this.mcpClient = window.MCP.amap;
                        
                        // 配置MCP客户端
                        window.MCP.amap.configure({
                            apiKey: this.apiKey
                        });
                        
                        console.log('高德地图MCP服务初始化成功');
                        resolve();
                        return;
                    }
                } catch (err) {
                    console.error('手动初始化MCP客户端失败:', err);
                }
            }
            
            // 使用服务器判断当前环境是否支持MCP
            this._checkMcpSupport(mcpUrl).then(supported => {
                if (!supported) {
                    console.log('当前环境不支持MCP服务，将使用SDK方式');
                    this.mcpConfig.enabled = false;
                    reject(new Error('当前环境不支持MCP服务'));
                    return;
                }
                
                // 加载MCP客户端脚本
                const script = document.createElement('script');
                script.src = 'https://mcp.so/client/amap-maps.js';
                script.async = true;
                
                script.onload = () => {
                    if (!window.MCP || !window.MCP.amap) {
                        console.error('MCP客户端脚本加载成功但初始化失败');
                        reject(new Error('高德地图MCP客户端初始化失败'));
                        return;
                    }
                    
                    // 配置MCP客户端
                    try {
                        window.MCP.amap.configure({
                            apiKey: this.apiKey,
                            // 使用自定义endpoint
                            endpoint: mcpUrl
                        });
                        
                        this.mcpClient = window.MCP.amap;
                        console.log('高德地图MCP服务初始化成功');
                        resolve();
                    } catch (err) {
                        console.error('配置MCP客户端失败:', err);
                        reject(err);
                    }
                };
                
                script.onerror = (err) => {
                    console.error('高德地图MCP客户端加载失败', err);
                    // 失败时回退到SDK方式
                    console.log('尝试回退到SDK方式');
                    reject(new Error('MCP客户端脚本加载失败'));
                };
                
                document.head.appendChild(script);
            }).catch(err => {
                console.error('检查MCP支持时出错:', err);
                reject(err);
            });
        });
    }

    /**
     * 检查当前环境是否支持MCP
     * @param {string} endpoint - MCP服务端点
     * @returns {Promise<boolean>} 是否支持
     */
    async _checkMcpSupport(endpoint) {
        try {
            // 简单检查网络连接
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('超时')), 2000)
            );
            
            // 使用OPTIONS请求检查端点是否可达
            const fetchPromise = fetch(endpoint, { 
                method: 'HEAD',
                mode: 'no-cors' // 使用no-cors模式，避免跨域问题
            });
            
            await Promise.race([fetchPromise, timeoutPromise]);
            return true;
        } catch (error) {
            console.warn('MCP服务不可达:', error);
            return false;
        }
    }

    /**
     * 初始化SDK服务
     */
    async initSdkService() {
        return new Promise((resolve, reject) => {
            // 检查AMap是否已加载
            if (window.AMap) {
                this.initAMapPlugins().then(resolve).catch(reject);
                return;
            }

            // 加载AMap
            const script = document.createElement('script');
            script.src = `https://webapi.amap.com/maps?v=2.0&key=${this.apiKey}&plugin=AMap.Geocoder,AMap.PlaceSearch`;
            script.async = true;
            
            script.onload = () => {
                if (!window.AMap) {
                    reject(new Error('高德地图API加载失败'));
                    return;
                }
                
                console.log('高德地图API加载成功，准备初始化插件');
                this.initAMapPlugins().then(resolve).catch(reject);
            };
            
            script.onerror = (err) => {
                console.error('高德地图API加载失败', err);
                reject(err);
            };
            
            document.head.appendChild(script);
        });
    }

    /**
     * 初始化高德地图插件
     */
    async initAMapPlugins() {
        // 确保AMap已加载
        if (!window.AMap) {
            throw new Error('高德地图API未加载，无法初始化插件');
        }
        
        try {
            // 如果插件没有加载，手动加载插件
            if (!window.AMap.Geocoder || !window.AMap.PlaceSearch) {
                console.log('手动加载高德地图插件');
                
                await new Promise((resolve, reject) => {
                    try {
                        AMap.plugin(['AMap.Geocoder', 'AMap.PlaceSearch'], () => {
                            console.log('插件加载完成');
                            resolve();
                        });
                    } catch (error) {
                        console.error('插件加载失败', error);
                        reject(error);
                    }
                });
            }
            
            // 检查插件是否加载成功
            if (!window.AMap.Geocoder) {
                throw new Error('Geocoder插件未成功加载');
            }
            
            if (!window.AMap.PlaceSearch) {
                throw new Error('PlaceSearch插件未成功加载');
            }
            
            // 初始化地理编码服务
            this.geocoder = new AMap.Geocoder({
                city: "全国", // 全国范围
                batch: false  // 单个查询
            });
            
            // 初始化POI搜索
            this.placeSearch = new AMap.PlaceSearch({
                pageSize: 10,
                pageIndex: 1
            });
            
            console.log('高德地图API插件初始化成功');
            
        } catch (error) {
            console.error('初始化插件失败:', error);
            throw error;
        }
    }

    /**
     * 启用MCP服务
     * @param {boolean} enabled - 是否启用
     */
    enableMcpService(enabled = true) {
        this.mcpConfig.enabled = enabled;
        // 如果已初始化，则需要重新初始化
        if (this.ready) {
            this.ready = false;
            return this.init();
        }
        return Promise.resolve(this);
    }

    /**
     * 设置MCP服务端点
     * @param {string} endpoint - 服务端点URL
     */
    setMcpEndpoint(endpoint) {
        if (endpoint) {
            this.mcpConfig.endpoint = endpoint;
            console.log('MCP服务端点已更新:', endpoint);
        }
    }

    /**
     * 根据地址获取坐标
     * @param {string} address - 地址文本
     * @returns {Promise<Array>} 坐标数组 [lng, lat]
     */
    async getCoordinatesByAddress(address) {
        await this.ensureReady();
        
        try {
            if (this.mcpConfig.enabled && this.mcpClient) {
                try {
                    // 使用MCP服务
                    const result = await this.mcpClient.geocode({
                        address: address
                    });
                    
                    if (result && result.geocodes && result.geocodes.length > 0) {
                        const location = result.geocodes[0].location;
                        return [location.lng, location.lat];
                    }
                } catch (error) {
                    console.warn('MCP地理编码失败，尝试SDK方式:', error.message);
                    // 失败时尝试SDK
                    if (this.geocoder) {
                        return this._getCoordinatesBySdk(address);
                    }
                }
            } else if (this.geocoder) {
                // 使用SDK
                return this._getCoordinatesBySdk(address);
            } else {
                throw new Error('地理编码服务未初始化');
            }
        } catch (error) {
            console.error('地址解析错误', error);
            throw error;
        }
        
        return null;
    }

    /**
     * 使用SDK获取坐标（内部方法）
     * @param {string} address - 地址文本
     * @returns {Promise<Array>} 坐标数组 [lng, lat]
     */
    async _getCoordinatesBySdk(address) {
        return new Promise((resolve, reject) => {
            this.geocoder.getLocation(address, (status, result) => {
                if (status === 'complete' && result.geocodes.length) {
                    const location = result.geocodes[0].location;
                    resolve([location.lng, location.lat]);
                } else {
                    reject(new Error('地址解析失败: ' + status));
                }
            });
        });
    }

    /**
     * 根据坐标获取地址
     * @param {Array} lnglat - 坐标数组 [lng, lat]
     * @returns {Promise<Object>} 地址信息
     */
    async getAddressByCoordinates(lnglat) {
        await this.ensureReady();
        
        try {
            if (this.mcpConfig.enabled && this.mcpClient) {
                try {
                    // 使用MCP服务
                    const result = await this.mcpClient.regeocode({
                        location: lnglat.join(',')
                    });
                    
                    if (result && result.regeocode) {
                        return result.regeocode.formatted_address;
                    }
                } catch (error) {
                    console.warn('MCP逆地理编码失败，尝试SDK方式:', error.message);
                    // 失败时尝试SDK
                    if (this.geocoder) {
                        return this._getAddressBySdk(lnglat);
                    }
                }
            } else if (this.geocoder) {
                // 使用SDK
                return this._getAddressBySdk(lnglat);
            } else {
                throw new Error('地理编码服务未初始化');
            }
        } catch (error) {
            console.error('逆地址解析错误', error);
            throw error;
        }
        
        return null;
    }

    /**
     * 使用SDK获取地址（内部方法）
     * @param {Array} lnglat - 坐标数组 [lng, lat]
     * @returns {Promise<string>} 地址文本
     */
    async _getAddressBySdk(lnglat) {
        return new Promise((resolve, reject) => {
            this.geocoder.getAddress(lnglat, (status, result) => {
                if (status === 'complete' && result.regeocode) {
                    resolve(result.regeocode.formattedAddress);
                } else {
                    reject(new Error('逆地址解析失败: ' + status));
                }
            });
        });
    }

    /**
     * 搜索POI
     * @param {string} keyword - 关键词
     * @param {string} city - 城市
     * @param {Object} options - 其他选项
     * @returns {Promise<Array>} POI列表
     */
    async searchPOI(keyword, city = '全国', options = {}) {
        await this.ensureReady();
        
        try {
            if (this.mcpConfig.enabled && this.mcpClient) {
                try {
                    // 使用MCP服务
                    const result = await this.mcpClient.placeSearch({
                        keywords: keyword,
                        city: city,
                        ...options
                    });
                    
                    if (result && result.pois) {
                        return result.pois;
                    }
                } catch (error) {
                    console.warn('MCP POI搜索失败，尝试SDK方式:', error.message);
                    // 失败时尝试SDK
                    if (this.placeSearch) {
                        return this._searchPOIBySdk(keyword, city, options);
                    }
                }
            } else if (this.placeSearch) {
                // 使用SDK
                return this._searchPOIBySdk(keyword, city, options);
            } else {
                throw new Error('POI搜索服务未初始化');
            }
        } catch (error) {
            console.error('POI搜索错误', error);
            throw error;
        }
        
        return [];
    }

    /**
     * 使用SDK搜索POI（内部方法）
     * @param {string} keyword - 关键词
     * @param {string} city - 城市
     * @param {Object} options - 其他选项
     * @returns {Promise<Array>} POI列表
     */
    async _searchPOIBySdk(keyword, city, options) {
        return new Promise((resolve, reject) => {
            this.placeSearch.setCity(city);
            if (options.pageSize) {
                this.placeSearch.setPageSize(options.pageSize);
            }
            if (options.pageIndex) {
                this.placeSearch.setPageIndex(options.pageIndex);
            }
            
            this.placeSearch.search(keyword, (status, result) => {
                if (status === 'complete' && result.poiList) {
                    resolve(result.poiList.pois);
                } else {
                    reject(new Error('POI搜索失败: ' + status));
                }
            });
        });
    }

    /**
     * 确保服务已初始化
     */
    async ensureReady() {
        if (!this.ready) {
            await this.init();
        }
    }

    /**
     * 从地点名称批量获取坐标
     * @param {Array} places - 地点名称数组
     * @param {string} city - 优先搜索的城市
     * @returns {Promise<Object>} 地点名称到坐标的映射
     */
    async batchGeocode(places, city = '全国') {
        if (!places || !places.length) return {};
        
        const result = {};
        const promises = places.map(async place => {
            try {
                // 先尝试直接地理编码
                const coordinates = await this.getCoordinatesByAddress(place);
                if (coordinates) {
                    result[place] = coordinates;
                    return;
                }
                
                // 如果失败，尝试POI搜索
                const pois = await this.searchPOI(place, city, { pageSize: 1 });
                if (pois && pois.length > 0) {
                    const location = pois[0].location;
                    result[place] = [location.lng, location.lat];
                }
            } catch (error) {
                console.warn(`获取"${place}"的坐标失败`, error);
            }
        });
        
        await Promise.allSettled(promises);
        return result;
    }

    /**
     * 提取文本中的地点并获取坐标
     * @param {string} text - 包含地点的文本
     * @param {string} city - 优先搜索的城市
     * @returns {Promise<Array>} 地点数据数组 
     */
    async extractPlacesFromText(text, city = '全国') {
        if (!text) return [];
        
        // 简单的地点提取规则（可以进一步完善）
        const placePattern = /([^，。,.、；;!！?？\s]+?(景区|景点|公园|寺|塔|湖|山|城|宫|陵|街|路|馆|大厦|广场|酒店|餐厅|大学|学院|中心|基地|村|海滩))/g;
        const matches = text.match(placePattern) || [];
        const uniquePlaces = [...new Set(matches)];
        
        // 获取坐标
        const coordinates = await this.batchGeocode(uniquePlaces, city);
        
        // 转换为标准格式
        return uniquePlaces
            .filter(place => coordinates[place]) // 只保留有坐标的地点
            .map(place => ({
                name: place,
                location: coordinates[place],
                source: '文本提取'
            }));
    }
}

// 导出服务类
window.LocationService = LocationService; 