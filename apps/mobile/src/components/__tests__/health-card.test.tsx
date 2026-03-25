import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { AccessibilityInfo } from 'react-native';

import { HealthCard } from '../health-card';

// Enable reduced motion so AnimatedNumber displays values synchronously
jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
jest.spyOn(AccessibilityInfo, 'addEventListener').mockReturnValue(
  // @ts-expect-error -- Jest mock return for subscription
  { remove: jest.fn() },
);

describe('HealthCard', () => {
  it('shows "Sin tareas" when totalTasks is 0', () => {
    render(<HealthCard totalTasks={0} completedTasks={0} overdueTasks={0} />);
    expect(screen.getByText('Sin tareas')).toBeTruthy();
  });

  it('shows "Excelente" when overdue ratio yields > 90%', () => {
    // 100 total, 5 overdue → (100-5)/100 = 95%
    render(<HealthCard totalTasks={100} completedTasks={90} overdueTasks={5} />);
    expect(screen.getByText('Excelente')).toBeTruthy();
  });

  it('shows "Bueno" when overdue ratio yields 60-79%', () => {
    // 100 total, 30 overdue → (100-30)/100 = 70%
    render(<HealthCard totalTasks={100} completedTasks={60} overdueTasks={30} />);
    expect(screen.getByText('Bueno')).toBeTruthy();
  });

  it('shows "Regular" when overdue ratio yields 40-59%', () => {
    // 100 total, 50 overdue → (100-50)/100 = 50%
    render(<HealthCard totalTasks={100} completedTasks={30} overdueTasks={50} />);
    expect(screen.getByText('Regular')).toBeTruthy();
  });

  it('shows "Necesita atención" when overdue ratio yields 20-39%', () => {
    // 100 total, 70 overdue → (100-70)/100 = 30%
    render(<HealthCard totalTasks={100} completedTasks={10} overdueTasks={70} />);
    expect(screen.getByText('Necesita atención')).toBeTruthy();
  });

  it('shows "Crítico" when overdue ratio yields < 20%', () => {
    // 100 total, 90 overdue → (100-90)/100 = 10%
    render(<HealthCard totalTasks={100} completedTasks={5} overdueTasks={90} />);
    expect(screen.getByText('Crítico')).toBeTruthy();
  });

  it('displays the completed tasks count', () => {
    render(<HealthCard totalTasks={50} completedTasks={35} overdueTasks={5} />);
    expect(screen.getByText('35')).toBeTruthy();
    expect(screen.getByText('Completadas')).toBeTruthy();
  });

  it('displays the overdue tasks count', () => {
    render(<HealthCard totalTasks={50} completedTasks={20} overdueTasks={12} />);
    expect(screen.getByText('12')).toBeTruthy();
    expect(screen.getByText('Vencidas')).toBeTruthy();
  });

  it('renders "Excelente" when all tasks are completed and none overdue', () => {
    // 10 total, 0 overdue → (10-0)/10 = 100%
    render(<HealthCard totalTasks={10} completedTasks={10} overdueTasks={0} />);
    expect(screen.getByText('Excelente')).toBeTruthy();
    expect(screen.getByText('10')).toBeTruthy();
  });

  it('renders "Crítico" when all tasks are overdue', () => {
    // 10 total, 10 overdue → (10-10)/10 = 0% → Crítico (< 20%)
    render(<HealthCard totalTasks={10} completedTasks={0} overdueTasks={10} />);
    expect(screen.getByText('Crítico')).toBeTruthy();
  });

  it('renders zero completed tasks', () => {
    render(<HealthCard totalTasks={20} completedTasks={0} overdueTasks={2} />);
    expect(screen.getByText('0')).toBeTruthy();
  });
});
