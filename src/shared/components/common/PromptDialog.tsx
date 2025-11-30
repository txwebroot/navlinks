import React, { useState } from 'react';
import { Icon } from './Icon';

interface PromptDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    defaultValue?: string;
    placeholder?: string;
    onConfirm: (value: string) => void;
    onCancel: () => void;
}

export const PromptDialog: React.FC<PromptDialogProps> = ({
    isOpen,
    title,
    message,
    defaultValue = '',
    placeholder = '',
    onConfirm,
    onCancel
}) => {
    const [inputValue, setInputValue] = useState(defaultValue);

    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onCancel();
        }
    };

    const handleConfirm = () => {
        onConfirm(inputValue);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleConfirm();
        } else if (e.key === 'Escape') {
            onCancel();
        }
    };

    return (
        <div
            className="fixed inset-0 z-[300] flex items-center justify-center p-4 animate-fade-in"
            onClick={handleBackdropClick}
        >
            {/* 背景遮罩 */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* 对话框 */}
            <div className="relative bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
                {/* 标题 */}
                <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-100 text-blue-600">
                        <Icon icon="fa-solid fa-keyboard" className="text-xl" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                    </div>
                </div>

                {/* 消息内容 */}
                {message && (
                    <p className="text-gray-600 mb-4 pl-13">
                        {message}
                    </p>
                )}

                {/* 输入框 */}
                <div className="mb-6">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        autoFocus
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                </div>

                {/* 按钮 */}
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onCancel}
                        className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-5 py-2.5 rounded-lg transition-colors font-medium text-white bg-blue-500 hover:bg-blue-600"
                    >
                        确定
                    </button>
                </div>
            </div>
        </div>
    );
};
