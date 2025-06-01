# 旅游行程规划系统

旅游行程规划系统是一个全栈应用程序，帮助用户规划旅游行程，提供目的地推荐、行程生成、预算管理和多端协同编辑功能。

## 功能特点

- **目的地推荐**：基于用户偏好推荐旅游目的地（通过DeepSeek API实现）
- **行程生成**：智能生成旅行路线和日程安排（通过DeepSeek API实现）
- **预算管理**：帮助用户设置和跟踪旅行预算，记录费用
- **多端协同编辑**：支持多个用户实时协作编辑同一行程

## 技术栈

### 前端

- React
- React Router
- Ant Design
- Axios
- Socket.io Client

### 后端

- Node.js
- Express
- MongoDB (Mongoose)
- JWT认证
- Socket.io
- DeepSeek API集成

## 安装和运行

### 先决条件

- Node.js (v14+)

### 后端服务

```bash
# 进入后端目录
cd server

# 安装依赖
npm install

# 配置环境变量
# 复制.env.example文件为.env，并填写必要的配置项
cp .env.example .env

# 启动开发服务器
npm run dev
```

### 前端应用

```bash
# 进入前端目录
cd client

# 安装依赖
npm install

# 配置环境变量
# 在.env文件中修改REACT_APP_API_URL项为后端地址

# 启动开发服务器
npm start
```

## 项目结构

```
travel-planner/
├── client/                   # 前端应用
│   ├── public/               # 静态文件
│   └── src/                  # 源代码
│       ├── components/       # 共享组件
│       ├── pages/            # 页面组件
│       ├── utils/            # 工具函数和上下文
│       └── App.js            # 主应用组件
│
└── server/                   # 后端应用
    ├── src/                  # 源代码
    │   ├── config/           # 配置文件
    │   ├── controllers/      # 控制器
    │   ├── middleware/       # 中间件
    │   ├── models/           # 数据模型
    │   ├── routes/           # 路由
    │   ├── utils/            # 工具函数
    │   └── index.js          # 主服务器文件
    └── .env                  # 环境变量
```

## API端点

### 认证

- `POST /api/auth/register` - 注册新用户
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息
- `PUT /api/auth/preferences` - 更新用户偏好

### 目的地

- `GET /api/destinations` - 获取所有目的地
- `POST /api/destinations/recommendations` - 获取推荐目的地
- `GET /api/destinations/:id` - 获取单个目的地
- `POST /api/destinations` - 创建目的地
- `PUT /api/destinations/:id` - 更新目的地
- `DELETE /api/destinations/:id` - 删除目的地

### 行程

- `GET /api/itineraries` - 获取用户的所有行程
- `GET /api/itineraries/:id` - 获取单个行程
- `POST /api/itineraries/generate` - 生成行程
- `POST /api/itineraries` - 创建行程
- `PUT /api/itineraries/:id` - 更新行程
- `POST /api/itineraries/:id/collaborators` - 添加/移除协作者
- `DELETE /api/itineraries/:id` - 删除行程

### 预算

- `GET /api/budgets/itinerary/:itineraryId` - 获取行程预算
- `POST /api/budgets/itinerary/:itineraryId` - 创建/更新行程预算
- `POST /api/budgets/:id/expenses` - 添加费用
- `DELETE /api/budgets/:id/expenses/:expenseId` - 删除费用
- `GET /api/budgets/:id/statistics` - 获取支出统计

## Socket.io事件

- `join-room` - 加入行程协作房间
- `leave-room` - 离开行程协作房间
- `itinerary-update` - 行程更新通知

## 贡献

欢迎贡献代码和提出问题！

## 许可证

MIT
