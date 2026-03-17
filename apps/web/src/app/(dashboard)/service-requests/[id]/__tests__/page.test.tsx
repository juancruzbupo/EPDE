import { render, screen } from '@testing-library/react';
import { notFound } from 'next/navigation';
import { describe, expect, it, vi } from 'vitest';

import { serverFetch } from '@/lib/server-api';
import { getServerUser } from '@/lib/server-auth';

import Page from '../page';

vi.mock('next/navigation', () => ({
  usePathname: () => '/test',
  useSearchParams: () => new URLSearchParams(),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));
vi.mock('@/lib/server-api', () => ({ serverFetch: vi.fn() }));
vi.mock('@/lib/server-auth', () => ({ getServerUser: vi.fn() }));
vi.mock('../service-request-detail', () => ({
  ServiceRequestDetail: (props: Record<string, unknown>) => (
    <div data-testid="service-request-detail" data-props={JSON.stringify(props)} />
  ),
}));

const mockFetch = vi.mocked(serverFetch);
const mockGetUser = vi.mocked(getServerUser);
const mockNotFound = vi.mocked(notFound);

const fakeServiceRequest = { id: 'test-uuid', description: 'Humedad en pared' };

describe('ServiceRequestDetailPage', () => {
  it('renders ServiceRequestDetail with isAdmin=true for admin user', async () => {
    mockFetch.mockResolvedValue({ data: fakeServiceRequest });
    mockGetUser.mockResolvedValue({ role: 'ADMIN' });

    const jsx = await Page({ params: Promise.resolve({ id: 'test-uuid' }) });
    render(jsx);

    const el = screen.getByTestId('service-request-detail');
    const props = JSON.parse(el.dataset.props!);
    expect(props.isAdmin).toBe(true);
    expect(props.isClient).toBe(false);
  });

  it('renders ServiceRequestDetail with isClient=true for client user', async () => {
    mockFetch.mockResolvedValue({ data: fakeServiceRequest });
    mockGetUser.mockResolvedValue({ role: 'CLIENT' });

    const jsx = await Page({ params: Promise.resolve({ id: 'test-uuid' }) });
    render(jsx);

    const el = screen.getByTestId('service-request-detail');
    const props = JSON.parse(el.dataset.props!);
    expect(props.isAdmin).toBe(false);
    expect(props.isClient).toBe(true);
  });

  it('calls notFound() when data is null', async () => {
    mockFetch.mockResolvedValue(null);
    mockGetUser.mockResolvedValue({ role: 'ADMIN' });

    await expect(Page({ params: Promise.resolve({ id: 'test-uuid' }) })).rejects.toThrow(
      'NEXT_NOT_FOUND',
    );
    expect(mockNotFound).toHaveBeenCalled();
  });

  it('passes id from params to ServiceRequestDetail', async () => {
    mockFetch.mockResolvedValue({ data: fakeServiceRequest });
    mockGetUser.mockResolvedValue({ role: 'ADMIN' });

    const jsx = await Page({ params: Promise.resolve({ id: 'my-sr-id' }) });
    render(jsx);

    const el = screen.getByTestId('service-request-detail');
    const props = JSON.parse(el.dataset.props!);
    expect(props.id).toBe('my-sr-id');
    expect(mockFetch).toHaveBeenCalledWith('/service-requests/my-sr-id');
  });
});
