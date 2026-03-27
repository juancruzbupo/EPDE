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

  it('renders hero micro-hook', () => {
    expect(screen.getByText(/casas tiene problemas que no se ven/i)).toBeInTheDocument();
  });

  it('renders hero headline', () => {
    expect(screen.getByText(/perdiendo plata/i)).toBeInTheDocument();
    expect(screen.getByText(/en tu casa sin darte cuenta/i)).toBeInTheDocument();
  });

  it('renders hero subtitle', () => {
    expect(
      screen.getByText(/Detectamos problemas antes de que se vuelvan costosos/i),
    ).toBeInTheDocument();
  });

  it('renders social proof badge', () => {
    expect(screen.getByText(/primeras viviendas en Paraná/i)).toBeInTheDocument();
  });

  it('renders unified CTA label', () => {
    const ctas = screen.getAllByText(/Quiero saber cómo está mi casa/i);
    expect(ctas.length).toBeGreaterThanOrEqual(3);
  });

  it('renders WhatsApp links in hero and pricing', () => {
    const waLinks = screen.getAllByText(/Hablar por WhatsApp/i);
    expect(waLinks.length).toBeGreaterThanOrEqual(2);
  });

  it('renders secondary CTA', () => {
    expect(screen.getByText(/Ver cómo funciona/i)).toBeInTheDocument();
  });

  it('renders problem section', () => {
    expect(screen.getByText(/Tu casa se deteriora sin que lo notes/i)).toBeInTheDocument();
  });

  it('renders consequence section with inaction block', () => {
    expect(screen.getByText(/filtración no detectada/i)).toBeInTheDocument();
    expect(screen.getByText(/Si no hacés mantenimiento preventivo/i)).toBeInTheDocument();
  });

  it('renders solution section with psychological reinforcement', () => {
    expect(screen.getByText(/diagnóstico \+ sistema \+ prevención/i)).toBeInTheDocument();
    expect(screen.getByText(/No es una reparación/i)).toBeInTheDocument();
  });

  it('renders ISV block with urgency line', () => {
    expect(screen.getByText(/Estado actual: Regular/i)).toBeInTheDocument();
    expect(screen.getByText(/puede derivar en reparaciones costosas/i)).toBeInTheDocument();
    expect(screen.getByText(/ya tiene problemas en desarrollo/i)).toBeInTheDocument();
  });

  it('renders how it works with 3 steps', () => {
    expect(screen.getByText(/Relevamos tu vivienda/i)).toBeInTheDocument();
    expect(screen.getByText(/Analizamos el estado real/i)).toBeInTheDocument();
    const matches = screen.getAllByText(/Organizamos todo el mantenimiento/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('renders pricing with emotional close', () => {
    expect(screen.getByText('$35.000')).toBeInTheDocument();
    expect(screen.getByText(/decisión simple hoy/i)).toBeInTheDocument();
  });

  it('renders 6-month access', () => {
    const matches = screen.getAllByText(/acceso al sistema EPDE por 6 meses/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('renders subscription microcopy', () => {
    expect(screen.getByText(/continuar con el monitoreo mensual/i)).toBeInTheDocument();
  });

  it('renders interventions note', () => {
    const matches = screen.getAllByText(/intervenciones específicas se cotizan aparte/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('renders urgency with limited capacity', () => {
    expect(screen.getByText(/número limitado de propiedades/i)).toBeInTheDocument();
  });

  it('renders credentials section', () => {
    expect(screen.getByText(/Arquitecta matriculada/i)).toBeInTheDocument();
  });

  it('renders final CTA with loss-aversion', () => {
    expect(screen.getByText(/No esperes a que un problema te salga caro/i)).toBeInTheDocument();
  });

  it('renders WhatsApp floating button', () => {
    expect(screen.getByLabelText(/Hablar por WhatsApp/i)).toBeInTheDocument();
  });

  it('renders cost disclaimer', () => {
    const disclaimers = screen.getAllByText(/Costos estimados en base a valores promedio/i);
    expect(disclaimers.length).toBeGreaterThanOrEqual(1);
  });
});
