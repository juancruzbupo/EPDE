import { render } from '@testing-library/react-native';
import React from 'react';

// ---------------------------------------------------------------------------
// Mocks — declared before import of the component under test
// ---------------------------------------------------------------------------

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
  Stack: { Screen: () => null },
}));

const mockUseServiceRequests = jest.fn();

jest.mock('@/hooks/use-service-requests', () => ({
  useServiceRequests: (...args: unknown[]) => mockUseServiceRequests(...args),
}));

jest.mock('@/hooks/use-debounce', () => ({
  useDebounce: (value: string) => value,
}));

jest.mock('@/components/create-service-request-modal', () => ({
  CreateServiceRequestModal: () => null,
}));

jest.mock('@/components/animated-list-item', () => ({
  AnimatedListItem: ({ children }: { children: React.ReactNode }) => children,
}));

// ---------------------------------------------------------------------------
// Import the component under test *after* mocks are set up
// ---------------------------------------------------------------------------

import ServiceRequestsScreen from '@/app/service-requests/index';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockServiceRequests = {
  pages: [
    {
      data: [
        {
          id: 'sr-1',
          title: 'Humedad en pared',
          status: 'OPEN',
          urgency: 'HIGH',
          createdAt: '2025-03-01T00:00:00.000Z',
          property: { id: 'prop-1', address: 'Av. Corrientes 1234', city: 'CABA' },
        },
        {
          id: 'sr-2',
          title: 'Filtración en techo',
          status: 'IN_PROGRESS',
          urgency: 'URGENT',
          createdAt: '2025-03-05T00:00:00.000Z',
          property: { id: 'prop-2', address: 'Av. Santa Fe 5678', city: 'CABA' },
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function queryResult<T>(
  data: T | undefined,
  overrides?: Partial<{
    isLoading: boolean;
    error: Error | null;
    fetchNextPage: jest.Mock;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
  }>,
) {
  return {
    data,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
    fetchNextPage: jest.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ServiceRequestsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders service request list when data is available', () => {
    mockUseServiceRequests.mockReturnValue(queryResult(mockServiceRequests));

    const { getByText } = render(<ServiceRequestsScreen />);

    expect(getByText('Nueva Solicitud')).toBeTruthy();
    expect(getByText('Humedad en pared')).toBeTruthy();
    expect(getByText('Filtración en techo')).toBeTruthy();
  });

  it('shows loading state', () => {
    mockUseServiceRequests.mockReturnValue(queryResult(undefined, { isLoading: true }));

    const { queryByText } = render(<ServiceRequestsScreen />);

    expect(queryByText('Humedad en pared')).toBeNull();
  });

  it('shows error state when query fails', () => {
    mockUseServiceRequests.mockReturnValue(
      queryResult(undefined, { error: new Error('Network error') }),
    );

    const { getByText } = render(<ServiceRequestsScreen />);

    expect(getByText('Reintentar')).toBeTruthy();
  });
});
