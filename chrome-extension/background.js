// NavLink Helper - Background Service Worker
// 处理右键菜单、快捷键等后台事件

// 插件安装时创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
  console.log('NavLink Helper installed');
  
  // 创建右键菜单项
  chrome.contextMenus.create({
    id: 'addToNavLink',
    title: '添加到 NavLink',
    contexts: ['page', 'link', 'selection']
  });

  // 创建子菜单 - 快速添加到最近使用的分类
  chrome.contextMenus.create({
    id: 'addToRecentCategory',
    parentId: 'addToNavLink',
    title: '添加到最近分类',
    contexts: ['page', 'link']
  });

  chrome.contextMenus.create({
    id: 'addWithDialog',
    parentId: 'addToNavLink',
    title: '选择分类添加...',
    contexts: ['page', 'link']
  });
});

// 右键菜单点击事件
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'addToNavLink' || info.menuItemId === 'addWithDialog') {
    await handleAddLink(info, tab, false);
  } else if (info.menuItemId === 'addToRecentCategory') {
    await handleAddLink(info, tab, true);
  }
});

// 快捷键命令
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'add-current-page') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const info = { pageUrl: tab.url };
    await handleAddLink(info, tab, false);
  }
});

// 处理添加链接逻辑
async function handleAddLink(info, tab, useRecentCategory) {
  try {
    // 获取链接信息
    const url = info.linkUrl || info.pageUrl || tab.url;
    const title = info.selectionText || tab.title || '';
    
    // 获取 favicon
    const faviconUrl = await getFaviconUrl(url, tab);
    
    // 检查是否已登录
    const settings = await chrome.storage.sync.get(['serverUrl', 'authToken']);
    
    if (!settings.authToken) {
      // 未登录，打开设置页面
      chrome.runtime.openOptionsPage();
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'NavLink Helper',
        message: '请先在设置页面登录 NavLink'
      });
      return;
    }

    if (useRecentCategory) {
      // 直接添加到最近使用的分类
      const result = await addToRecentCategory(url, title, faviconUrl, settings);
      showNotification(result.success, result.message);
    } else {
      // 打开选择对话框
      const width = 420;
      const height = 650;
      const left = (screen.width - width) / 2;
      const top = (screen.height - height) / 2;
      
      chrome.windows.create({
        url: `popup/add.html?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&icon=${encodeURIComponent(faviconUrl)}`,
        type: 'popup',
        width: width,
        height: height,
        left: Math.round(left),
        top: Math.round(top)
      });
    }
  } catch (error) {
    console.error('Add link error:', error);
    showNotification(false, '添加失败: ' + error.message);
  }
}

// 获取网站图标
async function getFaviconUrl(url, tab) {
  try {
    const domain = new URL(url).hostname;
    
    // 方案1: 尝试从标签页获取 favIconUrl
    if (tab && tab.favIconUrl && !tab.favIconUrl.includes('chrome://')) {
      return tab.favIconUrl;
    }
    
    // 方案2: 使用 Google Favicon 服务
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch (error) {
    console.error('Get favicon error:', error);
    return '';
  }
}

// 添加到最近使用的分类
async function addToRecentCategory(url, title, faviconUrl, settings) {
  try {
    const recentCategory = await chrome.storage.local.get('recentCategory');
    
    if (!recentCategory.recentCategory) {
      return {
        success: false,
        message: '未找到最近使用的分类，请先手动添加一次'
      };
    }

    // 调用 API 添加链接
    const api = new NavLinkAPI(settings.serverUrl, settings.authToken);
    await api.addLink(
      recentCategory.recentCategory.categoryId,
      recentCategory.recentCategory.subCategoryId,
      {
        title: title,
        url: url,
        icon: faviconUrl,
        description: ''
      }
    );

    return {
      success: true,
      message: `已添加到「${recentCategory.recentCategory.categoryName}」`
    };
  } catch (error) {
    return {
      success: false,
      message: '添加失败: ' + error.message
    };
  }
}

// 显示通知
function showNotification(success, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: success ? '添加成功' : '添加失败',
    message: message
  });
}

// 简单的 API 封装类（在 background 中使用）
class NavLinkAPI {
  constructor(baseUrl, token) {
    this.baseUrl = baseUrl || 'http://localhost:3001';
    this.token = token || '';
  }

  async addLink(categoryId, subCategoryId, linkData) {
    // 1. 获取当前配置
    const response = await fetch(`${this.baseUrl}/api/config`);
    if (!response.ok) throw new Error('获取配置失败');
    const config = await response.json();

    // 2. 找到目标分类
    const category = config.categories.find(c => c.id === categoryId);
    if (!category) throw new Error('分类不存在');

    const newLink = {
      id: Date.now().toString(),
      ...linkData
    };

    if (subCategoryId) {
      // 添加到子分类
      const subCategory = category.subCategories?.find(s => s.id === subCategoryId);
      if (!subCategory) throw new Error('子分类不存在');
      subCategory.items = subCategory.items || [];
      subCategory.items.push(newLink);
    } else {
      // 添加到主分类
      category.items = category.items || [];
      category.items.push(newLink);
    }

    // 3. 保存配置
    const saveResponse = await fetch(`${this.baseUrl}/api/config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(config)
    });

    if (!saveResponse.ok) {
      const error = await saveResponse.json();
      throw new Error(error.error || '保存失败');
    }

    return await saveResponse.json();
  }
}
