import { SiteConfig } from '../types';

// export const ADMIN_PASSWORD = 'admin'; // Moved to server side

export const DEFAULT_CONFIG: SiteConfig = {
  logoUrl: '', // Empty means use default styling or text
  headerQuote: '对你竖大拇指的人，不一定是在夸你，也可能是用炮在瞄你。',
  backgroundImage: '',
  theme: {
    primaryColor: '#f1404b',
    backgroundColor: '#f1f2f3',
    textColor: '#444444',
    navbarBgColor: '#5d33f0',
    baseFontSize: 15, // Optimized default
    categoryTitleSize: 20, // text-xl equivalent
    subCategoryTitleSize: 12, // text-xs equivalent
    promoCategoryTitleSize: 16, // text-base equivalent (16px)
    promoSubCategoryTitleSize: 12 // text-xs equivalent
  },
  topNav: [
    { id: '1', title: 'Blog', url: '#', icon: 'fa-brands fa-wordpress' },
    {
      id: '2', title: '关于', url: '#', icon: 'fa-regular fa-circle-question', children: [
        { id: '2-1', title: '关于本站', url: '#', icon: 'fa-solid fa-info' },
        { id: '2-2', title: '联系我们', url: '#', icon: 'fa-solid fa-envelope' }
      ]
    },
    { id: '3', title: '更新日志', url: '#', icon: 'fa-regular fa-file-lines' },
    { id: '4', title: '获取主题', url: '#', icon: 'fa-solid fa-fire' },
    { id: '5', title: '排行榜', url: '#', icon: 'fa-solid fa-chart-simple' },
    { id: '6', title: '今日热点', url: '#', icon: 'fa-solid fa-newspaper' },
  ],
  hero: {
    title: 'Navlink 聚合导航',
    subtitle: 'Search for what you need',
    hotSearchLinks: [
      { title: 'Navlink', url: '#' },
      { title: '设计资源', url: '#' },
      { title: '开发工具', url: '#' },
    ],
    backgroundColor: '#5d33f0', // Default hero bg color
    overlayNavbar: true // Default to immersive mode
  },
  searchEngines: [
    { id: 's1', name: '站内', urlPattern: '', placeholder: '输入关键字搜索' },
    { id: 's2', name: '百度', urlPattern: 'https://www.baidu.com/s?wd=', placeholder: '百度一下' },
    { id: 's3', name: '谷歌', urlPattern: 'https://www.google.com/search?q=', placeholder: 'Google Search' },
    { id: 's4', name: '必应', urlPattern: 'https://cn.bing.com/search?q=', placeholder: '微软必应搜索' },
    { id: 's5', name: '知乎', urlPattern: 'https://www.zhihu.com/search?q=', placeholder: '有问题，上知乎' },
    { id: 's6', name: 'B站', urlPattern: 'https://search.bilibili.com/all?keyword=', placeholder: '哔哩哔哩' },
  ],
  searchShortcut: 'Cmd+K', // Default keyboard shortcut (auto-converts to Ctrl+K on Windows)
  promo: [
    {
      id: 'promo-hot',
      name: '热门',
      items: [
        { id: 'p1', title: 'Navlink', url: '#', color: '#f1404b', icon: 'fa-solid fa-gem', isAd: false },
        { id: 'p2', title: 'AI智能写作', url: '#', color: '#8bc34a', icon: 'fa-solid fa-robot', isAd: false },
        { id: 'p3', title: '设计素材', url: '#', color: '#ff9800', icon: 'fa-solid fa-palette', isAd: false },
        { id: 'p4', title: '特价云服务器', url: '#', color: '#999', icon: '', isAd: true },
        { id: 'p5', title: '专业SEO优化', url: '#', color: '#999', icon: '', isAd: true },
        { id: 'p6', title: '高端网站建设', url: '#', color: '#999', icon: '', isAd: true },
      ]
    },
    {
      id: 'promo-new',
      name: '发布',
      items: [
        { id: 'p7', title: 'Navlink V1.0', url: '#', color: '#3b82f6', icon: 'fa-solid fa-newspaper', isAd: false },
      ]
    },
    { id: 'promo-update', name: '更新', items: [] },
    { id: 'promo-view', name: '浏览', items: [] },
    { id: 'promo-like', name: '点赞', items: [] },
    { id: 'promo-fav', name: '收藏', items: [] },
  ],
  categories: [
    {
      id: 'recommend',
      name: '常用推荐',
      icon: 'fa-solid fa-star',
      subCategories: [
        {
          name: '站长必备',
          items: [
            { id: '101', title: 'Navlink', url: '#', description: '高效、美观的网址导航系统', icon: 'fa-solid fa-gem', color: '#f1404b' },
            { id: '102', title: 'Github', url: '#', description: '全球最大的代码托管平台', icon: 'fa-brands fa-github', color: '#333' },
            { id: '103', title: '阿里云', url: '#', description: '全球领先的云计算服务平台', icon: 'fa-solid fa-cloud', color: '#ff6a00' },
          ]
        },
        {
          name: '设计视觉',
          items: [
            { id: '109', title: 'unDraw', url: '#', description: '免费可商用自定义颜色图表库', icon: 'fa-solid fa-image', color: '#6366f1' },
            { id: '110', title: 'Adobe Color CC', url: '#', description: 'Create color schemes with th...', icon: 'fa-solid fa-palette', color: '#ec4899' },
          ]
        },
        {
          name: '影视娱乐',
          items: [
            { id: '104', title: 'YouTube', url: '#', description: '全球最大的视频分享网站', icon: 'fa-brands fa-youtube', color: '#ef4444' },
            { id: '105', title: 'Bilibili', url: '#', description: '国内知名的视频弹幕网站', icon: 'fa-brands fa-bilibili', color: '#23ade5' },
            { id: '108', title: 'Netflix', url: '#', description: '流媒体播放平台', icon: 'fa-solid fa-film', color: '#E50914' },
          ]
        }
      ]
    },
    {
      id: 'cloud',
      name: '网盘云储',
      icon: 'fa-solid fa-cloud',
      subCategories: [
        {
          name: '国内网盘',
          items: [
            { id: '201', title: '百度网盘', url: '#', description: '安全的个人云存储服务', icon: 'fa-solid fa-hard-drive', color: '#3b82f6' },
            { id: '202', title: '阿里云盘', url: '#', description: '极速上传下载', icon: 'fa-solid fa-cloud-arrow-up', color: '#f59e0b' },
          ]
        },
        {
          name: '国外网盘',
          items: [
            { id: '203', title: 'OneDrive', url: '#', description: 'Microsoft Cloud Storage', icon: 'fa-brands fa-microsoft', color: '#0078d4' },
          ]
        }
      ]
    },
    {
      id: 'community',
      name: '社区资讯',
      icon: 'fa-regular fa-newspaper',
      items: []
    },
    {
      id: 'books',
      name: '书籍期刊',
      icon: 'fa-solid fa-book',
      items: []
    },
    {
      id: 'games',
      name: '软件游戏',
      icon: 'fa-solid fa-gamepad',
      items: []
    },
    {
      id: 'demo',
      name: '用户演示',
      icon: 'fa-solid fa-user-tag',
      items: []
    },
    {
      id: 'tools',
      name: '常用工具',
      icon: 'fa-solid fa-toolbox',
      items: []
    },
    {
      id: 'assets',
      name: '素材资源',
      icon: 'fa-solid fa-layer-group',
      items: []
    },
    {
      id: 'ued',
      name: 'UED团队',
      icon: 'fa-solid fa-users-viewfinder',
      items: []
    },
    {
      id: 'friends',
      name: '友情链接',
      icon: 'fa-solid fa-handshake',
      items: []
    }
  ],
  rightSidebar: {
    profile: {
      logoText: 'NL',
      title: 'Navlink',
      description: '高效、专业的网址导航系统',
      avatarUrl: '', // New field initialized
      customBackgroundColor: '', // New field initialized
      socials: [
        { icon: 'fa-brands fa-weixin', url: '#' },
        { icon: 'fa-brands fa-qq', url: '#' },
        { icon: 'fa-brands fa-weibo', url: '#' },
        { icon: 'fa-brands fa-github', url: '#' },
      ]
    },
    hotTopics: [
      { id: 'ht1', name: '百度热点', apiUrl: 'https://api.vvhan.com/api/hotlist?type=baidu', webUrl: 'https://top.baidu.com/board', limit: 5 },
      { id: 'ht2', name: '抖音热榜', apiUrl: 'https://api.vvhan.com/api/hotlist?type=douyin', webUrl: 'https://www.douyin.com/hot', limit: 5 },
      { id: 'ht3', name: '微博热搜', apiUrl: 'https://api.vvhan.com/api/hotlist?type=weibo', webUrl: 'https://s.weibo.com/top/summary', limit: 5 }
    ],
    githubTrending: {
      title: 'Github 榜单',
      apiUrl: 'https://api.github.com/search/repositories',
      webUrl: 'https://github.com/trending'
    }
  },
  footer: {
    copyright: 'Copyright © 2024 Navlink',
    links: [],
    extraText: 'Powered by Navlink'
  }
};