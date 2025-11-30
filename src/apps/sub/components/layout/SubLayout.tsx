import React, { useState } from 'react';
import { Icon } from '@/src/shared/components/common/Icon';
import { useConfig } from '@/src/shared/context/ConfigContext';

interface SubLayoutProps {
    children: React.ReactNode;
    activeView: 'dashboard' | 'list' | 'calendar' | 'reminders' | 'settings';
    onViewChange: (view: 'dashboard' | 'list' | 'calendar' | 'reminders' | 'settings') => void;
    isAuthenticated?: boolean;
    onShowLogin?: () => void;
}

export const SubLayout: React.FC<SubLayoutProps> = ({ children, activeView, onViewChange, isAuthenticated, onShowLogin }) => {
    const { config } = useConfig();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    const handleViewChange = (view: 'dashboard' | 'list' | 'calendar' | 'reminders' | 'settings') => {
        // 如果要打开设置且未登录，提示登录
        if (view === 'settings' && !isAuthenticated) {
            alert('⚠️ 请先登录后再访问设置！');
            if (onShowLogin) onShowLogin();
            return;
        }
        onViewChange(view);
        // 移动端点击后关闭侧边栏
        if (window.innerWidth < 1024) setMobileOpen(false);
    };

    const menuItems = [
        { id: 'dashboard', label: '仪表盘', icon: 'fa-solid fa-chart-pie' },
        { id: 'list', label: '订阅列表', icon: 'fa-solid fa-list' },
        { id: 'calendar', label: '日历视图', icon: 'fa-solid fa-calendar-alt' },
        { id: 'reminders', label: '提醒列表', icon: 'fa-solid fa-bell' },
        { id: 'settings', label: '设置', icon: 'fa-solid fa-cog' },
    ] as const;

    // 桌面端侧边栏宽度
    const widthClass = collapsed ? 'w-[68px]' : 'w-[220px]';

    const SidebarContent = ({ isDesktop = false }: { isDesktop?: boolean }) => (
        <>
            {/* 移动端 Header */}
            {!isDesktop && (
                <div className="h-[60px] flex items-center px-6 border-b border-gray-100 bg-white">
                    <span className="text-lg font-bold text-gray-800">通知管理</span>
                    <button 
                        onClick={() => setMobileOpen(false)} 
                        className="ml-auto text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center"
                    >
                        <Icon icon="fa-solid fa-times" />
                    </button>
                </div>
            )}

            {/* 桌面端 Header */}
            {isDesktop && !collapsed && (
                <div className="p-6 pt-4">
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--theme-primary)] to-purple-600">
                        通知管理
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">不遗漏任何重要通知</p>
                </div>
            )}

            {/* Menu Items */}
            <nav className="flex-1 px-2 lg:px-4 space-y-1 lg:space-y-2 py-2 overflow-y-auto custom-scrollbar">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => handleViewChange(item.id)}
                        className={`
                            w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group
                            ${activeView === item.id
                                ? 'bg-[var(--theme-primary)] text-white shadow-md shadow-[var(--theme-primary)]/30'
                                : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
                            }
                            ${collapsed && isDesktop ? 'justify-center px-2' : ''}
                        `}
                        title={collapsed && isDesktop ? item.label : ''}
                    >
                        <Icon 
                            icon={item.icon} 
                            className={`
                                ${collapsed && isDesktop ? 'text-lg' : 'mr-3'}
                                ${activeView === item.id ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}
                            `} 
                        />
                        {(!collapsed || !isDesktop) && item.label}
                    </button>
                ))}
            </nav>

            {/* Footer / Collapse Button */}
            {isDesktop && (
                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className={`
                            w-full flex items-center justify-center px-4 py-2 text-sm text-gray-500 hover:text-[var(--theme-primary)] 
                            hover:bg-gray-50 rounded-lg transition-colors
                            ${collapsed ? '' : 'gap-2'}
                        `}
                        title={collapsed ? '展开' : '收起'}
                    >
                        {collapsed ? (
                            <Icon icon="fa-solid fa-angles-right" />
                        ) : (
                            <>
                                <Icon icon="fa-solid fa-angles-left" />
                                <span>收起</span>
                            </>
                        )}
                    </button>
                </div>
            )}
        </>
    );

    return (
        <div className="flex h-screen overflow-hidden">
            {/* 桌面端侧边栏 */}
            <aside className={`
                hidden lg:flex flex-col flex-shrink-0
                bg-white/80 backdrop-blur-md border-r border-gray-200/50 shadow-sm z-20 pt-2
                transition-all duration-300 ease-in-out
                ${widthClass}
            `}>
                <SidebarContent isDesktop={true} />
            </aside>

            {/* 移动端侧边栏 */}
            <aside className={`
                fixed inset-y-0 left-0 w-[240px] bg-white z-[70] shadow-2xl 
                transform transition-transform duration-300 ease-in-out
                ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:hidden flex flex-col
            `}>
                <SidebarContent isDesktop={false} />
            </aside>

            {/* 移动端遮罩 */}
            {mobileOpen && (
                <div 
                    className="fixed inset-0 bg-black/40 z-[65] lg:hidden backdrop-blur-sm" 
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* 移动端汉堡包菜单按钮 */}
            <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-[var(--theme-primary)] text-white rounded-full shadow-lg shadow-[var(--theme-primary)]/30 flex items-center justify-center z-50 hover:scale-110 transition-transform"
            >
                <Icon icon="fa-solid fa-bars" className="text-xl" />
            </button>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto custom-scrollbar pt-2">
                {children}
            </main>
        </div>
    );
};
