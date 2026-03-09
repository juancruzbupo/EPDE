import { QUERY_KEYS } from '@epde/shared';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react-native';

import { useProperties, useProperty } from '../use-properties';

jest.mock('@tanstack/react-query', () => ({
  useInfiniteQuery: jest.fn(),
  useQuery: jest.fn(),
}));

jest.mock('@/lib/api/properties', () => ({
  getProperties: jest.fn(),
  getProperty: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  (useInfiniteQuery as jest.Mock).mockReturnValue({ data: undefined, isLoading: true });
  (useQuery as jest.Mock).mockReturnValue({ data: undefined, isLoading: true });
});

describe('useProperties', () => {
  it('calls useInfiniteQuery with correct queryKey and maxPages', () => {
    const filters = { search: 'casa' };
    renderHook(() => useProperties(filters));

    expect(useInfiniteQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [QUERY_KEYS.properties, filters],
        maxPages: 10,
      }),
    );
  });
});

describe('useProperty', () => {
  it('calls useQuery with correct queryKey and enabled', () => {
    renderHook(() => useProperty('prop-1'));

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [QUERY_KEYS.properties, 'prop-1'],
        enabled: true,
      }),
    );
  });

  it('disables query when id is empty', () => {
    renderHook(() => useProperty(''));

    expect(useQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
  });
});
