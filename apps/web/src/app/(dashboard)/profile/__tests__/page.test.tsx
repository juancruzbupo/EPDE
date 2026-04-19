import { UserRole } from '@epde/shared';
import { render, screen } from '@testing-library/react';

const mockStore = {
  user: {
    id: 'user-1',
    name: 'Juan García',
    email: 'juan@epde.ar',
    phone: '+5491112345678',
    role: UserRole.CLIENT,
    createdAt: '2025-06-15T00:00:00.000Z',
    updatedAt: '2025-06-15T00:00:00.000Z',
  },
  checkAuth: vi.fn(),
};

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: vi.fn((selector?: (s: typeof mockStore) => unknown) =>
    selector ? selector(mockStore) : mockStore,
  ),
}));

vi.mock('@/lib/auth', () => ({
  updateProfile: vi.fn(),
  changePassword: vi.fn(),
}));

vi.mock('../referrals-section', () => ({
  ReferralsSection: () => null,
}));

vi.mock('../milestones-section', () => ({
  MilestonesSection: () => null,
}));

vi.mock('../subscription-info', () => ({
  SubscriptionInfo: () => null,
}));

vi.mock('@/stores/ui-preferences-store', () => ({
  useUiPreferencesStore: vi.fn((selector: (s: unknown) => unknown) =>
    selector({
      fontScale: 'base',
      setFontScale: vi.fn(),
      motivationStyle: 'rewards',
      setMotivationStyle: vi.fn(),
      hiddenNotificationTypes: [],
      toggleHiddenNotificationType: vi.fn(),
    }),
  ),
  FONT_SCALE_LABELS: { sm: 'Pequeño', base: 'Normal', lg: 'Grande', xl: 'Extra grande' },
}));

vi.mock('@/components/ui/page-transition', () => ({
  PageTransition: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

vi.mock('@/components/page-header', () => ({
  PageHeader: ({ title, description }: { title: string; description?: string }) => (
    <div>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
  ),
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

import ProfilePage from '../page';

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders user name and email', () => {
    render(<ProfilePage />);
    expect(screen.getAllByText('Juan García').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('juan@epde.ar').length).toBeGreaterThanOrEqual(1);
  });

  it('renders user phone and role', () => {
    render(<ProfilePage />);
    expect(screen.getAllByText('+5491112345678').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Cliente').length).toBeGreaterThanOrEqual(1);
  });

  it('renders edit profile form', () => {
    render(<ProfilePage />);
    expect(screen.getAllByText('Editar perfil').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Guardar cambios').length).toBeGreaterThanOrEqual(1);
  });

  it('renders change password section', () => {
    render(<ProfilePage />);
    expect(screen.getByRole('heading', { name: 'Cambiar contraseña' })).toBeInTheDocument();
  });

  it('shows password requirements', () => {
    render(<ProfilePage />);
    expect(screen.getAllByText('Mínimo 8 caracteres').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Al menos una mayúscula').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Al menos un número').length).toBeGreaterThanOrEqual(1);
  });
});
