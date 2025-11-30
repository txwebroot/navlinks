// Popup 主逻辑
let currentTab = null;
let api = null;

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 获取当前标签页
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tab;

    // 初始化 API
    api = await NavLinkAPI.init();

    // 检查登录状态
    const token = await StorageManager.getAuthToken();
    if (!token) {
      showNotLoggedIn();
      return;
    }

    // 显示主界面
    showMainUI();

    // 加载当前页面信息
    await loadCurrentPage();

    // 加载最近添加
    await loadRecentLinks();

    // 绑定事件
    bindEvents();

  } catch (error) {
    console.error('Initialization error:', error);
    showToast('初始化失败: ' + error.message, 'error');
  }
});

// 显示未登录状态
function showNotLoggedIn() {
  document.getElementById('quickAddSection').style.display = 'none';
  document.getElementById('recentSection').style.display = 'none';
  document.getElementById('notLoggedIn').style.display = 'block';

  document.getElementById('gotoSettingsBtn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
}

// 显示主界面
function showMainUI() {
  document.getElementById('quickAddSection').style.display = 'block';
  document.getElementById('recentSection').style.display = 'block';
  document.getElementById('notLoggedIn').style.display = 'none';
}

// 加载当前页面信息
async function loadCurrentPage() {
  if (!currentTab) return;

  try {
    const title = currentTab.title || '';
    const url = currentTab.url || '';
    
    // 获取 favicon
    let faviconUrl = currentTab.favIconUrl || '';
    if (!faviconUrl || faviconUrl.includes('chrome://')) {
      const domain = Utils.getDomain(url);
      faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } else {
      // 如果favicon URL包含 /uploads/ 路径，提取相对路径
      // 例如：http://localhost:3000/uploads/xxx.png => /uploads/xxx.png
      const uploadsMatch = faviconUrl.match(/(\/uploads\/[^?#]+)/);
      if (uploadsMatch) {
        faviconUrl = uploadsMatch[1];
      }
    }

    // 更新预览
    document.getElementById('previewIcon').src = faviconUrl;
    document.getElementById('previewTitle').textContent = Utils.truncate(title, 40);
    document.getElementById('previewUrl').textContent = Utils.truncate(url, 45);

    // 保存当前页面信息到全局
    window.currentPageData = {
      title,
      url,
      icon: faviconUrl
    };

  } catch (error) {
    console.error('Load current page error:', error);
  }
}

// 加载最近添加的链接
async function loadRecentLinks() {
  try {
    const recentLinks = await StorageManager.getRecentLinks();
    const listEl = document.getElementById('recentList');

    if (recentLinks.length === 0) {
      listEl.innerHTML = '<div class="empty-state">暂无记录</div>';
      return;
    }

    listEl.innerHTML = recentLinks.map(link => `
      <div class="recent-item" data-url="${link.url}">
        <img src="${link.icon || 'icons/icon48.png'}" alt="${link.title}">
        <div class="recent-item-info">
          <div class="recent-item-title">${Utils.truncate(link.title, 35)}</div>
          <div class="recent-item-time">${Utils.formatTime(link.addedAt)}</div>
        </div>
      </div>
    `).join('');

    // 绑定点击事件
    listEl.querySelectorAll('.recent-item').forEach(item => {
      item.addEventListener('click', () => {
        const url = item.dataset.url;
        chrome.tabs.create({ url });
      });
    });

  } catch (error) {
    console.error('Load recent links error:', error);
  }
}

// 绑定事件
function bindEvents() {
  // 设置按钮
  document.getElementById('settingsBtn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // 快速添加按钮
  document.getElementById('quickAddBtn').addEventListener('click', handleQuickAdd);
}

// 快速添加处理
async function handleQuickAdd() {
  const btn = document.getElementById('quickAddBtn');
  
  try {
    btn.disabled = true;
    btn.textContent = '添加中...';

    // 打开添加对话框
    const pageData = window.currentPageData;
    const width = 420;
    const height = 650;
    const left = Math.round((screen.width - width) / 2);
    const top = Math.round((screen.height - height) / 2);

    await chrome.windows.create({
      url: `popup/add.html?url=${encodeURIComponent(pageData.url)}&title=${encodeURIComponent(pageData.title)}&icon=${encodeURIComponent(pageData.icon)}`,
      type: 'popup',
      width,
      height,
      left,
      top
    });

    // 关闭当前 popup
    window.close();

  } catch (error) {
    console.error('Quick add error:', error);
    showToast('打开添加窗口失败', 'error');
    btn.disabled = false;
    btn.innerHTML = `
      <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
      添加到 NavLink
    `;
  }
}

// 显示提示
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}
