import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/lib/auth', () => ({
  forgotPassword: vi.fn(),
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

import { forgotPassword } from '@/lib/auth';

import ForgotPasswordPage from '../page';

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email input and submit button', () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByText('Recuperar Contraseña')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByText('Enviar instrucciones')).toBeInTheDocument();
  });

  it('renders back to login link', () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByText('Volver al inicio de sesión')).toBeInTheDocument();
  });

  it('shows success message after submit', async () => {
    vi.mocked(forgotPassword).mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<ForgotPasswordPage />);

    await user.type(screen.getByLabelText('Email'), 'test@epde.ar');
    await user.click(screen.getByText('Enviar instrucciones'));

    await waitFor(() => {
      expect(
        screen.getByText(
          'Si el email está registrado, recibirás instrucciones para restablecer tu contraseña.',
        ),
      ).toBeInTheDocument();
    });

    expect(forgotPassword).toHaveBeenCalledWith('test@epde.ar');
  });
});
