import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@/src/shared/components/common/Icon';
import { useConfig } from '@/src/shared/context/ConfigContext';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

interface AIChatModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AIChatModal({ isOpen, onClose }: AIChatModalProps) {
    const { config } = useConfig();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
    const [showProviderMenu, setShowProviderMenu] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 自动滚动到底部
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // 点击外部关闭菜单
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (showProviderMenu) {
                const target = e.target as HTMLElement;
                if (!target.closest('.provider-menu-container')) {
                    setShowProviderMenu(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showProviderMenu]);

    // 加载历史消息
    useEffect(() => {
        if (isOpen) {
            const savedMessages = localStorage.getItem('ai_chat_history_modal');
            if (savedMessages) {
                setMessages(JSON.parse(savedMessages));
            }
        }
    }, [isOpen]);

    // 保存历史消息
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem('ai_chat_history_modal', JSON.stringify(messages.slice(-20)));
        }
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return;

        const userMessage: Message = {
            role: 'user',
            content: inputMessage.trim(),
            timestamp: Date.now()
        };

        setInputMessage('');
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            // 获取选中的 AI 提供商
            const aiConfig = config.aiConfig;
            let provider = null;
            
            if (selectedProviderId) {
                provider = aiConfig?.providers.find(p => p.id === selectedProviderId && p.enabled);
            } else {
                provider = aiConfig?.providers.find(
                    p => p.id === aiConfig.defaultProvider && p.enabled
                ) || aiConfig?.providers.find(p => p.enabled);
            }

            if (!provider) {
                const errorMessage: Message = {
                    role: 'assistant',
                    content: '❗ 请先在后台配置并启用一个 AI 服务提供商。',
                    timestamp: Date.now()
                };
                setMessages(prev => [...prev, errorMessage]);
                setIsLoading(false);
                return;
            }

            // 构造请求
            const baseUrl = provider.baseUrl || 'https://api.openai.com/v1';
            const apiUrl = `${baseUrl}/chat/completions`;

            // 使用配置的模型
            let modelName = provider.model;
            if (!modelName) {
                if (baseUrl.includes('deepseek')) {
                    modelName = 'deepseek-chat';
                } else {
                    modelName = 'gpt-3.5-turbo';
                }
            }

            const requestBody = {
                model: modelName,
                messages: [
                    ...messages.map(m => ({
                        role: m.role,
                        content: m.content
                    })),
                    {
                        role: 'user',
                        content: userMessage.content
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000
            };

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${provider.apiKey}`
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `API 请求失败: ${response.status}`);
            }

            const data = await response.json();
            const aiContent = data.choices?.[0]?.message?.content || '抱歉，没有收到回复。';

            const aiMessage: Message = {
                role: 'assistant',
                content: aiContent,
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error('AI 请求错误:', error);
            const errorMessage: Message = {
                role: 'assistant',
                content: `❗ 请求失败: ${error instanceof Error ? error.message : '未知错误'}

请检查：
1. API Key 是否正确
2. Base URL 是否正确
3. 网络连接是否正常`,
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearHistory = () => {
        if (confirm('确定要清空所有聊天记录吗？')) {
            setMessages([]);
            localStorage.removeItem('ai_chat_history_modal');
        }
    };

    // ESC 关闭
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // 获取当前选中的提供商
    const currentProvider = config.aiConfig?.providers.find(
        p => p.id === (selectedProviderId || config.aiConfig?.defaultProvider)
    ) || config.aiConfig?.providers.find(p => p.enabled);

    return (
        <div 
            className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
        >
            {/* 对话框容器 */}
            <div 
                className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 头部 */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <Icon icon="fa-solid fa-sparkles" className="text-2xl" />
                        <div>
                            <h3 className="font-bold text-lg">AI 助手</h3>
                            {currentProvider && (
                                <p className="text-xs text-white/80">{currentProvider.name}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* AI 提供商选择 */}
                        {config.aiConfig?.providers && config.aiConfig.providers.filter(p => p.enabled).length > 1 && (
                            <div className="relative provider-menu-container">
                                <button
                                    onClick={() => setShowProviderMenu(!showProviderMenu)}
                                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
                                    title="切换 AI 服务"
                                >
                                    <Icon icon="fa-solid fa-sliders" />
                                </button>
                                
                                {/* 下拉菜单 */}
                                {showProviderMenu && (
                                    <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[200px] z-10">
                                        {config.aiConfig.providers.filter(p => p.enabled).map(provider => (
                                            <button
                                                key={provider.id}
                                                onClick={() => {
                                                    setSelectedProviderId(provider.id === selectedProviderId ? null : provider.id);
                                                    setShowProviderMenu(false);
                                                }}
                                                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                                                    (selectedProviderId === provider.id || (!selectedProviderId && config.aiConfig?.defaultProvider === provider.id))
                                                        ? 'bg-blue-50 text-blue-600'
                                                        : 'text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span>{provider.name}</span>
                                                    {config.aiConfig?.defaultProvider === provider.id && !selectedProviderId && (
                                                        <Icon icon="fa-solid fa-check" className="text-blue-600" />
                                                    )}
                                                    {selectedProviderId === provider.id && (
                                                        <Icon icon="fa-solid fa-check" className="text-blue-600" />
                                                    )}
                                                </div>
                                                {provider.model && (
                                                    <div className="text-xs text-gray-400 mt-0.5">{provider.model}</div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        <button
                            onClick={onClose}
                            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
                            title="关闭"
                        >
                            <Icon icon="fa-solid fa-times" className="text-xl" />
                        </button>
                    </div>
                </div>

                {/* 消息列表 */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 custom-scrollbar">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <Icon icon="fa-solid fa-sparkles" className="text-6xl mb-4 text-purple-300" />
                            <p className="text-lg font-medium text-gray-600">开始与 AI 对话</p>
                            <p className="text-sm mt-2">问我任何问题，我会尽力帮助您</p>
                        </div>
                    ) : (
                        <>
                            {messages.map((msg, index) => (
                                <div
                                    key={index}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[75%] rounded-2xl px-5 py-3 ${
                                            msg.role === 'user'
                                                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                                                : 'bg-white text-gray-900 border border-gray-200 shadow-sm'
                                        }`}
                                    >
                                        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white rounded-2xl px-5 py-3 border border-gray-200 shadow-sm">
                                        <div className="flex gap-1.5">
                                            <span className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce"></span>
                                            <span className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                                            <span className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>

                {/* 输入框 */}
                <div className="p-4 bg-white border-t border-gray-200 shrink-0">
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                            placeholder="输入您的问题... (按 Enter 发送)"
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!inputMessage.trim() || isLoading}
                            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                            title="发送"
                        >
                            <Icon icon="fa-solid fa-paper-plane" />
                        </button>
                        {messages.length > 0 && (
                            <button
                                onClick={handleClearHistory}
                                className="px-4 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
                                title="清空记录"
                            >
                                <Icon icon="fa-solid fa-trash" />
                            </button>
                        )}
                    </div>
                    <p className="text-xs text-gray-400 mt-2 text-center">
                        按 <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">ESC</kbd> 关闭
                    </p>
                </div>
            </div>
        </div>
    );
}
