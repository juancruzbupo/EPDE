import { ColumnDef } from '@tanstack/react-table';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

vi.mock('framer-motion', () => ({
  motion: {
    tr: 'tr',
    td: 'td',
    span: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <span {...props}>{children}</span>
    ),
  },
  useReducedMotion: () => false,
}));

vi.mock('@/lib/motion', () => ({
  useMotionPreference: () => ({ shouldAnimate: false }),
  FADE_IN_UP: {},
  MOTION_DURATION: { fast: 0.15, normal: 0.25, slow: 0.4 },
}));

vi.mock('@/components/ui/skeleton-shimmer', () => ({
  SkeletonShimmer: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

import { DataTable } from '../data-table';

type TestRow = { id: string; name: string; email: string };

const columns: ColumnDef<TestRow, unknown>[] = [
  { accessorKey: 'name', header: 'Nombre' },
  { accessorKey: 'email', header: 'Email' },
];

const data: TestRow[] = [
  { id: '1', name: 'Juan', email: 'juan@test.com' },
  { id: '2', name: 'María', email: 'maria@test.com' },
];

describe('DataTable', () => {
  it('renders data rows and cells', () => {
    render(<DataTable columns={columns} data={data} />);

    expect(screen.getByText('Juan')).toBeInTheDocument();
    expect(screen.getByText('juan@test.com')).toBeInTheDocument();
    expect(screen.getByText('María')).toBeInTheDocument();
    expect(screen.getByText('maria@test.com')).toBeInTheDocument();
  });

  it('renders column headers', () => {
    render(<DataTable columns={columns} data={data} />);

    expect(screen.getByText('Nombre')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('shows skeleton rows when loading', () => {
    render(<DataTable columns={columns} data={[]} isLoading />);

    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows default empty message when no data', () => {
    render(<DataTable columns={columns} data={[]} />);

    expect(screen.getByText('Sin resultados')).toBeInTheDocument();
  });

  it('shows custom empty message', () => {
    render(<DataTable columns={columns} data={[]} emptyMessage="No hay propiedades" />);

    expect(screen.getByText('No hay propiedades')).toBeInTheDocument();
  });

  it('calls onRowClick when a row is clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<DataTable columns={columns} data={data} onRowClick={handleClick} />);

    await user.click(screen.getByText('Juan'));

    expect(handleClick).toHaveBeenCalledWith(data[0]);
  });

  it('calls onRowClick on keyboard Enter', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<DataTable columns={columns} data={data} onRowClick={handleClick} />);

    const row = screen.getByText('Juan').closest('tr')!;
    row.focus();
    await user.keyboard('{Enter}');

    expect(handleClick).toHaveBeenCalledWith(data[0]);
  });

  it('shows "Cargar más" button when hasMore is true', () => {
    const handleLoadMore = vi.fn();
    render(<DataTable columns={columns} data={data} hasMore onLoadMore={handleLoadMore} />);

    expect(screen.getByText('Cargar más')).toBeInTheDocument();
  });

  it('hides "Cargar más" button when hasMore is false', () => {
    render(<DataTable columns={columns} data={data} hasMore={false} />);

    expect(screen.queryByText('Cargar más')).not.toBeInTheDocument();
  });

  it('shows result count when total is provided', () => {
    render(<DataTable columns={columns} data={data} total={10} />);

    expect(screen.getByText('2 de 10 resultados')).toBeInTheDocument();
  });

  it('renders sr-only caption for accessibility', () => {
    render(<DataTable columns={columns} data={data} caption="Tabla de usuarios" />);

    const caption = screen.getByText('Tabla de usuarios');
    expect(caption).toBeInTheDocument();
    expect(caption).toHaveClass('sr-only');
  });
});
