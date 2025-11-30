import { SiteConfig } from '../types';

const API_BASE = '/api';

export class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

const getHeaders = () => {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    const token = localStorage.getItem('auth_token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

const handleResponse = async (response: Response) => {
    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem('auth_token');
            throw new ApiError('Unauthorized', 401);
        }
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(errorData.error || 'Request failed', response.status);
    }
    return response.json();
};

export const api = {
    login: async (password: string): Promise<{ token: string }> => {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password }),
        });
        return handleResponse(response);
    },

    getConfig: async (): Promise<SiteConfig | null> => {
        const response = await fetch(`${API_BASE}/config`);
        return handleResponse(response);
    },

    saveConfig: async (config: SiteConfig): Promise<{ success: true }> => {
        const response = await fetch(`${API_BASE}/config`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(config),
        });
        return handleResponse(response);
    },
};
