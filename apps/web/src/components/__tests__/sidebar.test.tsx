import { UserRole } from '@epde/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';

import { Sidebar } from '../layout/sidebar';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

// Mock zustand store — sidebar uses selector pattern: useAuthStore((s) => s.user)
let mockUser: { name: string; email: string; role: string } | null = null;

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({ user: mockUser }),
  ),
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

  it('renders EPDE branding', () => {
    renderSidebar();

    expect(screen.getByText('EPDE')).toBeInTheDocument();
  });
});
