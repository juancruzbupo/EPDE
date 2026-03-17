import { act, render, screen } from '@testing-library/react';
import { Suspense } from 'react';

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({ user: { id: 'u1', role: 'ADMIN' } }),
  ),
}));

vi.mock('../budget-detail', () => ({
  BudgetDetail: (props: Record<string, unknown>) => (
    <div data-testid="budget-detail" data-props={JSON.stringify(props)} />
  ),
}));

import Page from '../page';

describe('BudgetDetailPage', () => {
  it('renders BudgetDetail with id and role flags', async () => {
    await act(async () => {
      render(
        <Suspense fallback={<div>Loading...</div>}>
          <Page params={Promise.resolve({ id: 'test-uuid' })} />
        </Suspense>,
      );
    });

    const el = screen.getByTestId('budget-detail');
    const props = JSON.parse(el.dataset.props!);
    expect(props.id).toBe('test-uuid');
    expect(props.isAdmin).toBe(true);
    expect(props.isClient).toBe(false);
  });
});
