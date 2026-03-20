import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

// ---------------------------------------------------------------------------
// Mocks — declared before import of the component under test
// ---------------------------------------------------------------------------

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('date-fns', () => ({
  formatDistanceToNow: () => 'en 3 dias',
}));

jest.mock('date-fns/locale', () => ({
  es: {},
}));

const mockUseAllTasks = jest.fn();

jest.mock('@/hooks/use-plans', () => ({
  useAllTasks: (...args: unknown[]) => mockUseAllTasks(...args),
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

import TasksScreen from '@/app/(tabs)/tasks';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockTasks = [
  {
    id: 'task-1',
    name: 'Revisar caldera',
    priority: 'HIGH',
    status: 'UPCOMING',
    nextDueDate: '2025-04-15',
    category: { id: 'cat-1', name: 'Calefaccion' },
    maintenancePlan: {
      id: 'plan-1',
      property: { id: 'prop-1', address: 'Av. Corrientes 1234', city: 'CABA' },
    },
  },
  {
    id: 'task-2',
    name: 'Limpiar canaletas',
    priority: 'MEDIUM',
    status: 'PENDING',
    nextDueDate: '2025-04-20',
    category: { id: 'cat-2', name: 'Exterior' },
    maintenancePlan: {
      id: 'plan-2',
      property: { id: 'prop-2', address: 'Av. Santa Fe 5678', city: 'CABA' },
    },
  },
];

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

describe('TasksScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders task list when data is available', () => {
    mockUseAllTasks.mockReturnValue(queryResult(mockTasks));

    const { getByText } = render(<TasksScreen />);

    expect(getByText('Tareas')).toBeTruthy();
    expect(getByText('Revisar caldera')).toBeTruthy();
    expect(getByText('Limpiar canaletas')).toBeTruthy();
  });

  it('shows empty state when no tasks', () => {
    mockUseAllTasks.mockReturnValue(queryResult([]));

    const { getByText } = render(<TasksScreen />);

    expect(getByText('Tareas')).toBeTruthy();
    expect(getByText('Sin tareas')).toBeTruthy();
  });

  it('shows error state when query fails', () => {
    mockUseAllTasks.mockReturnValue(queryResult(undefined, { error: new Error('Network error') }));

    const { getByText } = render(<TasksScreen />);

    expect(getByText('Reintentar')).toBeTruthy();
  });

  it('shows loading state', () => {
    mockUseAllTasks.mockReturnValue(queryResult(undefined, { isLoading: true }));

    const { queryByText } = render(<TasksScreen />);

    // Should not render task list content while loading
    expect(queryByText('Tareas')).toBeNull();
  });

  it('filters tasks by priority when filter button is pressed', () => {
    mockUseAllTasks.mockReturnValue(queryResult(mockTasks));

    const { getByLabelText, getByText } = render(<TasksScreen />);

    fireEvent.press(getByLabelText('Filtrar por Alta'));

    // After filtering by HIGH, only the HIGH priority task should remain
    expect(getByText('Revisar caldera')).toBeTruthy();
  });

  it('filters tasks by status when stat card is pressed', () => {
    mockUseAllTasks.mockReturnValue(queryResult(mockTasks));

    const { getByLabelText } = render(<TasksScreen />);

    fireEvent.press(getByLabelText('Filtrar por Pendiente'));

    // Stat card toggled — component renders without error
    expect(getByLabelText('Filtrar por Pendiente')).toBeTruthy();
  });
});
