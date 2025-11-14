import { apiClient } from '@/api/client';
import type { AdsFilters, StatsFilters } from '@/types';

describe('ApiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiClient as any).cancelTokens.clear();
    
    const mockGet = jest.fn().mockResolvedValue({ data: { ads: [], pagination: {} } });
    const mockPost = jest.fn().mockResolvedValue({ data: { ad: {}, message: '' } });
    (apiClient as any).client.get = mockGet;
    (apiClient as any).client.post = mockPost;
  });

  describe('cancelRequest', () => {
    it('should cancel request with given key', () => {
      const cancelMock = jest.fn();
      const source = { cancel: cancelMock, token: {} };
      (apiClient as any).cancelTokens.set('test-key', source);

      apiClient.cancelRequest('test-key');

      expect(cancelMock).toHaveBeenCalled();
      expect((apiClient as any).cancelTokens.has('test-key')).toBe(false);
    });

    it('should handle non-existent key gracefully', () => {
      expect(() => {
        apiClient.cancelRequest('non-existent-key');
      }).not.toThrow();
    });
  });

  describe('cancelAllRequests', () => {
    it('should cancel all pending requests', () => {
      const cancelMock1 = jest.fn();
      const cancelMock2 = jest.fn();
      const source1 = { cancel: cancelMock1, token: {} };
      const source2 = { cancel: cancelMock2, token: {} };
      (apiClient as any).cancelTokens.set('key1', source1);
      (apiClient as any).cancelTokens.set('key2', source2);

      apiClient.cancelAllRequests();

      expect(cancelMock1).toHaveBeenCalled();
      expect(cancelMock2).toHaveBeenCalled();
      expect((apiClient as any).cancelTokens.size).toBe(0);
    });

    it('should handle empty tokens map', () => {
      (apiClient as any).cancelTokens.clear();
      expect(() => {
        apiClient.cancelAllRequests();
      }).not.toThrow();
    });
  });

  describe('buildQueryString', () => {
    it('should build query string from filters with arrays', async () => {
      const mockGet = jest.fn().mockResolvedValue({ data: { ads: [], pagination: {} } });
      (apiClient as any).client.get = mockGet;
      
      const filters: AdsFilters = {
        status: ['pending', 'approved'],
        page: 1,
        limit: 10,
      };

      await apiClient.getAds(filters);

      expect(mockGet).toHaveBeenCalled();
      const callUrl = mockGet.mock.calls[0][0];
      expect(callUrl).toContain('status=pending');
      expect(callUrl).toContain('status=approved');
      expect(callUrl).toContain('page=1');
      expect(callUrl).toContain('limit=10');
    });

    it('should exclude undefined, null and empty values', async () => {
      const mockGet = jest.fn().mockResolvedValue({ data: { ads: [], pagination: {} } });
      (apiClient as any).client.get = mockGet;
      
      const filters: AdsFilters = {
        page: 1,
        search: '',
        categoryId: undefined,
        minPrice: null as any,
      };

      await apiClient.getAds(filters);

      const callUrl = mockGet.mock.calls[0][0];
      expect(callUrl).toContain('page=1');
      expect(callUrl).not.toContain('search=');
      expect(callUrl).not.toContain('categoryId=');
      expect(callUrl).not.toContain('minPrice=');
    });

    it('should handle StatsFilters', async () => {
      const mockGet = jest.fn().mockResolvedValue({ data: [] });
      (apiClient as any).client.get = mockGet;
      
      const filters: StatsFilters = {
        period: 'week',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };

      await apiClient.getStatsSummary(filters);

      const callUrl = mockGet.mock.calls[0][0];
      expect(callUrl).toContain('period=week');
      expect(callUrl).toContain('startDate=2024-01-01');
      expect(callUrl).toContain('endDate=2024-01-31');
    });
  });

  describe('createCancelToken', () => {
    it('should cancel existing token when creating new one with same key', async () => {
      const cancelMock = jest.fn();
      const existingSource = { cancel: cancelMock, token: {} };
      (apiClient as any).cancelTokens.set('getAds', existingSource);
      
      const mockGet = jest.fn().mockResolvedValue({ data: { ads: [], pagination: {} } });
      (apiClient as any).client.get = mockGet;

      await apiClient.getAds();

      expect(cancelMock).toHaveBeenCalled();
    });
  });

  describe('API methods', () => {
    it('should call getAdById with correct id', async () => {
      const mockGet = jest.fn().mockResolvedValue({ data: { id: 1 } });
      (apiClient as any).client.get = mockGet;

      await apiClient.getAdById(1);

      expect(mockGet).toHaveBeenCalledWith('/ads/1', expect.any(Object));
    });

    it('should call approveAd with correct id', async () => {
      const mockPost = jest.fn().mockResolvedValue({ data: { ad: { id: 1 }, message: '' } });
      (apiClient as any).client.post = mockPost;

      await apiClient.approveAd(1);

      expect(mockPost).toHaveBeenCalledWith('/ads/1/approve');
    });

    it('should call rejectAd with correct data', async () => {
      const mockPost = jest.fn().mockResolvedValue({ data: { ad: { id: 1 }, message: '' } });
      (apiClient as any).client.post = mockPost;
      const data = { reason: 'Другое' as const, comment: 'Test' };

      await apiClient.rejectAd(1, data);

      expect(mockPost).toHaveBeenCalledWith('/ads/1/reject', data);
    });

    it('should call requestChanges with correct data', async () => {
      const mockPost = jest.fn().mockResolvedValue({ data: { ad: { id: 1 }, message: '' } });
      (apiClient as any).client.post = mockPost;
      const data = { reason: 'Другое' as const, comment: 'Test' };

      await apiClient.requestChanges(1, data);

      expect(mockPost).toHaveBeenCalledWith('/ads/1/request-changes', data);
    });

    it('should call getActivityChart with filters', async () => {
      const mockGet = jest.fn().mockResolvedValue({ data: [] });
      (apiClient as any).client.get = mockGet;
      const filters: StatsFilters = { period: 'week' };

      await apiClient.getActivityChart(filters);

      expect(mockGet).toHaveBeenCalled();
      const callUrl = mockGet.mock.calls[0][0];
      expect(callUrl).toContain('period=week');
    });

    it('should call getDecisionsChart with filters', async () => {
      const mockGet = jest.fn().mockResolvedValue({ data: { approved: 0, rejected: 0, requestChanges: 0 } });
      (apiClient as any).client.get = mockGet;
      const filters: StatsFilters = { period: 'month' };

      await apiClient.getDecisionsChart(filters);

      expect(mockGet).toHaveBeenCalled();
      const callUrl = mockGet.mock.calls[0][0];
      expect(callUrl).toContain('period=month');
    });

    it('should call getCategoriesChart with filters', async () => {
      const mockGet = jest.fn().mockResolvedValue({ data: {} });
      (apiClient as any).client.get = mockGet;
      const filters: StatsFilters = { startDate: '2024-01-01' };

      await apiClient.getCategoriesChart(filters);

      expect(mockGet).toHaveBeenCalled();
      const callUrl = mockGet.mock.calls[0][0];
      expect(callUrl).toContain('startDate=2024-01-01');
    });

    it('should call getCurrentModerator', async () => {
      const mockGet = jest.fn().mockResolvedValue({ data: { id: 1 } });
      (apiClient as any).client.get = mockGet;

      await apiClient.getCurrentModerator();

      expect(mockGet).toHaveBeenCalledWith('/moderators/me', expect.any(Object));
    });

    it('should handle empty filters in getAds', async () => {
      const mockGet = jest.fn().mockResolvedValue({ data: { ads: [], pagination: {} } });
      (apiClient as any).client.get = mockGet;

      await apiClient.getAds({});

      expect(mockGet).toHaveBeenCalled();
      const callUrl = mockGet.mock.calls[0][0];
      expect(callUrl).toBe('/ads');
    });

    it('should handle error in API call', async () => {
      const mockGet = jest.fn().mockRejectedValue(new Error('Network error'));
      (apiClient as any).client.get = mockGet;

      await expect(apiClient.getAds()).rejects.toThrow('Network error');
    });
  });

  describe('interceptors', () => {
    it('should handle cancel error in interceptor', async () => {
      const axios = require('axios');
      const CancelToken = axios.CancelToken;
      const source = CancelToken.source();
      
      const mockGet = jest.fn().mockImplementation(() => {
        source.cancel('Request cancelled');
        return Promise.reject(axios.Cancel('Request cancelled'));
      });
      (apiClient as any).client.get = mockGet;

      await expect(apiClient.getAds()).rejects.toBeDefined();
    });
  });
});

