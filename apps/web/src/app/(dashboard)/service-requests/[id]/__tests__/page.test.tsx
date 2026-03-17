import { act, render, screen } from '@testing-library/react';
import { Suspense } from 'react';

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({ user: { id: 'u1', role: 'ADMIN' } }),
  ),
}));

vi.mock('../service-request-detail', () => ({
  ServiceRequestDetail: (props: Record<string, unknown>) => (
    <div data-testid="sr-detail" data-props={JSON.stringify(props)} />
  ),
}));

import Page from '../page';

describe('ServiceRequestDetailPage', () => {
  it('renders ServiceRequestDetail with id and role flags', async () => {
    await act(async () => {
      render(
        <Suspense fallback={<div>Loading...</div>}>
          <Page params={Promise.resolve({ id: 'sr-1' })} />
        </Suspense>,
      );
    });

    const el = screen.getByTestId('sr-detail');
    const props = JSON.parse(el.dataset.props!);
    expect(props.id).toBe('sr-1');
    expect(props.isAdmin).toBe(true);
    expect(props.isClient).toBe(false);
  });
});
