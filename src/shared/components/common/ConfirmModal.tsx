import React from 'react';
import { Button } from '../ui/AdminButton';
import { Icon } from './Icon';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden animate-fade-in">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-800">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <Icon icon="fa-solid fa-times" />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-gray-600 mb-6">{message}</p>

                    <div className="flex justify-end gap-3">
                        <Button variant="secondary" onClick={onClose}>取消</Button>
                        <Button variant="danger" onClick={() => {
                            onConfirm();
                            onClose();
                        }}>删除</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
