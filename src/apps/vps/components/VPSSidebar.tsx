import React, { useState, useMemo } from 'react';
import { Icon } from '@/src/shared/components/common/Icon';
import { VpsServer, VpsGroup } from '../types';

export type VPSView = 'overview' | 'servers' | 'dashboard' | 'terminal' | 'files' | 'snippets';

interface VPSSidebarProps {
    activeView: VPSView;
    onViewChange: (view: VPSView) => void;
    mobileOpen: boolean;
    setMobileOpen: (open: boolean) => void;
    collapsed: boolean;
    toggleCollapsed: () => void;
    servers: VpsServer[];
    groups: VpsGroup[];
    onConnect: (serverId: string) => void;
    activeServerId?: string | null;
}

const VPSSidebar: React.FC<VPSSidebarProps> = ({
    activeView,
    onViewChange,
    mobileOpen,
    setMobileOpen,
    collapsed,
    toggleCollapsed,
    servers,
    groups,
    onConnect,
    activeServerId
}) => {
    // State for collapsed groups (by ID)
    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

    const toggleGroup = (groupId: string) => {
        setCollapsedGroups(prev => ({
            ...prev,
            [groupId]: !prev[groupId]
        }));
    };

    // Group servers
    const groupedServers = useMemo(() => {
        const grouped: Record<string, VpsServer[]> = {};
        const ungrouped: VpsServer[] = [];

        servers.forEach(server => {
            if (server.group_id) {
                if (!grouped[server.group_id]) grouped[server.group_id] = [];
                grouped[server.group_id].push(server);
            } else {
                ungrouped.push(server);
            }
        });

        return { grouped, ungrouped };
    }, [servers]);
    // Dynamic width based on collapsed state
    const widthClass = collapsed ? 'w-[68px]' : 'w-[220px]';

    const desktopClass = `
    hidden lg:flex flex-col flex-shrink-0
    sticky top-[80px] h-[calc(100vh-100px)]
    bg-transparent transition-all duration-300 ease-in-out
    ${widthClass}
`;

    const mobileClass = `
    fixed inset-y-0 left-0 w-[240px] bg-white z-[70] shadow-2xl transform transition-transform duration-300 ease-in-out
    ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
    lg:hidden flex flex-col
  `;

    const mainItems = [
        { id: 'overview', label: '总览', icon: 'fa-solid fa-gauge-high' },
        { id: 'snippets', label: '脚本库', icon: 'fa-solid fa-code' },
    ];

    const Content = ({ isDesktop = false }: { isDesktop?: boolean }) => (
        <>
            {/* Mobile Header */}
            <div className="lg:hidden h-[60px] flex items-center px-6 border-b border-gray-100">
                <span className="text-lg font-bold text-gray-800">VPS 管理</span>
                <button onClick={() => setMobileOpen(false)} className="ml-auto text-gray-400"><Icon icon="fa-solid fa-times" /></button>
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto custom-scrollbar py-2 pr-2">
                <nav className="space-y-1">
                    {/* Main Menu */}
                    {mainItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                onViewChange(item.id as VPSView);
                                if (window.innerWidth < 1024) setMobileOpen(false);
                            }}
                            className={`
                  w-full flex items-center px-4 py-3 text-[14px] font-medium rounded-lg transition-all duration-200 group
                  ${activeView === item.id
                                    ? 'text-white bg-[var(--theme-primary)] shadow-md shadow-red-200'
                                    : 'text-gray-600 hover:bg-white hover:text-[var(--theme-primary)] hover:shadow-sm'
                                }
                  ${collapsed && isDesktop ? 'justify-center px-0' : ''}
`}
                            title={collapsed ? item.label : ''}
                        >
                            <div className={`${collapsed && isDesktop ? 'text-lg w-auto mr-0' : 'w-6 text-center mr-2'} ${activeView === item.id ? 'text-white' : 'text-gray-400 group-hover:text-[var(--theme-primary)]'} flex items-center justify-center`}>
                                <Icon icon={item.icon} />
                            </div>
                            {(!collapsed || !isDesktop) && <span>{item.label}</span>}
                        </button>
                    ))}

                    {/* Server List */}
                    <div className={`mt-6 mb-2 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider ${collapsed && isDesktop ? 'hidden' : ''}`}>
                        服务器列表
                    </div>
                    {collapsed && isDesktop && <div className="h-px bg-gray-200 my-2 mx-4"></div>}

                    {/* Grouped Servers */}
                    {groups.map(group => {
                        const groupServers = groupedServers.grouped[group.id] || [];
                        if (groupServers.length === 0) return null;
                        const isGroupCollapsed = collapsedGroups[group.id];

                        return (
                            <div key={group.id} className="mb-2">
                                {/* Group Header */}
                                {(!collapsed || !isDesktop) && (
                                    <button
                                        onClick={() => toggleGroup(group.id)}
                                        className="w-full flex items-center justify-between px-4 py-1 text-xs font-semibold text-gray-400 hover:text-gray-600 uppercase tracking-wider transition-colors"
                                    >
                                        <span>{group.name}</span>
                                        <Icon icon={`fa-solid fa-chevron-${isGroupCollapsed ? 'right' : 'down'}`} className="text-[10px]" />
                                    </button>
                                )}
                                {collapsed && isDesktop && (
                                    <div className="h-px bg-gray-200 my-2 mx-4" title={group.name}></div>
                                )}

                                {/* Group Items */}
                                <div className={`space-y-1 mt-1 ${isGroupCollapsed && (!collapsed || !isDesktop) ? 'hidden' : ''}`}>
                                    {groupServers.map(server => {
                                        const isActive = activeServerId === server.id;
                                        return (
                                            <div key={server.id} className="px-2">
                                                <button
                                                    onClick={() => {
                                                        onConnect(server.id);
                                                        if (window.innerWidth < 1024) setMobileOpen(false);
                                                    }}
                                                    className={`
                                                        w-full flex items-center px-3 py-2 text-[13px] font-medium rounded-lg transition-all duration-200 group
                                                        ${isActive
                                                            ? 'bg-[var(--theme-primary)] text-white shadow-md shadow-red-200'
                                                            : 'text-gray-600 hover:bg-white hover:text-[var(--theme-primary)] hover:shadow-sm border border-transparent hover:border-gray-100'
                                                        }
                                                        ${collapsed && isDesktop ? 'justify-center px-0' : ''}
                                                    `}
                                                    title={collapsed ? server.name : ''}
                                                >
                                                    <div className={`${collapsed && isDesktop ? 'text-lg w-auto mr-0' : 'w-2 h-2 rounded-full mr-3'} ${isActive ? 'bg-white' :
                                                        server.status === 'online' ? 'bg-green-500' :
                                                            server.status === 'offline' ? 'bg-gray-300' : 'bg-yellow-500'
                                                        } flex-shrink-0`}></div>

                                                    {(!collapsed || !isDesktop) && (
                                                        <div className="flex-1 text-left truncate">
                                                            {server.name}
                                                        </div>
                                                    )}

                                                    {(!collapsed || !isDesktop) && !isActive && (
                                                        <div className="opacity-0 group-hover:opacity-100 text-xs text-[var(--theme-primary)]">
                                                            <Icon icon="fa-solid fa-plug" />
                                                        </div>
                                                    )}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}

                    {/* Ungrouped Servers */}
                    {groupedServers.ungrouped.length > 0 && (
                        <div className="mb-2">
                            {(!collapsed || !isDesktop) && groups.length > 0 && (
                                <div className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    未分组
                                </div>
                            )}
                            {collapsed && isDesktop && groups.length > 0 && (
                                <div className="h-px bg-gray-200 my-2 mx-4"></div>
                            )}
                            <div className="space-y-1 mt-1">
                                {groupedServers.ungrouped.map(server => {
                                    const isActive = activeServerId === server.id;
                                    return (
                                        <div key={server.id} className="px-2">
                                            <button
                                                onClick={() => {
                                                    onConnect(server.id);
                                                    if (window.innerWidth < 1024) setMobileOpen(false);
                                                }}
                                                className={`
                                                    w-full flex items-center px-3 py-2 text-[13px] font-medium rounded-lg transition-all duration-200 group
                                                    ${isActive
                                                        ? 'bg-[var(--theme-primary)] text-white shadow-md shadow-red-200'
                                                        : 'text-gray-600 hover:bg-white hover:text-[var(--theme-primary)] hover:shadow-sm border border-transparent hover:border-gray-100'
                                                    }
                                                    ${collapsed && isDesktop ? 'justify-center px-0' : ''}
                                                `}
                                                title={collapsed ? server.name : ''}
                                            >
                                                <div className={`${collapsed && isDesktop ? 'text-lg w-auto mr-0' : 'w-2 h-2 rounded-full mr-3'} ${isActive ? 'bg-white' :
                                                    server.status === 'online' ? 'bg-green-500' :
                                                        server.status === 'offline' ? 'bg-gray-300' : 'bg-yellow-500'
                                                    } flex-shrink-0`}></div>

                                                {(!collapsed || !isDesktop) && (
                                                    <div className="flex-1 text-left truncate">
                                                        {server.name}
                                                    </div>
                                                )}

                                                {(!collapsed || !isDesktop) && !isActive && (
                                                    <div className="opacity-0 group-hover:opacity-100 text-xs text-[var(--theme-primary)]">
                                                        <Icon icon="fa-solid fa-plug" />
                                                    </div>
                                                )}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </nav>
            </div>

            {/* Footer / Collapse Button */}
            <div className="p-4 mt-auto lg:mt-0">
                <div className="flex items-center justify-between text-gray-500 bg-white lg:bg-transparent rounded-lg p-2 lg:p-0">
                    <button
                        onClick={toggleCollapsed}
                        className={`hover:text-[var(--theme-primary)] text-sm font-medium flex items-center ${collapsed && isDesktop ? 'mx-auto' : ''} `}
                        title={collapsed ? "展开" : "收起"}
                    >
                        {collapsed && isDesktop ? (
                            <Icon icon="fa-solid fa-right-to-bracket" />
                        ) : (
                            <>
                                <Icon icon="fa-solid fa-right-from-bracket" className="mr-1" /> 收起
                            </>
                        )}
                    </button>
                </div>
            </div>
        </>
    );

    return (
        <>
            <div className={desktopClass}>
                <Content isDesktop={true} />
            </div>
            <div className={mobileClass}>
                <Content isDesktop={false} />
            </div>
            {mobileOpen && <div className="fixed inset-0 bg-black/40 z-[65] lg:hidden backdrop-blur-sm" onClick={() => setMobileOpen(false)}></div>}
        </>
    );
};

export default VPSSidebar;
