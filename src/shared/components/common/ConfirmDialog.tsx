import React from 'react';
import { Icon } from './Icon';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmVariant?: 'danger' | 'primary';
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    title,
    message,
    confirmText = '确定',
    cancelText = '取消',
    confirmVariant = 'danger',
    onConfirm,
    onCancel
}) => {
    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
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
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${confirmVariant === 'danger'
                            ? 'bg-red-100 text-red-600'
                            : 'bg-blue-100 text-blue-600'
                        }`}>
                        <Icon icon={confirmVariant === 'danger' ? 'fa-solid fa-exclamation-triangle' : 'fa-solid fa-info-circle'} className="text-xl" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                    </div>
                </div>

                {/* 消息内容 */}
                <p className="text-gray-600 mb-6 whitespace-pre-line leading-relaxed pl-13">
                    {message}
                </p>

                {/* 按钮 */}
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onCancel}
                        className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-5 py-2.5 rounded-lg transition-colors font-medium text-white ${confirmVariant === 'danger'
                                ? 'bg-red-500 hover:bg-red-600'
                                : 'bg-blue-500 hover:bg-blue-600'
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
