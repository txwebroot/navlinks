import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { AdminTabProps } from '../types';
import { Icon } from '@/src/shared/components/common/Icon';
import { Label, Input } from '../ui/AdminInput';
import { Button } from '../ui/AdminButton';
import { Accordion } from '../ui/Accordion';
import { removeItem } from '../utils';
import { useDialogs } from '@/src/shared/hooks/useDialogs';
import { ConfirmDialog } from '@/src/shared/components/common/ConfirmDialog';

export const TopNavSettings: React.FC<AdminTabProps> = ({ config, update }) => {
    const { confirmDialog, showConfirm, hideConfirm } = useDialogs();
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h3 className="text-lg font-bold text-gray-800">顶部导航菜单</h3>
                <Button onClick={() => update(c => ({ ...c, topNav: [...(c.topNav || []), { id: Date.now().toString(), title: '新菜单', url: '#', icon: 'fa-solid fa-link', children: [] }] }))}>
                    <Icon icon="fa-solid fa-plus" /> 添加菜单
                </Button>
            </div>
            <div className="space-y-3">
                <Droppable droppableId="top-nav" type="TOP_NAV_ITEM">
                    {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
                            {(config.topNav || []).map((item, idx) => (
                                <Draggable key={item.id} draggableId={item.id} index={idx}>
                                    {(provided) => (
                                        <div ref={provided.innerRef} {...provided.draggableProps}>
                                            <Accordion
                                                title={
                                                    <div className="flex items-center gap-2">
                                                        <div {...provided.dragHandleProps} className="text-gray-400 cursor-grab hover:text-gray-600 px-1" onClick={e => e.stopPropagation()}>
                                                            <Icon icon="fa-solid fa-grip-vertical" />
                                                        </div>
                                                        <span>{item.title}</span>
                                                    </div>
                                                }
                                                actions={
                                                    <Button variant="ghost" className="!px-2 text-red-500 hover:bg-red-50" onClick={(e) => {
                                                        e.stopPropagation();
                                                        showConfirm('确认删除', '删除此菜单?', () => {
                                                            hideConfirm();
                                                            update(c => ({ ...c, topNav: removeItem(c.topNav, idx) }));
                                                        });
                                                    }}><Icon icon="fa-solid fa-trash" /></Button>
                                                }
                                            >
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-12 gap-3 bg-gray-50 p-3 rounded border border-gray-200">
                                                        <div className="col-span-3"><Label>标题</Label><Input value={item.title} onChange={e => { const n = [...config.topNav]; n[idx].title = e.target.value; update(c => ({ ...c, topNav: n })) }} /></div>
                                                        <div className="col-span-5"><Label>链接</Label><Input value={item.url} onChange={e => { const n = [...config.topNav]; n[idx].url = e.target.value; update(c => ({ ...c, topNav: n })) }} /></div>
                                                        <div className="col-span-4"><Label>图标</Label><div className="relative"><Icon icon={item.icon} className="absolute left-3 top-2.5 text-gray-400" /><Input className="pl-8" value={item.icon} onChange={e => { const n = [...config.topNav]; n[idx].icon = e.target.value; update(c => ({ ...c, topNav: n })) }} /></div></div>
                                                    </div>
                                                    <div className="flex items-center gap-2 px-3 py-2 bg-white rounded">
                                                        <input
                                                            type="checkbox"
                                                            id={`nav-hidden-${item.id}`}
                                                            checked={item.hidden === true}
                                                            onChange={(e) => { const n = [...config.topNav]; n[idx].hidden = e.target.checked; update(c => ({ ...c, topNav: n })) }}
                                                            className="w-4 h-4 text-[var(--theme-primary)] rounded border-gray-300 focus:ring-[var(--theme-primary)] cursor-pointer"
                                                        />
                                                        <Label className="!mb-0 cursor-pointer select-none" htmlFor={`nav-hidden-${item.id}`}>未登录时隐藏此导航项</Label>
                                                    </div>

                                                    {/* Submenu Editor */}
                                                    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                                        <div className="flex justify-between items-center mb-3">
                                                            <Label className="!mb-0">二级子菜单</Label>
                                                            <Button size="sm" variant="secondary" onClick={() => {
                                                                const n = [...config.topNav];
                                                                if (!n[idx].children) n[idx].children = [];
                                                                n[idx].children!.push({ id: Date.now().toString(), title: '子项', url: '#', icon: 'fa-solid fa-caret-right' });
                                                                update(c => ({ ...c, topNav: n }));
                                                            }}>+ 添加子项</Button>
                                                        </div>
                                                        <Droppable droppableId={`subnav-${idx}`} type="TOP_NAV_SUB_ITEM">
                                                            {(provided) => (
                                                                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                                                                    {item.children?.map((child, cIdx) => (
                                                                        <Draggable key={child.id} draggableId={child.id} index={cIdx}>
                                                                            {(provided) => (
                                                                                <div ref={provided.innerRef} {...provided.draggableProps} className="flex gap-2 items-center bg-white p-2 rounded border border-gray-100">
                                                                                    <div {...provided.dragHandleProps} className="text-gray-400 cursor-grab hover:text-gray-600 px-1">
                                                                                        <Icon icon="fa-solid fa-grip-vertical" />
                                                                                    </div>
                                                                                    <Input className="w-32" value={child.title} onChange={e => {
                                                                                        const n = [...config.topNav];
                                                                                        n[idx].children![cIdx].title = e.target.value;
                                                                                        update(c => ({ ...c, topNav: n }));
                                                                                    }} placeholder="标题" />
                                                                                    <Input className="flex-1" value={child.url} onChange={e => {
                                                                                        const n = [...config.topNav];
                                                                                        n[idx].children![cIdx].url = e.target.value;
                                                                                        update(c => ({ ...c, topNav: n }));
                                                                                    }} placeholder="链接" />
                                                                                    <div className="w-32 relative">
                                                                                        <Icon icon={child.icon} className="absolute left-2 top-2.5 text-xs text-gray-400" />
                                                                                        <Input className="pl-6" value={child.icon} onChange={e => {
                                                                                            const n = [...config.topNav];
                                                                                            n[idx].children![cIdx].icon = e.target.value;
                                                                                            update(c => ({ ...c, topNav: n }));
                                                                                        }} placeholder="图标" />
                                                                                    </div>
                                                                                    <button onClick={() => {
                                                                                        const n = [...config.topNav];
                                                                                        n[idx].children = removeItem(n[idx].children!, cIdx);
                                                                                        update(c => ({ ...c, topNav: n }));
                                                                                    }} className="text-red-400 hover:text-red-600 w-8 h-8 flex items-center justify-center rounded hover:bg-red-50"><Icon icon="fa-solid fa-trash" /></button>
                                                                                </div>
                                                                            )}
                                                                        </Draggable>
                                                                    ))}
                                                                    {provided.placeholder}
                                                                    {(!item.children || item.children.length === 0) && <div className="text-xs text-gray-400 text-center py-2 border border-dashed rounded">暂无二级菜单</div>}
                                                                </div>
                                                            )}
                                                        </Droppable>
                                                    </div>
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
            </div>

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
