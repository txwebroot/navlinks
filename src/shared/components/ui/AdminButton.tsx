import React from 'react';

export const Button = ({ children, variant = 'primary', size = 'md', className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline', size?: 'sm' | 'md' }) => {
    const variants = {
        primary: 'bg-[var(--theme-primary)] text-white hover:brightness-110 shadow-sm',
        secondary: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50',
        danger: 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200',
        ghost: 'text-gray-500 hover:text-gray-700 hover:bg-gray-100',
        outline: 'border border-[var(--theme-primary)] text-[var(--theme-primary)] hover:bg-[var(--theme-primary)] hover:text-white'
    };

    const sizes = {
        sm: 'px-2 py-1 text-xs',
        md: 'px-3 py-1.5 text-sm'
    };

    return (
        <button
            className={`rounded font-medium transition-all duration-200 flex items-center gap-1.5 ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};
