import { render, screen } from '@testing-library/react';
import { Home } from 'lucide-react';
import { describe, expect, it } from 'vitest';

import { StatCard } from '../stat-card';

describe('StatCard', () => {
  it('renders title and value', () => {
    render(<StatCard title="Propiedades" value={12} icon={Home} />);

    expect(screen.getByText('Propiedades')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('renders icon', () => {
    const { container } = render(<StatCard title="Propiedades" value={5} icon={Home} />);

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<StatCard title="Propiedades" value={5} icon={Home} description="+2 esta semana" />);

    expect(screen.getByText('+2 esta semana')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    const { container } = render(<StatCard title="Propiedades" value={5} icon={Home} />);

    const paragraphs = container.querySelectorAll('p');
    const descriptionP = Array.from(paragraphs).find((p) => p.classList.contains('text-xs'));
    expect(descriptionP).toBeUndefined();
  });

  it('applies custom className', () => {
    const { container } = render(
      <StatCard title="Propiedades" value={5} icon={Home} className="bg-red-500" />,
    );

    const card = container.firstChild;
    expect(card).toHaveClass('bg-red-500');
  });
});
