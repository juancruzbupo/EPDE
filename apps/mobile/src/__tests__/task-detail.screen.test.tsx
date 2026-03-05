import React from 'react';
import { render } from '@testing-library/react-native';

// ---------------------------------------------------------------------------
// Mocks — declared before import of the component under test
// ---------------------------------------------------------------------------

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ planId: 'plan-1', taskId: 'task-1' }),
  Stack: { Screen: () => null },
}));

jest.mock('date-fns', () => ({
  formatDistanceToNow: () => 'hace 2 dias',
  format: () => '15 abr 2025',
}));

jest.mock('date-fns/locale', () => ({
  es: {},
}));

const mockUseTaskDetail = jest.fn();
const mockUseTaskLogs = jest.fn();
const mockUseTaskNotes = jest.fn();
const mockUseAddTaskNote = jest.fn();

jest.mock('@/hooks/use-maintenance-plans', () => ({
  useTaskDetail: (...args: unknown[]) => mockUseTaskDetail(...args),
  useTaskLogs: (...args: unknown[]) => mockUseTaskLogs(...args),
  useTaskNotes: (...args: unknown[]) => mockUseTaskNotes(...args),
  useAddTaskNote: (...args: unknown[]) => mockUseAddTaskNote(...args),
}));

jest.mock('@/components/complete-task-modal', () => ({
  CompleteTaskModal: () => null,
}));

jest.mock('@/components/collapsible-section', () => ({
  CollapsibleSection: ({ children }: { children: React.ReactNode }) => children,
}));

// ---------------------------------------------------------------------------
// Import the component under test *after* mocks are set up
// ---------------------------------------------------------------------------

import TaskDetailScreen from '@/app/task/[planId]/[taskId]';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockTask = {
  id: 'task-1',
  name: 'Revisar caldera',
  description: 'Inspección anual del sistema de calefacción',
  status: 'PENDING',
  priority: 'HIGH',
  recurrenceType: 'ANNUAL',
  recurrenceMonths: null,
  nextDueDate: '2025-04-15',
  category: { id: 'cat-1', name: 'Calefacción' },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function queryResult<T>(
  data: T | undefined,
  overrides?: Partial<{ isLoading: boolean; error: Error | null }>,
) {
  return {
    data,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
    ...overrides,
  };
}

function setupDefaultMocks() {
  mockUseTaskDetail.mockReturnValue(queryResult(mockTask));
  mockUseTaskLogs.mockReturnValue(queryResult([]));
  mockUseTaskNotes.mockReturnValue(queryResult([]));
  mockUseAddTaskNote.mockReturnValue({ mutate: jest.fn(), isPending: false });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TaskDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders task name and details when data is available', () => {
    setupDefaultMocks();

    const { getByText, getAllByText } = render(<TaskDetailScreen />);

    expect(getAllByText('Revisar caldera').length).toBeGreaterThanOrEqual(1);
    expect(getByText('Inspección anual del sistema de calefacción')).toBeTruthy();
    expect(getByText('Calefacción')).toBeTruthy();
    expect(getByText('Anual')).toBeTruthy();
  });

  it('shows loading indicator when task is loading', () => {
    mockUseTaskDetail.mockReturnValue(queryResult(undefined, { isLoading: true }));
    mockUseTaskLogs.mockReturnValue(queryResult(undefined));
    mockUseTaskNotes.mockReturnValue(queryResult(undefined));
    mockUseAddTaskNote.mockReturnValue({ mutate: jest.fn(), isPending: false });

    const { queryByText } = render(<TaskDetailScreen />);

    // Should not show task content
    expect(queryByText('Revisar caldera')).toBeNull();
  });

  it('shows error state when task fetch fails', () => {
    mockUseTaskDetail.mockReturnValue(
      queryResult(undefined, { error: new Error('Network error') }),
    );
    mockUseTaskLogs.mockReturnValue(queryResult(undefined));
    mockUseTaskNotes.mockReturnValue(queryResult(undefined));
    mockUseAddTaskNote.mockReturnValue({ mutate: jest.fn(), isPending: false });

    const { getByText } = render(<TaskDetailScreen />);

    expect(getByText('Reintentar')).toBeTruthy();
  });

  it('shows complete task button for non-completed tasks', () => {
    setupDefaultMocks();

    const { getByText } = render(<TaskDetailScreen />);

    expect(getByText('Completar Tarea')).toBeTruthy();
  });

  it('hides complete task button for completed tasks', () => {
    mockUseTaskDetail.mockReturnValue(queryResult({ ...mockTask, status: 'COMPLETED' }));
    mockUseTaskLogs.mockReturnValue(queryResult([]));
    mockUseTaskNotes.mockReturnValue(queryResult([]));
    mockUseAddTaskNote.mockReturnValue({ mutate: jest.fn(), isPending: false });

    const { queryByText } = render(<TaskDetailScreen />);

    expect(queryByText('Completar Tarea')).toBeNull();
  });
});
