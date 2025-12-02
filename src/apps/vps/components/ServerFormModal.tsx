import React, { useState, useEffect } from 'react';
import { VpsServer, VpsGroup } from '../types';
import { Icon } from '@/src/shared/components/common/Icon';

interface ServerFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (server: Partial<VpsServer>) => Promise<void>;
    initialData?: VpsServer | null;
    groups: VpsGroup[];
}

export default function ServerFormModal({ isOpen, onClose, onSubmit, initialData, groups }: ServerFormModalProps) {
    const [formData, setFormData] = useState<Partial<VpsServer>>({
        name: '',
        host: '',
        port: 22,
        username: 'root',
        auth_type: 'password',
        password: '',
        private_key: '',
        description: '',
        group_id: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    ...initialData,
                    password: '', // Don't show existing password
                    private_key: '' // Don't show existing key
                });
            } else {
                setFormData({
                    name: '',
                    host: '',
                    port: 22,
                    username: 'root',
                    auth_type: 'password',
                    password: '',
                    private_key: '',
                    description: '',
                    group_id: groups.length > 0 ? groups[0].id : ''
                });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'port' ? parseInt(value) || 22 : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit(formData);
            onClose();
        } catch (error) {
            console.error('Submit error:', error);
            alert('Failed to save server');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-800">
                        {initialData ? '编辑服务器' : '添加服务器'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <Icon icon="fa-solid fa-times" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="My Server"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">分组</label>
                            <select
                                name="group_id"
                                value={formData.group_id}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            >
                                <option value="">无分组</option>
                                {groups.map(g => (
                                    <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Connection Info */}
                    <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-8">
                            <label className="block text-sm font-medium text-gray-700 mb-1">主机地址 (IP/域名)</label>
                            <input
                                type="text"
                                name="host"
                                value={formData.host}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="192.168.1.100"
                            />
                        </div>
                        <div className="col-span-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">端口</label>
                            <input
                                type="number"
                                name="port"
                                value={formData.port}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="22"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="root"
                        />
                    </div>

                    {/* Auth Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">认证方式</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="auth_type"
                                    value="password"
                                    checked={formData.auth_type === 'password'}
                                    onChange={handleChange}
                                    className="text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">密码</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="auth_type"
                                    value="key"
                                    checked={formData.auth_type === 'key'}
                                    onChange={handleChange}
                                    className="text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">SSH 密钥</span>
                            </label>
                        </div>
                    </div>

                    {/* Auth Fields */}
                    {formData.auth_type === 'password' ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                密码 {initialData && <span className="text-xs text-gray-400 font-normal">(留空保持不变)</span>}
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder={initialData ? "••••••••" : "输入密码"}
                            />
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                私钥内容 {initialData && <span className="text-xs text-gray-400 font-normal">(留空保持不变)</span>}
                            </label>
                            <textarea
                                name="private_key"
                                value={formData.private_key}
                                onChange={handleChange}
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono text-xs"
                                placeholder="-----BEGIN OPENSSH PRIVATE KEY-----..."
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="可选备注信息"
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading && <Icon icon="fa-solid fa-spinner" className="animate-spin" />}
                            <span>保存</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
