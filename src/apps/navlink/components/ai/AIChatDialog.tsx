import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@/src/shared/components/common/Icon';
import { useConfig } from '@/src/shared/context/ConfigContext';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

interface AIChatDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AIChatDialog({ isOpen, onClose }: AIChatDialogProps) {
    const { config } = useConfig();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
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
            const savedMessages = localStorage.getItem('ai_chat_history');
            if (savedMessages) {
                setMessages(JSON.parse(savedMessages));
            }
        }
    }, [isOpen]);

    // 保存历史消息
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem('ai_chat_history', JSON.stringify(messages.slice(-20))); // 只保存最近20条
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
                // 使用用户选择的提供商
                provider = aiConfig?.providers.find(p => p.id === selectedProviderId && p.enabled);
            } else {
                // 使用默认提供商
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
            localStorage.removeItem('ai_chat_history');
        }
    };

    if (!isOpen) return null;

    // 获取当前选中的提供商
    const currentProvider = config.aiConfig?.providers.find(
        p => p.id === (selectedProviderId || config.aiConfig?.defaultProvider)
    ) || config.aiConfig?.providers.find(p => p.enabled);

    return (
        <div className="fixed bottom-24 right-8 z-50 w-96 max-w-[calc(100vw-2rem)] animate-fade-in">
            {/* 对话框容器 */}
            <div className={`bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 flex flex-col ${isMinimized ? 'h-14' : 'h-[600px] max-h-[80vh]'}`}>
                {/* 头部 */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <Icon icon="fa-solid fa-robot" className="text-xl" />
                        <h3 className="font-bold">AI 助手</h3>
                        {currentProvider && (
                            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                                {currentProvider.name}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {/* AI 提供商选择 */}
                        {config.aiConfig?.providers && config.aiConfig.providers.filter(p => p.enabled).length > 1 && (
                            <div className="relative provider-menu-container">
                                <button
                                    onClick={() => setShowProviderMenu(!showProviderMenu)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
                                    title="切换 AI 服务"
                                >
                                    <Icon icon="fa-solid fa-sliders" />
                                </button>
                                
                                {/* 下拉菜单 */}
                                {showProviderMenu && (
                                    <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[180px] z-10">
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
                            onClick={() => setIsMinimized(!isMinimized)}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
                            title={isMinimized ? '展开' : '最小化'}
                        >
                            <Icon icon={isMinimized ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'} />
                        </button>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
                            title="关闭"
                        >
                            <Icon icon="fa-solid fa-times" />
                        </button>
                    </div>
                </div>

                {/* 内容区域 */}
                {!isMinimized && (
                    <>
                        {/* 消息列表 */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 custom-scrollbar">
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                    <Icon icon="fa-solid fa-comment-dots" className="text-5xl mb-3" />
                                    <p className="text-sm">开始对话吧！</p>
                                    <p className="text-xs mt-1">我是您的 AI 助手</p>
                                </div>
                            ) : (
                                <>
                                    {messages.map((msg, index) => (
                                        <div
                                            key={index}
                                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                                                    msg.role === 'user'
                                                        ? 'bg-blue-500 text-white'
                                                        : 'bg-white text-gray-900 border border-gray-200'
                                                }`}
                                            >
                                                <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {isLoading && (
                                        <div className="flex justify-start">
                                            <div className="bg-white rounded-2xl px-4 py-2.5 border border-gray-200">
                                                <div className="flex gap-1">
                                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
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
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="输入您的问题..."
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    disabled={isLoading}
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!inputMessage.trim() || isLoading}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                    title="发送"
                                >
                                    <Icon icon="fa-solid fa-paper-plane" />
                                </button>
                                {messages.length > 0 && (
                                    <button
                                        onClick={handleClearHistory}
                                        className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                                        title="清空记录"
                                    >
                                        <Icon icon="fa-solid fa-trash" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
