// 添加对话框逻辑
let api = null;
let allCategories = { categories: [], promo: [] };  // 修改为对象结构
let linkData = {};

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 从 URL 参数获取链接信息
    const params = new URLSearchParams(window.location.search);
    linkData = {
      url: decodeURIComponent(params.get('url') || ''),
      title: decodeURIComponent(params.get('title') || ''),
      icon: decodeURIComponent(params.get('icon') || '')
    };

    // 初始化 API
    api = await NavLinkAPI.init();

    // 显示链接信息
    displayLinkInfo();

    // 加载分类列表
    await loadCategories();

    // 绑定事件
    bindEvents();

  } catch (error) {
    console.error('Initialization error:', error);
    alert('初始化失败: ' + error.message);
    window.close();
  }
});

// 显示链接信息
function displayLinkInfo() {
  document.getElementById('iconPreview').src = linkData.icon || 'icons/icon48.png';
  document.getElementById('titlePreview').textContent = linkData.title;
  document.getElementById('urlPreview').textContent = linkData.url;
  
  document.getElementById('title').value = linkData.title;
  document.getElementById('url').value = linkData.url;
  document.getElementById('icon').value = linkData.icon;
}

// 加载分类列表
async function loadCategories() {
  try {
    allCategories = await api.getCategories();
    
    const categorySelect = document.getElementById('category');
    categorySelect.innerHTML = '<option value="">请选择分类</option>';
    
    // 添加内容分类组
    if (allCategories.categories && allCategories.categories.length > 0) {
      const categoryGroup = document.createElement('optgroup');
      categoryGroup.label = '—— 内容分类 ——';
      
      allCategories.categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.name;
        option.dataset.type = 'category';
        option.dataset.hasSubCategories = cat.subCategories && cat.subCategories.length > 0;
        categoryGroup.appendChild(option);
      });
      
      categorySelect.appendChild(categoryGroup);
    }
    
    // 添加热门板块组
    if (allCategories.promo && allCategories.promo.length > 0) {
      const promoGroup = document.createElement('optgroup');
      promoGroup.label = '—— 热门板块 ——';
      
      allCategories.promo.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.name;
        option.dataset.type = 'promo';
        option.dataset.hasSubCategories = 'false';
        promoGroup.appendChild(option);
      });
      
      categorySelect.appendChild(promoGroup);
    }

    // 尝试恢复上次选择的分类
    const recent = await StorageManager.getRecentCategory();
    if (recent && recent.categoryId) {
      categorySelect.value = recent.categoryId;
      await handleCategoryChange();
      
      if (recent.subCategoryName) {
        document.getElementById('subCategory').value = recent.subCategoryName;
      }
    }

  } catch (error) {
    console.error('Load categories error:', error);
    alert('加载分类失败: ' + error.message);
  }
}

// 分类变化处理
async function handleCategoryChange() {
  const categoryId = document.getElementById('category').value;
  const subCategorySection = document.getElementById('subCategorySection');
  const subCategorySelect = document.getElementById('subCategory');
  
  if (!categoryId) {
    subCategorySection.style.display = 'none';
    return;
  }

  // 查找选中的分类（在 categories 或 promo 中）
  let category = allCategories.categories?.find(c => c.id === categoryId);
  if (!category) {
    category = allCategories.promo?.find(c => c.id === categoryId);
  }
  
  // 热门推广不显示子分类
  if (category && category.type === 'promo') {
    subCategorySection.style.display = 'none';
    return;
  }
  
  if (category && category.subCategories && category.subCategories.length > 0) {
    // 显示子分类选择
    subCategorySection.style.display = 'block';
    subCategorySelect.innerHTML = '<option value="">添加到主分类</option>';
    
    category.subCategories.forEach(sub => {
      const option = document.createElement('option');
      option.value = sub.name;  // 使用 name 而不是 id
      option.textContent = sub.name;
      subCategorySelect.appendChild(option);
    });
  } else {
    subCategorySection.style.display = 'none';
  }
}

// 绑定事件
function bindEvents() {
  // 分类选择变化
  document.getElementById('category').addEventListener('change', handleCategoryChange);
  
  // 刷新图标
  document.getElementById('refreshIconBtn').addEventListener('click', () => {
    const url = document.getElementById('url').value;
    if (url) {
      const domain = Utils.getDomain(url);
      const newIcon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
      document.getElementById('icon').value = newIcon;
      document.getElementById('iconPreview').src = newIcon;
    }
  });

  // 图标输入变化
  document.getElementById('icon').addEventListener('input', (e) => {
    const iconUrl = e.target.value;
    if (iconUrl) {
      document.getElementById('iconPreview').src = iconUrl;
    }
  });

  // 取消按钮
  document.getElementById('cancelBtn').addEventListener('click', () => {
    window.close();
  });

  // 表单提交
  document.getElementById('addForm').addEventListener('submit', handleSubmit);
}

