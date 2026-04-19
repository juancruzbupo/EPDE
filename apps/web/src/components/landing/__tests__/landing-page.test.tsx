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

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: Record<string, unknown>) => (
    <img src={src as string} alt={(alt as string) ?? ''} {...props} />
  ),
}));

import { LandingPage } from '../landing-page';

describe('LandingPage smoke test', () => {
  beforeEach(() => {
    render(<LandingPage />);
  });

  it('renders hero with EPDE explanation', () => {
    expect(
      screen.getByText(/Diagnóstico profesional \+ plan de mantenimiento/i),
    ).toBeInTheDocument();
  });

  it('renders hero headline', () => {
    expect(screen.getByText(/Sabé en qué estado está tu casa/i)).toBeInTheDocument();
    expect(screen.getByText(/antes de que sea tarde/i)).toBeInTheDocument();
  });

  it('renders hero subtitle', () => {
    const matches = screen.getAllByText(/Una arquitecta recorre tu casa/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('renders social proof badge', () => {
    expect(screen.getByText(/primeras casas de Paraná/i)).toBeInTheDocument();
  });

  it('renders unified CTA label', () => {
    const ctas = screen.getAllByText(/Pedir diagnóstico/i);
    expect(ctas.length).toBeGreaterThanOrEqual(3);
  });

  it('uses WhatsApp as primary destination', () => {
    const waLinks = document.querySelectorAll('a[href*="wa.me"]');
    expect(waLinks.length).toBeGreaterThanOrEqual(2);
  });

  it('renders secondary CTA', () => {
    expect(screen.getByText(/Ver cómo funciona/i)).toBeInTheDocument();
  });

  it('renders how it works with 3 steps', () => {
    expect(screen.getByText(/Visitamos tu casa/i)).toBeInTheDocument();
    expect(screen.getByText(/Analizamos el estado real/i)).toBeInTheDocument();
    const matches = screen.getAllByText(/Organizamos todo el mantenimiento/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('renders pricing with benefits', () => {
    const matches = screen.getAllByText(/Todo lo que incluye/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('renders tier-based pricing', () => {
    expect(screen.getByText(/Plan Chico/i)).toBeInTheDocument();
    expect(screen.getByText(/Plan Estándar/i)).toBeInTheDocument();
    expect(screen.getByText(/Plan Amplio/i)).toBeInTheDocument();
  });

  it('renders launch urgency banner', () => {
    expect(screen.getByText(/primeros 20 clientes/i)).toBeInTheDocument();
  });

  it('renders consequence section', () => {
    expect(screen.getByText(/Detectar tarde siempre sale más caro/i)).toBeInTheDocument();
  });

  it('renders credentials section', () => {
    const matches = screen.getAllByText(/Arquitecta matriculada/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('renders differentiation section', () => {
    expect(screen.getByText(/Forma tradicional vs\. EPDE/i)).toBeInTheDocument();
  });

  it('renders final CTA', () => {
    expect(screen.getByText(/Tu casa necesita atención profesional/i)).toBeInTheDocument();
  });

  it('renders primary cta across header/hero/final', () => {
    const ctas = screen.getAllByText(/Pedir diagnóstico/i);
    expect(ctas.length).toBeGreaterThanOrEqual(3);
  });

  it('renders cost disclaimer', () => {
    const disclaimers = screen.getAllByText(/Costos estimados a partir de valores promedio/i);
    expect(disclaimers.length).toBeGreaterThanOrEqual(1);
  });
});
