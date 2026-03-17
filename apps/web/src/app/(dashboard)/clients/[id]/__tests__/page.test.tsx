import { act, render, screen } from '@testing-library/react';
import { Suspense } from 'react';

vi.mock('../client-detail', () => ({
  ClientDetail: (props: Record<string, unknown>) => (
    <div data-testid="client-detail" data-props={JSON.stringify(props)} />
  ),
}));

import Page from '../page';

describe('ClientDetailPage', () => {
  it('renders ClientDetail with id', async () => {
    await act(async () => {
      render(
        <Suspense fallback={<div>Loading...</div>}>
          <Page params={Promise.resolve({ id: 'client-1' })} />
        </Suspense>,
      );
    });

    const el = screen.getByTestId('client-detail');
    const props = JSON.parse(el.dataset.props!);
    expect(props.id).toBe('client-1');
  });
});
