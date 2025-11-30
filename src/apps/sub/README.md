# Sub 应用

> 基于 NavLink 多应用架构的示例前台应用

## 📖 简介

Sub 是一个演示如何在 NavLink 多应用架构下创建新前台应用的示例项目。展示了如何复用 shared 层的组件、工具和状态管理。

## 🎯 功能特性

- ✅ **响应式布局** - 完美适配各种屏幕尺寸
- ✅ **计数器示例** - 展示 React Hooks 状态管理
- ✅ **配置读取** - 演示如何使用 ConfigContext
- ✅ **共享组件** - 使用 Icon、Button 等通用组件
- ✅ **主题集成** - 自动适配主题色

## 📁 目录结构

```
src/apps/sub/
├── components/      # 组件目录（可扩展）
├── App.tsx          # 主应用组件
├── main.tsx         # 应用入口
└── README.md        # 本文档
```

## 🔧 技术栈

### 前端框架
- React 19
- TypeScript 5.8
- Tailwind CSS 3

### 共享资源
- `@/src/shared/components/common` - 通用组件
- `@/src/shared/components/ui` - UI组件
- `@/src/shared/context/ConfigContext` - 配置上下文
- `@/src/shared/utils` - 工具函数

## 🚀 快速开始

### 运行开发环境

```bash
# 在项目根目录
npm run dev

# 访问 http://localhost:3000
```

### 切换到此应用

修改 `src/index.tsx`：

```typescript
// 注释掉 navlink
// import './apps/navlink/main';

// 启用 sub
import './apps/sub/main';
```

## 📦 可用的共享资源

### 组件

```typescript
// 图标
import { Icon } from '@/src/shared/components/common/Icon';
<Icon icon="fa-solid fa-star" />

// 按钮
import { Button } from '@/src/shared/components/ui/AdminButton';
<Button variant="primary">点击</Button>

// 输入框
import { Input } from '@/src/shared/components/ui/AdminInput';
<Input value={value} onChange={setValue} />

// 提示框
import { Toast } from '@/src/shared/components/common/Toast';
<Toast message="成功" type="success" />

// 确认对话框
import { ConfirmModal } from '@/src/shared/components/common/ConfirmModal';
```

### Context

```typescript
// 配置上下文
import { useConfig } from '@/src/shared/context/ConfigContext';

function MyComponent() {
  const { config, isLoaded, isAuthenticated, login, logout } = useConfig();
  // ...
}
```

### 工具函数

```typescript
// API 调用
import { api } from '@/src/shared/utils/api';
await api.getConfig();
await api.saveConfig(newConfig);

// URL 处理
import { ensureHttp } from '@/src/shared/utils/url';
const url = ensureHttp('example.com'); // https://example.com
```

### 类型定义

```typescript
import { SiteConfig, LinkItem, Category } from '@/src/shared/types';
```

## 🎨 自定义开发

### 添加新组件

在 `components/` 目录下创建新组件：

```typescript
// components/MyComponent.tsx
import React from 'react';
import { Icon } from '@/src/shared/components/common/Icon';

export const MyComponent: React.FC = () => {
  return (
    <div className="p-4">
      <Icon icon="fa-solid fa-heart" />
      <h2>我的组件</h2>
    </div>
  );
};
```

### 使用主题色

```typescript
// 在 CSS 中使用
<div className="bg-[var(--theme-primary)] text-white">
  主题色背景
</div>

// 在 style 中使用
<div style={{ color: config.theme?.primaryColor }}>
  主题色文字
</div>
```

## 📝 开发建议

1. **复用优先** - 优先使用 shared 层的组件和工具
2. **类型安全** - 充分利用 TypeScript 类型系统
3. **响应式设计** - 使用 Tailwind 的响应式工具类
4. **错误处理** - 使用 ErrorBoundary 包裹组件

## 🔗 相关文档

- [项目架构文档](../../README.md)
- [Shared 组件文档](../../shared/README.md)
- [NavLink 应用参考](../navlink/)

## 📊 示例代码

### 简单页面

```typescript
import React from 'react';
import { useConfig } from '@/src/shared/context/ConfigContext';
import { Icon } from '@/src/shared/components/common/Icon';

function SimplePage() {
  const { config } = useConfig();
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-4">
        <Icon icon="fa-solid fa-star" className="mr-2" />
        {config.hero?.title}
      </h1>
      <p className="text-gray-600">{config.hero?.subtitle}</p>
    </div>
  );
}
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**创建时间**: 2024-11-27  
**版本**: 1.0.0
