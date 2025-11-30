/**
 * 货币转换工具
 * 汇率数据（相对于人民币CNY）
 */

// 汇率配置（2024年参考汇率，实际项目中可以从API获取实时汇率）
export const EXCHANGE_RATES: Record<string, number> = {
    'CNY': 1,        // 人民币基准
    'USD': 7.2,      // 美元 (1 USD = 7.2 CNY)
    'EUR': 7.8,      // 欧元 (1 EUR = 7.8 CNY)
    'GBP': 9.1,      // 英镑 (1 GBP = 9.1 CNY)
    'JPY': 0.05,     // 日元 (1 JPY = 0.05 CNY)
    'HKD': 0.92,     // 港币 (1 HKD = 0.92 CNY)
    'TWD': 0.23,     // 新台币 (1 TWD = 0.23 CNY)
    'KRW': 0.0055,   // 韩元 (1 KRW = 0.0055 CNY)
};

/**
 * 将任意币种转换为人民币
 * @param amount 金额
 * @param fromCurrency 源币种（如：USD、EUR等）
 * @returns 人民币金额
 */
export function convertToCNY(amount: number, fromCurrency?: string): number {
    if (!fromCurrency || fromCurrency === 'CNY') {
        return amount;
    }

    const rate = EXCHANGE_RATES[fromCurrency];
    if (!rate) {
        console.warn(`未知的币种: ${fromCurrency}，按CNY计算`);
        return amount;
    }

    return amount * rate;
}

/**
 * 格式化金额显示
 * @param amount 金额
 * @param currency 币种
 * @param options 格式化选项
 * @returns 格式化后的字符串
 */
export function formatCurrency(
    amount: number,
    currency: string = 'CNY',
    options?: { decimals?: number; showSymbol?: boolean }
): string {
    const decimals = options?.decimals ?? 2;
    const showSymbol = options?.showSymbol ?? true;

    const symbolMap: Record<string, string> = {
        'CNY': '¥',
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'JPY': '¥',
        'HKD': 'HK$',
        'TWD': 'NT$',
        'KRW': '₩',
    };

    const formattedAmount = amount.toFixed(decimals);
    const symbol = symbolMap[currency] || currency;

    return showSymbol ? `${symbol}${formattedAmount}` : formattedAmount;
}
