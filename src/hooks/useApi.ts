import { useEffect } from 'react';
import { apiClient } from '@/api';

export function useApiRequestCancel(): void {
  useEffect(() => {
    return () => {
      apiClient.cancelAllRequests();
    };
  }, []);
}

export function useCancelOnUnmount(key: string): void {
  useEffect(() => {
    return () => {
      apiClient.cancelRequest(key);
    };
  }, [key]);
}

