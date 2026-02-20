jest.mock('../../../src/lib/supabase');
jest.mock('../../../src/services/parks', () => ({
  getParkById: jest.fn(),
  getParkBySlug: jest.fn(),
}));
jest.mock('../../../src/hooks/useAuth', () => ({
  useAuth: () => ({ session: { user: { id: 'test-user' } } }),
}));
jest.mock('../../../src/hooks/useCheckIn', () => ({
  useCheckIn: () => ({
    activeCheckIns: [],
    userCheckIn: null,
    loading: false,
    checkIn: jest.fn(),
    checkOut: jest.fn(),
  }),
}));
jest.mock('../../../src/hooks/useDogs', () => ({
  useDogs: () => ({ dogs: [] }),
}));
jest.mock('../../../src/hooks/usePlaydates', () => ({
  usePlaydates: () => ({ playdates: [], loading: false, refresh: jest.fn() }),
}));
jest.mock('../../../src/hooks/useParkPhotos', () => ({
  useParkPhotos: () => ({ photos: [], loading: false, upload: jest.fn(), vote: jest.fn(), deletePhoto: jest.fn(), report: jest.fn(), featuredPhoto: null }),
}));
jest.mock('../../../src/hooks/useParkReviews', () => ({
  useParkReviews: () => ({ reviews: [], loading: false, sortBy: 'votes', setSortBy: jest.fn(), createReview: jest.fn(), vote: jest.fn(), deleteReview: jest.fn(), report: jest.fn() }),
}));
jest.mock('../../../src/services/moderation', () => ({
  moderateImage: jest.fn(),
  initializeModerationModel: jest.fn(),
  isModerationModelLoaded: jest.fn(() => true),
}));
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (cb: any) => cb(),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('../../../src/components/ui/DesktopSidebar', () => {
  const React = require('react');
  return { __esModule: true, default: () => null };
});
jest.mock('expo-router/head', () => ({
  __esModule: true,
  default: ({ children }: any) => children,
}));
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: (props: any) => React.createElement(Text, { testID: `icon-${props.name}` }, props.name),
  };
});
jest.mock('../../../src/utils/slug', () => ({
  parseSlugOrId: (v: string) => ({ type: 'uuid', id: v }),
}));

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import ParkDetailAuth from '../../../src/components/web/ParkDetailAuth';
import { getParkById } from '../../../src/services/parks';

const mockGetParkById = getParkById as jest.Mock;

const makePark = () => ({
  id: 'park-1',
  name: 'Test Park Auth',
  description: 'A test park',
  latitude: 37.7749,
  longitude: -122.4194,
  address: '123 Main St',
  city: 'SF',
  state: 'CA',
  image_url: null,
  amenities: [],
  is_fenced: true,
  has_water: true,
  has_shade: false,
  created_at: '2024-01-01T00:00:00Z',
});

describe('ParkDetailAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetParkById.mockResolvedValue(makePark());
  });

  it('renders without crashing', async () => {
    const { toJSON } = render(<ParkDetailAuth slugOrId="park-1" />);
    await waitFor(() => {
      expect(toJSON()).toBeTruthy();
    });
  });

  it('displays park name after loading', async () => {
    const { getByText } = render(<ParkDetailAuth slugOrId="park-1" />);
    await waitFor(() => {
      expect(getByText('Test Park Auth')).toBeTruthy();
    });
  });

  it('shows error when park not found', async () => {
    mockGetParkById.mockResolvedValue(null);
    const { getByText } = render(<ParkDetailAuth slugOrId="park-1" />);
    await waitFor(() => {
      expect(getByText('Park not found')).toBeTruthy();
    });
  });

  it('shows About This Park section', async () => {
    const { getByText } = render(<ParkDetailAuth slugOrId="park-1" />);
    await waitFor(() => {
      expect(getByText('About This Park')).toBeTruthy();
    });
  });
});
