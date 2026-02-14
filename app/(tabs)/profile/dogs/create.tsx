import { Alert, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { useAuth } from '@/src/hooks/useAuth';
import { createDog, uploadDogPhoto } from '@/src/services/dogs';
import { DogForm, type DogFormData } from '@/src/components/dogs/DogForm';

export default function CreateDogScreen() {
  const { session } = useAuth();
  const userId = session?.user?.id;

  async function handleSubmit(data: DogFormData) {
    if (!userId) {
      Alert.alert('Error', 'You must be signed in to add a dog');
      return;
    }

    try {
      let photoUrl: string | null = null;

      if (data.photoUri) {
        photoUrl = await uploadDogPhoto(userId, data.photoUri);
      }

      await createDog({
        owner_id: userId,
        name: data.name,
        breed: data.breed || null,
        size: data.size,
        temperament: data.temperament, // Now an array
        age_years: data.age_years,
        photo_url: photoUrl,
        notes: data.notes || null,
        color: data.color,
        weight_lbs: data.weight_lbs,
      });

      router.back();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to create dog';
      Alert.alert('Error', message);
    }
  }

  return (
    <View style={styles.container}>
      <DogForm onSubmit={handleSubmit} submitLabel="Add Dog" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
