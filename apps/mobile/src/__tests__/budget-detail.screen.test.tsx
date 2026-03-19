import { render } from '@testing-library/react-native';
import React from 'react';

// ---------------------------------------------------------------------------
// Mocks — declared before import of the component under test
// ---------------------------------------------------------------------------

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'budget-1' }),
  Stack: { Screen: () => null },
}));

jest.mock('date-fns', () => ({
  format: () => '1 mar 2025',
}));

jest.mock('date-fns/locale', () => ({
  es: {},
}));

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

const mockUseBudget = jest.fn();
const mockUseBudgetAuditLog = jest.fn();
const mockUseBudgetComments = jest.fn();
const mockUseAddBudgetComment = jest.fn();
const mockUseUpdateBudgetStatus = jest.fn();
const mockUseEditBudgetRequest = jest.fn();
const mockUseAddBudgetAttachments = jest.fn();

jest.mock('@/hooks/use-budgets', () => ({
  useBudget: (...args: unknown[]) => mockUseBudget(...args),
  useBudgetAuditLog: (...args: unknown[]) => mockUseBudgetAuditLog(...args),
  useBudgetComments: (...args: unknown[]) => mockUseBudgetComments(...args),
  useAddBudgetComment: () => mockUseAddBudgetComment(),
  useUpdateBudgetStatus: () => mockUseUpdateBudgetStatus(),
  useEditBudgetRequest: () => mockUseEditBudgetRequest(),
  useAddBudgetAttachments: () => mockUseAddBudgetAttachments(),
}));

jest.mock('@/hooks/use-upload', () => ({
  useUploadFile: () => ({ mutateAsync: jest.fn() }),
}));

jest.mock('@/components/collapsible-section', () => ({
  CollapsibleSection: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@/components/status-badge', () => ({
  BudgetStatusBadge: ({ status }: { status: string }) => status,
}));

// ---------------------------------------------------------------------------
// Import the component under test *after* mocks are set up
// ---------------------------------------------------------------------------

import BudgetDetailScreen from '@/app/budget/[id]';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockBudget = {
  id: 'budget-1',
  title: 'Reparar techo',
  description: 'Filtraciones en el segundo piso',
  status: 'PENDING',
  createdAt: '2025-03-01T00:00:00.000Z',
  property: { id: 'prop-1', address: 'Av. Corrientes 1234', city: 'CABA' },
  response: null,
  lineItems: [],
  attachments: [],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function queryResult<T>(
  data: T | undefined,
  overrides?: Partial<{ isLoading: boolean; error: Error | null }>,
) {
  return {
    data,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
    ...overrides,
  };
}

function setupDefaultMocks() {
  mockUseBudget.mockReturnValue(queryResult(mockBudget));
  mockUseBudgetAuditLog.mockReturnValue(queryResult([]));
  mockUseBudgetComments.mockReturnValue(queryResult([]));
  mockUseAddBudgetComment.mockReturnValue({ mutate: jest.fn(), isPending: false });
  mockUseUpdateBudgetStatus.mockReturnValue({ mutate: jest.fn(), isPending: false });
  mockUseEditBudgetRequest.mockReturnValue({ mutate: jest.fn(), isPending: false });
  mockUseAddBudgetAttachments.mockReturnValue({ mutateAsync: jest.fn() });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BudgetDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders budget title and details when data is available', () => {
    setupDefaultMocks();

    const { getByText } = render(<BudgetDetailScreen />);

    expect(getByText('Reparar techo')).toBeTruthy();
    expect(getByText('Filtraciones en el segundo piso')).toBeTruthy();
    expect(getByText('Av. Corrientes 1234')).toBeTruthy();
    expect(getByText('Propiedad')).toBeTruthy();
  });

  it('shows loading indicator when budget is loading', () => {
    mockUseBudget.mockReturnValue(queryResult(undefined, { isLoading: true }));
    mockUseBudgetAuditLog.mockReturnValue(queryResult(undefined));
    mockUseBudgetComments.mockReturnValue(queryResult(undefined));
    mockUseAddBudgetComment.mockReturnValue({ mutate: jest.fn(), isPending: false });
    mockUseUpdateBudgetStatus.mockReturnValue({ mutate: jest.fn(), isPending: false });
    mockUseEditBudgetRequest.mockReturnValue({ mutate: jest.fn(), isPending: false });
    mockUseAddBudgetAttachments.mockReturnValue({ mutateAsync: jest.fn() });

    const { queryByText } = render(<BudgetDetailScreen />);

    expect(queryByText('Reparar techo')).toBeNull();
  });

  it('shows error state when budget fetch fails', () => {
    mockUseBudget.mockReturnValue(queryResult(undefined, { error: new Error('Network error') }));
    mockUseBudgetAuditLog.mockReturnValue(queryResult(undefined));
    mockUseBudgetComments.mockReturnValue(queryResult(undefined));
    mockUseAddBudgetComment.mockReturnValue({ mutate: jest.fn(), isPending: false });
    mockUseUpdateBudgetStatus.mockReturnValue({ mutate: jest.fn(), isPending: false });
    mockUseEditBudgetRequest.mockReturnValue({ mutate: jest.fn(), isPending: false });
    mockUseAddBudgetAttachments.mockReturnValue({ mutateAsync: jest.fn() });

    const { getByText } = render(<BudgetDetailScreen />);

    expect(getByText('Reintentar')).toBeTruthy();
  });
});
