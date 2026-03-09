import { QUERY_KEYS } from '@epde/shared';
import { useQuery } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react-native';

import { useClientDashboardStats, useClientUpcomingTasks } from '../use-dashboard';

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}));

jest.mock('@/lib/api/dashboard', () => ({
  getClientDashboardStats: jest.fn(),
  getClientUpcomingTasks: jest.fn(),
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
