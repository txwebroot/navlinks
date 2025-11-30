import React, { useState, useEffect } from 'react';
import { LinkItem, Category } from '@/src/shared/types';
import { Icon } from '@/src/shared/components/common/Icon';
import { Input, Label } from './AdminInput';
import { useDialogs } from '@/src/shared/hooks/useDialogs';
import { AlertDialog } from '@/src/shared/components/common/AlertDialog';

interface LinkItemEditorProps {
    item: LinkItem;
    onChange: (item: LinkItem) => void;
    onDelete: () => void;
    onMove?: (direction: 'up' | 'down') => void;
    onCategoryMove?: (targetCategoryId: string, targetSubCategoryName?: string) => void;
    onCrossSectionMove?: (targetSection: 'category' | 'promo', targetId: string, targetSubId?: string) => void;
    index?: number;
    total?: number;
    categories?: Category[];
    currentCategoryId?: string;
    currentSubCategoryName?: string;
    promoTabs?: { name: string; id: string }[];
    enableCrossSectionMove?: boolean;
    currentSection?: 'category' | 'promo';
}

export const LinkItemEditor: React.FC<LinkItemEditorProps> = ({
    item,
    onChange,
    onDelete,
    onMove,
    onCategoryMove,
    onCrossSectionMove,
    index,
    total,
    categories,
    currentCategoryId,
    currentSubCategoryName,
    promoTabs,
    enableCrossSectionMove = false,
    currentSection = 'category'
}) => {
    const [selectedCategoryId, setSelectedCategoryId] = useState(currentCategoryId || '');
    const [selectedSubCategory, setSelectedSubCategory] = useState(currentSubCategoryName || '');
    const [selectedSection, setSelectedSection] = useState<'category' | 'promo'>(currentSection);
    const [selectedPromoTab, setSelectedPromoTab] = useState('');
    const [iconMode, setIconMode] = useState<'local' | 'online'>(() => {
        // 自动检测图标类型
        if (item.icon?.startsWith('/uploads/')) return 'local';
        if (item.icon?.includes('fa-') || item.icon?.includes(':')) return 'online';
        return 'online'; // 默认在线模式
    });
    const [uploading, setUploading] = useState(false);
    const { alertDialog, showAlert, hideAlert } = useDialogs();

    const selectedCategory = categories?.find(c => c.id === selectedCategoryId);
    const hasSubCategories = selectedCategory?.subCategories && selectedCategory.subCategories.length > 0;

    // Check if section or position changed
    const sectionChanged = enableCrossSectionMove && selectedSection !== currentSection;
    const positionChanged = selectedCategoryId !== currentCategoryId ||
        selectedSubCategory !== (currentSubCategoryName || '');
    const hasMovement = enableCrossSectionMove ? (sectionChanged || positionChanged) : positionChanged;

    useEffect(() => {
        setSelectedCategoryId(currentCategoryId || '');
        setSelectedSubCategory(currentSubCategoryName || '');
        setSelectedSection(currentSection);
        if (promoTabs && promoTabs.length > 0) {
            setSelectedPromoTab(promoTabs[0].name);
        }
    }, [currentCategoryId, currentSubCategoryName, currentSection, promoTabs]);

    const handleMove = () => {
        if (enableCrossSectionMove && onCrossSectionMove && (sectionChanged || positionChanged)) {
            if (selectedSection === 'promo') {
                onCrossSectionMove('promo', selectedPromoTab);
            } else {
                onCrossSectionMove('category', selectedCategoryId, selectedSubCategory || undefined);
            }
        } else if (onCategoryMove && positionChanged) {
            onCategoryMove(selectedCategoryId, selectedSubCategory || undefined);
        }
    };

    // 处理图标文件上传
    const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            showAlert('文件过大', '图片大小不能超过 5MB', 'warning');
            return;
        }

        setUploading(true);
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
                onChange({ ...item, icon: data.url });
                setIconMode('local');
            } else {
                showAlert('上传失败', data.error || '未知错误', 'error');
            }
        } catch (err) {
            console.error('Upload failed:', err);
            showAlert('上传失败', '请重试', 'error');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    // 下载远程图标到服务器
    const handleDownloadIcon = async () => {
        if (!item.icon || item.icon.startsWith('/uploads/')) return;

        // 判断是否为图标代码
        const isIconCode = item.icon.includes('fa-') || item.icon.includes(':');
        if (isIconCode) {
            showAlert('无需下载', '图标代码无需下载', 'info');
            return;
        }

        setUploading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/download-icon', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ iconUrl: item.icon })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || '下载失败');
            }

            const data = await response.json();
            onChange({ ...item, icon: data.url });
            setIconMode('local');
            showAlert('下载成功', '图标已下载到服务器', 'success');
        } catch (err: any) {
            console.error('Download icon failed:', err);
            showAlert('下载失败', (err as Error).message, 'error');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-3 bg-gray-50 p-3 rounded border border-gray-200 mb-2">
            {/* 第一行：标题、URL、描述、操作按钮 */}
            <div className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-3">
                    <Input placeholder="标题" value={item.title} onChange={e => onChange({ ...item, title: e.target.value })} />
                </div>
                <div className="col-span-4">
                    <Input placeholder="链接 URL" value={item.url} onChange={e => onChange({ ...item, url: e.target.value })} />
                </div>
                <div className="col-span-4">
                    <Input placeholder="描述" value={item.description} onChange={e => onChange({ ...item, description: e.target.value })} />
                </div>
                <div className="col-span-1 flex justify-center pt-1 gap-1">
                    {onMove && typeof index === 'number' && typeof total === 'number' && (
                        <>
                            <button onClick={() => onMove('up')} disabled={index === 0} className="text-gray-400 hover:text-[var(--theme-primary)] w-6 h-8 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-30"><Icon icon="fa-solid fa-arrow-up" /></button>
                            <button onClick={() => onMove('down')} disabled={index === total - 1} className="text-gray-400 hover:text-[var(--theme-primary)] w-6 h-8 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-30"><Icon icon="fa-solid fa-arrow-down" /></button>
                        </>
                    )}
                    <button onClick={onDelete} className="text-red-400 hover:text-red-600 w-8 h-8 flex items-center justify-center rounded hover:bg-red-50"><Icon icon="fa-solid fa-trash" /></button>
                </div>
            </div>

            {/* 第二行：图标设置 */}
            <div className="grid grid-cols-12 gap-2 items-end">
                {/* 图标模式选择 */}
                <div className="col-span-2">
                    <Label className="text-xs mb-1.5">图标模式</Label>
                    <div className="flex flex-col gap-1.5">
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="radio"
                                checked={iconMode === 'online'}
                                onChange={() => setIconMode('online')}
                                className="mr-1.5"
                            />
                            <span className="text-xs">🌐 在线</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="radio"
                                checked={iconMode === 'local'}
                                onChange={() => setIconMode('local')}
                                className="mr-1.5"
                            />
                            <span className="text-xs">📦 本地</span>
                        </label>
                    </div>
                </div>

                {/* 图标输入框 */}
                <div className="col-span-5">
                    <Label className="text-xs mb-1.5">
                        {iconMode === 'online' ? '图标代码/URL' : '本地图标路径'}
                    </Label>
                    <div className="relative">
                        <Icon icon={item.icon || 'fa-solid fa-image'} className="absolute left-2.5 top-2.5 text-gray-400" />
                        <Input
                            className="pl-8"
                            placeholder={iconMode === 'online' ? 'fa-xxx 或 mdi:xxx 或 URL' : '/uploads/icon.png'}
                            value={item.icon}
                            onChange={e => onChange({ ...item, icon: e.target.value })}
                        />
                    </div>
                </div>

                {/* 图标操作按钮 */}
                <div className="col-span-3">
                    <Label className="text-xs mb-1.5">图标操作</Label>
                    <div className="flex gap-1.5">
                        {iconMode === 'local' ? (
                            <>
                                {/* 上传按钮 */}
                                <label className="cursor-pointer flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs flex items-center justify-center gap-1 whitespace-nowrap">
                                    <Icon icon="fa-solid fa-upload" />
                                    {uploading ? '上传中' : '上传'}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleIconUpload}
                                        disabled={uploading}
                                        className="hidden"
                                    />
                                </label>
                                {/* 下载按钮 */}
                                {item.icon && !item.icon.startsWith('/uploads/') && !item.icon.includes('fa-') && !item.icon.includes(':') && (
                                    <button
                                        onClick={handleDownloadIcon}
                                        disabled={uploading}
                                        className="flex-1 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-xs flex items-center justify-center gap-1 whitespace-nowrap disabled:opacity-50"
                                        title="下载外部图标到服务器"
                                    >
                                        <Icon icon="fa-solid fa-download" />
                                        下载
                                    </button>
                                )}
                            </>
                        ) : (
                            <div className="flex-1 text-xs text-gray-500 px-3 py-2 bg-gray-100 rounded flex items-center justify-center">
                                支持 URL/图标库
                            </div>
                        )}
                    </div>
                </div>

                {/* 颜色选择器 */}
                <div className="col-span-2">
                    <Label className="text-xs mb-1.5">图标颜色</Label>
                    <Input
                        type="color"
                        className="w-full h-10 !p-1 cursor-pointer"
                        value={item.color || '#000000'}
                        onChange={e => onChange({ ...item, color: e.target.value })}
                        title={item.color || '#000000'}
                    />
                </div>
            </div>

            {/* Category Movement Section */}
            {((categories && categories.length > 0) || (promoTabs && promoTabs.length > 0)) && (onCategoryMove || onCrossSectionMove) && (
                <div className="grid grid-cols-12 gap-2 pt-2 border-t border-gray-200">
                    {/* Section Selection (if cross-section move enabled) */}
                    {enableCrossSectionMove && categories && promoTabs && (
                        <div className="col-span-12 mb-1">
                            <Label className="text-xs mb-1">移动到</Label>
                            <div className="flex gap-4">
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={selectedSection === 'category'}
                                        onChange={() => setSelectedSection('category')}
                                        className="mr-2"
                                    />
                                    <span className="text-sm">📚 内容分类</span>
                                </label>
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={selectedSection === 'promo'}
                                        onChange={() => setSelectedSection('promo')}
                                        className="mr-2"
                                    />
                                    <span className="text-sm">🔥 热门网址</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Target Selection */}
                    {(enableCrossSectionMove ? selectedSection === 'promo' : false) ? (
                        /* Promo Tab Selection */
                        <>
                            <div className="col-span-10">
                                <Label className="text-xs mb-1">目标标签页</Label>
                                <select
                                    value={selectedPromoTab}
                                    onChange={e => setSelectedPromoTab(e.target.value)}
                                    className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]"
                                >
                                    {promoTabs!.map(tab => (
                                        <option key={tab.id} value={tab.name}>
                                            {tab.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-span-2 flex items-end">
                                <button
                                    onClick={handleMove}
                                    disabled={!hasMovement}
                                    className="w-full text-sm px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
                                >
                                    <Icon icon="fa-solid fa-arrows-turn-right" />
                                    移动
                                </button>
                            </div>
                        </>
                    ) : (
                        /* Category & Subcategory Selection */
                        <>
                            <div className="col-span-5">
                                <Label className="text-xs mb-1">目标分类</Label>
                                <select
                                    value={selectedCategoryId}
                                    onChange={e => {
                                        setSelectedCategoryId(e.target.value);
                                        setSelectedSubCategory('');
                                    }}
                                    className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]"
                                >
                                    {categories!.map(cat => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name} {cat.id === currentCategoryId && currentSection === 'category' && !currentSubCategoryName ? '(当前)' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {hasSubCategories && (
                                <div className="col-span-5">
                                    <Label className="text-xs mb-1">目标子分类</Label>
                                    <select
                                        value={selectedSubCategory}
                                        onChange={e => setSelectedSubCategory(e.target.value)}
                                        className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]"
                                    >
                                        <option value="">主分类</option>
                                        {selectedCategory.subCategories!.map(sub => (
                                            <option key={sub.name} value={sub.name}>
                                                {sub.name} {selectedCategoryId === currentCategoryId && currentSection === 'category' && sub.name === currentSubCategoryName ? '(当前)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className={`${hasSubCategories ? 'col-span-2' : 'col-span-7'} flex items-end`}>
                                <button
                                    onClick={handleMove}
                                    disabled={!hasMovement}
                                    className="w-full text-sm px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
                                >
                                    <Icon icon="fa-solid fa-arrows-turn-right" />
                                    移动
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
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
