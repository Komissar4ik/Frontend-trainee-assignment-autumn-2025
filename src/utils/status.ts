import type { AdStatus, AdPriority, ModerationAction } from '@/types';

export function getStatusLabel(status: AdStatus): string {
  const statusMap: Record<AdStatus, string> = {
    pending: 'На модерации',
    approved: 'Одобрено',
    rejected: 'Отклонено',
    draft: 'Черновик',
  };
  return statusMap[status] || status;
}

export function getPriorityLabel(priority: AdPriority): string {
  const priorityMap: Record<AdPriority, string> = {
    normal: 'Обычный',
    urgent: 'Срочный',
  };
  return priorityMap[priority] || priority;
}

export function getActionLabel(action: ModerationAction): string {
  const actionMap: Record<ModerationAction, string> = {
    approved: 'Одобрено',
    rejected: 'Отклонено',
    requestChanges: 'Вернуто на доработку',
  };
  return actionMap[action] || action;
}

