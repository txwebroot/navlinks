import React, { useState, useEffect } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { SiteConfig } from '@/src/shared/types';
import { Icon } from '@/src/shared/components/common/Icon';
import { useConfig } from '@/src/shared/context/ConfigContext';
import { Button } from './ui/AdminButton';
import { BasicSettings } from './tabs/BasicSettings';
import { TopNavSettings } from './tabs/TopNavSettings';
import { HeroSettings } from './tabs/HeroSettings';
import { PromoSettings } from './tabs/PromoSettings';
import { CategorySettings } from './tabs/CategorySettings';
import { SidebarSettings } from './tabs/SidebarSettings';
import { DataSettings } from './tabs/DataSettings';
import { LinkHealthSettings } from './tabs/LinkHealthSettings';
import { MediaSettings } from './tabs/MediaSettings';
import { AppManagementSettings } from './tabs/AppManagementSettings';
import { AIConfigSettings } from './tabs/AIConfigSettings';
import { handleDragEnd } from './dragHandler';
import { useDialogs } from '@/src/shared/hooks/useDialogs';
import { ConfirmDialog } from '@/src/shared/components/common/ConfirmDialog';

interface AdminPanelProps {
    onClose: () => void;
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
    const { config, setConfig } = useConfig();
    const { confirmDialog, showConfirm, hideConfirm } = useDialogs();
    const [activeTab, setActiveTab] = useState<'basic' | 'categories' | 'sidebar' | 'hero' | 'promo' | 'data' | 'health' | 'topnav' | 'media' | 'apps' | 'ai'>('basic');

    // Helper to update config deeply
    const update = (fn: (c: SiteConfig) => SiteConfig) => {
        setConfig(prev => fn(prev));
    };

    // Ensure Promo Tabs have IDs
    useEffect(() => {
        if (config.promo.some(t => !t.id)) {
            update(c => ({
                ...c,
                promo: c.promo.map(t => t.id ? t : { ...t, id: Date.now().toString() + Math.random().toString(36).substr(2, 9) })
            }));
        }
    }, [config.promo, update]);

    const onDragEnd = (result: DropResult) => {
        handleDragEnd(result, config, update);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[100] flex justify-center items-center backdrop-blur-sm animate-fade-in p-0 md:p-4">
            <div className="bg-white w-full max-w-7xl h-screen md:h-[90vh] md:rounded-2xl shadow-2xl flex flex-col overflow-hidden">

                {/* Header */}
                <div className="h-14 md:h-16 border-b border-gray-100 flex items-center justify-between px-4 md:px-6 bg-white shrink-0 z-10 pt-safe">
                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-8 h-8 md:w-9 md:h-9 bg-[var(--theme-primary)] text-white rounded-lg flex items-center justify-center shadow-lg shadow-red-100">
                            <Icon icon="fa-solid fa-gear" className="text-base md:text-lg" />
                        </div>
                        <div>
                            <h2 className="text-base md:text-lg font-bold text-gray-800">Navlink 配置管理</h2>
                            <p className="text-xs text-gray-400 hidden md:block">实时预览生效</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
                            <Icon icon="fa-solid fa-times" className="text-lg md:text-xl" />
                        </button>
                    </div>
                </div>

                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex flex-1 overflow-hidden">
                        {/* Sidebar Tabs - 桌面端显示 */}
                        <div className="hidden md:flex w-64 bg-gray-50 border-r border-gray-100 flex-col shrink-0 overflow-y-auto p-4">
                            <div className="flex-1">
                                {[
                                    { id: 'basic', icon: 'fa-solid fa-palette', label: '全局外观' },
                                    { id: 'topnav', icon: 'fa-solid fa-compass', label: '顶部导航' },
                                    { id: 'hero', icon: 'fa-solid fa-search', label: '首屏搜索' },
                                    { id: 'promo', icon: 'fa-solid fa-fire', label: '热门/推广' },
                                    { id: 'categories', icon: 'fa-solid fa-layer-group', label: '内容分类' },
                                    { id: 'sidebar', icon: 'fa-solid fa-id-card', label: '侧边栏设置' },
                                    { id: 'apps', icon: 'fa-solid fa-th-large', label: '应用管理' },
                                    { id: 'ai', icon: 'fa-solid fa-robot', label: 'AI 配置' },
                                    { id: 'health', icon: 'fa-solid fa-heartbeat', label: '链接健康' },
                                    { id: 'media', icon: 'fa-solid fa-images', label: '资源管理' },
                                    { id: 'data', icon: 'fa-solid fa-database', label: '数据管理' },
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`
                                w-full flex items-center gap-3 px-4 py-3.5 mb-1 rounded-xl transition-all font-medium text-[15px]
                                ${activeTab === tab.id
                                                ? 'bg-[var(--theme-primary)] text-white shadow-md shadow-red-100'
                                                : 'text-gray-600 hover:bg-white hover:text-[var(--theme-primary)]'
                                            }
                            `}
                                    >
                                        <Icon icon={tab.icon} className={activeTab === tab.id ? 'text-white' : 'text-gray-400'} />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* 重置默认按钮移到底部 */}
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => {
                                        showConfirm('确认重置', '确定重置为默认配置吗？所有修改将丢失。', () => {
                                            hideConfirm();
                                            localStorage.removeItem('nav_site_config');
                                            window.location.reload();
                                        });
                                    }}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm"
                                >
                                    <Icon icon="fa-solid fa-rotate-left" />
                                    重置默认
                                </button>
                            </div>
                        </div>

