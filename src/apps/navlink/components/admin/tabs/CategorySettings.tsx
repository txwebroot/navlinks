import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { AdminTabProps } from '../types';
import { Category } from '@/src/shared/types';
import { Icon } from '@/src/shared/components/common/Icon';
import { Label, Input } from '../ui/AdminInput';
import { Button } from '../ui/AdminButton';
import { Accordion } from '../ui/Accordion';
import { LinkItemEditor } from '../ui/LinkItemEditor';
import { useDialogs } from '@/src/shared/hooks/useDialogs';
import { ConfirmDialog } from '@/src/shared/components/common/ConfirmDialog';
import { removeItem } from '../utils';

export const CategorySettings: React.FC<AdminTabProps> = ({ config, update }) => {
    const { confirmDialog, showConfirm, hideConfirm } = useDialogs();

    const updateCategory = (index: number, newCat: Category) => {
        update(c => {
            const cats = [...c.categories];
            cats[index] = newCat;
            return { ...c, categories: cats };
        });
    };

    const moveLink = (
        linkItem: any,
        sourceCategoryId: string,
        sourceSubCategoryName: string | undefined,
        targetCategoryId: string,
        targetSubCategoryName?: string
    ) => {
        const newCategories = [...config.categories];
        const sourceCatIdx = newCategories.findIndex(c => c.id === sourceCategoryId);
        const targetCatIdx = newCategories.findIndex(c => c.id === targetCategoryId);

        // Remove from source
        if (sourceSubCategoryName) {
            const subIdx = newCategories[sourceCatIdx].subCategories!.findIndex(
                s => s.name === sourceSubCategoryName
            );
            newCategories[sourceCatIdx].subCategories![subIdx].items =
                newCategories[sourceCatIdx].subCategories![subIdx].items.filter(
                    item => item.id !== linkItem.id
                );
        } else {
            newCategories[sourceCatIdx].items =
                newCategories[sourceCatIdx].items!.filter(item => item.id !== linkItem.id);
        }

        // Add to target
        if (targetSubCategoryName) {
            const subIdx = newCategories[targetCatIdx].subCategories!.findIndex(
                s => s.name === targetSubCategoryName
            );
            newCategories[targetCatIdx].subCategories![subIdx].items.push(linkItem);
        } else {
            if (!newCategories[targetCatIdx].items) {
                newCategories[targetCatIdx].items = [];
            }
            newCategories[targetCatIdx].items!.push(linkItem);
        }

        update(c => ({ ...c, categories: newCategories }));
    };

    const handleCrossSectionMove = (
        linkItem: any,
        sourceCategoryId: string,
        sourceSubCategoryName: string | undefined,
        targetSection: 'category' | 'promo',
        targetId: string,
        targetSubId?: string
    ) => {
        if (targetSection === 'promo') {
            // Move from category to promo
            const newCategories = [...config.categories];
            const newPromo = [...config.promo];
            const sourceCatIdx = newCategories.findIndex(c => c.id === sourceCategoryId);

            // Remove from source category
            if (sourceSubCategoryName) {
                const subIdx = newCategories[sourceCatIdx].subCategories!.findIndex(
                    s => s.name === sourceSubCategoryName
                );
                newCategories[sourceCatIdx].subCategories![subIdx].items =
                    newCategories[sourceCatIdx].subCategories![subIdx].items.filter(
                        item => item.id !== linkItem.id
                    );
            } else {
                newCategories[sourceCatIdx].items =
                    newCategories[sourceCatIdx].items!.filter(item => item.id !== linkItem.id);
            }

            // Add to target promo tab
            const targetPromoIdx = newPromo.findIndex(p => p.name === targetId);
            if (targetPromoIdx !== -1) {
                newPromo[targetPromoIdx].items.push({
                    id: linkItem.id,
                    title: linkItem.title,
                    url: linkItem.url,
                    icon: linkItem.icon || 'fa-solid fa-link',
                    color: linkItem.color || '#000000',
                    isAd: false
                });
            }

            update(c => ({ ...c, categories: newCategories, promo: newPromo }));
        } else {
            // Move within categories
            moveLink(linkItem, sourceCategoryId, sourceSubCategoryName, targetId, targetSubId);
        }
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white/95 backdrop-blur py-2 z-10 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-800">分类内容管理</h3>
                <Button onClick={() => update(c => ({ ...c, categories: [...c.categories, { id: Date.now().toString(), name: '新分类', icon: 'fa-solid fa-folder', items: [] }] }))}>
                    <Icon icon="fa-solid fa-plus" className="mr-1" /> 添加分类
                </Button>
            </div>

            <Droppable droppableId="category-tabs" type="CATEGORY_TAB">
                {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-4">
                        {config.categories.map((cat, catIdx) => (
                            <Draggable key={cat.id} draggableId={cat.id} index={catIdx}>
                                {(provided) => (
                                    <div ref={provided.innerRef} {...provided.draggableProps}>
                                        <Accordion
                                            title={
                                                <div className="flex items-center gap-3">
                                                    <div {...provided.dragHandleProps} className="text-gray-400 cursor-grab hover:text-gray-600 px-1" onClick={e => e.stopPropagation()}>
                                                        <Icon icon="fa-solid fa-grip-vertical" />
                                                    </div>
                                                    <Icon icon={cat.icon} className="text-gray-400 w-5 text-center" />
                                                    <span className="font-bold text-gray-800">{cat.name}</span>
                                                    <span className="text-xs text-gray-400 font-normal bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                                                        {cat.subCategories ? `${cat.subCategories.length} 个子分类` : `${cat.items?.length || 0} 个链接`}
                                                    </span>
                                                </div>
                                            }
                                            actions={
                                                <>
                                                    <Button variant="ghost" className="!px-2 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={(e) => {
                                                        e.stopPropagation();
                                                        showConfirm('确认删除', '确定删除此分类吗?', () => {
                                                            hideConfirm();
                                                            update(c => ({ ...c, categories: removeItem(c.categories, catIdx) }));
                                                        });
                                                    }}><Icon icon="fa-solid fa-trash" /></Button>
                                                </>
                                            }
                                        >
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                                                    <div>
                                                        <Label>分类名称</Label>
                                                        <Input value={cat.name} onChange={e => updateCategory(catIdx, { ...cat, name: e.target.value })} />
                                                    </div>
                                                    <div>
                                                        <Label>分类图标 (FontAwesome / Iconify)</Label>
                                                        <div className="flex gap-2">
                                                            <div className="w-10 h-[38px] flex items-center justify-center bg-white border border-gray-300 rounded flex-shrink-0"><Icon icon={cat.icon} /></div>
                                                            <Input value={cat.icon} onChange={e => updateCategory(catIdx, { ...cat, icon: e.target.value })} />
                                                        </div>
                                                    </div>
                                                    <div className="col-span-2 flex items-center gap-2 pt-2 border-t border-gray-200 mt-2">
                                                        <input
                                                            type="checkbox"
                                                            id={`hasSub-${cat.id}`}
                                                            checked={!!cat.subCategories && cat.subCategories.length > 0}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    updateCategory(catIdx, { ...cat, subCategories: [{ name: '默认子类', items: cat.items || [] }], items: undefined });
                                                                } else {
                                                                    showConfirm('确认切换', '切换回普通模式将合并所有子分类链接，确认？', () => {
                                                                        hideConfirm();
                                                                        const allItems = cat.subCategories?.flatMap(s => s.items) || [];
                                                                        updateCategory(catIdx, { ...cat, subCategories: undefined, items: allItems });
                                                                    });
                                                                }
                                                            }}
                                                            className="w-4 h-4 text-[var(--theme-primary)] rounded border-gray-300 focus:ring-[var(--theme-primary)] cursor-pointer"
                                                        />
                                                        <Label className="!mb-0 cursor-pointer select-none" htmlFor={`hasSub-${cat.id}`}>启用多级子分类 (Tab模式)</Label>
                                                    </div>
                                                    <div className="col-span-2 flex items-center gap-2 pt-2">
                                                        <input
                                                            type="checkbox"
                                                            id={`hidden-${cat.id}`}
                                                            checked={cat.hidden === true}
                                                            onChange={(e) => updateCategory(catIdx, { ...cat, hidden: e.target.checked })}
                                                            className="w-4 h-4 text-[var(--theme-primary)] rounded border-gray-300 focus:ring-[var(--theme-primary)] cursor-pointer"
                                                        />
                                                        <Label className="!mb-0 cursor-pointer select-none" htmlFor={`hidden-${cat.id}`}>未登录时隐藏此分类</Label>
                                                    </div>
                                                </div>

                                                {cat.subCategories ? (
                                                    <div className="space-y-4 pl-4 border-l-2 border-[var(--theme-primary)]/20 ml-2">
                                                        <Droppable droppableId={`subcats-${catIdx}`} type="SUBCATEGORY_TAB">
                                                            {(provided) => (
                                                                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-4">
                                                                    {cat.subCategories.map((sub, subIdx) => (
                                                                        <Draggable key={`sub-${catIdx}-${subIdx}`} draggableId={`sub-${catIdx}-${subIdx}`} index={subIdx}>
                                                                            {(provided) => (
                                                                                <div ref={provided.innerRef} {...provided.draggableProps} className="mb-4">
                                                                                    <Accordion
                                                                                        title={
                                                                                            <div className="flex items-center gap-2 w-full pr-2">
                                                                                                <div {...provided.dragHandleProps} className="text-gray-400 cursor-grab hover:text-gray-600 px-1" onClick={e => e.stopPropagation()}>
                                                                                                    <Icon icon="fa-solid fa-grip-vertical" />
                                                                                                </div>
                                                                                                <span className="text-sm font-bold text-gray-500 whitespace-nowrap bg-gray-100 px-2 py-1 rounded">子类Tab:</span>
                                                                                                <div onClick={e => e.stopPropagation()} className="flex-1">
                                                                                                    <Input
                                                                                                        value={sub.name}
                                                                                                        onChange={e => {
                                                                                                            const newSubs = [...cat.subCategories!];
                                                                                                            newSubs[subIdx] = { ...sub, name: e.target.value };
                                                                                                            updateCategory(catIdx, { ...cat, subCategories: newSubs });
                                                                                                        }}
                                                                                                        className="!py-1 !text-sm h-8"
                                                                                                    />
                                                                                                </div>
                                                                                                <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                                                                                    {sub.items.length} 链接
                                                                                                </span>
                                                                                            </div>
                                                                                        }
                                                                                        actions={
                                                                                            <Button variant="ghost" className="text-red-500 hover:bg-red-50" onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                showConfirm('确认删除', '删除此卐分类?', () => {
                                                                                                    hideConfirm();
                                                                                                    const newSubs = removeItem(cat.subCategories!, subIdx);
                                                                                                    updateCategory(catIdx, { ...cat, subCategories: newSubs });
                                                                                                });
                                                                                            }}><Icon icon="fa-solid fa-trash" /> 删除</Button>
                                                                                        }
                                                                                    >
                                                                                        <div className="space-y-2 pt-1">
                                                                                            <Droppable droppableId={`sub-${catIdx}-${subIdx}`} type="SUBCATEGORY_ITEM">
                                                                                                {(provided) => (
                                                                                                    <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                                                                                                        {sub.items.map((item, itemIdx) => (
                                                                                                            <Draggable key={item.id} draggableId={item.id} index={itemIdx}>
                                                                                                                {(provided) => (
                                                                                                                    <div ref={provided.innerRef} {...provided.draggableProps}>
                                                                                                                        <div className="flex items-start gap-2">
                                                                                                                            <div {...provided.dragHandleProps} className="mt-4 text-gray-400 cursor-grab hover:text-gray-600">
                                                                                                                                <Icon icon="fa-solid fa-grip-vertical" />
                                                                                                                            </div>
                                                                                                                            <div className="flex-1">
                                                                                                                                <LinkItemEditor
                                                                                                                                    item={item}
                                                                                                                                    onChange={(newItem) => {
                                                                                                                                        const newSubs = [...cat.subCategories!];
                                                                                                                                        newSubs[subIdx].items[itemIdx] = newItem;
                                                                                                                                        updateCategory(catIdx, { ...cat, subCategories: newSubs });
                                                                                                                                    }}
                                                                                                                                    onDelete={() => {
                                                                                                                                        const newSubs = [...cat.subCategories!];
                                                                                                                                        newSubs[subIdx].items = removeItem(newSubs[subIdx].items, itemIdx);
                                                                                                                                        updateCategory(catIdx, { ...cat, subCategories: newSubs });
                                                                                                                                    }}
                                                                                                                                    categories={config.categories}
                                                                                                                                    currentCategoryId={cat.id}
                                                                                                                                    currentSubCategoryName={sub.name}
                                                                                                                                    onCategoryMove={(targetCategoryId, targetSubCategoryName) => {
                                                                                                                                        moveLink(item, cat.id, sub.name, targetCategoryId, targetSubCategoryName);
                                                                                                                                    }}
                                                                                                                                    promoTabs={config.promo}
                                                                                                                                    enableCrossSectionMove={true}
                                                                                                                                    currentSection="category"
                                                                                                                                    onCrossSectionMove={(targetSection, targetId, targetSubId) => {
                                                                                                                                        handleCrossSectionMove(item, cat.id, sub.name, targetSection, targetId, targetSubId);
                                                                                                                                    }}
                                                                                                                                />
                                                                                                                            </div>
                                                                                                                        </div>
                                                                                                                    </div>
                                                                                                                )}
                                                                                                            </Draggable>
                                                                                                        ))}
                                                                                                        {provided.placeholder}
                                                                                                    </div>
                                                                                                )}
                                                                                            </Droppable>
                                                                                            <Button variant="secondary" size="sm" className="w-full border-dashed" onClick={() => {
                                                                                                const newSubs = [...cat.subCategories!];
                                                                                                newSubs[subIdx].items.push({ id: Date.now().toString(), title: '新链接', url: '#', description: '描述', icon: '' });
                                                                                                updateCategory(catIdx, { ...cat, subCategories: newSubs });
                                                                                            }}><Icon icon="fa-solid fa-plus" /> 添加链接</Button>
                                                                                        </div>
                                                                                    </Accordion>
                                                                                </div>
                                                                            )}
                                                                        </Draggable>
                                                                    ))}
                                                                    {provided.placeholder}
                                                                </div>
                                                            )}
                                                        </Droppable>
                                                        <Button variant="outline" className="w-full" onClick={() => {
                                                            const newSubs = [...cat.subCategories!, { name: '新子类', items: [] }];
                                                            updateCategory(catIdx, { ...cat, subCategories: newSubs });
                                                        }}>+ 添加子分类 Tab</Button>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        <Droppable droppableId={`cat-${catIdx}`} type="CATEGORY_ITEM">
                                                            {(provided) => (
                                                                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                                                                    {(cat.items || []).map((item, itemIdx) => (
                                                                        <Draggable key={item.id} draggableId={item.id} index={itemIdx}>
                                                                            {(provided) => (
                                                                                <div ref={provided.innerRef} {...provided.draggableProps}>
                                                                                    <div className="flex items-start gap-2">
                                                                                        <div {...provided.dragHandleProps} className="mt-4 text-gray-400 cursor-grab hover:text-gray-600">
                                                                                            <Icon icon="fa-solid fa-grip-vertical" />
                                                                                        </div>
                                                                                        <div className="flex-1">
                                                                                            <LinkItemEditor
                                                                                                item={item}
                                                                                                onChange={(newItem) => {
                                                                                                    const newItems = [...(cat.items || [])];
                                                                                                    newItems[itemIdx] = newItem;
                                                                                                    updateCategory(catIdx, { ...cat, items: newItems });
                                                                                                }}
                                                                                                onDelete={() => {
                                                                                                    const newItems = removeItem(cat.items || [], itemIdx);
                                                                                                    updateCategory(catIdx, { ...cat, items: newItems });
                                                                                                }}
                                                                                                categories={config.categories}
                                                                                                currentCategoryId={cat.id}
                                                                                                onCategoryMove={(targetCategoryId, targetSubCategoryName) => {
                                                                                                    moveLink(item, cat.id, undefined, targetCategoryId, targetSubCategoryName);
                                                                                                }}
                                                                                                promoTabs={config.promo}
                                                                                                enableCrossSectionMove={true}
                                                                                                currentSection="category"
                                                                                                onCrossSectionMove={(targetSection, targetId, targetSubId) => {
                                                                                                    handleCrossSectionMove(item, cat.id, undefined, targetSection, targetId, targetSubId);
                                                                                                }}
                                                                                            />
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </Draggable>
                                                                    ))}
                                                                    {provided.placeholder}
                                                                </div>
                                                            )}
                                                        </Droppable>
                                                        <Button variant="secondary" size="sm" className="w-full border-dashed" onClick={() => {
                                                            const newItems = [...(cat.items || []), { id: Date.now().toString(), title: '新链接', url: '#', description: '描述', icon: '' }];
                                                            updateCategory(catIdx, { ...cat, items: newItems });
                                                        }}><Icon icon="fa-solid fa-plus" /> 添加链接</Button>
                                                    </div>
                                                )}
                                            </div>
                                        </Accordion>
                                    </div>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>

            {/* 确认对话框 */}
            {confirmDialog && (
                <ConfirmDialog
                    isOpen={confirmDialog.isOpen}
                    title={confirmDialog.title}
                    message={confirmDialog.message}
                    onConfirm={confirmDialog.onConfirm}
                    onCancel={hideConfirm}
                />
            )}
        </div>
    );
};
