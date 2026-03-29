import { render, screen } from '@testing-library/react-native';
import React from 'react';

import { HomeStatusCard } from '../home-status-card';

jest.mock('../animated-number', () => ({
  AnimatedNumber: ({ value, suffix }: { value: number; suffix?: string }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Text } = require('react-native');
    return <Text>{`${value}${suffix ?? ''}`}</Text>;
  },
}));

jest.mock('@/lib/animations', () => ({
  TIMING: { slow: 0 },
  useReducedMotion: () => true,
}));

const defaultProps = {
  score: 85,
  label: 'Excelente',
  overdueTasks: 0,
  upcomingThisWeek: 2,
  urgentTasks: 0,
  pendingTasks: 3,
  completedThisMonth: 5,
  pendingBudgets: 1,
};

describe('HomeStatusCard', () => {
  it('renders "Tu casa está bien" when score >= 80', () => {
    render(<HomeStatusCard {...defaultProps} score={85} />);
    expect(screen.getByText('Tu casa está bien')).toBeTruthy();
  });

  it('renders "necesita atención urgente" when score < 40', () => {
    render(<HomeStatusCard {...defaultProps} score={30} />);
    expect(screen.getByText('Tu casa necesita atención urgente')).toBeTruthy();
  });

  it('renders 4 mini-stats (Vencidas, Pendientes, Completadas este mes, Presup. pendientes)', () => {
    render(
      <HomeStatusCard
        {...defaultProps}
        overdueTasks={2}
        pendingTasks={4}
        completedThisMonth={7}
        pendingBudgets={1}
      />,
    );
    expect(screen.getByText('Vencidas')).toBeTruthy();
    expect(screen.getByText('Pendientes')).toBeTruthy();
    expect(screen.getByText('Completadas este mes')).toBeTruthy();
    expect(screen.getByText('Presup. pendientes')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('4')).toBeTruthy();
    expect(screen.getByText('7')).toBeTruthy();
    expect(screen.getByText('1')).toBeTruthy();
  });
});