                        {/* Main Content Area */}
                        <div className="flex-1 overflow-hidden flex flex-col">
                            {/* 移动端顶部标签切换 */}
                            <div className="md:hidden border-b border-gray-200 bg-white sticky top-0 z-10">
                                <div className="flex overflow-x-auto custom-scrollbar">
                                    {[
                                        { id: 'basic', icon: 'fa-solid fa-palette', label: '外观' },
                                        { id: 'topnav', icon: 'fa-solid fa-compass', label: '导航' },
                                        { id: 'hero', icon: 'fa-solid fa-search', label: '搜索' },
                                        { id: 'promo', icon: 'fa-solid fa-fire', label: '推广' },
                                        { id: 'categories', icon: 'fa-solid fa-layer-group', label: '分类' },
                                        { id: 'sidebar', icon: 'fa-solid fa-id-card', label: '侧边栏' },
                                        { id: 'apps', icon: 'fa-solid fa-th-large', label: '应用' },
                                        { id: 'ai', icon: 'fa-solid fa-robot', label: 'AI' },
                                        { id: 'health', icon: 'fa-solid fa-heartbeat', label: '健康' },
                                        { id: 'media', icon: 'fa-solid fa-images', label: '资源' },
                                        { id: 'data', icon: 'fa-solid fa-database', label: '数据' },
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id as any)}
                                            className={`
                                                flex-shrink-0 flex flex-col items-center gap-1 px-4 py-3 transition-all
                                                ${activeTab === tab.id
                                                    ? 'text-[var(--theme-primary)] border-b-2 border-[var(--theme-primary)]'
                                                    : 'text-gray-500'
                                                }
                                            `}
                                        >
                                            <Icon icon={tab.icon} className="text-lg" />
                                            <span className="text-xs font-medium whitespace-nowrap">{tab.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 内容区域 */}
                            <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar bg-white pb-safe">
                                {activeTab === 'basic' && <BasicSettings config={config} update={update} />}
                                {activeTab === 'topnav' && <TopNavSettings config={config} update={update} />}
                                {activeTab === 'hero' && <HeroSettings config={config} update={update} />}
                                {activeTab === 'promo' && <PromoSettings config={config} update={update} />}
                                {activeTab === 'categories' && <CategorySettings config={config} update={update} />}
                                {activeTab === 'sidebar' && <SidebarSettings config={config} update={update} />}
                                {activeTab === 'apps' && <AppManagementSettings />}
                                {activeTab === 'ai' && <AIConfigSettings config={config} update={update} />}
                                {activeTab === 'health' && <LinkHealthSettings config={config} update={update} setConfig={setConfig} />}
                                {activeTab === 'media' && <MediaSettings config={config} update={update} />}
                                {activeTab === 'data' && <DataSettings config={config} update={update} setConfig={setConfig} />}

                                {/* 移动端重置按钮 */}
                                <div className="md:hidden mt-8 pt-4 border-t border-gray-200">
                                    <button
                                        onClick={() => {
                                            showConfirm('确认重置', '确定重置为默认配置吗？所有修改将丢失。', () => {
                                                hideConfirm();
                                                localStorage.removeItem('nav_site_config');
                                                window.location.reload();
                                            });
                                        }}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-medium text-sm"
                                    >
                                        <Icon icon="fa-solid fa-rotate-left" />
                                        重置默认配置
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </DragDropContext >
            </div >

            {/* 确认对话框 */}
            {confirmDialog && (
                <ConfirmDialog
                    isOpen={confirmDialog.isOpen}
                    title={confirmDialog.title}
                    message={confirmDialog.message}
                    onConfirm={confirmDialog.onConfirm}
                    onCancel={hideConfirm}
                />
            )}
        </div >
    );
}