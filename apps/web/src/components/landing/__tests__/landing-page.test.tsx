import { render, screen } from '@testing-library/react';

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: (_target, prop) => {
        const Component = (props: React.PropsWithChildren<Record<string, unknown>>) => {
          const { children, ...rest } = props;
          const Tag = typeof prop === 'string' ? prop : 'div';
          return <Tag {...rest}>{children}</Tag>;
        };
        Component.displayName = `motion.${String(prop)}`;
        return Component;
      },
    },
  ),
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

vi.mock('@/lib/motion', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useMotionPreference: () => ({ shouldAnimate: false }),
  };
});

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: () => ({ isAuthenticated: false, isLoading: false }),
}));

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => <img {...props} />,
}));

import { LandingPage } from '../landing-page';

describe('LandingPage smoke test', () => {
  beforeEach(() => {
    render(<LandingPage />);
  });

  it('renders hero headline', () => {
    expect(screen.getByText(/cómo está tu casa/i)).toBeInTheDocument();
  });

  it('renders hero subtitle', () => {
    expect(screen.getByText(/EPDE diagnostica tu vivienda/i)).toBeInTheDocument();
  });

  it('renders primary CTA in hero', () => {
    const ctas = screen.getAllByText(/Solicitar diagnóstico/i);
    expect(ctas.length).toBeGreaterThanOrEqual(1);
  });

  it('renders secondary CTA', () => {
    expect(screen.getByText(/Ver cómo funciona/i)).toBeInTheDocument();
  });

  it('renders market problem section', () => {
    expect(screen.getByText(/El problema que nadie está resolviendo/i)).toBeInTheDocument();
  });

  it('renders consequence section', () => {
    expect(screen.getByText(/Detectar tarde siempre sale más caro/i)).toBeInTheDocument();
  });

  it('renders solution section', () => {
    expect(screen.getByText(/diagnóstico \+ sistema \+ prevención/i)).toBeInTheDocument();
  });

  it('renders ISV block', () => {
    const matches = screen.getAllByText(/Índice de Salud/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/un número claro sobre el estado/i)).toBeInTheDocument();
  });

  it('renders how it works with 3 steps', () => {
    expect(screen.getByText(/Relevamos tu vivienda/i)).toBeInTheDocument();
    expect(screen.getByText(/Analizamos el estado real/i)).toBeInTheDocument();
    expect(screen.getByText(/Organizamos todo el mantenimiento/i)).toBeInTheDocument();
  });

  it('renders launch price', () => {
    expect(screen.getByText('$35.000')).toBeInTheDocument();
  });

  it('renders 60-day access in pricing', () => {
    const matches = screen.getAllByText(/acceso al sistema EPDE por 60 días/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('renders subscription microcopy', () => {
    expect(screen.getByText(/continuar con el monitoreo mensual/i)).toBeInTheDocument();
  });

  it('renders interventions note', () => {
    const matches = screen.getAllByText(/intervenciones específicas se cotizan aparte/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('renders credentials section', () => {
    expect(screen.getByText(/Arquitecta matriculada/i)).toBeInTheDocument();
  });

  it('renders urgency section', () => {
    expect(screen.getByText(/primeras viviendas de Paraná/i)).toBeInTheDocument();
  });

  it('renders final CTA', () => {
    expect(screen.getByText(/Tu casa necesita mantenimiento profesional/i)).toBeInTheDocument();
  });

  it('renders cost disclaimer', () => {
    const disclaimers = screen.getAllByText(/Costos estimados en base a valores promedio/i);
    expect(disclaimers.length).toBeGreaterThanOrEqual(1);
  });
});
