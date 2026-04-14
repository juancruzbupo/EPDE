import { makeUser } from '@epde/shared/testing';
import { render } from '@testing-library/react-native';
import React from 'react';

// ---------------------------------------------------------------------------
// Mocks — declared before import of the component under test
// ---------------------------------------------------------------------------

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { version: '1.2.3' } },
}));

const mockAuthStore = jest.fn();

jest.mock('@/stores/auth-store', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) => mockAuthStore(selector),
}));

// ---------------------------------------------------------------------------
// Import the component under test *after* mocks are set up
// ---------------------------------------------------------------------------

import ProfileScreen from '@/app/(tabs)/profile';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockUser = makeUser({ name: 'Juan Perez', email: 'juan@test.com', phone: '+5411123456' });

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders user info when logged in', () => {
    mockAuthStore.mockImplementation((selector) => {
      const state = { user: mockUser, logout: jest.fn() };
      return selector(state);
    });

    const { getByText, getAllByText } = render(<ProfileScreen />);

    expect(getByText('Mi Perfil')).toBeTruthy();
    expect(getAllByText('Juan Perez').length).toBeGreaterThanOrEqual(1);
    expect(getAllByText('juan@test.com').length).toBeGreaterThanOrEqual(1);
    expect(getByText('+5411123456')).toBeTruthy();
    expect(getByText('1.2.3')).toBeTruthy();
  });

  it('shows fallback text when user is null', () => {
    mockAuthStore.mockImplementation((selector) => {
      const state = { user: null, logout: jest.fn() };
      return selector(state);
    });

    const { getByText } = render(<ProfileScreen />);

    expect(getByText('Usuario')).toBeTruthy();
    expect(getByText('Cerrar Sesión')).toBeTruthy();
  });

  it('shows logout button', () => {
    mockAuthStore.mockImplementation((selector) => {
      const state = { user: mockUser, logout: jest.fn() };
      return selector(state);
    });

    const { getByText } = render(<ProfileScreen />);

    expect(getByText('Cerrar Sesión')).toBeTruthy();
  });
});
