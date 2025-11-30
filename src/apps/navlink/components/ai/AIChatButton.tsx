import React from 'react';
import { Icon } from '@/src/shared/components/common/Icon';

interface AIChatButtonProps {
    onClick: () => void;
    hasUnread?: boolean;
}

export function AIChatButton({ onClick, hasUnread = false }: AIChatButtonProps) {
    return (
        <button
            onClick={onClick}
            className="fixed bottom-8 right-8 z-50 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center group"
            title="AI 助手"
        >
            <Icon icon="fa-solid fa-robot" className="text-2xl" />
            
            {/* 未读消息提示 */}
            {hasUnread && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
            )}
            
            {/* 悬停提示 */}
            <span className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                AI 助手
            </span>
        </button>
    );
}
