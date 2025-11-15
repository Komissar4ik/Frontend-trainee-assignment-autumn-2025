import type { AddStatus, AddPriority, ModerationAction } from '@/types';

export function getStatusLabel(status: AddStatus): string {
  const statusMap: Record<AddStatus, string> = {
    pending: 'На модерации',
    approved: 'Одобрено',
    rejected: 'Отклонено',
    draft: 'Черновик',
  };
  return statusMap[status] || status;
}

export function getPriorityLabel(priority: AddPriority): string {
  const priorityMap: Record<AddPriority, string> = {
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
