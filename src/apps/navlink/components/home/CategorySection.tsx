import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Category, LinkItem } from '@/src/shared/types';
import { Icon } from '@/src/shared/components/common/Icon';
import LinkCard from './LinkCard';
import { useConfig } from '@/src/shared/context/ConfigContext';
import { LinkEditModal } from './LinkEditModal';
import { ConfirmModal } from '@/src/shared/components/common/ConfirmModal';
import ErrorBoundary from '@/src/shared/components/common/ErrorBoundary';

const CategorySectionContent: React.FC<{ cat: Category }> = ({ cat }) => {
    const { config, setConfig, isAuthenticated } = useConfig();
    const [activeSubCat, setActiveSubCat] = useState(
        (cat.subCategories && cat.subCategories.length > 0) ? cat.subCategories[0].name : ''
    );

    // State for expanding/collapsing functionality
    const [isExpanded, setIsExpanded] = useState(false);
    const [limit, setLimit] = useState(12); // Default initialization

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<LinkItem | undefined>(undefined);

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<LinkItem | undefined>(undefined);

    // Manage Mode State
    const [isManageMode, setIsManageMode] = useState(false);

    // Reset active tab if categories change
    useEffect(() => {
        if (cat.subCategories && cat.subCategories.length > 0 && !cat.subCategories.find(s => s.name === activeSubCat)) {
            setActiveSubCat(cat.subCategories[0].name);
        }
    }, [cat.subCategories]);

    // Reset expansion when switching tabs
    useEffect(() => {
        setIsExpanded(false);
    }, [activeSubCat, cat.id]);

    // Force expand when in manage mode
    useEffect(() => {
        if (isManageMode) {
            setIsExpanded(true);
        }
    }, [isManageMode]);

    // Calculate the limit based on screen width (3 rows)
    useEffect(() => {
        const calculateLimit = () => {
            const width = window.innerWidth;
            let cols = 1; // Default grid-cols-1

            // Match the grid classes: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5
            if (width >= 1536) { // 2xl
                cols = 5;
            } else if (width >= 1280) { // xl
                cols = 4;
            } else if (width >= 1024) { // lg
                cols = 3;
            } else if (width >= 640) { // sm
                cols = 2;
            }

            setLimit(cols * 3); // 3 Rows
        };

        calculateLimit();
        window.addEventListener('resize', calculateLimit);
        return () => window.removeEventListener('resize', calculateLimit);
    }, []);

    // Determine items to display
    let allItems: LinkItem[] = [];
    let currentSubIndex = -1;

    if (cat.subCategories && cat.subCategories.length > 0) {
        currentSubIndex = cat.subCategories.findIndex((sub: any) => sub.name === activeSubCat);
        allItems = currentSubIndex !== -1 ? cat.subCategories[currentSubIndex].items : [];
    } else {
        allItems = cat.items || [];
    }

    const visibleItems = (isExpanded || isManageMode) ? allItems : allItems.slice(0, limit);
    const showExpandButton = allItems.length > limit && !isManageMode;

    // Handlers
    const handleAddClick = () => {
        setEditingItem(undefined);
        setShowModal(true);
    };

    const handleEditClick = (item: LinkItem) => {
        setEditingItem(item);
        setShowModal(true);
    };

    const handleSaveLink = (newItem: LinkItem) => {
        const newConfig = { ...config };
        const catIndex = newConfig.categories.findIndex(c => c.id === cat.id);
        if (catIndex === -1) return;

        if (currentSubIndex !== -1) {
            // Subcategory mode
            const subCats = [...newConfig.categories[catIndex].subCategories!];
            const items = [...subCats[currentSubIndex].items];

            if (editingItem) {
                // Edit
                const itemIndex = items.findIndex(i => i.id === editingItem.id);
                if (itemIndex !== -1) items[itemIndex] = newItem;
            } else {
                // Add
                items.push(newItem);
            }
            subCats[currentSubIndex].items = items;
            newConfig.categories[catIndex].subCategories = subCats;
        } else {
            // Normal mode
            const items = [...(newConfig.categories[catIndex].items || [])];
            if (editingItem) {
                // Edit
                const itemIndex = items.findIndex(i => i.id === editingItem.id);
                if (itemIndex !== -1) items[itemIndex] = newItem;
            } else {
                // Add
                items.push(newItem);
            }
            newConfig.categories[catIndex].items = items;
        }

        setConfig(newConfig);
    };

    const handleMoveLink = (item: LinkItem, targetCategoryId: string, targetSubCategoryName?: string) => {
        const newConfig = { ...config };
        const sourceCatIndex = newConfig.categories.findIndex(c => c.id === cat.id);
        const targetCatIndex = newConfig.categories.findIndex(c => c.id === targetCategoryId);

        if (sourceCatIndex === -1 || targetCatIndex === -1) return;

        // Remove from source
        if (currentSubIndex !== -1) {
            const subCats = [...newConfig.categories[sourceCatIndex].subCategories!];
            subCats[currentSubIndex].items = subCats[currentSubIndex].items.filter(i => i.id !== item.id);
            newConfig.categories[sourceCatIndex].subCategories = subCats;
        } else {
            newConfig.categories[sourceCatIndex].items =
                (newConfig.categories[sourceCatIndex].items || []).filter(i => i.id !== item.id);
        }

        // Add to target
        if (targetSubCategoryName) {
            const targetSubIndex = newConfig.categories[targetCatIndex].subCategories!.findIndex(
                s => s.name === targetSubCategoryName
            );
            if (targetSubIndex !== -1) {
                newConfig.categories[targetCatIndex].subCategories![targetSubIndex].items.push(item);
            }
        } else {
            if (!newConfig.categories[targetCatIndex].items) {
                newConfig.categories[targetCatIndex].items = [];
            }
            newConfig.categories[targetCatIndex].items!.push(item);
        }

        setConfig(newConfig);
    };

    const handleCrossSectionMove = (item: LinkItem, targetSection: 'category' | 'promo', targetId: string, targetSubId?: string) => {
        const newConfig = { ...config };
        
        if (targetSection === 'promo') {
            // Move from category to promo
            const sourceCatIndex = newConfig.categories.findIndex(c => c.id === cat.id);
            if (sourceCatIndex === -1) return;

            // Remove from source category
            if (currentSubIndex !== -1) {
                const subCats = [...newConfig.categories[sourceCatIndex].subCategories!];
                subCats[currentSubIndex].items = subCats[currentSubIndex].items.filter(i => i.id !== item.id);
                newConfig.categories[sourceCatIndex].subCategories = subCats;
            } else {
                newConfig.categories[sourceCatIndex].items =
                    (newConfig.categories[sourceCatIndex].items || []).filter(i => i.id !== item.id);
            }

            // Add to target promo tab
            const targetPromoIndex = newConfig.promo.findIndex(p => p.name === targetId);
            if (targetPromoIndex !== -1) {
                newConfig.promo[targetPromoIndex].items.push({
                    id: item.id,
                    title: item.title,
                    url: item.url,
                    icon: item.icon || 'fa-solid fa-link',
                    color: item.color || '#000000',
                    isAd: false
                });
            }
        } else {
            // Move within categories (same as handleMoveLink)
            handleMoveLink(item, targetId, targetSubId);
            return; // Don't call setConfig again
        }

        setConfig(newConfig);
    };

    const handleDeleteLink = (item: LinkItem) => {
        setItemToDelete(item);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (!itemToDelete) return;

        const newConfig = { ...config };
        const catIndex = newConfig.categories.findIndex(c => c.id === cat.id);
        if (catIndex === -1) return;

        if (currentSubIndex !== -1) {
            // Subcategory mode
            const subCats = [...newConfig.categories[catIndex].subCategories!];
            subCats[currentSubIndex].items = subCats[currentSubIndex].items.filter(i => i.id !== itemToDelete.id);
            newConfig.categories[catIndex].subCategories = subCats;
        } else {
            // Normal mode
            newConfig.categories[catIndex].items = (newConfig.categories[catIndex].items || []).filter(i => i.id !== itemToDelete.id);
        }

        setConfig(newConfig);
        setItemToDelete(undefined);
    };

    const onDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const sourceIndex = result.source.index;
        const destinationIndex = result.destination.index;

        if (sourceIndex === destinationIndex) return;

        const newConfig = { ...config };
        const catIndex = newConfig.categories.findIndex(c => c.id === cat.id);
        if (catIndex === -1) return;

        let newItems = [];
        if (currentSubIndex !== -1) {
            // Subcategory mode
            const subCats = [...newConfig.categories[catIndex].subCategories!];
            newItems = [...subCats[currentSubIndex].items];
            const [removed] = newItems.splice(sourceIndex, 1);
            newItems.splice(destinationIndex, 0, removed);
            subCats[currentSubIndex].items = newItems;
            newConfig.categories[catIndex].subCategories = subCats;
        } else {
            // Normal mode
            newItems = [...(newConfig.categories[catIndex].items || [])];
            const [removed] = newItems.splice(sourceIndex, 1);
            newItems.splice(destinationIndex, 0, removed);
            newConfig.categories[catIndex].items = newItems;
        }

        setConfig(newConfig);
    };

    return (
        <div id={cat.id} className="scroll-mt-24 mb-6 bg-white rounded-xl p-5 shadow-sm border border-gray-100 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 sm:gap-4 mb-4">
                <div className="flex items-center gap-3 flex-shrink-0">
                    {cat.icon && <Icon icon={cat.icon} className="text-xl text-[var(--theme-primary)]" />}
                    <h2 className="font-bold text-gray-800" style={{ fontSize: `${config.theme?.categoryTitleSize || 20}px` }}>{cat.name}</h2>
                </div>

                {cat.subCategories && cat.subCategories.length > 0 && (
                    <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto sm:flex-1 pb-2 sm:pb-0" style={{ scrollbarWidth: 'thin' }}>
                        {cat.subCategories.map((sub: any, subIndex: number) => (
                            <button
                                key={`${cat.id}-${sub.name}-${subIndex}`}
                                onClick={() => setActiveSubCat(sub.name)}
                                className={`
                                    px-4 py-1.5 rounded-lg font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0
                                    ${activeSubCat === sub.name
                                        ? 'bg-[var(--theme-primary)] text-white shadow-md shadow-red-100'
                                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}
                                `}
                                style={{ fontSize: `${config.theme?.subCategoryTitleSize || 12}px` }}
                            >
                                {sub.name}
                            </button>
                        ))}
                    </div>
                )}

                {isAuthenticated && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsManageMode(!isManageMode)}
                            className={`text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 border ${isManageMode ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                        >
                            <Icon icon={isManageMode ? "fa-solid fa-check" : "fa-solid fa-gear"} />
                            {isManageMode ? '完成' : '管理'}
                        </button>
                        <button
                            onClick={handleAddClick}
                            className="text-xs bg-gray-100 hover:bg-[var(--theme-primary)] hover:text-white text-gray-600 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                        >
                            <Icon icon="fa-solid fa-plus" /> 添加链接
                        </button>
                    </div>
                )}
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId={`cat-${cat.id}-${activeSubCat}`} direction="horizontal" isDropDisabled={!isManageMode}>
                    {(provided) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="flex flex-wrap -m-2"
                        >
                            {visibleItems.map((item, index) => (
                                <Draggable
                                    key={item.id}
                                    draggableId={item.id}
                                    index={index}
                                    isDragDisabled={!isManageMode}
                                >
                                    {(provided) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            style={{ ...provided.draggableProps.style }}
                                            className="p-2 w-full sm:w-1/2 lg:w-1/3 xl:w-1/4 2xl:w-1/5"
                                        >
                                            <LinkCard
                                                item={item}
                                                isAuthenticated={isAuthenticated && isManageMode}
                                                onEdit={handleEditClick}
                                                onDelete={handleDeleteLink}
                                            />
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                            {allItems.length === 0 && (
                                <div className="w-full text-center py-4 text-gray-300 text-sm">暂无内容</div>
                            )}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

            {/* Expand/Collapse Button */}
            {showExpandButton && (
                <div className="mt-4 flex justify-center border-t border-gray-50 pt-2">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-xs text-gray-400 hover:text-[var(--theme-primary)] flex items-center gap-1 py-1 px-4 transition-colors"
                    >
                        {isExpanded ? (
                            <>收起 <Icon icon="fa-solid fa-angle-up" /></>
                        ) : (
                            <>显示更多 <Icon icon="fa-solid fa-angle-down" /></>
                        )}
                    </button>
                </div>
            )}

            {/* Edit Modal */}
            <LinkEditModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSave={handleSaveLink}
                onMove={handleMoveLink}
                initialItem={editingItem}
                categories={config.categories}
                currentCategoryId={cat.id}
                currentSubCategoryName={currentSubIndex !== -1 ? activeSubCat : undefined}
                promoTabs={config.promo}
                enableCrossSectionMove={true}
                currentSection="category"
                onCrossSectionMove={handleCrossSectionMove}
            />

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
                title="删除链接"
                message={`确定要删除链接 "${itemToDelete?.title}" 吗？此操作无法撤销。`}
            />
        </div>
    );
};

// Wrap with ErrorBoundary
const CategorySection: React.FC<{ cat: Category }> = (props) => {
    return (
        <ErrorBoundary name={`Category-${props.cat.name}`}>
            <CategorySectionContent {...props} />
        </ErrorBoundary>
    );
};

// Optimize with React.memo
export default React.memo(CategorySection, (prevProps, nextProps) => {
    // We need to re-render if config changes (for isAuthenticated or content updates)
    // Since we use useConfig hook inside, the component will re-render when context changes anyway.
    // However, React.memo might block context updates if props didn't change? 
    // Actually, useContext triggers re-render regardless of React.memo.
    // But we should be careful. Let's just compare the 'cat' prop for now, 
    // but since 'cat' comes from 'config' which is a new object on update, this works.
    return prevProps.cat === nextProps.cat;
});