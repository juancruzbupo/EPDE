import type { PropertyPublic } from '@epde/shared';
import { PropertyType, UserRole } from '@epde/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/hooks/use-properties', () => ({
  useProperties: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/test',
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
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

vi.mock('@/components/search-input', () => ({
  SearchInput: () => <input placeholder="Buscar por dirección o ciudad..." />,
}));

vi.mock('@/components/filter-select', () => ({
  FilterSelect: () => <select />,
}));

vi.mock('@/app/(dashboard)/properties/create-property-dialog', () => ({
  CreatePropertyDialog: () => null,
}));

vi.mock('@/app/(dashboard)/properties/columns', () => ({
  propertyColumns: () => [
    { accessorKey: 'address', header: 'Dirección' },
    { accessorKey: 'city', header: 'Ciudad' },
  ],
}));

vi.mock('@/lib/motion', () => ({
  useMotionPreference: () => ({ shouldAnimate: false }),
  FADE_IN_UP: {},
  MOTION_DURATION: { normal: 0.2 },
}));

import { useProperties } from '@/hooks/use-properties';

import PropertiesPage from '../page';

const makeProperty = (overrides: Partial<PropertyPublic> = {}): PropertyPublic => ({
  id: 'prop-1',
  userId: 'user-1',
  createdBy: null,
  updatedBy: null,
  address: 'Av. Libertador 1000',
  city: 'CABA',
  type: PropertyType.HOUSE,
  yearBuilt: 2000,
  squareMeters: 120,
  photoUrl: null,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  ...overrides,
});

const makeInfiniteData = (items: PropertyPublic[]) => ({
  pages: [{ data: items, total: items.length, nextCursor: null }],
  pageParams: [undefined],
});

describe('PropertiesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading skeletons during loading', () => {
    vi.mocked(useProperties).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
      hasNextPage: false,
      fetchNextPage: vi.fn(),
    } as unknown as ReturnType<typeof useProperties>);

    render(<PropertiesPage />);
    const skeletons = screen.getAllByTestId('skeleton-shimmer');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders ErrorState with retry on error', async () => {
    const refetch = vi.fn();
    vi.mocked(useProperties).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
      hasNextPage: false,
      fetchNextPage: vi.fn(),
    } as unknown as ReturnType<typeof useProperties>);

    const user = userEvent.setup();
    render(<PropertiesPage />);

    expect(screen.getByText('No se pudieron cargar las propiedades')).toBeInTheDocument();

    await user.click(screen.getByText('Reintentar'));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('renders empty state when no properties', () => {
    vi.mocked(useProperties).mockReturnValue({
      data: makeInfiniteData([]),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      hasNextPage: false,
      fetchNextPage: vi.fn(),
    } as unknown as ReturnType<typeof useProperties>);

    render(<PropertiesPage />);
    expect(screen.getByText('No se encontraron propiedades')).toBeInTheDocument();
  });

  it('renders page title and property data', () => {
    const properties = [
      makeProperty({ id: '1', address: 'Av. Corrientes 500', city: 'CABA' }),
      makeProperty({ id: '2', address: 'Calle Falsa 123', city: 'Rosario' }),
    ];

    vi.mocked(useProperties).mockReturnValue({
      data: makeInfiniteData(properties),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      hasNextPage: false,
      fetchNextPage: vi.fn(),
    } as unknown as ReturnType<typeof useProperties>);

    render(<PropertiesPage />);
    expect(screen.getByText('Propiedades')).toBeInTheDocument();
    expect(screen.getByText('Av. Corrientes 500')).toBeInTheDocument();
    expect(screen.getByText('Calle Falsa 123')).toBeInTheDocument();
  });
});
