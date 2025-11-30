import React from 'react';

export const Label = ({ children, className = '', ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
    <label className={`block text-sm font-medium text-gray-700 mb-1 ${className}`} {...props}>{children}</label>
);

export const Input = ({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
        className={`w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--theme-primary)] focus:ring-1 focus:ring-[var(--theme-primary)] transition-colors ${className}`}
        {...props}
    />
);

export const TextArea = ({ className = '', ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea
        className={`w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--theme-primary)] focus:ring-1 focus:ring-[var(--theme-primary)] transition-colors min-h-[80px] ${className}`}
        {...props}
    />
);
