import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@/lib/animations', () => ({
  useSlideIn: () => ({}),
}));

jest.mock('@/lib/haptics', () => ({
  haptics: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('@/hooks/use-task-operations', () => ({
  useCompleteTask: () => ({ mutate: jest.fn(), isPending: false }),
}));

jest.mock('@/hooks/use-upload', () => ({
  useUploadFile: () => ({ mutate: jest.fn(), isPending: false }),
}));

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

import { CompleteTaskModal } from '../complete-task-modal';

const mockTask = {
  id: 'task-1',
  name: 'Test Task',
  status: 'PENDING',
  priority: 'MEDIUM',
  recurrenceType: 'ANNUAL',
  category: { id: 'cat-1', name: 'Test Category' },
} as Parameters<typeof CompleteTaskModal>[0]['task'];

describe('CompleteTaskModal', () => {
  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    task: mockTask,
    planId: 'plan-1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal with task name', () => {
    render(<CompleteTaskModal {...defaultProps} />);
    expect(screen.getByText('Test Task')).toBeTruthy();
    expect(screen.getByText('Registrar Inspección')).toBeTruthy();
  });

  it('renders all selector groups', () => {
    render(<CompleteTaskModal {...defaultProps} />);
    expect(screen.getByText('Resultado *')).toBeTruthy();
    expect(screen.getByText('¿En qué estado está? *')).toBeTruthy();
    expect(screen.getByText('¿Quién lo hizo? *')).toBeTruthy();
    expect(screen.getByText('Acción realizada *')).toBeTruthy();
  });

  it('renders optional fields', () => {
    render(<CompleteTaskModal {...defaultProps} />);
    expect(screen.getByText('Costo (opcional)')).toBeTruthy();
    expect(screen.getByText('Notas (opcional)')).toBeTruthy();
    expect(screen.getByText('Foto (opcional)')).toBeTruthy();
  });

  it('renders cancel and confirm buttons', () => {
    render(<CompleteTaskModal {...defaultProps} />);
    expect(screen.getByText('Cancelar')).toBeTruthy();
    expect(screen.getByText('Confirmar')).toBeTruthy();
  });

  it('shows discard confirmation when cancel is pressed (form has pre-filled defaults)', () => {
    render(<CompleteTaskModal {...defaultProps} />);
    fireEvent.press(screen.getByText('Cancelar'));
    // Form has pre-filled executor + actionTaken, so isDirty is true → confirmation dialog shown
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });
});
