import React, { useState, useRef } from 'react';
import { AdminTabProps } from '../types';
import { TextArea, Input, Label } from '../ui/AdminInput';
import { Button } from '../ui/AdminButton';
import { Icon } from '@/src/shared/components/common/Icon';
import { useDialogs } from '@/src/shared/hooks/useDialogs';
import { ConfirmDialog } from '@/src/shared/components/common/ConfirmDialog';
import { AlertDialog } from '@/src/shared/components/common/AlertDialog';
import { PromptDialog } from '@/src/shared/components/common/PromptDialog';

export const DataSettings: React.FC<AdminTabProps> = ({ config, setConfig }) => {
    const {
        confirmDialog, alertDialog, promptDialog,
        showConfirm, hideConfirm,
        showAlert, hideAlert,
        showPrompt, hidePrompt
    } = useDialogs();
    const [importJson, setImportJson] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [backups, setBackups] = useState<Array<{ name: string; data: string; date: string }>>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load backups from localStorage on mount
    React.useEffect(() => {
        const savedBackups = localStorage.getItem('nav_config_backups');
        if (savedBackups) {
            try {
                setBackups(JSON.parse(savedBackups));
            } catch (e) {
                console.error('Failed to load backups:', e);
            }
        }
    }, []);

    // Download configuration as JSON file
    const handleDownload = async () => {
        try {
            // 直接下载db.json文件
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/config/export', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `navlink-config-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            } else {
                // fallback: 使用前端数据
                const dataStr = JSON.stringify(config, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `navlink-config-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Download error:', error);
            // fallback
            const dataStr = JSON.stringify(config, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `navlink-config-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    };

    // Copy to clipboard
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(JSON.stringify(config, null, 2));
            showAlert('复制成功', '配置已复制到剪贴板！', 'success');
        } catch (e) {
            showAlert('复制失败', '请手动选择复制', 'error');
        }
    };

    // Handle file upload
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                setImportJson(content);
            };
            reader.readAsText(file);
        }
    };

    // Handle drag and drop
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file && file.type === 'application/json') {
            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target?.result as string;
                setImportJson(content);
            };
            reader.readAsText(file);
        } else {
            showAlert('文件类型错误', '请拖入 JSON 文件', 'warning');
        }
    };

    // Import configuration
    const handleImport = async () => {
        if (!importJson.trim()) {
            showAlert('输入为空', '请先输入或上传配置数据', 'warning');
            return;
        }

        let fileToUpload: File;

        try {
            // 尝试解析JSON以验证格式，并创建一个文件对象
            const parsed = JSON.parse(importJson);

            // Basic validation
            if (!parsed.categories || !parsed.hero) {
                showAlert('格式错误', '配置格式不正确，缺少必要字段(categories/hero)', 'error');
                return;
            }

            const blob = new Blob([importJson], { type: 'application/json' });
            fileToUpload = new File([blob], 'config_import.json', { type: 'application/json' });

        } catch (e) {
            showAlert('导入失败', 'JSON 格式错误，请检查内容是否完整正确', 'error');
            return;
        }

        showConfirm('确认导入', '确定要覆盖当前所有配置吗？此操作不可撤销！', async () => {
            hideConfirm();
            setIsLoading(true);

            try {
                const formData = new FormData();
                formData.append('file', fileToUpload);

                const token = localStorage.getItem('auth_token');

                if (!token) {
                    showAlert('认证失败', '未找到登录凭证，请重新登录', 'error');
                    setIsLoading(false);
                    return;
                }

                const response = await fetch('/api/config/import', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.success) {
                        showAlert('导入成功', '配置已成功导入！页面将刷新以应用更改。', 'success');
                        setImportJson('');
                        // 延迟刷新页面
                        setTimeout(() => {
                            window.location.reload();
                        }, 1500);
                    } else {
                        throw new Error(result.error || '导入失败');
                    }
                } else {
                    const errorData = await response.json();
                    throw new Error(errorData.error || '导入请求失败');
                }
            } catch (error) {
                console.error('Import error:', error);
                showAlert('导入失败', (error as Error).message, 'error');
            } finally {
                setIsLoading(false);
            }
        });
    };

    // Create backup
    const handleBackup = () => {
        showPrompt(
            '创建备份',
            '请输入备份名称：',
            (backupName) => {
                hidePrompt();
                if (!backupName) return;

                const newBackup = {
                    name: backupName,
                    data: JSON.stringify(config),
                    date: new Date().toISOString()
                };

                const updatedBackups = [newBackup, ...backups].slice(0, 5);
                setBackups(updatedBackups);
                localStorage.setItem('nav_config_backups', JSON.stringify(updatedBackups));
                showAlert('备份成功', '备份已创建！', 'success');
            },
            `备份-${new Date().toLocaleString('zh-CN')}`,
            '输入备份名称...'
        );
    };

    // Restore backup
    const handleRestore = (backup: typeof backups[0]) => {
        showConfirm('确认恢复', `确定要恢复备份 "${backup.name}" 吗？当前配置将被覆盖。`, async () => {
            hideConfirm();
            try {
                const parsed = JSON.parse(backup.data);
                if (setConfig) {
                    setConfig(parsed);

                    // 自动保存到后端
                    try {
                        const token = localStorage.getItem('auth_token');
                        if (token) {
                            await fetch('/api/config', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify(parsed)
                            });
                            showAlert('恢复成功', '备份已恢复并自动保存！', 'success');
                        } else {
                            showAlert('恢复成功', '备份已恢复，但自动保存失败（未登录），请手动保存！', 'warning');
                        }
                    } catch (saveError) {
                        console.error('Auto save failed:', saveError);
                        showAlert('恢复成功', '备份已恢复，但自动保存失败，请手动保存！', 'warning');
                    }
                }
            } catch (e) {
                showAlert('恢复失败', '备份数据损坏，恢复失败', 'error');
            }
        });
    };

    // Delete backup
    const handleDeleteBackup = (index: number) => {
        showConfirm('确认删除', '确定要删除此备份吗？', () => {
            hideConfirm();
            const updatedBackups = backups.filter((_, i) => i !== index);
            setBackups(updatedBackups);
            localStorage.setItem('nav_config_backups', JSON.stringify(updatedBackups));
        });
    };

    // Download backup
    const handleDownloadBackup = (backup: typeof backups[0]) => {
        const dataBlob = new Blob([backup.data], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${backup.name}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6 pb-20">
            <h3 className="text-xl font-bold text-gray-800 sticky top-0 bg-white/95 backdrop-blur py-2 z-10 border-b border-gray-100">数据管理</h3>

            {/* Export Section */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-6 rounded-xl border border-blue-200 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-blue-800 flex items-center gap-2">
                            <Icon icon="fa-solid fa-download" />
                            导出配置
                        </h3>
                        <p className="text-sm text-blue-600 mt-1">保存配置文件到本地，用于备份或迁移</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="primary" className="bg-blue-500 hover:bg-blue-600 border-blue-600" onClick={handleDownload}>
                            <Icon icon="fa-solid fa-file-arrow-down" className="mr-1" />
                            下载文件
                        </Button>
                        <Button variant="secondary" onClick={handleCopy}>
                            <Icon icon="fa-solid fa-copy" className="mr-1" />
                            复制
                        </Button>
                    </div>
                </div>
                <TextArea
                    readOnly
                    value={JSON.stringify(config, null, 2)}
                    className="font-mono text-xs h-48 bg-white/80 text-gray-700 border-blue-200"
                    onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                />
                <p className="text-xs text-blue-500 mt-2">
                    <Icon icon="fa-solid fa-info-circle" className="mr-1" />
                    点击文本框可快速选中全部内容
                </p>
            </div>

            {/* Import Section */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 p-6 rounded-xl border border-orange-200 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-orange-800 flex items-center gap-2">
                            <Icon icon="fa-solid fa-upload" />
                            导入配置
                        </h3>
                        <p className="text-sm text-orange-600 mt-1">从文件或文本导入配置</p>
                    </div>
                    <div className="flex gap-2">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                        <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                            <Icon icon="fa-solid fa-folder-open" className="mr-1" />
                            选择文件
                        </Button>
                    </div>
                </div>

                {/* Drag and Drop Area */}
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
                        border-2 border-dashed rounded-lg p-8 mb-4 transition-all
                        ${isDragging
                            ? 'border-orange-500 bg-orange-100'
                            : 'border-orange-300 bg-white/50 hover:border-orange-400'
                        }
                    `}
                >
                    <div className="text-center">
                        <Icon icon="fa-solid fa-cloud-arrow-up" className="text-4xl text-orange-400 mb-3" />
                        <p className="text-orange-700 font-medium mb-1">
                            {isDragging ? '释放文件以上传' : '拖拽 JSON 文件到此处'}
                        </p>
                        <p className="text-xs text-orange-500">或点击上方"选择文件"按钮</p>
                    </div>
                </div>

                <TextArea
                    value={importJson}
                    onChange={(e) => setImportJson(e.target.value)}
                    placeholder="或在此处粘贴 JSON 配置..."
                    className="font-mono text-xs h-32 bg-white/80 mb-4 border-orange-200"
                />

                <Button
                    variant="primary"
                    className="bg-orange-500 hover:bg-orange-600 border-orange-600 w-full justify-center"
                    onClick={handleImport}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <Icon icon="fa-solid fa-spinner" className="mr-2 animate-spin" />
                            导入中...
                        </>
                    ) : (
                        <>
                            <Icon icon="fa-solid fa-file-import" className="mr-2" />
                            执行导入
                        </>
                    )}
                </Button>

                <div className="mt-4 p-3 bg-orange-100/50 rounded-lg border border-orange-200">
                    <p className="text-xs text-orange-700 flex items-start gap-2">
                        <Icon icon="fa-solid fa-triangle-exclamation" className="mt-0.5" />
                        <span>
                            <strong>注意：</strong>导入操作将完全覆盖当前配置，建议先创建备份！
                        </span>
                    </p>
                </div>
            </div>

            {/* Backup Management */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 p-6 rounded-xl border border-purple-200 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-purple-800 flex items-center gap-2">
                            <Icon icon="fa-solid fa-clock-rotate-left" />
                            备份管理
                        </h3>
                        <p className="text-sm text-purple-600 mt-1">创建和管理配置备份（最多保留5个）</p>
                    </div>
                    <Button variant="primary" className="bg-purple-500 hover:bg-purple-600 border-purple-600" onClick={handleBackup}>
                        <Icon icon="fa-solid fa-floppy-disk" className="mr-1" />
                        创建备份
                    </Button>
                </div>

                {backups.length === 0 ? (
                    <div className="text-center py-8 bg-white/50 rounded-lg border border-purple-200">
                        <Icon icon="fa-solid fa-inbox" className="text-4xl text-purple-300 mb-3" />
                        <p className="text-purple-600">暂无备份，点击上方按钮创建第一个备份</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {backups.map((backup, index) => (
                            <div key={index} className="bg-white/80 p-4 rounded-lg border border-purple-200 hover:border-purple-300 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <Icon icon="fa-solid fa-database" className="text-purple-500" />
                                            <h4 className="font-bold text-gray-800">{backup.name}</h4>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {new Date(backup.date).toLocaleString('zh-CN')}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="secondary" size="sm" onClick={() => handleRestore(backup)}>
                                            <Icon icon="fa-solid fa-rotate-left" className="mr-1" />
                                            恢复
                                        </Button>
                                        <Button variant="secondary" size="sm" onClick={() => handleDownloadBackup(backup)}>
                                            <Icon icon="fa-solid fa-download" />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => handleDeleteBackup(index)}>
                                            <Icon icon="fa-solid fa-trash" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Security Settings Section */}
            <div className="bg-gradient-to-br from-red-50 to-red-100/50 p-6 rounded-xl border border-red-200 shadow-sm">
                <h3 className="text-lg font-bold text-red-800 mb-4 flex items-center gap-2">
                    <Icon icon="fa-solid fa-shield-halved" />
                    安全设置
                </h3>
                <p className="text-sm text-red-600 mb-4">修改后台管理密码（默认为 admin）</p>
                <div className="flex gap-3">
                    <div className="flex-1">
                        <Input
                            id="newAdminPassword"
                            type="password"
                            placeholder="输入新密码"
                            className="bg-white/80 border-red-200"
                        />
                    </div>
                    <Button variant="primary" className="bg-red-500 hover:bg-red-600 border-red-600 whitespace-nowrap text-white" onClick={() => {
                        const input = document.getElementById('newAdminPassword') as HTMLInputElement;
                        const val = input.value.trim();
                        if (val) {
                            if (val.length < 6) {
                                showAlert('密码太短', '密码长度不能少于6位', 'warning');
                                return;
                            }
                            localStorage.setItem('nav_admin_password', val);
                            showAlert('修改成功', '管理密码已更新，下次登录请使用新密码', 'success');
                            input.value = '';
                        } else {
                            showAlert('输入为空', '密码不能为空', 'warning');
                        }
                    }}>
                        <Icon icon="fa-solid fa-key" className="mr-1" />
                        修改密码
                    </Button>
                    <Button variant="secondary" onClick={() => {
                        showConfirm('确认恢复', '确定恢复默认密码（admin）吗？', () => {
                            hideConfirm();
                            localStorage.removeItem('nav_admin_password');
                            showAlert('恢复成功', '已恢复默认密码: admin', 'success');
                        });
                    }}>恢复默认</Button>
                </div>
            </div>

            {/* 对话框组件 */}
            {confirmDialog && (
                <ConfirmDialog
                    isOpen={confirmDialog.isOpen}
                    title={confirmDialog.title}
                    message={confirmDialog.message}
                    onConfirm={confirmDialog.onConfirm}
                    onCancel={hideConfirm}
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

            {promptDialog && (
                <PromptDialog
                    isOpen={promptDialog.isOpen}
                    title={promptDialog.title}
                    message={promptDialog.message}
                    defaultValue={promptDialog.defaultValue}
                    placeholder={promptDialog.placeholder}
                    onConfirm={promptDialog.onConfirm}
                    onCancel={hidePrompt}
                />
            )}
        </div>
    );
};
