import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PageHeader } from '../page-header';

describe('PageHeader', () => {
  it('renders title as h1', () => {
    render(<PageHeader title="Propiedades" />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Propiedades');
  });

  it('renders description when provided', () => {
    render(<PageHeader title="Propiedades" description="Listado de propiedades" />);

    expect(screen.getByText('Listado de propiedades')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    const { container } = render(<PageHeader title="Propiedades" />);

    expect(container.querySelector('p')).not.toBeInTheDocument();
  });

  it('renders action slot', () => {
    render(<PageHeader title="Propiedades" action={<button>Nueva propiedad</button>} />);

    expect(screen.getByText('Nueva propiedad')).toBeInTheDocument();
  });

  it('does not render action wrapper when not provided', () => {
    const { container } = render(<PageHeader title="Propiedades" />);

    const headingParent = container.firstChild!;
    expect(headingParent.childNodes).toHaveLength(1);
  });
});
