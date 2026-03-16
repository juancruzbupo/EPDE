import type { BudgetRequestPublic } from '@epde/shared';
import { BudgetStatus, UserRole } from '@epde/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/hooks/use-budgets', () => ({
  useBudgets: vi.fn(),
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

vi.mock('@/app/(dashboard)/budgets/create-budget-dialog', () => ({
  CreateBudgetDialog: () => null,
}));

vi.mock('@/app/(dashboard)/budgets/columns', () => ({
  budgetColumns: [
    { accessorKey: 'title', header: 'Título' },
    { accessorKey: 'status', header: 'Estado' },
  ],
}));

vi.mock('@/lib/motion', () => ({
  useMotionPreference: () => ({ shouldAnimate: false }),
  FADE_IN_UP: {},
  MOTION_DURATION: { normal: 0.2 },
}));

import { useBudgets } from '@/hooks/use-budgets';

import BudgetsPage from '../page';

const makeBudget = (overrides: Partial<BudgetRequestPublic> = {}): BudgetRequestPublic => ({
  id: 'budget-1',
  propertyId: 'prop-1',
  requestedBy: 'user-1',
  title: 'Presupuesto Techos',
  description: null,
  status: BudgetStatus.PENDING,
  createdBy: null,
  updatedBy: null,
  version: 1,
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
  lineItems: [],
  response: null,
  ...overrides,
});

const makeInfiniteData = (items: BudgetRequestPublic[]) => ({
  pages: [{ data: items, total: items.length, nextCursor: null }],
  pageParams: [undefined],
});

describe('BudgetsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading skeletons during loading', () => {
    vi.mocked(useBudgets).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
      hasNextPage: false,
      fetchNextPage: vi.fn(),
    } as unknown as ReturnType<typeof useBudgets>);

    render(<BudgetsPage />);
    const skeletons = screen.getAllByTestId('skeleton-shimmer');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders ErrorState with retry on error', async () => {
    const refetch = vi.fn();
    vi.mocked(useBudgets).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
      hasNextPage: false,
      fetchNextPage: vi.fn(),
    } as unknown as ReturnType<typeof useBudgets>);

    const user = userEvent.setup();
    render(<BudgetsPage />);

    expect(screen.getByText('No se pudieron cargar los presupuestos')).toBeInTheDocument();

    await user.click(screen.getByText('Reintentar'));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('renders empty state when no budgets', () => {
    vi.mocked(useBudgets).mockReturnValue({
      data: makeInfiniteData([]),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      hasNextPage: false,
      fetchNextPage: vi.fn(),
    } as unknown as ReturnType<typeof useBudgets>);

    render(<BudgetsPage />);
    expect(screen.getByText('No se encontraron presupuestos')).toBeInTheDocument();
  });

  it('renders page title and budget data', () => {
    const budgets = [
      makeBudget({ id: '1', title: 'Reparación de Techos' }),
      makeBudget({ id: '2', title: 'Pintura Exterior', status: BudgetStatus.APPROVED }),
    ];

    vi.mocked(useBudgets).mockReturnValue({
      data: makeInfiniteData(budgets),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      hasNextPage: false,
      fetchNextPage: vi.fn(),
    } as unknown as ReturnType<typeof useBudgets>);

    render(<BudgetsPage />);
    expect(screen.getByText('Presupuestos')).toBeInTheDocument();
    expect(screen.getByText('Reparación de Techos')).toBeInTheDocument();
    expect(screen.getByText('Pintura Exterior')).toBeInTheDocument();
  });
});
