# NavLink 导航站系统

> 一个现代化、可定制的私有网址导航站，支持后台管理、多应用架构和 Chrome 扩展集成。

![Version](https://img.shields.io/badge/version-1.1.0-green.svg)

## ✨ 主要特性

- **现代化 UI 设计**：基于 React 19 + Tailwind CSS 构建，响应式设计，完美适配 PC 和移动端。
- **可视化后台管理**：所见即所得的配置管理，支持拖拽排序、图标上传、分类管理。
- **多应用架构**：
  - **Navlink**：主导航应用，支持分类、搜索、热门推荐。
  - **Sub**：订阅管理子应用，追踪服务订阅状态和续费提醒。
- **数据持久化**：
  - 采用 **SQLite** 数据库存储，轻量且高效。
  - 支持配置数据的导入/导出和备份/恢复。
- **高级功能**：
  - **链接健康检查**：自动检测失效链接。
  - **Chrome 扩展支持**：一键保存当前网页到导航站。
  - **文件管理**：内置图标和图片上传管理。
- **安全可靠**：JWT 身份认证，支持 Docker 一键部署。

## 🚀 快速开始

### 方式一：Docker 部署（推荐）

只需一个命令即可启动完整服务：

```bash
# 构建并启动容器
docker-compose up -d

# 访问应用
# 前台: http://localhost:8088
# 后台: 点击右上角用户图标登录后再次点击即可打开管理面板
```

### 方式二：本地开发

需要 Node.js 20+ 环境。

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器 (同时启动前端和后端)
npm run dev:all

# 访问 http://localhost:3000 (前端) 和 http://localhost:3001 (后端API)
```

## 📁 项目结构

```
NavLink/
├── src/                 # 前端源码 (React)
│   ├── apps/            # 多应用目录
│   │   ├── navlink/     # 主导航应用
│   │   └── sub/         # 订阅管理应用
│   └── shared/          # 共享组件和工具
├── server/              # 后端源码 (Node.js/Express)
│   ├── database/        # 数据库层 (SQLite DAO)
│   ├── routes/          # API 路由
│   └── services/        # 业务逻辑服务
├── data/                # 数据存储 (Docker 挂载点)
│   ├── navlink.db       # SQLite 数据库文件
│   └── uploads/         # 上传的图片资源
├── chrome-extension/    # Chrome 伴侣插件源码
├── docker-compose.yml   # Docker 编排文件
└── README.md            # 项目文档
```

## ⚙️ 配置说明

### 环境变量

可以在 `docker-compose.yml` 或 `.env` 文件中配置：

| 变量名 | 默认值 | 说明 |
|Data | Value | Description|
|---|---|---|
| `PORT` | `80` | 服务运行端口 (容器内) |
| `JWT_SECRET` | `...` | JWT 签名密钥，生产环境请修改 |
| `ADMIN_PASSWORD` | `admin` | 后台管理员初始密码 |
| `DB_PATH` | `./data/navlink.db` | SQLite 数据库路径 |

### 数据备份

所有重要数据都存储在 `data/` 目录下：
- **数据库**: `data/navlink.db`
- **上传文件**: `data/uploads/`

建议定期备份整个 `data` 目录。

## 🧩 Chrome 扩展

本项目包含一个 Chrome 扩展，位于 `chrome-extension/` 目录。

**安装步骤：**
1. 打开 Chrome 浏览器，访问 `chrome://extensions/`
2. 开启右上角的 "开发者模式"
3. 点击 "加载已解压的扩展程序"
4. 选择项目中的 `chrome-extension` 文件夹
5. 在扩展设置中填写你的 NavLink 服务器地址 (如 `http://localhost:8088`) 和登录密码

## � 技术栈

- **前端**: React 19, TypeScript, Vite, Tailwind CSS, FontAwesome
- **后端**: Node.js, Express, SQLite3, Multer, JWT
- **运维**: Docker, Docker Compose

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！
