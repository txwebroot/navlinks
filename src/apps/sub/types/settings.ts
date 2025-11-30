export interface NotificationSettings {
    timezone: string;
    enableNotifications: boolean;
    categories: string[];

    // Notification Settings
    notification: {
        timeRange: {
            start: string; // '09:00'
            end: string;   // '22:00'
        };
        interval: number; // hours
        maxCount: number; // max notification count
    };

    // Display Settings
    display: {
        currency: string; // 'CNY' | 'USD' | 'EUR' | 'GBP' etc.
        currencySymbol: string; // '¥' | '$' | '€' | '£'
        showWidgets: boolean;
        weekStart: 0 | 1; // 0 for Sunday, 1 for Monday
        cardColorMode: 'status' | 'fixed'; // 'status' for status-based colors, 'fixed' for custom color
        cardColor?: string; // Custom color when cardColorMode is 'fixed' (e.g., '#3b82f6')
        statusColors?: {
            normal: string;    // 15+ days
            attention: string; // 8-15 days
            warning: string;   // 4-7 days
            urgent: string;    // 0-3 days
            expired: string;   // < 0 days
        };
    };

    // Default Values for New Subscriptions
    defaults: {
        periodValue: number;
        periodUnit: 'day' | 'month' | 'year';
        reminderValue: number;
        reminderUnit: 'day' | 'hour';
    };

    // Integrations
    telegram: {
        enabled: boolean;
        botToken: string;
        chatId: string;
    };
    notifyx: {
        enabled: boolean;
        apiKey: string;
        endpoint: string;
    };
    webhook: {
        enabled: boolean;
        url: string;
        method: 'GET' | 'POST';
        headers?: string; // JSON 格式的自定义请求头
        template?: string; // JSON 格式的消息模板
    };
    bark: {
        enabled: boolean;
        deviceKey: string;
        server: string;
    };
}

export const DEFAULT_SETTINGS: NotificationSettings = {
    timezone: 'Asia/Shanghai',
    enableNotifications: true,
    categories: ['个人', '家庭', '工作', '娱乐', '工具'],

    notification: {
        timeRange: {
            start: '09:00',
            end: '22:00'
        },
        interval: 6, // 6 hours
        maxCount: 3  // max 3 times
    },

    display: {
        currency: 'CNY',
        currencySymbol: '¥',
        showWidgets: true,
        weekStart: 1, // Monday
        cardColorMode: 'status', // Default to status-based colors
        cardColor: '#3b82f6', // Blue as default fixed color
        statusColors: {
            normal: '#10b981',    // green-500
            attention: '#fbbf24', // yellow-400
            warning: '#fb923c',   // orange-400
            urgent: '#ef4444',    // red-500
            expired: '#6b7280',   // gray-500
        },
    },

    defaults: {
        periodValue: 1,
        periodUnit: 'month',
        reminderValue: 3,
        reminderUnit: 'day',
    },

    telegram: {
        enabled: false,
        botToken: '',
        chatId: ''
    },
    notifyx: {
        enabled: false,
        apiKey: '',
        endpoint: ''
    },
    webhook: {
        enabled: false,
        url: '',
        method: 'POST',
        headers: '',
        template: ''
    },
    bark: {
        enabled: false,
        deviceKey: '',
        server: 'https://api.day.app'
    }
};
