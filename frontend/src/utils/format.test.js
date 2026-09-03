import { formatPrice, formatNumber, formatDate, formatDateRange, formatRelativeDate, initials, capitalize } from './format';

describe('formatPrice', () => {
  it('formats a price in USD', () => {
    expect(formatPrice(2500)).toBe('$2,500');
  });

  it('handles null/undefined/empty as "Price on request"', () => {
    expect(formatPrice(null)).toBe('Price on request');
    expect(formatPrice(undefined)).toBe('Price on request');
    expect(formatPrice('')).toBe('Price on request');
  });

  it('respects a custom currency', () => {
    expect(formatPrice(50000, 'INR')).toBe('₹50,000');
  });
});

describe('formatNumber', () => {
  it('adds thousands separators', () => {
    expect(formatNumber(1250000)).toBe('1,250,000');
  });

  it('returns a dash for missing values', () => {
    expect(formatNumber(undefined)).toBe('—');
    expect(formatNumber('')).toBe('—');
  });
});

describe('formatDate / formatDateRange', () => {
  it('formats a date', () => {
    expect(formatDate('2026-09-03T10:00:00.000Z')).toBe('Sep 3, 2026');
  });

  it('handles invalid input', () => {
    expect(formatDate('')).toBe('—');
    expect(formatDate('not-a-date')).toBe('—');
  });

  it('formats a range', () => {
    expect(formatDateRange('2026-09-03T10:00:00.000Z', '2026-10-03T10:00:00.000Z')).toBe('Sep 3, 2026 – Oct 3, 2026');
  });
});

describe('formatRelativeDate', () => {
  it('returns Today for recent dates', () => {
    expect(formatRelativeDate(new Date().toISOString())).toBe('Today');
  });

  it('returns Yesterday for one day ago', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeDate(yesterday)).toBe('Yesterday');
  });

  it('returns day counts for recent history', () => {
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeDate(fiveDaysAgo)).toBe('5 days ago');
  });
});

describe('initials', () => {
  it('builds initials from first and last name', () => {
    expect(initials('Hariraj', 'K')).toBe('HK');
  });

  it('handles missing names', () => {
    expect(initials('', '')).toBe('?');
    expect(initials('Hariraj', '')).toBe('H');
  });
});

describe('capitalize', () => {
  it('capitalizes the first letter', () => {
    expect(capitalize('pending')).toBe('Pending');
  });

  it('handles empty input', () => {
    expect(capitalize('')).toBe('');
    expect(capitalize(null)).toBe('');
  });
});