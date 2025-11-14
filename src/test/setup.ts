import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

configure({
  asyncUtilTimeout: 150,
  defaultHidden: true,
  testIdAttribute: 'data-testid',
});

if (typeof global.queueMicrotask === 'undefined') {
  global.queueMicrotask = (callback: () => void) => {
    Promise.resolve().then(callback);
  };
}

const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const message = typeof args[0] === 'string' ? args[0] : '';
    const allArgs = args.join(' ');
    
    if (
      message.includes('Failed to load') ||
      message.includes('Failed to approve') ||
      message.includes('Failed to reject') ||
      message.includes('Failed to request changes') ||
      message.includes('Failed to load stats') ||
      message.includes('Failed to load ads') ||
      message.includes('Warning: An update to') ||
      message.includes('was not wrapped in act(...)') ||
      allArgs.includes('Warning: An update to') ||
      allArgs.includes('was not wrapped in act(...)')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('React Router Future Flag Warning') ||
        args[0].includes('v7_startTransition') ||
        args[0].includes('v7_relativeSplatPath'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

Storage.prototype.setItem = jest.fn();
Storage.prototype.getItem = jest.fn();
Storage.prototype.removeItem = jest.fn();
Storage.prototype.clear = jest.fn();

global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

