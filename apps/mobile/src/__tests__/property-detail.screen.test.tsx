import { makePlan, makeProperty, makeTask } from '@epde/shared/testing';
import { render } from '@testing-library/react-native';
import React from 'react';

// ---------------------------------------------------------------------------
// Mocks — declared before import of the component under test
// ---------------------------------------------------------------------------

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'prop-1' }),
  useRouter: () => ({ push: jest.fn() }),
  Stack: { Screen: () => null },
}));

const mockUseProperty = jest.fn();
const mockUsePropertyExpenses = jest.fn();
const mockUsePropertyPhotos = jest.fn();
const mockUsePropertyHealthIndex = jest.fn();
const mockUsePropertyHealthHistory = jest.fn();
const mockUsePropertyProblems = jest.fn();

jest.mock('@/hooks/use-properties', () => ({
  useProperty: (...args: unknown[]) => mockUseProperty(...args),
  usePropertyExpenses: (...args: unknown[]) => mockUsePropertyExpenses(...args),
  usePropertyPhotos: (...args: unknown[]) => mockUsePropertyPhotos(...args),
  usePropertyHealthIndex: (...args: unknown[]) => mockUsePropertyHealthIndex(...args),
  usePropertyHealthHistory: (...args: unknown[]) => mockUsePropertyHealthHistory(...args),
  usePropertyProblems: (...args: unknown[]) => mockUsePropertyProblems(...args),
}));

const mockUsePlan = jest.fn();

jest.mock('@/hooks/use-plans', () => ({
  usePlan: (...args: unknown[]) => mockUsePlan(...args),
  useUpdatePlan: () => ({ mutate: jest.fn(), isPending: false }),
}));

jest.mock('@/components/collapsible-section', () => ({
  CollapsibleSection: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@/components/animated-list-item', () => ({
  AnimatedListItem: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@/components/swipeable-row', () => ({
  SwipeableRow: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@/components/complete-task-modal', () => ({
  CompleteTaskModal: () => null,
}));

jest.mock('@/components/create-service-request-modal', () => ({
  CreateServiceRequestModal: () => null,
}));

jest.mock('@/components/property-task-card', () => ({
  PropertyTaskCard: () => null,
}));

jest.mock('@/components/status-badge', () => ({
  PlanStatusBadge: ({ status }: { status: string }) => status,
  PriorityBadge: ({ priority }: { priority: string }) => priority,
  PropertyTypeBadge: ({ type }: { type: string }) => type,
  TaskStatusBadge: ({ status }: { status: string }) => status,
}));

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

jest.mock('@/lib/animations', () => ({
  useAnimatedEntry: () => ({}),
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

jest.mock('@/lib/haptics', () => ({
  haptics: { selection: jest.fn(), light: jest.fn(), success: jest.fn() },
}));

jest.mock('@/lib/screen-options', () => ({
  defaultScreenOptions: {},
}));

jest.mock('@/lib/impact-message', () => ({
  getMobileImpactMessage: () => 'mock impact message',
}));

jest.mock('@/stores/auth-store', () => ({
  useAuthStore: () => ({ role: 'CLIENT' }),
}));

jest.mock('@epde/shared', () => ({
  PlanStatus: { ACTIVE: 'ACTIVE', DRAFT: 'DRAFT', ARCHIVED: 'ARCHIVED' },
  TaskStatus: {
    UPCOMING: 'UPCOMING',
    OVERDUE: 'OVERDUE',
    COMPLETED: 'COMPLETED',
    PENDING: 'PENDING',
  },
  UserRole: { ADMIN: 'ADMIN', CLIENT: 'CLIENT' },
  CONDITION_FOUND_LABELS: {},
  TASK_STATUS_LABELS: {
    UPCOMING: 'Próximas',
    OVERDUE: 'Vencidas',
    COMPLETED: 'Completadas',
    PENDING: 'Pendiente',
  },
  PROPERTY_SECTOR_LABELS: {},
  formatRelativeDate: () => 'hace 2 días',
}));

// ---------------------------------------------------------------------------
// Import the component under test *after* mocks are set up
// ---------------------------------------------------------------------------

import PropertyDetailScreen from '@/app/property/[id]';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockProperty = {
  ...makeProperty({ address: 'Av. Corrientes 1234', yearBuilt: 1990, squareMeters: 120 }),
  maintenancePlan: { id: 'plan-1', name: 'Plan Anual', status: 'ACTIVE' },
};

const mockPlan = {
  ...makePlan({ name: 'Plan Anual', status: 'ACTIVE' }),
  tasks: [
    {
      ...makeTask({
        name: 'Revisar caldera',
        status: 'UPCOMING',
        priority: 'HIGH',
        nextDueDate: '2025-04-15',
      }),
      category: { id: 'cat-1', name: 'Calefacción' },
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
    refetch: jest.Mock;
  }>,
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
  mockUseProperty.mockReturnValue(queryResult(mockProperty));
  mockUsePlan.mockReturnValue(queryResult(mockPlan));
  mockUsePropertyExpenses.mockReturnValue(queryResult(undefined));
  mockUsePropertyPhotos.mockReturnValue(queryResult(undefined));
  mockUsePropertyHealthIndex.mockReturnValue(queryResult(undefined));
  mockUsePropertyHealthHistory.mockReturnValue(queryResult(undefined));
  mockUsePropertyProblems.mockReturnValue(queryResult(undefined));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PropertyDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders property address and details when data is available', () => {
    setupDefaultMocks();

    const { getByText } = render(<PropertyDetailScreen />);

    expect(getByText('Av. Corrientes 1234')).toBeTruthy();
    expect(getByText(/CABA/)).toBeTruthy();
    expect(getByText('Plan Anual')).toBeTruthy();
  });

  it('shows loading indicator when property is loading', () => {
    mockUseProperty.mockReturnValue(queryResult(undefined, { isLoading: true }));
    mockUsePlan.mockReturnValue(queryResult(undefined));
    mockUsePropertyExpenses.mockReturnValue(queryResult(undefined));
    mockUsePropertyPhotos.mockReturnValue(queryResult(undefined));
    mockUsePropertyHealthIndex.mockReturnValue(queryResult(undefined));
    mockUsePropertyHealthHistory.mockReturnValue(queryResult(undefined));
    mockUsePropertyProblems.mockReturnValue(queryResult(undefined));

    const { queryByText } = render(<PropertyDetailScreen />);

    expect(queryByText('Av. Corrientes 1234')).toBeNull();
  });

  it('shows error state when property fetch fails', () => {
    mockUseProperty.mockReturnValue(queryResult(undefined, { error: new Error('Network error') }));
    mockUsePlan.mockReturnValue(queryResult(undefined));
    mockUsePropertyExpenses.mockReturnValue(queryResult(undefined));
    mockUsePropertyPhotos.mockReturnValue(queryResult(undefined));
    mockUsePropertyHealthIndex.mockReturnValue(queryResult(undefined));
    mockUsePropertyHealthHistory.mockReturnValue(queryResult(undefined));
    mockUsePropertyProblems.mockReturnValue(queryResult(undefined));

    const { getByText } = render(<PropertyDetailScreen />);

    expect(getByText('Reintentar')).toBeTruthy();
  });
});
