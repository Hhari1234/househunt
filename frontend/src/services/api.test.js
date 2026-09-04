import { getApiBaseUrlForHost } from './api';

describe('getApiBaseUrlForHost', () => {
  it('uses the deployed Render backend when the frontend is on Render and no env var is set', () => {
    expect(getApiBaseUrlForHost('househunt-igh9.onrender.com')).toBe(
      'https://househunt-api-9zaf.onrender.com/api/v1'
    );
  });

  it('keeps the local backend for local development', () => {
    expect(getApiBaseUrlForHost('localhost')).toBe('http://localhost:3001/api/v1');
  });
});
