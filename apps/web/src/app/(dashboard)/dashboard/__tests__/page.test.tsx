import { UserRole } from '@epde/shared';
import { render, screen } from '@testing-library/react';

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('@/providers/server-user-provider', () => ({
  useServerUser: vi.fn(),
}));

vi.mock('@/app/(dashboard)/dashboard/admin-dashboard', () => ({
  AdminDashboard: () => <div data-testid="admin-dashboard">Admin Dashboard</div>,
}));

vi.mock('@/app/(dashboard)/dashboard/client-dashboard', () => ({
  ClientDashboard: ({ userName }: { userName: string }) => (
    <div data-testid="client-dashboard">Client Dashboard for {userName}</div>
  ),
}));

import { useServerUser } from '@/providers/server-user-provider';
import { useAuthStore } from '@/stores/auth-store';

import DashboardPage from '../page';

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders AdminDashboard for admin user', () => {
    vi.mocked(useServerUser).mockReturnValue({ role: UserRole.ADMIN, email: 'admin@epde.com' });
    vi.mocked(useAuthStore).mockImplementation((selector) =>
      selector({ user: { id: 'admin-1', role: UserRole.ADMIN, name: 'Admin' } } as never),
    );

    render(<DashboardPage />);
    expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
  });

  it('renders ClientDashboard for client user', () => {
    vi.mocked(useServerUser).mockReturnValue({ role: UserRole.CLIENT, email: 'juan@test.com' });
    vi.mocked(useAuthStore).mockImplementation((selector) =>
      selector({ user: { id: 'client-1', role: UserRole.CLIENT, name: 'Juan' } } as never),
    );

    render(<DashboardPage />);
    expect(screen.getByTestId('client-dashboard')).toBeInTheDocument();
    expect(screen.getByText('Client Dashboard for Juan')).toBeInTheDocument();
  });

  it('renders ClientDashboard with email fallback before checkAuth completes', () => {
    vi.mocked(useServerUser).mockReturnValue({ role: UserRole.CLIENT, email: 'maria@test.com' });
    vi.mocked(useAuthStore).mockImplementation((selector) => selector({ user: null } as never));

    render(<DashboardPage />);
    // Should render with email prefix as fallback name
    expect(screen.getByTestId('client-dashboard')).toBeInTheDocument();
    expect(screen.getByText('Client Dashboard for maria')).toBeInTheDocument();
  });
});
