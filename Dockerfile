# 阶段 1: 构建 React 前端
FROM node:20-alpine as build
WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装所有依赖（包括 devDependencies，用于构建）
RUN npm install

# 复制源代码
COPY . .

# 构建前端
RUN npm run build

# 阶段 2: 运行 Node.js 服务端
FROM node:20-alpine

# 安装构建工具（sqlite3 需要）
RUN apk add --no-cache \
    python3 \
    make \
    g++

WORKDIR /app

# 复制前端构建产物
COPY --from=build /app/dist ./dist

# 复制服务端代码
COPY --from=build /app/server ./server
COPY --from=build /app/server.js ./server.js
COPY --from=build /app/package*.json ./

# 安装生产环境依赖（包括 sqlite3）
# 注意：sqlite3 需要在运行时环境编译
RUN npm install --omit=dev

# 创建数据目录并设置权限
RUN mkdir -p /app/data && chmod 755 /app/data

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:80/api/subscriptions || exit 1

# 启动服务
CMD ["node", "server.js"]