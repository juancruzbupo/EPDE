import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

let capturedOnValueChange: ((value: string) => void) | undefined;

vi.mock('@/components/ui/select', () => ({
  Select: ({
    children,
    onValueChange,
  }: React.PropsWithChildren<{ value?: string; onValueChange?: (v: string) => void }>) => {
    capturedOnValueChange = onValueChange;
    return <div data-testid="select-root">{children}</div>;
  },
  SelectTrigger: ({ children }: React.PropsWithChildren) => (
    <button data-testid="select-trigger">{children}</button>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => (
    <span data-testid="select-value">{placeholder}</span>
  ),
  SelectContent: ({ children }: React.PropsWithChildren) => (
    <div data-testid="select-content">{children}</div>
  ),
  SelectItem: ({ children, value }: React.PropsWithChildren<{ value: string }>) => (
    <div
      data-testid={`select-item-${value}`}
      role="option"
      aria-selected={false}
      onClick={() => capturedOnValueChange?.(value)}
    >
      {children}
    </div>
  ),
}));

import { FilterSelect } from '../filter-select';

const options = [
  { label: 'Pendiente', value: 'pending' },
  { label: 'Aprobado', value: 'approved' },
];

describe('FilterSelect', () => {
  it('renders with placeholder', () => {
    render(<FilterSelect value="" onChange={vi.fn()} options={options} placeholder="Estado" />);

    expect(screen.getByText('Estado')).toBeInTheDocument();
  });

  it('renders "Todos" as first option', () => {
    render(<FilterSelect value="" onChange={vi.fn()} options={options} placeholder="Estado" />);

    expect(screen.getByText('Todos')).toBeInTheDocument();
  });

  it('renders options from array', () => {
    render(<FilterSelect value="" onChange={vi.fn()} options={options} placeholder="Estado" />);

    expect(screen.getByText('Pendiente')).toBeInTheDocument();
    expect(screen.getByText('Aprobado')).toBeInTheDocument();
  });

  it('calls onChange on selection', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <FilterSelect value="" onChange={handleChange} options={options} placeholder="Estado" />,
    );

    await user.click(screen.getByTestId('select-item-pending'));

    expect(handleChange).toHaveBeenCalledWith('pending');
  });

  it('renders all option items including Todos', () => {
    render(<FilterSelect value="" onChange={vi.fn()} options={options} placeholder="Estado" />);

    expect(screen.getByTestId('select-item-all')).toBeInTheDocument();
    expect(screen.getByTestId('select-item-pending')).toBeInTheDocument();
    expect(screen.getByTestId('select-item-approved')).toBeInTheDocument();
  });
});
