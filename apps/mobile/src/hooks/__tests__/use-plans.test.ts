import { QUERY_KEYS } from '@epde/shared';
import { useQuery } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react-native';

import { useAllTasks, usePlan, usePlans } from '../use-plans';

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}));

jest.mock('@/lib/api/maintenance-plans', () => ({
  getPlans: jest.fn(),
  getAllTasks: jest.fn(),
  getPlan: jest.fn(),
}));

const mockQueryReturn = { data: undefined, isLoading: true };

beforeEach(() => {
  jest.clearAllMocks();
  (useQuery as jest.Mock).mockReturnValue(mockQueryReturn);
});

describe('usePlans', () => {
  it('calls useQuery with correct queryKey', () => {
    renderHook(() => usePlans());

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [QUERY_KEYS.plans, QUERY_KEYS.plansList],
      }),
    );
  });
});

describe('useAllTasks', () => {
  it('uses "all" in queryKey when no params provided', () => {
    renderHook(() => useAllTasks());

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [QUERY_KEYS.plans, QUERY_KEYS.plansTasks, 'all', 'all'],
      }),
    );
  });

  it('includes status in queryKey when provided', () => {
    renderHook(() => useAllTasks({ status: 'PENDING' }));

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [QUERY_KEYS.plans, QUERY_KEYS.plansTasks, 'PENDING', 'all'],
      }),
    );
  });
});

describe('usePlan', () => {
  it('calls useQuery with planId in queryKey and enabled=true', () => {
    renderHook(() => usePlan('plan-1'));

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [QUERY_KEYS.plans, 'plan-1'],
        enabled: true,
      }),
    );
  });

  it('disables query when id is empty string', () => {
    renderHook(() => usePlan(''));

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      }),
    );
  });
});
