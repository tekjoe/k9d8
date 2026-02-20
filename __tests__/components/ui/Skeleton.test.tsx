jest.mock('../../../src/lib/supabase');

import React from 'react';
import { render } from '@testing-library/react-native';
import { Skeleton, SkeletonCard, SkeletonList, SkeletonPlaydateCard, SkeletonParkCard } from '../../../src/components/ui/Skeleton';

describe('Skeleton', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<Skeleton />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders with custom dimensions', () => {
    const { toJSON } = render(<Skeleton width={200} height={40} borderRadius={8} />);
    expect(toJSON()).toBeTruthy();
  });
});

describe('SkeletonCard', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<SkeletonCard />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders without image', () => {
    const { toJSON } = render(<SkeletonCard hasImage={false} />);
    expect(toJSON()).toBeTruthy();
  });
});

describe('SkeletonList', () => {
  it('renders default count of items', () => {
    const { toJSON } = render(<SkeletonList />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders playdate type skeleton', () => {
    const { toJSON } = render(<SkeletonList type="playdate" count={2} />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders park type skeleton', () => {
    const { toJSON } = render(<SkeletonList type="park" count={2} />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders notification type skeleton', () => {
    const { toJSON } = render(<SkeletonList type="notification" count={2} />);
    expect(toJSON()).toBeTruthy();
  });
});
