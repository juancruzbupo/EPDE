import { render } from '@testing-library/react-native';
import React from 'react';

// ---------------------------------------------------------------------------
// Mocks — declared before import of the component under test
// ---------------------------------------------------------------------------

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

const mockUseProperties = jest.fn();

jest.mock('@/hooks/use-properties', () => ({
  useProperties: (...args: unknown[]) => mockUseProperties(...args),
}));

// ---------------------------------------------------------------------------
// Import the component under test *after* mocks are set up
// ---------------------------------------------------------------------------

import PropertiesScreen from '@/app/(tabs)/properties';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockProperties = {
  pages: [
    {
      data: [
        {
          id: 'prop-1',
          address: 'Av. Corrientes 1234',
          city: 'CABA',
          type: 'HOUSE',
          yearBuilt: 1990,
          squareMeters: 120,
          maintenancePlan: { name: 'Plan Anual', status: 'ACTIVE' },
        },
        {
          id: 'prop-2',
          address: 'Av. Santa Fe 5678',
          city: 'CABA',
          type: 'APARTMENT',
          yearBuilt: 2005,
          squareMeters: 80,
          maintenancePlan: null,
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function queryResult<T>(
  data: T | undefined,
  overrides?: Partial<{
    isLoading: boolean;
    error: Error | null;
    fetchNextPage: jest.Mock;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
  }>,
) {
  return {
    data,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
    fetchNextPage: jest.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PropertiesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders property list when data is available', () => {
    mockUseProperties.mockReturnValue(queryResult(mockProperties));

    const { getByText } = render(<PropertiesScreen />);

    expect(getByText('Mis Propiedades')).toBeTruthy();
    expect(getByText('Av. Corrientes 1234')).toBeTruthy();
    expect(getByText('Av. Santa Fe 5678')).toBeTruthy();
  });

  it('shows empty state when no properties', () => {
    mockUseProperties.mockReturnValue(queryResult({ pages: [{ data: [] }] }));

    const { getByText } = render(<PropertiesScreen />);

    expect(getByText('Sin propiedades')).toBeTruthy();
  });

  it('shows error state when query fails', () => {
    mockUseProperties.mockReturnValue(
      queryResult(undefined, { error: new Error('Network error') }),
    );

    const { getByText } = render(<PropertiesScreen />);

    expect(getByText('Reintentar')).toBeTruthy();
  });
});
