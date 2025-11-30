import React, { useState, useEffect, lazy, Suspense } from 'react';
import { ConfigProvider, useConfig } from '@/src/shared/context/ConfigContext';
import TopNavbar from './components/layout/TopNavbar';
import SearchHero from './components/home/SearchHero';
import PromoArea from './components/home/PromoArea';
import Sidebar from './components/layout/Sidebar';
import RightWidgets from './components/home/RightWidgets';
import CategorySection from './components/home/CategorySection';
import LoginDialog from '@/src/shared/components/common/LoginDialog';
import SearchModal from './components/common/SearchModal';
import { Icon } from '@/src/shared/components/common/Icon';
import { AIChatModal } from './components/ai/AIChatModal';

// Lazy load AdminPanel for code splitting (reduces initial bundle by ~120KB)
const AdminPanel = lazy(() => import('./components/admin/AdminPanel'));

function AppContent() {
    const { config, isLoaded, isAuthenticated, login, logout } = useConfig();

    const [activeCategory, setActiveCategory] = useState<string>('');
    const [isEditing, setIsEditing] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [showAIChatModal, setShowAIChatModal] = useState(false);

    // Dynamic Favicon
    useEffect(() => {
        const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement || document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';

        if (config.logoUrl) {
            link.href = config.logoUrl;
        } else {
            // Earth icon fallback
            link.href = "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌍</text></svg>";
        }
        document.getElementsByTagName('head')[0].appendChild(link);
    }, [config.logoUrl]);

    // Back to Top Scroll Listener
    useEffect(() => {
        const handleScroll = () => {
            setShowBackToTop(window.scrollY > 300);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Keyboard Shortcut Listener for Search Modal
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const shortcut = config.searchShortcut || 'Cmd+K';
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const modKey = isMac ? 'Cmd' : 'Ctrl';
            const normalizedShortcut = shortcut.replace('Cmd', modKey).replace('Ctrl', modKey);

            // Parse shortcut (e.g., "Cmd+K" or "Ctrl+K")
            const keys = normalizedShortcut.split('+').map(k => k.trim().toLowerCase());
            const hasCtrlOrCmd = keys.includes('cmd') || keys.includes('ctrl');
            const hasShift = keys.includes('shift');
            const hasAlt = keys.includes('alt');
            const mainKey = keys.find(k => !['cmd', 'ctrl', 'shift', 'alt'].includes(k));

            if (mainKey) {
                const matchesModifiers =
                    ((hasCtrlOrCmd && (e.metaKey || e.ctrlKey)) || !hasCtrlOrCmd) &&
                    (hasShift === e.shiftKey) &&
                    (hasAlt === e.altKey);

                if (matchesModifiers && e.key.toLowerCase() === mainKey) {
                    e.preventDefault();
                    setShowSearchModal(true);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [config.searchShortcut]);

    // Set active category on load
    useEffect(() => {
        if (isLoaded && config.categories.length > 0 && !activeCategory) {
            setActiveCategory(config.categories[0].id);
        }
    }, [isLoaded, config.categories, activeCategory]);

    useEffect(() => {
        const handleScroll = () => {
            const offset = 150;
            const visibleCategories = config.categories.filter(cat => isAuthenticated || !cat.hidden);
            for (const cat of visibleCategories) {
                const el = document.getElementById(cat.id);
                if (el) {
                    const rect = el.getBoundingClientRect();
                    if (rect.top <= offset && rect.bottom >= offset) {
                        setActiveCategory(cat.id);
                    }
                }
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [config.categories, isAuthenticated]);

    const scrollTo = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            const top = el.getBoundingClientRect().top + window.pageYOffset - 80;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    };

    const handleUserIconClick = () => {
        if (isAuthenticated) {
            setIsEditing(true);
        } else {
            setShowLogin(true);
        }
    };

    // Hero Background Style Logic
    const hasBgImage = config.backgroundImage && config.backgroundImage.trim().length > 5;
    const heroBgStyle = hasBgImage ? {
        backgroundImage: `url(${config.backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
    } : {};

    const footerConfig = config.footer;

    // Resolve Navbar Color for CSS Variable
    let navBgColor = config.theme?.navbarBgColor || '#5d33f0';
    if (navBgColor === 'hero') {
        navBgColor = config.hero?.backgroundColor || '#5d33f0';
    }

    // Construct dynamic theme styles
    const themeStyles = `
    :root {
        --theme-primary: ${config.theme?.primaryColor || '#f1404b'};
        --theme-bg: ${config.theme?.backgroundColor || '#f1f2f3'};
        --theme-text: ${config.theme?.textColor || '#444444'};
        --theme-nav-bg: ${navBgColor};
        --hero-bg: ${config.hero?.backgroundColor || '#5d33f0'};
    }
    html {
        font-size: ${config.theme?.baseFontSize || 15}px;
    }
    body {
        background-color: var(--theme-bg);
        color: var(--theme-text);
    }
  `;

    // Loading State
    if (!isLoaded) return <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-500">Loading...</div>;

    return (
        <div className="bg-[var(--theme-bg)] min-h-screen font-sans text-[var(--theme-text)]">
            <style>{themeStyles}</style>

            {/* Admin Panel - Lazy Loaded */}
            {isEditing && (
                <Suspense fallback={
                    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center">
                        <div className="bg-white rounded-xl shadow-2xl p-8 flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-[var(--theme-primary)] border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-gray-600 font-medium">加载管理面板中...</p>
                        </div>
                    </div>
                }>
                    <AdminPanel onClose={() => setIsEditing(false)} />
                </Suspense>
            )}

            {/* Login Dialog */}
            {showLogin && (
                <LoginDialog
                    onClose={() => setShowLogin(false)}
                    onLogin={() => {
                        setShowLogin(false);
                        // 登录成功后不自动打开管理面板
                    }}
                />
            )}

            {/* Search Modal */}
            {showSearchModal && (
                <SearchModal
                    config={config}
                    isAuthenticated={isAuthenticated}
                    onClose={() => setShowSearchModal(false)}
                    onAIModeClick={() => setShowAIChatModal(true)}
                />
            )}

            {/* FULL SCREEN LANDING SECTION with Dynamic Background */}
            <div
                className={`min-h-screen flex flex-col relative overflow-hidden pb-48 transition-colors duration-500 ${!hasBgImage ? 'bg-[var(--hero-bg)]' : 'bg-gray-800'}`}
                style={heroBgStyle}
            >
                {/* Gradient Overlay for vertical transition */}
                <div className={`absolute inset-0 ${hasBgImage
                    ? 'bg-gradient-to-b from-black/40 via-black/20 to-[var(--theme-bg)]'
                    : 'bg-gradient-to-b from-[var(--hero-bg)] via-[var(--hero-bg)] via-60% to-[var(--theme-bg)]'
                    }`}></div>

                {!hasBgImage && (
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                )}

                <TopNavbar
                    config={config}
                    toggleSidebar={() => setMobileOpen(!mobileOpen)}
                    mobileOpen={mobileOpen}
                    onUserClick={handleUserIconClick}
                    onLogout={logout}
                    isAuthenticated={isAuthenticated}
                    onSearchClick={() => setShowSearchModal(true)}
                />

                {/* Hero Content - Google-style Search Positioning */}
                <div className="absolute top-[40%] left-0 right-0 transform -translate-y-1/2 z-30 px-4">
                    <SearchHero 
                        config={config} 
                        isAuthenticated={isAuthenticated}
                        onAIModeClick={() => setShowAIChatModal(true)}
                    />
                </div>
            </div>

            {/* Main Layout Wrapper - Second Screen */}
            {/* Content starts on second screen for clean first impression */}
            <div className="max-w-[1800px] mx-auto p-4 md:p-6 w-full relative">

                <div className="flex gap-6 items-start">

                    {/* Column 1: Left Sidebar (Collapsible) */}
                    <Sidebar
                        config={config}
                        activeCategory={activeCategory}
                        onScrollTo={scrollTo}
                        mobileOpen={mobileOpen}
                        setMobileOpen={setMobileOpen}
                        collapsed={collapsed}
                        toggleCollapsed={() => setCollapsed(!collapsed)}
                        isAuthenticated={isAuthenticated}
                    />

                    {/* Column 2: Main Content Wrapper (Promo + Categories + Widgets) */}
                    <div className="flex-1 min-w-0 flex flex-col gap-6">

                        {/* Promo Area - Spans full width of the right section */}
                        <PromoArea />

                        {/* Content Row */}
                        <div className="flex gap-6 items-start">
                            {/* Categories List */}
                            <div className="flex-1 min-w-0">
                                {config.categories
                                    .filter(cat => isAuthenticated || !cat.hidden)
                                    .map(cat => (
                                        <CategorySection key={cat.id} cat={cat} />
                                    ))}
                            </div>

                            {/* Right Widgets - Sticky */}
                            <div className="hidden xl:block w-[280px] flex-shrink-0 sticky top-[80px]">
                                <RightWidgets config={config} />
                            </div>
                        </div>

                        {/* Footer moved out */}
                    </div>
                </div>

                {/* Footer - Centered */}
                <footer className="text-center text-gray-400 text-sm py-8 border-t border-gray-200/50 mt-8 w-full">
                    <p>{footerConfig.copyright}</p>
                </footer>
            </div>

            {/* Back to Top Button */}
            <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className={`fixed bottom-[20vh] w-12 h-12 bg-[var(--theme-primary)] text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 z-50 hover:bg-red-600 hover:-translate-y-1 ${showBackToTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
                style={{ right: 'max(2rem, calc((100vw - 1800px) / 4))' }}
                title="回到顶部"
            >
                <Icon icon="fa-solid fa-arrow-up" />
            </button>

            {/* AI 对话模态框 */}
            <AIChatModal isOpen={showAIChatModal} onClose={() => setShowAIChatModal(false)} />
        </div>
    );
}

export default AppContent;