import React, { useState, useEffect } from 'react';
import { AdminTabProps } from '../types';
import { Icon } from '@/src/shared/components/common/Icon';
import { Button } from '../ui/AdminButton';
import { Label, Input } from '../ui/AdminInput';
import { useConfig } from '@/src/shared/context/ConfigContext';
import { useDialogs } from '@/src/shared/hooks/useDialogs';
import { ConfirmDialog } from '@/src/shared/components/common/ConfirmDialog';
import { AlertDialog } from '@/src/shared/components/common/AlertDialog';

interface MediaFile {
    filename: string;
    path: string;
    size: number;
    uploadedAt: string;
    modifiedAt: string;
}

interface MediaStats {
    totalFiles: number;
    totalSize: number;
}

interface MediaReference {
    type: string;
    location: string;
}

interface MediaFileWithRefs extends MediaFile {
    usageCount?: number;
    references?: MediaReference[];
}

export const MediaSettings: React.FC<AdminTabProps> = ({ config, update }) => {
    const { logout } = useConfig();
    const { alertDialog, showAlert, hideAlert } = useDialogs();
    const [files, setFiles] = useState<MediaFileWithRefs[]>([]);
    const [stats, setStats] = useState<MediaStats>({ totalFiles: 0, totalSize: 0 });
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'used' | 'unused'>('all');
    const [sortBy, setSortBy] = useState<'name' | 'size' | 'date'>('date');
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const [previewFile, setPreviewFile] = useState<MediaFileWithRefs | null>(null);
    const [uploading, setUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [renamingFile, setRenamingFile] = useState<{ filename: string; newName: string } | null>(null);
    const [imageLoading, setImageLoading] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    } | null>(null);

    // 统一的认证失败处理
    const handleAuthError = (status: number) => {
        if (status === 401 || status === 403) {
            console.warn('[MediaSettings] 认证失败，自动退出登录');
            showAlert('登录已过期', '请重新登录', 'error');
            setTimeout(() => logout(), 1500);
            return true;
        }
        return false;
    };

    // 统一获取token的辅助函数
    const getToken = (): string | null => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            console.warn('[MediaSettings] Token not found in localStorage');
        }
        return token;
    };

    // 加载文件列表
    const loadFiles = async () => {
        setLoading(true);
        try {
            const token = getToken();
            if (!token) {
                console.error('[MediaSettings] 加载文件列表失败: Token不存在');
                showAlert('需要登录', '请先登录后台管理', 'error');
                setLoading(false);
                return;
            }

            console.log('[MediaSettings] 开始加载文件列表...');

            const response = await fetch('/api/uploads', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            console.log('[MediaSettings] API响应状态:', response.status);

            if (!response.ok) {
                if (handleAuthError(response.status)) {
                    setLoading(false);
                    return;
                }
                console.error('[MediaSettings] 加载失败:', response.status, response.statusText);
                showAlert('加载失败', `加载文件列表失败: HTTP ${response.status}`, 'error');
                setLoading(false);
                return;
            }

            const data = await response.json();
            console.log('[MediaSettings] 成功获取文件列表:', data.files?.length || 0, '个文件');

            // 获取每个文件的引用信息
            const filesWithRefs = await Promise.all(
                data.files.map(async (file: MediaFile) => {
                    try {
                        const refResponse = await fetch(`/api/uploads/${file.filename}/references`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const refData = await refResponse.json();
                        return {
                            ...file,
                            usageCount: refData.usageCount,
                            references: refData.references
                        };
                    } catch {
                        return { ...file, usageCount: 0, references: [] };
                    }
                })
            );

            setFiles(filesWithRefs);
            setStats(data.stats);
        } catch (error) {
            console.error('Failed to load files:', error);
            showAlert('加载失败', '加载文件列表失败: ' + (error instanceof Error ? error.message : '未知错误'), 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFiles();
    }, []);

    // 删除单个文件
    const handleDelete = async (filename: string) => {
        const file = files.find(f => f.filename === filename);
        if (!file) return;

        // 构建确认消息
        const message = file.usageCount && file.usageCount > 0
            ? `此文件正在被使用 (${file.usageCount} 处引用):

${file.references?.map(r => `  • ${r.location}`).join('\n') || ''}

确定要删除吗？删除后这些位置的图标将失效。`
            : `确定要删除 ${filename} 吗？`;

        // 显示自定义对话框
        setConfirmDialog({
            isOpen: true,
            title: '确认删除',
            message,
            onConfirm: async () => {
                setConfirmDialog(null);
                await performDelete(filename);
            }
        });
    };

    // 实际执行删除
    const performDelete = async (filename: string) => {
        try {
            const token = getToken();
            if (!token) {
                showAlert('需要登录', '请先登录后台管理', 'error');
                return;
            }
            const response = await fetch(`/api/uploads/${filename}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                showAlert('删除成功', '文件已成功删除', 'success');
                setSelectedFiles([]);
                await loadFiles();
            } else {
                const data = await response.json();
                showAlert('删除失败', data.error || '删除失败', 'error');
            }
        } catch (error) {
            console.error('Delete error:', error);
            showAlert('删除失败', '删除操作失败', 'error');
        }
    };

    // 批量删除
    const handleBatchDelete = async () => {
        if (selectedFiles.length === 0) return;

        // 检查选中文件的引用
        const usedFiles = files.filter(f =>
            selectedFiles.includes(f.filename) && f.usageCount && f.usageCount > 0
        );

        const message = usedFiles.length > 0
            ? `以下文件正在被使用:

${usedFiles.map(f => `  • ${f.filename} (${f.usageCount} 处引用)`).join('\n')}

确定要删除这 ${selectedFiles.length} 个文件吗？`
            : `确定要删除这 ${selectedFiles.length} 个文件吗？`;

        setConfirmDialog({
            isOpen: true,
            title: '确认批量删除',
            message,
            onConfirm: async () => {
                setConfirmDialog(null);
                await performBatchDelete();
            }
        });
    };

    // 实际执行批量删除
    const performBatchDelete = async () => {
        try {
            const token = getToken();
            if (!token) {
                showAlert('需要登录', '请先登录后台管理', 'error');
                return;
            }
            const response = await fetch('/api/uploads/batch-delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ filenames: selectedFiles })
            });

            if (response.ok) {
                const data = await response.json();
                showAlert('批量删除成功', `成功删除 ${data.deletedCount} 个文件${data.failedCount > 0 ? `，${data.failedCount} 个失败` : ''}`, 'success');
                setSelectedFiles([]);
                await loadFiles();
            } else {
                showAlert('批量删除失败', '批量删除操作失败', 'error');
            }
        } catch (error) {
            console.error('Batch delete error:', error);
            showAlert('批量删除失败', '批量删除操作失败', 'error');
        }
    };

    // 清理未使用的资源
    const handleCleanUnused = async () => {
        const unused = filteredFiles.filter(f => !f.usageCount || f.usageCount === 0);
        if (unused.length === 0) {
            showAlert('没有未使用的资源', '所有资源都在使用中', 'info');
            return;
        }

        setConfirmDialog({
            isOpen: true,
            title: '确认清理未使用资源',
            message: `发现 ${unused.length} 个未使用的资源，确定要全部删除吗？`,
            onConfirm: async () => {
                setConfirmDialog(null);
                await performCleanUnused(unused);
            }
        });
    };

    // 实际执行清理
    const performCleanUnused = async (unusedFiles: MediaFileWithRefs[]) => {
        const filenames = unusedFiles.map(f => f.filename);
        try {
            const token = getToken();
            if (!token) {
                showAlert('需要登录', '请先登录后台管理', 'error');
                return;
            }
            const response = await fetch('/api/uploads/batch-delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ filenames })
            });

            if (response.ok) {
                const data = await response.json();
                showAlert('清理成功', `成功清理 ${data.deletedCount} 个未使用资源`, 'success');
                await loadFiles();
            } else {
                throw new Error('Clear failed');
            }
        } catch (error) {
            console.error('Clean unused error:', error);
            showAlert('清理失败', '清理操作失败', 'error');
        }
    };

    // 复制路径到剪贴板
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            showAlert('复制成功', '路径已复制到剪贴板', 'success');
        }).catch(() => {
            showAlert('复制失败', '复制到剪贴板失败', 'error');
        });
    };

    // 文件上传
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = e.target.files;
        if (!fileList || fileList.length === 0) return;

        await uploadFiles(Array.from(fileList));
        e.target.value = '';
    };

    // 拖拽上传功能
    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.currentTarget === e.target) {
            setIsDragging(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const droppedFiles = Array.from(e.dataTransfer.files);
        if (droppedFiles.length > 0) {
            await uploadFiles(droppedFiles);
        }
    };

    // 通用上传函数
    const uploadFiles = async (fileList: File[]) => {
        const token = getToken();
        if (!token) {
            showAlert('需要登录', '请先登录后台管理', 'error');
            return;
        }

        console.log('[MediaSettings] 开始上传', fileList.length, '个文件');

        setUploading(true);
        let successCount = 0;
        let failedFiles: { name: string; error: string }[] = [];

        try {
            for (let i = 0; i < fileList.length; i++) {
                const file = fileList[i];

                // 检查文件大小
                if (file.size > 5 * 1024 * 1024) {
                    showAlert('文件过大', `${file.name} 超过 5MB，已跳过`, 'warning');
                    failedFiles.push({ name: file.name, error: '文件过大 (超过 5MB)' });
                    continue;
                }

                const formData = new FormData();
                formData.append('image', file);

                try {
                    const response = await fetch('/api/upload', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` },
                        body: formData
                    });

                    if (response.ok) {
                        successCount++;
                    } else {
                        const errorData = await response.json().catch(() => ({ error: '未知错误' }));
                        failedFiles.push({ name: file.name, error: errorData.error || `HTTP ${response.status}` });
                    }
                } catch (err) {
                    console.error('Upload error:', err);
                    failedFiles.push({ name: file.name, error: err instanceof Error ? err.message : '网络错误' });
                }
            }

            if (successCount > 0 || failedFiles.length > 0) {
                const message = `上传完成: ${successCount} 个成功${failedFiles.length > 0 ? `, ${failedFiles.length} 个失败` : ''}`;
                showAlert(failedFiles.length > 0 ? '部分上传失败' : '上传成功', message, failedFiles.length > 0 ? 'warning' : 'success');
                await loadFiles();
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '未知错误';
            showAlert('上传失败', `上传失败: ${errorMessage}`, 'error');
        } finally {
            setUploading(false);
        }
    };

    // 重命名文件
    const handleRename = async (oldFilename: string) => {
        const file = files.find(f => f.filename === oldFilename);
        if (!file) return;

        const newName = prompt('请输入新的文件名：', oldFilename);
        if (!newName || newName === oldFilename) return;

        try {
            const token = getToken();
            if (!token) {
                showAlert('需要登录', '请先登录后台管理', 'error');
                return;
            }
            const response = await fetch('/api/uploads/rename', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ oldFilename, newFilename: newName })
            });

            const data = await response.json();
            if (response.ok) {
                showAlert('重命名成功', '文件已成功重命名', 'success');
                // Assuming setRenamingFile is a state setter for tracking which file is being renamed
                // If not, this line might need adjustment or removal based on actual component state.
                // For now, keeping it as per the diff.
                // setRenamingFile(null);
                await loadFiles();
            } else {
                showAlert('重命名失败', data.error || '重命名失败', 'error');
            }
        } catch (error) {
            console.error('Rename error:', error);
            showAlert('重命名失败', '重命名操作失败', 'error');
        }
    };

    // 过滤和排序
    const filteredFiles = files
        .filter(file => {
            // 搜索过滤
            if (searchTerm && !file.filename.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false;
            }
            // 状态过滤
            if (filterStatus === 'used' && (!file.usageCount || file.usageCount === 0)) {
                return false;
            }
            if (filterStatus === 'unused' && file.usageCount && file.usageCount > 0) {
                return false;
            }
            return true;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.filename.localeCompare(b.filename);
                case 'size':
                    return b.size - a.size;
                case 'date':
                    return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
                default:
                    return 0;
            }
        });

    // 格式化文件大小
    const formatSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    // 格式化日期
    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    };

    // 切换文件选中状态
    const toggleFileSelection = (filename: string) => {
        setSelectedFiles(prev =>
            prev.includes(filename)
                ? prev.filter(f => f !== filename)
                : [...prev, filename]
        );
    };

    // 全选/取消全选
    const toggleSelectAll = () => {
        if (selectedFiles.length === filteredFiles.length) {
            setSelectedFiles([]);
        } else {
            setSelectedFiles(filteredFiles.map(f => f.filename));
        }
    };

    // 打开预览时重置加载状态
    const openPreview = (file: MediaFileWithRefs) => {
        setImageLoading(true);
        setImageError(false);
        setPreviewFile(file);
    };

    const unusedCount = files.filter(f => !f.usageCount || f.usageCount === 0).length;

    return (
        <div className="space-y-6">
            {/* 标题 */}
            <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                    <Icon icon="fa-solid fa-images" className="text-[var(--theme-primary)]" />
                    资源管理
                </h3>
                <p className="text-sm text-gray-500">管理已上传的图片和图标资源</p>
            </div>

            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-blue-600 font-medium">总文件数</p>
                            <p className="text-2xl font-bold text-blue-700 mt-1">{stats.totalFiles}</p>
                        </div>
                        <Icon icon="fa-solid fa-file-image" className="text-3xl text-blue-400" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-green-600 font-medium">总存储大小</p>
                            <p className="text-2xl font-bold text-green-700 mt-1">{formatSize(stats.totalSize)}</p>
                        </div>
                        <Icon icon="fa-solid fa-database" className="text-3xl text-green-400" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-purple-600 font-medium">使用中</p>
                            <p className="text-2xl font-bold text-purple-700 mt-1">{stats.totalFiles - unusedCount}</p>
                        </div>
                        <Icon icon="fa-solid fa-check-circle" className="text-3xl text-purple-400" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-orange-600 font-medium">未使用</p>
                            <p className="text-2xl font-bold text-orange-700 mt-1">{unusedCount}</p>
                        </div>
                        <Icon icon="fa-solid fa-exclamation-triangle" className="text-3xl text-orange-400" />
                    </div>
                </div>
            </div>

            {/* 工具栏 */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                {/* 拖拽上传区域 */}
                <div
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${isDragging
                        ? 'border-[var(--theme-primary)] bg-blue-50'
                        : 'border-gray-300 bg-white hover:border-gray-400'
                        }`}
                >
                    <Icon
                        icon={uploading ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-cloud-upload-alt"}
                        className={`text-5xl mb-3 ${isDragging ? 'text-[var(--theme-primary)]' : 'text-gray-400'
                            }`}
                    />
                    <p className="text-lg font-medium text-gray-700 mb-1">
                        {uploading ? '上传中...' : isDragging ? '释放文件开始上传' : '拖拽文件到此处上传'}
                    </p>
                    <p className="text-sm text-gray-500 mb-4">或点击下方按钮选择文件</p>
                    <label className="cursor-pointer inline-block">
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileUpload}
                            disabled={uploading}
                            className="hidden"
                        />
                        <div className="px-6 py-3 bg-[var(--theme-primary)] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 inline-flex">
                            <Icon icon="fa-solid fa-folder-open" />
                            选择文件
                        </div>
                    </label>
                    <p className="text-xs text-gray-400 mt-3">支持 JPG, PNG, GIF, SVG, WEBP (最大 5MB)</p>
                </div>

                {/* 第一行：批量操作 */}
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="secondary"
                        onClick={handleBatchDelete}
                        disabled={selectedFiles.length === 0}
                    >
                        <Icon icon="fa-solid fa-trash" className="mr-2" />
                        删除选中 ({selectedFiles.length})
                    </Button>

                    <Button
                        variant="secondary"
                        onClick={handleCleanUnused}
                        disabled={unusedCount === 0}
                    >
                        <Icon icon="fa-solid fa-broom" className="mr-2" />
                        清理未使用 ({unusedCount})
                    </Button>

                    <Button variant="secondary" onClick={loadFiles}>
                        <Icon icon="fa-solid fa-sync" className="mr-2" />
                        刷新
                    </Button>
                </div>

                {/* 第二行：搜索、筛选、排序、视图切换 */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-4">
                        <Input
                            type="text"
                            placeholder="搜索文件名..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value as any)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
                        >
                            <option value="all">全部</option>
                            <option value="used">使用中</option>
                            <option value="unused">未使用</option>
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value as any)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
                        >
                            <option value="date">按日期</option>
                            <option value="name">按名称</option>
                            <option value="size">按大小</option>
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <button
                            onClick={toggleSelectAll}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                        >
                            {selectedFiles.length === filteredFiles.length ? '取消全选' : '全选'}
                        </button>
                    </div>

                    <div className="md:col-span-2 flex gap-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${viewMode === 'grid'
                                ? 'bg-[var(--theme-primary)] text-white'
                                : 'bg-white border border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            <Icon icon="fa-solid fa-th" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${viewMode === 'list'
                                ? 'bg-[var(--theme-primary)] text-white'
                                : 'bg-white border border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            <Icon icon="fa-solid fa-list" />
                        </button>
                    </div>
                </div>
            </div>

            {/* 文件列表 */}
            {loading ? (
                <div className="text-center py-20">
                    <Icon icon="fa-solid fa-spinner fa-spin" className="text-4xl text-gray-400 mb-4" />
                    <p className="text-gray-500">加载中...</p>
                </div>
            ) : filteredFiles.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-xl">
                    <Icon icon="fa-solid fa-folder-open" className="text-6xl text-gray-300 mb-4" />
                    <p className="text-gray-500">
                        {searchTerm || filterStatus !== 'all' ? '没有找到匹配的文件' : '还没有上传任何文件'}
                    </p>
                </div>
            ) : viewMode === 'grid' ? (
                /* 网格视图 */
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {filteredFiles.map(file => (
                        <div
                            key={file.filename}
                            className={`bg-white rounded-xl border-2 overflow-hidden transition-all hover:shadow-lg group ${selectedFiles.includes(file.filename)
                                ? 'border-[var(--theme-primary)] ring-2 ring-[var(--theme-primary)]/20'
                                : 'border-gray-200'
                                }`}
                        >
                            {/* 选择框 */}
                            <div className="absolute top-2 left-2 z-10">
                                <input
                                    type="checkbox"
                                    checked={selectedFiles.includes(file.filename)}
                                    onChange={() => toggleFileSelection(file.filename)}
                                    className="w-5 h-5 rounded cursor-pointer"
                                />
                            </div>

                            {/* 图片预览 */}
                            <div
                                className="relative aspect-square bg-gray-100 flex items-center justify-center cursor-pointer"
                                onClick={() => openPreview(file)}
                            >
                                <img
                                    src={file.path}
                                    alt={file.filename}
                                    className="w-full h-full object-contain p-2"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                        (e.target as HTMLImageElement).parentElement!.innerHTML += '<div class="text-gray-400 text-4xl"><i class="fa-solid fa-file-image"></i></div>';
                                    }}
                                />
                                {/* 使用状态标记 */}
                                {file.usageCount !== undefined && (
                                    <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${file.usageCount > 0
                                        ? 'bg-green-500 text-white'
                                        : 'bg-gray-400 text-white'
                                        }`}>
                                        {file.usageCount > 0 ? `使用 ${file.usageCount}` : '未使用'}
                                    </div>
                                )}
                            </div>

                            {/* 文件信息 */}
                            <div className="p-3 space-y-2">
                                <p className="text-xs font-medium text-gray-800 truncate" title={file.filename}>
                                    {file.filename}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {formatSize(file.size)}
                                </p>

                                {/* 操作按钮 */}
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => copyToClipboard(file.path)}
                                        className="flex-1 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
                                        title="复制路径"
                                    >
                                        <Icon icon="fa-solid fa-copy" />
                                    </button>
                                    <button
                                        onClick={() => openPreview(file)}
                                        className="flex-1 px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors"
                                        title="预览"
                                    >
                                        <Icon icon="fa-solid fa-eye" />
                                    </button>
                                    <button
                                        onClick={() => handleRename(file.filename)}
                                        className="flex-1 px-2 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600 transition-colors"
                                        title="重命名"
                                    >
                                        <Icon icon="fa-solid fa-edit" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(file.filename)}
                                        className="flex-1 px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
                                        title="删除"
                                    >
                                        <Icon icon="fa-solid fa-trash" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* 列表视图 */
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="w-12 px-4 py-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedFiles.length === filteredFiles.length && filteredFiles.length > 0}
                                        onChange={toggleSelectAll}
                                        className="w-5 h-5 rounded cursor-pointer"
                                    />
                                </th>
                                <th className="w-16 px-4 py-3 text-left text-xs font-medium text-gray-600">预览</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">文件名</th>
                                <th className="w-24 px-4 py-3 text-left text-xs font-medium text-gray-600">大小</th>
                                <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-600">上传时间</th>
                                <th className="w-24 px-4 py-3 text-left text-xs font-medium text-gray-600">状态</th>
                                <th className="w-40 px-4 py-3 text-right text-xs font-medium text-gray-600">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredFiles.map(file => (
                                <tr key={file.filename} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedFiles.includes(file.filename)}
                                            onChange={() => toggleFileSelection(file.filename)}
                                            className="w-5 h-5 rounded cursor-pointer"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <div
                                            className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center overflow-hidden cursor-pointer"
                                            onClick={() => openPreview(file)}
                                        >
                                            <img
                                                src={file.path}
                                                alt={file.filename}
                                                className="w-full h-full object-contain"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="text-sm font-medium text-gray-800 truncate max-w-xs" title={file.filename}>
                                            {file.filename}
                                        </p>
                                        <p className="text-xs text-gray-500">{file.path}</p>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {formatSize(file.size)}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-500">
                                        {formatDate(file.uploadedAt)}
                                    </td>
                                    <td className="px-4 py-3">
                                        {file.usageCount !== undefined && (
                                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${file.usageCount > 0
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {file.usageCount > 0 ? `使用 ${file.usageCount}` : '未使用'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-1 justify-end">
                                            <button
                                                onClick={() => copyToClipboard(file.path)}
                                                className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
                                                title="复制路径"
                                            >
                                                <Icon icon="fa-solid fa-copy" />
                                            </button>
                                            <button
                                                onClick={() => openPreview(file)}
                                                className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors"
                                                title="预览"
                                            >
                                                <Icon icon="fa-solid fa-eye" />
                                            </button>
                                            <button
                                                onClick={() => handleRename(file.filename)}
                                                className="px-2 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600 transition-colors"
                                                title="重命名"
                                            >
                                                <Icon icon="fa-solid fa-edit" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(file.filename)}
                                                className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
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

            {/* 预览弹窗 */}
            {previewFile && (
                <div
                    className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4"
                    onClick={() => {
                        setPreviewFile(null);
                        setImageLoading(true);
                        setImageError(false);
                    }}
                >
                    <div
                        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* 预览头部 */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <Icon icon="fa-solid fa-eye" className="text-[var(--theme-primary)]" />
                                文件预览
                            </h3>
                            <button
                                onClick={() => {
                                    setPreviewFile(null);
                                    setImageLoading(true);
                                    setImageError(false);
                                }}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
                            >
                                <Icon icon="fa-solid fa-times" />
                            </button>
                        </div>

                        {/* 图片预览 */}
                        <div className="p-6">
                            <div className="bg-gray-100 rounded-lg flex items-center justify-center mb-6 relative" style={{ minHeight: '300px' }}>
                                {imageLoading && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Icon icon="fa-solid fa-spinner fa-spin" className="text-4xl text-gray-400" />
                                    </div>
                                )}
                                {imageError && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500">
                                        <Icon icon="fa-solid fa-exclamation-triangle" className="text-5xl mb-3" />
                                        <p className="text-sm">图片加载失败</p>
                                        <p className="text-xs text-gray-500 mt-1">{previewFile.path}</p>
                                    </div>
                                )}
                                <img
                                    src={previewFile.path}
                                    alt={previewFile.filename}
                                    className="max-w-full max-h-[400px] object-contain"
                                    style={{ display: imageLoading || imageError ? 'none' : 'block' }}
                                    onLoad={() => {
                                        setImageLoading(false);
                                        setImageError(false);
                                    }}
                                    onError={() => {
                                        setImageLoading(false);
                                        setImageError(true);
                                    }}
                                />
                            </div>

                            {/* 文件信息 */}
                            <div className="space-y-3 bg-gray-50 rounded-lg p-4">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">文件名:</span>
                                    <span className="text-sm font-medium text-gray-800">{previewFile.filename}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">路径:</span>
                                    <span className="text-sm font-mono text-gray-800">{previewFile.path}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">大小:</span>
                                    <span className="text-sm text-gray-800">{formatSize(previewFile.size)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">上传时间:</span>
                                    <span className="text-sm text-gray-800">{formatDate(previewFile.uploadedAt)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">使用状态:</span>
                                    <span className={`text-sm font-medium ${previewFile.usageCount && previewFile.usageCount > 0
                                        ? 'text-green-600'
                                        : 'text-gray-600'
                                        }`}>
                                        {previewFile.usageCount && previewFile.usageCount > 0
                                            ? `使用中 (${previewFile.usageCount} 处引用)`
                                            : '未使用'}
                                    </span>
                                </div>
                            </div>

                            {/* 引用列表 */}
                            {previewFile.references && previewFile.references.length > 0 && (
                                <div className="mt-4 bg-blue-50 rounded-lg p-4">
                                    <h4 className="text-sm font-medium text-blue-900 mb-2">引用位置:</h4>
                                    <ul className="space-y-1">
                                        {previewFile.references.map((ref, idx) => (
                                            <li key={idx} className="text-sm text-blue-700 flex items-start gap-2">
                                                <Icon icon="fa-solid fa-link" className="text-xs mt-1" />
                                                <span>{ref.location}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* 操作按钮 */}
                            <div className="flex gap-2 mt-6">
                                <Button
                                    variant="primary"
                                    onClick={() => copyToClipboard(previewFile.path)}
                                    className="flex-1"
                                >
                                    <Icon icon="fa-solid fa-copy" className="mr-2" />
                                    复制路径
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        handleDelete(previewFile.filename);
                                        setPreviewFile(null);
                                        setImageLoading(true);
                                        setImageError(false);
                                    }}
                                    className="flex-1"
                                >
                                    <Icon icon="fa-solid fa-trash" className="mr-2" />
                                    删除文件
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 确认对话框 */}
            {confirmDialog && (
                <ConfirmDialog
                    isOpen={confirmDialog.isOpen}
                    title={confirmDialog.title}
                    message={confirmDialog.message}
                    onConfirm={confirmDialog.onConfirm}
                    onCancel={() => setConfirmDialog(null)}
                />
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
