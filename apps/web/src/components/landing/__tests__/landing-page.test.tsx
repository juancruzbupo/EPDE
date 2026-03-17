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
    expect(screen.getByText(/problemas costosos en tu casa/i)).toBeInTheDocument();
  });

  it('renders emotional impact line', () => {
    expect(
      screen.getByText(/Un problema chico hoy puede costarte millones mañana/i),
    ).toBeInTheDocument();
  });

  it('renders primary CTA in hero', () => {
    const ctas = screen.getAllByText(/Quiero saber el estado de mi casa/i);
    expect(ctas.length).toBeGreaterThanOrEqual(1);
  });

  it('renders secondary CTA', () => {
    const secondary = screen.getAllByText(/Consultar por WhatsApp/i);
    expect(secondary.length).toBeGreaterThanOrEqual(1);
  });

  it('renders immediate promise section', () => {
    expect(screen.getByText(/En una sola visita vas a saber/i)).toBeInTheDocument();
    expect(screen.getByText(/Qué problemas tiene tu casa/i)).toBeInTheDocument();
  });

  it('renders urgency message', () => {
    const urgency = screen.getAllByText(/Solo 10 diagnósticos disponibles/i);
    expect(urgency.length).toBeGreaterThanOrEqual(1);
  });

  it('renders price tiers', () => {
    expect(screen.getByText('desde $150.000')).toBeInTheDocument();
    expect(screen.getByText('desde $250.000')).toBeInTheDocument();
    expect(screen.getByText('presupuesto personalizado')).toBeInTheDocument();
  });

  it('renders cost disclaimer', () => {
    const disclaimers = screen.getAllByText(/Costos estimados en base a valores promedio/i);
    expect(disclaimers.length).toBeGreaterThanOrEqual(1);
  });

  it('renders credentials section', () => {
    expect(screen.getByText(/Arquitecta matriculada/i)).toBeInTheDocument();
  });

  it('renders decision-forcing copy', () => {
    expect(screen.getByText(/Cuanto antes lo hagas, más problemas evitás/i)).toBeInTheDocument();
  });
});
