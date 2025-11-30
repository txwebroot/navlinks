# NavLink Helper - Chrome 扩展

快速添加链接到 NavLink 导航站的 Chrome 浏览器扩展。

## ✨ 功能特性

- 🖱️ **右键菜单添加** - 在任何页面或链接上右键，快速添加到 NavLink
- ⚡ **一键添加** - 点击扩展图标或使用快捷键（Ctrl+Shift+A）快速添加当前页面
- 🎨 **智能获取图标** - 自动获取网站 Favicon，无需手动设置
- 📁 **记住分类** - 自动记住最近使用的分类，下次添加更快
- 📝 **最近添加** - 查看最近添加的链接记录
- 🔐 **安全认证** - 使用 JWT Token 保护你的数据

## 📦 安装方法

### 方式一：开发者模式加载（推荐）

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择 `chrome-extension` 文件夹
6. 完成！扩展已安装

### 方式二：打包安装

1. 在 `chrome://extensions/` 页面点击"打包扩展程序"
2. 选择 `chrome-extension` 文件夹
3. 生成 `.crx` 文件后拖拽到浏览器安装

## 🚀 使用说明

### 1. 首次设置

1. 点击扩展图标
2. 点击"设置"按钮
3. 填写你的 NavLink 服务器地址（例如：`http://localhost:3001`）
4. 输入管理员密码登录
5. 完成设置！

### 2. 添加链接

#### 方法一：右键菜单
- 在任何网页上右键 → "添加到 NavLink"
- 在链接上右键 → "添加到 NavLink"

#### 方法二：快捷键
- 按 `Ctrl+Shift+A`（Mac: `Cmd+Shift+A`）

#### 方法三：扩展图标
- 点击扩展图标 → 点击"添加到 NavLink"按钮

### 3. 选择分类

1. 在弹出的对话框中选择目标分类
2. 如果该分类有子分类，可以选择具体的子分类
3. 修改标题、描述等信息（可选）
4. 点击"添加"完成

## 📁 文件结构

```
chrome-extension/
├── manifest.json          # 扩展配置文件
├── background.js          # 后台服务（右键菜单、快捷键）
├── popup/
│   ├── popup.html        # Popup 界面
│   ├── popup.css         # Popup 样式
│   ├── popup.js          # Popup 逻辑
│   ├── add.html          # 添加对话框
│   ├── add.css           # 添加对话框样式
│   └── add.js            # 添加对话框逻辑
├── options/
│   ├── options.html      # 设置页面
│   ├── options.css       # 设置页面样式
│   └── options.js        # 设置页面逻辑
├── utils/
│   └── api.js            # API 调用封装和工具函数
└── icons/
    ├── icon16.png        # 16x16 图标
    ├── icon48.png        # 48x48 图标
    └── icon128.png       # 128x128 图标
```

## 🔧 技术栈

- **Manifest V3** - Chrome 扩展最新标准
- **原生 JavaScript** - 无框架依赖，轻量高效
- **Chrome APIs**:
  - `contextMenus` - 右键菜单
  - `tabs` - 标签页信息
  - `storage` - 本地存储
  - `notifications` - 通知提示
  - `commands` - 快捷键

## ⚙️ API 接口

扩展调用以下 NavLink API：

- `POST /api/login` - 登录获取 Token
- `GET /api/config` - 获取配置
- `POST /api/config` - 保存配置

## 🎯 快捷键

| 快捷键 | 功能 | 自定义 |
|--------|------|--------|
| `Ctrl+Shift+A` (Win/Linux) | 添加当前页面 | ✅ 支持 |
| `Cmd+Shift+A` (Mac) | 添加当前页面 | ✅ 支持 |

可在 `chrome://extensions/shortcuts` 自定义快捷键。

## 🐛 常见问题

### Q: 提示"未登录"怎么办？
A: 前往设置页面，填写服务器地址并登录。

### Q: 无法连接到服务器？
A: 检查服务器地址是否正确，确保 NavLink 服务正在运行。

### Q: 右键菜单没有"添加到 NavLink"选项？
A: 尝试重新加载扩展或重启浏览器。

### Q: 添加失败怎么办？
A: 检查是否已登录、网络连接是否正常、服务器是否可访问。

## 📝 待添加图标

请在 `icons/` 目录下添加以下图标文件：
- `icon16.png` (16x16 像素)
- `icon48.png` (48x48 像素)  
- `icon128.png` (128x128 像素)

建议使用 NavLink 的 Logo 或相关设计。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🔗 相关链接

- [NavLink 主项目](https://github.com/txwebroot/NavLink)
- [Chrome 扩展开发文档](https://developer.chrome.com/docs/extensions/)

---

**Enjoy! 🎉**
