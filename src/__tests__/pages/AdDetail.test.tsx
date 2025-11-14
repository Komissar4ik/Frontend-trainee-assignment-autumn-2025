import { render, screen, waitFor, act } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import { AdDetail } from '@/pages/AdDetail';
import { apiClient } from '@/api';
import type { Advertisement } from '@/types';

jest.mock('@/api');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: '1' }),
  useNavigate: () => jest.fn(),
}));
jest.mock('@/hooks/useApi', () => ({
  useCancelOnUnmount: jest.fn(),
}));
jest.mock('@/hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: jest.fn(),
}));

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

const mockAd: Advertisement = {
  id: 1,
  title: 'Test Ad',
  description: 'Test Description',
  price: 1000,
  category: 'Электроника',
  categoryId: 0,
  status: 'pending',
  priority: 'normal',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  images: ['image1.jpg'],
  seller: {
    id: 1,
    name: 'Test Seller',
    rating: '4.5',
    totalAds: 10,
    registeredAt: '2023-01-01T00:00:00Z',
  },
  characteristics: { Состояние: 'Новое' },
  moderationHistory: [],
};

describe('AdDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedApiClient.getAdById.mockImplementation(() => {
      return new Promise((resolve) => {
        queueMicrotask(() => resolve(mockAd));
      });
    });
    mockedApiClient.approveAd.mockImplementation(() => {
      return new Promise((resolve) => {
        queueMicrotask(() => resolve({ ...mockAd, status: 'approved' }));
      });
    });
    mockedApiClient.rejectAd.mockImplementation(() => {
      return new Promise((resolve) => {
        queueMicrotask(() => resolve({ ...mockAd, status: 'rejected' }));
      });
    });
    mockedApiClient.requestChanges.mockImplementation(() => {
      return new Promise((resolve) => {
        queueMicrotask(() => resolve({ ...mockAd, status: 'draft' }));
      });
    });
  });

  it('should render loading state initially', () => {
    mockedApiClient.getAdById.mockImplementation(() => new Promise(() => {}));
    
    render(<AdDetail />);
    
    expect(screen.getByText('Загрузка...')).toBeInTheDocument();
  });

  it('should render ad details after loading', async () => {
    render(<AdDetail />);
    
    expect(await screen.findByText('Test Ad')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('should render error when ad not found', async () => {
    mockedApiClient.getAdById.mockRejectedValue(new Error('Not found'));
    
    render(<AdDetail />);
    
    expect(await screen.findByText('Объявление не найдено')).toBeInTheDocument();
  });

  it('should display ad title', async () => {
    render(<AdDetail />);
    
    expect(await screen.findByText('Test Ad', {}, { timeout: 200 })).toBeInTheDocument();
  });

  it('should call apiClient.getAdById with correct id', async () => {
    render(<AdDetail />);
    
    await screen.findByText('Test Ad', {}, { timeout: 200 });
    expect(mockedApiClient.getAdById).toHaveBeenCalledWith(1);
  });

  it('should display ad price', async () => {
    render(<AdDetail />);
    
    expect(await screen.findByText(/1[,\s]000/)).toBeInTheDocument();
  });

  it('should display ad category', async () => {
    render(<AdDetail />);
    
    expect(await screen.findByText('Электроника')).toBeInTheDocument();
  });

  it('should call approveAd when approve button is clicked', async () => {
    const user = userEvent.setup();
    
    render(<AdDetail />);
    
    const approveButton = await screen.findByText('Одобрить', {}, { timeout: 200 });
    await act(async () => {
      await user.click(approveButton);
    });
    
    expect(mockedApiClient.approveAd).toHaveBeenCalledWith(1);
  });

  it('should open reject modal when reject button is clicked', async () => {
    const user = userEvent.setup();
    
    render(<AdDetail />);
    
    const rejectButton = await screen.findByText('Отклонить', {}, { timeout: 200 });
    await act(async () => {
      await user.click(rejectButton);
    });
    
    await screen.findByText('Отклонить объявление', {}, { timeout: 200 });
  });

  it('should open request changes modal when button is clicked', async () => {
    const user = userEvent.setup();
    
    render(<AdDetail />);
    
    const requestChangesButton = await screen.findByRole('button', { name: 'Вернуть на доработку' }, { timeout: 200 });
    
    await act(async () => {
      await user.click(requestChangesButton);
    });
    
    await screen.findByRole('heading', { name: 'Вернуть на доработку' }, { timeout: 200 });
  });

  it('should disable approve button when ad is already approved', async () => {
    mockedApiClient.getAdById.mockResolvedValueOnce({ ...mockAd, status: 'approved' });
    
    render(<AdDetail />);
    
    const approveButton = await screen.findByText('Одобрить', {}, { timeout: 200 });
    expect(approveButton).toBeDisabled();
  });

  it('should handle reject with custom reason', async () => {
    const user = userEvent.setup();
    
    render(<AdDetail />);
    
    const rejectButton = await screen.findByText('Отклонить', {}, { timeout: 200 });
    await act(async () => {
      await user.click(rejectButton);
    });
    
    await screen.findByText('Отклонить объявление', {}, { timeout: 200 });
    
    const reasonLabel = screen.getByText(/Причина отклонения/);
    const reasonSelect = reasonLabel.parentElement?.querySelector('select') as HTMLSelectElement;
    
    expect(reasonSelect).toBeInTheDocument();
    
    await act(async () => {
      await user.selectOptions(reasonSelect, 'Другое');
    });
    
    await screen.findByPlaceholderText('Укажите причину', {}, { timeout: 200 });
  });

  it('should display moderation history when available', async () => {
    const adWithHistory = {
      ...mockAd,
      moderationHistory: [
        {
          id: 1,
          moderatorId: 1,
          moderatorName: 'Test Moderator',
          action: 'approved' as const,
          reason: null,
          comment: 'Test comment',
          timestamp: '2024-01-01T00:00:00Z',
        },
      ],
    };
    mockedApiClient.getAdById.mockResolvedValueOnce(adWithHistory);
    
    render(<AdDetail />);
    
    await screen.findByText('Test Moderator', {}, { timeout: 200 });
  });

  it('should display empty moderation history message', async () => {
    render(<AdDetail />);
    
    await screen.findByText('История модерации отсутствует', {}, { timeout: 200 });
  });

  it('should display seller information', async () => {
    render(<AdDetail />);
    
    await screen.findByText('Test Seller', {}, { timeout: 200 });
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('should handle approve error', async () => {
    const user = userEvent.setup();
    mockedApiClient.approveAd.mockImplementationOnce(() => Promise.reject(new Error('Approve failed')));
    
    render(<AdDetail />);
    
    const approveButton = await screen.findByText('Одобрить', {}, { timeout: 200 });
    await act(async () => {
      await user.click(approveButton);
    });
    
    expect(mockedApiClient.approveAd).toHaveBeenCalled();
  });

  it('should display back button', async () => {
    render(<AdDetail />);
    
    await screen.findByText('← Назад к списку', {}, { timeout: 200 });
  });

  it('should display navigation buttons', async () => {
    render(<AdDetail />);
    
    await screen.findByText('← Предыдущее', {}, { timeout: 200 });
    expect(screen.getByText('Следующее →')).toBeInTheDocument();
  });

  it('should successfully reject ad with predefined reason', async () => {
    const user = userEvent.setup();
    
    render(<AdDetail />);
    
    const rejectButton = await screen.findByText('Отклонить', {}, { timeout: 200 });
    await act(async () => {
      await user.click(rejectButton);
    });
    
    await screen.findByText('Отклонить объявление', {}, { timeout: 200 });
    
    const reasonSelect = screen.getByText(/Причина отклонения/).parentElement?.querySelector('select') as HTMLSelectElement;
    await act(async () => {
      await user.selectOptions(reasonSelect, 'Запрещенный товар');
    });
    
    const submitButton = screen.getAllByText('Отклонить')[1];
    await act(async () => {
      await user.click(submitButton);
    });
    
    expect(mockedApiClient.rejectAd).toHaveBeenCalledWith(1, {
      reason: 'Запрещенный товар',
      comment: 'Запрещенный товар',
    });
  });

  it('should successfully reject ad with custom reason', async () => {
    const user = userEvent.setup();
    
    render(<AdDetail />);
    
    const rejectButton = await screen.findByText('Отклонить', {}, { timeout: 200 });
    await act(async () => {
      await user.click(rejectButton);
    });
    
    await screen.findByText('Отклонить объявление', {}, { timeout: 200 });
    
    const reasonSelect = screen.getByText(/Причина отклонения/).parentElement?.querySelector('select') as HTMLSelectElement;
    await act(async () => {
      await user.selectOptions(reasonSelect, 'Другое');
    });
    
    const customReasonInput = await screen.findByPlaceholderText('Укажите причину', {}, { timeout: 200 });
    await act(async () => {
      await user.type(customReasonInput, 'Custom rejection reason');
    });
    
    const submitButton = screen.getAllByText('Отклонить')[1];
    await act(async () => {
      await user.click(submitButton);
    });
    
    expect(mockedApiClient.rejectAd).toHaveBeenCalledWith(1, {
      reason: 'Другое',
      comment: 'Custom rejection reason',
    });
  });

  it('should close reject modal when cancel button is clicked', async () => {
    const user = userEvent.setup();
    
    render(<AdDetail />);
    
    const rejectButton = await screen.findByText('Отклонить', {}, { timeout: 200 });
    await act(async () => {
      await user.click(rejectButton);
    });
    
    await screen.findByText('Отклонить объявление', {}, { timeout: 200 });
    
    const cancelButton = screen.getByText('Отмена');
    await act(async () => {
      await user.click(cancelButton);
    });
    
    await waitFor(() => {
      expect(screen.queryByText('Отклонить объявление')).not.toBeInTheDocument();
    }, { timeout: 200 });
  });

  it('should close reject modal when overlay is clicked', async () => {
    const user = userEvent.setup();
    
    render(<AdDetail />);
    
    const rejectButton = await screen.findByText('Отклонить', {}, { timeout: 200 });
    await act(async () => {
      await user.click(rejectButton);
    });
    
    await screen.findByText('Отклонить объявление', {}, { timeout: 200 });
    
    const overlay = document.querySelector('[class*="modalOverlay"]');
    await act(async () => {
      if (overlay) {
        await user.click(overlay);
      }
    });
    
    await waitFor(() => {
      expect(screen.queryByText('Отклонить объявление')).not.toBeInTheDocument();
    }, { timeout: 200 });
  });

  it('should close request changes modal when cancel button is clicked', async () => {
    const user = userEvent.setup();
    
    render(<AdDetail />);
    
    const requestChangesButton = await screen.findByRole('button', { name: 'Вернуть на доработку' }, { timeout: 200 });
    await act(async () => {
      await user.click(requestChangesButton);
    });
    
    await screen.findByRole('heading', { name: 'Вернуть на доработку' }, { timeout: 200 });
    
    const cancelButton = screen.getByText('Отмена');
    await act(async () => {
      await user.click(cancelButton);
    });
    
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Вернуть на доработку' })).not.toBeInTheDocument();
    }, { timeout: 200 });
  });

  it('should close request changes modal when overlay is clicked', async () => {
    const user = userEvent.setup();
    
    render(<AdDetail />);
    
    const requestChangesButton = await screen.findByRole('button', { name: 'Вернуть на доработку' }, { timeout: 200 });
    await act(async () => {
      await user.click(requestChangesButton);
    });
    
    await screen.findByRole('heading', { name: 'Вернуть на доработку' }, { timeout: 200 });
    
    const overlay = document.querySelector('[class*="modalOverlay"]');
    await act(async () => {
      if (overlay) {
        await user.click(overlay);
      }
    });
    
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Вернуть на доработку' })).not.toBeInTheDocument();
    }, { timeout: 200 });
  });

  it('should disable reject button when ad is already rejected', async () => {
    mockedApiClient.getAdById.mockResolvedValueOnce({ ...mockAd, status: 'rejected' });
    
    render(<AdDetail />);
    
    const rejectButton = await screen.findByText('Отклонить', {}, { timeout: 200 });
    expect(rejectButton).toBeDisabled();
  });

  it('should handle reject error gracefully', async () => {
    const user = userEvent.setup();
    mockedApiClient.rejectAd.mockImplementationOnce(() => Promise.reject(new Error('Network error')));
    
    render(<AdDetail />);
    
    const rejectButton = await screen.findByText('Отклонить', {}, { timeout: 200 });
    await act(async () => {
      await user.click(rejectButton);
    });
    
    await screen.findByText('Отклонить объявление', {}, { timeout: 200 });
    
    const reasonSelect = screen.getByText(/Причина отклонения/).parentElement?.querySelector('select') as HTMLSelectElement;
    await act(async () => {
      await user.selectOptions(reasonSelect, 'Запрещенный товар');
    });
    
    const submitButton = screen.getAllByText('Отклонить')[1];
    await act(async () => {
      await user.click(submitButton);
    });
    
    expect(mockedApiClient.rejectAd).toHaveBeenCalled();
  });

  it('should display multiple images', async () => {
    mockedApiClient.getAdById.mockImplementationOnce(() => {
      return new Promise((resolve) => {
        queueMicrotask(() => resolve({
          ...mockAd,
          images: ['image1.jpg', 'image2.jpg', 'image3.jpg'],
        }));
      });
    });
    
    render(<AdDetail />);
    
    await screen.findByText('Test Ad', {}, { timeout: 200 });
    
    await waitFor(() => {
      const images = document.querySelectorAll('img');
      expect(images.length).toBeGreaterThanOrEqual(3);
    }, { timeout: 500 });
  });

  it('should display moderation history with reason and comment', async () => {
    mockedApiClient.getAdById.mockResolvedValueOnce({
      ...mockAd,
      moderationHistory: [
        {
          id: 1,
          moderatorId: 1,
          moderatorName: 'John Doe',
          action: 'rejected' as const,
          reason: 'Запрещенный товар',
          comment: 'Contains prohibited items',
          timestamp: '2024-01-01T00:00:00Z',
        },
      ],
    });
    
    render(<AdDetail />);
    
    await screen.findByText('John Doe', {}, { timeout: 200 });
    expect(screen.getByText(/Запрещенный товар/)).toBeInTheDocument();
    expect(screen.getByText(/Contains prohibited items/)).toBeInTheDocument();
  });

  it('should navigate to next ad when button is clicked', async () => {
    mockedApiClient.getAds.mockResolvedValueOnce({
      ads: [
        { ...mockAd, id: 1 },
        { ...mockAd, id: 2 },
        { ...mockAd, id: 3 },
      ],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 3,
        itemsPerPage: 10,
      },
    });
    
    const user = userEvent.setup();
    render(<AdDetail />);
    
    await screen.findByText('Test Ad', {}, { timeout: 200 });
    
    const nextButton = screen.getByText('Следующее →');
    await act(async () => {
      await user.click(nextButton);
    });
    
    await waitFor(() => {
      expect(mockedApiClient.getAds).toHaveBeenCalled();
    }, { timeout: 200 });
  });

  it('should navigate to previous ad when button is clicked', async () => {
    mockedApiClient.getAdById.mockResolvedValueOnce({ ...mockAd, id: 2 });
    mockedApiClient.getAds.mockResolvedValueOnce({
      ads: [
        { ...mockAd, id: 1 },
        { ...mockAd, id: 2 },
        { ...mockAd, id: 3 },
      ],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 3,
        itemsPerPage: 10,
      },
    });
    
    const user = userEvent.setup();
    render(<AdDetail />);
    
    await screen.findByText('Test Ad', {}, { timeout: 200 });
    
    const prevButton = screen.getByText('← Предыдущее');
    await act(async () => {
      await user.click(prevButton);
    });
    
    await waitFor(() => {
      expect(mockedApiClient.getAds).toHaveBeenCalled();
    }, { timeout: 200 });
  });

  it('should handle navigation error gracefully', async () => {
    mockedApiClient.getAds.mockRejectedValueOnce(new Error('Failed to load ads'));
    
    const user = userEvent.setup();
    render(<AdDetail />);
    
    await screen.findByText('Test Ad', {}, { timeout: 200 });
    
    const nextButton = screen.getByText('Следующее →');
    await act(async () => {
      await user.click(nextButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Test Ad')).toBeInTheDocument();
    }, { timeout: 200 });
  });

  it('should not navigate when ad is at the end of list', async () => {
    mockedApiClient.getAds.mockResolvedValueOnce({
      ads: [
        { ...mockAd, id: 1 },
      ],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 1,
        itemsPerPage: 10,
      },
    });
    
    const user = userEvent.setup();
    render(<AdDetail />);
    
    await screen.findByText('Test Ad', {}, { timeout: 200 });
    
    const nextButton = screen.getByText('Следующее →');
    await act(async () => {
      await user.click(nextButton);
    });
    
    await waitFor(() => {
      expect(mockedApiClient.getAds).toHaveBeenCalled();
    }, { timeout: 200 });
  });

  it('should not navigate when ad is at the beginning of list', async () => {
    mockedApiClient.getAds.mockResolvedValueOnce({
      ads: [
        { ...mockAd, id: 1 },
        { ...mockAd, id: 2 },
      ],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 2,
        itemsPerPage: 10,
      },
    });
    
    const user = userEvent.setup();
    render(<AdDetail />);
    
    await screen.findByText('Test Ad', {}, { timeout: 200 });
    
    const prevButton = screen.getByText('← Предыдущее');
    await act(async () => {
      await user.click(prevButton);
    });
    
    await waitFor(() => {
      expect(mockedApiClient.getAds).toHaveBeenCalled();
    }, { timeout: 200 });
  });
});

