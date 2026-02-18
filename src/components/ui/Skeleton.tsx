import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform, Animated } from 'react-native';

// Native-only import
let SkeletonPlaceholder: any = null;
if (Platform.OS !== 'web') {
  try {
    SkeletonPlaceholder = require('react-native-skeleton-placeholder').default;
  } catch (e) {
    // Fallback if native module not available
  }
}

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

/**
 * Cross-platform skeleton with pulse animation
 */
function PulseSkeleton({ width = '100%', height = 20, borderRadius = 4, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: typeof width === 'number' ? width : width,
          height,
          borderRadius,
          backgroundColor: '#E5E4E1',
          opacity,
        },
        style,
      ]}
    />
  );
}

/**
 * Animated skeleton shimmer component
 */
export function Skeleton({ width = '100%', height = 20, borderRadius = 4, style }: SkeletonProps) {
  // Use pulse animation for web, native shimmer for mobile
  if (Platform.OS === 'web' || !SkeletonPlaceholder) {
    return <PulseSkeleton width={width} height={height} borderRadius={borderRadius} style={style} />;
  }

  return (
    <SkeletonPlaceholder backgroundColor="#E5E4E1" highlightColor="#F5F4F1">
      <SkeletonPlaceholder.Item
        width={width}
        height={height}
        borderRadius={borderRadius}
        {...style}
      />
    </SkeletonPlaceholder>
  );
}

interface SkeletonCardProps {
  lines?: number;
  hasImage?: boolean;
  style?: any;
}

/**
 * Cross-platform skeleton card
 */
function PulseSkeletonCard({ lines = 2, hasImage = true, style }: SkeletonCardProps) {
  return (
    <View style={[{ flexDirection: 'row', padding: 16 }, style]}>
      {hasImage && (
        <View style={{ marginRight: 12 }}>
          <PulseSkeleton width={48} height={48} borderRadius={24} />
        </View>
      )}
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <PulseSkeleton width="60%" height={16} style={{ marginBottom: 6 }} />
        {Array.from({ length: lines - 1 }).map((_, i) => (
          <PulseSkeleton key={i} width="40%" height={14} borderRadius={3} style={{ marginBottom: 4 }} />
        ))}
      </View>
    </View>
  );
}

/**
 * A skeleton card layout for list items or cards
 */
export function SkeletonCard({ lines = 2, hasImage = true, style }: SkeletonCardProps) {
  if (Platform.OS === 'web' || !SkeletonPlaceholder) {
    return <PulseSkeletonCard lines={lines} hasImage={hasImage} style={style} />;
  }

  return (
    <SkeletonPlaceholder backgroundColor="#E5E4E1" highlightColor="#F5F4F1">
      <SkeletonPlaceholder.Item 
        flexDirection="row" 
        padding={16}
        {...style}
      >
        {hasImage && (
          <SkeletonPlaceholder.Item 
            width={48} 
            height={48} 
            borderRadius={24} 
            marginRight={12} 
          />
        )}
        <SkeletonPlaceholder.Item flex={1} justifyContent="center">
          <SkeletonPlaceholder.Item width="60%" height={16} marginBottom={6} />
          {Array.from({ length: lines - 1 }).map((_, i) => (
            <SkeletonPlaceholder.Item 
              key={i} 
              width="40%" 
              height={14} 
              borderRadius={3} 
              marginBottom={4}
            />
          ))}
        </SkeletonPlaceholder.Item>
      </SkeletonPlaceholder.Item>
    </SkeletonPlaceholder>
  );
}

/**
 * Cross-platform playdate skeleton
 */
function PulseSkeletonPlaydateCard() {
  return (
    <View style={{ flexDirection: 'row', marginBottom: 12 }}>
      <PulseSkeleton width={4} height={70} borderRadius={0} />
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 }}>
        <PulseSkeleton width={40} height={32} borderRadius={4} style={{ marginRight: 14 }} />
        <PulseSkeleton width={1} height={36} style={{ marginRight: 14 }} />
        <View style={{ flex: 1 }}>
          <PulseSkeleton width="80%" height={16} style={{ marginBottom: 4 }} />
          <PulseSkeleton width="50%" height={14} borderRadius={3} />
        </View>
      </View>
    </View>
  );
}

/**
 * A skeleton layout for playdate cards
 */
