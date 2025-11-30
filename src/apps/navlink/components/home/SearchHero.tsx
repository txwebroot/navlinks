import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SiteConfig, SearchEngine, LinkItem } from '@/src/shared/types';
import { Icon } from '@/src/shared/components/common/Icon';
import { useDialogs } from '@/src/shared/hooks/useDialogs';
import { AlertDialog } from '@/src/shared/components/common/AlertDialog';

// Helper component to highlight matching text
const HighlightedText = ({ text, highlight }: { text: string, highlight: string }) => {
    if (!highlight.trim()) return <>{text}</>;
    const parts = text.split(new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
        <>
            {parts.map((part, i) =>
                part.toLowerCase() === highlight.toLowerCase()
                    ? <span key={i} className="text-[var(--theme-primary)] font-bold">{part}</span>
                    : part
            )}
        </>
    );
};

const SearchHero = ({ config, isAuthenticated = false, onAIModeClick }: { config: SiteConfig, isAuthenticated?: boolean, onAIModeClick?: () => void }) => {
    const [activeEngineId, setActiveEngineId] = useState(config.searchEngines?.[0]?.id || '');
    const [keyword, setKeyword] = useState('');
    const { alertDialog, showAlert, hideAlert } = useDialogs();

    // Live Search State
    const [searchResults, setSearchResults] = useState<LinkItem[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    const activeEngine = config.searchEngines?.find(e => e.id === activeEngineId) || config.searchEngines?.[0];

    // Flatten all links from config for searching
    const getAllLinks = () => {
        const links: LinkItem[] = [];

        // 1. Add Category Links (filter hidden categories if not authenticated)
        const visibleCategories = config.categories.filter(cat => isAuthenticated || !cat.hidden);
        visibleCategories.forEach(cat => {
            if (cat.items) links.push(...cat.items);
            if (cat.subCategories) {
                cat.subCategories.forEach(sub => links.push(...sub.items));
            }
        });

        // 2. Add Promo/Hot Links (New Requirement)
        if (config.promo) {
            config.promo.forEach(tab => {
                if (tab.items) {
                    // Map PromoItems to LinkItems structure (ensure required fields)
                    // PromoItem: id, title, url, color, icon, isAd
                    // LinkItem: id, title, url, description, icon, color
                    const promoLinks = tab.items.map(item => ({
                        id: item.id,
                        title: item.title,
                        url: item.url || '#',
                        description: `热门推荐: ${tab.name}`, // Add a description to indicate source
                        icon: item.icon,
                        color: item.color
                    }));
                    links.push(...promoLinks);
                }
            });
        }

        return links;
    };

    // Handle Search Logic
    const handleSearch = (overrideKeyword?: string) => {
        const term = overrideKeyword !== undefined ? overrideKeyword : keyword;
        if (!term.trim()) return;

        if (activeEngine?.urlPattern) {
            window.open(activeEngine.urlPattern + encodeURIComponent(term), '_blank');
        } else {
            // If it's an internal search engine (no urlPattern), try to find the best match
            const links = getAllLinks();
            const match = links.find(l => l.title.toLowerCase().includes(term.toLowerCase()));
            if (match) {
                window.open(match.url, '_blank');
            } else {
                showAlert('站内搜索', `"${term}" \n(提示：请输入更精确的关键词或点击下方自动匹配的结果)`, 'info');
            }
        }
        setShowDropdown(false);
    };

    // Live Search Effect
    useEffect(() => {
        if (!keyword.trim()) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }

        const links = getAllLinks();
        const lowerTerm = keyword.toLowerCase();

        // Filter links by title or description
        const uniqueLinks = new Map();

        links.forEach(item => {
            if (
                item.title.toLowerCase().includes(lowerTerm) ||
                (item.description && item.description.toLowerCase().includes(lowerTerm))
            ) {
                // Use URL as unique key: same URL = only show once
                if (!uniqueLinks.has(item.url)) {
                    uniqueLinks.set(item.url, item);
                }
            }
        });

        const matches = Array.from(uniqueLinks.values());

        // Sort results alphabetically by title
        matches.sort((a, b) => a.title.localeCompare(b.title));

        setSearchResults(matches);
        setShowDropdown(matches.length > 0);
    }, [keyword, config, isAuthenticated]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="w-full flex flex-col items-center justify-center px-4 animate-fade-in relative z-30">
            <div className="w-full max-w-3xl mx-auto flex flex-col items-center">
                <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg text-center">{config.hero.title}</h1>
                <p className="text-blue-200 mb-8 text-center">{config.hero.subtitle}</p>

                <div className="flex flex-wrap justify-center gap-6 mb-8 text-white/80 text-[15px] font-medium">
                    {config.searchEngines?.map(engine => (
                        <button
                            key={engine.id}
                            onClick={() => setActiveEngineId(engine.id)}
                            className={`pb-1 border-b-2 transition-all ${activeEngineId === engine.id ? 'text-white border-[var(--theme-primary)] font-bold' : 'border-transparent hover:text-white'}`}
                        >
                            {engine.name}
                        </button>
                    ))}
                </div>

                <div ref={searchRef} className="w-full relative max-w-2xl mb-6 group">
                    <input
                        type="text"
                        placeholder={activeEngine?.placeholder}
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
                        className="w-full h-[54px] pl-6 pr-32 rounded-xl bg-white text-gray-700 outline-none shadow-2xl focus:ring-4 focus:ring-white/30 transition-all"
                    />
                    {/* 搜索按钮 */}
                    <button onClick={() => handleSearch()} className="absolute right-[60px] top-1.5 bottom-1.5 w-14 text-red-500 rounded-lg transition-all flex items-center justify-center hover:bg-gray-100">
                        <Icon icon="fa-solid fa-magnifying-glass" className="text-2xl" />
                    </button>
                    {/* AI 模式按钮 - Google 风格 */}
                    {onAIModeClick && (
                        <button
                            onClick={onAIModeClick}
                            className="absolute right-1.5 top-1.5 bottom-1.5 w-14 bg-gray-200 text-red-500 rounded-lg transition-all flex items-center justify-center hover:border-2 hover:border-red-500 hover:bg-red-50"
                            title="AI 模式"
                        >
                            <Icon icon="fa-solid fa-robot" className="text-2xl" />
                        </button>
                    )}

                    {/* Live Search Dropdown Results */}
                    {showDropdown && (
                        <div className="absolute top-full left-0 right-0 bg-white mt-2 rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-fade-in text-left">
                            {searchResults.map(item => (
                                <a
                                    key={item.id}
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-none group/item"
                                    onClick={() => setShowDropdown(false)}
                                >
                                    <div className="w-9 h-9 flex items-center justify-center shrink-0" style={{ color: item.color || '#999' }}>
                                        {item.icon && (item.icon.includes('fa-') || item.icon.includes(':')) ? <Icon icon={item.icon} className="text-2xl" /> : <Icon icon="fa-solid fa-link" className="text-2xl" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-bold text-gray-800 truncate group-hover/item:text-[var(--theme-primary)] transition-colors">
                                            <HighlightedText text={item.title} highlight={keyword} />
                                        </div>
                                        <div className="text-xs text-gray-400 truncate">
                                            <HighlightedText text={item.description} highlight={keyword} />
                                        </div>
                                    </div>
                                    <Icon icon="fa-solid fa-arrow-up-right-from-square" className="text-gray-300 text-xs opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                </a>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap justify-center gap-4 text-sm text-white/70">
                    {config.hero.hotSearchLinks?.map((link, idx) => (
                        <button
                            key={idx}
                            onClick={() => {
                                if (link.url && link.url !== '#') {
                                    window.open(link.url, '_blank');
                                } else {
                                    setKeyword(link.title);
                                    // Optionally trigger search immediately
                                    // handleSearch(link.title);
                                }
                            }}
                            className="hover:text-white transition-colors bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm hover:bg-white/20 cursor-pointer"
                        >
                            {link.title}
                        </button>
                    ))}
                </div>
            </div>

            {alertDialog && (
                <AlertDialog
                    isOpen={alertDialog.isOpen}
                    title={alertDialog.title}
                    message={alertDialog.message}
                    variant={alertDialog.variant}
                    onClose={hideAlert}
                />
            )}
        </div>
    );
};

export default SearchHero;