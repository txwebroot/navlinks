import React from 'react';
import { Icon as IconifyIcon } from '@iconify/react';

interface IconProps {
    icon: string;
    className?: string;
    style?: React.CSSProperties;
    onClick?: () => void;
}

export const Icon: React.FC<IconProps> = ({ icon, className = '', style, onClick }) => {
    // Check if the icon string is an Iconify icon (contains a colon, e.g., "mdi:home")
    // or if it explicitly starts with "iconify:" (custom convention if needed, but colon is standard)
    const isIconify = icon.includes(':');

    if (isIconify) {
        return <IconifyIcon icon={icon} className={className} style={style} onClick={onClick} />;
    }

    // Default to FontAwesome
    return <i onClick={onClick} className={`${icon} ${className}`} style={style}></i>;
};
