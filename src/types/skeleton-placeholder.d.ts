declare module 'react-native-skeleton-placeholder' {
  import * as React from 'react';
  import { StyleProp, ViewStyle } from 'react-native';

  type SkeletonPlaceholderProps = {
    children: React.ReactElement;
    backgroundColor?: string;
    highlightColor?: string;
    speed?: number;
    direction?: 'left' | 'right';
    enabled?: boolean;
    borderRadius?: number;
    angle?: number;
    shimmerWidth?: number;
  };

  type SkeletonPlaceholderItemProps = ViewStyle & {
    style?: StyleProp<ViewStyle>;
    children?: React.ReactNode;
  };

  const SkeletonPlaceholder: React.FC<SkeletonPlaceholderProps> & {
    Item: React.FC<SkeletonPlaceholderItemProps>;
  };

  export default SkeletonPlaceholder;
}
