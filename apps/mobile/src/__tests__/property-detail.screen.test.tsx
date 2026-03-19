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

jest.mock('@/hooks/use-properties', () => ({
  useProperty: (...args: unknown[]) => mockUseProperty(...args),
  usePropertyExpenses: (...args: unknown[]) => mockUsePropertyExpenses(...args),
  usePropertyPhotos: (...args: unknown[]) => mockUsePropertyPhotos(...args),
  usePropertyHealthIndex: (...args: unknown[]) => mockUsePropertyHealthIndex(...args),
  usePropertyHealthHistory: (...args: unknown[]) => mockUsePropertyHealthHistory(...args),
}));

const mockUsePlan = jest.fn();

jest.mock('@/hooks/use-plans', () => ({
  usePlan: (...args: unknown[]) => mockUsePlan(...args),
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

jest.mock('@/components/status-badge', () => ({
  PlanStatusBadge: ({ status }: { status: string }) => status,
  PriorityBadge: ({ priority }: { priority: string }) => priority,
  PropertyTypeBadge: ({ type }: { type: string }) => type,
  TaskStatusBadge: ({ status }: { status: string }) => status,
}));

// ---------------------------------------------------------------------------
// Import the component under test *after* mocks are set up
// ---------------------------------------------------------------------------

import PropertyDetailScreen from '@/app/property/[id]';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockProperty = {
  id: 'prop-1',
  address: 'Av. Corrientes 1234',
  city: 'CABA',
  type: 'HOUSE',
  yearBuilt: 1990,
  squareMeters: 120,
  maintenancePlan: { id: 'plan-1', name: 'Plan Anual', status: 'ACTIVE' },
};

const mockPlan = {
  id: 'plan-1',
  name: 'Plan Anual',
  status: 'ACTIVE',
  tasks: [
    {
      id: 'task-1',
      name: 'Revisar caldera',
      status: 'UPCOMING',
      priority: 'HIGH',
      nextDueDate: '2025-04-15',
      sector: null,
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

    const { getByText } = render(<PropertyDetailScreen />);

    expect(getByText('Reintentar')).toBeTruthy();
  });
});
