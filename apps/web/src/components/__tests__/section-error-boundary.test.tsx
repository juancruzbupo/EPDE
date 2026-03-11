import { render, screen } from '@testing-library/react';

import { SectionErrorBoundary } from '../section-error-boundary';

function ThrowingChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('Test error');
  return <p>Child content</p>;
}

describe('SectionErrorBoundary', () => {
  // Suppress React error boundary console.error in tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = (...args: unknown[]) => {
      if (typeof args[0] === 'string' && args[0].includes('Error boundaries')) return;
      if (typeof args[0] === 'string' && args[0].includes('The above error')) return;
      originalError.call(console, ...args);
    };
  });
  afterAll(() => {
    console.error = originalError;
  });

  it('renders children when no error', () => {
    render(
      <SectionErrorBoundary>
        <ThrowingChild shouldThrow={false} />
      </SectionErrorBoundary>,
    );
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('renders fallback UI when child throws', () => {
    render(
      <SectionErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </SectionErrorBoundary>,
    );
    expect(screen.getByText('Algo salió mal')).toBeInTheDocument();
    expect(screen.getByText('No se pudo cargar esta sección.')).toBeInTheDocument();
  });

  it('renders custom fallback message', () => {
    render(
      <SectionErrorBoundary fallbackMessage="Error personalizado">
        <ThrowingChild shouldThrow={true} />
      </SectionErrorBoundary>,
    );
    expect(screen.getByText('Error personalizado')).toBeInTheDocument();
  });

  it('shows Reintentar button in error state', () => {
    render(
      <SectionErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </SectionErrorBoundary>,
    );

    expect(screen.getByText('Reintentar')).toBeInTheDocument();
  });
});
