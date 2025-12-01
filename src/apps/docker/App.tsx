/**
 * Docker 应用 - 容器管理系统
 * 功能：管理Docker服务器、容器、镜像、网络、卷等资源
 */

import React, { useState, useEffect } from 'react';
import { useConfig } from '@/src/shared/context/ConfigContext';
import { useDockerServers, useDockerContainers, useDockerImages, useDockerSystemInfo, useDockerNetworks, useDockerVolumes, useDockerAuditLogs } from './hooks/useDocker';
import { DockerServer, AuditLog } from './types/docker';
import TopNavbar from '@/src/apps/navlink/components/layout/TopNavbar';
import LoginDialog from '@/src/shared/components/common/LoginDialog';
import SearchModal from '@/src/apps/navlink/components/common/SearchModal';
import { Icon } from '@/src/shared/components/common/Icon';
import { useDialogs } from '@/src/shared/hooks/useDialogs';
import { ConfirmDialog } from '@/src/shared/components/common/ConfirmDialog';
import DockerSidebar, { DockerView } from './components/DockerSidebar';
import GlobalDashboard from './components/GlobalDashboard';
import ServerDashboardView from './components/ServerDashboardView';
import ServerTabs from './components/ServerTabs';
import { ContainerFormModal } from './components/ContainerFormModal';
import { LogViewerModal } from './components/LogViewerModal';
import { ShellModal } from './components/ShellModal';

