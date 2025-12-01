import { useState, useEffect, useCallback } from 'react';
import type { DockerServer, Container, Image, Network, Volume, SystemInfo } from '../types/docker';

const API_BASE = '/api/docker';

/**
 * Docker服务器管理Hook
 */
export function useDockerServers() {
  const [servers, setServers] = useState<DockerServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadServers = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}/servers`, { headers });
      if (!response.ok) throw new Error('获取服务器列表失败');
      const data = await response.json();
      setServers(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServers();
  }, [loadServers]);

  const createServer = useCallback(async (serverData: any) => {
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/servers`, {
      method: 'POST',
      headers,
      body: JSON.stringify(serverData)
    });
    if (!response.ok) throw new Error('创建服务器失败');
    const result = await response.json();
    await loadServers();
    return result;
  }, [loadServers]);

  const updateServer = useCallback(async (id: string, updates: Partial<DockerServer>) => {
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/servers/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error('更新服务器失败');
    await loadServers();
  }, [loadServers]);

  const deleteServer = useCallback(async (id: string) => {
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/servers/${id}`, { method: 'DELETE', headers });
    if (!response.ok) throw new Error('删除服务器失败');
    await loadServers();
  }, [loadServers]);

  const setDefault = useCallback(async (id: string) => {
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/servers/${id}/set-default`, { method: 'POST', headers });
    if (!response.ok) throw new Error('设置默认服务器失败');
    await loadServers();
  }, [loadServers]);

  const testConnection = useCallback(async (id: string) => {
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE}/servers/${id}/test`, { method: 'POST', headers });
      if (!response.ok) {
        let errorMessage = '测试连接失败';
        try {
          const errorJson = await response.json();
          errorMessage = errorJson.error || errorJson.message || errorMessage;
        } catch (e) {
          errorMessage = await response.text() || errorMessage;
        }
        throw new Error(errorMessage);
      }
      const result = await response.json();

      // Update local state with new status
      // Backend returns 'online' or 'offline', not 'ok'
      setServers(prev => prev.map(s =>
        s.id === id ? { ...s, status: result.status === 'online' ? 'online' : 'offline', latency: result.latency } : s
      ));

      console.log('[useDocker] Test connection result:', result);
      return result;
    } catch (error) {
      // If test fails, mark as offline
      setServers(prev => prev.map(s =>
        s.id === id ? { ...s, status: 'offline' } : s
      ));
      throw error;
    }
  }, []);

  return {
    servers,
    loading,
    error,
    loadServers,
    createServer,
    updateServer,
    deleteServer,
    setDefault,
    testConnection
  };
}

/**
 * Docker容器管理Hook
 */
export function useDockerContainers(serverId: string | null) {
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadContainers = useCallback(async () => {
    if (!serverId) {
      setContainers([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      try {
        const response = await fetch(`${API_BASE}/servers/${serverId}/containers?all=true`, {
          headers,
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error('获取容器列表失败');
        const data = await response.json();
        setContainers(data);
        setError(null);
      } catch (err: any) {
        if (err.name === 'AbortError') {
          throw new Error('请求超时，请检查服务器连接');
        }
        throw err;
      }
    } catch (err: any) {
      setError(err.message);
      setContainers([]); // Clear data on error
    } finally {
      setLoading(false);
    }
  }, [serverId]);

  useEffect(() => {
    loadContainers();
  }, [loadContainers]);

  const startContainer = useCallback(async (containerId: string) => {
    if (!serverId) throw new Error('未选择服务器');
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/servers/${serverId}/containers/${containerId}/start`, {
      method: 'POST',
      headers
    });
    if (!response.ok) throw new Error('启动容器失败');
    await loadContainers();
  }, [serverId, loadContainers]);

  const stopContainer = useCallback(async (containerId: string, timeout = 10) => {
    if (!serverId) throw new Error('未选择服务器');
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/servers/${serverId}/containers/${containerId}/stop`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ timeout })
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`停止容器失败: ${errorText}`);
    }
    await loadContainers();
  }, [serverId, loadContainers]);

  const restartContainer = useCallback(async (containerId: string) => {
    if (!serverId) throw new Error('未选择服务器');
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/servers/${serverId}/containers/${containerId}/restart`, {
      method: 'POST',
      headers
    });
    if (!response.ok) throw new Error('重启容器失败');
    await loadContainers();
  }, [serverId, loadContainers]);

  const removeContainer = useCallback(async (containerId: string, force = false) => {
    if (!serverId) throw new Error('未选择服务器');
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(
      `${API_BASE}/servers/${serverId}/containers/${containerId}?force=${force}`,
      { method: 'DELETE', headers }
    );
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || '删除容器失败');
    }
    await loadContainers();
  }, [serverId, loadContainers]);

  const getContainerLogs = useCallback(async (containerId: string, tail = 100) => {
    if (!serverId) throw new Error('未选择服务器');
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/servers/${serverId}/containers/${containerId}/logs?tail=${tail}`, { headers });
    if (!response.ok) throw new Error('获取日志失败');
    return await response.json();
  }, [serverId]);

  const getContainerStats = useCallback(async (containerId: string) => {
    if (!serverId) throw new Error('未选择服务器');
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/servers/${serverId}/containers/${containerId}/stats`, { headers });
    if (!response.ok) throw new Error('获取统计信息失败');
    return await response.json();
  }, [serverId]);

  const createContainer = useCallback(async (config: any) => {
    if (!serverId) throw new Error('未选择服务器');
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/servers/${serverId}/containers`, {
      method: 'POST',
      headers,
      body: JSON.stringify(config)
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || '创建容器失败');
    }
    await loadContainers();
  }, [serverId, loadContainers]);

  return {
    containers,
    loading,
    error,
    loadContainers,
    startContainer,
    stopContainer,
    restartContainer,
    removeContainer,
    getContainerLogs,
    getContainerStats,
    createContainer
  };
}

/**
 * Docker镜像管理Hook
 */
export function useDockerImages(serverId: string | null) {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadImages = useCallback(async () => {
    if (!serverId) {
      setImages([]);
      return;
    }
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}/servers/${serverId}/images`, { headers });
      if (!response.ok) throw new Error('获取镜像列表失败');
      const data = await response.json();
      setImages(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setImages([]); // Clear data on error
    } finally {
      setLoading(false);
    }
  }, [serverId]);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  const removeImage = useCallback(async (imageId: string, force = false) => {
    if (!serverId) throw new Error('未选择服务器');
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(
      `${API_BASE}/servers/${serverId}/images/${imageId}?force=${force}`,
      { method: 'DELETE', headers }
    );
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || '删除镜像失败');
    }
    await loadImages();
  }, [serverId, loadImages]);

  const pullImage = useCallback(async (imageName: string) => {
    if (!serverId) throw new Error('未选择服务器');
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/servers/${serverId}/images/pull`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ imageName })
    });
    if (!response.ok) throw new Error('拉取镜像失败');
    await loadImages();
    return await response.json();
  }, [serverId, loadImages]);

  const pruneImages = useCallback(async () => {
    if (!serverId) throw new Error('未选择服务器');
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/servers/${serverId}/images/prune`, {
      method: 'POST',
      headers
    });
    if (!response.ok) throw new Error('清理镜像失败');
    const result = await response.json();
    await loadImages();
    return result;
  }, [serverId, loadImages]);

  return {
    images,
    loading,
    error,
    loadImages,
    removeImage,
    pullImage,
    pruneImages
  };
}

