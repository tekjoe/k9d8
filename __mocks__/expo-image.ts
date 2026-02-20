import React from 'react';
import { View } from 'react-native';

export const Image = (props: any) =>
  React.createElement(View, { testID: props.testID || 'expo-image', ...props });