// 表单提交处理
async function handleSubmit(e) {
  e.preventDefault();
  
  const submitBtn = document.getElementById('submitBtn');
  const loadingOverlay = document.getElementById('loading');
  
  try {
    // 显示加载状态
    submitBtn.disabled = true;
    loadingOverlay.style.display = 'flex';
    
    // 获取表单数据
    const categoryId = document.getElementById('category').value;
    const subCategoryName = document.getElementById('subCategory').value;  // 使用 name 而不是 id
    const title = document.getElementById('title').value.trim();
    const url = document.getElementById('url').value.trim();
    const description = document.getElementById('description').value.trim();
    let icon = document.getElementById('icon').value.trim();
    
    // 获取图标模式
    const iconMode = document.querySelector('input[name="iconMode"]:checked').value;
    
    console.log('=== 开始添加链接 ===');
    console.log('图标模式:', iconMode === 'local' ? '本地模式(下载到服务器)' : '在线模式(URL)');
    console.log('原始图标:', icon || '无');
    
    if (!categoryId) {
      alert('请选择分类');
      submitBtn.disabled = false;
      loadingOverlay.style.display = 'none';
      return;
    }
    
    if (!title) {
      alert('请输入标题');
      submitBtn.disabled = false;
      loadingOverlay.style.display = 'none';
      return;
    }
    
    if (!url) {
      alert('请输入 URL');
      submitBtn.disabled = false;
      loadingOverlay.style.display = 'none';
      return;
    }
    
    // 处理图标：如果是本地模式且图标不是图标代码，则下载到服务器
    if (iconMode === 'local') {
      if (!icon) {
        console.log('本地模式：未提供图标，将不添加图标');
      } else {
        // 判断是否为图标代码
        // FontAwesome: fa-solid fa-home
        // Iconify: mdi:home, heroicons:home
        const isIconCode = icon.includes('fa-') || (icon.includes(':') && !icon.startsWith('http://') && !icon.startsWith('https://'));
        
        if (!isIconCode && !icon.startsWith('/uploads/')) {
          try {
            console.log('本地模式：开始下载图标到服务器...', icon);
            const result = await api.downloadIcon(icon);
            icon = result;
            console.log('✅ 图标下载成功，保存为:', icon);
          } catch (error) {
            console.error('❌ 图标下载失败:', error);
            console.error('错误详情:', error.message || error);
            // 继续使用原始 URL，不阻塞添加流程
            console.log('⚠️ 下载失败，将使用原始图标 URL:', icon);
          }
        } else {
          console.log('本地模式：图标已是图标代码或本地路径，无需下载:', icon);
        }
      }
    } else {
      console.log('在线模式：直接使用图标URL，不下载到服务器:', icon || '无');
    }
    
    // 调用 API 添加链接
    console.log('最终使用的图标:', icon || '无');
    const result = await api.addLink(categoryId, subCategoryName, {
      title,
      url,
      icon,
      description
    });
    console.log('链接添加成功');
    console.log('===================');
    
    // 保存到最近使用的分类
    let category = allCategories.categories?.find(c => c.id === categoryId);
    if (!category) {
      category = allCategories.promo?.find(c => c.id === categoryId);
    }
    let categoryName = category ? category.name : '';
    
    if (subCategoryName) {
      const subCategory = category?.subCategories?.find(s => s.name === subCategoryName);
      if (subCategory) {
        categoryName += ' / ' + subCategory.name;
      }
    }
    
    await StorageManager.saveRecentCategory(categoryId, subCategoryName, categoryName);
    
    // 保存到最近添加列表
    await StorageManager.addRecentLink({
      title,
      url,
      icon,
      category: categoryName
    });
    
    // 显示成功通知
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '../icons/icon48.png',
      title: '添加成功',
      message: `已添加到「${categoryName}」`
    });
    
    // 关闭窗口
    setTimeout(() => {
      window.close();
    }, 500);
    
  } catch (error) {
    console.error('Submit error:', error);
    alert('添加失败: ' + error.message);
    submitBtn.disabled = false;
    loadingOverlay.style.display = 'none';
  }
}
