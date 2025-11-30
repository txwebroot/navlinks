import { useState, useEffect } from 'react';

interface AppConfig {
    enabledApps: {
        [key: string]: boolean;
    };
}

export function useAppConfig() {
    const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAppConfig();
    }, []);

    const loadAppConfig = async () => {
        try {
            const response = await fetch('/api/app-management');
            if (response.ok) {
                const config = await response.json();
                setAppConfig(config);
            } else {
                // 如果获取失败，使用默认配置（所有应用启用）
                setAppConfig({
                    enabledApps: {
                        sub: true,
                        blog: true,
                        todo: true
                    }
                });
            }
        } catch (error) {
            console.error('加载应用配置失败:', error);
            // 出错时默认所有应用启用
            setAppConfig({
                enabledApps: {
                    sub: true,
                    blog: true,
                    todo: true
                }
            });
        } finally {
            setLoading(false);
        }
    };

    const isAppEnabled = (appName: string): boolean => {
        if (!appConfig) return true; // 配置未加载时默认启用
        return appConfig.enabledApps[appName] ?? true;
    };

    return {
        appConfig,
        loading,
        isAppEnabled,
        reloadConfig: loadAppConfig
    };
}
