export interface LinkHealthStatus {
  isHealthy: boolean;          // 是否健康
  statusCode?: number;         // HTTP 状态码
  responseTime?: number;       // 响应时间(ms)
  lastChecked?: string;        // 最后检测时间(ISO)
  errorMessage?: string;       // 错误信息
}

export interface LinkItem {
  id: string;
  title: string;
  url: string;
  description: string;
  icon?: string; // FontAwesome class or URL
  color?: string; // Optional custom color for icon bg
  health?: LinkHealthStatus; // 链接健康状态
}

export interface SubCategory {
  name: string;
  items: LinkItem[];
  color?: string; // Custom color for the tab button
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  hidden?: boolean; // If true, hide this category when not authenticated
  items?: LinkItem[]; // Standard flat list
  subCategories?: SubCategory[]; // Tabbed list
}

// --- New Config Types ---

export interface TopNavItem {
  id: string;
  title: string;
  url: string;
  icon: string;
  hidden?: boolean; // If true, hide this nav item when not authenticated
  children?: TopNavItem[]; // Second level menu
}

export interface SearchEngine {
  id: string;
  name: string;
  urlPattern: string; // e.g., "https://www.google.com/search?q="
  placeholder: string;
}

export interface PromoItem {
  id: string;
  title: string;
  url?: string; // Added URL for promo items
  color: string;
  icon: string;
  isAd: boolean;
  health?: LinkHealthStatus; // 链接健康状态
}

export interface PromoTab {
  id: string; // Added for drag and drop
  name: string;
  url?: string; // Added URL for the tab itself (e.g. for "More..." links)
  items: PromoItem[];
}

export interface GithubTrendingConfig {
  title: string;
  apiUrl: string; // API endpoint for fetching data
  webUrl: string; // URL for the "View More" link
}

export interface HotTopicSource {
  id: string;
  name: string;
  apiUrl: string;
  webUrl: string;
  limit?: number; // Added limit for number of items to display
}

export interface RightSidebarConfig {
  profile: {
    logoText: string; // "io"
    avatarUrl?: string; // Custom avatar image URL/Base64
    title: string;
    description: string;
    customBackgroundColor?: string; // Custom background color for the card
    socials: { icon: string; url: string }[];
  };
  // Replaced stats with hotTopics
  hotTopics: HotTopicSource[];
  githubTrending: GithubTrendingConfig;
}

export interface FooterConfig {
  copyright: string;
  links: { text: string; url: string }[];
  extraText: string;
}

export interface ThemeConfig {
  primaryColor: string;    // Main accent color (default red)
  backgroundColor: string; // Page background
  textColor: string;       // Main text color
  navbarBgColor: string;   // Navbar background when scrolled
  baseFontSize: number;    // Root font size in px
  categoryTitleSize?: number;    // Category title font size in px (default: 20)
  subCategoryTitleSize?: number; // Subcategory tab font size in px (default: 12)
  promoCategoryTitleSize?: number;    // Promo category title font size in px (default: 16)
  promoSubCategoryTitleSize?: number; // Promo subcategory tab font size in px (default: 12)
}

export interface AIProvider {
  id: string;
  name: string;
  apiKey: string;
  baseUrl?: string;
  model?: string;
  enabled: boolean;
}

export interface AIConfig {
  providers: AIProvider[];
  defaultProvider?: string;
  chatShortcut: string; // 快捷键，例如 "Ctrl+Shift+A"
}

export interface SiteConfig {
  logoUrl: string; // For top navbar
  headerQuote: string; // The quote text in the top navbar
  backgroundImage?: string; // Custom background image for hero section
  theme?: ThemeConfig; // Global styling
  healthCheckSchedule?: {
    enabled: boolean;
    time: string;
  };
  aiConfig?: AIConfig; // AI 配置
  topNav: TopNavItem[];
  hero: {
    title: string;
    subtitle: string;
    hotSearchLinks: { title: string; url: string }[];
    backgroundColor?: string; // Specific background color for hero section
    overlayNavbar?: boolean;  // Whether hero background extends behind navbar (transparent nav)
  };
  searchEngines: SearchEngine[];
  searchShortcut?: string; // Keyboard shortcut to open global search (e.g., "Cmd+K", "Ctrl+K")
  promo: PromoTab[];
  categories: Category[];
  rightSidebar: RightSidebarConfig;
  footer: FooterConfig;
}