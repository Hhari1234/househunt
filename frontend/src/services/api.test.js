import { getApiBaseUrlForHost } from './api';

describe('getApiBaseUrlForHost', () => {
  it('keeps the local backend for local development', () => {
    expect(getApiBaseUrlForHost('localhost')).toBe('http://localhost:3001/api/v1');
  });

  it('returns a safe default for non-localhost hosts without env var', () => {
    expect(getApiBaseUrlForHost('househunt-jqh9.onrender.com')).toBe('/api/v1');
  });
});
