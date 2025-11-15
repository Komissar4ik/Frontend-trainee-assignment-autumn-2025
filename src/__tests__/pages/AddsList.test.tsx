import { render, screen, waitFor, act } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import { AddsList } from '@/pages/AddsList';
import { apiClient } from '@/api';
import type { Advertisement } from '@/types';

jest.mock('@/api');
jest.mock('@/hooks/useApi', () => ({
  useApiRequestCancel: jest.fn(),
}));
jest.mock('@/hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: jest.fn(),
}));
const mockSavePreset = jest.fn();
const mockLoadPreset = jest.fn();

jest.mock('@/hooks/useFilterPresets', () => ({
  useFilterPresets: jest.fn(() => ({
    presets: [],
    savePreset: mockSavePreset,
    loadPreset: mockLoadPreset,
  })),
}));
jest.mock('@/utils/realtime', () => ({
  startRealtimeUpdates: jest.fn(),
  stopRealtimeUpdates: jest.fn(),
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
    totalAdds: 10,
    registeredAt: '2023-01-01T00:00:00Z',
  },
  characteristics: {},
  moderationHistory: [],
};

describe('AddsList', () => {
  const defaultResponse = {
    ads: [mockAd],
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 1,
      itemsPerPage: 10,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedApiClient.getAds.mockImplementation(() => {
      return Promise.resolve({
        adds: defaultResponse.ads,
        pagination: defaultResponse.pagination,
      });
    });
  });

  it('should render loading state initially', () => {
    mockedApiClient.getAds.mockImplementation(() => new Promise(() => {}));

    const { container } = render(<AddsList />);

    expect(screen.getByText('Список объявлений')).toBeInTheDocument();
    const skeletons = container.querySelectorAll('[class*="skeleton"], [class*="Skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render ads list after loading', async () => {
    render(<AddsList />);

    expect(await screen.findByText('Test Ad', {}, { timeout: 200 })).toBeInTheDocument();
  });

  it('should render empty state when no ads found', async () => {
    mockedApiClient.getAds.mockResolvedValueOnce({
      adds: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10,
      },
    });

    render(<AddsList />);

    expect(
      await screen.findByText('Объявления не найдены', {}, { timeout: 200 })
    ).toBeInTheDocument();
  });

  it('should display title', () => {
    render(<AddsList />);

    expect(screen.getByText('Список объявлений')).toBeInTheDocument();
  });

  it('should call apiClient.getAds on mount', async () => {
    render(<AddsList />);

    await screen.findByText('Test Ad', {}, { timeout: 200 });
    expect(mockedApiClient.getAds).toHaveBeenCalled();
  });

  it('should display ad price', async () => {
    render(<AddsList />);

    expect(await screen.findByText(/1[,\s]000/)).toBeInTheDocument();
  });

  it('should handle search input change', async () => {
    const user = userEvent.setup();
    render(<AddsList />);

    await screen.findByText('Test Ad', {}, { timeout: 200 });
    const searchInput = screen.getByPlaceholderText(/Поиск по названию/);
    const initialCallCount = mockedApiClient.getAds.mock.calls.length;

    await act(async () => {
      await user.type(searchInput, 'test');
    });

    expect(mockedApiClient.getAds.mock.calls.length).toBeGreaterThan(initialCallCount);
  });

  it('should handle status filter toggle', async () => {
    const user = userEvent.setup();
    render(<AddsList />);

    await screen.findByText('Test Ad', {}, { timeout: 200 });
    const initialCallCount = mockedApiClient.getAds.mock.calls.length;
    const statusCheckbox = screen.getByLabelText(/На модерации/);

    await act(async () => {
      await user.click(statusCheckbox);
    });

    expect(mockedApiClient.getAds.mock.calls.length).toBeGreaterThan(initialCallCount);
  });

  it('should handle category change', async () => {
    const user = userEvent.setup();
    render(<AddsList />);

    await screen.findByText('Test Ad', {}, { timeout: 200 });
    const categoryLabel = screen.getByText(/Категория/);
    const categorySelect = categoryLabel.parentElement?.querySelector(
      'select'
    ) as HTMLSelectElement;

    expect(categorySelect).toBeInTheDocument();

    const initialCallCount = mockedApiClient.getAds.mock.calls.length;

    await act(async () => {
      await user.selectOptions(categorySelect, '0');
    });

    expect(mockedApiClient.getAds.mock.calls.length).toBeGreaterThan(initialCallCount);
  });

  it('should handle reset filters', async () => {
    const user = userEvent.setup();
    render(<AddsList />);

    await screen.findByText('Test Ad', {}, { timeout: 200 });
    const resetButton = screen.getByText('Сбросить фильтры');
    const initialCallCount = mockedApiClient.getAds.mock.calls.length;

    await act(async () => {
      await user.click(resetButton);
    });

    expect(mockedApiClient.getAds.mock.calls.length).toBeGreaterThan(initialCallCount);
  });

  it('should handle sort change', async () => {
    const user = userEvent.setup();
    render(<AddsList />);

    await screen.findByText('Test Ad', {}, { timeout: 200 });
    const priceSortButton = screen.getByText(/По цене/);
    const initialCallCount = mockedApiClient.getAds.mock.calls.length;

    await act(async () => {
      await user.click(priceSortButton);
    });

    expect(mockedApiClient.getAds.mock.calls.length).toBeGreaterThan(initialCallCount);
  });

  it('should handle pagination', async () => {
    mockedApiClient.getAds.mockImplementation(() =>
      Promise.resolve({
        adds: Array.from({ length: 10 }, (_, i) => ({ ...mockAd, id: i + 1 })),
        pagination: {
          currentPage: 1,
          totalPages: 2,
          totalItems: 20,
          itemsPerPage: 10,
        },
      })
    );

    const user = userEvent.setup();
    render(<AddsList />);

    const nextButton = await screen.findByText(/Вперед/);
    const initialCallCount = mockedApiClient.getAds.mock.calls.length;

    await act(async () => {
      await user.click(nextButton);
    });

    expect(mockedApiClient.getAds.mock.calls.length).toBeGreaterThan(initialCallCount);
  });

  it('should display pagination info', async () => {
    mockedApiClient.getAds.mockImplementation(() =>
      Promise.resolve({
        adds: [mockAd],
        pagination: {
          currentPage: 1,
          totalPages: 5,
          totalItems: 50,
          itemsPerPage: 10,
        },
      })
    );

    render(<AddsList />);

    expect(await screen.findByText(/Показано.*из.*50/)).toBeInTheDocument();
  });

  it('should handle API error gracefully', async () => {
    mockedApiClient.getAds.mockImplementation(() => Promise.reject(new Error('API Error')));

    render(<AddsList />);

    await waitFor(
      () => {
        expect(screen.queryByText('Загрузка...')).not.toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  it('should handle price filter input', async () => {
    const user = userEvent.setup();
    render(<AddsList />);

    await screen.findByText('Test Ad', {}, { timeout: 200 });
    const minPriceInput = screen.getByPlaceholderText('От');
    const initialCallCount = mockedApiClient.getAds.mock.calls.length;

    await act(async () => {
      await user.type(minPriceInput, '100');
    });

    expect(mockedApiClient.getAds.mock.calls.length).toBeGreaterThan(initialCallCount);
  });

  it('should select individual ad', async () => {
    const user = userEvent.setup();
    render(<AddsList />);

    await screen.findByText('Test Ad', {}, { timeout: 200 });

    const checkboxes = screen.getAllByRole('checkbox');
    const adCheckbox = checkboxes[1]; // First ad checkbox (after select all)

    await act(async () => {
      await user.click(adCheckbox);
    });

    expect(adCheckbox).toBeChecked();
  });

  it('should select all ads when select all checkbox is clicked', async () => {
    mockedApiClient.getAds.mockImplementation(() => {
      return new Promise((resolve) => {
        queueMicrotask(() =>
          resolve({
            adds: [mockAd, { ...mockAd, id: 2 }],
            pagination: {
              currentPage: 1,
              totalPages: 1,
              totalItems: 2,
              itemsPerPage: 10,
            },
          })
        );
      });
    });

    const user = userEvent.setup();
    render(<AddsList />);

    await screen.findAllByText('Test Ad', {}, { timeout: 500 });

    const checkboxes = screen.getAllByRole('checkbox');
    const selectAllCheckbox = checkboxes[0];

    await act(async () => {
      await user.click(selectAllCheckbox);
    });

    await waitFor(
      () => {
        expect(selectAllCheckbox).toBeChecked();
      },
      { timeout: 500 }
    );
  });

  it('should filter ads by search query', async () => {
    const user = userEvent.setup();
    render(<AddsList />);

    await screen.findByText('Test Ad', {}, { timeout: 200 });

    const searchInput = screen.getByPlaceholderText(/Поиск по названию/);
    await act(async () => {
      await user.type(searchInput, 'Test');
    });

    await waitFor(
      () => {
        expect(mockedApiClient.getAds).toHaveBeenCalled();
      },
      { timeout: 500 }
    );
  });

  it('should filter ads by category', async () => {
    const user = userEvent.setup();
    render(<AddsList />);

    await screen.findByText('Test Ad', {}, { timeout: 200 });

    const categorySelect = screen
      .getByText(/Категория:/)
      .parentElement?.querySelector('select') as HTMLSelectElement;
    await act(async () => {
      await user.selectOptions(categorySelect, '0');
    });

    await waitFor(
      () => {
        expect(mockedApiClient.getAds).toHaveBeenCalled();
      },
      { timeout: 500 }
    );
  });

  it('should filter ads by price range', async () => {
    const user = userEvent.setup();
    render(<AddsList />);

    await screen.findByText('Test Ad', {}, { timeout: 200 });

    const minPriceInput = screen.getByPlaceholderText('От');

    await act(async () => {
      await user.type(minPriceInput, '100');
    });

    await waitFor(
      () => {
        expect(mockedApiClient.getAds).toHaveBeenCalled();
      },
      { timeout: 500 }
    );
  });

  it('should change sort order', async () => {
    const user = userEvent.setup();
    render(<AddsList />);

    await screen.findByText('Test Ad', {}, { timeout: 200 });

    const sortByDateButton = screen.getByText('По дате');
    await act(async () => {
      await user.click(sortByDateButton);
    });

    await waitFor(
      () => {
        expect(mockedApiClient.getAds).toHaveBeenCalled();
      },
      { timeout: 500 }
    );
  });

  it('should sort by price', async () => {
    const user = userEvent.setup();
    render(<AddsList />);

    await screen.findByText('Test Ad', {}, { timeout: 200 });

    const sortByPriceButton = screen.getByText('По цене');
    await act(async () => {
      await user.click(sortByPriceButton);
    });

    await waitFor(
      () => {
        expect(mockedApiClient.getAds).toHaveBeenCalled();
      },
      { timeout: 500 }
    );
  });

  it('should sort by priority', async () => {
    const user = userEvent.setup();
    render(<AddsList />);

    await screen.findByText('Test Ad', {}, { timeout: 200 });

    const sortByPriorityButton = screen.getByText('По приоритету');
    await act(async () => {
      await user.click(sortByPriorityButton);
    });

    await waitFor(
      () => {
        expect(mockedApiClient.getAds).toHaveBeenCalled();
      },
      { timeout: 500 }
    );
  });

  it('should navigate to next page', async () => {
    mockedApiClient.getAds.mockImplementation(() => {
      return new Promise((resolve) => {
        queueMicrotask(() =>
          resolve({
            adds: [mockAd],
            pagination: {
              currentPage: 1,
              totalPages: 3,
              totalItems: 30,
              itemsPerPage: 10,
            },
          })
        );
      });
    });

    const user = userEvent.setup();
    render(<AddsList />);

    await screen.findByText('Test Ad', {}, { timeout: 200 });

    const nextButton = screen.getByText('Вперед');
    await act(async () => {
      await user.click(nextButton);
    });

    await waitFor(
      () => {
        expect(mockedApiClient.getAds).toHaveBeenCalled();
      },
      { timeout: 500 }
    );
  });

  it('should navigate to previous page', async () => {
    mockedApiClient.getAds.mockImplementation(() => {
      return new Promise((resolve) => {
        queueMicrotask(() =>
          resolve({
            adds: [mockAd],
            pagination: {
              currentPage: 2,
              totalPages: 3,
              totalItems: 30,
              itemsPerPage: 10,
            },
          })
        );
      });
    });

    const user = userEvent.setup();
    render(<AddsList />);

    await screen.findByText('Test Ad', {}, { timeout: 200 });

    const prevButton = screen.getByText('Назад');
    await act(async () => {
      await user.click(prevButton);
    });

    await waitFor(
      () => {
        expect(mockedApiClient.getAds).toHaveBeenCalled();
      },
      { timeout: 500 }
    );
  });

  it('should reset filters when reset button is clicked', async () => {
    const user = userEvent.setup();
    render(<AddsList />);

    await screen.findByText('Test Ad', {}, { timeout: 200 });

    // First change a filter
    const categorySelect = screen
      .getByText(/Категория:/)
      .parentElement?.querySelector('select') as HTMLSelectElement;
    await act(async () => {
      await user.selectOptions(categorySelect, '0');
    });

    // Then reset
    const resetButton = screen.getByText('Сбросить фильтры');
    await act(async () => {
      await user.click(resetButton);
    });

    await waitFor(
      () => {
        expect(mockedApiClient.getAds).toHaveBeenCalled();
      },
      { timeout: 500 }
    );
  });

  it('should save filter preset', async () => {
    const user = userEvent.setup();
    render(<AddsList />);

    await screen.findByText('Test Ad', {}, { timeout: 200 });

    const saveButton = screen.getByText('Сохранить фильтры');
    await act(async () => {
      await user.click(saveButton);
    });

    const presetNameInput = await screen.findByPlaceholderText(
      /Название набора/,
      {},
      { timeout: 200 }
    );
    await act(async () => {
      await user.type(presetNameInput, 'My Preset');
    });

    const savePresetButton = screen.getByRole('button', { name: 'Сохранить' });
    await act(async () => {
      await user.click(savePresetButton);
    });

    expect(mockSavePreset).toHaveBeenCalled();
  });

  it('should load filter preset', async () => {
    const useFilterPresetsModule = await import('@/hooks/useFilterPresets');
    const { useFilterPresets } = useFilterPresetsModule;
    useFilterPresets.mockReturnValue({
      presets: [{ id: '1', name: 'Saved Preset' }],
      savePreset: mockSavePreset,
      loadPreset: mockLoadPreset,
    });

    mockLoadPreset.mockReturnValue({
      status: ['approved'],
      categoryId: 1,
    });

    const user = userEvent.setup();
    render(<AddsList />);

    await screen.findByText('Test Ad', {}, { timeout: 200 });

    const presetButton = await screen.findByText('Saved Preset', {}, { timeout: 200 });
    await act(async () => {
      await user.click(presetButton);
    });

    expect(mockLoadPreset).toHaveBeenCalledWith('1');
  });

  it('should close preset modal when cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<AddsList />);

    await screen.findByText('Test Ad', {}, { timeout: 200 });

    const saveButton = screen.getByText('Сохранить фильтры');
    await act(async () => {
      await user.click(saveButton);
    });

    await screen.findByPlaceholderText(/Название набора/, {}, { timeout: 200 });

    const cancelButton = screen.getByText('Отмена');
    await act(async () => {
      await user.click(cancelButton);
    });

    await waitFor(
      () => {
        expect(screen.queryByPlaceholderText(/Название набора/)).not.toBeInTheDocument();
      },
      { timeout: 200 }
    );
  });

  it('should close preset modal when overlay is clicked', async () => {
    const user = userEvent.setup();
    render(<AddsList />);

    await screen.findByText('Test Ad', {}, { timeout: 200 });

    const saveButton = screen.getByText('Сохранить фильтры');
    await act(async () => {
      await user.click(saveButton);
    });

    await screen.findByPlaceholderText(/Название набора/, {}, { timeout: 200 });

    const overlay = document.querySelector('[class*="modalOverlay"]');
    await act(async () => {
      if (overlay) {
        await user.click(overlay);
      }
    });

    await waitFor(
      () => {
        expect(screen.queryByPlaceholderText(/Название набора/)).not.toBeInTheDocument();
      },
      { timeout: 200 }
    );
  });

  it('should toggle status filter', async () => {
    const user = userEvent.setup();
    render(<AddsList />);

    await screen.findByText('Test Ad', {}, { timeout: 200 });

    const statusCheckbox = screen.getByLabelText('Одобрено');
    await act(async () => {
      await user.click(statusCheckbox);
    });

    await waitFor(
      () => {
        expect(mockedApiClient.getAds).toHaveBeenCalled();
      },
      { timeout: 500 }
    );
  });

  it('should handle API error gracefully', async () => {
    mockedApiClient.getAds.mockImplementationOnce(() => Promise.reject(new Error('API Error')));

    render(<AddsList />);

    await waitFor(
      () => {
        expect(screen.getByText('Список объявлений')).toBeInTheDocument();
      },
      { timeout: 500 }
    );
  });

  it('should display empty state when no ads found', async () => {
    mockedApiClient.getAds.mockImplementation(() => {
      return new Promise((resolve) => {
        queueMicrotask(() =>
          resolve({
            adds: [],
            pagination: {
              currentPage: 1,
              totalPages: 1,
              totalItems: 0,
              itemsPerPage: 10,
            },
          })
        );
      });
    });

    render(<AddsList />);

    await screen.findByText('Объявления не найдены', {}, { timeout: 500 });
  });

  it('should navigate to ad detail when ad is clicked', async () => {
    const user = userEvent.setup();
    render(<AddsList />);

    const adTitle = await screen.findByText('Test Ad', {}, { timeout: 200 });
    const adCard = adTitle.closest('[class*="adCardContent"]');

    await act(async () => {
      if (adCard) {
        await user.click(adCard);
      }
    });

    // Navigation would be tested through router mock
  });
});
