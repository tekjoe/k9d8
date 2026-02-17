import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { useAuth } from '@/src/hooks/useAuth';
import {
  getDogById,
  updateDog,
  deleteDog,
  uploadDogPhoto,
} from '@/src/services/dogs';
import { DogForm, type DogFormData } from '@/src/components/dogs/DogForm';
import type { Dog } from '@/src/types/database';

export default function EditDogScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [dog, setDog] = useState<Dog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const data = await getDogById(id);
        setDog(data);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to load dog';
        Alert.alert('Error', message);
        router.back();
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleSubmit(data: DogFormData) {
    if (!id || !userId) return;

    try {
      let photoUrl: string | null | undefined;

      if (data.photoUri && data.photoUri !== dog?.photo_url) {
        photoUrl = await uploadDogPhoto(userId, data.photoUri);
      }

      await updateDog(id, {
        name: data.name,
        breed: data.breed || null,
        size: data.size,
        temperament: data.temperament, // Now an array
        age_years: data.age_years,
        color: data.color,
        weight_lbs: data.weight_lbs,
        notes: data.notes || null,
        ...(photoUrl !== undefined ? { photo_url: photoUrl } : {}),
      });

      router.back();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to update dog';
      Alert.alert('Error', message);
    }
  }

  async function handleDelete() {
    if (!id) return;

    Alert.alert('Delete Dog', 'Are you sure you want to remove this dog?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDog(id);
            router.back();
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Failed to delete dog';
            Alert.alert('Error', message);
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3D8A5A" />
      </View>
    );
  }

  if (!dog) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Dog not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DogForm
        defaultValues={{
          name: dog.name,
          breed: dog.breed ?? '',
          size: dog.size,
          temperament: dog.temperament,
          age_years: dog.age_years,
          color: dog.color,
          weight_lbs: dog.weight_lbs,
          notes: dog.notes ?? '',
          photoUri: dog.photo_url,
        }}
        onSubmit={handleSubmit}
        submitLabel="Save Changes"
      />
      <Pressable style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteButtonText}>Delete Dog</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    fontSize: 16,
    color: '#6D6C6A',
  },
  deleteButton: {
    marginHorizontal: 24,
    marginBottom: 40,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#B5725E',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#B5725E',
    fontSize: 16,
    fontWeight: '600',
  },
});
