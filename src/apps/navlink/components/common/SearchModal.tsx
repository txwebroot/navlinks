import React, { useEffect } from 'react';
import SearchHero from '../home/SearchHero';
import { SiteConfig } from '@/src/shared/types';
import { Icon } from '@/src/shared/components/common/Icon';

interface SearchModalProps {
    config: SiteConfig;
    isAuthenticated: boolean;
    onClose: () => void;
    onAIModeClick?: () => void;
}

export default function SearchModal({ config, isAuthenticated, onClose, onAIModeClick }: SearchModalProps) {
    // Close on ESC key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

            {/* Modal Content */}
            <div
                className="relative w-full max-w-3xl bg-gradient-to-b from-[var(--hero-bg)] to-[var(--hero-bg)]/90 rounded-2xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:rotate-90"
                    aria-label="Close search"
                >
                    <Icon icon="fa-solid fa-times" className="text-xl" />
                </button>

                {/* Search Content */}
                <div className="p-8 pt-12">
                    <SearchHero 
                        config={config} 
                        isAuthenticated={isAuthenticated}
                        onAIModeClick={() => {
                            onClose();
                            onAIModeClick?.();
                        }}
                    />
                </div>

                {/* Keyboard Hint */}
                <div className="px-8 pb-6 text-center">
                    <p className="text-white/60 text-sm">
                        <kbd className="px-2 py-1 bg-white/10 rounded text-xs font-mono">ESC</kbd> 关闭
                        {config.searchShortcut && (
                            <>
                                {' · '}
                                <kbd className="px-2 py-1 bg-white/10 rounded text-xs font-mono">
                                    {config.searchShortcut}
                                </kbd> 快速打开
                            </>
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
}
