// 设置页面逻辑
let api = null;

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 加载保存的设置
    await loadSettings();
    
    // 检查登录状态
    await checkLoginStatus();
    
    // 绑定事件
    bindEvents();
    
  } catch (error) {
    console.error('Initialization error:', error);
  }
});

// 加载设置
async function loadSettings() {
  const serverUrl = await StorageManager.getServerUrl();
  document.getElementById('serverUrl').value = serverUrl;
}

// 检查登录状态
async function checkLoginStatus() {
  const token = await StorageManager.getAuthToken();
  
  if (token) {
    showLoggedIn();
  } else {
    showNotLoggedIn();
  }
}

// 显示已登录状态
function showLoggedIn() {
  document.getElementById('loginSection').style.display = 'none';
  document.getElementById('loggedInSection').style.display = 'block';
}

// 显示未登录状态
function showNotLoggedIn() {
  document.getElementById('loginSection').style.display = 'block';
  document.getElementById('loggedInSection').style.display = 'none';
}

// 绑定事件
function bindEvents() {
  // 保存服务器地址
  document.getElementById('saveServerBtn').addEventListener('click', handleSaveServer);
  
  // 登录
  document.getElementById('loginBtn').addEventListener('click', handleLogin);
  
  // 退出登录
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);
  
  // 回车登录
  document.getElementById('password').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  });
}

// 保存服务器地址
async function handleSaveServer() {
  const btn = document.getElementById('saveServerBtn');
  const serverUrl = document.getElementById('serverUrl').value.trim();
  
  if (!serverUrl) {
    showToast('请输入服务器地址', 'error');
    return;
  }
  
  try {
    btn.disabled = true;
    btn.textContent = '保存中...';
    
    await StorageManager.saveServerUrl(serverUrl);
    showToast('服务器地址已保存', 'success');
    
  } catch (error) {
    showToast('保存失败: ' + error.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '保存服务器地址';
  }
}

// 登录
async function handleLogin() {
  const btn = document.getElementById('loginBtn');
  const password = document.getElementById('password').value;
  
  if (!password) {
    showToast('请输入密码', 'error');
    return;
  }
  
  const serverUrl = document.getElementById('serverUrl').value.trim();
  if (!serverUrl) {
    showToast('请先设置服务器地址', 'error');
    return;
  }
  
  try {
    btn.disabled = true;
    btn.textContent = '登录中...';
    
    // 初始化 API
    api = new NavLinkAPI(serverUrl, '');
    
    // 登录
    await api.login(password);
    
    showToast('登录成功', 'success');
    showLoggedIn();
    
    // 清空密码框
    document.getElementById('password').value = '';
    
  } catch (error) {
    showToast('登录失败: ' + error.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '登录';
  }
}

// 退出登录
async function handleLogout() {
  if (!confirm('确定要退出登录吗？')) {
    return;
  }
  
  try {
    await StorageManager.clearAuth();
    showToast('已退出登录', 'success');
    showNotLoggedIn();
  } catch (error) {
    showToast('退出失败: ' + error.message, 'error');
  }
}

// 显示提示
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.style.display = 'block';
  
  setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}
