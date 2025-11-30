import React from 'react';
import { LinkItem } from '@/src/shared/types';
import { Icon } from '@/src/shared/components/common/Icon';
import { ensureProtocol } from '@/src/shared/utils/url';

interface LinkCardProps {
  item: LinkItem;
  isAuthenticated?: boolean;
  onEdit?: (item: LinkItem) => void;
  onDelete?: (item: LinkItem) => void;
}

const LinkCard: React.FC<LinkCardProps> = ({ item, isAuthenticated, onEdit, onDelete }) => {
  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit?.(item);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete?.(item);
  };

  const isUnhealthy = item.health && !item.health.isHealthy;
  const cardOpacity = isUnhealthy ? 'opacity-60' : '';

  return (
    <div className="relative group h-full animate-fade-in">
      <a href={ensureProtocol(item.url)} target="_blank" rel="noopener noreferrer" className={`flex bg-white rounded-lg p-4 h-full border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover:border-transparent items-start relative ${cardOpacity}`}>
        <div className="mr-3 flex-shrink-0">
          {item.icon ? (
            item.icon.includes('fa-') || item.icon.includes(':') ? (
              <div className="w-10 h-10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Icon icon={item.icon} className="text-[40px]" style={{ color: item.color || '#ddd' }} />
              </div>
            ) : (
              <img src={item.icon} className="w-10 h-10 object-contain group-hover:scale-110 transition-transform duration-300" alt="" />
            )
          ) : (
            <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded group-hover:scale-110 transition-transform duration-300">
              <Icon icon="fa-solid fa-link" className="text-[24px] text-gray-400" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 overflow-hidden pt-0.5">
          <h3 className="text-sm font-bold text-gray-800 truncate mb-1.5 group-hover:text-[var(--theme-primary)] transition-colors">{item.title}</h3>
          <p className="text-xs text-gray-400 line-clamp-2 h-[32px] leading-relaxed">{item.description}</p>
        </div>
      </a>

      {/* Health Info & Status Dot */}
      {item.health && (
        <div className="absolute bottom-2 right-2 z-10 flex items-center justify-end">
          {/* Info Tooltip - Visible on Hover */}
          <div className={`opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs font-bold mr-1.5 whitespace-nowrap ${item.health.isHealthy ? 'text-green-500' : 'text-red-500'}`}>
            {item.health.isHealthy
              ? `${item.health.responseTime || 0}ms`
              : '失效'}
          </div>

          {/* Red Dot - Only for unhealthy links */}
          {!item.health.isHealthy && (
            <div className="w-2 h-2 rounded-full bg-red-500 shadow-sm animate-pulse" />
          )}
        </div>
      )}

      {/* Admin Controls */}
      {isAuthenticated && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          <button
            onClick={handleEdit}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="w-7 h-7 bg-white/90 text-blue-500 rounded-full shadow-sm hover:bg-blue-50 flex items-center justify-center border border-gray-100"
            title="编辑"
          >
            <Icon icon="fa-solid fa-pen" className="text-xs" />
          </button>
          <button
            onClick={handleDelete}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="w-7 h-7 bg-white/90 text-red-500 rounded-full shadow-sm hover:bg-red-50 flex items-center justify-center border border-gray-100"
            title="删除"
          >
            <Icon icon="fa-solid fa-trash" className="text-xs" />
          </button>
        </div>
      )}
    </div>
  );
};

export default LinkCard;
