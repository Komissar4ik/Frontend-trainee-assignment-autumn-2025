import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  let mockOnApprove: jest.Mock;
  let mockOnReject: jest.Mock;
  let mockOnNext: jest.Mock;
  let mockOnPrev: jest.Mock;
  let mockOnSearchFocus: jest.Mock;

  beforeEach(() => {
    mockOnApprove = jest.fn();
    mockOnReject = jest.fn();
    mockOnNext = jest.fn();
    mockOnPrev = jest.fn();
    mockOnSearchFocus = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call onApprove when A key is pressed', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        onApprove: mockOnApprove,
      })
    );

    const event = new KeyboardEvent('keydown', { key: 'a' });
    window.dispatchEvent(event);

    expect(mockOnApprove).toHaveBeenCalledTimes(1);
  });

  it('should call onReject when D key is pressed', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        onReject: mockOnReject,
      })
    );

    const event = new KeyboardEvent('keydown', { key: 'd' });
    window.dispatchEvent(event);

    expect(mockOnReject).toHaveBeenCalledTimes(1);
  });

  it('should call onNext when ArrowRight key is pressed', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        onNext: mockOnNext,
      })
    );

    const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
    window.dispatchEvent(event);

    expect(mockOnNext).toHaveBeenCalledTimes(1);
  });

  it('should call onPrev when ArrowLeft key is pressed', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        onPrev: mockOnPrev,
      })
    );

    const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
    window.dispatchEvent(event);

    expect(mockOnPrev).toHaveBeenCalledTimes(1);
  });

  it('should call onSearchFocus when / key is pressed', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        onSearchFocus: mockOnSearchFocus,
      })
    );

    const event = new KeyboardEvent('keydown', { key: '/' });
    window.dispatchEvent(event);

    expect(mockOnSearchFocus).toHaveBeenCalledTimes(1);
  });

  it('should not trigger shortcuts when typing in input', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    renderHook(() =>
      useKeyboardShortcuts({
        onApprove: mockOnApprove,
      })
    );

    input.focus();
    
    const event = new KeyboardEvent('keydown', { 
      key: 'a',
      bubbles: true,
      cancelable: true
    });
    
    Object.defineProperty(event, 'target', {
      get: () => input,
      configurable: true,
    });

    window.dispatchEvent(event);

    expect(mockOnApprove).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });

  it('should trigger search focus shortcut even in input for / key', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    renderHook(() =>
      useKeyboardShortcuts({
        onSearchFocus: mockOnSearchFocus,
      })
    );

    const event = new KeyboardEvent('keydown', { key: '/' });
    window.dispatchEvent(event);

    expect(mockOnSearchFocus).toHaveBeenCalledTimes(1);

    document.body.removeChild(input);
  });

  it('should handle textarea element like input', () => {
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    textarea.focus();

    renderHook(() =>
      useKeyboardShortcuts({
        onApprove: mockOnApprove,
      })
    );

    const event = new KeyboardEvent('keydown', { key: 'a' });
    Object.defineProperty(event, 'target', {
      get: () => textarea,
      configurable: true,
    });
    window.dispatchEvent(event);

    expect(mockOnApprove).not.toHaveBeenCalled();

    document.body.removeChild(textarea);
  });

  it('should trigger search focus in textarea for / key', () => {
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    textarea.focus();

    renderHook(() =>
      useKeyboardShortcuts({
        onSearchFocus: mockOnSearchFocus,
      })
    );

    const event = new KeyboardEvent('keydown', { key: '/' });
    Object.defineProperty(event, 'target', {
      get: () => textarea,
      configurable: true,
    });
    window.dispatchEvent(event);

    expect(mockOnSearchFocus).toHaveBeenCalledTimes(1);

    document.body.removeChild(textarea);
  });
});

