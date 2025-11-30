import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { AdminTabProps } from '../types';
import { Icon } from '@/src/shared/components/common/Icon';
import { Label, Input } from '../ui/AdminInput';
import { Button } from '../ui/AdminButton';
import { removeItem } from '../utils';

export const HeroSettings: React.FC<AdminTabProps> = ({ config, update }) => {
    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">首屏文案</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><Label>主标题</Label><Input value={config.hero.title} onChange={e => update(c => ({ ...c, hero: { ...c.hero, title: e.target.value } }))} /></div>
                    <div><Label>副标题</Label><Input value={config.hero.subtitle} onChange={e => update(c => ({ ...c, hero: { ...c.hero, subtitle: e.target.value } }))} /></div>
                </div>
            </div>

            <div className="mt-6 border-t border-gray-100 pt-6">
                <div className="flex justify-between mb-4"><h3 className="text-lg font-bold">热词配置</h3><Button size="sm" onClick={() => update(c => ({ ...c, hero: { ...c.hero, hotSearchLinks: [...(c.hero.hotSearchLinks || []), { title: '新热词', url: '#' }] } }))}>添加</Button></div>
                <Droppable droppableId="hero-hot-search" type="HERO_HOT_SEARCH_ITEM">
                    {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
                            {config.hero.hotSearchLinks?.map((link, idx) => (
                                <Draggable key={link.url + idx} draggableId={link.url + idx} index={idx}>
                                    {(provided) => (
                                        <div ref={provided.innerRef} {...provided.draggableProps} className="flex gap-3 items-center bg-gray-50 p-3 rounded border border-gray-200">
                                            <div {...provided.dragHandleProps} className="text-gray-400 cursor-grab hover:text-gray-600 px-1">
                                                <Icon icon="fa-solid fa-grip-vertical" />
                                            </div>
                                            <Input className="w-1/3" value={link.title} onChange={e => { const n = [...(config.hero.hotSearchLinks || [])]; n[idx].title = e.target.value; update(c => ({ ...c, hero: { ...c.hero, hotSearchLinks: n } })) }} />
                                            <Input className="flex-1" value={link.url} onChange={e => { const n = [...(config.hero.hotSearchLinks || [])]; n[idx].url = e.target.value; update(c => ({ ...c, hero: { ...c.hero, hotSearchLinks: n } })) }} />
                                            <button onClick={() => { const n = [...(config.hero.hotSearchLinks || [])]; n.splice(idx, 1); update(c => ({ ...c, hero: { ...c.hero, hotSearchLinks: n } })) }} className="text-gray-400 hover:text-red-500 px-2"><Icon icon="fa-solid fa-trash" /></button>
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </div>
            <div>
                <div className="flex justify-between mt-6 mb-4 border-b pb-2"><h3 className="text-lg font-bold">搜索引擎</h3><Button size="sm" onClick={() => update(c => ({ ...c, searchEngines: [...c.searchEngines, { id: Date.now().toString(), name: '新引擎', urlPattern: '', placeholder: '' }] }))}>添加</Button></div>
                <Droppable droppableId="search-engines" type="SEARCH_ENGINE_ITEM">
                    {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
                            {config.searchEngines.map((se, idx) => (
                                <Draggable key={se.id} draggableId={se.id} index={idx}>
                                    {(provided) => (
                                        <div ref={provided.innerRef} {...provided.draggableProps} className="flex gap-3 items-center bg-gray-50 p-3 rounded border border-gray-200">
                                            <div {...provided.dragHandleProps} className="text-gray-400 cursor-grab hover:text-gray-600 px-1">
                                                <Icon icon="fa-solid fa-grip-vertical" />
                                            </div>
                                            <Input className="w-32" value={se.name} onChange={e => { const n = [...config.searchEngines]; n[idx].name = e.target.value; update(c => ({ ...c, searchEngines: n })) }} />
                                            <Input className="flex-1" value={se.urlPattern} onChange={e => { const n = [...config.searchEngines]; n[idx].urlPattern = e.target.value; update(c => ({ ...c, searchEngines: n })) }} />
                                            <button onClick={() => update(c => ({ ...c, searchEngines: removeItem(c.searchEngines, idx) }))} className="text-gray-400 hover:text-red-500 px-2"><Icon icon="fa-solid fa-trash" /></button>
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </div>

            {/* Search Keyboard Shortcut */}
            <div className="mt-6 border-t border-gray-100 pt-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="text-lg font-bold text-blue-800 mb-3">搜索快捷键</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label>快捷键组合</Label>
                        <Input
                            value={config.searchShortcut || 'Cmd+K'}
                            onChange={e => update(c => ({ ...c, searchShortcut: e.target.value }))}
                            placeholder="例如: Cmd+K 或 Ctrl+Shift+F"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            点击导航栏搜索图标或按快捷键即可打开全局搜索
                        </p>
                    </div>
                    <div className="bg-white p-3 rounded border border-gray-200">
                        <Label className="!mb-2">常用组合键</Label>
                        <div className="space-y-1 text-xs text-gray-600">
                            <p>• <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">Cmd+K</kbd> 默认(Mac自动转Ctrl)</p>
                            <p>• <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">Ctrl+K</kbd> Windows通用</p>
                            <p>• <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">Ctrl+Shift+F</kbd> 多键组合</p>
                            <p className="text-gray-400 italic mt-2">支持: Cmd, Ctrl, Shift, Alt + 任意字母/数字</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
