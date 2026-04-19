import type { ClientPublic } from '@epde/shared';
import { UserRole, UserStatus } from '@epde/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/hooks/use-clients', () => ({
  useClients: vi.fn(),
  useDeleteClient: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useReinviteClient: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/test',
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
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

vi.mock('@/components/error-state', () => ({
  ErrorState: ({ message, onRetry }: { message: string; onRetry: () => void }) => (
    <div>
      <span>{message}</span>
      <button onClick={onRetry}>Reintentar</button>
    </div>
  ),
}));

vi.mock('@/components/ui/skeleton-shimmer', () => ({
  SkeletonShimmer: ({ className }: { className?: string }) => (
    <div data-testid="skeleton-shimmer" className={className} />
  ),
}));

vi.mock('@/components/search-input', () => ({
  SearchInput: () => <input placeholder="Buscar por nombre o email..." />,
}));

vi.mock('@/components/filter-select', () => ({
  FilterSelect: () => <select />,
}));

vi.mock('@/components/confirm-dialog', () => ({
  ConfirmDialog: () => null,
}));

vi.mock('@/app/(dashboard)/clients/invite-client-dialog', () => ({
  InviteClientDialog: () => null,
}));

vi.mock('@/app/(dashboard)/clients/columns', () => ({
  clientColumns: () => [
    { accessorKey: 'name', header: 'Nombre' },
    { accessorKey: 'email', header: 'Email' },
  ],
}));

vi.mock('@/lib/motion', () => ({
  useMotionPreference: () => ({ shouldAnimate: false }),
  FADE_IN_UP: {},
  MOTION_DURATION: { normal: 0.2 },
}));

import { useClients } from '@/hooks/use-clients';

import ClientsPage from '../page';

const makeClient = (overrides: Partial<ClientPublic> = {}): ClientPublic => ({
  id: 'client-1',
  email: 'cliente@example.com',
  name: 'María López',
  phone: null,
  role: UserRole.CLIENT,
  status: UserStatus.ACTIVE,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  ...overrides,
});

const makeInfiniteData = (items: ClientPublic[]) => ({
  pages: [{ data: items, total: items.length, nextCursor: null }],
  pageParams: [undefined],
});

describe('ClientsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading skeletons during loading', () => {
    vi.mocked(useClients).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
      hasNextPage: false,
      fetchNextPage: vi.fn(),
    } as unknown as ReturnType<typeof useClients>);

    render(<ClientsPage />);
    const skeletons = screen.getAllByTestId('skeleton-shimmer');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders ErrorState with retry on error', async () => {
    const refetch = vi.fn();
    vi.mocked(useClients).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
      hasNextPage: false,
      fetchNextPage: vi.fn(),
    } as unknown as ReturnType<typeof useClients>);

    const user = userEvent.setup();
    render(<ClientsPage />);

    expect(screen.getAllByText('No se pudieron cargar los clientes').length).toBeGreaterThanOrEqual(
      1,
    );

    await user.click(screen.getByText('Reintentar'));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('renders empty state when no clients', () => {
    vi.mocked(useClients).mockReturnValue({
      data: makeInfiniteData([]),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      hasNextPage: false,
      fetchNextPage: vi.fn(),
    } as unknown as ReturnType<typeof useClients>);

    render(<ClientsPage />);
    expect(screen.getAllByText('No se encontraron clientes').length).toBeGreaterThanOrEqual(1);
  });

  it('renders page title and client data', () => {
    const clients = [
      makeClient({ id: '1', name: 'María López', email: 'maria@example.com' }),
      makeClient({ id: '2', name: 'Carlos Pérez', email: 'carlos@example.com' }),
    ];

    vi.mocked(useClients).mockReturnValue({
      data: makeInfiniteData(clients),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      hasNextPage: false,
      fetchNextPage: vi.fn(),
    } as unknown as ReturnType<typeof useClients>);

    render(<ClientsPage />);
    expect(screen.getAllByText('Clientes').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('María López').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Carlos Pérez').length).toBeGreaterThanOrEqual(1);
  });
});
