import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from '../confirm-dialog';

describe('ConfirmDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    title: 'Confirmar accion',
    description: 'Esta seguro de continuar?',
    onConfirm: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title and description when open', () => {
    render(<ConfirmDialog {...defaultProps} />);

    expect(screen.getByText('Confirmar accion')).toBeInTheDocument();
    expect(screen.getByText('Esta seguro de continuar?')).toBeInTheDocument();
  });

  it('renders confirm and cancel buttons', () => {
    render(<ConfirmDialog {...defaultProps} />);

    expect(screen.getByText('Confirmar')).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup();
    render(<ConfirmDialog {...defaultProps} />);

    await user.click(screen.getByText('Confirmar'));

    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenChange(false) when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<ConfirmDialog {...defaultProps} />);

    await user.click(screen.getByText('Cancelar'));

    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows loading text when isLoading is true', () => {
    render(<ConfirmDialog {...defaultProps} isLoading />);

    expect(screen.getByText('Procesando...')).toBeInTheDocument();
    expect(screen.queryByText('Confirmar')).not.toBeInTheDocument();
  });

  it('disables buttons when isLoading is true', () => {
    render(<ConfirmDialog {...defaultProps} isLoading />);

    expect(screen.getByText('Cancelar')).toBeDisabled();
    expect(screen.getByText('Procesando...')).toBeDisabled();
  });
});