export function SkeletonPlaydateCard() {
  if (Platform.OS === 'web' || !SkeletonPlaceholder) {
    return <PulseSkeletonPlaydateCard />;
  }

  return (
    <SkeletonPlaceholder backgroundColor="#E5E4E1" highlightColor="#F5F4F1">
      <SkeletonPlaceholder.Item flexDirection="row" marginBottom={12}>
        <SkeletonPlaceholder.Item width={4} height={70} />
        <SkeletonPlaceholder.Item 
          flex={1} 
          flexDirection="row" 
          alignItems="center" 
          paddingVertical={14}
          paddingHorizontal={16}
        >
          <SkeletonPlaceholder.Item width={40} height={32} borderRadius={4} marginRight={14} />
          <SkeletonPlaceholder.Item width={1} height={36} marginRight={14} />
          <SkeletonPlaceholder.Item flex={1}>
            <SkeletonPlaceholder.Item width="80%" height={16} marginBottom={4} />
            <SkeletonPlaceholder.Item width="50%" height={14} borderRadius={3} />
          </SkeletonPlaceholder.Item>
        </SkeletonPlaceholder.Item>
      </SkeletonPlaceholder.Item>
    </SkeletonPlaceholder>
  );
}

/**
 * Cross-platform park skeleton
 */
function PulseSkeletonParkCard() {
  return (
    <View style={{ marginBottom: 16 }}>
      <PulseSkeleton width="100%" height={128} borderRadius={0} />
      <View style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
          <PulseSkeleton width="70%" height={16} />
          <PulseSkeleton width={50} height={14} />
        </View>
        <PulseSkeleton width="50%" height={12} borderRadius={3} style={{ marginBottom: 8 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <PulseSkeleton width={14} height={14} borderRadius={7} style={{ marginRight: 6 }} />
          <PulseSkeleton width={80} height={14} borderRadius={3} />
        </View>
      </View>
    </View>
  );
}

/**
 * A skeleton layout for park cards
 */
export function SkeletonParkCard() {
  if (Platform.OS === 'web' || !SkeletonPlaceholder) {
    return <PulseSkeletonParkCard />;
  }

  return (
    <SkeletonPlaceholder backgroundColor="#E5E4E1" highlightColor="#F5F4F1">
      <SkeletonPlaceholder.Item marginBottom={16}>
        <SkeletonPlaceholder.Item width="100%" height={128} />
        <SkeletonPlaceholder.Item padding={16}>
          <SkeletonPlaceholder.Item flexDirection="row" justifyContent="space-between" marginBottom={4}>
            <SkeletonPlaceholder.Item width="70%" height={16} />
            <SkeletonPlaceholder.Item width={50} height={14} />
          </SkeletonPlaceholder.Item>
          <SkeletonPlaceholder.Item width="50%" height={12} borderRadius={3} marginBottom={8} />
          <SkeletonPlaceholder.Item flexDirection="row" alignItems="center">
            <SkeletonPlaceholder.Item width={14} height={14} borderRadius={7} marginRight={6} />
            <SkeletonPlaceholder.Item width={80} height={14} borderRadius={3} />
          </SkeletonPlaceholder.Item>
        </SkeletonPlaceholder.Item>
      </SkeletonPlaceholder.Item>
    </SkeletonPlaceholder>
  );
}

/**
 * Cross-platform notification skeleton
 */
function PulseSkeletonNotification() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
      <PulseSkeleton width={48} height={48} borderRadius={24} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <PulseSkeleton width="70%" height={15} style={{ marginBottom: 4 }} />
        <PulseSkeleton width="90%" height={14} borderRadius={3} style={{ marginBottom: 4 }} />
        <PulseSkeleton width={60} height={12} borderRadius={3} />
      </View>
    </View>
  );
}

/**
 * Multiple skeleton items for list loading
 */
interface SkeletonListProps {
  count?: number;
  type?: 'card' | 'playdate' | 'park' | 'notification';
}

export function SkeletonList({ count = 3, type = 'card' }: SkeletonListProps) {
  const renderSkeleton = () => {
    switch (type) {
      case 'playdate':
        return <SkeletonPlaydateCard />;
      case 'park':
        return <SkeletonParkCard />;
      case 'notification':
        if (Platform.OS === 'web' || !SkeletonPlaceholder) {
          return <PulseSkeletonNotification />;
        }
        return (
          <SkeletonPlaceholder backgroundColor="#E5E4E1" highlightColor="#F5F4F1">
            <SkeletonPlaceholder.Item 
              flexDirection="row" 
              alignItems="center" 
              padding={16}
            >
              <SkeletonPlaceholder.Item width={48} height={48} borderRadius={24} />
              <SkeletonPlaceholder.Item flex={1} marginLeft={12}>
                <SkeletonPlaceholder.Item width="70%" height={15} marginBottom={4} />
                <SkeletonPlaceholder.Item width="90%" height={14} borderRadius={3} marginBottom={4} />
                <SkeletonPlaceholder.Item width={60} height={12} borderRadius={3} />
              </SkeletonPlaceholder.Item>
            </SkeletonPlaceholder.Item>
          </SkeletonPlaceholder>
        );
      default:
        return <SkeletonCard />;
    }
  };

  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={i < count - 1 ? styles.marginBottom : undefined}>
          {renderSkeleton()}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  marginBottom: {
    marginBottom: 1,
  },
});

export default Skeleton;
