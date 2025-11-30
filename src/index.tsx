/**
 * 主入口文件 - 多应用路由配置
 * 支持 NavLink 和 Sub 应用切换
 */
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ConfigProvider, useConfig } from '@/src/shared/context/ConfigContext';
import ErrorBoundary from '@/src/shared/components/common/ErrorBoundary';
import { AppDisabled } from '@/src/shared/components/common/AppDisabled';
import { useAppConfig } from '@/src/shared/hooks/useAppConfig';
import '@/src/index.css';

// 懒加载应用
const NavlinkApp = React.lazy(() => import('./apps/navlink/App'));
const SubApp = React.lazy(() => import('./apps/sub/App'));

// 登录对话框组件
const LoginDialog = React.lazy(() => import('./shared/components/common/LoginDialog'));

// 应用配置：哪些应用需要登录
const APP_AUTH_CONFIG: Record<string, boolean> = {
  sub: true,    // Sub 应用需要登录
  blog: false,  // Blog 应用不需要登录（未来使用）
  todo: false   // Todo 应用不需要登录（未来使用）
};

// 应用路由组件
function AppRoutes() {
  const { isAppEnabled, loading: appConfigLoading } = useAppConfig();
  const { isAuthenticated, isLoaded: configLoaded } = useConfig();
  const [showLogin, setShowLogin] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // 检查 Sub 应用是否需要登录
  useEffect(() => {
    // 等待配置加载完成
    if (appConfigLoading || !configLoaded) return;
    
    // 如果在 sub 页面且未登录，弹出登录框并跳转首页
    if (location.pathname === '/sub' && APP_AUTH_CONFIG.sub && !isAuthenticated) {
      setShowLogin(true);
      navigate('/', { replace: true });
    }
  }, [location.pathname, isAuthenticated, appConfigLoading, configLoaded]);

  // 等待配置加载
  if (appConfigLoading || !configLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  // Sub 应用的访问控制
  const getSubAppElement = () => {
    // 1. 检查应用是否启用
    if (!isAppEnabled('sub')) {
      return <AppDisabled appName="订阅管理" />;
    }
    
    // 2. 检查是否需要登录（登录框已经在 useEffect 中处理）
    if (APP_AUTH_CONFIG.sub && !isAuthenticated) {
      // 返回 null，让登录框处理
      return null;
    }
    
    // 3. 允许访问
    return <SubApp />;
  };

  const handleLoginClose = () => {
    setShowLogin(false);
    // 取消登录，保持在首页
  };

  const handleLoginSuccess = () => {
    setShowLogin(false);
    // 登录成功后跳转到 sub 页面
    navigate('/sub');
  };

  return (
    <>
      <Routes>
        <Route path="/" element={<NavlinkApp />} />
        <Route path="/sub" element={getSubAppElement()} />
      </Routes>
      
      {/* 登录对话框 */}
      {showLogin && (
        <React.Suspense fallback={null}>
          <LoginDialog 
            onClose={handleLoginClose} 
            onLogin={handleLoginSuccess} 
          />
        </React.Suspense>
      )}
    </>
  );
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary name="Global" onReset={() => window.location.reload()}>
      <ConfigProvider>
        <BrowserRouter>
          <React.Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">加载中...</p>
              </div>
            </div>
          }>
            <AppRoutes />
          </React.Suspense>
        </BrowserRouter>
      </ConfigProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
