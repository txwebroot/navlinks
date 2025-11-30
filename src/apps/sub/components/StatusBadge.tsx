/**
 * 状态标签组件
 */

import React from 'react';
import { SubscriptionStatus } from '../types/subscription';

interface StatusBadgeProps {
  status: SubscriptionStatus;
  daysRemaining: number;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, daysRemaining }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'active':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          text: '正常',
          icon: 'fa-check-circle'
        };
      case 'warning':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          text: '即将到期',
          icon: 'fa-exclamation-triangle'
        };
      case 'urgent':
        return {
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          text: '紧急',
          icon: 'fa-exclamation-circle'
        };
      case 'expired':
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          text: '已过期',
          icon: 'fa-times-circle'
        };
    }
  };

  const config = getStatusConfig();
  const daysText = daysRemaining < 0 
    ? `已过期 ${Math.abs(daysRemaining)} 天`
    : `剩余 ${daysRemaining} 天`;

  return (
    <div className="flex flex-col gap-1">
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
        <i className={`fas ${config.icon} mr-1`}></i>
        {config.text}
      </span>
      <span className="text-xs text-gray-500">{daysText}</span>
    </div>
  );
};