/**
 * Docker系统信息Hook
 */
export function useDockerSystemInfo(serverId: string | null) {
  const [info, setInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInfo = useCallback(async () => {
    if (!serverId) {
      setInfo(null);
      return;
    }
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}/servers/${serverId}/info`, { headers });
      if (!response.ok) throw new Error('获取系统信息失败');
      const data = await response.json();
      setInfo(data.summary);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setInfo(null); // Clear info on error
    } finally {
      setLoading(false);
    }
  }, [serverId]);

  useEffect(() => {
    loadInfo();
  }, [loadInfo]);

  return { info, loading, error, loadInfo };
}

/**
 * Docker网络管理Hook
 */
export function useDockerNetworks(serverId: string | null) {
  const [networks, setNetworks] = useState<Network[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNetworks = useCallback(async () => {
    if (!serverId) {
      setNetworks([]);
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}/servers/${serverId}/networks`, { headers });
      if (response.ok) {
        const data = await response.json();
        setNetworks(data);
        setError(null);
      } else {
        throw new Error('获取网络列表失败');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      setNetworks([]);
    } finally {
      setLoading(false);
    }
  }, [serverId]);

  useEffect(() => {
    loadNetworks();
  }, [loadNetworks]);

  return { networks, loading, error, loadNetworks };
}

