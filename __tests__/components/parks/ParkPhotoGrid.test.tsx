jest.mock('../../../src/lib/supabase');
jest.mock('../../../src/hooks/useParkPhotos', () => ({
  useParkPhotos: jest.fn(() => ({
    photos: [],
    loading: false,
    upload: jest.fn(),
    vote: jest.fn(),
    deletePhoto: jest.fn(),
    report: jest.fn(),
    featuredPhoto: null,
  })),
}));
jest.mock('../../../src/services/moderation', () => ({
  moderateImage: jest.fn().mockResolvedValue({ isSafe: true }),
  initializeModerationModel: jest.fn().mockResolvedValue(true),
  isModerationModelLoaded: jest.fn(() => true),
}));
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true }),
}));
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: (props: any) => React.createElement(Text, { testID: `icon-${props.name}` }, props.name),
  };
});

import React from 'react';
import { render } from '@testing-library/react-native';
import ParkPhotoGrid from '../../../src/components/parks/ParkPhotoGrid';
import { useParkPhotos } from '../../../src/hooks/useParkPhotos';

const mockUseParkPhotos = useParkPhotos as jest.Mock;

describe('ParkPhotoGrid', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { toJSON } = render(
      <ParkPhotoGrid parkId="park-1" isAuthenticated={false} />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('shows Photos header', () => {
    const { getByText } = render(
      <ParkPhotoGrid parkId="park-1" isAuthenticated={false} />
    );
    expect(getByText('Photos')).toBeTruthy();
  });

  it('shows upload prompt for authenticated users', () => {
    const { getByText } = render(
      <ParkPhotoGrid parkId="park-1" isAuthenticated={true} userId="u1" />
    );
    expect(getByText('Tap to select photo')).toBeTruthy();
  });

  it('shows login prompt for unauthenticated users', () => {
    const { getByText } = render(
      <ParkPhotoGrid parkId="park-1" isAuthenticated={false} />
    );
    expect(getByText(/Log in to add/)).toBeTruthy();
  });

  it('shows photo count when photos exist', () => {
    mockUseParkPhotos.mockReturnValue({
      photos: [
        { id: 'p1', photo_url: 'http://example.com/photo.jpg', user_id: 'u1', park_id: 'park-1', created_at: '', vote_count: 0, user_has_voted: false, user: { display_name: 'Alice' } },
      ],
      loading: false,
      upload: jest.fn(),
      vote: jest.fn(),
      deletePhoto: jest.fn(),
      report: jest.fn(),
      featuredPhoto: null,
    });
    const { getByText } = render(
      <ParkPhotoGrid parkId="park-1" isAuthenticated={false} />
    );
    expect(getByText('Photos (1)')).toBeTruthy();
  });
});
