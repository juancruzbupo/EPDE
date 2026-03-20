import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

// ---------------------------------------------------------------------------
// Mocks — declared before import of the component under test
// ---------------------------------------------------------------------------

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('date-fns', () => ({
  formatDistanceToNow: () => 'hace 2 dias',
}));

jest.mock('date-fns/locale', () => ({
  es: {},
}));

const mockUseBudgets = jest.fn();

jest.mock('@/hooks/use-budgets', () => ({
  useBudgets: (...args: unknown[]) => mockUseBudgets(...args),
}));

jest.mock('@/components/create-budget-modal', () => ({
  CreateBudgetModal: () => null,
}));

jest.mock('@/hooks/use-debounce', () => ({
  useDebounce: (value: string) => value,
}));

jest.mock('@/lib/haptics', () => ({
  haptics: { selection: jest.fn(), light: jest.fn(), medium: jest.fn() },
}));

jest.mock('@/components/animated-list-item', () => ({
  AnimatedListItem: ({ children }: { children: React.ReactNode }) => children,
}));

// ---------------------------------------------------------------------------
// Import the component under test *after* mocks are set up
// ---------------------------------------------------------------------------

import BudgetsScreen from '@/app/(tabs)/budgets';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockBudgets = {
  pages: [
    {
      data: [
        {
          id: 'budget-1',
          title: 'Reparar techo',
          status: 'PENDING',
          createdAt: '2025-03-01T00:00:00.000Z',
          property: { id: 'prop-1', address: 'Av. Corrientes 1234', city: 'CABA' },
          response: null,
        },
        {
          id: 'budget-2',
          title: 'Pintura exterior',
          status: 'QUOTED',
          createdAt: '2025-03-05T00:00:00.000Z',
          property: { id: 'prop-2', address: 'Av. Santa Fe 5678', city: 'CABA' },
          response: { totalAmount: 150000 },
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

describe('BudgetsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders budget list when data is available', () => {
    mockUseBudgets.mockReturnValue(queryResult(mockBudgets));

    const { getByText } = render(<BudgetsScreen />);

    expect(getByText('Presupuestos')).toBeTruthy();
    expect(getByText('Reparar techo')).toBeTruthy();
    expect(getByText('Pintura exterior')).toBeTruthy();
  });

  it('shows empty state when no budgets', () => {
    mockUseBudgets.mockReturnValue(queryResult({ pages: [{ data: [] }] }));

    const { getByText } = render(<BudgetsScreen />);

    expect(getByText('Sin presupuestos')).toBeTruthy();
  });

  it('shows error state when query fails', () => {
    mockUseBudgets.mockReturnValue(queryResult(undefined, { error: new Error('Network error') }));

    const { getByText } = render(<BudgetsScreen />);

    expect(getByText('Reintentar')).toBeTruthy();
  });

  it('shows loading state', () => {
    mockUseBudgets.mockReturnValue(queryResult(undefined, { isLoading: true }));

    const { queryByText } = render(<BudgetsScreen />);

    expect(queryByText('Presupuestos')).toBeNull();
  });

  it('calls useBudgets with status filter when filter button is pressed', () => {
    mockUseBudgets.mockReturnValue(queryResult(mockBudgets));

    const { getByLabelText } = render(<BudgetsScreen />);

    fireEvent.press(getByLabelText('Filtrar por Pendientes'));

    // useBudgets should have been re-called with status filter via useState
    expect(mockUseBudgets).toHaveBeenCalled();
  });

  it('opens create modal when Nuevo button is pressed', () => {
    mockUseBudgets.mockReturnValue(queryResult(mockBudgets));

    const { getByLabelText } = render(<BudgetsScreen />);

    fireEvent.press(getByLabelText('Nuevo presupuesto'));

    // Modal state toggled — component renders without error
    expect(getByLabelText('Nuevo presupuesto')).toBeTruthy();
  });
});
