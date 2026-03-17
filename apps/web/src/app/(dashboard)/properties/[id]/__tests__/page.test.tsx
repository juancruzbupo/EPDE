import { act, render, screen } from '@testing-library/react';
import { Suspense } from 'react';

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({ user: { id: 'u1', role: 'ADMIN' } }),
  ),
}));

vi.mock('../property-detail', () => ({
  PropertyDetail: (props: Record<string, unknown>) => (
    <div data-testid="property-detail" data-props={JSON.stringify(props)} />
  ),
}));

import Page from '../page';

describe('PropertyDetailPage', () => {
  it('renders PropertyDetail with id and isAdmin', async () => {
    await act(async () => {
      render(
        <Suspense fallback={<div>Loading...</div>}>
          <Page params={Promise.resolve({ id: 'prop-1' })} />
        </Suspense>,
      );
    });

    const el = screen.getByTestId('property-detail');
    const props = JSON.parse(el.dataset.props!);
    expect(props.id).toBe('prop-1');
    expect(props.isAdmin).toBe(true);
  });
});
