# NavLink 项目结构说明

## 📁 新的目录结构

```
src/
├── index.tsx                # 主入口文件
├── index.css                # 全局样式
│
├── shared/                  # 共享层（所有应用共用）
│   ├── components/          # 共享组件
│   │   ├── common/         # 通用组件（Icon, Toast, Modal等）
│   │   └── ui/             # UI组件（Button, Input等）
│   ├── utils/              # 工具函数
│   │   ├── api.ts         # API调用
│   │   ├── url.ts         # URL处理
│   │   └── linkHealthChecker.ts
│   ├── hooks/              # 自定义Hooks（预留）
│   ├── types/              # TypeScript类型定义
│   ├── context/            # React Context
│   │   └── ConfigContext.tsx
│   └── constants.ts        # 默认配置常量
│
└── apps/                    # 应用层（多个前台应用）
    └── navlink/            # 导航站应用
        ├── components/     # 导航站专属组件
        │   ├── admin/     # 后台管理
        │   ├── home/      # 首页组件
        │   ├── layout/    # 布局组件
        │   └── common/    # 导航站内通用组件
        ├── data/          # 导航站数据（保留）
        ├── App.tsx        # 导航站主组件
        └── main.tsx       # 导航站入口
```

## 🎯 设计原则

### 1. 共享层 (shared/)
- **目的**：存放所有应用都可能用到的代码
- **原则**：不依赖任何具体应用
- **内容**：
  - 通用UI组件（Icon, Toast, Button, Input等）
  - 工具函数（api, url处理等）
  - 类型定义（TypeScript接口）
  - 全局Context（ConfigContext, AuthContext等）
  - 公共常量

### 2. 应用层 (apps/)
- **目的**：存放各个独立的前台应用
- **原则**：应用之间相互独立，只依赖shared层
- **内容**：
  - 应用专属组件
  - 应用专属逻辑
  - 应用入口文件

## 📦 如何新增前台应用

### 步骤1：创建应用目录
```bash
mkdir -p src/apps/your-app/components
```

### 步骤2：创建应用文件
```typescript
// src/apps/your-app/App.tsx
import React from 'react';
import { ConfigProvider } from '@/src/shared/context/ConfigContext';
import { Icon } from '@/src/shared/components/common/Icon';

function YourApp() {
  return (
    <div>
      <h1>Your New App</h1>
      <Icon icon="fa-solid fa-star" />
    </div>
  );
}

export default function YourAppWithProvider() {
  return (
    <ConfigProvider>
      <YourApp />
    </ConfigProvider>
  );
}
```

### 步骤3：创建入口文件
```typescript
// src/apps/your-app/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@/src/index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element");
}

const root = ReactDOM.createRoot(rootElement);
root.render(<App />);
```

### 步骤4：更新主入口（可选）
```typescript
// src/index.tsx
// 根据路由或条件加载不同应用
import './apps/navlink/main';  // 当前
// import './apps/your-app/main';  // 新应用
```

## 🔧 Import路径规范

### ✅ 推荐使用（绝对路径）
```typescript
// 引用共享组件
import { Icon } from '@/src/shared/components/common/Icon';
import { Button } from '@/src/shared/components/ui/AdminButton';

// 引用共享工具
import { api } from '@/src/shared/utils/api';

// 引用共享类型
import { SiteConfig } from '@/src/shared/types';

// 引用共享Context
import { useConfig } from '@/src/shared/context/ConfigContext';
```

### ✅ 应用内相对路径
```typescript
// 在 apps/navlink 内引用本应用组件
import TopNavbar from './components/layout/TopNavbar';
import CategorySection from './components/home/CategorySection';
```

### ❌ 避免使用
```typescript
// 避免复杂的相对路径
import { Icon } from '../../../shared/components/common/Icon';
```

## 🚀 构建和运行

### 开发环境
```bash
npm run dev
```

### 生产构建
```bash
npm run build
```

### Docker部署
```bash
docker-compose up -d --build
```

## 📝 迁移说明

从旧结构迁移到新结构的主要变化：

1. **类型定义**：`src/types/` → `src/shared/types/`
2. **工具函数**：`src/utils/` → `src/shared/utils/`
3. **通用组件**：`src/components/common/` → `src/shared/components/common/`
4. **Context**：`src/context/` → `src/shared/context/`
5. **导航站代码**：`src/components/` → `src/apps/navlink/components/`
6. **常量配置**：`src/data/constants.ts` → `src/shared/constants.ts`

## 🎨 优势

1. ✅ **代码复用**：新前台可直接使用shared层的所有组件和工具
2. ✅ **清晰边界**：shared层和应用层职责分明
3. ✅ **易于扩展**：新增应用只需在apps下创建目录
4. ✅ **类型安全**：统一的TypeScript类型系统
5. ✅ **维护性强**：修改共享组件自动影响所有应用
6. ✅ **构建优化**：Vite自动处理代码分割和优化

## 🔮 未来扩展

可以考虑的方向：

1. **多入口配置**：每个应用独立HTML入口
2. **路由系统**：使用React Router实现应用切换
3. **独立部署**：每个应用可单独构建和部署
4. **Monorepo**：使用pnpm workspace或Turborepo

---

**当前版本**：v1.0 - 单应用架构（NavLink导航站）  
**更新时间**：2024-11-27
