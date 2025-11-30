import React, { useState } from 'react';
import { useConfig } from '../../context/ConfigContext';
import { SiteConfig } from '../../types';
import { Icon } from '../common/Icon';

interface LoginDialogProps {
    onClose: () => void;
    onLogin: () => void;
}

export default function LoginDialog({ onClose, onLogin }: LoginDialogProps) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useConfig();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(password);
            onLogin();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md transform transition-all scale-100">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">管理员登录</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <Icon icon="fa-solid fa-xmark" className="text-xl" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <div className="relative">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent outline-none transition-all"
                                placeholder="请输入密码"
                                autoFocus
                            />
                            <Icon icon="fa-solid fa-lock" className="absolute left-3.5 top-3.5 text-gray-400" />
                        </div>
                        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
                    </div>

                    <div className="flex gap-4 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[var(--theme-primary)] text-white py-2.5 rounded-lg font-medium hover:brightness-110 transition-all shadow-lg shadow-red-100 disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                            {loading && <Icon icon="fa-solid fa-circle-notch" className="animate-spin" />}
                            {loading ? '登录中...' : '登录'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}