import { render, screen } from '@testing-library/react';

import { EmptyState } from '../empty-state';

describe('EmptyState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title and description', () => {
    render(<EmptyState title="Sin resultados" message="No hay datos para mostrar" />);
    expect(screen.getByText('Sin resultados')).toBeInTheDocument();
    expect(screen.getByText('No hay datos para mostrar')).toBeInTheDocument();
  });

  it('renders default icon when none provided', () => {
    const { container } = render(<EmptyState title="Vacío" message="Nada aquí" />);
    // Default Inbox icon renders as an SVG
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<EmptyState title="Vacío" message="Nada" className="py-12" />);
    expect(container.firstChild).toHaveClass('py-12');
  });
});
