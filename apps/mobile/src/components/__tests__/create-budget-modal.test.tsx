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

jest.mock('@/hooks/use-budgets', () => ({
  useCreateBudgetRequest: () => ({ mutate: jest.fn(), isPending: false }),
}));

jest.mock('@/hooks/use-properties', () => ({
  useProperties: () => ({
    data: {
      pages: [
        {
          data: [{ id: 'prop-1', address: 'Calle Falsa 123', city: 'Buenos Aires' }],
        },
      ],
    },
  }),
}));

import { CreateBudgetModal } from '../create-budget-modal';

describe('CreateBudgetModal', () => {
  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal with header', () => {
    render(<CreateBudgetModal {...defaultProps} />);
    expect(screen.getByText('Nuevo Presupuesto')).toBeTruthy();
  });

  it('renders property selector with available properties', () => {
    render(<CreateBudgetModal {...defaultProps} />);
    expect(screen.getByText('Propiedad')).toBeTruthy();
    expect(screen.getByText('Calle Falsa 123')).toBeTruthy();
    expect(screen.getByText('Buenos Aires')).toBeTruthy();
  });

  it('renders form fields', () => {
    render(<CreateBudgetModal {...defaultProps} />);
    expect(screen.getByText('Titulo')).toBeTruthy();
    expect(screen.getByText('Descripcion (opcional)')).toBeTruthy();
  });

  it('renders cancel and create buttons', () => {
    render(<CreateBudgetModal {...defaultProps} />);
    expect(screen.getByText('Cancelar')).toBeTruthy();
    expect(screen.getByText('Crear')).toBeTruthy();
  });

  it('calls onClose when cancel is pressed and form is clean', () => {
    render(<CreateBudgetModal {...defaultProps} />);
    fireEvent.press(screen.getByText('Cancelar'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });
});