/**
 * Docker卷管理Hook
 */
export function useDockerVolumes(serverId: string | null) {
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadVolumes = useCallback(async () => {
    if (!serverId) {
      setVolumes([]);
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}/servers/${serverId}/volumes`, { headers });
      if (response.ok) {
        const data = await response.json();
        setVolumes(data);
        setError(null);
      } else {
        throw new Error('获取卷列表失败');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      setVolumes([]);
    } finally {
      setLoading(false);
    }
  }, [serverId]);

  useEffect(() => {
    loadVolumes();
  }, [loadVolumes]);

  const removeVolume = useCallback(async (volumeName: string, force = false) => {
    if (!serverId) throw new Error('未选择服务器');
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(
      `${API_BASE}/servers/${serverId}/volumes/${volumeName}?force=${force}`,
      { method: 'DELETE', headers }
    );
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || '删除卷失败');
    }
    await loadVolumes();
  }, [serverId, loadVolumes]);

  const pruneVolumes = useCallback(async () => {
    if (!serverId) throw new Error('未选择服务器');
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/servers/${serverId}/volumes/prune`, {
      method: 'POST',
      headers
    });
    if (!response.ok) throw new Error('清理卷失败');
    await loadVolumes();
    return await response.json();
  }, [serverId, loadVolumes]);

  return { volumes, loading, error, loadVolumes, removeVolume, pruneVolumes };
}

/**
 * 获取所有服务器的系统信息
 */
export function useAllDockerServersInfo(servers: DockerServer[]) {
  const [allInfo, setAllInfo] = useState<Record<string, SystemInfo | null>>({});
  const [loading, setLoading] = useState(false);

  const loadAllInfo = useCallback(async () => {
    if (servers.length === 0) return;

    setLoading(true);
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const promises = servers.map(async (server) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout per server check

        try {
          const response = await fetch(`${API_BASE}/servers/${server.id}/info`, {
            headers,
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (!response.ok) {
            const errText = await response.text();
            console.error(`Failed to load info for server ${server.id}:`, errText);
            return { id: server.id, info: null };
          }
          const data = await response.json();
          return { id: server.id, info: data.summary };
        } catch (err) {
          clearTimeout(timeoutId);
          return { id: server.id, info: null };
        }
      });

      const results = await Promise.all(promises);
      const newInfo: Record<string, SystemInfo | null> = {};
      results.forEach(res => {
        newInfo[res.id] = res.info;
      });
      setAllInfo(newInfo);
    } catch (err) {
      console.error('Failed to load all servers info', err);
    } finally {
      setLoading(false);
    }
  }, [servers]);

  useEffect(() => {
    loadAllInfo();
  }, [loadAllInfo]);

  return { allInfo, loading, loadAllInfo };
}

/**
 * 获取Docker审计日志Hook
 */
export function useDockerAuditLogs(serverId?: string, limit = 100) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const url = serverId
        ? `${API_BASE}/servers/${serverId}/logs?limit=${limit}`
        : `${API_BASE}/logs?limit=${limit}`;

      const response = await fetch(url, { headers });
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  }, [serverId, limit]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return { logs, loading, loadLogs };
}
