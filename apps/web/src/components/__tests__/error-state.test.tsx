import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorState } from '../error-state';

describe('ErrorState', () => {
  const defaultProps = {
    message: 'Ocurrió un error',
    onRetry: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders error message', () => {
    render(<ErrorState {...defaultProps} />);
    expect(screen.getByText('Ocurrió un error')).toBeInTheDocument();
  });

  it('renders Reintentar button', () => {
    render(<ErrorState {...defaultProps} />);
    expect(screen.getByText('Reintentar')).toBeInTheDocument();
  });

  it('calls onRetry when Reintentar is clicked', async () => {
    const user = userEvent.setup();
    render(<ErrorState {...defaultProps} />);

    await user.click(screen.getByText('Reintentar'));

    expect(defaultProps.onRetry).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    const { container } = render(<ErrorState {...defaultProps} className="py-24" />);
    expect(container.firstChild).toHaveClass('py-24');
  });
});
