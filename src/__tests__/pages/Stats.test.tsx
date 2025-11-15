import { render, screen, waitFor, act } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import { Stats } from '@/pages/Stats';
import { apiClient } from '@/api';
import { exportStatsToCSV, exportStatsToPDF } from '@/utils/export';
import type { StatsSummary, ActivityData, DecisionsData } from '@/types';

jest.mock('@/utils/export');
jest.mock('recharts', () => ({
  BarChart: ({ children }: { children: React.ReactNode }): JSX.Element => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: (): null => null,
  PieChart: ({ children }: { children: React.ReactNode }): JSX.Element => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: (): null => null,
  Cell: (): null => null,
  XAxis: (): null => null,
  YAxis: (): null => null,
  CartesianGrid: (): null => null,
  Tooltip: (): null => null,
  Legend: (): null => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }): JSX.Element => (
    <div>{children}</div>
  ),
}));

jest.mock('@/api');
jest.mock('@/hooks/useApi', () => ({
  useApiRequestCancel: jest.fn(),
}));
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: (): [URLSearchParams, jest.Mock] => [new URLSearchParams(), jest.fn()],
}));

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

const mockStatsSummary: StatsSummary = {
  totalReviewed: 100,
  totalReviewedToday: 10,
  totalReviewedThisWeek: 50,
  totalReviewedThisMonth: 80,
  approvedPercentage: 75,
  rejectedPercentage: 20,
  requestChangesPercentage: 5,
  averageReviewTime: 120,
};

const mockActivityData: ActivityData[] = [
  { date: '2024-01-01', approved: 10, rejected: 2, requestChanges: 1 },
];

const mockDecisionsData: DecisionsData = {
  approved: 75,
  rejected: 20,
  requestChanges: 5,
};

describe('Stats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedApiClient.getStatsSummary.mockImplementation(() => {
      return new Promise((resolve) => {
        queueMicrotask(() => resolve(mockStatsSummary));
      });
    });
    mockedApiClient.getActivityChart.mockImplementation(() => {
      return new Promise((resolve) => {
        queueMicrotask(() => resolve(mockActivityData));
      });
    });
    mockedApiClient.getDecisionsChart.mockImplementation(() => {
      return new Promise((resolve) => {
        queueMicrotask(() => resolve(mockDecisionsData));
      });
    });
    mockedApiClient.getCategoriesChart.mockImplementation(() => {
      return new Promise((resolve) => {
        queueMicrotask(() => resolve({ Электроника: 30 }));
      });
    });
  });

  it('should render loading state initially', () => {
    mockedApiClient.getStatsSummary.mockImplementation(() => new Promise(() => {}));

    render(<Stats />);

    expect(screen.getByText('Загрузка статистики...')).toBeInTheDocument();
  });

  it('should render stats after loading', async () => {
    render(<Stats />);

    expect(
      await screen.findByText('Статистика модератора', {}, { timeout: 200 })
    ).toBeInTheDocument();
  });

  it('should display total reviewed count', async () => {
    render(<Stats />);

    expect(await screen.findByText('100')).toBeInTheDocument();
  });

  it('should call all API methods on mount', async () => {
    render(<Stats />);

    await screen.findByText('Статистика модератора', {}, { timeout: 200 });
    expect(mockedApiClient.getStatsSummary).toHaveBeenCalled();
    expect(mockedApiClient.getActivityChart).toHaveBeenCalled();
    expect(mockedApiClient.getDecisionsChart).toHaveBeenCalled();
    expect(mockedApiClient.getCategoriesChart).toHaveBeenCalled();
  });

  it('should display statistics title', async () => {
    render(<Stats />);

    expect(await screen.findByText('Статистика модератора')).toBeInTheDocument();
  });

  it('should change period when period button is clicked', async () => {
    const user = userEvent.setup();
    render(<Stats />);

    await screen.findByText('Статистика модератора', {}, { timeout: 200 });
    const todayButton = screen.getByText('Сегодня');
    await act(async () => {
      await user.click(todayButton);
    });

    expect(mockedApiClient.getStatsSummary).toHaveBeenCalledTimes(2);
  });

  it('should call exportStatsToCSV when CSV export button is clicked', async () => {
    const user = userEvent.setup();
    render(<Stats />);

    const csvButton = await screen.findByText('Экспорт CSV');
    await act(async () => {
      await user.click(csvButton);
    });

    expect(exportStatsToCSV).toHaveBeenCalled();
  });

  it('should call exportStatsToPDF when PDF export button is clicked', async () => {
    const user = userEvent.setup();
    render(<Stats />);

    const pdfButton = await screen.findByText('Экспорт PDF');
    await act(async () => {
      await user.click(pdfButton);
    });

    expect(exportStatsToPDF).toHaveBeenCalled();
  });

  it('should display metrics cards', async () => {
    render(<Stats />);

    expect(await screen.findByText('Всего проверено')).toBeInTheDocument();
    expect(screen.getByText('Процент одобренных')).toBeInTheDocument();
    expect(screen.getByText('Процент отклоненных')).toBeInTheDocument();
    expect(screen.getByText('Среднее время проверки')).toBeInTheDocument();
  });

  it('should change period to week', async () => {
    const user = userEvent.setup();
    render(<Stats />);

    await waitFor(() => {
      expect(screen.getByText('Статистика модератора')).toBeInTheDocument();
    });

    const todayButton = screen.getByText('Сегодня');
    await act(async () => {
      await user.click(todayButton);
    });

    await waitFor(() => {
      expect(mockedApiClient.getStatsSummary).toHaveBeenCalledTimes(2);
    });

    const weekButton = screen.getByText('Последние 7 дней');
    await act(async () => {
      await user.click(weekButton);
    });

    await waitFor(() => {
      expect(mockedApiClient.getStatsSummary).toHaveBeenCalledTimes(3);
    });
  });

  it('should change period to month', async () => {
    const user = userEvent.setup();
    render(<Stats />);

    await waitFor(() => {
      expect(screen.getByText('Статистика модератора')).toBeInTheDocument();
    });

    const monthButton = screen.getByText('Последние 30 дней');
    await act(async () => {
      await user.click(monthButton);
    });

    await waitFor(() => {
      expect(mockedApiClient.getStatsSummary).toHaveBeenCalledTimes(2);
    });
  });

  it('should handle API error gracefully', async () => {
    mockedApiClient.getStatsSummary.mockRejectedValueOnce(new Error('API Error'));

    render(<Stats />);

    await waitFor(
      () => {
        expect(screen.queryByText('Загрузка статистики...')).not.toBeInTheDocument();
      },
      { timeout: 1000 }
    );

    expect(mockedApiClient.getStatsSummary).toHaveBeenCalled();
  });
});
