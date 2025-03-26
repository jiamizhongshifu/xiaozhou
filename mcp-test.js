/**
 * MCP服务和高德地图API密钥测试脚本
 */

(function() {
    // 初始化MCP客户端
    async function initMCP() {
        console.log('开始初始化MCP客户端...');
        
        // 检查MCP是否已加载
        if (window.MCP && window.MCP.amap) {
            console.log('MCP客户端已经加载，跳过加载步骤');
            return window.MCP.amap;
        }
        
        // 加载MCP客户端
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://mcp.so/client/amap-maps.js';
            script.async = true;
            
            script.onload = () => {
                if (!window.MCP || !window.MCP.amap) {
                    console.error('MCP客户端加载失败');
                    reject(new Error('MCP客户端加载失败'));
                    return;
                }
                
                console.log('MCP客户端加载成功');
                resolve(window.MCP.amap);
            };
            
            script.onerror = (err) => {
                console.error('MCP客户端加载失败:', err);
                reject(err);
            };
            
            document.head.appendChild(script);
        });
    }
    
    // 测试地理编码
    async function testGeocode(mcpClient, apiKey, address = '北京故宫') {
        console.log(`测试地理编码: "${address}"`);
        
        // 配置MCP客户端
        mcpClient.configure({
            apiKey: apiKey
        });
        
        try {
            const result = await mcpClient.geocode({
                address: address
            });
            
            if (result && result.geocodes && result.geocodes.length > 0) {
                const location = result.geocodes[0].location;
                console.log('地理编码成功:', location);
                console.log(`坐标: [${location.lng}, ${location.lat}]`);
                return location;
            } else {
                console.warn('地理编码无结果');
                return null;
            }
        } catch (error) {
            console.error('地理编码请求失败:', error);
            return null;
        }
    }
    
    // 测试逆地理编码
    async function testRegeocode(mcpClient, location) {
        if (!location) {
            console.warn('没有坐标可供逆地理编码测试');
            return;
        }
        
        console.log(`测试逆地理编码: [${location.lng}, ${location.lat}]`);
        
        try {
            const result = await mcpClient.regeocode({
                location: `${location.lng},${location.lat}`
            });
            
            if (result && result.regeocode) {
                console.log('逆地理编码成功:', result.regeocode.formatted_address);
                return result.regeocode;
            } else {
                console.warn('逆地理编码无结果');
                return null;
            }
        } catch (error) {
            console.error('逆地理编码请求失败:', error);
            return null;
        }
    }
    
    // 测试POI搜索
    async function testPoiSearch(mcpClient, keyword = '餐厅', city = '北京') {
        console.log(`测试POI搜索: "${keyword}" in "${city}"`);
        
        try {
            const result = await mcpClient.placeSearch({
                keywords: keyword,
                city: city,
                offset: 5, // 只获取前5条
                page: 1
            });
            
            if (result && result.pois && result.pois.length > 0) {
                console.log(`POI搜索成功，共${result.pois.length}条结果`);
                console.log('第一个POI:', result.pois[0].name);
                return result.pois;
            } else {
                console.warn('POI搜索无结果');
                return [];
            }
        } catch (error) {
            console.error('POI搜索请求失败:', error);
            return [];
        }
    }
    
    // 获取API密钥
    function getApiKey() {
        // 首先尝试从全局配置获取
        if (window.AppConfig && window.AppConfig.MAP_API_KEY) {
            return window.AppConfig.MAP_API_KEY;
        }
        
        // 然后尝试从URL参数获取
        const urlParams = new URLSearchParams(window.location.search);
        const keyFromUrl = urlParams.get('key');
        if (keyFromUrl) {
            return keyFromUrl;
        }
        
        // 默认使用
        return 'b5091483e1ca44aa080c31b281e376b0';
    }
    
    // 显示测试结果
    function appendResult(message, isSuccess = true) {
        if (typeof document === 'undefined') return;
        
        const resultContainer = document.getElementById('test-results');
        if (!resultContainer) return;
        
        const resultItem = document.createElement('div');
        resultItem.className = `test-result ${isSuccess ? 'success' : 'error'}`;
        resultItem.textContent = message;
        resultContainer.appendChild(resultItem);
    }
    
    // 主函数
    async function runTests() {
        try {
            // 获取API密钥
            const apiKey = getApiKey();
            console.log('使用API密钥:', apiKey);
            
            if (typeof document !== 'undefined') {
                const keyElement = document.getElementById('api-key');
                if (keyElement) keyElement.textContent = apiKey;
            }
            
            // 初始化MCP客户端
            const mcpClient = await initMCP();
            appendResult('MCP客户端初始化成功');
            
            // 测试地理编码
            const location = await testGeocode(mcpClient, apiKey);
            if (location) {
                appendResult(`地理编码成功: [${location.lng}, ${location.lat}]`);
                
                // 测试逆地理编码
                const address = await testRegeocode(mcpClient, location);
                if (address) {
                    appendResult(`逆地理编码成功: ${address.formatted_address}`);
                } else {
                    appendResult('逆地理编码失败', false);
                }
            } else {
                appendResult('地理编码失败', false);
            }
            
            // 测试POI搜索
            const pois = await testPoiSearch(mcpClient, '咖啡店', '上海');
            if (pois && pois.length > 0) {
                appendResult(`POI搜索成功，找到${pois.length}个结果`);
            } else {
                appendResult('POI搜索失败或无结果', false);
            }
            
            console.log('所有测试完成');
            appendResult('所有测试完成');
            
        } catch (error) {
            console.error('测试过程中发生错误:', error);
            appendResult(`测试失败: ${error.message}`, false);
        }
    }
    
    // 导出测试方法
    window.MCPTest = {
        run: runTests,
        testGeocode: testGeocode,
        testRegeocode: testRegeocode,
        testPoiSearch: testPoiSearch
    };
    
    // 如果在浏览器环境中，页面加载完成后自动运行测试
    if (typeof document !== 'undefined') {
        if (document.readyState === 'complete') {
            runTests();
        } else {
            window.addEventListener('load', runTests);
        }
    }
})(); 