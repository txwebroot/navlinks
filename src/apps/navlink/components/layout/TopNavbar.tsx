import React, { useState, useEffect } from 'react';
import { SiteConfig } from '@/src/shared/types';
import { Icon } from '@/src/shared/components/common/Icon';
import { ensureProtocol } from '@/src/shared/utils/url';

const TopNavbar = ({ config, toggleSidebar, mobileOpen, onUserClick, onLogout, isAuthenticated = false, onSearchClick }: {
    config: SiteConfig,
    toggleSidebar: any,
    mobileOpen: boolean,
    onUserClick: () => void,
    onLogout: () => void,
    isAuthenticated?: boolean,
    onSearchClick: () => void
}) => {
    const [hoverId, setHoverId] = useState<string | null>(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [menuTimer, setMenuTimer] = useState<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (menuTimer) clearTimeout(menuTimer);
        };
    }, [menuTimer]);


    // Overlay Logic:
    // If overlayNavbar is TRUE (default): Transparent at top, Theme Color on scroll.
    // If overlayNavbar is FALSE: Always Theme Color.
    const isOverlayMode = config.hero?.overlayNavbar !== false;
    const shouldUseTransparent = isOverlayMode && !isScrolled;

    let navBgStyle: React.CSSProperties = {};
    if (!shouldUseTransparent) {
        const navColor = config.theme?.navbarBgColor || '#5d33f0';
        navBgStyle = {
            backgroundColor: navColor === 'hero' ? (config.hero?.backgroundColor || '#5d33f0') : (navColor === 'transparent' ? 'transparent' : navColor)
        };
    }

    // Filter navigation items based on authentication
    const visibleNavItems = config.topNav?.filter(item => isAuthenticated || !item.hidden) || [];

    return (
        <nav
            className={`
                w-full ${isOverlayMode ? 'fixed' : 'sticky'} top-0 left-0 z-40 lg:z-50 transition-all duration-300
                ${shouldUseTransparent ? 'bg-transparent' : 'shadow-md'}
                text-white py-2 px-4 md:px-8
            `}
            style={navBgStyle}
        >
            <div className="flex items-center justify-between">
                {/* Left side: Logo + Navigation */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleSidebar}
                        className="lg:hidden text-white/80 hover:text-white p-2"
                    >
                        <Icon icon="fa-solid fa-bars" className="text-xl" />
                    </button>

                    <div className="flex items-center gap-2 mr-8">
                        {config.logoUrl && (
                            <img src={config.logoUrl} alt="Logo" className="h-8 w-auto" />
                        )}
                        <span className="text-xl font-bold text-white ml-1 hidden sm:block">Navlink</span>
                    </div>

                    <div className="hidden lg:flex items-center space-x-0 text-sm font-medium">
                        {visibleNavItems.map((link) => (
                            <div
                                key={link.id}
                                className="relative group"
                                onMouseEnter={() => setHoverId(link.id)}
                                onMouseLeave={() => setHoverId(null)}
                            >
                                <a
                                    key={link.id}
                                    href={link.url}
                                    className="flex items-center gap-2 px-2 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                                >
                                    {link.icon && <i className={link.icon}></i>}
                                    <span>{link.title}</span>
                                    {link.children && link.children.length > 0 && <i className="fa-solid fa-angle-down text-xs mt-0.5"></i>}
                                </a>
                                {/* Submenu */}
                                {link.children && link.children.length > 0 && hoverId === link.id && (
                                    <div className="absolute top-full left-0 bg-white text-gray-700 shadow-lg rounded-lg py-2 min-w-[140px] animate-fade-in">
                                        {link.children.map(sub => (
                                            <a
                                                key={sub.id}
                                                href={sub.url}
                                                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 transition-colors text-sm"
                                            >
                                                {sub.icon && <i className={`${sub.icon} text-gray-400 w-5 text-center`}></i>}
                                                <span>{sub.title}</span>
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right side: Quote + User/Search */}
                <div className="flex items-center space-x-4">
                    <span className="hidden xl:block text-xs text-white/70 mr-4 truncate max-w-[500px]" title={config.headerQuote}>
                        {config.headerQuote || '对你竖大拇指的人，不一定是在夸你，也可能是用炮在瞄你。'}
                    </span>
                    <div className="flex items-center space-x-4 pl-4 sm:border-l sm:border-white/20">
                        <div
                            className="relative"
                            onMouseEnter={() => {
                                if (menuTimer) clearTimeout(menuTimer);
                                setShowUserMenu(true);
                            }}
                            onMouseLeave={() => {
                                const timer = setTimeout(() => setShowUserMenu(false), 500);
                                setMenuTimer(timer);
                            }}
                        >
                            <button
                                className={`relative group transition-all ${isAuthenticated
                                    ? 'text-green-300 hover:text-green-200'
                                    : 'hover:text-white/70'
                                    }`}
                                onClick={onUserClick}
                            >
                                {/* User Icon - changes style based on login status */}
                                <Icon
                                    icon={isAuthenticated ? "fa-solid fa-user-check" : "fa-regular fa-user"}
                                    className="text-lg"
                                />

                                {/* Status Badge - green dot when logged in */}
                                {isAuthenticated && (
                                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full border border-white/20 shadow-sm animate-pulse"></span>
                                )}

                                {/* Tooltip - only show when dropdown is not visible */}
                                {!showUserMenu && (
                                    <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs bg-black/70 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                                        {isAuthenticated ? '已登录 · 管理' : '点击登录'}
                                    </span>
                                )}
                            </button>

                            {/* Dropdown Menu - only show when authenticated and hovering */}
                            {isAuthenticated && showUserMenu && (
                                <div className="absolute top-full right-0 mt-2 w-40 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden animate-fade-in z-50">
                                    <button
                                        onClick={() => {
                                            setShowUserMenu(false);
                                            onUserClick();
                                        }}
                                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                                    >
                                        <Icon icon="fa-solid fa-cog" className="text-gray-400" />
                                        <span>管理设置</span>
                                    </button>
                                    <div className="border-t border-gray-100"></div>
                                    <button
                                        onClick={() => {
                                            setShowUserMenu(false);
                                            onLogout();
                                        }}
                                        className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                                    >
                                        <Icon icon="fa-solid fa-right-from-bracket" className="text-red-500" />
                                        <span>退出登录</span>
                                    </button>
                                </div>
                            )}
                        </div>
                        <button
                            className="hover:text-white/70 transition-colors"
                            onClick={onSearchClick}
                            aria-label="Open search"
                        >
                            <Icon icon="fa-solid fa-magnifying-glass" className="text-lg" />
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default TopNavbar;