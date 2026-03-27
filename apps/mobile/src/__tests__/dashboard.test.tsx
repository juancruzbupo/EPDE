import { render } from '@testing-library/react-native';
import React from 'react';

// ---------------------------------------------------------------------------
// Mocks — declared before import of the component under test
// ---------------------------------------------------------------------------

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('date-fns', () => ({
  formatDistanceToNow: () => 'en 3 días',
  differenceInDays: () => 3,
  isPast: () => false,
}));

jest.mock('date-fns/locale', () => ({
  es: {},
}));

const mockUseClientDashboardStats = jest.fn();
const mockUseClientUpcomingTasks = jest.fn();
const mockUseClientAnalytics = jest.fn();

jest.mock('@/hooks/use-dashboard', () => ({
  useClientDashboardStats: () => mockUseClientDashboardStats(),
  useClientUpcomingTasks: () => mockUseClientUpcomingTasks(),
  useClientAnalytics: () => mockUseClientAnalytics(),
}));

// Mock chart components to avoid react-native-svg issues in test environment
jest.mock('@/components/charts/mini-donut-chart', () => ({
  MiniDonutChart: () => null,
}));
jest.mock('@/components/charts/mini-bar-chart', () => ({
  MiniBarChart: () => null,
}));
jest.mock('@/components/charts/mini-trend-chart', () => ({
  MiniTrendChart: () => null,
}));
const ChartCardMock = ({ children }: { children: React.ReactNode }) => children;
jest.mock('@/components/charts/chart-card', () => ({
  ChartCard: ChartCardMock,
}));
jest.mock('@/components/charts/category-breakdown-list', () => ({
  CategoryBreakdownList: () => null,
}));

// ---------------------------------------------------------------------------
// Import the component under test *after* mocks are set up
// ---------------------------------------------------------------------------

import DashboardScreen from '@/app/(tabs)/index';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockStats = {
  totalProperties: 3,
  pendingTasks: 5,
  overdueTasks: 1,
  upcomingTasks: 4,
  upcomingThisWeek: 2,
  urgentTasks: 0,
  completedThisMonth: 7,
  pendingBudgets: 2,
  openServices: 1,
  healthScore: 75,
  healthLabel: 'Bueno',
};

const mockTasks = [
  {
    id: 'task-1',
    name: 'Revisar caldera',
    nextDueDate: '2026-04-15',
    priority: 'HIGH',
    status: 'UPCOMING',
    propertyAddress: 'Av. Corrientes 1234',
    propertyId: 'prop-1',
    categoryName: 'Calefacción',
    maintenancePlanId: 'plan-1',
    professionalRequirement: 'PROFESSIONAL_RECOMMENDED',
    sector: 'INSTALLATIONS',
  },
  {
    id: 'task-2',
    name: 'Limpiar canaletas',
    nextDueDate: '2026-04-20',
    priority: 'MEDIUM',
    status: 'PENDING',
    propertyAddress: 'Av. Santa Fe 5678',
    propertyId: 'prop-2',
    categoryName: 'Exterior',
    maintenancePlanId: 'plan-2',
    professionalRequirement: 'OWNER_CAN_DO',
    sector: 'EXTERIOR',
  },
];

const mockAnalytics = {
  conditionDistribution: [],
  conditionTrend: [],
  costHistory: [],
  categoryBreakdown: [],
  sectorBreakdown: [],
  healthScore: 75,
  healthLabel: 'Bueno',
  healthIndex: {
    score: 75,
    label: 'Bueno',
    dimensions: { compliance: 80, condition: 70, coverage: 60, investment: 65, trend: 50 },
    sectorScores: [],
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function queryResult(data: unknown, overrides?: Record<string, unknown>) {
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
    mockUseClientAnalytics.mockReturnValue(queryResult(mockAnalytics));
  });

  it('renders home status card and tasks when data is available', () => {
    mockUseClientDashboardStats.mockReturnValue(queryResult(mockStats));
    mockUseClientUpcomingTasks.mockReturnValue(queryResult(mockTasks));

    const { getByText, getAllByText } = render(<DashboardScreen />);

    expect(getByText('Mi Panel')).toBeTruthy();

    // HomeStatusCard mini-stats
    expect(getAllByText('Vencidas').length).toBeGreaterThanOrEqual(1);
    expect(getAllByText('Pendientes').length).toBeGreaterThanOrEqual(1);
    expect(getAllByText('Completadas').length).toBeGreaterThanOrEqual(1);

    // Task names from ActionList (may appear in NextInspectionCard + list)
    expect(getAllByText('Revisar caldera').length).toBeGreaterThanOrEqual(1);
    expect(getAllByText('Limpiar canaletas').length).toBeGreaterThanOrEqual(1);
  });

  it('shows positive message when no tasks', () => {
    mockUseClientDashboardStats.mockReturnValue(
      queryResult({ ...mockStats, overdueTasks: 0, upcomingThisWeek: 0, urgentTasks: 0 }),
    );
    mockUseClientUpcomingTasks.mockReturnValue(queryResult([]));

    const { getByText } = render(<DashboardScreen />);

    expect(getByText('Mi Panel')).toBeTruthy();
    // ActionList shows "Todo al día" when empty
    expect(getByText('Todo al día')).toBeTruthy();
  });

  it('shows error state when queries fail', () => {
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
