import { UserRole } from '@epde/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/hooks/use-category-templates', () => ({
  useCategoryTemplates: vi.fn(),
  useDeleteCategoryTemplate: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useDeleteTaskTemplate: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}));

vi.mock('next/navigation', () => ({
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

vi.mock('@/app/(dashboard)/templates/category-template-dialog', () => ({
  CategoryTemplateDialog: () => null,
}));

vi.mock('@/app/(dashboard)/templates/task-template-dialog', () => ({
  TaskTemplateDialog: () => null,
}));

vi.mock('@/app/(dashboard)/templates/task-template-table', () => ({
  TaskTemplateTable: () => null,
}));

vi.mock('@/lib/motion', () => ({
  useMotionPreference: () => ({ shouldAnimate: false }),
  FADE_IN_UP: {},
  MOTION_DURATION: { normal: 0.2 },
}));

import { useCategoryTemplates } from '@/hooks/use-category-templates';

import TemplatesPage from '../page';

const makeCategoryTemplate = (overrides: Record<string, unknown> = {}) => ({
  id: 'ct-1',
  name: 'Categoría Base',
  description: 'Descripción de la categoría',
  icon: '🔧',
  order: 1,
  tasks: [],
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  ...overrides,
});

describe('TemplatesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading skeletons during loading', () => {
    vi.mocked(useCategoryTemplates).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useCategoryTemplates>);

    render(<TemplatesPage />);
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders ErrorState with retry on error', async () => {
    const refetch = vi.fn();
    vi.mocked(useCategoryTemplates).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
    } as unknown as ReturnType<typeof useCategoryTemplates>);

    const user = userEvent.setup();
    render(<TemplatesPage />);

    expect(screen.getByText('No se pudieron cargar las plantillas')).toBeInTheDocument();

    await user.click(screen.getByText('Reintentar'));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('renders empty state when no templates', () => {
    vi.mocked(useCategoryTemplates).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useCategoryTemplates>);

    render(<TemplatesPage />);
    expect(screen.getByText('No se encontraron plantillas')).toBeInTheDocument();
  });

  it('renders page title and template data', () => {
    const templates = [
      makeCategoryTemplate({
        id: '1',
        name: 'Estructura',
        tasks: [{ id: 't1', name: 'Revisar cimientos' }],
      }),
      makeCategoryTemplate({ id: '2', name: 'Instalaciones', tasks: [] }),
    ];

    vi.mocked(useCategoryTemplates).mockReturnValue({
      data: templates,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useCategoryTemplates>);

    render(<TemplatesPage />);
    expect(screen.getByText('Plantillas de Tareas')).toBeInTheDocument();
    expect(screen.getByText('Estructura')).toBeInTheDocument();
    expect(screen.getByText('Instalaciones')).toBeInTheDocument();
  });
});
