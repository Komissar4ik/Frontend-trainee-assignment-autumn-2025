import { exportStatsToCSV, exportStatsToPDF } from '@/utils/export';
import type { StatsSummary, ActivityData, DecisionsData } from '@/types';

describe('exportStatsToCSV', () => {
  let originalCreateElement: typeof document.createElement;
  let mockClick: jest.Mock;

  beforeEach(() => {
    document.body.innerHTML = '';
    originalCreateElement = document.createElement.bind(document);
    mockClick = jest.fn();
    jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const element = originalCreateElement(tagName);
      if (tagName === 'a') {
        element.click = mockClick;
      }
      return element;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create download link with CSV content', () => {
    const summary: StatsSummary = {
      totalReviewed: 100,
      totalReviewedToday: 10,
      totalReviewedThisWeek: 50,
      totalReviewedThisMonth: 80,
      approvedPercentage: 75,
      rejectedPercentage: 20,
      requestChangesPercentage: 5,
      averageReviewTime: 120,
    };

    const activity: ActivityData[] = [
      { date: '2024-01-01', approved: 10, rejected: 2, requestChanges: 1 },
    ];

    const decisions: DecisionsData = {
      approved: 75,
      rejected: 20,
      requestChanges: 5,
    };

    const categories = { Электроника: 30, Транспорт: 20 };

    exportStatsToCSV(summary, activity, decisions, categories);

    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(mockClick).toHaveBeenCalled();
    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(global.URL.revokeObjectURL).toHaveBeenCalled();
  });
});

describe('exportStatsToPDF', () => {
  let mockPrintWindow: {
    document: { write: jest.Mock; close: jest.Mock };
    focus: jest.Mock;
    print: jest.Mock;
  };

  beforeEach(() => {
    jest.useFakeTimers();
    mockPrintWindow = {
      document: {
        write: jest.fn(),
        close: jest.fn(),
      },
      focus: jest.fn(),
      print: jest.fn(),
    };
    window.open = jest.fn().mockReturnValue(mockPrintWindow);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should open print window with HTML content', () => {
    const summary: StatsSummary = {
      totalReviewed: 100,
      totalReviewedToday: 10,
      totalReviewedThisWeek: 50,
      totalReviewedThisMonth: 80,
      approvedPercentage: 75,
      rejectedPercentage: 20,
      requestChangesPercentage: 5,
      averageReviewTime: 120,
    };

    const activity: ActivityData[] = [
      { date: '2024-01-01', approved: 10, rejected: 2, requestChanges: 1 },
    ];

    const decisions: DecisionsData = {
      approved: 75,
      rejected: 20,
      requestChanges: 5,
    };

    const categories = { Электроника: 30 };

    exportStatsToPDF(summary, activity, decisions, categories);

    expect(window.open).toHaveBeenCalledWith('', '_blank');
    expect(mockPrintWindow.document.write).toHaveBeenCalled();
    expect(mockPrintWindow.document.close).toHaveBeenCalled();
    expect(mockPrintWindow.focus).toHaveBeenCalled();
  });

  it('should handle null window.open return', () => {
    window.open = jest.fn().mockReturnValue(null);

    const summary: StatsSummary = {
      totalReviewed: 100,
      totalReviewedToday: 10,
      totalReviewedThisWeek: 50,
      totalReviewedThisMonth: 80,
      approvedPercentage: 75,
      rejectedPercentage: 20,
      requestChangesPercentage: 5,
      averageReviewTime: 120,
    };

    expect(() => {
      exportStatsToPDF(summary, [], { approved: 0, rejected: 0, requestChanges: 0 }, {});
    }).not.toThrow();
  });

  it('should call print after timeout', () => {
    const summary: StatsSummary = {
      totalReviewed: 100,
      totalReviewedToday: 10,
      totalReviewedThisWeek: 50,
      totalReviewedThisMonth: 80,
      approvedPercentage: 75,
      rejectedPercentage: 20,
      requestChangesPercentage: 5,
      averageReviewTime: 120,
    };

    exportStatsToPDF(summary, [], { approved: 0, rejected: 0, requestChanges: 0 }, {});

    expect(mockPrintWindow.print).not.toHaveBeenCalled();

    jest.advanceTimersByTime(250);

    expect(mockPrintWindow.print).toHaveBeenCalled();
  });
});
