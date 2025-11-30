import React from 'react';
import { Icon } from '@/src/shared/components/common/Icon';

interface AppDisabledProps {
    appName: string;
}

export function AppDisabled({ appName }: AppDisabledProps) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center max-w-md px-6">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Icon icon="fa-solid fa-ban" className="text-4xl text-gray-400" />
                </div>
                
                <h1 className="text-2xl font-bold text-gray-900 mb-3">
                    {appName} 应用已禁用
                </h1>
                
                <p className="text-gray-600 mb-8">
                    此应用当前处于禁用状态，无法访问。<br />
                    如需使用，请联系管理员启用此应用。
                </p>
                
                <a
                    href="/"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Icon icon="fa-solid fa-home" />
                    返回首页
                </a>
            </div>
        </div>
    );
}
