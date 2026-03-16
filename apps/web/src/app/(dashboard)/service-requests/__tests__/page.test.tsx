import type { ServiceRequestPublic } from '@epde/shared';
import { ServiceStatus, ServiceUrgency, UserRole } from '@epde/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/hooks/use-service-requests', () => ({
  useServiceRequests: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
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

vi.mock('@/components/filter-select', () => ({
  FilterSelect: () => <select />,
}));

vi.mock('@/app/(dashboard)/service-requests/create-service-dialog', () => ({
  CreateServiceDialog: () => null,
}));

vi.mock('@/app/(dashboard)/service-requests/columns', () => ({
  serviceRequestColumns: [
    { accessorKey: 'title', header: 'Título' },
    { accessorKey: 'status', header: 'Estado' },
  ],
}));

vi.mock('@/lib/motion', () => ({
  useMotionPreference: () => ({ shouldAnimate: false }),
  FADE_IN_UP: {},
  MOTION_DURATION: { normal: 0.2 },
}));

import { useServiceRequests } from '@/hooks/use-service-requests';

import ServiceRequestsPage from '../page';

const makeServiceRequest = (
  overrides: Partial<ServiceRequestPublic> = {},
): ServiceRequestPublic => ({
  id: 'sr-1',
  propertyId: 'prop-1',
  requestedBy: 'user-1',
  title: 'Reparación de cañería',
  description: 'Pérdida de agua en baño',
  urgency: ServiceUrgency.MEDIUM,
  status: ServiceStatus.OPEN,
  createdBy: null,
  updatedBy: null,
  deletedAt: null,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  property: {
    id: 'prop-1',
    address: 'Av. Libertador 1000',
    city: 'CABA',
    user: { id: 'user-1', name: 'Juan García' },
  },
  requester: { id: 'user-1', name: 'Juan García', email: 'juan@example.com' },
  photos: [],
  ...overrides,
});

const makeInfiniteData = (items: ServiceRequestPublic[]) => ({
  pages: [{ data: items, total: items.length, nextCursor: null }],
  pageParams: [undefined],
});

describe('ServiceRequestsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading skeletons during loading', () => {
    vi.mocked(useServiceRequests).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
      hasNextPage: false,
      fetchNextPage: vi.fn(),
    } as unknown as ReturnType<typeof useServiceRequests>);

    render(<ServiceRequestsPage />);
    const skeletons = screen.getAllByTestId('skeleton-shimmer');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders ErrorState with retry on error', async () => {
    const refetch = vi.fn();
    vi.mocked(useServiceRequests).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
      hasNextPage: false,
      fetchNextPage: vi.fn(),
    } as unknown as ReturnType<typeof useServiceRequests>);

    const user = userEvent.setup();
    render(<ServiceRequestsPage />);

    expect(screen.getByText('No se pudieron cargar las solicitudes')).toBeInTheDocument();

    await user.click(screen.getByText('Reintentar'));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('renders empty state when no service requests', () => {
    vi.mocked(useServiceRequests).mockReturnValue({
      data: makeInfiniteData([]),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      hasNextPage: false,
      fetchNextPage: vi.fn(),
    } as unknown as ReturnType<typeof useServiceRequests>);

    render(<ServiceRequestsPage />);
    expect(screen.getByText('No se encontraron solicitudes de servicio')).toBeInTheDocument();
  });

  it('renders page title and service request data', () => {
    const requests = [
      makeServiceRequest({ id: '1', title: 'Reparación de cañería' }),
      makeServiceRequest({
        id: '2',
        title: 'Fuga de gas en cocina',
        urgency: ServiceUrgency.URGENT,
      }),
    ];

    vi.mocked(useServiceRequests).mockReturnValue({
      data: makeInfiniteData(requests),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      hasNextPage: false,
      fetchNextPage: vi.fn(),
    } as unknown as ReturnType<typeof useServiceRequests>);

    render(<ServiceRequestsPage />);
    expect(screen.getByText('Solicitudes de Servicio')).toBeInTheDocument();
    expect(screen.getByText('Reparación de cañería')).toBeInTheDocument();
    expect(screen.getByText('Fuga de gas en cocina')).toBeInTheDocument();
  });
});
