import { render, screen } from '@testing-library/react';

vi.mock('@/lib/server-auth', () => ({
  getServerUser: vi.fn().mockResolvedValue({ id: 'u1', role: 'ADMIN' }),
}));

vi.mock('../budget-detail', () => ({
  BudgetDetail: (props: Record<string, unknown>) => (
    <div data-testid="budget-detail" data-props={JSON.stringify(props)} />
  ),
}));

import Page from '../page';

describe('BudgetDetailPage', () => {
  it('renders BudgetDetail with id and role flags from server auth', async () => {
    const jsx = await Page({ params: Promise.resolve({ id: 'b-1' }) });
    render(jsx);

    const el = screen.getByTestId('budget-detail');
    const props = JSON.parse(el.dataset.props!);
    expect(props.id).toBe('b-1');
    expect(props.isAdmin).toBe(true);
    expect(props.isClient).toBe(false);
  });
});
