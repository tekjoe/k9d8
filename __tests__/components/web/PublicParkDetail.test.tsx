jest.mock('../../../src/lib/supabase');
jest.mock('../../../src/services/parks', () => ({
  getParkById: jest.fn(),
  getParkBySlug: jest.fn(),
  getParksNearby: jest.fn().mockResolvedValue([]),
  stateAbbrevToName: jest.fn((abbrev: string) => abbrev === 'CA' ? 'California' : abbrev),
}));
jest.mock('../../../src/services/checkins', () => ({
  getActiveCheckIns: jest.fn().mockResolvedValue([]),
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
jest.mock('expo-router/head', () => ({
  __esModule: true,
  default: ({ children }: any) => children,
}));
jest.mock('react-map-gl/mapbox', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: (props: any) => React.createElement('Map', props),
    Marker: (props: any) => React.createElement('Marker', props),
  };
});
jest.mock('mapbox-gl/dist/mapbox-gl.css', () => ({}));
jest.mock('../../../src/components/web/NavBar', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return { __esModule: true, default: () => React.createElement(Text, null, 'NavBar') };
});
jest.mock('../../../src/components/web/Footer', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return { __esModule: true, default: () => React.createElement(Text, null, 'Footer') };
});
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: (props: any) => React.createElement(Text, { testID: `icon-${props.name}` }, props.name),
  };
});
jest.mock('../../../src/utils/slug', () => ({
  parseSlugOrId: (v: string) => ({ type: 'uuid', id: v }),
  generateParkSlug: (name: string) => name.toLowerCase().replace(/\s+/g, '-'),
}));

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import PublicParkDetail from '../../../src/components/web/PublicParkDetail';
import { getParkById } from '../../../src/services/parks';

const mockGetParkById = getParkById as jest.Mock;

const makePark = () => ({
  id: 'park-1',
  name: 'Sunny Dog Park',
  description: 'A fantastic park for dogs.',
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

describe('PublicParkDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetParkById.mockResolvedValue(makePark());
  });

  it('renders without crashing', async () => {
    const { toJSON } = render(<PublicParkDetail slugOrId="park-1" />);
    await waitFor(() => {
      expect(toJSON()).toBeTruthy();
    });
  });

  it('displays park name after loading', async () => {
    const { getByText } = render(<PublicParkDetail slugOrId="park-1" />);
    await waitFor(() => {
      expect(getByText('Sunny Dog Park')).toBeTruthy();
    });
  });

  it('shows not found when park is null', async () => {
    mockGetParkById.mockResolvedValue(null);
    const { getByText } = render(<PublicParkDetail slugOrId="park-1" />);
    await waitFor(() => {
      expect(getByText('Park not found')).toBeTruthy();
    });
  });

  it('shows About This Park section', async () => {
    const { getByText } = render(<PublicParkDetail slugOrId="park-1" />);
    await waitFor(() => {
      expect(getByText('About This Park')).toBeTruthy();
    });
  });
});
