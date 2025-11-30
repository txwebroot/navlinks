# NavLink 导航站系统

> 一个现代化、可定制的网址导航站，支持后台管理和多前台应用架构。

## 🚀 快速开始

### 开发环境

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:3000
```

### 生产构建

```bash
# 构建项目
npm run build

# 预览构建结果
npm run preview
```

### Docker部署

```bash
# 构建并启动容器
docker-compose up -d --build

# 查看日志
docker-compose logs -f

# 停止容器
docker-compose down
```

## 📁 项目结构

```
NavLink/
├── src/
│   ├── shared/              # 共享层（所有应用共用）
│   │   ├── components/      # 通用组件
│   │   ├── utils/           # 工具函数
│   │   ├── types/           # 类型定义
│   │   └── context/         # React Context
│   └── apps/                # 应用层
│       └── navlink/         # 导航站应用
├── server.js                # Node.js后端服务
├── data/                    # 数据存储目录
│   ├── config.json         # 网站配置
│   └── uploads/            # 上传文件
├── docs/                    # 项目文档
│   ├── README.md           # 详细文档
│   ├── DEPLOY_GUIDE.md     # 部署指南
│   └── REFACTOR_SUMMARY.md # 重构总结
└── chrome-extension/        # Chrome扩展（可选）
```

## 📖 文档

- [完整项目文档](./docs/README.md) - 详细的功能说明和API文档
- [架构说明](./src/README.md) - 项目架构和代码组织
- [部署指南](./docs/DEPLOY_GUIDE.md) - 生产环境部署步骤
- [重构总结](./docs/REFACTOR_SUMMARY.md) - 多应用架构重构说明

## 🎯 主要功能

- ✅ **可视化编辑** - 所见即所得的后台管理界面
- ✅ **完全可定制** - 主题、布局、内容全部可配置
- ✅ **响应式设计** - 完美适配PC、平板、手机
- ✅ **搜索功能** - 快捷键搜索、聚合搜索引擎
- ✅ **链接健康检查** - 自动检测失效链接
- ✅ **媒体管理** - 文件上传和资源管理
- ✅ **多应用架构** - 支持新增多个前台应用
- ✅ **Docker部署** - 一键容器化部署

## 🔧 技术栈

### 前端
- **框架**: React 19 + TypeScript 5.8
- **构建**: Vite 6
- **样式**: Tailwind CSS 3
- **图标**: Font Awesome 6

### 后端
- **运行时**: Node.js 20
- **框架**: Express.js
- **认证**: JWT
- **文件上传**: Multer

### 部署
- **容器化**: Docker + Docker Compose
- **反向代理**: Nginx（可选）

## ⚙️ 配置

### 环境变量

```bash
# .env（可选）
PORT=3001                    # 后端端口
JWT_SECRET=your_secret_key   # JWT密钥
ADMIN_PASSWORD=admin         # 管理员密码
```

### Docker环境变量

在 `docker-compose.yml` 中配置：
```yaml
environment:
  - PORT=80
  - JWT_SECRET=navlink_production_secret_key
  - ADMIN_PASSWORD=admin
```

## 🔐 默认密码

- **后台管理密码**: `admin`（首次使用请修改）

## 🌟 新增前台应用

项目采用多应用架构，可轻松新增前台页面：

```bash
# 1. 创建应用目录
mkdir -p src/apps/your-app

# 2. 参考 src/apps/navlink 创建应用
# 3. 复用 src/shared 中的所有组件和工具
```

详见 [架构文档](./src/README.md)

## 📊 项目信息

- **版本**: 1.0.0
- **作者**: txwen
- **许可**: MIT
- **最后更新**: 2024-11-27

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📝 更新日志

### v1.0.0 (2024-11-27)
- ✅ 重构为多应用架构
- ✅ 实现Token自动验证和过期退出
- ✅ 优化项目结构和文档

---

**开始使用**: `npm install && npm run dev`  
**快速部署**: `docker-compose up -d`
