import React, { useState, useEffect, useRef } from 'react';
import { useConfig } from '@/src/shared/context/ConfigContext';
import TopNavbar from '@/src/apps/navlink/components/layout/TopNavbar';
import LoginDialog from '@/src/shared/components/common/LoginDialog';
import SearchModal from '@/src/apps/navlink/components/common/SearchModal';
import VPSSidebar, { VPSView } from './components/VPSSidebar';
import ServerList from './components/ServerList';
import WebTerminal from './components/WebTerminal';
import Dashboard from './components/Dashboard';
import FileManager from './components/FileManager';
import SnippetLibrary from './components/SnippetLibrary';
import { Socket } from 'socket.io-client';
import ServerFormModal from './components/ServerFormModal';
import { VpsServer, VpsGroup } from './types';
import GlobalDashboard from './components/GlobalDashboard';
import ServerTerminalView from './components/ServerTerminalView';
import { Icon } from '@/src/shared/components/common/Icon';
import { ConfirmModal } from '@/src/shared/components/common/ConfirmModal';

interface Session {
    id: string; // Unique session ID (could be serverId if only 1 session per server allowed)
    serverId: string;
    serverName: string;
    socket: Socket | null;
    stats: any;
}

export default function VPSApp() {
    const { config, isLoaded, isAuthenticated, logout } = useConfig();

    // Layout State
    const [showLogin, setShowLogin] = useState(false);
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    // App State
    const [activeView, setActiveView] = useState<VPSView>('overview');
    const [servers, setServers] = useState<VpsServer[]>([]);
    const [groups, setGroups] = useState<VpsGroup[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingServer, setEditingServer] = useState<VpsServer | null>(null);
    const [serverToDelete, setServerToDelete] = useState<VpsServer | null>(null);

    // Session Management
    const [sessions, setSessions] = useState<Session[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

    // Fetch Data
    const fetchData = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const headers = {
                'Authorization': `Bearer ${token}`
            };

            const [serversRes, groupsRes] = await Promise.all([
                fetch('/api/vps/servers', { headers }),
                fetch('/api/vps/groups', { headers })
            ]);

            if (serversRes.ok) {
                const data = await serversRes.json();
                setServers(data);
            }

            if (groupsRes.ok) {
                const data = await groupsRes.json();
                setGroups(data);
            }
        } catch (e) {
            console.error('Failed to fetch VPS data:', e);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchData();
        }
    }, [isAuthenticated]);

    const handleAddServer = () => {
        setEditingServer(null);
        setShowAddModal(true);
    };

    const handleEditServer = (server: VpsServer) => {
        setEditingServer(server);
        setShowAddModal(true);
    };

    const handleDeleteServer = (server: VpsServer) => {
        setServerToDelete(server);
    };

    const confirmDeleteServer = async () => {
        if (!serverToDelete) return;
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`/api/vps/servers/${serverToDelete.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                await fetchData();
                setServerToDelete(null);
            } else {
                alert('Failed to delete server');
            }
        } catch (e) {
            console.error(e);
            alert('Error deleting server');
        }
    };

    const handleSaveServer = async (serverData: Partial<VpsServer>) => {
        try {
            const token = localStorage.getItem('auth_token');
            const url = editingServer ? `/api/vps/servers/${editingServer.id}` : '/api/vps/servers';
            const method = editingServer ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(serverData)
            });

            if (res.ok) {
                await fetchData(); // Refresh list
                setShowAddModal(false);
            } else {
                alert('Failed to create server');
            }
        } catch (e) {
            console.error(e);
            alert('Error creating server');
        }
    };

    // Handle Server Connection (Open/Switch Tab)
    const handleConnect = (serverId: string) => {
        const server = servers.find(s => s.id === serverId);
        if (!server) return;

        // Check if session already exists
        const existingSession = sessions.find(s => s.serverId === serverId);
        if (existingSession) {
            setActiveSessionId(existingSession.id);
            setActiveView('terminal'); // Switch to workspace view
        } else {
            // Create new session
            const newSession: Session = {
                id: serverId, // Simple 1:1 mapping for now
                serverId: serverId,
                serverName: server.name,
                socket: null,
                stats: null
            };
            setSessions(prev => [...prev, newSession]);
            setActiveSessionId(newSession.id);
            setActiveView('terminal');
        }
    };

    // Close Session
    const handleCloseSession = (sessionId: string, e?: React.MouseEvent) => {
        e?.stopPropagation();

        // Find session to close
        const sessionToClose = sessions.find(s => s.id === sessionId);

        // Disconnect socket if exists
        if (sessionToClose?.socket) {
            sessionToClose.socket.disconnect();
        }

        // Remove from state
        setSessions(prev => prev.filter(s => s.id !== sessionId));

        // If closing active session, switch to another or overview
        if (activeSessionId === sessionId) {
            const remaining = sessions.filter(s => s.id !== sessionId);
            if (remaining.length > 0) {
                setActiveSessionId(remaining[remaining.length - 1].id);
            } else {
                setActiveSessionId(null);
                setActiveView('overview');
            }
        }
    };

    // Handle Socket Ready for a Session
    const handleSocketReady = (sessionId: string, socket: Socket) => {
        setSessions(prev => prev.map(s => {
            if (s.id === sessionId) {
                // Setup monitoring listener for this session
                socket.on('monitor:data', (data) => {
                    setSessions(currentSessions => currentSessions.map(cs =>
                        cs.id === sessionId ? { ...cs, stats: data } : cs
                    ));
                });
                return { ...s, socket };
            }
            return s;
        }));
    };

    // Handle Status Change from Terminal
    const handleStatusChange = (serverId: string, status: 'online' | 'offline') => {
        setServers(prev => prev.map(s =>
            s.id === serverId ? { ...s, status } : s
        ));
    };

    // Resolve Navbar Color
    let navBgColor = config.theme?.navbarBgColor || '#5d33f0';
    if (navBgColor === 'hero') {
        navBgColor = config.hero?.backgroundColor || '#5d33f0';
    }

    // Theme Styles
    const themeStyles = `
    :root {
        --theme-primary: ${config.theme?.primaryColor || '#f1404b'};
        --theme-bg: ${config.theme?.backgroundColor || '#f1f2f3'};
        --theme-text: ${config.theme?.textColor || '#444444'};
        --theme-nav-bg: ${navBgColor};
        --hero-bg: ${config.hero?.backgroundColor || '#5d33f0'};
    }
    body {
        background-color: var(--theme-bg);
        color: var(--theme-text);
    }
  `;

    if (!isLoaded) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="flex flex-col h-screen bg-[var(--theme-bg)] text-[var(--theme-text)] font-sans overflow-hidden">
            <style>{themeStyles}</style>

            {/* Global Overlays */}
            {showLogin && <LoginDialog onClose={() => setShowLogin(false)} onLogin={() => setShowLogin(false)} />}
            {showSearchModal && <SearchModal config={config} isAuthenticated={isAuthenticated} onClose={() => setShowSearchModal(false)} />}

            {/* Top Navbar */}
            <div className="flex-shrink-0 z-50">
                <TopNavbar
                    config={{ ...config, hero: { ...config.hero, overlayNavbar: false } }}
                    toggleSidebar={() => setMobileOpen(!mobileOpen)}
                    mobileOpen={mobileOpen}
                    onUserClick={() => setShowLogin(true)}
                    onLogout={() => {
                        logout();
                        window.location.href = '/';
                    }}
                    isAuthenticated={isAuthenticated}
                    onSearchClick={() => setShowSearchModal(true)}
                />
            </div>

            {/* Main Layout */}
            <div className="flex flex-1 overflow-hidden relative">
                {/* Sidebar */}
                <VPSSidebar
                    activeView={activeView}
                    onViewChange={setActiveView}
                    mobileOpen={mobileOpen}
                    setMobileOpen={setMobileOpen}
                    collapsed={collapsed}
                    toggleCollapsed={() => setCollapsed(!collapsed)}
                    servers={servers}
                    groups={groups}
                    onConnect={handleConnect}
                    activeServerId={activeSessionId ? sessions.find(s => s.id === activeSessionId)?.serverId : null}
                />

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto bg-gray-50/50 w-full relative flex flex-col" id="main-content">

                    {/* Tab Bar (Visible only when sessions exist) */}
                    {sessions.length > 0 && (
                        <div className="bg-white border-b border-gray-200 flex items-center px-2 pt-2 gap-2 overflow-x-auto flex-shrink-0">
                            {sessions.map(session => (
                                <div
                                    key={session.id}
                                    onClick={() => {
                                        setActiveSessionId(session.id);
                                        setActiveView('terminal');
                                    }}
                                    className={`
                                        group flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium cursor-pointer transition-colors border-t border-l border-r
                                        ${activeSessionId === session.id
                                            ? 'bg-[var(--theme-primary)] border-[var(--theme-primary)] text-white relative -mb-px pb-2.5 z-10 shadow-sm'
                                            : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                                        }
                                    `}
                                >
                                    <div className={`w-2 h-2 rounded-full ${session.socket?.connected ? 'bg-green-400' : 'bg-yellow-400'} ${activeSessionId === session.id ? 'ring-2 ring-white/30' : ''}`}></div>
                                    <span className="max-w-[150px] truncate">{session.serverName}</span>
                                    <button
                                        onClick={(e) => handleCloseSession(session.id, e)}
                                        className={`w-5 h-5 flex items-center justify-center rounded-full transition-colors opacity-0 group-hover:opacity-100 ${activeSessionId === session.id
                                            ? 'hover:bg-white/20 text-white/70 hover:text-white'
                                            : 'hover:bg-gray-200 text-gray-400 hover:text-red-500'
                                            }`}
                                    >
                                        <Icon icon="fa-solid fa-times" className="text-xs" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex-1 overflow-hidden relative">
                        {/* Global Dashboard (Overview) */}
                        {activeView === 'overview' && (
                            <div className="h-full overflow-y-auto p-6 w-full">
                                <GlobalDashboard
                                    servers={servers}
                                    groups={groups}
                                    onConnect={handleConnect}
                                    onAddServer={handleAddServer}
                                    onEditServer={handleEditServer}
                                    onDeleteServer={handleDeleteServer}
                                    onRefresh={fetchData}
                                />
                            </div>
                        )}

                        {/* Snippet Library View */}
                        {activeView === 'snippets' && (
                            <div className="h-full flex flex-col">
                                <SnippetLibrary socket={activeSessionId ? sessions.find(s => s.id === activeSessionId)?.socket || null : null} />
                            </div>
                        )}

                        {/* Server Sessions (Terminals) */}
                        {sessions.map(session => {
                            const server = servers.find(s => s.id === session.serverId);
                            return (
                                <div
                                    key={session.id}
                                    className={`h-full w-full absolute inset-0 bg-white ${activeView === 'terminal' && activeSessionId === session.id ? 'z-10' : 'z-0 invisible'}`}
                                >
                                    <ServerTerminalView
                                        serverId={session.serverId}
                                        socket={session.socket}
                                        onSocketReady={(socket) => handleSocketReady(session.id, socket)}
                                        visible={activeView === 'terminal' && activeSessionId === session.id}
                                        stats={session.stats}
                                        onStatusChange={(status) => handleStatusChange(session.serverId, status)}
                                        isConnected={server?.status === 'online'}
                                        server={server}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            {/* Add Server Modal */}
            <ServerFormModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSubmit={handleSaveServer}
                groups={groups}
                initialData={editingServer}
            />

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={!!serverToDelete}
                onClose={() => setServerToDelete(null)}
                onConfirm={confirmDeleteServer}
                title="删除服务器"
                message={`确定要删除服务器 "${serverToDelete?.name}" 吗？此操作无法撤销。`}
            />
        </div>
    );
}
