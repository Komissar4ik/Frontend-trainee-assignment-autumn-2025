import { getStatusLabel, getPriorityLabel, getActionLabel } from '@/utils/status';
import type { AdStatus, AdPriority, ModerationAction } from '@/types';

describe('getStatusLabel', () => {
  it('should return correct label for pending status', () => {
    expect(getStatusLabel('pending')).toBe('На модерации');
  });

  it('should return correct label for approved status', () => {
    expect(getStatusLabel('approved')).toBe('Одобрено');
  });

  it('should return correct label for rejected status', () => {
    expect(getStatusLabel('rejected')).toBe('Отклонено');
  });

  it('should return correct label for draft status', () => {
    expect(getStatusLabel('draft')).toBe('Черновик');
  });

  it('should return status itself for unknown status', () => {
    const unknownStatus = 'unknown' as AdStatus;
    expect(getStatusLabel(unknownStatus)).toBe(unknownStatus);
  });
});

describe('getPriorityLabel', () => {
  it('should return correct label for normal priority', () => {
    expect(getPriorityLabel('normal')).toBe('Обычный');
  });

  it('should return correct label for urgent priority', () => {
    expect(getPriorityLabel('urgent')).toBe('Срочный');
  });

  it('should return priority itself for unknown priority', () => {
    const unknownPriority = 'unknown' as AdPriority;
    expect(getPriorityLabel(unknownPriority)).toBe(unknownPriority);
  });
});

describe('getActionLabel', () => {
  it('should return correct label for approved action', () => {
    expect(getActionLabel('approved')).toBe('Одобрено');
  });

  it('should return correct label for rejected action', () => {
    expect(getActionLabel('rejected')).toBe('Отклонено');
  });

  it('should return correct label for requestChanges action', () => {
    expect(getActionLabel('requestChanges')).toBe('Вернуто на доработку');
  });

  it('should return action itself for unknown action', () => {
    const unknownAction = 'unknown' as ModerationAction;
    expect(getActionLabel(unknownAction)).toBe(unknownAction);
  });
});

