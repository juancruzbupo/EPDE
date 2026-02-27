import React from 'react';
import { render } from '@testing-library/react-native';
import type { ClientDashboardStats, UpcomingTask } from '@epde/shared/types';

// ---------------------------------------------------------------------------
// Mocks — declared before import of the component under test
// ---------------------------------------------------------------------------

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('date-fns', () => ({
  formatDistanceToNow: () => 'en 3 dias',
}));

jest.mock('date-fns/locale', () => ({
  es: {},
}));

const mockUseClientDashboardStats = jest.fn();
const mockUseClientUpcomingTasks = jest.fn();

jest.mock('@/hooks/use-dashboard', () => ({
  useClientDashboardStats: (...args: unknown[]) => mockUseClientDashboardStats(...args),
  useClientUpcomingTasks: (...args: unknown[]) => mockUseClientUpcomingTasks(...args),
}));

// ---------------------------------------------------------------------------
// Import the component under test *after* mocks are set up
// ---------------------------------------------------------------------------

import DashboardScreen from '@/app/(tabs)/index';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockStats: ClientDashboardStats = {
  totalProperties: 3,
  pendingTasks: 5,
  overdueTasks: 1,
  upcomingTasks: 4,
  completedThisMonth: 7,
  pendingBudgets: 2,
  openServices: 1,
};

const mockTasks: UpcomingTask[] = [
  {
    id: 'task-1',
    name: 'Revisar caldera',
    nextDueDate: '2025-04-15',
    priority: 'HIGH',
    status: 'UPCOMING',
    propertyAddress: 'Av. Corrientes 1234',
    categoryName: 'Calefaccion',
    maintenancePlanId: 'plan-1',
  },
  {
    id: 'task-2',
    name: 'Limpiar canaletas',
    nextDueDate: '2025-04-20',
    priority: 'MEDIUM',
    status: 'PENDING',
    propertyAddress: 'Av. Santa Fe 5678',
    categoryName: 'Exterior',
    maintenancePlanId: 'plan-2',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Default query return shape for "loading finished, no error" scenarios. */
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

describe('DashboardScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // 1. Renders stats and tasks when data is available
  it('renders stats and tasks when data is available', () => {
    mockUseClientDashboardStats.mockReturnValue(queryResult(mockStats));
    mockUseClientUpcomingTasks.mockReturnValue(queryResult(mockTasks));

    const { getByText, getAllByText } = render(<DashboardScreen />);

    // Heading
    expect(getByText('Mi Panel')).toBeTruthy();

    // Stat card titles
    expect(getByText('Propiedades')).toBeTruthy();
    expect(getByText('Tareas Pendientes')).toBeTruthy();
    expect(getByText('Tareas Vencidas')).toBeTruthy();
    expect(getByText('Completadas (mes)')).toBeTruthy();
    expect(getByText('Presupuestos')).toBeTruthy();
    expect(getByText('Servicios')).toBeTruthy();

    // Stat card values (use getAllByText for values that appear more than once)
    expect(getByText('3')).toBeTruthy(); // totalProperties
    expect(getByText('5')).toBeTruthy(); // pendingTasks
    expect(getByText('7')).toBeTruthy(); // completedThisMonth
    expect(getAllByText('1').length).toBeGreaterThanOrEqual(1); // overdueTasks & openServices
    expect(getByText('2')).toBeTruthy(); // pendingBudgets

    // Section heading
    expect(getByText('Proximas Tareas')).toBeTruthy();

    // Task cards
    expect(getByText('Revisar caldera')).toBeTruthy();
    expect(getByText('Av. Corrientes 1234')).toBeTruthy();
    expect(getByText('Limpiar canaletas')).toBeTruthy();
    expect(getByText('Av. Santa Fe 5678')).toBeTruthy();
  });

  // 2. Shows empty state when no upcoming tasks
  it('shows empty state when no upcoming tasks', () => {
    mockUseClientDashboardStats.mockReturnValue(queryResult(mockStats));
    mockUseClientUpcomingTasks.mockReturnValue(queryResult([]));

    const { getByText } = render(<DashboardScreen />);

    expect(getByText('Mi Panel')).toBeTruthy();
    expect(getByText('Proximas Tareas')).toBeTruthy();
    expect(getByText('Sin tareas proximas')).toBeTruthy();
    expect(getByText('No hay tareas de mantenimiento programadas por ahora.')).toBeTruthy();
  });

  // 3. Shows error state when both queries fail
  it('shows error state when both queries fail', () => {
    mockUseClientDashboardStats.mockReturnValue(
      queryResult(undefined, { error: new Error('Network error') }),
    );
    mockUseClientUpcomingTasks.mockReturnValue(
      queryResult(undefined, { error: new Error('Network error') }),
    );

    const { getByText } = render(<DashboardScreen />);

    expect(getByText('No se pudieron cargar los datos del panel.')).toBeTruthy();
    expect(getByText('Reintentar')).toBeTruthy();
  });
});
