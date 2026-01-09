# 2.0重构版本，暂未开源(需要邀请注册码)
 ## github地址：https://github.com/txwebroot/Navlink-Releases
 ## 项目网站：www.webxx.top
 ## 如何获得邀请注册码：访问项目网站，加入交流群

# NavLink - 个人导航站（1.0现已开源，不需要注册码）

> 一个现代化、模块化的私有应用集成平台，提供导航站、订阅管理和Docker管理等多个实用应用。

<img width="1893" height="883" alt="index" src="https://github.com/user-attachments/assets/5c706603-5268-4042-adaf-5cd51c2579eb" /><img width="1888" height="883" alt="index2" src="https://github.com/user-attachments/assets/0cb3f79f-d4fb-4dc1-9671-b452eaf24533" /><img width="1872" height="863" alt="b-1" src="https://github.com/user-attachments/assets/8398e7ab-4a12-4d6d-a73a-82330914e9c5" /><img width="1908" height="866" alt="vps" src="https://github.com/user-attachments/assets/e71b6177-5c7e-435e-9d8c-29a65ce40021" /><img width="1897" height="869" alt="docker" src="https://github.com/user-attachments/assets/a69a87a3-f2fd-413b-bb8c-3d811e82ec69" /><img width="1899" height="875" alt="sub" src="https://github.com/user-attachments/assets/e4d9378c-9c3d-41b4-a0dc-2e144a14738a" />


## ✨ 核心特性

- **🎨 现代化设计**：基于 React 19 + Tailwind CSS，极致美观的用户界面
- **🔐 安全认证**：JWT 身份认证，支持多用户管理
- **💾 数据持久化**：SQLite 数据库，轻量高效
- **📱 响应式布局**：完美适配桌面端和移动端
- **🐳 容器化部署**：Docker 一键部署，开箱即用
- **🔌 可扩展架构**：模块化应用设计，易于扩展新功能

## 📦 集成应用

| 应用 | 描述 | 功能亮点 |
|------|------|----------|
| 🏠 **NavLink** | 智能导航站 | 分类管理、智能搜索、链接健康检查 |
| 📋 **Sub** | 订阅管理器 | 到期提醒、费用统计 |
| �️ **VPS** | VPS 服务器管理 | SSH 终端、多服务器管理、命令片段 |
| �🐳 **Docker** | 容器管理平台 | 多服务器管理、SSH认证、操作审计 |

---

## 🚀 快速部署

### 方式一：使用现有 Docker 镜像（推荐）

**最简单的安装方式**，直接从 GitHub Container Registry 拉取预构建镜像：

```bash
# 1. 创建项目目录
mkdir navlink && cd navlink

# 2. 创建 docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  navlink:
    image: ghcr.io/txwebroot/navlinks:latest
    container_name: navlink
    ports:
      - "8088:80"
    volumes:
      - ./data:/app/data
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - PORT=80
      - NODE_ENV=production
      - JWT_SECRET=your_secret_key_change_me
      - ADMIN_PASSWORD=admin
    restart: always
EOF

# 3. 启动服务
docker-compose up -d

# 4. 访问应用
# http://localhost:8088
# 默认密码: admin
```

#### 更新镜像

```bash
# 拉取最新镜像
docker-compose pull

# 重启服务
docker-compose up -d
```

---

### 方式二：自行构建 Docker 镜像

如果你想要自定义构建或者开发调试：

```bash
# 1. 克隆项目
git clone https://github.com/txwebroot/navlinks.git
cd navlinks

# 2. 构建镜像
docker build -t navlink:latest .

# 3. 使用 docker-compose 启动
docker-compose up -d

# 或者直接使用 docker run
docker run -d \
  --name navlink \
  -p 8088:80 \
  -v $(pwd)/data:/app/data \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -e PORT=80 \
  -e NODE_ENV=production \
  -e JWT_SECRET=your_secret_key_change_me \
  -e ADMIN_PASSWORD=admin \
  --restart always \
  navlink:latest
```

#### 构建并推送到自己的仓库

```bash
# 构建镜像
docker build -t your-registry/navlink:v1.0.0 .

# 推送镜像
docker push your-registry/navlink:v1.0.0
```

