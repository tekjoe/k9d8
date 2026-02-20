jest.mock('../../src/lib/supabase');
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true }),
}));
jest.mock('../../src/services/moderation', () => ({
  moderateImage: jest.fn().mockResolvedValue({ isSafe: true }),
  initializeModerationModel: jest.fn().mockResolvedValue(true),
  isModerationModelLoaded: jest.fn(() => true),
  getModerationMessage: jest.fn(() => 'Content not allowed'),
}));
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: (props: any) => React.createElement(Text, { testID: `icon-${props.name}` }, props.name),
  };
});

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ImagePickerWithModeration } from '../../src/components/ImagePickerWithModeration';

describe('ImagePickerWithModeration', () => {
  const defaultProps = {
    onImageSelect: jest.fn(),
    onImageRemove: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { toJSON } = render(<ImagePickerWithModeration {...defaultProps} />);
    expect(toJSON()).toBeTruthy();
  });

  it('displays default placeholder text', () => {
    const { getByText } = render(<ImagePickerWithModeration {...defaultProps} />);
    expect(getByText('Tap to select photo')).toBeTruthy();
  });

  it('displays custom placeholder text', () => {
    const { getByText } = render(
      <ImagePickerWithModeration {...defaultProps} placeholder="Add Dog Photo" />
    );
    expect(getByText('Add Dog Photo')).toBeTruthy();
  });

  it('shows image preview when selectedImage is provided', () => {
    const { getByText } = render(
      <ImagePickerWithModeration
        {...defaultProps}
        selectedImage="http://example.com/image.jpg"
      />
    );
    expect(getByText('Change Photo')).toBeTruthy();
    expect(getByText('Remove')).toBeTruthy();
  });
});
