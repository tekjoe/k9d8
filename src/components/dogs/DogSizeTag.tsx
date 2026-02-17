import { StyleSheet, Text, View } from 'react-native';
import type { DogSize } from '@/src/types/database';

const SIZE_CONFIG: Record<DogSize, { label: string; color: string; background: string }> = {
  small: { label: 'S', color: '#166534', background: '#DCFCE7' },
  medium: { label: 'M', color: '#1E40AF', background: '#DBEAFE' },
  large: { label: 'L', color: '#9A3412', background: '#FFEDD5' },
  extra_large: { label: 'XL', color: '#991B1B', background: '#F5E8E3' },
};

interface DogSizeTagProps {
  size: DogSize;
}

export function DogSizeTag({ size }: DogSizeTagProps) {
  const config = SIZE_CONFIG[size];

  return (
    <View style={[styles.tag, { backgroundColor: config.background }]}>
      <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
});
