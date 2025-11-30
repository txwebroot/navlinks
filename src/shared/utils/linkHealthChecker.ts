import { SiteConfig, Category, LinkItem, LinkHealthStatus } from '../types';

// API Base URL
const API_BASE = '';

// 获取认证 token
function getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
}

// 检测单个链接健康状态
export async function checkSingleLink(url: string): Promise<LinkHealthStatus> {
    const token = getAuthToken();
    if (!token) {
        throw new Error('未登录');
    }

    try {
        const response = await fetch(`${API_BASE}/api/check-link`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ url })
        });

        if (!response.ok) {
            throw new Error('检测失败');
        }

        return await response.json();
    } catch (error) {
        console.error('Link check error:', error);
        return {
            isHealthy: false,
            errorMessage: '检测失败',
            lastChecked: new Date().toISOString()
        };
    }
}

// 批量检测链接（带进度回调）
export async function checkMultipleLinks(
    urls: string[],
    onProgress?: (current: number, total: number) => void
): Promise<Map<string, LinkHealthStatus>> {
    const token = getAuthToken();
    if (!token) {
        throw new Error('未登录');
    }

    const resultMap = new Map<string, LinkHealthStatus>();

    // 每批最多50个
    const batchSize = 50;
    let processed = 0;

    for (let i = 0; i < urls.length; i += batchSize) {
        const batch = urls.slice(i, i + batchSize);

        try {
            const response = await fetch(`${API_BASE}/api/check-links`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ urls: batch })
            });

            if (response.ok) {
                const data = await response.json();
                data.results.forEach((result: LinkHealthStatus & { url: string }) => {
                    const { url, ...status } = result;
                    resultMap.set(url, status);
                });
            }
        } catch (error) {
            console.error('Batch check error:', error);
            // 标记这一批为失败
            batch.forEach(url => {
                resultMap.set(url, {
                    isHealthy: false,
                    errorMessage: '检测失败',
                    lastChecked: new Date().toISOString()
                });
            });
        }

        processed += batch.length;
        onProgress?.(processed, urls.length);
    }

    return resultMap;
}

// 从配置中提取所有链接
function extractAllLinks(config: SiteConfig): Array<{ url: string; path: string }> {
    const links: Array<{ url: string; path: string }> = [];

    // 遍历所有分类
    config.categories.forEach((category, catIdx) => {
        // 主分类链接
        if (category.items) {
            category.items.forEach((item, itemIdx) => {
                links.push({
                    url: item.url,
                    path: `categories[${catIdx}].items[${itemIdx}]`
                });
            });
        }

        // 子分类链接
        if (category.subCategories) {
            category.subCategories.forEach((subCat, subIdx) => {
                subCat.items.forEach((item, itemIdx) => {
                    links.push({
                        url: item.url,
                        path: `categories[${catIdx}].subCategories[${subIdx}].items[${itemIdx}]`
                    });
                });
            });
        }
    });

    // 热门推广链接 (only include items with URLs)
    config.promo.forEach((tab, tabIdx) => {
        tab.items.forEach((item, itemIdx) => {
            if (item.url) { // Only include items with valid URLs
                links.push({
                    url: item.url,
                    path: `promo[${tabIdx}].items[${itemIdx}]`
                });
            }
        });
    });

    return links;
}

// 应用检测结果到配置
function applyHealthResults(
    config: SiteConfig,
    results: Map<string, LinkHealthStatus>
): SiteConfig {
    const newConfig = JSON.parse(JSON.stringify(config)) as SiteConfig;

    // 更新分类链接
    newConfig.categories.forEach(category => {
        if (category.items) {
            category.items.forEach(item => {
                const status = results.get(item.url);
                if (status) {
                    item.health = status;
                }
            });
        }

        if (category.subCategories) {
            category.subCategories.forEach(subCat => {
                subCat.items.forEach(item => {
                    const status = results.get(item.url);
                    if (status) {
                        item.health = status;
                    }
                });
            });
        }
    });

    // 更新热门推广链接
    newConfig.promo.forEach(tab => {
        tab.items.forEach(item => {
            const status = results.get(item.url);
            if (status) {
                item.health = status;
            }
        });
    });

    return newConfig;
}

