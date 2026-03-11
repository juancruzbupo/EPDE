import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

jest.mock('react-native-gesture-handler', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  return {
    Gesture: {
      Pan: () => ({
        enabled: () => ({
          activeOffsetX: () => ({
            failOffsetY: () => ({
              onUpdate: () => ({
                onEnd: () => ({}),
              }),
            }),
          }),
        }),
      }),
    },
    GestureDetector: ({ children }: { children: React.ReactNode }) => children,
    GestureHandlerRootView: View,
  };
});

jest.mock('@/lib/haptics', () => ({
  haptics: { light: jest.fn(), medium: jest.fn(), heavy: jest.fn() },
}));

import { SwipeableRow } from '../swipeable-row';

describe('SwipeableRow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children content', () => {
    render(
      <SwipeableRow>
        <Text>Row content</Text>
      </SwipeableRow>,
    );
    expect(screen.getByText('Row content')).toBeTruthy();
  });

  it('renders action label when rightActions are provided', () => {
    const action = { icon: '✓', color: '#00ff00', onPress: jest.fn() };
    render(
      <SwipeableRow rightActions={[action]}>
        <Text>Swipeable content</Text>
      </SwipeableRow>,
    );
    expect(screen.getByText('Swipeable content')).toBeTruthy();
    expect(screen.getByText('✓')).toBeTruthy();
  });

  it('renders children only (no actions container) when rightActions is empty', () => {
    render(
      <SwipeableRow rightActions={[]}>
        <Text>Plain row</Text>
      </SwipeableRow>,
    );
    expect(screen.getByText('Plain row')).toBeTruthy();
  });
});
