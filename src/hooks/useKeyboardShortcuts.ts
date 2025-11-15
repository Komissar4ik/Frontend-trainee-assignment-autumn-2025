import { useEffect, useCallback } from 'react';

interface KeyboardShortcuts {
  onApprove?: () => void;
  onReject?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  onSearchFocus?: () => void;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcuts): void {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent): void => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        if (event.key === '/') {
          event.preventDefault();
          shortcuts.onSearchFocus?.();
        }
        return;
      }

      switch (event.key.toLowerCase()) {
        case 'a':
          event.preventDefault();
          shortcuts.onApprove?.();
          break;
        case 'd':
          event.preventDefault();
          shortcuts.onReject?.();
          break;
        case 'arrowright':
          event.preventDefault();
          shortcuts.onNext?.();
          break;
        case 'arrowleft':
          event.preventDefault();
          shortcuts.onPrev?.();
          break;
        case '/':
          event.preventDefault();
          shortcuts.onSearchFocus?.();
          break;
      }
    },
    [shortcuts]
  );

  useEffect((): (() => void) => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}
