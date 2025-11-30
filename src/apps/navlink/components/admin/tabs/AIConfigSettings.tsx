import React, { useState } from 'react';
import { AdminTabProps } from '../types';
import { Label, Input, TextArea } from '../ui/AdminInput';
import { Button } from '../ui/AdminButton';
import { Icon } from '@/src/shared/components/common/Icon';
import { useDialogs } from '@/src/shared/hooks/useDialogs';
import { ConfirmDialog } from '@/src/shared/components/common/ConfirmDialog';
import { AlertDialog } from '@/src/shared/components/common/AlertDialog';
import { SiteConfig, AIProvider } from '@/src/shared/types';

const DEFAULT_AI_CONFIG = {
    providers: [],
    defaultProvider: undefined,
    chatShortcut: 'Ctrl+Shift+A'
};

export const AIConfigSettings: React.FC<AdminTabProps> = ({ config, update }) => {
    const { confirmDialog, alertDialog, showConfirm, hideConfirm, showAlert, hideAlert } = useDialogs();
    const [selectedConfig, setSelectedConfig] = useState<any>(null);
    const aiConfig = config.aiConfig || DEFAULT_AI_CONFIG;
    const [editingProvider, setEditingProvider] = useState<AIProvider | null>(null);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [loadingModels, setLoadingModels] = useState(false);
    const [availableModels, setAvailableModels] = useState<string[]>([]);

    const handleAddProvider = () => {
        const newProvider: AIProvider = {
            id: `ai_${Date.now()}`,
            name: '',
            apiKey: '',
            baseUrl: '',
            model: '',
            enabled: true
        };
        setEditingProvider(newProvider);
        setShowAddDialog(true);
    };

    const handleSaveProvider = () => {
        if (!editingProvider || !editingProvider.name || !editingProvider.apiKey) {
            showAlert('表单错误', '请填写必填项', 'warning');
            return;
        }

        update(prev => {
            const aiConfig = prev.aiConfig || DEFAULT_AI_CONFIG;
            const existingIndex = aiConfig.providers.findIndex(p => p.id === editingProvider.id);

            let updatedProviders;
            if (existingIndex >= 0) {
                updatedProviders = [...aiConfig.providers];
                updatedProviders[existingIndex] = editingProvider;
            } else {
                updatedProviders = [...aiConfig.providers, editingProvider];
            }

            return {
                ...prev,
                aiConfig: {
                    ...aiConfig,
                    providers: updatedProviders
                }
            };
        });

        setEditingProvider(null);
        setShowAddDialog(false);
    };

    const handleDeleteProvider = (id: string) => {
        showConfirm('确认删除', '确定删除此 AI 配置吗？', () => {
            hideConfirm();
            update(prev => ({
                ...prev,
                aiConfig: {
                    ...aiConfig,
                    providers: aiConfig.providers.filter(p => p.id !== id)
                }
            }));
        });
    };

    const handleToggleProvider = (id: string) => {
        update(prev => {
            const aiConfig = prev.aiConfig || DEFAULT_AI_CONFIG;
            return {
                ...prev,
                aiConfig: {
                    ...aiConfig,
                    providers: aiConfig.providers.map(p =>
                        p.id === id ? { ...p, enabled: !p.enabled } : p
                    )
                }
            };
        });
    };

    const handleSetDefault = (id: string) => {
        update(prev => ({
            ...prev,
            aiConfig: {
                ...aiConfig,
                defaultProvider: id
            }
        }));
    };

    const handleShortcutChange = (shortcut: string) => {
        update(prev => ({
            ...prev,
            aiConfig: {
                ...aiConfig,
                chatShortcut: shortcut
            }
        }));
    };

    const handleFetchModels = async () => {
        if (!editingProvider?.apiKey || !editingProvider?.baseUrl) {
            showAlert('配置错误', '请先填写 API Key 和 Base URL', 'warning');
            return;
        }

        setLoadingModels(true);
        try {
            const baseUrl = editingProvider.baseUrl;
            const apiUrl = `${baseUrl}/models`;

            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${editingProvider.apiKey}`
                }
            });

            if (!response.ok) {
                throw new Error('获取模型列表失败');
            }

            const data = await response.json();
            const models = data.data?.map((m: any) => m.id) || [];

            if (models.length === 0) {
                showAlert('未找到模型', '未找到可用模型', 'warning');
            } else {
                setAvailableModels(models);
            }
        } catch (error) {
            console.error('获取模型错误:', error);
            showAlert('获取失败', '获取模型失败: ' + (error instanceof Error ? error.message : '未知错误'), 'error');
        } finally {
            setLoadingModels(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">AI 配置</h3>
                <p className="text-sm text-gray-500">管理 AI 服务提供商和快捷键设置</p>
            </div>

            {/* 快捷键设置 */}
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Icon icon="fa-solid fa-keyboard" />
                    快捷键设置
                </h4>
                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            打开 AI 对话快捷键
                        </label>
                        <Input
                            value={aiConfig.chatShortcut}
                            onChange={(e) => handleShortcutChange(e.target.value)}
                            placeholder="例如: Ctrl+Shift+A"
                            className="max-w-xs"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            示例：Ctrl+Shift+A, Cmd+K, Alt+C
                        </p>
                    </div>
                </div>
            </div>

            {/* AI 提供商列表 */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-gray-900">AI 服务提供商</h4>
                    <Button variant="primary" onClick={handleAddProvider}>
                        <Icon icon="fa-solid fa-plus" className="mr-2" />
                        添加 AI
                    </Button>
                </div>

                <div className="space-y-3">
                    {aiConfig.providers.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                            <Icon icon="fa-solid fa-robot" className="text-4xl text-gray-300 mb-3" />
                            <p className="text-gray-500">还没有配置任何 AI 服务</p>
                            <Button variant="secondary" className="mt-4" onClick={handleAddProvider}>
                                <Icon icon="fa-solid fa-plus" className="mr-2" />
                                添加第一个 AI
                            </Button>
                        </div>
                    ) : (
                        aiConfig.providers.map(provider => (
                            <div
                                key={provider.id}
                                className={`bg-white border rounded-xl p-4 transition-all ${provider.enabled ? 'border-green-200' : 'border-gray-200'
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${provider.enabled ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                                        }`}>
                                        <Icon icon="fa-solid fa-robot" className="text-xl" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h5 className="font-semibold text-gray-900">{provider.name}</h5>
                                            {aiConfig.defaultProvider === provider.id && (
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                                    默认
                                                </span>
                                            )}
                                            {provider.enabled && (
                                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                                    已启用
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            {provider.model && `模型: ${provider.model}`}
                                            {provider.baseUrl && ` • ${provider.baseUrl}`}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {provider.enabled && aiConfig.defaultProvider !== provider.id && (
                                            <button
                                                onClick={() => handleSetDefault(provider.id)}
                                                className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="设为默认"
                                            >
                                                设为默认
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleToggleProvider(provider.id)}
                                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${provider.enabled
                                                ? 'text-gray-600 hover:bg-gray-100'
                                                : 'text-green-600 hover:bg-green-50'
                                                }`}
                                        >
                                            {provider.enabled ? '禁用' : '启用'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEditingProvider(provider);
                                                setShowAddDialog(true);
                                            }}
                                            className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            <Icon icon="fa-solid fa-edit" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteProvider(provider.id)}
                                            className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Icon icon="fa-solid fa-trash" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* 添加/编辑对话框 */}
            {showAddDialog && editingProvider && (
                <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-xl font-bold text-gray-900">
                                {editingProvider.name ? '编辑 AI 配置' : '添加 AI 配置'}
                            </h3>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    名称 <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    value={editingProvider.name}
                                    onChange={(e) => setEditingProvider({ ...editingProvider, name: e.target.value })}
                                    placeholder="例如: OpenAI, DeepSeek, Claude"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    API Key <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    type="password"
                                    value={editingProvider.apiKey}
                                    onChange={(e) => setEditingProvider({ ...editingProvider, apiKey: e.target.value })}
                                    placeholder="sk-..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Base URL（可选）
                                </label>
                                <Input
                                    value={editingProvider.baseUrl || ''}
                                    onChange={(e) => setEditingProvider({ ...editingProvider, baseUrl: e.target.value })}
                                    placeholder="https://api.openai.com/v1 或 https://api.deepseek.com"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    DeepSeek: https://api.deepseek.com
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    模型（可选）
                                </label>
                                <div className="flex gap-2">
                                    <Input
                                        value={editingProvider.model || ''}
                                        onChange={(e) => setEditingProvider({ ...editingProvider, model: e.target.value })}
                                        placeholder="gpt-4, deepseek-chat, claude-3-opus"
                                        className="flex-1"
                                    />
                                    <Button
                                        variant="secondary"
                                        onClick={handleFetchModels}
                                        disabled={loadingModels || !editingProvider.apiKey || !editingProvider.baseUrl}
                                    >
                                        {loadingModels ? (
                                            <Icon icon="fa-solid fa-spinner fa-spin" className="mr-2" />
                                        ) : (
                                            <Icon icon="fa-solid fa-sync" className="mr-2" />
                                        )}
                                        获取模型
                                    </Button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    OpenAI: gpt-3.5-turbo, gpt-4 | DeepSeek: deepseek-chat | 留空自动判断
                                </p>

                                {availableModels.length > 0 && (
                                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                        <p className="text-sm font-medium text-gray-700 mb-2">可用模型：</p>
                                        <div className="flex flex-wrap gap-2">
                                            {availableModels.map(model => (
                                                <button
                                                    key={model}
                                                    onClick={() => setEditingProvider({ ...editingProvider, model })}
                                                    className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-colors"
                                                >
                                                    {model}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setShowAddDialog(false);
                                    setEditingProvider(null);
                                }}
                            >
                                取消
                            </Button>
                            <Button variant="primary" onClick={handleSaveProvider}>
                                保存
                            </Button>
                        </div>
                    </div>
                </div>
            )}

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
        </div>
    );
};