function DockerApp() {
  const { config, isLoaded, isAuthenticated, logout } = useConfig();
  const { servers, loading: serversLoading, error: serversError, loadServers, createServer, updateServer, deleteServer, setDefault, testConnection } = useDockerServers();
  const {
    confirmDialog,
    showConfirm,
    hideConfirm,
    alertDialog,
    showAlert,
    hideAlert,
    promptDialog,
    showPrompt,
    hidePrompt
  } = useDialogs();

  // ... (rest of the component)

  const [showLogin, setShowLogin] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [activeView, setActiveView] = useState<DockerView>('overview');
  const [selectedServer, setSelectedServer] = useState<DockerServer | null>(null);
  const [showServerForm, setShowServerForm] = useState(false);
  const [editingServer, setEditingServer] = useState<DockerServer | null>(null);
  const [newServerData, setNewServerData] = useState({
    name: '',
    description: '',
    connection_type: 'local' as 'local' | 'tcp' | 'tls' | 'ssh',
    host: '',
    port: 2375,
    ssh_user: 'root',
    ssh_password: '',
    ssh_private_key: '',
    ssh_port: 22
  });

  // New Modal States
  const [showContainerModal, setShowContainerModal] = useState(false);
  const [containerModalMode, setContainerModalMode] = useState<'create' | 'run'>('create');
  const [selectedImageForRun, setSelectedImageForRun] = useState<string>('');

  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedContainerId, setSelectedContainerId] = useState<string>('');
  const [selectedContainerName, setSelectedContainerName] = useState<string>('');

  const [showShellModal, setShowShellModal] = useState(false);

  // Docker Hooks
  const {
    containers,
    loading: containersLoading,
    error: containersError,
    startContainer,
    stopContainer,
    restartContainer,
    removeContainer,
    loadContainers,
    getContainerLogs,
    createContainer
  } = useDockerContainers(selectedServer?.id || null);

  const { images, loading: imagesLoading, error: imagesError, removeImage, pruneImages, loadImages, pullImage } = useDockerImages(selectedServer?.id || null);
  const { info, loading: infoLoading, loadInfo } = useDockerSystemInfo(selectedServer?.id || null);
  const { networks, loading: networksLoading, error: networksError, loadNetworks } = useDockerNetworks(selectedServer?.id || null);
  const { volumes, loading: volumesLoading, error: volumesError, removeVolume, pruneVolumes, loadVolumes } = useDockerVolumes(selectedServer?.id || null);

  // Track if we have performed the initial redirect to default server
  const hasInitialRedirect = React.useRef(false);

  // 自动选择默认服务器
  useEffect(() => {
    // Only run this logic if we haven't redirected yet or if we are in a state that needs initialization
    if (!hasInitialRedirect.current && servers.length > 0) {
      if (!selectedServer) {
        // 检查是否有默认服务器
        const defaultServer = servers.find(s => s.is_default === 1);
        if (defaultServer) {
          setSelectedServer(defaultServer);
          // User wants "Overview" (Global Dashboard) to be the default view even if a default server is selected.
          // So we DO NOT switch to 'dashboard' here.
          // However, we still want to select the server so it's highlighted in the sidebar if they navigate to server-specific views.

          hasInitialRedirect.current = true;
        } else if (activeView !== 'overview' && activeView !== 'servers') {
          // 如果没有默认服务器且不在总览/服务器管理页，显示容器列表
          setActiveView('containers');
          hasInitialRedirect.current = true;
        } else {
          // If we are on overview/servers and no default server, we consider initial redirect "done" (user stays on overview)
          hasInitialRedirect.current = true;
        }
      } else {
        hasInitialRedirect.current = true;
      }
    } else if (servers.length === 0 && activeView !== 'overview' && activeView !== 'servers') {
      // 没有服务器时也显示容器列表（虽然会被空状态覆盖，但逻辑上正确）
      setActiveView('containers');
    }
  }, [servers, selectedServer, activeView]);

  // Resolve Navbar Color for CSS Variable
  let navBgColor = config.theme?.navbarBgColor || '#5d33f0';
  if (navBgColor === 'hero') {
    navBgColor = config.hero?.backgroundColor || '#5d33f0';
  }

  // Load editing server data into form
  useEffect(() => {
    if (editingServer) {
      setNewServerData({
        name: editingServer.name || '',
        description: editingServer.description || '',
        connection_type: editingServer.connection_type || 'local',
        host: editingServer.host || '',
        port: editingServer.port || 2375,
        ssh_user: editingServer.ssh_user || 'root',
        ssh_password: editingServer.ssh_password || '',
        ssh_private_key: editingServer.ssh_private_key || '',
        ssh_port: editingServer.ssh_port || 22
      });
    } else {
      // Reset form when not editing
      setNewServerData({
        name: '',
        description: '',
        connection_type: 'local',
        host: '',
        port: 2375,
        ssh_user: 'root',
        ssh_password: '',
        ssh_private_key: '',
        ssh_port: 22
      });
    }
  }, [editingServer, showServerForm]);

  // Construct dynamic theme styles
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

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const handleCreateServer = async () => {
    try {
      if (editingServer) {
        // Update existing server
        await updateServer(editingServer.id, newServerData);
        showAlert('更新成功', '服务器已成功更新', 'success');
      } else {
        // Create new server
        await createServer(newServerData);
        showAlert('创建成功', '服务器已成功添加', 'success');
      }
      setShowServerForm(false);
      setEditingServer(null);
      setNewServerData({
        name: '',
        description: '',
        connection_type: 'local',
        host: '',
        port: 2375,
        ssh_user: 'root',
        ssh_password: '',
        ssh_private_key: '',
        ssh_port: 22
      });
    } catch (error: any) {
      showAlert(editingServer ? '更新失败' : '创建失败', error.message, 'error');
    }
  };

  const handleDeleteServer = async (serverId: string) => {
    showConfirm('确认删除', '确定要删除此服务器吗？此操作无法撤销。', async () => {
      try {
        await deleteServer(serverId);
        if (selectedServer?.id === serverId) {
          setSelectedServer(null);
        }
        showAlert('删除成功', '服务器已删除', 'success');
      } catch (error: any) {
        showAlert('删除失败', error.message, 'error');
      } finally {
        hideConfirm();
      }
    });
  };

  const handleContainerAction = async (action: 'start' | 'stop' | 'restart' | 'delete', containerId: string) => {
    const executeAction = async () => {
      hideConfirm(); // Close dialog immediately
      try {
        if (action === 'start') await startContainer(containerId);
        else if (action === 'stop') await stopContainer(containerId);
        else if (action === 'restart') await restartContainer(containerId);
        else if (action === 'delete') await removeContainer(containerId);
      } catch (error) {
        console.error(`Failed to ${action} container:`, error);
        showAlert('操作失败', error instanceof Error ? error.message : '未知错误', 'error');
      }
    };

    if (action === 'delete') {
      showConfirm('确认删除', '确定要删除此容器吗？此操作无法撤销。', executeAction);
    } else if (action === 'stop') {
      showConfirm('确认停止', '确定要停止此容器吗？', executeAction, 'primary');
    } else {
      executeAction();
    }
  };

  const handleCreateContainer = async (data: any) => {
    try {
      await createContainer(data);
      setShowContainerModal(false);
      showAlert('创建成功', '容器已成功创建', 'success');
    } catch (error: any) {
      showAlert('创建失败', error.message, 'error');
    }
  };

  const openLogViewer = (containerId: string, containerName: string) => {
    setSelectedContainerId(containerId);
    setSelectedContainerName(containerName);
    setShowLogModal(true);
  };

  const openShell = (containerId: string, containerName: string) => {
    setSelectedContainerId(containerId);
    setSelectedContainerName(containerName);
    setShowShellModal(true);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('zh-CN');
  };

  // Hero Background Style Logic
  const hasBgImage = config.backgroundImage && config.backgroundImage.trim().length > 5;
  const heroBgStyle = hasBgImage ? {
    backgroundImage: `url(${config.backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  } : {};

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
        <DockerSidebar
          activeView={activeView}
          onViewChange={(view) => {
            setActiveView(view);
            if (view === 'overview') {
              setSelectedServer(null);
            } else if (!selectedServer && servers.length > 0 && view !== 'servers') {
              setSelectedServer(servers.find(s => s.is_default === 1) || servers[0]);
            }
            setMobileOpen(false);
          }}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          collapsed={collapsed}
          toggleCollapsed={() => setCollapsed(!collapsed)}
        />

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-gray-50/50 w-full relative" id="main-content">
          <div className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">

            {/* Global Dashboard */}
            {activeView === 'overview' && (
              <GlobalDashboard
                servers={servers}
                onSelectServer={(server) => {
                  setSelectedServer(server);
                  setActiveView('dashboard');
                }}
                onEditServer={(server) => {
                  setEditingServer(server);
                  setShowServerForm(true);
                }}
                onDeleteServer={(serverId) => {
                  const server = servers.find(s => s.id === serverId);
                  if (server) {
                    showConfirm('确认删除', `确定要删除服务器 "${server.name}" 吗？`, async () => {
                      try {
                        await deleteServer(serverId);
                        hideConfirm();
                        showAlert('删除成功', '服务器已成功删除', 'success');
                      } catch (error: any) {
                        hideConfirm();
                        showAlert('删除失败', error.message, 'error');
                      }
                    });
                  }
                }}
                onSetDefault={async (serverId) => {
                  try {
                    await setDefault(serverId);
                    showAlert('设置成功', '默认服务器已更新', 'success');
                  } catch (error: any) {
                    showAlert('设置失败', error.message, 'error');
                  }
                }}
                onAddServer={() => setShowServerForm(true)}
              />
            )}

            {/* Loading State (Initial only) */}
            {serversLoading && servers.length === 0 && (
              <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-[var(--theme-primary)] border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {/* Error State */}
            {serversError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center m-8">
                <Icon icon="fa-solid fa-triangle-exclamation" className="text-4xl text-red-500 mb-4" />
                <h3 className="text-lg font-bold text-red-700 mb-2">无法加载服务器列表</h3>
                <p className="text-red-600">{serversError}</p>
                <button onClick={() => loadServers()} className="mt-4 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition">
                  重试
                </button>
              </div>
            )}

            {/* Empty State */}
            {!serversLoading && servers.length === 0 && activeView !== 'overview' && activeView !== 'servers' && (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <Icon icon="fa-solid fa-server" className="text-6xl text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">请先添加Docker服务器</p>
                <button
                  onClick={() => setShowServerForm(true)}
                  className="mt-4 px-6 py-2 bg-[var(--theme-primary)] text-white rounded-lg hover:brightness-110 transition"
                >
                  添加服务器
                </button>
              </div>
            )}

            {/* Server Views */}
            {selectedServer && (
              <>
                {/* Dashboard View */}
                {activeView === 'dashboard' && (
                  <ServerDashboardView
                    info={info}
                    loading={infoLoading}
                    serverId={selectedServer.id}
                    serverName={selectedServer.name}
                    tabs={
                      <ServerTabs
                        servers={servers}
                        selectedServerId={selectedServer.id}
                        onSelect={setSelectedServer}
                        onAddServer={() => setShowServerForm(true)}
                      />
                    }
                  />
                )}

                {/* Containers View */}
                {activeView === 'containers' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-4 overflow-hidden">
                        <h2 className="text-xl font-bold text-gray-800 whitespace-nowrap">容器列表</h2>
                        <ServerTabs
                          servers={servers}
                          selectedServerId={selectedServer.id}
                          onSelect={setSelectedServer}
                          onAddServer={() => setShowServerForm(true)}
                        />
                      </div>

                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => {
                            setContainerModalMode('create');
                            setSelectedImageForRun('');
                            setShowContainerModal(true);
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 bg-[var(--theme-primary)] text-white rounded-lg text-sm hover:brightness-110 transition flex-shrink-0"
                        >
                          <Icon icon="fa-solid fa-plus" />
                          <span>创建容器</span>
                        </button>
                        <button
                          onClick={() => loadContainers()}
                          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:text-[var(--theme-primary)] hover:border-[var(--theme-primary)] transition flex-shrink-0"
                        >
                          <Icon icon="fa-solid fa-refresh" />
                          <span>刷新</span>
                        </button>
                      </div>
                    </div>
                    {containersLoading ? (
                      <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-4 border-[var(--theme-primary)] border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : containersError ? (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
                        <Icon icon="fa-solid fa-triangle-exclamation" className="text-4xl text-red-500 mb-4" />
                        <h3 className="text-lg font-bold text-red-700 mb-2">无法加载容器列表</h3>
                        <p className="text-red-600">{containersError}</p>
                      </div>
                    ) : (
                      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-medium">
                              <tr>
                                <th className="px-6 py-3">容器名称 / ID</th>
                                <th className="px-6 py-3">状态</th>
                                <th className="px-6 py-3">镜像</th>
                                <th className="px-6 py-3">网络 / 端口</th>
                                <th className="px-6 py-3">挂载</th>
                                <th className="px-6 py-3">创建时间</th>
                                <th className="px-6 py-3 text-right">操作</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {containers.length === 0 ? (
                                <tr>
                                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                    暂无容器
                                  </td>
                                </tr>
                              ) : containers.map(container => (
                                <tr key={container.id} className="hover:bg-gray-50/50 transition-colors group">
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${container.state === 'running' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-gray-300'}`}></div>
                                      <div>
                                        <div className="font-bold text-gray-800">{container.name}</div>
                                        <div className="text-xs text-gray-400 font-mono mt-0.5 bg-gray-100 px-1.5 py-0.5 rounded w-fit">{container.id ? container.id.substring(0, 12) : '-'}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${container.state === 'running'
                                      ? 'bg-green-50 text-green-700 border-green-100'
                                      : 'bg-gray-100 text-gray-600 border-gray-200'
                                      }`}>
                                      {container.status}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-600 max-w-[150px] xl:max-w-[200px]">
                                      <Icon icon="fa-solid fa-layer-group" className="text-gray-400 text-xs" />
                                      <span className="truncate" title={container.image}>{container.image}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-xs text-gray-500">
                                    <div className="flex flex-col gap-1">
                                      {container.networks && container.networks.length > 0 && (
                                        <div className="flex items-center gap-1 text-blue-600">
                                          <Icon icon="fa-solid fa-network-wired" />
                                          <span>{container.networks.join(', ')}</span>
                                        </div>
                                      )}
                                      {container.ports && container.ports.length > 0 ? (
                                        <div className="flex flex-col gap-0.5">
                                          {container.ports.filter(p => p.PublicPort).slice(0, 2).map((p, i) => (
                                            <span key={i} className="font-mono bg-gray-50 px-1 rounded border border-gray-100 w-fit">
                                              {p.PublicPort}:{p.PrivatePort}
                                            </span>
                                          ))}
                                          {container.ports.filter(p => p.PublicPort).length > 2 && (
                                            <span className="text-gray-400">+{container.ports.filter(p => p.PublicPort).length - 2} more</span>
                                          )}
                                        </div>
                                      ) : <span className="text-gray-300">-</span>}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-xs text-gray-500">
                                    {container.mounts && container.mounts.length > 0 ? (
                                      <div className="flex flex-col gap-0.5 max-w-[150px]">
                                        {container.mounts.slice(0, 2).map((m, i) => (
                                          <div key={i} className="truncate" title={`${m.Source} -> ${m.Destination}`}>
                                            <span className="font-mono text-gray-400">{m.Destination}</span>
                                          </div>
                                        ))}
                                        {container.mounts.length > 2 && (
                                          <span className="text-gray-400">+{container.mounts.length - 2} more</span>
                                        )}
                                      </div>
                                    ) : <span className="text-gray-300">-</span>}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-600">
                                    {formatDate(container.created)}
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      {container.state === 'running' ? (
                                        <>
                                          <button onClick={() => handleContainerAction('restart', container.id)} className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition" title="重启">
                                            <Icon icon="fa-solid fa-rotate-right" />
                                          </button>
                                          <button onClick={() => handleContainerAction('stop', container.id)} className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition" title="停止">
                                            <Icon icon="fa-solid fa-stop" />
                                          </button>
                                          <button onClick={() => openShell(container.id, container.name)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition" title="Shell">
                                            <Icon icon="fa-solid fa-terminal" />
                                          </button>
                                          <button onClick={() => openLogViewer(container.id, container.name)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="日志">
                                            <Icon icon="fa-solid fa-file-lines" />
                                          </button>
                                        </>
                                      ) : (
                                        <button onClick={() => handleContainerAction('start', container.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition" title="启动">
                                          <Icon icon="fa-solid fa-play" />
                                        </button>
                                      )}
                                      <button onClick={() => handleContainerAction('delete', container.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="删除">
                                        <Icon icon="fa-solid fa-trash" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Images View */}
                {activeView === 'images' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-4 overflow-hidden">
                        <h2 className="text-xl font-bold text-gray-800 whitespace-nowrap">镜像列表</h2>
                        <ServerTabs
                          servers={servers}
                          selectedServerId={selectedServer.id}
                          onSelect={setSelectedServer}
                          onAddServer={() => setShowServerForm(true)}
                        />
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => {
                            showPrompt(
                              '下载镜像',
                              '请输入要下载的镜像名称 (例如: nginx:latest)',
                              async (value) => {
                                if (!value.trim()) return;
                                try {
                                  await pullImage(value.trim());
                                  showAlert('下载成功', `镜像 ${value} 已成功下载`, 'success');
                                } catch (e: any) {
                                  showAlert('下载失败', e.message, 'error');
                                } finally {
                                  hidePrompt();
                                }
                              },
                              '',
                              'image:tag'
                            );
                          }}
                          className="px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 text-sm transition flex items-center gap-2"
                        >
                          <Icon icon="fa-solid fa-cloud-arrow-down" />
                          <span>下载镜像</span>
                        </button>
                        <button onClick={() => pruneImages()} className="px-4 py-2 bg-orange-50 text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-100 text-sm transition">清理未使用</button>
                        <button onClick={() => loadImages()} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:text-[var(--theme-primary)] hover:border-[var(--theme-primary)] transition">
                          <Icon icon="fa-solid fa-refresh" />
                          <span>刷新</span>
                        </button>
                      </div>
                    </div>
                    {imagesLoading ? (
                      <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-4 border-[var(--theme-primary)] border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : imagesError ? (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
                        <Icon icon="fa-solid fa-triangle-exclamation" className="text-4xl text-red-500 mb-4" />
                        <h3 className="text-lg font-bold text-red-700 mb-2">无法加载镜像列表</h3>
                        <p className="text-red-600">{imagesError}</p>
                      </div>
                    ) : (
                      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-medium">
                            <tr>
                              <th className="px-6 py-3">镜像名称 / Tag</th>
                              <th className="px-6 py-3">镜像 ID</th>
                              <th className="px-6 py-3">大小</th>
                              <th className="px-6 py-3">创建时间</th>
                              <th className="px-6 py-3 text-right">操作</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {images.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                  暂无镜像
                                </td>
                              </tr>
                            ) : images.map(image => (
                              <tr key={image.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                  <div className="flex flex-col">
                                    <span className="font-bold text-gray-800">{image.tags[0]?.split(':')[0] || '<none>'}</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {image.tags.map(tag => (
                                        <span key={tag} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">
                                          {tag.split(':')[1] || 'latest'}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded w-fit">
                                    {image.id.substring(7, 19)}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                                  {formatBytes(image.size)}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                  {formatDate(image.created)}
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => {
                                        const repoTag = image.tags[0];
                                        if (repoTag && repoTag !== '<none>:<none>') {
                                          showConfirm('确认更新', `确定要拉取最新版本的 ${repoTag} 吗？`, async () => {
                                            try {
                                              await pullImage(repoTag);
                                              showAlert('更新成功', '镜像已更新到最新版本', 'success');
                                            } catch (e: any) {
                                              showAlert('更新失败', e.message, 'error');
                                            } finally {
                                              hideConfirm();
                                            }
                                          }, 'primary');
                                        } else {
                                          showAlert('无法更新', '该镜像没有有效的标签', 'error');
                                        }
                                      }}
                                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                      title="更新 (Pull)"
                                    >
                                      <Icon icon="fa-solid fa-cloud-arrow-down" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setContainerModalMode('run');
                                        setSelectedImageForRun(image.tags[0] !== '<none>:<none>' ? image.tags[0] : image.id);
                                        setShowContainerModal(true);
                                      }}
                                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                      title="运行"
                                    >
                                      <Icon icon="fa-solid fa-play" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        showConfirm('确认删除', '确定要删除此镜像吗？', async () => {
                                          await removeImage(image.id, true);
                                          hideConfirm();
                                        });
                                      }}
                                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                      title="删除"
                                    >
                                      <Icon icon="fa-solid fa-trash" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Networks View */}
                {activeView === 'networks' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-4 overflow-hidden">
                        <h2 className="text-xl font-bold text-gray-800 whitespace-nowrap">网络列表</h2>
                        <ServerTabs
                          servers={servers}
                          selectedServerId={selectedServer.id}
                          onSelect={setSelectedServer}
                          onAddServer={() => setShowServerForm(true)}
                        />
                      </div>
                      <button onClick={() => loadNetworks()} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:text-[var(--theme-primary)] hover:border-[var(--theme-primary)] transition">
                        <Icon icon="fa-solid fa-refresh" />
                        <span>刷新</span>
                      </button>
                    </div>
                    {networksLoading ? (
                      <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-4 border-[var(--theme-primary)] border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : networksError ? (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
                        <Icon icon="fa-solid fa-triangle-exclamation" className="text-4xl text-red-500 mb-4" />
                        <h3 className="text-lg font-bold text-red-700 mb-2">无法加载网络列表</h3>
                        <p className="text-red-600">{networksError}</p>
                      </div>
                    ) : (
                      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-medium">
                            <tr>
                              <th className="px-6 py-3">名称 / ID</th>
                              <th className="px-6 py-3">驱动</th>
                              <th className="px-6 py-3">范围</th>
                              <th className="px-6 py-3">内部</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {networks.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                  暂无网络
                                </td>
                              </tr>
                            ) : networks.map(network => (
                              <tr key={network.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="font-bold text-gray-800">{network.name}</div>
                                  <div className="text-xs text-gray-400 font-mono mt-0.5">{network.id ? network.id.substring(0, 12) : '-'}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">{network.driver}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{network.scope}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                  {network.internal ? (
                                    <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded text-xs">Yes</span>
                                  ) : (
                                    <span className="text-gray-400 bg-gray-50 px-2 py-0.5 rounded text-xs">No</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Volumes View */}
                {activeView === 'volumes' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-4 overflow-hidden">
                        <h2 className="text-xl font-bold text-gray-800 whitespace-nowrap">卷列表</h2>
                        <ServerTabs
                          servers={servers}
                          selectedServerId={selectedServer.id}
                          onSelect={setSelectedServer}
                          onAddServer={() => setShowServerForm(true)}
                        />
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => pruneVolumes()} className="px-4 py-2 bg-orange-50 text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-100 text-sm transition">清理未使用</button>
                        <button onClick={() => loadVolumes()} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:text-[var(--theme-primary)] hover:border-[var(--theme-primary)] transition">
                          <Icon icon="fa-solid fa-refresh" />
                          <span>刷新</span>
                        </button>
                      </div>
                    </div>
                    {volumesLoading ? (
                      <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-4 border-[var(--theme-primary)] border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : volumesError ? (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
                        <Icon icon="fa-solid fa-triangle-exclamation" className="text-4xl text-red-500 mb-4" />
                        <h3 className="text-lg font-bold text-red-700 mb-2">无法加载卷列表</h3>
                        <p className="text-red-600">{volumesError}</p>
                      </div>
                    ) : (
                      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-medium">
                            <tr>
                              <th className="px-6 py-3">卷名称</th>
                              <th className="px-6 py-3">驱动</th>
                              <th className="px-6 py-3 text-right">操作</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {volumes.length === 0 ? (
                              <tr>
                                <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                                  暂无卷
                                </td>
                              </tr>
                            ) : volumes.map(volume => (
                              <tr key={volume.name} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="font-bold text-gray-800">{volume.name}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">{volume.driver}</td>
                                <td className="px-6 py-4 text-right">
                                  <button
                                    onClick={() => {
                                      showConfirm('确认删除', '确定要删除此卷吗？', async () => {
                                        await removeVolume(volume.name, true);
                                        hideConfirm();
                                      });
                                    }}
                                    className="px-3 py-1.5 text-sm bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition self-start md:self-center"
                                  >
                                    删除
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Servers List View */}
            {activeView === 'servers' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold text-gray-800">服务器列表</h2>
                  <button
                    onClick={() => setShowServerForm(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[var(--theme-primary)] text-white rounded-lg text-sm hover:brightness-110 transition shadow-lg shadow-red-100"
                  >
                    <Icon icon="fa-solid fa-plus" />
                    <span>添加服务器</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {servers.map(server => (
                    <div key={server.id} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`w-3 h-3 rounded-full ${server.status === 'online' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-red-500'}`}></span>
                            <span className="font-bold text-lg text-gray-800">{server.name}</span>
                            {server.is_default === 1 && <span className="text-xs bg-[var(--theme-primary)] text-white px-2 py-0.5 rounded">默认</span>}
                          </div>
                          <div className="text-sm text-gray-600 flex items-center gap-4">
                            <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-500 text-xs">{server.connection_type}</span>
                            <span>{server.connection_type === 'local' ? '本地环境' : `${server.host}:${server.port}`}</span>
                            <span className="text-gray-400">|</span>
                            <span>延迟: {server.latency}ms</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              try {
                                console.log('Testing connection for server:', server.id);
                                const result = await testConnection(server.id);
                                console.log('Test connection result in App:', result);

                                if (result.success) {
                                  showAlert('连接成功', `延迟: ${result.latency}ms`, 'success');
                                } else {
                                  console.error('Test connection failed with result:', result);
                                  showAlert('连接失败', result.error || '未知错误', 'error');
                                }
                              } catch (error: any) {
                                console.error('Connection test failed with error:', error);
                                showAlert('连接失败', error.message || '未知错误', 'error');
                              }
                            }}
                            className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition"
                          >
                            测试
                          </button>
                          {server.is_default !== 1 && (
                            <button
                              onClick={async () => {
                                try {
                                  await setDefault(server.id);
                                  showAlert('设置成功', '默认服务器已更新', 'success');
                                } catch (error: any) {
                                  showAlert('设置失败', error.message, 'error');
                                }
                              }}
                              className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition flex items-center gap-1"
                              title="设为默认"
                            >
                              <Icon icon="fa-solid fa-star" className="text-xs" />
                              <span>设为默认</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditingServer(server);
                              setShowServerForm(true);
                            }}
                            className="px-3 py-1.5 text-sm bg-gray-50 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition flex items-center gap-1"
                            title="编辑"
                          >
                            <Icon icon="fa-solid fa-pen" className="text-xs" />
                            <span>编辑</span>
                          </button>
                          <button
                            onClick={() => {
                              showConfirm('确认删除', `确定要删除服务器 "${server.name}" 吗？`, async () => {
                                try {
                                  await deleteServer(server.id);
                                  hideConfirm();
                                  showAlert('删除成功', '服务器已成功删除', 'success');
                                } catch (error: any) {
                                  hideConfirm();
                                  showAlert('删除失败', error.message, 'error');
                                }
                              });
                            }}
                            className="px-3 py-1.5 text-sm bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition flex items-center gap-1"
                            title="删除"
                          >
                            <Icon icon="fa-solid fa-trash" className="text-xs" />
                            <span>删除</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* 添加服务器对话框 */}
      {
        showServerForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl animate-fade-in-up">
              <h3 className="text-xl font-bold mb-4 text-gray-800">{editingServer ? '编辑服务器' : '添加Docker服务器'}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">服务器名称</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent outline-none transition"
                    value={newServerData.name}
                    onChange={(e) => setNewServerData({ ...newServerData, name: e.target.value })}
                    placeholder="例如：生产环境服务器"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">连接类型</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent outline-none transition"
                    value={newServerData.connection_type}
                    onChange={(e) => setNewServerData({ ...newServerData, connection_type: e.target.value as any })}
                  >
                    <option value="local">本地Docker (Socket)</option>
                    <option value="tcp">远程Docker (TCP)</option>
                    <option value="ssh">远程Docker (SSH隧道)</option>
                  </select>
                </div>
                {newServerData.connection_type !== 'local' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">主机地址</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent outline-none transition"
                        placeholder={newServerData.connection_type === 'ssh' ? '43.247.132.232' : '192.168.1.100'}
                        value={newServerData.host}
                        onChange={(e) => setNewServerData({ ...newServerData, host: e.target.value })}
                      />
                    </div>

                    {newServerData.connection_type === 'ssh' ? (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">SSH用户名</label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent outline-none transition"
                              placeholder="root"
                              value={newServerData.ssh_user}
                              onChange={(e) => setNewServerData({ ...newServerData, ssh_user: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">SSH端口</label>
                            <input
                              type="number"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent outline-none transition"
                              value={newServerData.ssh_port}
                              onChange={(e) => setNewServerData({ ...newServerData, ssh_port: parseInt(e.target.value) })}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">SSH密码</label>
                          <input
                            type="password"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent outline-none transition"
                            placeholder="留空使用SSH私钥认证"
                            value={newServerData.ssh_password}
                            onChange={(e) => setNewServerData({ ...newServerData, ssh_password: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">SSH私钥（可选）</label>
                          <textarea
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent outline-none transition font-mono text-xs"
                            placeholder="粘贴SSH私钥内容（例如：-----BEGIN OPENSSH PRIVATE KEY-----）"
                            rows={6}
                            value={newServerData.ssh_private_key}
                            onChange={(e) => setNewServerData({ ...newServerData, ssh_private_key: e.target.value })}
                          />
                        </div>
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <Icon icon="fa-solid fa-info-circle" className="text-blue-500 mt-0.5" />
                            <div className="text-xs text-blue-700">
                              <p className="font-semibold mb-1">SSH认证方式（优先级）：</p>
                              <ul className="list-disc list-inside space-y-1 opacity-80">
                                <li>1. SSH私钥（如果提供）</li>
                                <li>2. SSH密码（如果提供）</li>
                                <li>3. 系统SSH Agent（作为后备）</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">端口</label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent outline-none transition"
                          value={newServerData.port}
                          onChange={(e) => setNewServerData({ ...newServerData, port: parseInt(e.target.value) })}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreateServer}
                  className="flex-1 px-4 py-2 bg-[var(--theme-primary)] text-white rounded-lg hover:brightness-110 transition shadow-lg shadow-red-100"
                >
                  {editingServer ? '更新' : '添加'}
                </button>
                <button
                  onClick={() => {
                    setShowServerForm(false);
                    setEditingServer(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )
      }
      {/* Confirm Dialog */}
      {
        confirmDialog && confirmDialog.isOpen && (
          <ConfirmDialog
            isOpen={confirmDialog.isOpen}
            title={confirmDialog.title}
            message={confirmDialog.message}
            onConfirm={confirmDialog.onConfirm}
            onCancel={hideConfirm}
            confirmVariant={confirmDialog.variant}
          />
        )
      }
      {/* Alert Dialog */}
      {alertDialog && alertDialog.isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={hideAlert} />
          <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${alertDialog.variant === 'error' ? 'bg-red-100 text-red-600' :
                alertDialog.variant === 'success' ? 'bg-green-100 text-green-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                <Icon icon={
                  alertDialog.variant === 'error' ? 'fa-solid fa-circle-xmark' :
                    alertDialog.variant === 'success' ? 'fa-solid fa-circle-check' :
                      'fa-solid fa-circle-info'
                } className="text-xl" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">{alertDialog.title}</h3>
            </div>
            <p className="text-gray-600 mb-6 pl-13">{alertDialog.message}</p>
            <div className="flex justify-end">
              <button
                onClick={hideAlert}
                className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Prompt Dialog */}
      {promptDialog && promptDialog.isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={hidePrompt} />
          <div className="relative bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                <Icon icon="fa-solid fa-pen-to-square" className="text-xl" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">{promptDialog.title}</h3>
            </div>
            <p className="text-gray-600 mb-4 pl-13">{promptDialog.message}</p>
            <div className="pl-13 mb-6">
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder={promptDialog.placeholder}
                defaultValue={promptDialog.defaultValue}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    promptDialog.onConfirm((e.target as HTMLInputElement).value);
                  }
                }}
                id="prompt-input"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={hidePrompt}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                取消
              </button>
              <button
                onClick={() => {
                  const input = document.getElementById('prompt-input') as HTMLInputElement;
                  if (input) promptDialog.onConfirm(input.value);
                }}
                className="px-5 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feature Modals */}
      {selectedServer && (
        <>
          <ContainerFormModal
            isOpen={showContainerModal}
            onClose={() => setShowContainerModal(false)}
            onSubmit={handleCreateContainer}
            images={images}
            networks={networks}
            initialImage={selectedImageForRun}
          />
          <LogViewerModal
            isOpen={showLogModal}
            onClose={() => setShowLogModal(false)}
            containerId={selectedContainerId}
            containerName={selectedContainerName}
            fetchLogs={async (id, tail) => {
              const res = await getContainerLogs(id, tail);
              return res.logs;
            }}
          />
          <ShellModal
            isOpen={showShellModal}
            onClose={() => setShowShellModal(false)}
            containerId={selectedContainerId}
            containerName={selectedContainerName}
          />
        </>
      )}
    </div>
  );
}

export default function DockerAppWithProvider() {
  return <DockerApp />;
}
