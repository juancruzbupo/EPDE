import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SearchInput } from '../search-input';

describe('SearchInput', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders input with default placeholder', () => {
    render(<SearchInput {...defaultProps} />);
    expect(screen.getByPlaceholderText('Buscar...')).toBeInTheDocument();
  });

  it('renders input with custom placeholder', () => {
    render(<SearchInput {...defaultProps} placeholder="Buscar propiedad..." />);
    expect(screen.getByPlaceholderText('Buscar propiedad...')).toBeInTheDocument();
  });

  it('calls onChange when typing', async () => {
    const user = userEvent.setup();
    render(<SearchInput {...defaultProps} />);

    const input = screen.getByPlaceholderText('Buscar...');
    await user.type(input, 'a');

    expect(defaultProps.onChange).toHaveBeenCalledWith('a');
  });

  it('displays the current value', () => {
    render(<SearchInput {...defaultProps} value="test query" />);
    expect(screen.getByDisplayValue('test query')).toBeInTheDocument();
  });

  it('renders search icon', () => {
    const { container } = render(<SearchInput {...defaultProps} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
