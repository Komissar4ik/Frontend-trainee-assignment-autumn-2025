import { useEffect } from 'react';
import { apiClient } from '@/api';

export function useApiRequestCancel(): void {
  useEffect((): (() => void) => {
    return () => {
      apiClient.cancelAllRequests();
    };
  }, []);
}

export function useCancelOnUnmount(key: string): void {
  useEffect((): (() => void) => {
    return () => {
      apiClient.cancelRequest(key);
    };
  }, [key]);
}
