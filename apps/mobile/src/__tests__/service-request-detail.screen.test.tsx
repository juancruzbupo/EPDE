import { render } from '@testing-library/react-native';
import React from 'react';

// ---------------------------------------------------------------------------
// Mocks — declared before import of the component under test
// ---------------------------------------------------------------------------

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'sr-1' }),
  Stack: { Screen: () => null },
}));

jest.mock('date-fns', () => ({
  format: () => '10 mar 2025',
}));

jest.mock('date-fns/locale', () => ({
  es: {},
}));

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock('@epde/shared', () => ({
  ServiceStatus: {
    OPEN: 'OPEN',
    IN_REVIEW: 'IN_REVIEW',
    IN_PROGRESS: 'IN_PROGRESS',
    RESOLVED: 'RESOLVED',
    CLOSED: 'CLOSED',
  },
  ServiceUrgency: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    URGENT: 'URGENT',
  },
  SERVICE_URGENCY_LABELS: {
    URGENT: 'Urgente',
    HIGH: 'Alta',
    MEDIUM: 'Media',
    LOW: 'Baja',
  },
  formatRelativeDate: () => 'hace 2 días',
  isServiceRequestTerminal: (status: string) => status === 'RESOLVED' || status === 'CLOSED',
}));

jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { ScrollView: 'ScrollView', View: 'View' },
}));

const mockUseServiceRequest = jest.fn();
const mockUseEditServiceRequest = jest.fn();
const mockUseServiceRequestAuditLog = jest.fn();
const mockUseServiceRequestComments = jest.fn();
const mockUseAddServiceRequestComment = jest.fn();
const mockUseAddServiceRequestAttachments = jest.fn();

jest.mock('@/hooks/use-service-requests', () => ({
  useServiceRequest: () => mockUseServiceRequest(),
  useEditServiceRequest: () => mockUseEditServiceRequest(),
  useServiceRequestAuditLog: () => mockUseServiceRequestAuditLog(),
  useServiceRequestComments: () => mockUseServiceRequestComments(),
  useAddServiceRequestComment: () => mockUseAddServiceRequestComment(),
  useAddServiceRequestAttachments: () => mockUseAddServiceRequestAttachments(),
}));

jest.mock('@/hooks/use-upload', () => ({
  useUploadFile: () => ({ mutateAsync: jest.fn() }),
}));

jest.mock('@/lib/animations', () => ({
  useSlideIn: () => ({}),
}));

jest.mock('@/lib/haptics', () => ({
  haptics: { selection: jest.fn(), light: jest.fn(), success: jest.fn() },
}));

jest.mock('@/lib/screen-options', () => ({
  defaultScreenOptions: {},
}));

