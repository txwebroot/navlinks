import React, { useEffect, useState, useRef } from 'react';
import WebTerminal from './WebTerminal';
import Dashboard from './Dashboard';
import SnippetLibrary from './SnippetLibrary';
import FileManager from './FileManager';
import { Socket } from 'socket.io-client';
import { Icon } from '@/src/shared/components/common/Icon';

// We need to access the socket instance from WebTerminal to set up monitoring listeners.
// However, WebTerminal currently manages its own socket connection.
// To support the "Integrated Workspace" concept where Dashboard and Terminal share the connection (or at least the session context),
// we should probably lift the socket connection up or expose it.
//
// For Phase 3, since WebTerminal initializes the socket, we can pass a callback `onSocketReady` to WebTerminal
// to get the socket instance and set up monitoring.

interface IntegratedWorkspaceProps {
    serverId: string;
    onClose: () => void;
}

export default function IntegratedWorkspace({ serverId, onClose }: IntegratedWorkspaceProps) {
    const [stats, setStats] = useState(null);
    const [showSnippets, setShowSnippets] = useState(false);
    const [showFiles, setShowFiles] = useState(false);
    const socketRef = useRef<Socket | null>(null);

    const handleSocketReady = (socket: Socket) => {
        socketRef.current = socket;

        // Start Monitoring
        socket.emit('monitor:start');

        // Listen for data
        socket.on('monitor:data', (data) => {
            setStats(data);
        });
    };

    // Cleanup monitoring on unmount
    useEffect(() => {
        return () => {
            if (socketRef.current) {
                socketRef.current.emit('monitor:stop');
                socketRef.current.off('monitor:data');
            }
        };
    }, []);

    return (
        <div className="h-full flex flex-col bg-gray-50">
            {/* Top: Dashboard */}
            <div className="relative">
                <Dashboard stats={stats} />
                <div className="absolute top-4 right-4 flex gap-2">
                    <button
                        onClick={() => setShowFiles(!showFiles)}
                        className={`p-2 rounded-lg transition-colors ${showFiles ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        title="Toggle Files"
                    >
                        <Icon icon="fa-solid fa-folder" />
                    </button>
                    <button
                        onClick={() => setShowSnippets(!showSnippets)}
                        className={`p-2 rounded-lg transition-colors ${showSnippets ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        title="Toggle Snippets"
                    >
                        <Icon icon="fa-solid fa-code" />
                    </button>
                    <div className="w-px h-8 bg-gray-300 mx-1"></div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-600 rounded-lg transition-colors"
                        title="Close"
                    >
                        <Icon icon="fa-solid fa-times" />
                    </button>
                </div>
            </div>

            {/* Bottom: Workspace Area */}
            <div className="flex-1 overflow-hidden flex relative">
                {/* Mobile Backdrop */}
                {(showFiles || showSnippets) && (
                    <div
                        className="absolute inset-0 bg-black/20 z-10 md:hidden"
                        onClick={() => { setShowFiles(false); setShowSnippets(false); }}
                    ></div>
                )}

                {/* Left Sidebar: Files */}
                <div className={`
                    fixed inset-y-0 left-0 z-20 w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out
                    md:relative md:translate-x-0 md:shadow-none md:border-r md:border-gray-200
                    ${showFiles ? 'translate-x-0' : '-translate-x-full md:hidden'}
                `}>
                    <FileManager socket={socketRef.current} />
                </div>

                {/* Center: Terminal */}
                <div className="flex-1 relative min-w-0 bg-[#1e1e1e]">
                    <WebTerminal
                        serverId={serverId}
                        // onClose={onClose} // Moved to top right
                        onSocketReady={handleSocketReady}
                    />
                </div>

                {/* Right Sidebar: Snippets */}
                <div className={`
                    fixed inset-y-0 right-0 z-20 w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out
                    md:relative md:translate-x-0 md:shadow-none md:border-l md:border-gray-200
                    ${showSnippets ? 'translate-x-0' : 'translate-x-full md:hidden'}
                `}>
                    <SnippetLibrary socket={socketRef.current} />
                </div>
            </div>
        </div>
    );
}
