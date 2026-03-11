import { render } from '@testing-library/react-native';
import React from 'react';

import { ListItemSkeleton, SkeletonPlaceholder, StatCardSkeleton } from '../skeleton-placeholder';

describe('SkeletonPlaceholder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { toJSON } = render(<SkeletonPlaceholder />);
    expect(toJSON()).toBeTruthy();
  });

  it('applies custom width and height via style', () => {
    const { toJSON } = render(<SkeletonPlaceholder width={120} height={24} />);
    const tree = toJSON();
    expect(tree).toBeTruthy();
  });

  it('applies custom className', () => {
    const { toJSON } = render(<SkeletonPlaceholder className="my-custom-class" />);
    expect(toJSON()).toBeTruthy();
  });
});

describe('StatCardSkeleton', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<StatCardSkeleton />);
    expect(toJSON()).toBeTruthy();
  });
});

describe('ListItemSkeleton', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<ListItemSkeleton />);
    expect(toJSON()).toBeTruthy();
  });
});
