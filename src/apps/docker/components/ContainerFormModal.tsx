import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import type { Image, Network } from '../types/docker';

interface ContainerFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (config: any) => Promise<void>;
    images: Image[];
    networks: Network[];
    initialImage?: string;
}

export function ContainerFormModal({ isOpen, onClose, onSubmit, images, networks, initialImage }: ContainerFormModalProps) {
    const [name, setName] = useState('');
    const [image, setImage] = useState(initialImage || '');
    const [network, setNetwork] = useState('bridge');
    const [ports, setPorts] = useState<{ host: string; container: string }[]>([]);
    const [env, setEnv] = useState<{ key: string; value: string }[]>([]);
    const [volumes, setVolumes] = useState<{ host: string; container: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setImage(initialImage || '');
            setName('');
            setNetwork('bridge');
            setPorts([]);
            setEnv([]);
            setVolumes([]);
            setError(null);
        }
    }, [isOpen, initialImage]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const config = {
                name,
                Image: image,
                ExposedPorts: ports.reduce((acc, p) => {
                    if (p.container) {
                        acc[`${p.container}/tcp`] = {};
                    }
                    return acc;
                }, {} as any),
                HostConfig: {
                    NetworkMode: network,
                    PortBindings: ports.reduce((acc, p) => {
                        if (p.host && p.container) {
                            acc[`${p.container}/tcp`] = [{ HostPort: p.host }];
                        }
                        return acc;
                    }, {} as any),
                    Binds: volumes
                        .filter(v => v.host && v.container)
                        .map(v => `${v.host}:${v.container}`)
                },
                Env: env
                    .filter(e => e.key && e.value)
                    .map(e => `${e.key}=${e.value}`)
            };

            await onSubmit(config);
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-gray-800">
                        {initialImage ? '运行镜像' : '创建容器'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                        <Icon icon="fa-solid fa-times" className="text-xl" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm flex items-start gap-2">
                            <Icon icon="fa-solid fa-triangle-exclamation" className="mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">容器名称</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="例如: my-web-server"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent outline-none transition"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">镜像 <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={image}
                                    onChange={e => setImage(e.target.value)}
                                    placeholder="例如: nginx:latest"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent outline-none transition"
                                    required
                                    list="image-list"
                                />
                                <datalist id="image-list">
                                    {images.map(img => (
                                        <option key={img.id} value={img.tags[0] !== '<none>:<none>' ? img.tags[0] : img.id.substring(7, 19)} />
                                    ))}
                                </datalist>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">网络</label>
                            <select
                                value={network}
                                onChange={e => setNetwork(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent outline-none transition"
                            >
                                <option value="bridge">bridge (默认)</option>
                                <option value="host">host (主机网络)</option>
                                <option value="none">none (无网络)</option>
                                {networks.map(net => (
                                    <option key={net.id} value={net.name}>
                                        {net.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* 端口映射 */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">端口映射</label>
                            <button
                                type="button"
                                onClick={() => setPorts([...ports, { host: '', container: '' }])}
                                className="text-xs text-[var(--theme-primary)] hover:underline flex items-center gap-1"
                            >
                                <Icon icon="fa-solid fa-plus" /> 添加端口
                            </button>
                        </div>
                        {ports.map((port, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <input
                                    type="text"
                                    value={port.host}
                                    onChange={e => {
                                        const newPorts = [...ports];
                                        newPorts[index].host = e.target.value;
                                        setPorts(newPorts);
                                    }}
                                    placeholder="主机端口"
                                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[var(--theme-primary)] outline-none"
                                />
                                <span className="text-gray-400">:</span>
                                <input
                                    type="text"
                                    value={port.container}
                                    onChange={e => {
                                        const newPorts = [...ports];
                                        newPorts[index].container = e.target.value;
                                        setPorts(newPorts);
                                    }}
                                    placeholder="容器端口"
                                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[var(--theme-primary)] outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setPorts(ports.filter((_, i) => i !== index))}
                                    className="text-red-400 hover:text-red-600 p-2"
                                >
                                    <Icon icon="fa-solid fa-trash" />
                                </button>
                            </div>
                        ))}
                        {ports.length === 0 && (
                            <div className="text-xs text-gray-400 italic">暂无端口映射</div>
                        )}
                    </div>

                    {/* 环境变量 */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">环境变量</label>
                            <button
                                type="button"
                                onClick={() => setEnv([...env, { key: '', value: '' }])}
                                className="text-xs text-[var(--theme-primary)] hover:underline flex items-center gap-1"
                            >
                                <Icon icon="fa-solid fa-plus" /> 添加变量
                            </button>
                        </div>
                        {env.map((item, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <input
                                    type="text"
                                    value={item.key}
                                    onChange={e => {
                                        const newEnv = [...env];
                                        newEnv[index].key = e.target.value;
                                        setEnv(newEnv);
                                    }}
                                    placeholder="变量名 (KEY)"
                                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[var(--theme-primary)] outline-none"
                                />
                                <span className="text-gray-400">=</span>
                                <input
                                    type="text"
                                    value={item.value}
                                    onChange={e => {
                                        const newEnv = [...env];
                                        newEnv[index].value = e.target.value;
                                        setEnv(newEnv);
                                    }}
                                    placeholder="变量值 (VALUE)"
                                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[var(--theme-primary)] outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setEnv(env.filter((_, i) => i !== index))}
                                    className="text-red-400 hover:text-red-600 p-2"
                                >
                                    <Icon icon="fa-solid fa-trash" />
                                </button>
                            </div>
                        ))}
                        {env.length === 0 && (
                            <div className="text-xs text-gray-400 italic">暂无环境变量</div>
                        )}
                    </div>

                    {/* 挂载卷 */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">挂载卷</label>
                            <button
                                type="button"
                                onClick={() => setVolumes([...volumes, { host: '', container: '' }])}
                                className="text-xs text-[var(--theme-primary)] hover:underline flex items-center gap-1"
                            >
                                <Icon icon="fa-solid fa-plus" /> 添加挂载
                            </button>
                        </div>
                        {volumes.map((vol, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <input
                                    type="text"
                                    value={vol.host}
                                    onChange={e => {
                                        const newVols = [...volumes];
                                        newVols[index].host = e.target.value;
                                        setVolumes(newVols);
                                    }}
                                    placeholder="主机路径"
                                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[var(--theme-primary)] outline-none"
                                />
                                <span className="text-gray-400">:</span>
                                <input
                                    type="text"
                                    value={vol.container}
                                    onChange={e => {
                                        const newVols = [...volumes];
                                        newVols[index].container = e.target.value;
                                        setVolumes(newVols);
                                    }}
                                    placeholder="容器路径"
                                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[var(--theme-primary)] outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setVolumes(volumes.filter((_, i) => i !== index))}
                                    className="text-red-400 hover:text-red-600 p-2"
                                >
                                    <Icon icon="fa-solid fa-trash" />
                                </button>
                            </div>
                        ))}
                        {volumes.length === 0 && (
                            <div className="text-xs text-gray-400 italic">暂无挂载卷</div>
                        )}
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                            disabled={loading}
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-[var(--theme-primary)] text-white rounded-lg hover:bg-opacity-90 transition flex items-center gap-2"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>处理中...</span>
                                </>
                            ) : (
                                <>
                                    <Icon icon="fa-solid fa-check" />
                                    <span>{initialImage ? '运行' : '创建'}</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
