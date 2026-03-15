import { UserRole } from '@epde/shared';
import { render, screen } from '@testing-library/react';

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('@/app/(dashboard)/dashboard/admin-dashboard', () => ({
  AdminDashboard: () => <div data-testid="admin-dashboard">Admin Dashboard</div>,
}));

vi.mock('@/app/(dashboard)/dashboard/client-dashboard', () => ({
  ClientDashboard: ({ userName }: { userName: string }) => (
    <div data-testid="client-dashboard">Client Dashboard for {userName}</div>
  ),
}));

import { useAuthStore } from '@/stores/auth-store';

import DashboardPage from '../page';

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders AdminDashboard for admin user', () => {
    vi.mocked(useAuthStore).mockImplementation((selector) =>
      selector({ user: { id: 'admin-1', role: UserRole.ADMIN, name: 'Admin' } } as never),
    );

    render(<DashboardPage />);
    expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
  });

  it('renders ClientDashboard for client user', () => {
    vi.mocked(useAuthStore).mockImplementation((selector) =>
      selector({ user: { id: 'client-1', role: UserRole.CLIENT, name: 'Juan' } } as never),
    );

    render(<DashboardPage />);
    expect(screen.getByTestId('client-dashboard')).toBeInTheDocument();
    expect(screen.getByText('Client Dashboard for Juan')).toBeInTheDocument();
  });

  it('returns null when no user', () => {
    vi.mocked(useAuthStore).mockImplementation((selector) => selector({ user: null } as never));

    const { container } = render(<DashboardPage />);
    expect(container.innerHTML).toBe('');
  });
});
