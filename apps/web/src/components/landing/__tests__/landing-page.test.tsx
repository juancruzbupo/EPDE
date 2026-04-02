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
    const matches = screen.getAllByText(/arquitecta inspecciona tu vivienda/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('renders social proof badge', () => {
    expect(screen.getByText(/primeras viviendas en Paraná/i)).toBeInTheDocument();
  });

  it('renders unified CTA label', () => {
    const ctas = screen.getAllByText(/Pedir diagnóstico/i);
    expect(ctas.length).toBeGreaterThanOrEqual(3);
  });

  it('renders WhatsApp links', () => {
    const waLinks = screen.getAllByText(/Hablar por WhatsApp/i);
    expect(waLinks.length).toBeGreaterThanOrEqual(2);
  });

  it('renders secondary CTA', () => {
    expect(screen.getByText(/Ver cómo funciona/i)).toBeInTheDocument();
  });

  it('renders how it works with 3 steps', () => {
    expect(screen.getByText(/Relevamos tu vivienda/i)).toBeInTheDocument();
    expect(screen.getByText(/Analizamos el estado real/i)).toBeInTheDocument();
    const matches = screen.getAllByText(/Organizamos todo el mantenimiento/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('renders pricing with benefits', () => {
    expect(screen.getByText('$35.000')).toBeInTheDocument();
    expect(screen.getByText(/Tu diagnóstico incluye/i)).toBeInTheDocument();
  });

  it('renders consequence section', () => {
    expect(screen.getByText(/Detectar tarde siempre sale más caro/i)).toBeInTheDocument();
  });

  it('renders credentials section', () => {
    expect(screen.getByText(/Arquitecta matriculada/i)).toBeInTheDocument();
  });

  it('renders differentiation section', () => {
    expect(screen.getByText(/Forma tradicional vs\. EPDE/i)).toBeInTheDocument();
  });

  it('renders final CTA', () => {
    expect(screen.getByText(/Tu casa necesita atención profesional/i)).toBeInTheDocument();
  });

  it('renders WhatsApp floating button', () => {
    expect(screen.getByLabelText(/Hablar por WhatsApp/i)).toBeInTheDocument();
  });

  it('renders cost disclaimer', () => {
    const disclaimers = screen.getAllByText(/Costos estimados en base a valores promedio/i);
    expect(disclaimers.length).toBeGreaterThanOrEqual(1);
  });
});
