import { render, screen } from '@testing-library/react';
import { notFound } from 'next/navigation';
import { describe, expect, it, vi } from 'vitest';

import { serverFetch } from '@/lib/server-api';
import { getServerUser } from '@/lib/server-auth';

import Page from '../page';

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));
vi.mock('@/lib/server-api', () => ({ serverFetch: vi.fn() }));
vi.mock('@/lib/server-auth', () => ({ getServerUser: vi.fn() }));
vi.mock('../property-detail', () => ({
  PropertyDetail: (props: Record<string, unknown>) => (
    <div data-testid="property-detail" data-props={JSON.stringify(props)} />
  ),
}));

const mockFetch = vi.mocked(serverFetch);
const mockGetUser = vi.mocked(getServerUser);
const mockNotFound = vi.mocked(notFound);

const fakeProperty = { id: 'test-uuid', address: 'Av. Corrientes 1234' };

describe('PropertyDetailPage', () => {
  it('renders PropertyDetail with isAdmin=true for admin user', async () => {
    mockFetch.mockResolvedValue({ data: fakeProperty });
    mockGetUser.mockResolvedValue({ role: 'ADMIN' });

    const jsx = await Page({ params: Promise.resolve({ id: 'test-uuid' }) });
    render(jsx);

    const el = screen.getByTestId('property-detail');
    const props = JSON.parse(el.dataset.props!);
    expect(props.isAdmin).toBe(true);
  });

  it('renders PropertyDetail with isAdmin=false for client user', async () => {
    mockFetch.mockResolvedValue({ data: fakeProperty });
    mockGetUser.mockResolvedValue({ role: 'CLIENT' });

    const jsx = await Page({ params: Promise.resolve({ id: 'test-uuid' }) });
    render(jsx);

    const el = screen.getByTestId('property-detail');
    const props = JSON.parse(el.dataset.props!);
    expect(props.isAdmin).toBe(false);
  });

  it('calls notFound() when data is null', async () => {
    mockFetch.mockResolvedValue(null);
    mockGetUser.mockResolvedValue({ role: 'ADMIN' });

    await expect(Page({ params: Promise.resolve({ id: 'test-uuid' }) })).rejects.toThrow(
      'NEXT_NOT_FOUND',
    );
    expect(mockNotFound).toHaveBeenCalled();
  });

  it('passes id from params to PropertyDetail', async () => {
    mockFetch.mockResolvedValue({ data: fakeProperty });
    mockGetUser.mockResolvedValue({ role: 'ADMIN' });

    const jsx = await Page({ params: Promise.resolve({ id: 'my-prop-id' }) });
    render(jsx);

    const el = screen.getByTestId('property-detail');
    const props = JSON.parse(el.dataset.props!);
    expect(props.id).toBe('my-prop-id');
    expect(mockFetch).toHaveBeenCalledWith('/properties/my-prop-id');
  });
});
