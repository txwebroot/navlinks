import React from 'react';
import { DockerServer } from '../types/docker';
import { Icon } from '@/src/shared/components/common/Icon';

interface ServerTabsProps {
    servers: DockerServer[];
    selectedServerId: string | null;
    onSelect: (server: DockerServer) => void;
    onAddServer?: () => void;
}

const ServerTabs: React.FC<ServerTabsProps> = ({ servers, selectedServerId, onSelect, onAddServer }) => {
    return (
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar">
            {servers.map(server => {
                const isSelected = server.id === selectedServerId;
                const isOnline = server.status === 'online';

                return (
                    <button
                        key={server.id}
                        onClick={() => onSelect(server)}
                        className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 border
              ${isSelected
                                ? 'bg-[var(--theme-primary)] text-white border-[var(--theme-primary)] shadow-md'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                            }
            `}
                    >
                        <div className={`w-2 h-2 rounded-full ${isOnline ? (isSelected ? 'bg-white' : 'bg-green-500') : (isSelected ? 'bg-white/50' : 'bg-red-500')}`}></div>
                        <span className="text-sm">
                            {server.name}
                        </span>
                        {server.is_default === 1 && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${isSelected ? 'bg-white/20 border-white/30 text-white' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                DEF
                            </span>
                        )}
                    </button>
                );
            })}

            {onAddServer && (
                <button
                    onClick={onAddServer}
                    className="flex items-center justify-center w-10 h-10 rounded-lg border border-dashed border-gray-300 hover:border-[var(--theme-primary)] hover:text-[var(--theme-primary)] text-gray-400 bg-gray-50 hover:bg-white transition-all flex-shrink-0"
                    title="添加服务器"
                >
                    <Icon icon="fa-solid fa-plus" />
                </button>
            )}
        </div>
    );
};

export default ServerTabs;
