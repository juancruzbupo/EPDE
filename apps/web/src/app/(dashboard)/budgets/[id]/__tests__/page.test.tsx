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
vi.mock('../budget-detail', () => ({
  BudgetDetail: (props: Record<string, unknown>) => (
    <div data-testid="budget-detail" data-props={JSON.stringify(props)} />
  ),
}));

const mockFetch = vi.mocked(serverFetch);
const mockGetUser = vi.mocked(getServerUser);
const mockNotFound = vi.mocked(notFound);

const fakeBudget = { id: 'test-uuid', amount: 1000 };

describe('BudgetDetailPage', () => {
  it('renders BudgetDetail with isAdmin=true for admin user', async () => {
    mockFetch.mockResolvedValue({ data: fakeBudget });
    mockGetUser.mockResolvedValue({ role: 'ADMIN' });

    const jsx = await Page({ params: Promise.resolve({ id: 'test-uuid' }) });
    render(jsx);

    const el = screen.getByTestId('budget-detail');
    const props = JSON.parse(el.dataset.props!);
    expect(props.isAdmin).toBe(true);
    expect(props.isClient).toBe(false);
  });

  it('renders BudgetDetail with isClient=true for client user', async () => {
    mockFetch.mockResolvedValue({ data: fakeBudget });
    mockGetUser.mockResolvedValue({ role: 'CLIENT' });

    const jsx = await Page({ params: Promise.resolve({ id: 'test-uuid' }) });
    render(jsx);

    const el = screen.getByTestId('budget-detail');
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

  it('passes id from params to BudgetDetail', async () => {
    mockFetch.mockResolvedValue({ data: fakeBudget });
    mockGetUser.mockResolvedValue({ role: 'ADMIN' });

    const jsx = await Page({ params: Promise.resolve({ id: 'my-budget-id' }) });
    render(jsx);

    const el = screen.getByTestId('budget-detail');
    const props = JSON.parse(el.dataset.props!);
    expect(props.id).toBe('my-budget-id');
    expect(mockFetch).toHaveBeenCalledWith('/budgets/my-budget-id');
  });
});
