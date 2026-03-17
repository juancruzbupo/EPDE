import { UserRole } from '@epde/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/hooks/use-categories', () => ({
  useCategories: vi.fn(),
  useDeleteCategory: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}));

vi.mock('@/hooks/use-category-templates', () => ({
  useCategoryTemplates: vi.fn(() => ({ data: [] })),
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

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

vi.mock('@/components/confirm-dialog', () => ({
  ConfirmDialog: () => null,
}));

vi.mock('@/app/(dashboard)/categories/category-dialog', () => ({
  CategoryDialog: () => null,
}));

vi.mock('@/lib/motion', () => ({
  useMotionPreference: () => ({ shouldAnimate: false }),
  FADE_IN_UP: {},
  MOTION_DURATION: { normal: 0.2 },
}));

import { useCategories } from '@/hooks/use-categories';

import CategoriesPage from '../page';

const makeCategory = (overrides: Record<string, unknown> = {}) => ({
  id: 'cat-1',
  name: 'Techos',
  description: 'Revisión de techos',
  icon: '🏠',
  order: 1,
  categoryTemplateId: null,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  ...overrides,
});

describe('CategoriesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading skeletons during loading', () => {
    vi.mocked(useCategories).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useCategories>);

    render(<CategoriesPage />);
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders ErrorState with retry on error', async () => {
    const refetch = vi.fn();
    vi.mocked(useCategories).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
    } as unknown as ReturnType<typeof useCategories>);

    const user = userEvent.setup();
    render(<CategoriesPage />);

    expect(screen.getByText('No se pudieron cargar las categorías')).toBeInTheDocument();

    await user.click(screen.getByText('Reintentar'));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('renders empty state when no categories', () => {
    vi.mocked(useCategories).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useCategories>);

    render(<CategoriesPage />);
    expect(screen.getByText('No se encontraron categorías')).toBeInTheDocument();
  });

  it('renders page title and category data', () => {
    const categories = [
      makeCategory({ id: '1', name: 'Techos' }),
      makeCategory({ id: '2', name: 'Electricidad', order: 2 }),
    ];

    vi.mocked(useCategories).mockReturnValue({
      data: categories,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useCategories>);

    render(<CategoriesPage />);
    expect(screen.getByText('Categorías')).toBeInTheDocument();
    expect(screen.getByText('Techos')).toBeInTheDocument();
    expect(screen.getByText('Electricidad')).toBeInTheDocument();
  });
});
