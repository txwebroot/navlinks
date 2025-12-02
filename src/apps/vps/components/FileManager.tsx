import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { Icon } from '@/src/shared/components/common/Icon';
import { ConfirmModal } from '@/src/shared/components/common/ConfirmModal';

interface FileManagerProps {
    socket: Socket | null;
    isConnected?: boolean;
}

interface FileItem {
    name: string;
    longname: string;
    attrs: any;
    isDirectory: boolean;
}

export default function FileManager({ socket, isConnected = false }: FileManagerProps) {
    const [currentPath, setCurrentPath] = useState('/root');
    const currentPathRef = useRef('/root'); // Ref to track current path for event handlers
    const [files, setFiles] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Editor State
    const [editingFile, setEditingFile] = useState<{ path: string; content: string } | null>(null);
    const [editorContent, setEditorContent] = useState('');
    const [saving, setSaving] = useState(false);

    // Update ref when state changes
    useEffect(() => {
        currentPathRef.current = currentPath;
    }, [currentPath]);

    useEffect(() => {
        if (!socket) return;

        const onList = (data: { path: string; files: FileItem[] }) => {
            // Handle main file list update
            if (data.path === currentPathRef.current) {
                const sorted = data.files.sort((a, b) => {
                    if (a.isDirectory && !b.isDirectory) return -1;
                    if (!a.isDirectory && b.isDirectory) return 1;
                    return a.name.localeCompare(b.name);
                });
                setFiles(sorted);
                setLoading(false);
            }

            // Handle move modal file list update
            if (moveModalRef.current.isOpen && data.path === moveModalRef.current.currentPath) {
                const sorted = data.files
                    .filter(f => f.isDirectory) // Only show directories
                    .sort((a, b) => a.name.localeCompare(b.name));

                setMoveModal(prev => ({ ...prev, files: sorted, loading: false }));
            }
        };

        const onHome = (path: string) => {
            setCurrentPath(path);
            // Ref will be updated by the other effect
        };

        const onError = (msg: string) => {
            // Ignore "SSH not connected" as we might be waiting for auth
            if (msg === 'SSH not connected') {
                console.log('[FileManager] SSH not connected yet, waiting...');
                return;
            }
            setError(msg);
            setLoading(false);
            setSaving(false);
        };

        const onRead = (data: { path: string; content: string }) => {
            setEditingFile({ path: data.path, content: data.content });
            setEditorContent(data.content);
            setLoading(false);
        };

        const onDownload = (data: { path: string; content: ArrayBuffer; filename: string }) => {
            const blob = new Blob([data.content]);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = data.filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            setLoading(false);
        };

        const onWriteSuccess = (path: string) => {
            setSaving(false);
            setEditingFile(null); // Close editor
            setLoading(false); // Ensure loading is cleared even if refresh fails
            setUploadProgress(null);
            refresh();
        };

        const onActionSuccess = (data: { action: string; path: string }) => {
            setLoading(false); // Ensure loading is cleared
            refresh();
        };

        socket.on('sftp:list:data', onList);
        socket.on('sftp:home:data', onHome);
        socket.on('sftp:error', onError);
        socket.on('sftp:read:data', onRead);
        socket.on('sftp:download:data', onDownload);
        socket.on('sftp:write:success', onWriteSuccess);
        socket.on('sftp:action:success', onActionSuccess);

        // Listen for SSH ready to trigger initial load
        socket.on('ssh:ready', () => {
            console.log('[FileManager] SSH Ready, refreshing...');
            refresh();
        });

        // Initial load when connected
        if (isConnected) {
            // Try to load, but don't error if SSH isn't ready yet
            socket.emit('sftp:home');
        }

        return () => {
            socket.off('sftp:list:data', onList);
            socket.off('sftp:home:data', onHome);
            socket.off('sftp:error', onError);
            socket.off('sftp:read:data', onRead);
            socket.off('sftp:download:data', onDownload);
            socket.off('sftp:write:success', onWriteSuccess);
            socket.off('sftp:action:success', onActionSuccess);
        };
    }, [socket, isConnected]); // Remove currentPath dependency to avoid loop, handle list in separate effect or carefully

    // Separate effect for listing when path changes
    useEffect(() => {
        refresh();
    }, [currentPath, socket, isConnected]);

    const refresh = () => {
        if (socket && currentPathRef.current && isConnected) {
            setLoading(true);
            setError(null);
            socket.emit('sftp:list', currentPathRef.current);
        }
    };

    const handleNavigate = (path: string) => {
        setCurrentPath(path);
    };

    const handleUp = () => {
        const parts = currentPath.split('/').filter(Boolean);
        parts.pop();
        const newPath = '/' + parts.join('/');
        setCurrentPath(newPath || '/');
    };

    const handleItemClick = (item: FileItem) => {
        if (item.isDirectory) {
            const newPath = currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`;
            setCurrentPath(newPath);
        } else {
            // Open file for editing
            if (socket) {
                setLoading(true);
                const filePath = currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`;
                socket.emit('sftp:read', filePath);
            }
        }
    };

    const handleDownload = (e: React.MouseEvent, item: FileItem) => {
        e.stopPropagation();
        if (socket) {
            setLoading(true);
            const filePath = currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`;
            socket.emit('sftp:download', filePath);
        }
    };

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const [uploadProgress, setUploadProgress] = useState<number | null>(null);

    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: FileItem } | null>(null);
    const [renameModal, setRenameModal] = useState<{ isOpen: boolean; item: FileItem | null; newName: string }>({ isOpen: false, item: null, newName: '' });
    const [moveModal, setMoveModal] = useState<{ isOpen: boolean; item: FileItem | null; currentPath: string; files: FileItem[]; loading: boolean }>({
        isOpen: false,
        item: null,
        currentPath: '/root',
        files: [],
        loading: false
    });
    const moveModalRef = useRef(moveModal); // Ref for move modal state
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; item: FileItem | null }>({ isOpen: false, item: null });

    // Update refs
    useEffect(() => {
        currentPathRef.current = currentPath;
    }, [currentPath]);

    useEffect(() => {
        moveModalRef.current = moveModal;
    }, [moveModal]);

    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    // ... (keep existing effects)

    const uploadFileChunked = async (file: File, path: string) => {
        if (!socket) return;

        setLoading(true);
        setUploadProgress(0);

        const CHUNK_SIZE = 1024 * 1024; // 1MB chunks
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

        try {
            // 1. Start Upload
            await new Promise<void>((resolve, reject) => {
                socket.emit('sftp:upload:start', { path });
                const onAck = (p: string) => {
                    if (p === path) {
                        socket.off('sftp:upload:start:ack', onAck);
                        socket.off('sftp:error', onError);
                        resolve();
                    }
                };
                const onError = (msg: string) => {
                    socket.off('sftp:upload:start:ack', onAck);
                    socket.off('sftp:error', onError);
                    reject(new Error(msg));
                };
                socket.on('sftp:upload:start:ack', onAck);
                socket.on('sftp:error', onError);
            });

            // 2. Upload Chunks
            for (let i = 0; i < totalChunks; i++) {
                const start = i * CHUNK_SIZE;
                const end = Math.min(start + CHUNK_SIZE, file.size);
                const chunk = file.slice(start, end);
                const buffer = await chunk.arrayBuffer();

                await new Promise<void>((resolve, reject) => {
                    socket.emit('sftp:upload:chunk', { path, content: buffer, position: start });
                    const onAck = (p: string) => {
                        if (p === path) {
                            socket.off('sftp:upload:chunk:ack', onAck);
                            socket.off('sftp:error', onError);
                            resolve();
                        }
                    };
                    const onError = (msg: string) => {
                        socket.off('sftp:upload:chunk:ack', onAck);
                        socket.off('sftp:error', onError);
                        reject(new Error(msg));
                    };
                    socket.on('sftp:upload:chunk:ack', onAck);
                    socket.on('sftp:error', onError);
                });

                setUploadProgress(Math.round(((i + 1) / totalChunks) * 100));
            }

            // 3. Finish Upload
            socket.emit('sftp:upload:finish', { path });

        } catch (err: any) {
            console.error('Upload failed:', err);
            setError(err.message || 'Upload failed');
            setLoading(false);
            setUploadProgress(null);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !socket) return;

        const filePath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
        uploadFileChunked(file, filePath);

        // Reset input
        e.target.value = '';
    };

    const handleSaveFile = () => {
        if (socket && editingFile) {
            setSaving(true);
            socket.emit('sftp:write', { path: editingFile.path, content: editorContent });
        }
    };

    const handleDelete = (e: React.MouseEvent, item: FileItem) => {
        e.stopPropagation();
        setDeleteModal({ isOpen: true, item });
    };

    const handleDeleteConfirm = () => {
        if (socket && deleteModal.item) {
            const filePath = currentPath === '/' ? `/${deleteModal.item.name}` : `${currentPath}/${deleteModal.item.name}`;
            socket.emit('sftp:delete', filePath);
            setDeleteModal({ isOpen: false, item: null });
        }
    };

    const handleContextMenu = (e: React.MouseEvent, item: FileItem) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, item });
    };

    const handleRenameSubmit = () => {
        if (!socket || !renameModal.item) return;
        const oldPath = currentPath === '/' ? `/${renameModal.item.name}` : `${currentPath}/${renameModal.item.name}`;
        const newPath = currentPath === '/' ? `/${renameModal.newName}` : `${currentPath}/${renameModal.newName}`;

        setLoading(true);
        socket.emit('sftp:rename', { oldPath, newPath });
        setRenameModal({ ...renameModal, isOpen: false });
    };

    const handleMoveSubmit = () => {
        if (!socket || !moveModal.item) return;
        const oldPath = currentPath === '/' ? `/${moveModal.item.name}` : `${currentPath}/${moveModal.item.name}`;
        const newPath = moveModal.currentPath === '/' ? `/${moveModal.item.name}` : `${moveModal.currentPath}/${moveModal.item.name}`;

        setLoading(true);
        socket.emit('sftp:rename', { oldPath, newPath });
        setMoveModal({ ...moveModal, isOpen: false });
    };

    const handleMoveNavigate = (path: string) => {
        if (!socket) return;
        setMoveModal(prev => ({ ...prev, currentPath: path, loading: true }));
        socket.emit('sftp:list', path);
    };

    const handleMoveUp = () => {
        const parts = moveModal.currentPath.split('/').filter(Boolean);
        parts.pop();
        const newPath = '/' + parts.join('/');
        handleMoveNavigate(newPath || '/');
    };

    const handleContextAction = (action: string) => {
        if (!contextMenu) return;
        const { item } = contextMenu;

        switch (action) {
            case 'open':
                handleItemClick(item);
                break;
            case 'rename':
                setRenameModal({ isOpen: true, item, newName: item.name });
                break;
            case 'move':
                // Initialize move modal with current path
                setMoveModal({
                    isOpen: true,
                    item,
                    currentPath: currentPath,
                    files: [],
                    loading: true
                });
                if (socket) {
                    socket.emit('sftp:list', currentPath);
                }
                break;
            case 'download':
                handleDownload({ stopPropagation: () => { } } as React.MouseEvent, item);
                break;
            case 'delete':
                handleDelete({ stopPropagation: () => { } } as React.MouseEvent, item);
                break;
        }
        setContextMenu(null);
    };

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Toolbar */}
            <div className="p-2 border-b border-gray-200 flex items-center gap-2 bg-gray-50">
                <button onClick={handleUp} className="p-1.5 hover:bg-gray-200 rounded text-gray-600" disabled={currentPath === '/'}>
                    <Icon icon="fa-solid fa-arrow-up" />
                </button>
                <div className="flex-1 px-3 py-1.5 bg-white border border-gray-300 rounded text-sm font-mono text-gray-700 truncate">
                    {currentPath}
                </div>
                <button onClick={refresh} className="p-1.5 hover:bg-gray-200 rounded text-gray-600" title="Refresh">
                    <Icon icon="fa-solid fa-sync" className={loading ? 'animate-spin' : ''} />
                </button>
                <button onClick={handleUploadClick} className="p-1.5 hover:bg-gray-200 rounded text-gray-600" title="Upload File">
                    <Icon icon="fa-solid fa-upload" />
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                />
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 text-red-600 px-4 py-2 text-sm border-b border-red-100">
                    {error}
                </div>
            )}

            {/* File List */}
            <div className="flex-1 overflow-y-auto relative">

                {/* Upload Progress Overlay */}
                {uploadProgress !== null && (
                    <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-4 text-blue-600 w-64">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                ></div>
                            </div>
                            <span className="text-sm font-medium">Uploading... {uploadProgress}%</span>
                        </div>
                    </div>
                )}

                {/* Loading Spinner Overlay */}
                {loading && uploadProgress === null && (
                    <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2 text-blue-600">
                            <Icon icon="fa-solid fa-spinner" className="animate-spin text-2xl" />
                            <span className="text-sm font-medium">Loading...</span>
                        </div>
                    </div>
                )}

                <table className={`w-full text-sm text-left ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0">
                        <tr>
                            <th className="px-4 py-2">Name</th>
                            <th className="px-4 py-2 w-24 hidden md:table-cell">Size</th>
                            <th className="px-4 py-2 w-32 hidden md:table-cell">Permissions</th>
                            <th className="px-4 py-2 w-20"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {files.length === 0 && !loading && (
                            <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                                    No files found
                                </td>
                            </tr>
                        )}
                        {files.map(item => (
                            <tr
                                key={item.name}
                                className="border-b border-gray-100 hover:bg-blue-50 cursor-pointer group"
                                onClick={() => handleItemClick(item)}
                                onContextMenu={(e) => handleContextMenu(e, item)}
                            >
                                <td className="px-4 py-2 flex items-center gap-2">
                                    <Icon
                                        icon={item.isDirectory ? "fa-solid fa-folder" : "fa-solid fa-file"}
                                        className={item.isDirectory ? "text-yellow-500" : "text-gray-400"}
                                    />
                                    <span className="text-gray-700 font-medium truncate max-w-[150px] md:max-w-none">{item.name}</span>
                                </td>
                                <td className="px-4 py-2 text-gray-500 font-mono text-xs hidden md:table-cell">
                                    {item.attrs.size > 0 ? (item.attrs.size / 1024).toFixed(1) + ' KB' : '-'}
                                </td>
                                <td className="px-4 py-2 text-gray-500 font-mono text-xs hidden md:table-cell">
                                    {item.longname.split(' ')[0]}
                                </td>
                                <td className="px-4 py-2 text-right flex justify-end gap-2">
                                    {!item.isDirectory && (
                                        <button
                                            onClick={(e) => handleDownload(e, item)}
                                            className="text-gray-400 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Download"
                                        >
                                            <Icon icon="fa-solid fa-download" />
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => handleDelete(e, item)}
                                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Delete"
                                    >
                                        <Icon icon="fa-solid fa-trash" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Editor Modal */}
            {editingFile && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-20">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
                        <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl">
                            <h3 className="font-bold text-gray-800 truncate">{editingFile.path}</h3>
                            <button onClick={() => setEditingFile(null)} className="text-gray-400 hover:text-gray-600">
                                <Icon icon="fa-solid fa-times" />
                            </button>
                        </div>
                        <div className="flex-1 p-0 relative">
                            <textarea
                                value={editorContent}
                                onChange={e => setEditorContent(e.target.value)}
                                className="w-full h-full p-4 font-mono text-sm outline-none resize-none bg-gray-50"
                                spellCheck={false}
                            />
                        </div>
                        <div className="px-4 py-3 border-t border-gray-200 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
                            <button
                                onClick={() => setEditingFile(null)}
                                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleSaveFile}
                                disabled={saving}
                                className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
                            >
                                {saving && <Icon icon="fa-solid fa-spinner" className="animate-spin" />}
                                保存
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Context Menu */}
            {contextMenu && (
                <div
                    className="fixed bg-white shadow-xl rounded-lg border border-gray-200 py-1 z-50 min-w-[160px]"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button onClick={() => handleContextAction('open')} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-700 flex items-center gap-2">
                        <Icon icon={contextMenu.item.isDirectory ? "fa-solid fa-folder-open" : "fa-solid fa-file-pen"} className="w-4" />
                        {contextMenu.item.isDirectory ? '打开' : '编辑'}
                    </button>
                    <button onClick={() => handleContextAction('rename')} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-700 flex items-center gap-2">
                        <Icon icon="fa-solid fa-i-cursor" className="w-4" />
                        重命名
                    </button>
                    <button onClick={() => handleContextAction('move')} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-700 flex items-center gap-2">
                        <Icon icon="fa-solid fa-arrows-up-down-left-right" className="w-4" />
                        移动
                    </button>
                    {!contextMenu.item.isDirectory && (
                        <button onClick={() => handleContextAction('download')} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-700 flex items-center gap-2">
                            <Icon icon="fa-solid fa-download" className="w-4" />
                            下载
                        </button>
                    )}
                    <div className="h-px bg-gray-200 my-1"></div>
                    <button onClick={() => handleContextAction('delete')} className="w-full text-left px-4 py-2 hover:bg-red-50 text-sm text-red-600 flex items-center gap-2">
                        <Icon icon="fa-solid fa-trash" className="w-4" />
                        删除
                    </button>
                </div>
            )}

            {/* Rename Modal */}
            {renameModal.isOpen && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-30" onClick={() => setRenameModal({ ...renameModal, isOpen: false })}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-gray-800 mb-4">重命名 {renameModal.item?.name}</h3>
                        <input
                            type="text"
                            value={renameModal.newName}
                            onChange={e => setRenameModal({ ...renameModal, newName: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none mb-4"
                            autoFocus
                            onKeyDown={e => e.key === 'Enter' && handleRenameSubmit()}
                        />
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setRenameModal({ ...renameModal, isOpen: false })} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">取消</button>
                            <button onClick={handleRenameSubmit} className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg">确定</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Move Modal */}
            {moveModal.isOpen && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-30" onClick={() => setMoveModal({ ...moveModal, isOpen: false })}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col h-[500px]" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800">移动 {moveModal.item?.name}</h3>
                            <p className="text-xs text-gray-500 mt-1">选择目标文件夹</p>
                        </div>

                        {/* Browser Toolbar */}
                        <div className="p-2 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                            <button
                                onClick={handleMoveUp}
                                className="p-1.5 hover:bg-gray-200 rounded text-gray-600 disabled:opacity-50"
                                disabled={moveModal.currentPath === '/'}
                            >
                                <Icon icon="fa-solid fa-arrow-up" />
                            </button>
                            <div className="flex-1 px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono text-gray-700 truncate">
                                {moveModal.currentPath}
                            </div>
                        </div>

                        {/* Directory List */}
                        <div className="flex-1 overflow-y-auto p-2 relative">
                            {moveModal.loading && (
                                <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
                                    <Icon icon="fa-solid fa-spinner" className="animate-spin text-blue-500" />
                                </div>
                            )}
                            {moveModal.files.length === 0 && !moveModal.loading ? (
                                <div className="text-center text-gray-400 py-8 text-sm">空文件夹</div>
                            ) : (
                                <div className="space-y-1">
                                    {moveModal.files.map(file => (
                                        <div
                                            key={file.name}
                                            onClick={() => handleMoveNavigate(moveModal.currentPath === '/' ? `/${file.name}` : `${moveModal.currentPath}/${file.name}`)}
                                            className="flex items-center gap-2 p-2 hover:bg-blue-50 rounded cursor-pointer text-sm text-gray-700"
                                        >
                                            <Icon icon="fa-solid fa-folder" className="text-yellow-500" />
                                            <span className="truncate">{file.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
                            <button onClick={() => setMoveModal({ ...moveModal, isOpen: false })} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">取消</button>
                            <button onClick={handleMoveSubmit} className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm">移动到此处</button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, item: null })}
                onConfirm={handleDeleteConfirm}
                title="确认删除"
                message={`确定要删除 ${deleteModal.item?.name} 吗？此操作无法撤销。`}
            />
        </div>
    );
}
