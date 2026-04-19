import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('next/link', () => ({
  default: ({ children, ...props }: { children: React.ReactNode; href: string }) => (
    <a {...props}>{children}</a>
  ),
}));

const mockLogin = vi.fn();
vi.mock('@/stores/auth-store', () => ({
  useAuthStore: (selector: (s: { login: typeof mockLogin }) => unknown) =>
    selector({ login: mockLogin }),
}));

// Mock window.location.href (used for post-login redirect)
const locationHrefSpy = vi.spyOn(window, 'location', 'get');
const mockLocation = { ...window.location, href: '' };
locationHrefSpy.mockReturnValue(mockLocation as Location);

import LoginPage from '@/app/(auth)/login/page';

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = '';
  });

  it('renders login form with email, password inputs and submit button', () => {
    render(<LoginPage />);

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeInTheDocument();
  });

  it('shows validation errors for invalid fields on submit attempt', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    // HTML `required` blocks submit on empty — type invalid values so Zod runs.
    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.type(screen.getByLabelText('Contraseña'), 'short');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    await waitFor(() => {
      expect(screen.getByText('Email inválido')).toBeInTheDocument();
    });
    expect(screen.getByText('La contraseña debe tener al menos 8 caracteres')).toBeInTheDocument();

    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('calls login and redirects to /dashboard on success', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText('Email'), 'admin@epde.com');
    await user.type(screen.getByLabelText('Contraseña'), 'Password1');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin@epde.com', 'Password1');
    });
    expect(mockLocation.href).toBe('/dashboard');
  });

  it('shows error message on login failure', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Unauthorized'));
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText('Email'), 'admin@epde.com');
    await user.type(screen.getByLabelText('Contraseña'), 'WrongPass1');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    await waitFor(() => {
      expect(
        screen.getByText('Credenciales inválidas. Verificá tu email y contraseña.'),
      ).toBeInTheDocument();
    });
    expect(mockLocation.href).not.toBe('/dashboard');
  });

  it('disables button and shows loading text during submission', async () => {
    // Login never resolves — simulates in-flight request
    mockLogin.mockReturnValueOnce(new Promise<void>(() => {}));
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText('Email'), 'admin@epde.com');
    await user.type(screen.getByLabelText('Contraseña'), 'Password1');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Ingresando...' })).toBeDisabled();
    });
  });
});
