import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

/**
 * Animated skeleton with pulse animation
 */
export function Skeleton({ width = '100%', height = 20, borderRadius = 4, style }: SkeletonProps) {
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
          width,
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

interface SkeletonCardProps {
  lines?: number;
  hasImage?: boolean;
  style?: any;
}

/**
 * A skeleton card layout for list items or cards
 */
export function SkeletonCard({ lines = 2, hasImage = true, style }: SkeletonCardProps) {
  return (
    <View style={[{ flexDirection: 'row', padding: 16 }, style]}>
      {hasImage && (
        <View style={{ marginRight: 12 }}>
          <Skeleton width={48} height={48} borderRadius={24} />
        </View>
      )}
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Skeleton width="60%" height={16} style={{ marginBottom: 6 }} />
        {Array.from({ length: lines - 1 }).map((_, i) => (
          <Skeleton key={i} width="40%" height={14} borderRadius={3} style={{ marginBottom: 4 }} />
        ))}
      </View>
    </View>
  );
}

/**
 * A skeleton layout for playdate cards
 */
export function SkeletonPlaydateCard() {
  return (
    <View style={{ flexDirection: 'row', marginBottom: 12 }}>
      <Skeleton width={4} height={70} borderRadius={0} />
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 }}>
        <Skeleton width={40} height={32} borderRadius={4} style={{ marginRight: 14 }} />
        <Skeleton width={1} height={36} style={{ marginRight: 14 }} />
        <View style={{ flex: 1 }}>
          <Skeleton width="80%" height={16} style={{ marginBottom: 4 }} />
          <Skeleton width="50%" height={14} borderRadius={3} />
        </View>
      </View>
    </View>
  );
}

/**
 * A skeleton layout for park cards
 */
export function SkeletonParkCard() {
  return (
    <View style={{ marginBottom: 16 }}>
      <Skeleton width="100%" height={128} borderRadius={0} />
      <View style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
          <Skeleton width="70%" height={16} />
          <Skeleton width={50} height={14} />
        </View>
        <Skeleton width="50%" height={12} borderRadius={3} style={{ marginBottom: 8 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Skeleton width={14} height={14} borderRadius={7} style={{ marginRight: 6 }} />
          <Skeleton width={80} height={14} borderRadius={3} />
        </View>
      </View>
    </View>
  );
}

/**
 * A skeleton layout for notification items
 */
function SkeletonNotification() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
      <Skeleton width={48} height={48} borderRadius={24} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Skeleton width="70%" height={15} style={{ marginBottom: 4 }} />
        <Skeleton width="90%" height={14} borderRadius={3} style={{ marginBottom: 4 }} />
        <Skeleton width={60} height={12} borderRadius={3} />
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
        return <SkeletonNotification />;
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
