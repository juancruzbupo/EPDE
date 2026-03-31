import { UserRole } from '@epde/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/hooks/use-notifications', () => ({
  useNotifications: vi.fn(),
  useMarkAsRead: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useMarkAllAsRead: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/test',
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: vi.fn((selector) => selector({ user: { id: 'admin-1', role: UserRole.ADMIN } })),
}));

vi.mock('@/components/ui/page-transition', () => ({
  PageTransition: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: React.PropsWithChildren) => <span>{children}</span>,
}));

vi.mock('@/components/page-header', () => ({
  PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

vi.mock('@/components/breadcrumbs', () => ({
  Breadcrumbs: () => <nav data-testid="breadcrumbs" />,
}));

vi.mock('@/components/empty-state', () => ({
  EmptyState: ({ title, message }: { title: string; message: string }) => (
    <div>
      <h2>{title}</h2>
      <p>{message}</p>
    </div>
  ),
}));

vi.mock('@/components/error-state', () => ({
  ErrorState: ({ message, onRetry }: { message: string; onRetry: () => void }) => (
    <div>
      <span>{message}</span>
      <button onClick={onRetry}>Reintentar</button>
    </div>
  ),
}));

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

vi.mock('@/lib/motion', () => ({
  useMotionPreference: () => ({ shouldAnimate: false }),
  FADE_IN_UP: {},
  MOTION_DURATION: { normal: 0.2 },
}));

import { useNotifications } from '@/hooks/use-notifications';

import NotificationsPage from '../page';

const makeNotification = (overrides: Record<string, unknown> = {}) => ({
  id: 'notif-1',
  type: 'SYSTEM',
  title: 'Notificación de prueba',
  message: 'Este es el cuerpo de la notificación',
  read: false,
  userId: 'user-1',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  ...overrides,
});

const makeInfiniteData = (items: ReturnType<typeof makeNotification>[]) => ({
  pages: [{ data: items, nextCursor: null }],
  pageParams: [undefined],
});

describe('NotificationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading skeletons during loading', () => {
    vi.mocked(useNotifications).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
      hasNextPage: false,
      fetchNextPage: vi.fn(),
    } as unknown as ReturnType<typeof useNotifications>);

    render(<NotificationsPage />);
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders ErrorState with retry on error', async () => {
    const refetch = vi.fn();
    vi.mocked(useNotifications).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
      hasNextPage: false,
      fetchNextPage: vi.fn(),
    } as unknown as ReturnType<typeof useNotifications>);

    const user = userEvent.setup();
    render(<NotificationsPage />);

    expect(screen.getByText('No se pudieron cargar las notificaciones')).toBeInTheDocument();

    await user.click(screen.getByText('Reintentar'));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('renders empty state when no notifications', () => {
    vi.mocked(useNotifications).mockReturnValue({
      data: makeInfiniteData([]),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      hasNextPage: false,
      fetchNextPage: vi.fn(),
    } as unknown as ReturnType<typeof useNotifications>);

    render(<NotificationsPage />);
    expect(screen.getByText('No tenés notificaciones por ahora.')).toBeInTheDocument();
  });

  it('renders page title and notification data', () => {
    const notifications = [
      makeNotification({ id: '1', title: 'Tarea vencida' }),
      makeNotification({ id: '2', title: 'Presupuesto actualizado', type: 'BUDGET_UPDATE' }),
    ];

    vi.mocked(useNotifications).mockReturnValue({
      data: makeInfiniteData(notifications),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      hasNextPage: false,
      fetchNextPage: vi.fn(),
    } as unknown as ReturnType<typeof useNotifications>);

    render(<NotificationsPage />);
    expect(screen.getByText('Notificaciones')).toBeInTheDocument();
    expect(screen.getByText('Tarea vencida')).toBeInTheDocument();
    expect(screen.getByText('Presupuesto actualizado')).toBeInTheDocument();
  });
});
