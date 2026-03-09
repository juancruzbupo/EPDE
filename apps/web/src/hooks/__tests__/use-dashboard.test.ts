import { QUERY_KEYS } from '@epde/shared';
import { useQuery } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';

import {
  useClientDashboardStats,
  useClientUpcomingTasks,
  useDashboardActivity,
  useDashboardStats,
} from '../use-dashboard';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));

vi.mock('@/lib/api/dashboard', () => ({
  getDashboardStats: vi.fn(),
  getDashboardActivity: vi.fn(),
  getClientDashboardStats: vi.fn(),
  getClientUpcomingTasks: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(useQuery).mockReturnValue({ data: undefined, isLoading: true } as ReturnType<
    typeof useQuery
  >);
});

describe('useDashboardStats', () => {
  it('should use correct queryKey', () => {
    renderHook(() => useDashboardStats());

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardStats],
      }),
    );
  });
});

describe('useDashboardActivity', () => {
  it('should use correct queryKey', () => {
    renderHook(() => useDashboardActivity());

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardActivity],
      }),
    );
  });
});

describe('useClientDashboardStats', () => {
  it('should use correct queryKey', () => {
    renderHook(() => useClientDashboardStats());

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardClientStats],
      }),
    );
  });
});

describe('useClientUpcomingTasks', () => {
  it('should use correct queryKey', () => {
    renderHook(() => useClientUpcomingTasks());

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardClientUpcoming],
      }),
    );
  });
});
