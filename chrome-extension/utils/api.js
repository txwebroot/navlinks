// NavLink API 调用封装
// 提供与 NavLink 后端的交互接口

class NavLinkAPI {
  constructor(baseUrl, token) {
    this.baseUrl = baseUrl || '';
    this.token = token || '';
  }

  // 初始化（从存储中加载配置）
  static async init() {
    const settings = await chrome.storage.sync.get(['serverUrl', 'authToken']);
    return new NavLinkAPI(settings.serverUrl, settings.authToken);
  }

  // 登录
  async login(password) {
    const response = await fetch(`${this.baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '登录失败');
    }

    const data = await response.json();
    
    // 保存 Token 到存储
    await chrome.storage.sync.set({ authToken: data.token });
    this.token = data.token;
    
    return data;
  }

  // 获取配置
  async getConfig() {
    const response = await fetch(`${this.baseUrl}/api/config`);
    
    if (!response.ok) {
      throw new Error('获取配置失败');
    }
    
    return await response.json();
  }

  // 保存配置
  async saveConfig(config) {
    const response = await fetch(`${this.baseUrl}/api/config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(config)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '保存失败');
    }

    return await response.json();
  }

  // 添加链接到指定分类
  async addLink(categoryId, subCategoryName, linkData) {
    // 1. 获取当前配置
    const config = await this.getConfig();

    // 2. 先在 categories 中查找
    let category = config.categories?.find(c => c.id === categoryId);
    let isPromo = false;
    let categoryName = '';
    
    if (!category) {
      // 3. 在 promo 中查找
      category = config.promo?.find(p => p.id === categoryId);
      if (!category) {
        throw new Error('分类不存在');
      }
      isPromo = true;
    }
    
    categoryName = category.name;

    // 4. 创建新链接
    const newLink = {
      id: Date.now().toString(),
      title: linkData.title || '',
      url: linkData.url || '',
      icon: linkData.icon || '',
      description: linkData.description || ''
    };

    // 5. 添加到对应位置
    if (subCategoryName && !isPromo) {
      // 添加到子分类（只有 categories 支持子分类）
      // 注意：子分类使用 name 而不是 id
      const subCategory = category.subCategories?.find(s => s.name === subCategoryName);
      if (!subCategory) {
        throw new Error('子分类不存在');
      }
      subCategory.items = subCategory.items || [];
      subCategory.items.unshift(newLink); // 添加到开头
      categoryName += ' / ' + subCategory.name;
    } else {
      // 添加到主分类或热门推广
      category.items = category.items || [];
      category.items.unshift(newLink); // 添加到开头
    }

    // 6. 保存配置
    await this.saveConfig(config);

    return {
      success: true,
      link: newLink,
      category: categoryName
    };
  }

  // 获取所有分类（用于下拉选择）
  async getCategories() {
    const config = await this.getConfig();
    
    if (!config) {
      return [];
    }

    const result = {
      categories: [],
      promo: []
    };
    
    // 添加常规分类
    if (config.categories) {
      config.categories.forEach(cat => {
        result.categories.push({
          id: cat.id,
          name: cat.name,
          icon: cat.icon,
          type: 'category',
          subCategories: (cat.subCategories || []).map(sub => ({
            name: sub.name  // 注意：子分类使用 name 而不是 id
          }))
        });
      });
    }
    
    // 添加热门推广
    if (config.promo) {
      config.promo.forEach(tab => {
        result.promo.push({
          id: tab.id,
          name: tab.name,
          icon: tab.icon,
          type: 'promo',
          subCategories: []
        });
      });
    }
    
    return result;
  }

  // 检查链接健康状态
  async checkLinkHealth(url) {
    const response = await fetch(`${this.baseUrl}/api/check-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({ url })
    });

    if (!response.ok) {
      throw new Error('检测失败');
    }

    return await response.json();
  }

  // 上传图片
  async uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${this.baseUrl}/api/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('上传失败');
    }

    const data = await response.json();
    return data.url;
  }

  // 下载远程图标到服务器
  async downloadIcon(iconUrl) {
    console.log('[API] 开始下载图标...');
    console.log('[API] 服务器地址:', this.baseUrl);
    console.log('[API] 图标URL:', iconUrl);
    console.log('[API] Token:', this.token ? '已设置 (' + this.token.substring(0, 10) + '...)' : '未设置');
    
    const response = await fetch(`${this.baseUrl}/api/download-icon`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({ iconUrl })
    });

    console.log('[API] 响应状态:', response.status, response.statusText);
    
    if (!response.ok) {
      let errorMessage = '下载图标失败';
      try {
        const error = await response.json();
        errorMessage = error.error || error.message || errorMessage;
        console.log('[API] 错误详情:', error);
      } catch (e) {
        const text = await response.text();
        console.log('[API] 响应内容 (非JSON):', text);
        if (response.status === 401) {
          errorMessage = '未授权，请先在插件设置中登录';
        } else if (response.status === 403) {
          errorMessage = '权限不足';
        }
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('[API] 图标下载成功:', data.url);
    return data.url;
  }
}

// 存储管理工具
class StorageManager {
  // 保存服务器地址
  static async saveServerUrl(url) {
    await chrome.storage.sync.set({ serverUrl: url });
  }

  // 获取服务器地址
  static async getServerUrl() {
    const result = await chrome.storage.sync.get('serverUrl');
    return result.serverUrl || 'http://localhost:3001';
  }

  // 保存认证 Token
  static async saveAuthToken(token) {
    await chrome.storage.sync.set({ authToken: token });
  }

  // 获取认证 Token
  static async getAuthToken() {
    const result = await chrome.storage.sync.get('authToken');
    return result.authToken || '';
  }

  // 清除认证信息
  static async clearAuth() {
    await chrome.storage.sync.remove('authToken');
  }

  // 保存最近使用的分类
  static async saveRecentCategory(categoryId, subCategoryName, categoryName) {
    await chrome.storage.local.set({
      recentCategory: {
        categoryId,
        subCategoryName,
        categoryName,
        timestamp: Date.now()
      }
    });
  }

  // 获取最近使用的分类
  static async getRecentCategory() {
    const result = await chrome.storage.local.get('recentCategory');
    return result.recentCategory || null;
  }

  // 保存最近添加的链接（最多10条）
  static async addRecentLink(linkData) {
    const result = await chrome.storage.local.get('recentLinks');
    let recentLinks = result.recentLinks || [];
    
    // 添加到开头
    recentLinks.unshift({
      ...linkData,
      addedAt: Date.now()
    });
    
    // 只保留最近10条
    recentLinks = recentLinks.slice(0, 10);
    
    await chrome.storage.local.set({ recentLinks });
  }

  // 获取最近添加的链接
  static async getRecentLinks() {
    const result = await chrome.storage.local.get('recentLinks');
    return result.recentLinks || [];
  }
}

// 工具函数
const Utils = {
  // 验证 URL 格式
  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  },

  // 格式化时间
  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`;
    
    return date.toLocaleDateString();
  },

  // 截取文本
  truncate(str, length) {
    if (!str) return '';
    if (str.length <= length) return str;
    return str.substring(0, length) + '...';
  },

  // 获取域名
  getDomain(url) {
    try {
      return new URL(url).hostname;
    } catch (_) {
      return '';
    }
  }
};
