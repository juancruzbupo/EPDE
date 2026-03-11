import { render, screen } from '@testing-library/react';

vi.mock('@/hooks/use-notifications', () => ({
  useUnreadCount: vi.fn(),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
    // When asChild is used, just render children directly
    if (props.asChild) return <>{children}</>;
    return (
      <button {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}>{children}</button>
    );
  },
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: React.PropsWithChildren<{ href: string }>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { useUnreadCount } from '@/hooks/use-notifications';

import { NotificationBell } from '../notification-bell';

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders bell icon', () => {
    vi.mocked(useUnreadCount).mockReturnValue({ data: 0 } as ReturnType<typeof useUnreadCount>);
    const { container } = render(<NotificationBell />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('shows badge with unread count when count > 0', () => {
    vi.mocked(useUnreadCount).mockReturnValue({ data: 5 } as ReturnType<typeof useUnreadCount>);
    render(<NotificationBell />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('shows 99+ when count exceeds 99', () => {
    vi.mocked(useUnreadCount).mockReturnValue({ data: 150 } as ReturnType<typeof useUnreadCount>);
    render(<NotificationBell />);
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('does not show badge when count is 0', () => {
    vi.mocked(useUnreadCount).mockReturnValue({ data: 0 } as ReturnType<typeof useUnreadCount>);
    render(<NotificationBell />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('links to /notifications', () => {
    vi.mocked(useUnreadCount).mockReturnValue({ data: 0 } as ReturnType<typeof useUnreadCount>);
    render(<NotificationBell />);
    const link = screen.getByRole('link', { name: 'Notificaciones' });
    expect(link).toHaveAttribute('href', '/notifications');
  });
});
