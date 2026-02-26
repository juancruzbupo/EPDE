import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar } from '../layout/sidebar';
import { UserRole } from '@epde/shared';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

// Mock zustand store
const mockLogout = vi.fn().mockResolvedValue(undefined);
let mockUser: { name: string; email: string; role: string } | null = null;

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: () => ({
    user: mockUser,
    logout: mockLogout,
  }),
}));

function renderSidebar() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <Sidebar />
    </QueryClientProvider>,
  );
}

describe('Sidebar', () => {
  beforeEach(() => {
    mockUser = { name: 'Juan Test', email: 'juan@test.com', role: UserRole.CLIENT };
    mockLogout.mockClear();
  });

  it('renders common navigation items', () => {
    renderSidebar();

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Propiedades')).toBeInTheDocument();
    expect(screen.getByText('Presupuestos')).toBeInTheDocument();
    expect(screen.getByText('Servicios')).toBeInTheDocument();
  });

  it('hides admin-only items for CLIENT role', () => {
    renderSidebar();

    expect(screen.queryByText('Clientes')).not.toBeInTheDocument();
    expect(screen.queryByText('Categorías')).not.toBeInTheDocument();
  });

  it('shows admin-only items for ADMIN role', () => {
    mockUser = { name: 'Admin', email: 'admin@test.com', role: UserRole.ADMIN };
    renderSidebar();

    expect(screen.getByText('Clientes')).toBeInTheDocument();
    expect(screen.getByText('Categorías')).toBeInTheDocument();
  });

  it('displays user name and email', () => {
    renderSidebar();

    expect(screen.getByText('Juan Test')).toBeInTheDocument();
    expect(screen.getByText('juan@test.com')).toBeInTheDocument();
  });

  it('calls logout and clears cache on click', async () => {
    const user = userEvent.setup();
    renderSidebar();

    await user.click(screen.getByText('Cerrar sesión'));

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
