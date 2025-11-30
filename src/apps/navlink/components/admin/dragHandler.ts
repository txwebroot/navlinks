import { DropResult } from '@hello-pangea/dnd';
import { SiteConfig } from '@/src/shared/types';

export const handleDragEnd = (result: DropResult, config: SiteConfig, update: (fn: (c: SiteConfig) => SiteConfig) => void) => {
    if (!result.destination) return;

    const { source, destination, type } = result;

    if (type === 'PROMO_ITEM') {
        const tabIdx = parseInt(source.droppableId.split('-')[1]);
        const n = [...config.promo];
        const items = [...n[tabIdx].items];
        const [reorderedItem] = items.splice(source.index, 1);
        items.splice(destination.index, 0, reorderedItem);
        n[tabIdx].items = items;
        update(c => ({ ...c, promo: n }));
    } else if (type === 'CATEGORY_ITEM') {
        const catIdx = parseInt(source.droppableId.split('-')[1]);
        const n = [...config.categories];
        const items = [...(n[catIdx].items || [])];
        const [reorderedItem] = items.splice(source.index, 1);
        items.splice(destination.index, 0, reorderedItem);
        n[catIdx].items = items;
        update(c => ({ ...c, categories: n }));
    } else if (type === 'SUBCATEGORY_ITEM') {
        const [_, catIdxStr, subIdxStr] = source.droppableId.split('-');
        const catIdx = parseInt(catIdxStr);
        const subIdx = parseInt(subIdxStr);
        const n = [...config.categories];
        const subCats = [...n[catIdx].subCategories!];
        const items = [...subCats[subIdx].items];
        const [reorderedItem] = items.splice(source.index, 1);
        items.splice(destination.index, 0, reorderedItem);
        subCats[subIdx].items = items;
        n[catIdx].subCategories = subCats;
        update(c => ({ ...c, categories: n }));
    } else if (type === 'TOP_NAV_ITEM') {
        const n = [...(config.topNav || [])];
        const [reorderedItem] = n.splice(source.index, 1);
        n.splice(destination.index, 0, reorderedItem);
        update(c => ({ ...c, topNav: n }));
    } else if (type === 'TOP_NAV_SUB_ITEM') {
        const parentIdx = parseInt(source.droppableId.split('-')[1]);
        const n = [...(config.topNav || [])];
        const children = [...(n[parentIdx].children || [])];
        const [reorderedItem] = children.splice(source.index, 1);
        children.splice(destination.index, 0, reorderedItem);
        n[parentIdx].children = children;
        update(c => ({ ...c, topNav: n }));
    } else if (type === 'HERO_HOT_SEARCH_ITEM') {
        const n = [...(config.hero.hotSearchLinks || [])];
        const [reorderedItem] = n.splice(source.index, 1);
        n.splice(destination.index, 0, reorderedItem);
        update(c => ({ ...c, hero: { ...c.hero, hotSearchLinks: n } }));
    } else if (type === 'SEARCH_ENGINE_ITEM') {
        const n = [...config.searchEngines];
        const [reorderedItem] = n.splice(source.index, 1);
        n.splice(destination.index, 0, reorderedItem);
        update(c => ({ ...c, searchEngines: n }));
    } else if (type === 'SOCIAL_ITEM') {
        const n = [...(config.rightSidebar.profile.socials || [])];
        const [reorderedItem] = n.splice(source.index, 1);
        n.splice(destination.index, 0, reorderedItem);
        update(c => ({ ...c, rightSidebar: { ...c.rightSidebar, profile: { ...c.rightSidebar.profile, socials: n } } }));
    } else if (type === 'HOT_TOPIC_ITEM') {
        const n = [...(config.rightSidebar.hotTopics || [])];
        const [reorderedItem] = n.splice(source.index, 1);
        n.splice(destination.index, 0, reorderedItem);
        update(c => ({ ...c, rightSidebar: { ...c.rightSidebar, hotTopics: n } }));
    } else if (type === 'PROMO_TAB') {
        const n = [...config.promo];
        const [reorderedItem] = n.splice(source.index, 1);
        n.splice(destination.index, 0, reorderedItem);
        update(c => ({ ...c, promo: n }));
    } else if (type === 'CATEGORY_TAB') {
        const n = [...config.categories];
        const [reorderedItem] = n.splice(source.index, 1);
        n.splice(destination.index, 0, reorderedItem);
        update(c => ({ ...c, categories: n }));
    } else if (type === 'SUBCATEGORY_TAB') {
        const catIdx = parseInt(source.droppableId.split('-')[1]);
        const n = [...config.categories];
        const subCats = [...n[catIdx].subCategories!];
        const [reorderedItem] = subCats.splice(source.index, 1);
        subCats.splice(destination.index, 0, reorderedItem);
        n[catIdx].subCategories = subCats;
        update(c => ({ ...c, categories: n }));
    }
};
