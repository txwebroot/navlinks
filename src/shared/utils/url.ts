/**
 * Ensures that a URL has a protocol (http:// or https://).
 * If the URL is missing a protocol and looks like a domain, it prepends http://.
 * Internal links (starting with / or #) are left unchanged.
 * 
 * @param url The URL to check
 * @returns The URL with a protocol if needed
 */
export const ensureProtocol = (url: string | undefined): string => {
    if (!url) return '#';

    const trimmedUrl = url.trim();

    // Return empty/hash as is
    if (!trimmedUrl || trimmedUrl === '#') return '#';

    // Return internal links as is
    if (trimmedUrl.startsWith('/') || trimmedUrl.startsWith('#')) return trimmedUrl;

    // Return mailto, tel, etc as is
    if (trimmedUrl.match(/^[a-z]+:/)) return trimmedUrl;

    // If it doesn't start with http:// or https://, prepend http://
    // We assume it's a domain name if it doesn't match the above
    return `http://${trimmedUrl}`;
};
