import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient } from '@/api';
import { useApiRequestCancel } from '@/hooks/useApi';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useFilterPresets } from '@/hooks/useFilterPresets';
import { startRealtimeUpdates, stopRealtimeUpdates } from '@/utils/realtime';
import { Card, Button, Input, AddCardSkeleton } from '@/components';
import type { Advertisement, AddsFilters, AddStatus, SortBy, SortOrder } from '@/types';
import { formatPrice, formatDateString } from '@/utils';
import { getStatusLabel, getPriorityLabel } from '@/utils/status';
import styles from './AddsList.module.css';

const ITEMS_PER_PAGE = 10;

export function AddsList(): JSX.Element {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);
  useApiRequestCancel();

  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [newAdsCount, setNewAdsCount] = useState(0);

  const { presets, savePreset, loadPreset } = useFilterPresets();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  const parseStatusesFromParams = (statusParam: string | null): AddStatus[] => {
    if (!statusParam) {
      return [];
    }
    const isValidStatus = (status: string): status is AddStatus => {
      return (
        status === 'pending' || status === 'approved' || status === 'rejected' || status === 'draft'
      );
    };
    return statusParam.split(',').filter(isValidStatus);
  };

  const [selectedStatuses, setSelectedStatuses] = useState<AddStatus[]>(() => {
    return parseStatusesFromParams(searchParams.get('status'));
  });
  const [categoryId, setCategoryId] = useState<number | undefined>(
    searchParams.get('categoryId') ? Number(searchParams.get('categoryId')) : undefined
  );
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');

  const parseSortBy = (value: string | null): SortBy => {
    const isValidSortBy = (val: string): val is SortBy => {
      return val === 'createdAt' || val === 'price' || val === 'priority';
    };
    if (value && isValidSortBy(value)) {
      return value;
    }
    return 'createdAt';
  };

  const parseSortOrder = (value: string | null): SortOrder => {
    return value === 'asc' || value === 'desc' ? value : 'desc';
  };

  const [sortBy, setSortBy] = useState<SortBy>(() => parseSortBy(searchParams.get('sortBy')));
  const [sortOrder, setSortOrder] = useState<SortOrder>(() =>
    parseSortOrder(searchParams.get('sortOrder'))
  );

  const loadAds = useCallback(async () => {
    setLoading(true);
    try {
      const page = Number(searchParams.get('page')) || 1;
      setCurrentPage(page);

      const filters: AddsFilters = {
        page,
        limit: ITEMS_PER_PAGE,
        sortBy,
        sortOrder,
      };

      if (searchQuery) {
        filters.search = searchQuery;
      }
      if (selectedStatuses.length > 0) {
        filters.status = selectedStatuses;
      }
      if (categoryId !== undefined) {
        filters.categoryId = categoryId;
      }
      if (minPrice) {
        filters.minPrice = Number(minPrice);
      }
      if (maxPrice) {
        filters.maxPrice = Number(maxPrice);
      }

      const response = await apiClient.getAds(filters);
      setAds(response.adds);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.totalItems);
      setNewAdsCount(0);
    } catch (error) {
      console.error('Failed to load ads:', error);
    } finally {
      setLoading(false);
    }
  }, [
    searchParams,
    searchQuery,
    selectedStatuses,
    categoryId,
    minPrice,
    maxPrice,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    loadAds();
  }, [loadAds]);

  useEffect((): (() => void) => {
    const checkForNewAds = (): void => {
      const filters: AddsFilters = {
        page: 1,
        limit: ITEMS_PER_PAGE,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };
      apiClient
        .getAds(filters)
        .then((response) => {
          if (response.adds.length > 0 && ads.length > 0) {
            const newCount = response.adds.filter(
              (newAd: Advertisement) => !ads.some((oldAd: Advertisement) => oldAd.id === newAd.id)
            ).length;
            if (newCount > 0) {
              setNewAdsCount(newCount);
            }
          }
        })
        .catch(() => {});
    };

    startRealtimeUpdates(checkForNewAds, 30000);
    return () => {
      stopRealtimeUpdates(checkForNewAds);
    };
  }, [ads]);

  useKeyboardShortcuts({
    onSearchFocus: () => {
      searchInputRef.current?.focus();
    },
  });

  const updateSearchParams = useCallback(
    (updates: Record<string, string | null>) => {
      const newParams = new URLSearchParams(searchParams);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '') {
          newParams.delete(key);
        } else {
          newParams.set(key, value);
        }
      });
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams]
  );

  const handleSearchChange = (value: string): void => {
    setSearchQuery(value);
    updateSearchParams({ search: value || null, page: '1' });
  };

  const handleStatusToggle = (status: AddStatus): void => {
    const newStatuses = selectedStatuses.includes(status)
      ? selectedStatuses.filter((s) => s !== status)
      : [...selectedStatuses, status];
    setSelectedStatuses(newStatuses);
    updateSearchParams({
      status: newStatuses.length > 0 ? newStatuses.join(',') : null,
      page: '1',
    });
  };

  const handleCategoryChange = (value: string): void => {
    const id = value ? Number(value) : undefined;
    setCategoryId(id);
    updateSearchParams({ categoryId: value || null, page: '1' });
  };

  const handlePriceChange = (type: 'min' | 'max', value: string): void => {
    if (type === 'min') {
      setMinPrice(value);
      updateSearchParams({ minPrice: value || null, page: '1' });
    } else {
      setMaxPrice(value);
      updateSearchParams({ maxPrice: value || null, page: '1' });
    }
  };

  const handleSortChange = (field: SortBy): void => {
    const newOrder = sortBy === field && sortOrder === 'desc' ? 'asc' : 'desc';
    setSortBy(field);
    setSortOrder(newOrder);
    updateSearchParams({ sortBy: field, sortOrder: newOrder, page: '1' });
  };

  const handleResetFilters = (): void => {
    setSearchQuery('');
    setSelectedStatuses([]);
    setCategoryId(undefined);
    setMinPrice('');
    setMaxPrice('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setSelectedIds(new Set());
    setSearchParams({});
  };

  const handlePageChange = (page: number): void => {
    updateSearchParams({ page: String(page) });
    setSelectedIds(new Set());
  };

  const handleSelectAll = (): void => {
    if (selectedIds.size === ads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(ads.map((ad) => ad.id)));
    }
  };

  const handleSelectAd = (id: number): void => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkAction = async (
    action: (id: number) => Promise<Advertisement>,
    errorMessage: string
  ): Promise<void> => {
    if (selectedIds.size === 0) {
      return;
    }
    setBulkLoading(true);
    try {
      await Promise.all(Array.from(selectedIds).map(action));
      setSelectedIds(new Set());
      await loadAds();
    } catch (error) {
      console.error(errorMessage, error);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkApprove = async (): Promise<void> => {
    await handleBulkAction(apiClient.approveAd.bind(apiClient), 'Failed to approve ads:');
  };

  const handleBulkReject = async (): Promise<void> => {
    await handleBulkAction(
      (id: number) => apiClient.rejectAd(id, { reason: 'Другое', comment: 'Массовое отклонение' }),
      'Failed to reject ads:'
    );
  };

  const handleSavePreset = (): void => {
    const filters: AddsFilters = {
      status: selectedStatuses.length > 0 ? selectedStatuses : undefined,
      categoryId,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      search: searchQuery || undefined,
      sortBy,
      sortOrder,
    };
    savePreset(presetName, filters);
    setPresetName('');
    setShowPresetModal(false);
  };

  const handleLoadPreset = (presetId: string): void => {
    const presetFilters = loadPreset(presetId);
    if (presetFilters) {
      setSearchQuery(presetFilters.search || '');
      setSelectedStatuses(presetFilters.status || []);
      setCategoryId(presetFilters.categoryId);
      setMinPrice(presetFilters.minPrice?.toString() || '');
      setMaxPrice(presetFilters.maxPrice?.toString() || '');
      setSortBy(presetFilters.sortBy || 'createdAt');
      setSortOrder(presetFilters.sortOrder || 'desc');
      const newParams = new URLSearchParams();
      if (presetFilters.search) {
        newParams.set('search', presetFilters.search);
      }
      if (presetFilters.status && presetFilters.status.length > 0) {
        newParams.set('status', presetFilters.status.join(','));
      }
      if (presetFilters.categoryId !== undefined) {
        newParams.set('categoryId', String(presetFilters.categoryId));
      }
      if (presetFilters.minPrice) {
        newParams.set('minPrice', String(presetFilters.minPrice));
      }
      if (presetFilters.maxPrice) {
        newParams.set('maxPrice', String(presetFilters.maxPrice));
      }
      if (presetFilters.sortBy) {
        newParams.set('sortBy', presetFilters.sortBy);
      }
      if (presetFilters.sortOrder) {
        newParams.set('sortOrder', presetFilters.sortOrder);
      }
      setSearchParams(newParams);
    }
  };

  const statusOptions: AddStatus[] = ['pending', 'approved', 'rejected'];
  const categories = [
    { id: 0, name: 'Электроника' },
    { id: 1, name: 'Недвижимость' },
    { id: 2, name: 'Транспорт' },
    { id: 3, name: 'Работа' },
    { id: 4, name: 'Услуги' },
    { id: 5, name: 'Животные' },
    { id: 6, name: 'Мода' },
    { id: 7, name: 'Детское' },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Список объявлений</h1>
        {newAdsCount > 0 && (
          <div className={styles.newAdsBadge}>
            {newAdsCount} новых объявлений
            <Button
              size="small"
              variant="primary"
              onClick={() => {
                setNewAdsCount(0);
                loadAds();
              }}
            >
              Обновить
            </Button>
          </div>
        )}
      </div>

      <div className={styles.filters}>
        <div className={styles.searchSection}>
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Поиск по названию... (нажмите /)"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        <div className={styles.filterRow}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Статус:</label>
            <div className={styles.checkboxGroup}>
              {statusOptions.map((status) => (
                <label key={status} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={selectedStatuses.includes(status)}
                    onChange={() => handleStatusToggle(status)}
                  />
                  {getStatusLabel(status)}
                </label>
              ))}
            </div>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Категория:</label>
            <select
              className={styles.select}
              value={categoryId ?? ''}
              onChange={(e) => handleCategoryChange(e.target.value)}
            >
              <option value="">Все категории</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Цена:</label>
            <div className={styles.priceInputs}>
              <Input
                type="number"
                placeholder="От"
                value={minPrice}
                onChange={(e) => handlePriceChange('min', e.target.value)}
              />
              <Input
                type="number"
                placeholder="До"
                value={maxPrice}
                onChange={(e) => handlePriceChange('max', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className={styles.filterActions}>
          <Button onClick={handleResetFilters} variant="secondary" size="small">
            Сбросить фильтры
          </Button>
          <Button onClick={() => setShowPresetModal(true)} variant="secondary" size="small">
            Сохранить фильтры
          </Button>
          {presets.length > 0 && (
            <div className={styles.presets}>
              <span className={styles.presetsLabel}>Сохраненные:</span>
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  className={styles.presetButton}
                  onClick={() => handleLoadPreset(preset.id)}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.sortSection}>
        <span className={styles.sortLabel}>Сортировка:</span>
        <button
          className={`${styles.sortButton} ${sortBy === 'createdAt' ? styles.active : ''}`}
          onClick={() => handleSortChange('createdAt')}
        >
          По дате {sortBy === 'createdAt' && (sortOrder === 'desc' ? '↓' : '↑')}
        </button>
        <button
          className={`${styles.sortButton} ${sortBy === 'price' ? styles.active : ''}`}
          onClick={() => handleSortChange('price')}
        >
          По цене {sortBy === 'price' && (sortOrder === 'desc' ? '↓' : '↑')}
        </button>
        <button
          className={`${styles.sortButton} ${sortBy === 'priority' ? styles.active : ''}`}
          onClick={() => handleSortChange('priority')}
        >
          По приоритету {sortBy === 'priority' && (sortOrder === 'desc' ? '↓' : '↑')}
        </button>
      </div>

      {selectedIds.size > 0 && (
        <div className={styles.bulkActions}>
          <span className={styles.bulkInfo}>Выбрано: {selectedIds.size}</span>
          <Button onClick={handleBulkApprove} variant="success" disabled={bulkLoading}>
            Одобрить выбранные
          </Button>
          <Button onClick={handleBulkReject} variant="danger" disabled={bulkLoading}>
            Отклонить выбранные
          </Button>
          <Button onClick={() => setSelectedIds(new Set())} variant="secondary" size="small">
            Снять выбор
          </Button>
        </div>
      )}

      {loading ? (
        <div className={styles.adsGrid}>
          {Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
            <AddCardSkeleton key={index} />
          ))}
        </div>
      ) : (
        <>
          {ads.length === 0 ? (
            <div className={styles.empty}>Объявления не найдены</div>
          ) : (
            <>
              <div className={styles.adsGrid}>
                <div className={styles.selectAll}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={selectedIds.size === ads.length && ads.length > 0}
                      onChange={handleSelectAll}
                    />
                    Выбрать все
                  </label>
                </div>
                {ads.map((ad) => (
                  <Card key={ad.id} className={styles.adCardWrapper}>
                    <div className={styles.adCard}>
                      <div className={styles.adCheckbox}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(ad.id)}
                          onChange={() => handleSelectAd(ad.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div
                        className={styles.adCardContent}
                        onClick={() => navigate(`/item/${ad.id}`)}
                      >
                        <img
                          src={ad.images[0] || '/placeholder.png'}
                          alt={ad.title}
                          className={styles.adImage}
                        />
                        <div className={styles.adContent}>
                          <h3 className={styles.adTitle}>{ad.title}</h3>
                          <div className={styles.adPrice}>{formatPrice(ad.price)}</div>
                          <div className={styles.adMeta}>
                            <span className={styles.adCategory}>{ad.category}</span>
                            <span className={styles.adDate}>{formatDateString(ad.createdAt)}</span>
                          </div>
                          <div className={styles.adStatus}>
                            <span
                              className={`${styles.statusBadge} ${styles[`status-${ad.status}`]}`}
                            >
                              {getStatusLabel(ad.status)}
                            </span>
                            <span
                              className={`${styles.priorityBadge} ${styles[`priority-${ad.priority}`]}`}
                            >
                              {getPriorityLabel(ad.priority)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className={styles.pagination}>
                <div className={styles.paginationInfo}>
                  Показано {ads.length} из {totalItems} объявлений
                </div>
                <div className={styles.paginationControls}>
                  <Button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    variant="secondary"
                  >
                    Назад
                  </Button>
                  <span className={styles.pageInfo}>
                    Страница {currentPage} из {totalPages}
                  </span>
                  <Button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    variant="secondary"
                  >
                    Вперед
                  </Button>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {showPresetModal && (
        <div className={styles.modalOverlay} onClick={() => setShowPresetModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Сохранить набор фильтров</h3>
            <Input
              placeholder="Название набора"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
            />
            <div className={styles.modalActions}>
              <Button onClick={() => setShowPresetModal(false)} variant="secondary">
                Отмена
              </Button>
              <Button onClick={handleSavePreset} variant="primary" disabled={!presetName.trim()}>
                Сохранить
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
