import React from 'react';
import { AdminTabProps } from '../types';
import { Icon } from '@/src/shared/components/common/Icon';
import { Label, Input, TextArea } from '../ui/AdminInput';
import { Button } from '../ui/AdminButton';
import { useDialogs } from '@/src/shared/hooks/useDialogs';
import { AlertDialog } from '@/src/shared/components/common/AlertDialog';

export const BasicSettings: React.FC<AdminTabProps> = ({ config, update }) => {
    const { alertDialog, showAlert, hideAlert } = useDialogs();
    const isImageMode = !!config.backgroundImage && config.backgroundImage.trim() !== '';

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showAlert('文件太大', '图片大小不能超过 5MB', 'warning');
                return;
            }
            const formData = new FormData();
            formData.append('image', file);

            try {
                const token = localStorage.getItem('auth_token');
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
                const data = await response.json();
                if (data.url) {
                    update(c => ({ ...c, backgroundImage: data.url }));
                } else {
                    showAlert('上传失败', data.error || '未知错误', 'error');
                }
            } catch (err) {
                console.error('Upload failed:', err);
                showAlert('上传失败', '请重试', 'error');
            }
            e.target.value = '';
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showAlert('文件太大', '图片大小不能超过 5MB', 'warning');
                return;
            }
            const formData = new FormData();
            formData.append('image', file);

            try {
                const token = localStorage.getItem('auth_token');
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
                const data = await response.json();
                if (data.url) {
                    update(c => ({ ...c, logoUrl: data.url }));
                } else {
                    showAlert('上传失败', data.error || '未知错误', 'error');
                }
            } catch (err) {
                console.error('Upload failed:', err);
                showAlert('上传失败', '请重试', 'error');
            }
            e.target.value = '';
        }
    };

    return (
        <div className="space-y-8">
            {/* 1. Basic Info & Logo */}
            <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">基本信息</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Label>Logo 设置</Label>
                        <div className="space-y-2">
                            <Input value={config.logoUrl} onChange={e => update(c => ({ ...c, logoUrl: e.target.value }))} placeholder="输入图片 URL" />
                            <div className="flex items-center gap-2">
                                <label className="cursor-pointer bg-white border border-gray-300 hover:border-[var(--theme-primary)] hover:text-[var(--theme-primary)] text-gray-600 px-3 py-1.5 rounded text-xs font-medium transition-colors shadow-sm flex items-center gap-1">
                                    <Icon icon="fa-solid fa-cloud-arrow-up" /> 上传 Logo
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoUpload}
                                        className="hidden"
                                    />
                                </label>
                                {config.logoUrl && <span className="text-xs text-green-600 flex items-center gap-1"><Icon icon="fa-solid fa-check" /> 已设置</span>}
                            </div>
                        </div>
                    </div>
                    <div><Label>格言</Label><Input value={config.headerQuote} onChange={e => update(c => ({ ...c, headerQuote: e.target.value }))} /></div>
                    <div className="col-span-2"><Label>版权</Label><Input value={config.footer.copyright} onChange={e => update(c => ({ ...c, footer: { ...c.footer, copyright: e.target.value } }))} /></div>
                </div>
            </div>

            {/* 2. Theme Colors */}
            <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">主题配色</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <Label>主色调 (Primary)</Label>
                        <div className="flex gap-2"><Input type="color" className="w-10 h-10 p-1" value={config.theme?.primaryColor} onChange={e => update(c => ({ ...c, theme: { ...c.theme, primaryColor: e.target.value } }))} /><Input value={config.theme?.primaryColor} onChange={e => update(c => ({ ...c, theme: { ...c.theme, primaryColor: e.target.value } }))} /></div>
                    </div>
                    <div>
                        <Label>页面背景 (Body)</Label>
                        <div className="flex gap-2"><Input type="color" className="w-10 h-10 p-1" value={config.theme?.backgroundColor} onChange={e => update(c => ({ ...c, theme: { ...c.theme, backgroundColor: e.target.value } }))} /><Input value={config.theme?.backgroundColor} onChange={e => update(c => ({ ...c, theme: { ...c.theme, backgroundColor: e.target.value } }))} /></div>
                    </div>
                    <div>
                        <Label>文字颜色 (Text)</Label>
                        <div className="flex gap-2"><Input type="color" className="w-10 h-10 p-1" value={config.theme?.textColor} onChange={e => update(c => ({ ...c, theme: { ...c.theme, textColor: e.target.value } }))} /><Input value={config.theme?.textColor} onChange={e => update(c => ({ ...c, theme: { ...c.theme, textColor: e.target.value } }))} /></div>
                    </div>
                    <div>
                        <Label>分类标题大小 (px)</Label>
                        <Input
                            type="number"
                            min="10"
                            max="40"
                            value={config.theme?.categoryTitleSize || 20}
                            onChange={e => update(c => ({ ...c, theme: { ...c.theme, categoryTitleSize: parseInt(e.target.value) || 20 } }))}
                        />
                    </div>
                    <div>
                        <Label>子分类标签大小 (px)</Label>
                        <Input
                            type="number"
                            min="10"
                            max="40"
                            value={config.theme?.subCategoryTitleSize || 12}
                            onChange={e => update(c => ({ ...c, theme: { ...c.theme, subCategoryTitleSize: parseInt(e.target.value) || 12 } }))}
                        />
                    </div>
                    <div>
                        <Label>热门网址标题大小 (px)</Label>
                        <Input
                            type="number"
                            min="10"
                            max="40"
                            value={config.theme?.promoCategoryTitleSize || 16}
                            onChange={e => update(c => ({ ...c, theme: { ...c.theme, promoCategoryTitleSize: parseInt(e.target.value) || 16 } }))}
                        />
                    </div>
                    <div>
                        <Label>热门网址标签大小 (px)</Label>
                        <Input
                            type="number"
                            min="10"
                            max="40"
                            value={config.theme?.promoSubCategoryTitleSize || 12}
                            onChange={e => update(c => ({ ...c, theme: { ...c.theme, promoSubCategoryTitleSize: parseInt(e.target.value) || 12 } }))}
                        />
                    </div>
                </div>
            </div>

            {/* 3. Hero & Navbar Background */}
            <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                <h3 className="text-lg font-bold text-blue-800 mb-4 border-b border-blue-200 pb-2">首屏与导航栏背景</h3>

                <div className="space-y-5">
                    {/* Background Type Selector */}
                    <div>
                        <Label className="mb-2">背景类型</Label>
                        <div className="flex gap-4 bg-white p-1 rounded-lg border border-blue-100 w-fit">
                            <button
                                onClick={() => update(c => ({ ...c, backgroundImage: '' }))}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${!isImageMode ? 'bg-[var(--theme-primary)] text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                纯色背景
                            </button>
                            <button
                                onClick={() => {
                                    if (!config.backgroundImage) update(c => ({ ...c, backgroundImage: ' ' }));
                                }}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${isImageMode ? 'bg-[var(--theme-primary)] text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                图片背景
                            </button>
                        </div>
                    </div>

                    {!isImageMode ? (
                        // Solid Color Mode
                        <div className="animate-fade-in bg-white p-4 rounded-lg border border-gray-200">
                            <Label>首屏背景颜色</Label>
                            <div className="flex gap-3 items-center">
                                <Input
                                    type="color"
                                    className="w-14 h-10 p-1 cursor-pointer flex-shrink-0"
                                    value={config.hero.backgroundColor || config.theme.navbarBgColor}
                                    onChange={e => update(c => ({ ...c, hero: { ...c.hero, backgroundColor: e.target.value } }))}
                                />
                                <span className="text-sm text-gray-600">{config.hero.backgroundColor || config.theme.navbarBgColor}</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-2">此颜色将用于首屏背景，并自动向下渐变过渡。</p>
                        </div>
                    ) : (
                        // Image Mode
                        <div className="animate-fade-in bg-white p-4 rounded-lg border border-gray-200 space-y-4">
                            <div>
                                <Label>图片 URL (支持网络图片)</Label>
                                <Input
                                    value={config.backgroundImage?.trim() || ''}
                                    onChange={e => update(c => ({ ...c, backgroundImage: e.target.value }))}
                                    placeholder="https://example.com/bg.jpg"
                                />
                            </div>
                            <div>
                                <Label>或 上传本地图片</Label>
                                <div className="flex items-center gap-3 mt-1">
                                    <label className="cursor-pointer bg-gray-50 border border-gray-300 hover:border-[var(--theme-primary)] hover:text-[var(--theme-primary)] text-gray-600 px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm flex items-center gap-2">
                                        <Icon icon="fa-solid fa-cloud-arrow-up" /> 选择图片
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                        />
                                    </label>
                                    <span className="text-xs text-gray-400">支持 JPG, PNG, WEBP (建议 &lt; 1.5MB)</span>
                                </div>
                            </div>
                            {config.backgroundImage && config.backgroundImage.length > 10 && (
                                <div className="mt-2">
                                    <p className="text-xs text-green-600 mb-1"><Icon icon="fa-solid fa-check-circle" /> 图片已设置</p>
                                    <div className="h-24 w-full bg-gray-100 rounded-md overflow-hidden relative">
                                        <img src={config.backgroundImage} alt="Preview" className="w-full h-full object-cover opacity-80" />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Navbar Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Navbar Overlay Setting */}
                        <div className="bg-white p-4 rounded-lg border border-gray-200 flex flex-col justify-between gap-2">
                            <div>
                                <Label className="!mb-0">导航栏叠加</Label>
                                <p className="text-xs text-gray-400">首屏时导航栏是否悬浮在背景上</p>
                            </div>
                            <div className="flex items-center bg-gray-100 rounded-lg p-1 w-fit">
                                <button
                                    onClick={() => update(c => ({ ...c, hero: { ...c.hero, overlayNavbar: true } }))}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${config.hero.overlayNavbar !== false ? 'bg-white text-[var(--theme-primary)] shadow-sm' : 'text-gray-500'}`}
                                >
                                    沉浸式
                                </button>
                                <button
                                    onClick={() => update(c => ({ ...c, hero: { ...c.hero, overlayNavbar: false } }))}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${config.hero.overlayNavbar === false ? 'bg-white text-[var(--theme-primary)] shadow-sm' : 'text-gray-500'}`}
                                >
                                    独立
                                </button>
                            </div>
                        </div>

                        {/* Navbar Background Color Setting */}
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <Label className="!mb-1">导航栏背景 (滚动后)</Label>
                            <div className="flex gap-2 items-center mb-2">
                                <button
                                    onClick={() => update(c => ({ ...c, theme: { ...c.theme, navbarBgColor: 'transparent' } }))}
                                    className={`px-3 py-1 text-xs rounded border transition-colors ${config.theme?.navbarBgColor === 'transparent' ? 'bg-blue-50 border-blue-500 text-blue-600 font-bold' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                                >
                                    透明
                                </button>
                                <button
                                    onClick={() => update(c => ({ ...c, theme: { ...c.theme, navbarBgColor: 'hero' } }))}
                                    className={`px-3 py-1 text-xs rounded border transition-colors ${config.theme?.navbarBgColor === 'hero' ? 'bg-blue-50 border-blue-500 text-blue-600 font-bold' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                                >
                                    同首屏
                                </button>
                                <div className="flex items-center gap-1 flex-1">
                                    <Input
                                        type="color"
                                        className="w-8 h-8 p-0.5 rounded cursor-pointer"
                                        value={(config.theme?.navbarBgColor !== 'hero' && config.theme?.navbarBgColor !== 'transparent') ? config.theme?.navbarBgColor : '#5d33f0'}
                                        onChange={e => update(c => ({ ...c, theme: { ...c.theme, navbarBgColor: e.target.value } }))}
                                    />
                                    <span className="text-xs text-gray-400">自定义</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 提示对话框 */}
            {alertDialog && (
                <AlertDialog
                    isOpen={alertDialog.isOpen}
                    title={alertDialog.title}
                    message={alertDialog.message}
                    variant={alertDialog.variant}
                    onClose={hideAlert}
                />
            )}
        </div>
    );
};