---

### 方式三：本地开发

**环境要求：** Node.js 20+

```bash
# 安装依赖
npm install

# 启动开发服务器（前端 + 后端）
npm run dev:all

# 访问地址
# 前端: http://localhost:3000
# 后端: http://localhost:3001
```

---

## ⚙️ 配置说明

### 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `PORT` | `80` | 服务端口（容器内） |
| `JWT_SECRET` | `navlink_production_secret_key...` | JWT 签名密钥（**请修改**） |
| `ADMIN_PASSWORD` | `admin` | 管理员初始密码（**请修改**） |
| `DB_PATH` | `./data/navlink.db` | 数据库路径 |

### 端口映射

默认配置将容器内的 80 端口映射到主机的 8088 端口。你可以根据需要修改：

```yaml
ports:
  - "你想要的端口:80"
```

### 数据持久化

重要数据位于 `data/` 目录：

```
data/
├── navlink.db       # SQLite 数据库
└── uploads/         # 上传的图片和文件
```

> ⚠️ **重要**：请确保 `data` 目录正确挂载，否则重启后数据会丢失！

---

## 📖 使用指南

### 首次登录

1. 访问 `http://localhost:8088`
2. 点击右上角用户图标
3. 使用默认密码 `admin` 登录
4. **强烈建议立即修改密码**

### 应用切换

点击顶部导航栏的应用图标即可切换：
- 🏠 NavLink - 导航站
- 📋 Sub - 订阅管理
- 🐳 Docker - 容器管理

---

## 🧩 Chrome 扩展

### 安装步骤

1. 打开 Chrome，访问 `chrome://extensions/`
2. 启用"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择 `chrome-extension` 目录
5. 配置服务器地址和密码

---

## 💾 备份与恢复

### 备份数据

```bash
# 方式一：直接复制 data 目录
cp -r data/ data-backup-$(date +%Y%m%d)/

# 方式二：打包压缩
tar -czf navlink-backup-$(date +%Y%m%d).tar.gz data/
```

### 恢复数据

```bash
# 停止服务
docker-compose down

# 恢复数据
tar -xzf navlink-backup-YYYYMMDD.tar.gz

# 重启服务
docker-compose up -d
```

---

## 📁 项目结构

```
navlinks/
├── src/                      # 前端源码
│   ├── apps/                 # 应用模块
│   │   ├── navlink/          # 导航站应用
│   │   ├── sub/              # 订阅管理应用
│   │   └── docker/           # Docker管理应用
│   └── shared/               # 共享组件和工具
├── server/                   # 后端源码
│   ├── database/             # 数据库层 (SQLite)
│   └── routes/               # API 路由
├── data/                     # 数据存储目录
├── chrome-extension/         # Chrome 扩展
├── Dockerfile                # Docker 构建文件
├── docker-compose.yml        # Docker 编排文件
└── README.md                 # 项目文档
```

---

## 🛠️ 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19, TypeScript, Vite, Tailwind CSS |
| 后端 | Node.js, Express, SQLite3, Dockerode, SSH2 |
| 部署 | Docker, Docker Compose |

---

## 🔒 安全建议

1. **修改默认密码**：首次登录后立即修改 `admin` 密码
2. **更改 JWT_SECRET**：使用强随机字符串替换默认值
3. **限制端口访问**：使用防火墙或反向代理限制访问
4. **定期备份**：设置自动备份计划

---

## 📝 更新日志

### v1.1.1 (2024-12)
- ✨ 新增 Docker 管理应用
- 🔧 SSH 私钥认证支持
- ⚡ 性能优化和缓存机制

### v1.1.0 (2024-11)
- ✨ 新增订阅管理应用
- 🔄 迁移至 SQLite 数据库

### v1.0.0 (2024-10)
- 🎉 初始版本发布

---

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 📮 联系方式

- GitHub: [@txwebroot](https://github.com/txwebroot)
- 项目地址: [https://github.com/txwebroot/navlinks](https://github.com/txwebroot/navlinks)

---

⭐ 如果这个项目对你有帮助，请给个 Star！
