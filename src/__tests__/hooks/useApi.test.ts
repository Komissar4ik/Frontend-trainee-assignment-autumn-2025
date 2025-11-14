import { renderHook } from '@testing-library/react';
import { useApiRequestCancel, useCancelOnUnmount } from '@/hooks/useApi';
import { apiClient } from '@/api';

jest.mock('@/api', () => ({
  apiClient: {
    cancelAllRequests: jest.fn(),
    cancelRequest: jest.fn(),
  },
}));

describe('useApiRequestCancel', () => {
  it('should cancel all requests on unmount', () => {
    const { unmount } = renderHook(() => useApiRequestCancel());
    
    unmount();
    
    expect(apiClient.cancelAllRequests).toHaveBeenCalledTimes(1);
  });
});

describe('useCancelOnUnmount', () => {
  it('should cancel specific request on unmount', () => {
    const { unmount } = renderHook(() => useCancelOnUnmount('test-key'));
    
    unmount();
    
    expect(apiClient.cancelRequest).toHaveBeenCalledWith('test-key');
  });

  it('should cancel request when key changes', () => {
    const { rerender, unmount } = renderHook(
      ({ key }) => useCancelOnUnmount(key),
      { initialProps: { key: 'key1' } }
    );
    
    rerender({ key: 'key2' });
    
    expect(apiClient.cancelRequest).toHaveBeenCalledWith('key1');
    
    unmount();
    
    expect(apiClient.cancelRequest).toHaveBeenCalledWith('key2');
  });
});


