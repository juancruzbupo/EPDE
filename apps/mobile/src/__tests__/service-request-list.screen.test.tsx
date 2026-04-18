import { render } from '@testing-library/react-native';
import React from 'react';

// ---------------------------------------------------------------------------
// Mocks — declared before import of the component under test
// ---------------------------------------------------------------------------

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
  Stack: { Screen: () => null },
}));

jest.mock('@epde/shared', () => ({
  ServiceStatus: {
    OPEN: 'OPEN',
    IN_REVIEW: 'IN_REVIEW',
    IN_PROGRESS: 'IN_PROGRESS',
    RESOLVED: 'RESOLVED',
    CLOSED: 'CLOSED',
  },
  SERVICE_STATUS_PLURAL_LABELS: {
    OPEN: 'Abiertos',
    IN_REVIEW: 'En Revisión',
    IN_PROGRESS: 'En Progreso',
    RESOLVED: 'Resueltos',
    CLOSED: 'Cerrados',
  },
  SERVICE_URGENCY_LABELS: {
    URGENT: 'Urgente',
    HIGH: 'Alta',
    MEDIUM: 'Media',
    LOW: 'Baja',
  },
  formatRelativeDate: () => 'hace 2 días',
}));

const mockUseServiceRequests = jest.fn();

jest.mock('@/hooks/use-service-requests', () => ({
  useServiceRequests: () => mockUseServiceRequests(),
}));

jest.mock('@/hooks/use-debounce', () => ({
  useDebounce: (v: string) => v,
}));

jest.mock('@/lib/screen-options', () => ({
  defaultScreenOptions: {},
}));

jest.mock('@/lib/colors', () => ({
  COLORS: {
    background: '#fff',
    foreground: '#000',
    primary: '#0066ff',
    mutedForeground: '#999',
    border: '#ddd',
  },
}));

jest.mock('@/lib/fonts', () => ({
  TYPE: {
    titleSm: {},
    titleMd: {},
    titleLg: {},
    bodyMd: {},
    bodySm: {},
    labelMd: {},
    labelLg: {},
    labelSm: {},
  },
}));

jest.mock('@/components/animated-list-item', () => ({
  AnimatedListItem: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@/components/create-service-request-modal', () => ({
  CreateServiceRequestModal: () => null,
}));

jest.mock('@/components/status-badge', () => ({
  ServiceStatusBadge: () => null,
  UrgencyBadge: () => null,
}));

jest.mock('@/components/empty-state', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    EmptyState: ({ title, message }: { title: string; message: string }) => (
      <>
        <Text>{title}</Text>
        <Text>{message}</Text>
      </>
    ),
  };
});

jest.mock('@/components/error-state', () => {
  const { Text, Pressable } = jest.requireActual('react-native');
  return {
    ErrorState: ({ onRetry }: { onRetry?: () => void }) => (
      <Pressable onPress={onRetry}>
        <Text>Reintentar</Text>
      </Pressable>
    ),
  };
});

jest.mock('@/lib/haptics', () => ({
  haptics: { selection: jest.fn(), light: jest.fn(), success: jest.fn() },
}));

// ---------------------------------------------------------------------------
// Import the component under test *after* mocks are set up
// ---------------------------------------------------------------------------

import ServiceRequestsScreen from '@/app/service-requests/index';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockRequest = {
  id: 'sr-1',
  title: 'Humedad en pared norte',
  description: 'Se detectó humedad en la pared norte del living.',
  status: 'OPEN',
  urgency: 'HIGH',
  createdAt: '2025-03-10T10:00:00Z',
  property: {
    id: 'prop-1',
    address: 'Av. Libertador 1234',
    city: 'Buenos Aires',
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function queryResult<T>(
  data: T | undefined,
  overrides?: Partial<{
    isLoading: boolean;
    error: Error | null;
    refetch: jest.Mock;
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

function setupDefaultMocks() {
  mockUseServiceRequests.mockReturnValue(queryResult({ pages: [{ data: [mockRequest] }] }));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ServiceRequestsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders service request title and property when data is available', () => {
    setupDefaultMocks();

    const { getByText } = render(<ServiceRequestsScreen />);

    expect(getByText('Humedad en pared norte')).toBeTruthy();
    expect(getByText('Av. Libertador 1234, Buenos Aires')).toBeTruthy();
  });

  it('shows loading indicator when requests are loading', () => {
    mockUseServiceRequests.mockReturnValue(queryResult(undefined, { isLoading: true }));

    const { queryByText } = render(<ServiceRequestsScreen />);

    // Should not show request content
    expect(queryByText('Humedad en pared norte')).toBeNull();
  });

  it('shows error state when fetch fails', () => {
    mockUseServiceRequests.mockReturnValue(
      queryResult(undefined, { error: new Error('Network error') }),
    );

    const { getByText } = render(<ServiceRequestsScreen />);

    expect(getByText('Reintentar')).toBeTruthy();
  });

  it('shows empty state when no requests match filters', () => {
    mockUseServiceRequests.mockReturnValue(queryResult({ pages: [{ data: [] }] }));

    const { getByText } = render(<ServiceRequestsScreen />);

    expect(getByText('Sin solicitudes todavía')).toBeTruthy();
  });

  it('renders status filter chips', () => {
    setupDefaultMocks();

    const { getByText } = render(<ServiceRequestsScreen />);

    expect(getByText('Todos')).toBeTruthy();
    expect(getByText('Abiertos')).toBeTruthy();
    expect(getByText('En Revisión')).toBeTruthy();
  });
});
