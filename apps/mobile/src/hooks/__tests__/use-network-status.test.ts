import { renderHook } from '@testing-library/react-native';
import { act } from 'react';

let mockListener: ((state: { isConnected: boolean | null }) => void) | null = null;
const mockUnsubscribe = jest.fn();

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: (cb: (state: { isConnected: boolean | null }) => void) => {
    mockListener = cb;
    return mockUnsubscribe;
  },
}));

import { useNetworkStatus } from '../use-network-status';

describe('useNetworkStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListener = null;
  });

  it('defaults to connected', () => {
    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current).toBe(true);
  });

  it('updates to disconnected when NetInfo reports offline', () => {
    const { result } = renderHook(() => useNetworkStatus());

    act(() => {
      mockListener?.({ isConnected: false });
    });

    expect(result.current).toBe(false);
  });

  it('unsubscribes on unmount', () => {
    const { unmount } = renderHook(() => useNetworkStatus());
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });
});
