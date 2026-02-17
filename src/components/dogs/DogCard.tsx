import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import type { Dog } from '@/src/types/database';
import { DogSizeTag } from './DogSizeTag';

const TEMPERAMENT_LABELS: Record<string, string> = {
  calm: 'Calm',
  friendly: 'Friendly',
  energetic: 'Energetic',
  anxious: 'Anxious',
  aggressive: 'Aggressive',
};

interface DogCardProps {
  dog: Dog;
  onPress?: () => void;
}

export function DogCard({ dog, onPress }: DogCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.photoContainer}>
        {dog.photo_url ? (
          <Image
            source={{ uri: dog.photo_url }}
            style={styles.photo}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>
              {dog.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {dog.name}
        </Text>
        {dog.breed ? (
          <Text style={styles.breed} numberOfLines={1}>
            {dog.breed}
          </Text>
        ) : null}
        <View style={styles.tags}>
          <DogSizeTag size={dog.size} />
          <View style={styles.temperamentTag}>
            <Text style={styles.temperamentText}>
              {dog.temperament.map((t) => TEMPERAMENT_LABELS[t] ?? t).join(', ')}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E4E1',
    marginBottom: 12,
  },
  cardPressed: {
    opacity: 0.7,
    backgroundColor: '#F5F4F1',
  },
  photoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#EDECEA',
  },
  photo: {
    width: 64,
    height: 64,
  },
  placeholder: {
    width: 64,
    height: 64,
    backgroundColor: '#3D8A5A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1918',
  },
  breed: {
    fontSize: 13,
    color: '#6D6C6A',
    marginTop: 2,
  },
  tags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  temperamentTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#EDECEA',
  },
  temperamentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6D6C6A',
  },
});
