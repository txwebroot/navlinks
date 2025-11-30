import React, { useState } from 'react';
import { Icon } from '@/src/shared/components/common/Icon';

export const Accordion: React.FC<{ title: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean; actions?: React.ReactNode }> = ({ title, children, defaultOpen = false, actions }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border border-gray-200 rounded-lg mb-2 bg-white overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-2 font-medium text-gray-700 cursor-pointer select-none flex-1" onClick={() => setIsOpen(!isOpen)}>
                    <Icon icon={`fa-solid fa-angle-right`} className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
                    {title}
                </div>
                <div className="flex items-center gap-2 pl-2">
                    {actions}
                </div>
            </div>
            {isOpen && <div className="p-4 bg-white">{children}</div>}
        </div>
    );
};
