import axios from 'axios';

// 动态导入nodemailer（如果未安装则跳过）
let nodemailer = null;
try {
    nodemailer = await import('nodemailer');
    nodemailer = nodemailer.default;
} catch (e) {
    console.warn('[通知服务] nodemailer未安装，邮件通知功能将不可用');
}

/**
 * 发送Bark通知
 */
export async function sendBarkNotification(settings, title, content) {
    if (!settings.bark?.enabled || !settings.bark?.server || !settings.bark?.deviceKey) {
        return { platform: 'bark', skipped: true };
    }

    try {
        // Bark API标准格式: {server}/{deviceKey}/{title}/{body}
        // 或者 POST: {server}/{deviceKey} + JSON body
        const barkUrl = `${settings.bark.server}/${settings.bark.deviceKey}`;
        
        // 使用POST方式，支持更多参数
        const barkResponse = await axios.post(barkUrl, {
            title: title,
            body: content,
            sound: settings.bark.sound || 'default',
            badge: settings.bark.badge || 1,
            group: settings.bark.group || '订阅通知'
        }, {
            timeout: 10000 // 10秒超时
        });
        
        console.log(`[Bark] 发送成功 (${title}):`, barkResponse.data);
        
        // Bark返回格式: {code: 200, message: "success", timestamp: ...}
        if (barkResponse.data?.code === 200) {
            return { platform: 'bark', success: true, message: barkResponse.data.message };
        } else {
            return { platform: 'bark', success: false, error: barkResponse.data?.message || '未知错误' };
        }
    } catch (error) {
        console.error(`[Bark] 发送失败 (${title}):`, error.message);
        if (error.response) {
            console.error('[Bark] 响应错误:', error.response.data);
        }
        return { platform: 'bark', success: false, error: error.message };
    }
}

/**
 * 发送Telegram通知
 */
export async function sendTelegramNotification(settings, title, content) {
    if (!settings.telegram?.enabled || !settings.telegram?.botToken || !settings.telegram?.chatId) {
        return { platform: 'telegram', skipped: true };
    }

    try {
        // Telegram Bot API: https://api.telegram.org/bot<token>/sendMessage
        const telegramUrl = `https://api.telegram.org/bot${settings.telegram.botToken}/sendMessage`;
        
        const message = `*${title}*\n\n${content}`;
        
        const telegramResponse = await axios.post(telegramUrl, {
            chat_id: settings.telegram.chatId,
            text: message,
            parse_mode: 'Markdown'
        }, {
            timeout: 10000 // 10秒超时
        });
        
        console.log(`[Telegram] 发送成功 (${title}):`, telegramResponse.data);
        
        // Telegram返回格式: {ok: true, result: {...}}
        if (telegramResponse.data?.ok) {
            return { platform: 'telegram', success: true, message: 'Message sent' };
        } else {
            return { platform: 'telegram', success: false, error: telegramResponse.data?.description || '未知错误' };
        }
    } catch (error) {
        console.error(`[Telegram] 发送失败 (${title}):`, error.message);
        if (error.response) {
            console.error('[Telegram] 响应错误:', error.response.data);
        }
        return { platform: 'telegram', success: false, error: error.message };
    }
}

/**
 * 发送邮件通知
 */
export async function sendEmailNotification(settings, title, content) {
    if (!settings.email?.enabled || !settings.email?.smtpHost) {
        return { platform: 'email', skipped: true };
    }

    if (!nodemailer) {
        console.error('[邮件] nodemailer未安装，无法发送邮件');
        return { platform: 'email', success: false, error: 'nodemailer not installed' };
    }

    try {
        const transporter = nodemailer.createTransport({
            host: settings.email.smtpHost,
            port: settings.email.smtpPort || 587,
            secure: settings.email.smtpPort === 465,
            auth: {
                user: settings.email.username,
                pass: settings.email.password
            }
        });

        await transporter.sendMail({
            from: settings.email.fromEmail || settings.email.username,
            to: settings.email.toEmail,
            subject: title,
            text: content
        });
        
        console.log(`[邮件] 发送成功 (${title})`);
        return { platform: 'email', success: true };
    } catch (error) {
        console.error(`[邮件] 发送失败 (${title}):`, error.message);
        return { platform: 'email', success: false, error: error.message };
    }
}

/**
 * 发送Webhook通知
 */
export async function sendWebhookNotification(settings, title, content, extraData = {}) {
    if (!settings.webhook?.enabled || !settings.webhook?.url) {
        return { platform: 'webhook', skipped: true };
    }

    try {
        // 默认请求头
        let headers = { 'Content-Type': 'application/json' };
        
        // 合并自定义请求头
        if (settings.webhook.headers) {
            try {
                const customHeaders = JSON.parse(settings.webhook.headers);
                headers = { ...headers, ...customHeaders };
            } catch (error) {
                console.error('[Webhook] 自定义请求头格式错误:', error.message);
            }
        }
        
        // 默认数据
        let data = {
            title: title,
            content: content,
            timestamp: new Date().toISOString(),
            ...extraData
        };
        
        // 如果有自定义模板，使用模板替换变量
        if (settings.webhook.template) {
            try {
                let templateStr = settings.webhook.template;
                // 替换变量
                templateStr = templateStr.replace(/\{\{title\}\}/g, title);
                templateStr = templateStr.replace(/\{\{content\}\}/g, content);
                templateStr = templateStr.replace(/\{\{timestamp\}\}/g, data.timestamp);
                
                // 替换额外数据
                for (const [key, value] of Object.entries(extraData)) {
                    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
                    templateStr = templateStr.replace(regex, typeof value === 'string' ? value : JSON.stringify(value));
                }
                
                data = JSON.parse(templateStr);
            } catch (error) {
                console.error('[Webhook] 消息模板格式错误:', error.message);
            }
        }
        
        const webhookResponse = await axios({
            method: settings.webhook.method || 'POST',
            url: settings.webhook.url,
            headers: headers,
            data: data
        });
        
        console.log(`[Webhook] 发送成功 (${title})`);
        return { platform: 'webhook', success: webhookResponse.status >= 200 && webhookResponse.status < 300 };
    } catch (error) {
        console.error(`[Webhook] 发送失败 (${title}):`, error.message);
        return { platform: 'webhook', success: false, error: error.message };
    }
}

/**
 * 发送所有启用的通知
 */
export async function sendAllNotifications(settings, title, content, extraData = {}) {
    const results = [];
    
    // 并行发送所有通知
    const [barkResult, telegramResult, emailResult, webhookResult] = await Promise.all([
        sendBarkNotification(settings, title, content),
        sendTelegramNotification(settings, title, content),
        sendEmailNotification(settings, title, content),
        sendWebhookNotification(settings, title, content, extraData)
    ]);
    
    if (!barkResult.skipped) results.push(barkResult);
    if (!telegramResult.skipped) results.push(telegramResult);
    if (!emailResult.skipped) results.push(emailResult);
    if (!webhookResult.skipped) results.push(webhookResult);
    
    return results;
}
