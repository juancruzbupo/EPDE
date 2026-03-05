import { renderHook } from '@testing-library/react-native';
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { QUERY_KEYS } from '@epde/shared';
import {
  useServiceRequests,
  useServiceRequest,
  useCreateServiceRequest,
} from '../use-service-requests';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@tanstack/react-query', () => ({
  useInfiniteQuery: jest.fn(),
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}));

jest.mock('react-native', () => ({
  Alert: { alert: jest.fn() },
}));

jest.mock('@/lib/api/service-requests', () => ({
  getServiceRequests: jest.fn(),
  getServiceRequest: jest.fn(),
  createServiceRequest: jest.fn(),
}));

const mockMutationReturn = { mutate: jest.fn(), mutateAsync: jest.fn() };
const mockInvalidateQueries = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useInfiniteQuery as jest.Mock).mockReturnValue({ data: undefined, isLoading: true });
  (useQuery as jest.Mock).mockReturnValue({ data: undefined, isLoading: true });
  (useMutation as jest.Mock).mockReturnValue(mockMutationReturn);
  (useQueryClient as jest.Mock).mockReturnValue({
    invalidateQueries: mockInvalidateQueries,
  });
});

// ---------------------------------------------------------------------------
// useServiceRequests
// ---------------------------------------------------------------------------

describe('useServiceRequests', () => {
  it('calls useInfiniteQuery with correct queryKey and maxPages', () => {
    const filters = { status: 'OPEN' };
    renderHook(() => useServiceRequests(filters));

    expect(useInfiniteQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [QUERY_KEYS.serviceRequests, filters],
        maxPages: 10,
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// useServiceRequest
// ---------------------------------------------------------------------------

describe('useServiceRequest', () => {
  it('calls useQuery with correct queryKey and enabled', () => {
    renderHook(() => useServiceRequest('sr-1'));

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [QUERY_KEYS.serviceRequests, 'sr-1'],
        enabled: true,
      }),
    );
  });

  it('disables query when id is empty', () => {
    renderHook(() => useServiceRequest(''));

    expect(useQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
  });
});

// ---------------------------------------------------------------------------
// useCreateServiceRequest
// ---------------------------------------------------------------------------

describe('useCreateServiceRequest', () => {
  it('invalidates service-requests and dashboard on success', () => {
    renderHook(() => useCreateServiceRequest());

    const config = (useMutation as jest.Mock).mock.calls[0][0];
    config.onSuccess();

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.serviceRequests],
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardClientStats],
    });
  });

  it('shows Alert on error', () => {
    renderHook(() => useCreateServiceRequest());

    const config = (useMutation as jest.Mock).mock.calls[0][0];
    config.onError(new Error('fail'));

    expect(Alert.alert).toHaveBeenCalled();
  });
});
