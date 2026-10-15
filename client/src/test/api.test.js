import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api } from '../services/api.js';

describe('API Client Service (api.js)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('checkShieldMessage sends POST to /shield/check-message with { message } payload', async () => {
    const mockResponse = {
      riskLevel: 'Needs Verification',
      warningSigns: [],
      explanation: 'Analysis completed successfully.',
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      headers: {
        get: (h) => (h.toLowerCase() === 'content-type' ? 'application/json' : null),
      },
      json: async () => mockResponse,
    });

    const result = await api.checkShieldMessage('Electricity bill due for payment');

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, config] = fetchSpy.mock.calls[0];

    expect(url).toContain('/api/shield/check-message');
    expect(config.method).toBe('POST');
    expect(config.credentials).toBe('include');
    expect(JSON.parse(config.body)).toEqual({
      message: 'Electricity bill due for payment',
    });
    expect(result).toEqual(mockResponse);
  });

  it('checkShieldUrl sends POST to /shield/check-url with { url } payload', async () => {
    const mockResponse = {
      url: 'https://karnataka.gov.in',
      valid: true,
      riskLevel: 'No Obvious Warning Signs',
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      headers: {
        get: (h) => (h.toLowerCase() === 'content-type' ? 'application/json' : null),
      },
      json: async () => mockResponse,
    });

    const result = await api.checkShieldUrl('https://karnataka.gov.in');

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, config] = fetchSpy.mock.calls[0];

    expect(url).toContain('/api/shield/check-url');
    expect(config.method).toBe('POST');
    expect(JSON.parse(config.body)).toEqual({
      url: 'https://karnataka.gov.in',
    });
    expect(result).toEqual(mockResponse);
  });

  it('formats network failure into informative ApiError with connection detail', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(api.checkShieldMessage('test')).rejects.toThrow(
      'Network error: Unable to connect to AccessGuard API server (Failed to fetch)'
    );
  });

  it('formats HTTP non-200 responses with backend error message', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 400,
      headers: {
        get: (h) => (h.toLowerCase() === 'content-type' ? 'application/json' : null),
      },
      json: async () => ({ error: 'A valid "message" string is required.' }),
    });

    await expect(api.checkShieldMessage('')).rejects.toThrow(
      'A valid "message" string is required.'
    );
  });
});
