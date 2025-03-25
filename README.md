# 旅行规划师小周

小周是一款基于AI的旅行规划助手，通过自然语言交互，帮助用户定制专属旅行方案。用户可以通过对话式界面提出需求，AI会给出个性化的旅行建议、行程安排和相关资源。

## 项目预览

旅行规划师小周提供了一个直观、简洁的用户界面，让用户可以轻松规划旅行，获取灵感，并管理自己的旅行计划。

![小舟AI旅行规划师](https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&auto=format&fit=crop&w=1035&q=80)

## 核心功能

- **智能对话系统**：理解用户自然语言输入，进行旅行相关问答
- **行程定制**：根据用户喜好自动生成个性化旅行计划
- **目的地推荐**：基于预算、季节、兴趣等因素推荐适合目的地
- **旅行资源整合**：提供机票、酒店、景点等信息
- **收藏与管理**：保存喜欢的目的地和行程

## 技术栈

- 前端：HTML5, CSS3 (Tailwind CSS), JavaScript
- 设计：采用苹果风格设计理念，简洁、直观的用户界面
- 响应式：适配各种屏幕尺寸，提供最佳用户体验

## 项目结构

```
小舟AI旅行规划师/
├── index.html              # 主页和框架页面
├── planner.html            # 旅行规划聊天界面
├── inspiration.html        # 旅行灵感页面
├── saved.html              # 保存的行程页面
├── about.html              # 关于我们页面
├── api_test.html           # API测试页面
├── css/
│   ├── style.css           # 全局样式
│   └── chat.css            # 聊天界面样式
├── js/
│   ├── config.js           # 配置文件
│   ├── utils.js            # 工具函数
│   ├── api.js              # API模块
│   ├── main.js             # 主JS逻辑
│   ├── chat.js             # 聊天功能模块
│   └── api_test.js         # API测试模块
└── README.md               # 项目说明文档
```

## 最近更新

- **文件结构优化**：合并了首页与框架页面，废弃了单独的home.html文件
- **导航体验改进**：优化了页面跳转逻辑和导航激活状态
- **简化界面风格**：采用统一的浅色主题，提供清晰一致的视觉体验
- **响应式设计优化**：针对移动端体验进行全面优化
- **增加了"关于我们"页面**：展示团队和项目信息

## 开发指南

### 环境设置

本项目是纯前端项目，无需特殊环境配置。只需要一个现代浏览器即可运行。

### 本地运行

1. 克隆项目到本地
2. 打开 `index.html` 文件
3. 或使用任意静态服务器运行项目

### 开发与贡献

1. **界面扩展**：可以添加更多功能页面，如详细的目的地介绍、用户个人中心等
2. **功能增强**：可以实现更多交互功能，如真实的聊天功能、行程导出等
3. **内容丰富**：添加更多的旅行目的地数据、推荐内容等

### 文件修改指南
- 页面内容修改：编辑对应HTML文件
- 样式调整：修改`css/style.css`或`css/chat.css`
- 功能逻辑：根据功能模块修改对应JS文件

## 后续开发计划

- 集成真实的自然语言处理API
- 添加用户登录注册系统
- 接入真实的旅行资源数据
- 开发移动应用版本
- 增加社区功能，用户可以分享行程
- 旅行计划导出为PDF功能
- 地图集成
- 添加深色模式支持（未来计划）

## 关于我们

小舟AI旅行规划师旨在利用AI技术简化旅行规划过程，让每个人都能轻松规划完美旅行。我们致力于提供个性化、高质量的旅行建议，帮助用户创造难忘的旅行体验。

## 联系我们

- Email: support@xiaozhouai.com
- 微信: xiaozhouai_wechat

## 许可证

本项目采用 MIT 许可证 

# 旅行规划师小周 - 首页优化说明

## 首页聊天窗口优化

参考Layla.ai的设计风格，我们对首页聊天窗口进行了全面优化，主要包括以下几个方面：

### 1. 聊天窗口与预设按钮整合

- 将原先独立的预设按钮区域直接集成到聊天窗口底部
- 采用横向滚动设计，支持更多预设选项而不占用过多空间
- 增强了按钮的视觉效果，添加了悬停动画和阴影

### 2. 输入框提示轮播功能

- 在输入框内添加自动轮播的提示文本，向用户展示可以询问的问题示例
- 提示文本支持点击功能，点击即可填充到输入框
- 轮播采用淡入淡出效果，定时自动切换不同的提示内容

### 3. 交互体验优化

- 输入框获得焦点时的视觉反馈增强
- 发送按钮动效优化，包括悬停和点击状态
- 预设按钮的悬停动画和点击反馈优化

### 4. 响应式设计增强

- 针对不同屏幕尺寸的设备调整了布局和元素大小
- 在移动设备上优化了聊天窗口高度和按钮尺寸
- 确保在各种设备上都有良好的用户体验

## 使用方法

1. 在首页聊天窗口直接输入旅行相关问题，或点击输入框内的提示文本
2. 点击底部的预设按钮快速开始常见旅行规划话题
3. 点击发送按钮或按Enter键发送消息，系统会自动跳转到详细聊天页面

## 访问地址

本地测试地址：http://localhost:8000/index.html

## 技术亮点

1. 输入提示轮播使用纯JavaScript实现，无需额外依赖
2. 采用CSS过渡动画提升视觉体验
3. 全面优化移动端适配
4. 保持苹果设计风格的一致性 