import { render, screen } from '@testing-library/react';
import { notFound } from 'next/navigation';
import { describe, expect, it, vi } from 'vitest';

import { serverFetch } from '@/lib/server-api';

import Page from '../page';

vi.mock('next/navigation', () => ({
  usePathname: () => '/test',
  useSearchParams: () => new URLSearchParams(),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));
vi.mock('@/lib/server-api', () => ({ serverFetch: vi.fn() }));
vi.mock('@/lib/server-auth', () => ({
  getServerUser: vi
    .fn()
    .mockResolvedValue({ id: 'admin-1', role: 'ADMIN', email: 'admin@test.com' }),
}));
vi.mock('../client-detail', () => ({
  ClientDetail: (props: Record<string, unknown>) => (
    <div data-testid="client-detail" data-props={JSON.stringify(props)} />
  ),
}));

const mockFetch = vi.mocked(serverFetch);
const mockNotFound = vi.mocked(notFound);

const fakeClient = { id: 'test-uuid', name: 'Juan' };

describe('ClientDetailPage', () => {
  it('renders ClientDetail with correct initialData', async () => {
    mockFetch.mockResolvedValue({ data: fakeClient });

    const jsx = await Page({ params: Promise.resolve({ id: 'test-uuid' }) });
    render(jsx);

    const el = screen.getByTestId('client-detail');
    const props = JSON.parse(el.dataset.props!);
    expect(props.initialData).toEqual(fakeClient);
  });

  it('passes id from params to ClientDetail', async () => {
    mockFetch.mockResolvedValue({ data: fakeClient });

    const jsx = await Page({ params: Promise.resolve({ id: 'my-client-id' }) });
    render(jsx);

    const el = screen.getByTestId('client-detail');
    const props = JSON.parse(el.dataset.props!);
    expect(props.id).toBe('my-client-id');
    expect(mockFetch).toHaveBeenCalledWith('/clients/my-client-id');
  });

  it('calls notFound() when data is null', async () => {
    mockFetch.mockResolvedValue(null);

    await expect(Page({ params: Promise.resolve({ id: 'test-uuid' }) })).rejects.toThrow(
      'NEXT_NOT_FOUND',
    );
    expect(mockNotFound).toHaveBeenCalled();
  });

  it('calls notFound() when data.data is undefined', async () => {
    mockFetch.mockResolvedValue({ data: undefined });

    await expect(Page({ params: Promise.resolve({ id: 'test-uuid' }) })).rejects.toThrow(
      'NEXT_NOT_FOUND',
    );
    expect(mockNotFound).toHaveBeenCalled();
  });
});
