import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { AdminTabProps } from '../types';
import { Icon } from '@/src/shared/components/common/Icon';
import { useDialogs } from '@/src/shared/hooks/useDialogs';
import { AlertDialog } from '@/src/shared/components/common/AlertDialog';
import { Label, Input, TextArea } from '../ui/AdminInput';
import { Button } from '../ui/AdminButton';

export const SidebarSettings: React.FC<AdminTabProps> = ({ config, update }) => {
    const { alertDialog, showAlert, hideAlert } = useDialogs();
    const currentGithubConfig = config.rightSidebar.githubTrending || { title: 'Github 榜单', apiUrl: 'https://api.github.com/search/repositories', webUrl: 'https://github.com/trending' };
    const hotTopics = config.rightSidebar.hotTopics || [];

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showAlert('文件太大', '图片大小不能超过 5MB', 'warning');
                return;
            }
            const formData = new FormData();
            formData.append('image', file);

            try {
                const token = localStorage.getItem('auth_token');
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
                const data = await response.json();
                if (data.url) {
                    update(c => ({
                        ...c,
                        rightSidebar: {
                            ...c.rightSidebar,
                            profile: {
                                ...c.rightSidebar.profile,
                                avatarUrl: data.url
                            }
                        }
                    }));
                } else {
                    showAlert('上传失败', data.error || '未知错误', 'error');
                }
            } catch (err) {
                console.error('Upload failed:', err);
                showAlert('上传失败', '请重试', 'error');
            }
            e.target.value = '';
        }
    };

    return (
        <div className="space-y-8">
            {/* Profile Settings */}
            <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">个人信息卡片</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div><Label>卡片标题</Label><Input value={config.rightSidebar.profile.title} onChange={e => update(c => ({ ...c, rightSidebar: { ...c.rightSidebar, profile: { ...c.rightSidebar.profile, title: e.target.value } } }))} /></div>
                    <div><Label>Logo 文字</Label><Input value={config.rightSidebar.profile.logoText} onChange={e => update(c => ({ ...c, rightSidebar: { ...c.rightSidebar, profile: { ...c.rightSidebar.profile, logoText: e.target.value } } }))} /></div>
                    <div className="col-span-2"><Label>描述文本</Label><TextArea value={config.rightSidebar.profile.description} onChange={e => update(c => ({ ...c, rightSidebar: { ...c.rightSidebar, profile: { ...c.rightSidebar.profile, description: e.target.value } } }))} /></div>
                </div>

                {/* New Avatar & Background Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div>
                        <Label>头像设置 (为空则显示Logo文字)</Label>
                        <div className="space-y-2">
                            <Input value={config.rightSidebar.profile.avatarUrl || ''} onChange={e => update(c => ({ ...c, rightSidebar: { ...c.rightSidebar, profile: { ...c.rightSidebar.profile, avatarUrl: e.target.value } } }))} placeholder="头像 URL" />
                            <div className="flex items-center gap-2">
                                <label className="cursor-pointer bg-white border border-gray-300 hover:border-[var(--theme-primary)] hover:text-[var(--theme-primary)] text-gray-600 px-3 py-1.5 rounded text-xs font-medium transition-colors shadow-sm flex items-center gap-1">
                                    <Icon icon="fa-solid fa-cloud-arrow-up" /> 上传头像
                                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                                </label>
                                {config.rightSidebar.profile.avatarUrl && <span className="text-xs text-green-600"><Icon icon="fa-solid fa-check" /> 已设置</span>}
                            </div>
                        </div>
                    </div>
                    <div>
                        <Label>卡片背景</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                type="color"
                                className="w-10 h-10 p-1"
                                value={config.rightSidebar.profile.customBackgroundColor || '#a18cd1'}
                                onChange={e => update(c => ({ ...c, rightSidebar: { ...c.rightSidebar, profile: { ...c.rightSidebar.profile, customBackgroundColor: e.target.value } } }))}
                            />
                            <Input
                                value={config.rightSidebar.profile.customBackgroundColor || ''}
                                onChange={e => update(c => ({ ...c, rightSidebar: { ...c.rightSidebar, profile: { ...c.rightSidebar.profile, customBackgroundColor: e.target.value } } }))}
                                placeholder="默认渐变 (留空)"
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">留空则使用默认紫粉色渐变。</p>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <div className="flex justify-between items-center mb-3">
                        <Label className="!mb-0 font-bold text-gray-700">底部联系方式 (社交图标)</Label>
                        <Button size="sm" variant="secondary" onClick={() => {
                            const n = [...(config.rightSidebar.profile.socials || [])];
                            n.push({ icon: 'fa-solid fa-link', url: '#' });
                            update(c => ({ ...c, rightSidebar: { ...c.rightSidebar, profile: { ...c.rightSidebar.profile, socials: n } } }));
                        }}>+ 添加图标</Button>
                    </div>
                    <div className="space-y-3">
                        <Droppable droppableId="social-icons" type="SOCIAL_ITEM">
                            {(provided) => (
                                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
                                    {(config.rightSidebar.profile.socials || []).map((social, idx) => (
                                        <Draggable key={social.url + idx} draggableId={social.url + idx} index={idx}>
                                            {(provided) => (
                                                <div ref={provided.innerRef} {...provided.draggableProps} className="flex gap-3 items-center">
                                                    <div {...provided.dragHandleProps} className="text-gray-400 cursor-grab hover:text-gray-600 px-1">
                                                        <Icon icon="fa-solid fa-grip-vertical" />
                                                    </div>
                                                    <div className="relative w-1/3">
                                                        <Icon icon={social.icon} className="absolute left-3 top-2.5 text-gray-400" />
                                                        <Input
                                                            className="pl-9"
                                                            value={social.icon}
                                                            onChange={e => {
                                                                const n = [...config.rightSidebar.profile.socials];
                                                                n[idx].icon = e.target.value;
                                                                update(c => ({ ...c, rightSidebar: { ...c.rightSidebar, profile: { ...c.rightSidebar.profile, socials: n } } }));
                                                            }}
                                                            placeholder="图标 class"
                                                        />
                                                    </div>
                                                    <Input
                                                        className="flex-1"
                                                        value={social.url}
                                                        onChange={e => {
                                                            const n = [...config.rightSidebar.profile.socials];
                                                            n[idx].url = e.target.value;
                                                            update(c => ({ ...c, rightSidebar: { ...c.rightSidebar, profile: { ...c.rightSidebar.profile, socials: n } } }));
                                                        }}
                                                        placeholder="跳转链接 URL"
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            const n = [...config.rightSidebar.profile.socials];
                                                            n.splice(idx, 1);
                                                            update(c => ({ ...c, rightSidebar: { ...c.rightSidebar, profile: { ...c.rightSidebar.profile, socials: n } } }));
                                                        }}
                                                        className="text-gray-400 hover:text-red-500 px-2 w-8 h-8 flex items-center justify-center rounded hover:bg-red-50"
                                                    >
                                                        <Icon icon="fa-solid fa-trash" />
                                                    </button>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                        {(config.rightSidebar.profile.socials || []).length === 0 && (
                            <div className="text-center text-gray-400 text-xs py-2">暂无社交图标</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Hot Topics Config */}
            <div className="mt-8">
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">自动热点板块配置</h3>
                <p className="text-xs text-gray-400 mb-4">配置3个热点Tab，每个Tab通过 API 自动获取数据。</p>

                <Droppable droppableId="hot-topics" type="HOT_TOPIC_ITEM">
                    {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-4">
                            {hotTopics.map((topic, idx) => (
                                <Draggable key={topic.id} draggableId={topic.id} index={idx}>
                                    {(provided) => (
                                        <div ref={provided.innerRef} {...provided.draggableProps} className="bg-gray-50 p-4 rounded-lg border border-gray-100 relative">
                                            <div {...provided.dragHandleProps} className="absolute right-4 top-4 text-gray-400 cursor-grab hover:text-gray-600 p-2">
                                                <Icon icon="fa-solid fa-grip-vertical" />
                                            </div>
                                            <Label className="text-[var(--theme-primary)] font-bold mb-2">Tab {idx + 1}</Label>
                                            <div className="space-y-3">
                                                <div>
                                                    <Label>Tab 标题</Label>
                                                    <Input
                                                        value={topic.name}
                                                        onChange={e => {
                                                            const n = [...hotTopics];
                                                            n[idx].name = e.target.value;
                                                            update(c => ({ ...c, rightSidebar: { ...c.rightSidebar, hotTopics: n } }));
                                                        }}
                                                        placeholder="例如：百度热点"
                                                    />
                                                </div>
                                                <div>
                                                    <Label>API 接口 URL</Label>
                                                    <Input
                                                        value={topic.apiUrl}
                                                        onChange={e => {
                                                            const n = [...hotTopics];
                                                            n[idx].apiUrl = e.target.value;
                                                            update(c => ({ ...c, rightSidebar: { ...c.rightSidebar, hotTopics: n } }));
                                                        }}
                                                        placeholder="https://api.example.com/list"
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Web 跳转 URL (查看更多)</Label>
                                                    <Input
                                                        value={topic.webUrl}
                                                        onChange={e => {
                                                            const n = [...hotTopics];
                                                            n[idx].webUrl = e.target.value;
                                                            update(c => ({ ...c, rightSidebar: { ...c.rightSidebar, hotTopics: n } }));
                                                        }}
                                                        placeholder="https://www.baidu.com"
                                                    />
                                                </div>
                                                <div>
                                                    <Label>显示数量</Label>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        max="20"
                                                        value={topic.limit || 5}
                                                        onChange={e => {
                                                            const n = [...hotTopics];
                                                            n[idx].limit = parseInt(e.target.value) || 5;
                                                            update(c => ({ ...c, rightSidebar: { ...c.rightSidebar, hotTopics: n } }));
                                                        }}
                                                        placeholder="5"
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
            </div>

            {/* Github Trending Config */}
            <div className="border-t border-gray-100 pt-6 mt-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Github 榜单配置</h3>
                <div className="space-y-4">
                    <div>
                        <Label>板块标题</Label>
                        <Input
                            value={currentGithubConfig.title}
                            onChange={e => update(c => ({
                                ...c,
                                rightSidebar: {
                                    ...c.rightSidebar,
                                    githubTrending: { ...currentGithubConfig, title: e.target.value }
                                }
                            }))}
                        />
                    </div>
                    <div>
                        <Label>API 接口地址</Label>
                        <Input
                            value={currentGithubConfig.apiUrl}
                            onChange={e => update(c => ({
                                ...c,
                                rightSidebar: {
                                    ...c.rightSidebar,
                                    githubTrending: { ...currentGithubConfig, apiUrl: e.target.value }
                                }
                            }))}
                            placeholder="https://api.github.com/search/repositories"
                        />
                    </div>
                    <div>
                        <Label>Web 跳转地址</Label>
                        <Input
                            value={currentGithubConfig.webUrl}
                            onChange={e => update(c => ({
                                ...c,
                                rightSidebar: {
                                    ...c.rightSidebar,
                                    githubTrending: { ...currentGithubConfig, webUrl: e.target.value }
                                }
                            }))}
                            placeholder="https://github.com/trending"
                        />
                    </div>
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
