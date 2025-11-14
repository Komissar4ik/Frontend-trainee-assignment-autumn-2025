import { formatPrice, formatDateString, formatDateOnly, formatPercentage, formatTime } from '@/utils/format';

describe('formatPrice', () => {
  it('should format price correctly', () => {
    expect(formatPrice(1000)).toBe('1\u00A0000\u00A0₽');
    expect(formatPrice(123456)).toBe('123\u00A0456\u00A0₽');
    expect(formatPrice(0)).toBe('0\u00A0₽');
  });

  it('should handle large numbers', () => {
    expect(formatPrice(1000000)).toBe('1\u00A0000\u00A0000\u00A0₽');
  });
});

describe('formatDateString', () => {
  it('should format date string correctly', () => {
    const date = '2024-01-15T10:30:00Z';
    const formatted = formatDateString(date);
    expect(formatted).toMatch(/\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}/);
  });

  it('should handle invalid date string', () => {
    const invalidDate = 'invalid-date';
    expect(formatDateString(invalidDate)).toBe(invalidDate);
  });
});

describe('formatDateOnly', () => {
  it('should format date only without time', () => {
    const date = '2024-01-15T10:30:00Z';
    const formatted = formatDateOnly(date);
    expect(formatted).toMatch(/\d{2}\.\d{2}\.\d{4}/);
    expect(formatted).not.toMatch(/\d{2}:\d{2}/);
  });

  it('should handle invalid date string', () => {
    const invalidDate = 'invalid-date';
    expect(formatDateOnly(invalidDate)).toBe(invalidDate);
  });
});

describe('formatPercentage', () => {
  it('should format percentage correctly', () => {
    expect(formatPercentage(50)).toBe('50.0%');
    expect(formatPercentage(75.5)).toBe('75.5%');
    expect(formatPercentage(0)).toBe('0.0%');
  });
});

describe('formatTime', () => {
  it('should format time in seconds correctly', () => {
    expect(formatTime(60)).toBe('1м 0с');
    expect(formatTime(125)).toBe('2м 5с');
    expect(formatTime(30)).toBe('0м 30с');
  });
});

