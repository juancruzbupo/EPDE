import type { TaskListItem } from '@epde/shared';
import { TaskPriority, TaskStatus, UserRole } from '@epde/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/hooks/use-plans', () => ({
  useAllTasks: vi.fn(),
}));

vi.mock('@/hooks/use-task-operations', () => ({
  useTaskDetail: vi.fn(() => ({ data: undefined })),
}));

vi.mock('@/hooks/use-debounce', () => ({
  useDebounce: vi.fn((v: string) => v),
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

vi.mock('@/components/empty-state', () => ({
  EmptyState: ({ title, message }: { title: string; message: string }) => (
    <div>
      <span>{title}</span>
      <span>{message}</span>
    </div>
  ),
}));

vi.mock('@/components/search-input', () => ({
  SearchInput: () => <input data-testid="search-input" />,
}));

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

vi.mock('@/app/(dashboard)/properties/[id]/task-detail-sheet', () => ({
  TaskDetailSheet: () => null,
}));

vi.mock('@/app/(dashboard)/properties/[id]/complete-task-dialog', () => ({
  CompleteTaskDialog: () => null,
}));

vi.mock('@/lib/motion', () => ({
  useMotionPreference: () => ({ shouldAnimate: false }),
  FADE_IN_UP: {},
  MOTION_DURATION: { normal: 0.2 },
}));

import { useAllTasks } from '@/hooks/use-plans';

import TasksPage from '../page';

const makeTask = (overrides: Partial<TaskListItem> = {}): TaskListItem =>
  ({
    id: 'task-1',
    name: 'Revisar membrana',
    status: TaskStatus.PENDING,
    priority: TaskPriority.HIGH,
    nextDueDate: '2025-06-01T00:00:00.000Z',
    category: { id: 'cat-1', name: 'Techos' },
    maintenancePlan: {
      id: 'plan-1',
      property: { id: 'prop-1', address: 'Av. Libertador 1000', city: 'CABA' },
    },
    ...overrides,
  }) as TaskListItem;

describe('TasksPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading skeletons during loading', () => {
    vi.mocked(useAllTasks).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useAllTasks>);

    render(<TasksPage />);
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders ErrorState with retry on error', async () => {
    const refetch = vi.fn();
    vi.mocked(useAllTasks).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
    } as unknown as ReturnType<typeof useAllTasks>);

    const user = userEvent.setup();
    render(<TasksPage />);

    expect(screen.getByText('No se pudieron cargar las tareas')).toBeInTheDocument();

    await user.click(screen.getByText('Reintentar'));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('renders empty state when no tasks', () => {
    vi.mocked(useAllTasks).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useAllTasks>);

    render(<TasksPage />);
    expect(screen.getByText('Sin tareas')).toBeInTheDocument();
  });

  it('renders page title and task data', () => {
    const tasks = [
      makeTask({ id: '1', name: 'Revisar membrana', status: TaskStatus.PENDING }),
      makeTask({ id: '2', name: 'Pintar paredes', status: TaskStatus.OVERDUE }),
    ];

    vi.mocked(useAllTasks).mockReturnValue({
      data: tasks,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useAllTasks>);

    render(<TasksPage />);
    expect(screen.getByText('Tareas')).toBeInTheDocument();
    expect(screen.getByText('Revisar membrana')).toBeInTheDocument();
    expect(screen.getByText('Pintar paredes')).toBeInTheDocument();
  });
});
