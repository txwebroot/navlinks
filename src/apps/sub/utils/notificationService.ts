/**
 * 通知服务 - 实际发送通知到各个平台
 * 参考SubsTracker-master的实现
 */

interface NotificationSettings {
    timezone: string;
    enableNotifications: boolean;
    categories: string[];
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
    };
    bark: {
        enabled: boolean;
        deviceKey: string;
        server: string;
    };
}

/**
 * 发送Telegram通知
 */
export async function sendTelegramNotification(
    message: string,
    botToken: string,
    chatId: string
): Promise<{ success: boolean; message: string }> {
    try {
        if (!botToken || !chatId) {
            return { success: false, message: '缺少Bot Token或Chat ID' };
        }

        console.log('[Telegram] 开始发送通知到 Chat ID:', chatId);

        // 调用后端代理API（避免CORS问题）
        const response = await fetch('/api/notifications/telegram', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                botToken,
                chatId,
                message
            })
        });

        const result = await response.json();
        console.log('[Telegram] 发送结果:', result);

        if (result.success) {
            return { success: true, message: '发送成功' };
        } else {
            return { success: false, message: result.message || '发送失败' };
        }
    } catch (error: any) {
        console.error('[Telegram] 发送通知失败:', error);
        return { success: false, message: error.message || '网络错误' };
    }
}

/**
 * 发送NotifyX通知
 */
export async function sendNotifyXNotification(
    title: string,
    content: string,
    apiKey: string,
    endpoint?: string
): Promise<{ success: boolean; message: string }> {
    try {
        if (!apiKey) {
            return { success: false, message: '缺少API Key' };
        }

        console.log('[NotifyX] 开始发送通知:', title);

        // 调用后端代理API（避免CORS问题）
        const response = await fetch('/api/notifications/notifyx', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                apiKey,
                title,
                content,
                description: '订阅到期提醒'
            })
        });

        const result = await response.json();
        console.log('[NotifyX] 发送结果:', result);

        if (result.success) {
            return { success: true, message: '发送成功' };
        } else {
            return { success: false, message: result.message || '发送失败' };
        }
    } catch (error: any) {
        console.error('[NotifyX] 发送通知失败:', error);
        return { success: false, message: error.message || '网络错误' };
    }
}

/**
 * 发送Webhook通知
 */
export async function sendWebhookNotification(
    title: string,
    content: string,
    webhookUrl: string,
    method: 'GET' | 'POST' = 'POST'
): Promise<{ success: boolean; message: string }> {
    try {
        if (!webhookUrl) {
            return { success: false, message: '缺少Webhook URL' };
        }

        console.log('[Webhook] 开始发送通知到:', webhookUrl);

        const timestamp = new Date().toLocaleString('zh-CN', {
            timeZone: 'Asia/Shanghai',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        const requestBody = {
            title,
            content,
            timestamp,
            message: `${title}

${content}

发送时间：${timestamp}`
        };

        // 调用后端代理API（避免CORS问题）
        const response = await fetch('/api/notifications/webhook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: webhookUrl,
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: requestBody
            })
        });

        const result = await response.json();
        console.log('[Webhook] 发送结果:', result);

        if (result.success) {
            return { success: true, message: `发送成功 (${result.statusCode})` };
        } else {
            return { success: false, message: result.message || '发送失败' };
        }
    } catch (error: any) {
        console.error('[Webhook] 发送通知失败:', error);
        return { success: false, message: error.message || '网络错误' };
    }
}

/**
 * 发送Bark通知 (iOS推送)
 */
export async function sendBarkNotification(
    title: string,
    content: string,
    deviceKey: string,
    server: string = 'https://api.day.app'
): Promise<{ success: boolean; message: string }> {
    try {
        if (!deviceKey) {
            return { success: false, message: '缺少设备Key' };
        }

        console.log('[Bark] 开始发送通知到设备:', deviceKey);

        // 调用后端代理API（避免CORS问题）
        const response = await fetch('/api/notifications/bark', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                deviceKey,
                server: server || 'https://api.day.app',
                title,
                body: content,
                isArchive: false
            })
        });

        const result = await response.json();
        console.log('[Bark] 发送结果:', result);

        if (result.success) {
            return { success: true, message: '发送成功' };
        } else {
            return { success: false, message: result.message || '发送失败' };
        }
    } catch (error: any) {
        console.error('[Bark] 发送通知失败:', error);
        return { success: false, message: error.message || '网络错误' };
    }
}

/**
 * 测试通知功能 - 统一入口
 */
export async function testNotification(
    platform: 'telegram' | 'notifyx' | 'webhook' | 'bark',
    settings: NotificationSettings
): Promise<{ success: boolean; message: string }> {
    const testTitle = '🔔 订阅管理测试通知';
    const testContent = `这是一条测试通知消息。\n\n发送时间：${new Date().toLocaleString('zh-CN')}\n平台：${platform.toUpperCase()}`;
    const testMessage = `*${testTitle}*\n\n${testContent}`;

    switch (platform) {
        case 'telegram':
            return await sendTelegramNotification(
                testMessage,
                settings.telegram.botToken,
                settings.telegram.chatId
            );
        
        case 'notifyx':
            return await sendNotifyXNotification(
                testTitle,
                testContent,
                settings.notifyx.apiKey,
                settings.notifyx.endpoint
            );
        
        case 'webhook':
            return await sendWebhookNotification(
                testTitle,
                testContent,
                settings.webhook.url,
                settings.webhook.method
            );
        
        case 'bark':
            return await sendBarkNotification(
                testTitle,
                testContent,
                settings.bark.deviceKey,
                settings.bark.server
            );
        
        default:
            return { success: false, message: '未知的通知平台' };
    }
}
