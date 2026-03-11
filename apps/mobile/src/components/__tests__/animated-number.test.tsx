import { render, screen } from '@testing-library/react-native';
import React from 'react';

// Mock useReducedMotion to return true so the component takes the synchronous
// code path (skipping reanimated reactions that are no-ops in the test env).
jest.mock('@/lib/animations', () => ({
  ...jest.requireActual('@/lib/animations'),
  useReducedMotion: () => true,
}));

import { AnimatedNumber } from '../animated-number';

describe('AnimatedNumber', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the formatted number', () => {
    render(<AnimatedNumber value={42} />);
    expect(screen.getByText('42')).toBeTruthy();
  });

  it('renders prefix when provided', () => {
    render(<AnimatedNumber value={100} prefix="$" />);
    expect(screen.getByText('$100')).toBeTruthy();
  });

  it('renders suffix when provided', () => {
    render(<AnimatedNumber value={75} suffix="%" />);
    expect(screen.getByText('75%')).toBeTruthy();
  });

  it('renders prefix and suffix together', () => {
    render(<AnimatedNumber value={50} prefix="$" suffix=" ARS" />);
    expect(screen.getByText('$50 ARS')).toBeTruthy();
  });
});
