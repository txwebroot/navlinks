/**
 * 自定义提醒类型定义
 */

export interface CustomReminder {
  id: string;                                  // 唯一ID
  title: string;                               // 提醒标题
  description?: string;                        // 提醒描述
  reminderDate: string;                        // 提醒日期（YYYY-MM-DD）
  reminderTime: string;                        // 提醒时间（HH:mm）
  isActive: boolean;                           // 是否启用
  notified: boolean;                          // 是否已发送通知
  createdAt: string;                          // 创建时间
  updatedAt: string;                          // 更新时间
}

export interface CreateReminderData {
  title: string;
  description?: string;
  reminderDate: string;
  reminderTime: string;
  isActive?: boolean;
}
