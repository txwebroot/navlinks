import React, { useState } from 'react';
import { Socket } from 'socket.io-client';
import { VpsServer } from '../types';
import WebTerminal, { WebTerminalRef } from './WebTerminal';
import Dashboard from './Dashboard';
import FileManager from './FileManager';
import SnippetLibrary from './SnippetLibrary';
import { Icon } from '@/src/shared/components/common/Icon';

interface ServerTerminalViewProps {
    serverId: string;
    socket: Socket | null;
    onSocketReady: (socket: Socket) => void;
    visible: boolean;
    stats: any;
    onStatusChange?: (status: 'online' | 'offline') => void;
    isConnected?: boolean;
    server?: VpsServer;
}

export default function ServerTerminalView({
    serverId,
    socket,
    onSocketReady,
    visible,
    stats,
    onStatusChange,
    isConnected = false,
    server
}: ServerTerminalViewProps) {
    const terminalRef = React.useRef<WebTerminalRef>(null);

    // Panel Visibility State
    const [showFileManager, setShowFileManager] = useState(true);
    const [showSnippets, setShowSnippets] = useState(true);
    const [showMonitoring, setShowMonitoring] = useState(true);

    return (
        <div className={`h-full flex overflow-hidden bg-gray-100 ${visible ? '' : 'hidden'}`}>
            {/* Left Column: File Manager */}
            <div className={`flex flex-col border-r border-gray-200 bg-white transition-all duration-300 ${showFileManager ? 'w-[20%] min-w-[250px] max-w-[400px]' : 'w-10'}`}>
                <div className={`border-b border-gray-100 bg-gray-50 flex items-center ${showFileManager ? 'justify-between px-3 py-2' : 'justify-center py-2'}`}>
                    {showFileManager ? (
                        <>
                            <span className="font-bold text-gray-700 text-sm">文件管理</span>
                            <button
                                onClick={() => setShowFileManager(false)}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-200"
                                title="收起"
                            >
                                <Icon icon="fa-solid fa-chevron-left" />
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setShowFileManager(true)}
                            className="text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50"
                            title="展开"
                        >
                            <Icon icon="fa-solid fa-folder" />
                        </button>
                    )}
                </div>

                {showFileManager ? (
                    <div className="flex-1 overflow-hidden">
                        <FileManager socket={socket} isConnected={isConnected} />
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center pt-4 gap-4">
                        <button
                            onClick={() => setShowFileManager(true)}
                            className="vertical-rl text-xs text-gray-400 hover:text-blue-600 font-medium tracking-widest cursor-pointer"
                        >
                            文件管理
                        </button>
                    </div>
                )}
            </div>

            {/* Center Column: Terminal + Monitoring */}
            <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
                {/* Top: Terminal */}
                <div className={`relative bg-[#1e1e1e] overflow-hidden transition-all duration-300 ${showMonitoring ? 'flex-[7]' : 'flex-1'}`}>
                    <WebTerminal
                        ref={terminalRef}
                        serverId={serverId}
                        onSocketReady={onSocketReady}
                        visible={visible}
                        onStatusChange={onStatusChange}
                    />
                </div>

                {/* Bottom: Monitoring */}
                <div className={`bg-white border-t border-gray-200 overflow-hidden flex flex-col transition-all duration-300 ${showMonitoring ? 'flex-[3]' : 'h-9 flex-none'}`}>
                    <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 flex justify-between items-center h-9">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-700 text-sm">实时监控</span>
                            {!showMonitoring && stats && (
                                <span className="text-xs font-mono text-gray-400 ml-2">
                                    CPU: {stats.cpu?.usage}% | RAM: {stats.mem?.usedPercentage}%
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {showMonitoring && stats && (
                                <span className="text-xs font-mono text-gray-500 mr-2">
                                    Up: {(stats.net?.up / 1024).toFixed(1)} KB/s | Down: {(stats.net?.down / 1024).toFixed(1)} KB/s
                                </span>
                            )}
                            <button
                                onClick={() => setShowMonitoring(!showMonitoring)}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-200"
                                title={showMonitoring ? "收起" : "展开"}
                            >
                                <Icon icon={showMonitoring ? "fa-solid fa-chevron-down" : "fa-solid fa-chevron-up"} />
                            </button>
                        </div>
                    </div>
                    {showMonitoring && (
                        <div className="flex-1 p-4 overflow-y-auto">
                            <Dashboard stats={stats} server={server} />
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column: Snippets */}
            <div className={`flex flex-col border-l border-gray-200 bg-white transition-all duration-300 ${showSnippets ? 'w-[20%] min-w-[250px] max-w-[400px]' : 'w-10'}`}>
                <div className={`border-b border-gray-100 bg-gray-50 flex items-center ${showSnippets ? 'justify-between px-3 py-2' : 'justify-center py-2'}`}>
                    {showSnippets ? (
                        <>
                            <span className="font-bold text-gray-700 text-sm">快捷指令</span>
                            <button
                                onClick={() => setShowSnippets(false)}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-200"
                                title="收起"
                            >
                                <Icon icon="fa-solid fa-chevron-right" />
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setShowSnippets(true)}
                            className="text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50"
                            title="展开"
                        >
                            <Icon icon="fa-solid fa-terminal" />
                        </button>
                    )}
                </div>

                {showSnippets ? (
                    <div className="flex-1 overflow-hidden">
                        <SnippetLibrary
                            socket={socket}
                            compact={true}
                            variant="sidebar"
                            onRun={(cmd) => terminalRef.current?.send(cmd + '\n')}
                        />
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center pt-4 gap-4">
                        <button
                            onClick={() => setShowSnippets(true)}
                            className="vertical-rl text-xs text-gray-400 hover:text-blue-600 font-medium tracking-widest cursor-pointer"
                        >
                            快捷指令
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
