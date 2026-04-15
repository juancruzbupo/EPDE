import { describe, expect, it } from 'vitest';

import { getErrorMessage } from '../utils/errors';

describe('getErrorMessage', () => {
  it('returns the server-supplied message from an Axios-shaped error', () => {
    const axiosErr = {
      response: { data: { message: 'Presupuesto no encontrado' } },
    };
    expect(getErrorMessage(axiosErr, 'fallback')).toBe('Presupuesto no encontrado');
  });

  it('prefers `response.data.message` over the top-level `message`', () => {
    const axiosErr = {
      message: 'Request failed with status code 404',
      response: { data: { message: 'Recomendación no encontrada' } },
    };
    expect(getErrorMessage(axiosErr, 'fallback')).toBe('Recomendación no encontrada');
  });

  it('falls back to the top-level `message` when response is absent', () => {
    const nativeErr = new Error('Network error');
    expect(getErrorMessage(nativeErr, 'fallback')).toBe('Network error');
  });

  it('returns the fallback when the error is a primitive (string / number / null)', () => {
    expect(getErrorMessage('bare string', 'fallback')).toBe('fallback');
    expect(getErrorMessage(42, 'fallback')).toBe('fallback');
    expect(getErrorMessage(null, 'fallback')).toBe('fallback');
    expect(getErrorMessage(undefined, 'fallback')).toBe('fallback');
  });

  it('returns the fallback when the error is an object without a usable message', () => {
    expect(getErrorMessage({}, 'fallback')).toBe('fallback');
    expect(getErrorMessage({ something: 'else' }, 'fallback')).toBe('fallback');
  });

  it('ignores non-string `message` fields (guards against typos)', () => {
    expect(getErrorMessage({ message: 42 }, 'fallback')).toBe('fallback');
    expect(getErrorMessage({ message: null }, 'fallback')).toBe('fallback');
  });

  it('handles a response with empty data gracefully', () => {
    expect(getErrorMessage({ response: { data: {} } }, 'fallback')).toBe('fallback');
    expect(getErrorMessage({ response: {} }, 'fallback')).toBe('fallback');
  });
});
