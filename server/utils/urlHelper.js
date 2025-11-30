// Helper: Ensure URL has protocol
export function ensureProtocol(url) {
    if (!url) return url;
    const trimmedUrl = url.trim();
    if (!trimmedUrl || trimmedUrl === '#') return trimmedUrl;
    if (trimmedUrl.startsWith('/') || trimmedUrl.startsWith('#')) return trimmedUrl;
    if (trimmedUrl.match(/^[a-z]+:/)) return trimmedUrl;
    return `http://${trimmedUrl}`;
}
