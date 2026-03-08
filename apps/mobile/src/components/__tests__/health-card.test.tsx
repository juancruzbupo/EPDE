import React from 'react';
import { AccessibilityInfo } from 'react-native';
import { render, screen } from '@testing-library/react-native';
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

  it('shows "Bueno" when overdue ratio yields 71-90%', () => {
    // 100 total, 20 overdue → (100-20)/100 = 80%
    render(<HealthCard totalTasks={100} completedTasks={60} overdueTasks={20} />);
    expect(screen.getByText('Bueno')).toBeTruthy();
  });

  it('shows "Necesita atencion" when overdue ratio yields 51-70%', () => {
    // 100 total, 40 overdue → (100-40)/100 = 60%
    render(<HealthCard totalTasks={100} completedTasks={30} overdueTasks={40} />);
    expect(screen.getByText('Necesita atencion')).toBeTruthy();
  });

  it('shows "Critico" when overdue ratio yields ≤ 50%', () => {
    // 100 total, 60 overdue → (100-60)/100 = 40%
    render(<HealthCard totalTasks={100} completedTasks={10} overdueTasks={60} />);
    expect(screen.getByText('Critico')).toBeTruthy();
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

  it('renders "Critico" when all tasks are overdue', () => {
    // 10 total, 10 overdue → (10-10)/10 = 0%
    render(<HealthCard totalTasks={10} completedTasks={0} overdueTasks={10} />);
    expect(screen.getByText('Critico')).toBeTruthy();
  });

  it('renders zero completed tasks', () => {
    render(<HealthCard totalTasks={20} completedTasks={0} overdueTasks={2} />);
    expect(screen.getByText('0')).toBeTruthy();
  });
});
