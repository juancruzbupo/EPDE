import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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
  FADE_IN_UP: {},
  MOTION_DURATION: { slow: 0.3 },
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <div className={className}>{children}</div>
  ),
  CardContent: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <div className={className}>{children}</div>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: React.PropsWithChildren<{ onClick?: () => void }>) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

import { HomeStatusCard } from '../home-status-card';

const defaultProps = {
  score: 85,
  label: 'Excelente',
  overdueTasks: 0,
  upcomingThisWeek: 2,
  urgentTasks: 0,
  pendingTasks: 3,
  completedThisMonth: 5,
  pendingBudgets: 1,
  onViewActions: vi.fn(),
  onViewAnalytics: vi.fn(),
};

describe('HomeStatusCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "Tu casa está bien" when score >= 80', () => {
    render(<HomeStatusCard {...defaultProps} score={85} />);
    expect(screen.getByText('Tu casa está bien')).toBeInTheDocument();
  });

  it('renders "necesita atención urgente" when score < 40', () => {
    render(<HomeStatusCard {...defaultProps} score={30} />);
    expect(screen.getByText('Tu casa necesita atención urgente')).toBeInTheDocument();
  });

  it('shows human message with overdue + urgent counts', () => {
    render(<HomeStatusCard {...defaultProps} overdueTasks={2} urgentTasks={3} />);
    expect(
      screen.getByText('Tenés 2 tareas vencidas y 3 urgentes. Revisalas cuanto antes.'),
    ).toBeInTheDocument();
  });

  it('shows "Todo bajo control" message when all counts are 0', () => {
    render(
      <HomeStatusCard {...defaultProps} overdueTasks={0} urgentTasks={0} upcomingThisWeek={0} />,
    );
    expect(
      screen.getByText(
        'Todo bajo control. Seguí así y tu hogar se va a mantener en excelente estado.',
      ),
    ).toBeInTheDocument();
  });

  it('renders 4 mini-stats with correct values', () => {
    render(
      <HomeStatusCard
        {...defaultProps}
        overdueTasks={2}
        pendingTasks={4}
        completedThisMonth={7}
        pendingBudgets={1}
      />,
    );
    expect(screen.getByText('Vencidas')).toBeInTheDocument();
    expect(screen.getByText('Pendientes')).toBeInTheDocument();
    expect(screen.getByText('Completadas')).toBeInTheDocument();
    expect(screen.getByText('Presupuestos')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('calls onViewActions when button clicked', async () => {
    const user = userEvent.setup();
    const onViewActions = vi.fn();
    render(<HomeStatusCard {...defaultProps} onViewActions={onViewActions} />);

    await user.click(screen.getByText('Ver qué hacer'));

    expect(onViewActions).toHaveBeenCalledTimes(1);
  });
});
