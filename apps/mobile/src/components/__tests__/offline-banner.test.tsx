import { render, screen } from '@testing-library/react-native';
import React from 'react';

import { OfflineBanner } from '../offline-banner';

// Mock useNetworkStatus to control connectivity state
let mockIsConnected = true;
jest.mock('@/hooks/use-network-status', () => ({
  useNetworkStatus: () => mockIsConnected,
}));

// Mock safe area insets
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('OfflineBanner', () => {
  beforeEach(() => {
    mockIsConnected = true;
  });

  it('does not render when connected', () => {
    mockIsConnected = true;
    render(<OfflineBanner />);
    expect(screen.queryByText('Sin conexion a internet')).toBeNull();
  });

  it('renders banner when disconnected', () => {
    mockIsConnected = false;
    render(<OfflineBanner />);
    expect(screen.getByText('Sin conexion a internet')).toBeTruthy();
  });

  it('shows correct offline text', () => {
    mockIsConnected = false;
    render(<OfflineBanner />);
    expect(screen.getByText('Sin conexion a internet')).toBeTruthy();
  });
});