// 检测所有链接并更新配置
export async function checkAllLinks(
    config: SiteConfig,
    onProgress?: (current: number, total: number) => void
): Promise<SiteConfig> {
    const allLinks = extractAllLinks(config);
    const urls = allLinks.map(link => link.url);

    const results = await checkMultipleLinks(urls, onProgress);
    return applyHealthResults(config, results);
}

// 检测指定分类的所有链接
export async function checkCategoryLinks(
    category: Category,
    onProgress?: (current: number, total: number) => void
): Promise<Category> {
    const urls: string[] = [];

    // 收集所有链接URL
    if (category.items) {
        urls.push(...category.items.map(item => item.url));
    }

    if (category.subCategories) {
        category.subCategories.forEach(subCat => {
            urls.push(...subCat.items.map(item => item.url));
        });
    }

    const results = await checkMultipleLinks(urls, onProgress);

    // 应用结果
    const newCategory = JSON.parse(JSON.stringify(category)) as Category;

    if (newCategory.items) {
        newCategory.items.forEach(item => {
            const status = results.get(item.url);
            if (status) {
                item.health = status;
            }
        });
    }

    if (newCategory.subCategories) {
        newCategory.subCategories.forEach(subCat => {
            subCat.items.forEach(item => {
                const status = results.get(item.url);
                if (status) {
                    item.health = status;
                }
            });
        });
    }

    return newCategory;
}

// 获取失效链接列表
export function getUnhealthyLinks(config: SiteConfig): Array<{
    item: LinkItem;
    categoryName: string;
    subCategoryName?: string;
    path: string;
}> {
    const unhealthyList: Array<{
        item: LinkItem;
        categoryName: string;
        subCategoryName?: string;
        path: string;
    }> = [];

    // 检查分类
    config.categories.forEach((category, catIdx) => {
        if (category.items) {
            category.items.forEach((item, itemIdx) => {
                if (item.health && !item.health.isHealthy) {
                    unhealthyList.push({
                        item,
                        categoryName: category.name,
                        path: `categories[${catIdx}].items[${itemIdx}]`
                    });
                }
            });
        }

        if (category.subCategories) {
            category.subCategories.forEach((subCat, subIdx) => {
                subCat.items.forEach((item, itemIdx) => {
                    if (item.health && !item.health.isHealthy) {
                        unhealthyList.push({
                            item,
                            categoryName: category.name,
                            subCategoryName: subCat.name,
                            path: `categories[${catIdx}].subCategories[${subIdx}].items[${itemIdx}]`
                        });
                    }
                });
            });
        }
    });

    // 检查热门推广
    config.promo.forEach((tab, tabIdx) => {
        tab.items.forEach((item, itemIdx) => {
            if (item.health && !item.health.isHealthy) {
                unhealthyList.push({
                    item: item as any, // PromoItem has different structure
                    categoryName: `热门推广 - ${tab.name}`,
                    path: `promo[${tabIdx}].items[${itemIdx}]`
                });
            }
        });
    });

    return unhealthyList;
}

// 获取健康统计
export function getHealthStats(config: SiteConfig): {
    total: number;
    healthy: number;
    unhealthy: number;
    unchecked: number;
    avgResponseTime: number;
} {
    let total = 0;
    let healthy = 0;
    let unhealthy = 0;
    let unchecked = 0;
    let totalResponseTime = 0;
    let responseTimeCount = 0;

    const countItems = (items: LinkItem[]) => {
        items.forEach(item => {
            total++;
            if (!item.health) {
                unchecked++;
            } else if (item.health.isHealthy) {
                healthy++;
                if (item.health.responseTime) {
                    totalResponseTime += item.health.responseTime;
                    responseTimeCount++;
                }
            } else {
                unhealthy++;
            }
        });
    };

    // 统计分类
    config.categories.forEach(category => {
        if (category.items) countItems(category.items);
        if (category.subCategories) {
            category.subCategories.forEach(subCat => countItems(subCat.items));
        }
    });

    // 统计热门推广 (PromoItem has different structure)
    config.promo.forEach(tab => countItems(tab.items as any));

    return {
        total,
        healthy,
        unhealthy,
        unchecked,
        avgResponseTime: responseTimeCount > 0 ? Math.round(totalResponseTime / responseTimeCount) : 0
    };
}
