import type { PlanListItem } from '@epde/shared';
import { PlanStatus } from '@epde/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/hooks/use-plans', () => ({
  usePlans: vi.fn(),
}));

vi.mock('@/components/ui/page-transition', () => ({
  PageTransition: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

vi.mock('@/components/page-header', () => ({
  PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: React.PropsWithChildren) => <span>{children}</span>,
}));

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
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

vi.mock('@/components/empty-state', () => ({
  EmptyState: ({ title, message }: { title: string; message: string }) => (
    <div>
      <span>{title}</span>
      <span>{message}</span>
    </div>
  ),
}));

import { usePlans } from '@/hooks/use-plans';

import PlansPage from '../page';

const makePlan = (overrides: Partial<PlanListItem> = {}): PlanListItem => ({
  id: 'plan-1',
  name: 'Plan Anual Casa Centro',
  status: PlanStatus.ACTIVE,
  property: { id: 'prop-1', address: 'Av. Libertador 1000', city: 'CABA' },
  _count: { tasks: 5 },
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  ...overrides,
});

describe('PlansPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading skeletons during loading', () => {
    vi.mocked(usePlans).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof usePlans>);

    render(<PlansPage />);
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders ErrorState with retry on error', async () => {
    const refetch = vi.fn();
    vi.mocked(usePlans).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
    } as unknown as ReturnType<typeof usePlans>);

    const user = userEvent.setup();
    render(<PlansPage />);

    expect(screen.getByText('No se pudieron cargar los planes')).toBeInTheDocument();

    await user.click(screen.getByText('Reintentar'));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('renders empty state when no plans', () => {
    vi.mocked(usePlans).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof usePlans>);

    render(<PlansPage />);
    expect(screen.getByText('Sin planes')).toBeInTheDocument();
  });

  it('renders plans when data is available', () => {
    const plans = [
      makePlan({ id: '1', name: 'Plan Casa Centro', status: PlanStatus.ACTIVE }),
      makePlan({ id: '2', name: 'Plan Departamento Norte', status: PlanStatus.DRAFT }),
    ];

    vi.mocked(usePlans).mockReturnValue({
      data: plans,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof usePlans>);

    render(<PlansPage />);
    expect(screen.getByText('Planes de Mantenimiento')).toBeInTheDocument();
    expect(screen.getByText('Plan Casa Centro')).toBeInTheDocument();
    expect(screen.getByText('Plan Departamento Norte')).toBeInTheDocument();
    expect(screen.getByText('2 planes')).toBeInTheDocument();
  });
});
