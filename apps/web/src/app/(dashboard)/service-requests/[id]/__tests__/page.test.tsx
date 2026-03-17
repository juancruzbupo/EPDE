import { render, screen } from '@testing-library/react';

vi.mock('@/lib/server-auth', () => ({
  getServerUser: vi.fn().mockResolvedValue({ id: 'u1', role: 'ADMIN' }),
}));

vi.mock('../service-request-detail', () => ({
  ServiceRequestDetail: (props: Record<string, unknown>) => (
    <div data-testid="sr-detail" data-props={JSON.stringify(props)} />
  ),
}));

import Page from '../page';

describe('ServiceRequestDetailPage', () => {
  it('renders ServiceRequestDetail with id and role flags from server auth', async () => {
    const jsx = await Page({ params: Promise.resolve({ id: 'sr-1' }) });
    render(jsx);

    const el = screen.getByTestId('sr-detail');
    const props = JSON.parse(el.dataset.props!);
    expect(props.id).toBe('sr-1');
    expect(props.isAdmin).toBe(true);
    expect(props.isClient).toBe(false);
  });
});
