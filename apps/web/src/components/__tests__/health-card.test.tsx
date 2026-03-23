import { render, screen } from '@testing-library/react';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

vi.mock('@/components/ui/animated-number', () => ({
  AnimatedNumber: ({ value }: { value: number }) => <span>{value}</span>,
}));

vi.mock('@/lib/motion', () => ({
  useMotionPreference: () => ({ shouldAnimate: false }),
  MOTION_DURATION: { slow: 0.3 },
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  CardContent: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <div className={className}>{children}</div>
  ),
}));

import { HealthCard } from '../health-card';

describe('HealthCard', () => {
  it('renders title', () => {
    render(<HealthCard totalTasks={10} completedTasks={8} overdueTasks={1} />);
    expect(screen.getByText('Salud del Mantenimiento')).toBeInTheDocument();
  });

  it('shows "Sin tareas" when totalTasks is 0', () => {
    render(<HealthCard totalTasks={0} completedTasks={0} overdueTasks={0} />);
    expect(screen.getByText('Sin tareas')).toBeInTheDocument();
  });

  it('shows "Excelente" when health > 90%', () => {
    render(<HealthCard totalTasks={20} completedTasks={19} overdueTasks={1} />);
    expect(screen.getByText('Excelente')).toBeInTheDocument();
  });

  it('shows "Bueno" when health >= 60 and < 80', () => {
    // 10 tasks, 3 overdue → percent = 70 → Bueno
    render(<HealthCard totalTasks={10} completedTasks={7} overdueTasks={3} />);
    expect(screen.getByText('Bueno')).toBeInTheDocument();
  });

  it('shows "Crítico" when health < 20', () => {
    // 10 tasks, 9 overdue → percent = 10 → Crítico
    render(<HealthCard totalTasks={10} completedTasks={1} overdueTasks={9} />);
    expect(screen.getByText('Crítico')).toBeInTheDocument();
  });

  it('displays completed and overdue counts', () => {
    render(<HealthCard totalTasks={10} completedTasks={7} overdueTasks={2} />);
    expect(screen.getByText('Completadas')).toBeInTheDocument();
    expect(screen.getByText('Vencidas')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