jest.mock('@/lib/colors', () => ({
  COLORS: {
    background: '#fff',
    foreground: '#000',
    primary: '#0066ff',
    primaryForeground: '#fff',
    mutedForeground: '#999',
    border: '#ddd',
    success: '#22c55e',
    warning: '#f59e0b',
    caution: '#f97316',
    destructive: '#ef4444',
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

jest.mock('@/components/collapsible-section', () => ({
  CollapsibleSection: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@/components/status-badge', () => ({
  ServiceStatusBadge: () => null,
  UrgencyBadge: () => null,
}));

jest.mock('@/components/empty-state', () => ({
  EmptyState: ({ title, message }: { title: string; message: string }) => (
    <>
      {title}
      {message}
    </>
  ),
}));

jest.mock('@/components/error-state', () => ({
  ErrorState: ({ onRetry }: { onRetry?: () => void }) => (
    <button onClick={onRetry}>Reintentar</button>
  ),
}));

// ---------------------------------------------------------------------------
// Import the component under test *after* mocks are set up
// ---------------------------------------------------------------------------

import ServiceRequestDetailScreen from '@/app/service-requests/[id]';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockServiceRequest = {
  id: 'sr-1',
  title: 'Humedad en pared norte',
  description: 'Se detectó humedad en la pared norte del living.',
  status: 'OPEN',
  urgency: 'HIGH',
  createdAt: '2025-03-10T10:00:00Z',
  photos: [],
  attachments: [],
  property: {
    id: 'prop-1',
    address: 'Av. Libertador 1234',
    city: 'Buenos Aires',
  },
  task: null,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function queryResult<T>(
  data: T | undefined,
  overrides?: Partial<{ isLoading: boolean; error: Error | null }>,
) {
  return {
    data,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
    ...overrides,
  };
}

function setupDefaultMocks() {
  mockUseServiceRequest.mockReturnValue(queryResult(mockServiceRequest));
  mockUseEditServiceRequest.mockReturnValue({ mutate: jest.fn(), isPending: false });
  mockUseServiceRequestAuditLog.mockReturnValue(queryResult([]));
  mockUseServiceRequestComments.mockReturnValue(queryResult([]));
  mockUseAddServiceRequestComment.mockReturnValue({ mutate: jest.fn(), isPending: false });
  mockUseAddServiceRequestAttachments.mockReturnValue({ mutateAsync: jest.fn() });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ServiceRequestDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders request title and details when data is available', () => {
    setupDefaultMocks();

    const { getByText } = render(<ServiceRequestDetailScreen />);

    expect(getByText('Humedad en pared norte')).toBeTruthy();
    expect(getByText('Se detectó humedad en la pared norte del living.')).toBeTruthy();
    expect(getByText('Av. Libertador 1234')).toBeTruthy();
    expect(getByText('Propiedad')).toBeTruthy();
  });

  it('shows loading indicator when request is loading', () => {
    mockUseServiceRequest.mockReturnValue(queryResult(undefined, { isLoading: true }));
    mockUseEditServiceRequest.mockReturnValue({ mutate: jest.fn(), isPending: false });
    mockUseServiceRequestAuditLog.mockReturnValue(queryResult(undefined));
    mockUseServiceRequestComments.mockReturnValue(queryResult(undefined));
    mockUseAddServiceRequestComment.mockReturnValue({ mutate: jest.fn(), isPending: false });
    mockUseAddServiceRequestAttachments.mockReturnValue({ mutateAsync: jest.fn() });

    const { queryByText } = render(<ServiceRequestDetailScreen />);

    // Should not show request content
    expect(queryByText('Humedad en pared norte')).toBeNull();
  });

  it('shows error state when fetch fails', () => {
    mockUseServiceRequest.mockReturnValue(
      queryResult(undefined, { error: new Error('Network error') }),
    );
    mockUseEditServiceRequest.mockReturnValue({ mutate: jest.fn(), isPending: false });
    mockUseServiceRequestAuditLog.mockReturnValue(queryResult(undefined));
    mockUseServiceRequestComments.mockReturnValue(queryResult(undefined));
    mockUseAddServiceRequestComment.mockReturnValue({ mutate: jest.fn(), isPending: false });
    mockUseAddServiceRequestAttachments.mockReturnValue({ mutateAsync: jest.fn() });

    const { getByText } = render(<ServiceRequestDetailScreen />);

    expect(getByText('Reintentar')).toBeTruthy();
  });

  it('shows edit button for OPEN status requests', () => {
    setupDefaultMocks();

    const { getByText } = render(<ServiceRequestDetailScreen />);

    expect(getByText('Editar')).toBeTruthy();
  });

  it('hides edit button for resolved requests', () => {
    mockUseServiceRequest.mockReturnValue(
      queryResult({ ...mockServiceRequest, status: 'RESOLVED' }),
    );
    mockUseEditServiceRequest.mockReturnValue({ mutate: jest.fn(), isPending: false });
    mockUseServiceRequestAuditLog.mockReturnValue(queryResult([]));
    mockUseServiceRequestComments.mockReturnValue(queryResult([]));
    mockUseAddServiceRequestComment.mockReturnValue({ mutate: jest.fn(), isPending: false });
    mockUseAddServiceRequestAttachments.mockReturnValue({ mutateAsync: jest.fn() });

    const { queryByText } = render(<ServiceRequestDetailScreen />);

    expect(queryByText('Editar')).toBeNull();
  });
});
