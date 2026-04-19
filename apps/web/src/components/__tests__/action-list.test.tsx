import type { UpcomingTask } from '@epde/shared';
import { ProfessionalRequirement, TaskPriority, TaskStatus } from '@epde/shared';
import { render, screen } from '@testing-library/react';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

vi.mock('@/lib/motion', () => ({
  useMotionPreference: () => ({ shouldAnimate: false }),
  STAGGER_CONTAINER: {},
  STAGGER_ITEM: {},
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: React.PropsWithChildren<{ href: string }>) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <div className={className}>{children}</div>
  ),
  CardContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  CardHeader: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  CardTitle: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <h3 className={className}>{children}</h3>
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({
    children,
    variant,
  }: React.PropsWithChildren<{ variant?: string; className?: string }>) => (
    <span data-variant={variant}>{children}</span>
  ),
}));

function makeTask(overrides: Partial<UpcomingTask> = {}): UpcomingTask {
  return {
    id: 'task-1',
    name: 'Revisar canaletas',
    nextDueDate: new Date(Date.now() - 86400000).toISOString(), // yesterday (overdue)
    priority: TaskPriority.HIGH,
    status: TaskStatus.PENDING,
    propertyAddress: 'Av. Libertador 1234',
    propertyId: 'prop-1',
    categoryName: 'Canaletas',
    maintenancePlanId: 'plan-1',
    professionalRequirement: ProfessionalRequirement.OWNER_CAN_DO,
    sector: null,
    ...overrides,
  };
}

import { ActionList } from '../action-list';

describe('ActionList', () => {
  it('renders overdue tasks in "Necesitan atención" section', () => {
    const overdueTask = makeTask({
      nextDueDate: new Date(Date.now() - 86400000).toISOString(),
    });
    render(<ActionList tasks={[overdueTask]} />);
    expect(screen.getByText('Necesitan atención')).toBeInTheDocument();
    expect(screen.getByText('Revisar canaletas')).toBeInTheDocument();
  });

  it('renders upcoming tasks in "Tu semana" section', () => {
    const upcomingTask = makeTask({
      id: 'task-2',
      name: 'Limpiar filtros',
      nextDueDate: new Date(Date.now() + 2 * 86400000).toISOString(), // 2 days from now
    });
    render(<ActionList tasks={[upcomingTask]} />);
    expect(screen.getByText('Tu semana')).toBeInTheDocument();
    expect(screen.getByText('Limpiar filtros')).toBeInTheDocument();
  });

  it('shows "Todo al día" when no tasks', () => {
    render(<ActionList tasks={[]} />);
    expect(screen.getByText('Todo al día')).toBeInTheDocument();
  });

  it('shows "Requiere profesional" badge for PROFESSIONAL_REQUIRED tasks', () => {
    const proTask = makeTask({
      professionalRequirement: ProfessionalRequirement.PROFESSIONAL_REQUIRED,
      nextDueDate: new Date(Date.now() - 86400000).toISOString(),
    });
    render(<ActionList tasks={[proTask]} />);
    // Text vive concatenado ("Categoría · Prioridad · Requiere profesional")
    // dentro de un solo <p>, así que usamos regex substring.
    expect(screen.getByText(/Requiere profesional/)).toBeInTheDocument();
  });

  it('links to correct task detail URL', () => {
    const task = makeTask({
      id: 'task-abc',
      maintenancePlanId: 'plan-xyz',
      nextDueDate: new Date(Date.now() - 86400000).toISOString(),
    });
    render(<ActionList tasks={[task]} />);
    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', '/tasks?taskId=task-abc');
  });
});
