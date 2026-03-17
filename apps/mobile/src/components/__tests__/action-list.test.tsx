import type { UpcomingTask } from '@epde/shared';
import { ProfessionalRequirement, TaskPriority, TaskStatus } from '@epde/shared';
import { render, screen } from '@testing-library/react-native';
import React from 'react';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/lib/haptics', () => ({
  haptics: { light: jest.fn() },
}));

jest.mock('@/components/animated-list-item', () => ({
  AnimatedListItem: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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
  it('renders overdue and upcoming sections', () => {
    const overdueTask = makeTask({
      id: 'task-overdue',
      name: 'Tarea vencida',
      nextDueDate: new Date(Date.now() - 2 * 86400000).toISOString(),
    });
    const upcomingTask = makeTask({
      id: 'task-upcoming',
      name: 'Tarea próxima',
      nextDueDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    });
    render(<ActionList tasks={[overdueTask, upcomingTask]} />);
    expect(screen.getByText(/Necesitan atención/)).toBeTruthy();
    expect(screen.getByText('Tu semana')).toBeTruthy();
    expect(screen.getByText('Tarea vencida')).toBeTruthy();
    expect(screen.getByText('Tarea próxima')).toBeTruthy();
  });

  it('shows "Todo al día" when empty', () => {
    render(<ActionList tasks={[]} />);
    expect(screen.getByText('Todo al día')).toBeTruthy();
  });

  it('shows "Requiere profesional" badge for PROFESSIONAL_REQUIRED tasks', () => {
    const proTask = makeTask({
      professionalRequirement: ProfessionalRequirement.PROFESSIONAL_REQUIRED,
      nextDueDate: new Date(Date.now() - 86400000).toISOString(),
    });
    render(<ActionList tasks={[proTask]} />);
    expect(screen.getByText('Requiere profesional')).toBeTruthy();
  });
});
