import { render, screen } from '@testing-library/react-native';
import React from 'react';

// ---------------------------------------------------------------------------
// Mocks — declared before import of the component under test
// ---------------------------------------------------------------------------

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
  Link: 'Link',
}));

const mockUsePlans = jest.fn();

jest.mock('@/hooks/use-plans', () => ({
  usePlans: () => mockUsePlans(),
}));

jest.mock('@/components/animated-list-item', () => ({
  AnimatedListItem: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@/components/status-badge', () => ({
  PlanStatusBadge: ({ status }: { status: string }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Text } = require('react-native');
    return <Text>{status}</Text>;
  },
}));

// ---------------------------------------------------------------------------
// Import the component under test *after* mocks are set up
// ---------------------------------------------------------------------------

import MaintenancePlansScreen from '@/app/(tabs)/maintenance-plans';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockPlan = {
  id: 'plan-1',
  name: 'Plan Casa Centro',
  status: 'ACTIVE',
  property: { id: 'prop-1', address: 'Av. Colón 500', city: 'Córdoba' },
  _count: { tasks: 3 },
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MaintenancePlansScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading indicator when loading with no data', () => {
    mockUsePlans.mockReturnValue(queryResult(undefined, { isLoading: true }));

    const { UNSAFE_queryAllByType } = render(<MaintenancePlansScreen />);
    // ActivityIndicator is rendered during loading
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { ActivityIndicator } = require('react-native');
    const indicators = UNSAFE_queryAllByType(ActivityIndicator);
    expect(indicators.length).toBeGreaterThanOrEqual(1);
  });

  it('shows error state with retry when fetch fails', () => {
    mockUsePlans.mockReturnValue(queryResult(undefined, { error: new Error('Network error') }));

    render(<MaintenancePlansScreen />);
    expect(screen.getByText('Reintentar')).toBeTruthy();
  });

  it('renders plan list when data is available', () => {
    mockUsePlans.mockReturnValue(queryResult([mockPlan]));

    render(<MaintenancePlansScreen />);
    expect(screen.getByText('Plan Casa Centro')).toBeTruthy();
    expect(screen.getByText(/Av. Colón 500/)).toBeTruthy();
  });

  it('shows empty state when no plans exist', () => {
    mockUsePlans.mockReturnValue(queryResult([]));

    render(<MaintenancePlansScreen />);
    expect(screen.getByText('Todavía no tenés un plan activo')).toBeTruthy();
  });
});
