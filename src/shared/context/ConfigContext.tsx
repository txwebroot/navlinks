import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SiteConfig } from '../types';
import { DEFAULT_CONFIG } from '../constants';
import { api, ApiError } from '../utils/api';
import { Toast } from '../components/common/Toast';

interface ConfigContextType {
    config: SiteConfig;
    isLoaded: boolean;
    isAuthenticated: boolean;
    setConfig: (config: SiteConfig | ((prev: SiteConfig) => SiteConfig)) => void; // Local update
    saveConfig: (config: SiteConfig) => Promise<void>; // Server sync
    login: (password: string) => Promise<void>;
    logout: () => void;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [config, setConfigState] = useState<SiteConfig>(DEFAULT_CONFIG);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Initial Load
    useEffect(() => {
        const init = async () => {
            // Check token validity
            const token = localStorage.getItem('auth_token');
            if (token) {
                // Verify token by making a test request
                try {
                    console.log('[ConfigContext] 检测到token，验证有效性...');
                    const response = await fetch('/api/verify', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (response.ok) {
                        console.log('[ConfigContext] Token有效，保持登录状态');
                        setIsAuthenticated(true);
                    } else if (response.status === 401 || response.status === 403) {
                        console.warn('[ConfigContext] Token已失效，自动退出登录');
                        localStorage.removeItem('auth_token');
                        setIsAuthenticated(false);
                        setToast({ message: '登录已过期，请重新登录', type: 'error' });
                    }
                } catch (err) {
                    console.error('[ConfigContext] Token验证失败:', err);
                    localStorage.removeItem('auth_token');
                    setIsAuthenticated(false);
                }
            } else {
                console.log('[ConfigContext] 无token，保持未登录状态');
                setIsAuthenticated(false);
            }

            // Load config
            try {
                const serverData = await api.getConfig();
                if (serverData) {
                    setConfigState((prev) => ({
                        ...DEFAULT_CONFIG,
                        ...serverData,
                        theme: { ...DEFAULT_CONFIG.theme, ...(serverData.theme || {}) },
                        rightSidebar: {
                            ...DEFAULT_CONFIG.rightSidebar,
                            ...(serverData.rightSidebar || {}),
                            profile: { ...DEFAULT_CONFIG.rightSidebar.profile, ...(serverData.rightSidebar?.profile || {}) }
                        },
                        hero: { ...DEFAULT_CONFIG.hero, ...(serverData.hero || {}) },
                        footer: { ...DEFAULT_CONFIG.footer, ...(serverData.footer || {}) },
                    }));
                } else {
                    const local = localStorage.getItem('nav_site_config');
                    if (local) setConfigState(JSON.parse(local));
                }
            } catch (err) {
                console.error('Failed to load config:', err);
                const local = localStorage.getItem('nav_site_config');
                if (local) setConfigState(JSON.parse(local));
                setToast({ message: 'Failed to load config from server', type: 'error' });
            } finally {
                setIsLoaded(true);
            }
        };
        init();
    }, []);

    const login = async (password: string) => {
        try {
            const { token } = await api.login(password);
            localStorage.setItem('auth_token', token);
            setIsAuthenticated(true);
            setToast({ message: 'Login successful', type: 'success' });
        } catch (err) {
            if (err instanceof ApiError) {
                throw new Error(err.message);
            }
            throw err;
        }
    };

    const logout = () => {
        localStorage.removeItem('auth_token');
        setIsAuthenticated(false);
        setToast({ message: 'Logged out', type: 'success' });
    };

    const saveConfig = async (newConfig: SiteConfig) => {
        try {
            await api.saveConfig(newConfig);
            // Update local storage as backup
            localStorage.setItem('nav_site_config', JSON.stringify(newConfig));
        } catch (err) {
            console.error('Save failed:', err);
            if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
                console.warn('[ConfigContext] 认证失败，自动退出登录');
                localStorage.removeItem('auth_token');
                setIsAuthenticated(false);
                setToast({ message: '登录已过期，请重新登录', type: 'error' });
            } else {
                setToast({ message: 'Failed to save changes', type: 'error' });
            }
            throw err;
        }
    };

    const setConfig = (newConfig: SiteConfig | ((prev: SiteConfig) => SiteConfig)) => {
        const finalConfig = typeof newConfig === 'function' ? newConfig(config) : newConfig;
        setConfigState(finalConfig);
        // Optimistic update to local storage
        localStorage.setItem('nav_site_config', JSON.stringify(finalConfig));
    };

    // Auto-save to server
    const suppressSave = React.useRef(true);

    useEffect(() => {
        if (!isLoaded) return;

        // Prevent save on initial load
        if (suppressSave.current) {
            suppressSave.current = false;
            return;
        }

        if (!isAuthenticated) return; // Don't auto-save if not logged in

        const timer = setTimeout(() => {
            saveConfig(config).catch(() => {
                // Error is already handled in saveConfig (toast)
            });
        }, 1000);

        return () => clearTimeout(timer);
    }, [config, isLoaded, isAuthenticated]);

    return (
        <ConfigContext.Provider value={{ config, isLoaded, isAuthenticated, setConfig, saveConfig, login, logout }}>
            {children}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </ConfigContext.Provider>
    );
};

export const useConfig = () => {
    const context = useContext(ConfigContext);
    if (!context) {
        throw new Error('useConfig must be used within a ConfigProvider');
    }
    return context;
};
