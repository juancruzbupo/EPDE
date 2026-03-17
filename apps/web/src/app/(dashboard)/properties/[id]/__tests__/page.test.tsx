import { render, screen } from '@testing-library/react';

vi.mock('@/lib/server-auth', () => ({
  getServerUser: vi.fn().mockResolvedValue({ id: 'u1', role: 'ADMIN' }),
}));

vi.mock('../property-detail', () => ({
  PropertyDetail: (props: Record<string, unknown>) => (
    <div data-testid="property-detail" data-props={JSON.stringify(props)} />
  ),
}));

import Page from '../page';

describe('PropertyDetailPage', () => {
  it('renders PropertyDetail with id and isAdmin from server auth', async () => {
    const jsx = await Page({ params: Promise.resolve({ id: 'prop-1' }) });
    render(jsx);

    const el = screen.getByTestId('property-detail');
    const props = JSON.parse(el.dataset.props!);
    expect(props.id).toBe('prop-1');
    expect(props.isAdmin).toBe(true);
  });
});
