import { QUERY_KEYS } from '@epde/shared';
import { useQuery } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react-native';

import {
  useClientAnalytics,
  useClientDashboardStats,
  useClientUpcomingTasks,
} from '../use-dashboard';

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}));

jest.mock('@/lib/api/dashboard', () => ({
  getClientDashboardStats: jest.fn(),
  getClientUpcomingTasks: jest.fn(),
  getClientAnalytics: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  (useQuery as jest.Mock).mockReturnValue({ data: undefined, isLoading: true });
});

describe('useClientDashboardStats', () => {
  it('calls useQuery with correct queryKey', () => {
    renderHook(() => useClientDashboardStats());

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardClientStats],
      }),
    );
  });

  it('passes signal to queryFn', () => {
    renderHook(() => useClientDashboardStats());

    const config = (useQuery as jest.Mock).mock.calls[0][0];
    expect(config.queryFn).toBeDefined();
  });
});

describe('useClientUpcomingTasks', () => {
  it('calls useQuery with correct queryKey', () => {
    renderHook(() => useClientUpcomingTasks());

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardClientUpcoming],
      }),
    );
  });
});

describe('useClientAnalytics', () => {
  it('calls useQuery with correct queryKey', () => {
    renderHook(() => useClientAnalytics());

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardClientAnalytics],
      }),
    );
  });

  it('uses extended staleTime of 5 minutes', () => {
    renderHook(() => useClientAnalytics());

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        staleTime: 5 * 60_000,
      }),
    );
  });
});
