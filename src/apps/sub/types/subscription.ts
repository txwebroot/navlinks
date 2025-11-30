/**
 * 订阅管理系统 - 类型定义
 */

export interface Subscription {
  id: string;                                  // 唯一ID
  name: string;                                // 订阅名称
  customType: string;                          // 类型（流媒体/云服务/软件等）
  category: string;                            // 分类标签（可多个，用"/"分隔）
  notes: string;                               // 备注
  isActive: boolean;                           // 是否启用
  autoRenew: boolean;                          // 自动续订
  startDate: string;                           // 开始日期（YYYY-MM-DD）
  expiryDate: string;                          // 到期日期（YYYY-MM-DD）
  periodValue: number;                         // 周期数值
  periodUnit: 'day' | 'month' | 'year';       // 周期单位
  reminderValue: number;                       // 提醒数值
  reminderUnit: 'day' | 'hour';               // 提醒单位
  useLunar: boolean;                          // 是否使用农历周期
  price: number;                               // 价格
  currency?: string;                           // 币种（CNY/USD/EUR/GBP）
  currencySymbol?: string;                     // 币种符号（¥/$/ €/£）
  icon?: string;                               // 图标URL
  createdAt: string;                          // 创建时间
  updatedAt: string;                          // 更新时间
}

export interface AppConfig {
  timezone: string;                           // 系统时区
  showLunarByDefault: boolean;                // 默认显示农历
  notificationEnabled: boolean;               // 启用通知
  notificationHours: number[];                // 通知时间点
}

export type SubscriptionStatus = 'active' | 'warning' | 'urgent' | 'expired';

export interface SubscriptionFilter {
  keyword: string;
  category: string;
  status?: SubscriptionStatus;
}
