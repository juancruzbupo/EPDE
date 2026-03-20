import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

// ---------------------------------------------------------------------------
// Mocks — declared before import of the component under test
// ---------------------------------------------------------------------------

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('date-fns', () => ({
  formatDistanceToNow: () => 'hace 1 hora',
}));

jest.mock('date-fns/locale', () => ({
  es: {},
}));

jest.mock('@/lib/haptics', () => ({
  haptics: { light: jest.fn(), medium: jest.fn() },
}));

jest.mock('@/lib/colors', () => ({
  COLORS: { success: '#22c55e' },
}));

jest.mock('@/components/swipeable-row', () => ({
  SwipeableRow: ({ children }: { children: React.ReactNode }) => children,
}));

const mockUseNotifications = jest.fn();
const mockUseUnreadCount = jest.fn();
const mockUseMarkAsRead = jest.fn();
const mockUseMarkAllAsRead = jest.fn();

jest.mock('@/hooks/use-notifications', () => ({
  useNotifications: (...args: unknown[]) => mockUseNotifications(...args),
  useUnreadCount: (...args: unknown[]) => mockUseUnreadCount(...args),
  useMarkAsRead: (...args: unknown[]) => mockUseMarkAsRead(...args),
  useMarkAllAsRead: (...args: unknown[]) => mockUseMarkAllAsRead(...args),
}));

// ---------------------------------------------------------------------------
// Import the component under test *after* mocks are set up
// ---------------------------------------------------------------------------

import NotificationsScreen from '@/app/(tabs)/notifications';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockNotifications = {
  pages: [
    {
      data: [
        {
          id: 'notif-1',
          title: 'Tarea vencida',
          message: 'Revisar caldera está vencida',
          type: 'TASK_REMINDER',
          read: false,
          createdAt: '2025-03-10T00:00:00.000Z',
        },
        {
          id: 'notif-2',
          title: 'Presupuesto cotizado',
          message: 'Tu presupuesto fue cotizado',
          type: 'BUDGET_UPDATE',
          read: true,
          createdAt: '2025-03-09T00:00:00.000Z',
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

function setupMutationMocks() {
  mockUseUnreadCount.mockReturnValue({ data: 1 });
  mockUseMarkAsRead.mockReturnValue({ mutate: jest.fn() });
  mockUseMarkAllAsRead.mockReturnValue({ mutate: jest.fn(), isPending: false });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('NotificationsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMutationMocks();
  });

  it('renders notification list when data is available', () => {
    mockUseNotifications.mockReturnValue(queryResult(mockNotifications));

    const { getByText } = render(<NotificationsScreen />);

    expect(getByText('Notificaciones')).toBeTruthy();
    expect(getByText('Tarea vencida')).toBeTruthy();
    expect(getByText('Presupuesto cotizado')).toBeTruthy();
  });

  it('shows mark all as read button when unread count > 0', () => {
    mockUseNotifications.mockReturnValue(queryResult(mockNotifications));

    const { getByText } = render(<NotificationsScreen />);

    expect(getByText('Marcar todas como leídas')).toBeTruthy();
  });

  it('shows empty state when no notifications', () => {
    mockUseNotifications.mockReturnValue(queryResult({ pages: [{ data: [] }] }));

    const { getByText } = render(<NotificationsScreen />);

    expect(getByText('Sin notificaciones')).toBeTruthy();
  });

  it('shows error state when query fails', () => {
    mockUseNotifications.mockReturnValue(
      queryResult(undefined, { error: new Error('Network error') }),
    );

    const { getByText } = render(<NotificationsScreen />);

    expect(getByText('Reintentar')).toBeTruthy();
  });

  it('calls markAllAsRead when button is pressed', () => {
    const mutateMock = jest.fn();
    mockUseMarkAllAsRead.mockReturnValue({ mutate: mutateMock, isPending: false });
    mockUseNotifications.mockReturnValue(queryResult(mockNotifications));

    const { getByText } = render(<NotificationsScreen />);

    fireEvent.press(getByText('Marcar todas como leídas'));

    expect(mutateMock).toHaveBeenCalled();
  });
});
