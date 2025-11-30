import { useState } from 'react';

// Confirm Dialog State
export interface ConfirmDialogState {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
}

// Alert Dialog State
export interface AlertDialogState {
    isOpen: boolean;
    title: string;
    message: string;
    variant?: 'success' | 'error' | 'info' | 'warning';
}

// Prompt Dialog State
export interface PromptDialogState {
    isOpen: boolean;
    title: string;
    message: string;
    defaultValue?: string;
    placeholder?: string;
    onConfirm: (value: string) => void;
}

export const useDialogs = () => {
    const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
    const [alertDialog, setAlertDialog] = useState<AlertDialogState | null>(null);
    const [promptDialog, setPromptDialogState] = useState<PromptDialogState | null>(null);

    const showConfirm = (title: string, message: string, onConfirm: () => void) => {
        setConfirmDialog({ isOpen: true, title, message, onConfirm });
    };

    const hideConfirm = () => {
        setConfirmDialog(null);
    };

    const showAlert = (title: string, message: string, variant: AlertDialogState['variant'] = 'info') => {
        setAlertDialog({ isOpen: true, title, message, variant });
    };

    const hideAlert = () => {
        setAlertDialog(null);
    };

    const showPrompt = (
        title: string,
        message: string,
        onConfirm: (value: string) => void,
        defaultValue?: string,
        placeholder?: string
    ) => {
        setPromptDialogState({
            isOpen: true,
            title,
            message,
            onConfirm,
            defaultValue,
            placeholder
        });
    };

    const hidePrompt = () => {
        setPromptDialogState(null);
    };

    return {
        // State
        confirmDialog,
        alertDialog,
        promptDialog,
        // Methods
        showConfirm,
        hideConfirm,
        showAlert,
        hideAlert,
        showPrompt,
        hidePrompt,
    };
};
