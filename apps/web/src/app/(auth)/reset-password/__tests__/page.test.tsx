import { render, screen } from '@testing-library/react';

const mockSearchParams = new URLSearchParams('token=test-token-abc');

vi.mock('next/navigation', () => ({
  usePathname: () => '/test',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock('@/lib/auth', () => ({
  resetPassword: vi.fn(),
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  CardHeader: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  CardContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  CardTitle: ({ children }: React.PropsWithChildren) => <h2>{children}</h2>,
  CardDescription: ({ children }: React.PropsWithChildren) => <p>{children}</p>,
}));

vi.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: React.PropsWithChildren<{ htmlFor?: string }>) => (
    <label {...props}>{children}</label>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    ...props
  }: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => (
    <button {...props}>{children}</button>
  ),
}));

import ResetPasswordPage from '../page';

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders password fields when token is present', () => {
    render(<ResetPasswordPage />);
    expect(screen.getByRole('heading', { name: /restablecer/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Nueva Contraseña')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirmar Contraseña')).toBeInTheDocument();
  });

  it('shows password requirements', () => {
    render(<ResetPasswordPage />);
    expect(screen.getByText('Mínimo 8 caracteres')).toBeInTheDocument();
    expect(screen.getByText('Al menos una mayúscula')).toBeInTheDocument();
    expect(screen.getByText('Al menos una minúscula')).toBeInTheDocument();
    expect(screen.getByText('Al menos un número')).toBeInTheDocument();
  });

  it('renders submit button', () => {
    render(<ResetPasswordPage />);
    expect(screen.getByRole('button', { name: /restablecer/i })).toBeInTheDocument();
  });

  it('shows error when token is missing', () => {
    mockSearchParams.delete('token');

    render(<ResetPasswordPage />);
    expect(
      screen.getByText('Token no proporcionado. Verificá el enlace de recuperación.'),
    ).toBeInTheDocument();

    // Restore for other tests
    mockSearchParams.set('token', 'test-token-abc');
  });
});
