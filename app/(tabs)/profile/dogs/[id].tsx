import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/src/hooks/useAuth';
import {
  getDogById,
  updateDog,
  deleteDog,
  uploadDogPhoto,
} from '@/src/services/dogs';
import { Colors } from '@/src/constants/colors';
import { ImagePickerWithModeration } from '@/src/components/ImagePickerWithModeration';
import type { Dog, DogSize, DogTemperament } from '@/src/types/database';

const DOG_SIZES: { value: DogSize; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

const DOG_TEMPERAMENTS: { value: DogTemperament; label: string }[] = [
  { value: 'calm', label: 'Calm' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'energetic', label: 'Energetic' },
  { value: 'anxious', label: 'Anxious' },
  { value: 'aggressive', label: 'Aggressive' },
];

interface FormData {
  name: string;
  breed: string;
  age: string;
  size: DogSize;
  temperaments: DogTemperament[];
  color: string;
  weight: string;
  bio: string;
  photoUri: string | null;
}

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
}

function FormField({ label, children }: FormFieldProps) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#1A1918' }}>{label}</Text>
      {children}
    </View>
  );
}

export default function EditDogScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [dog, setDog] = useState<Dog | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    breed: '',
    age: '',
    size: 'medium',
    temperaments: ['friendly'],
    color: '',
    weight: '',
    bio: '',
    photoUri: null,
  });

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const data = await getDogById(id);
        setDog(data);
        setFormData({
          name: data.name,
          breed: data.breed ?? '',
          age: data.age_years != null ? `${data.age_years} years` : '',
          size: data.size,
          temperaments: data.temperament,
          color: data.color ?? '',
          weight: data.weight_lbs != null ? `${data.weight_lbs} lbs` : '',
          bio: data.notes ?? '',
          photoUri: data.photo_url,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load dog';
        Alert.alert('Error', message);
        router.back();
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const updateField = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleTemperament = useCallback((temp: DogTemperament) => {
    setFormData((prev) => {
      const current = prev.temperaments;
      if (current.includes(temp)) {
        if (current.length === 1) return prev;
        return { ...prev, temperaments: current.filter((t) => t !== temp) };
      }
      return { ...prev, temperaments: [...current, temp] };
    });
  }, []);

  const handlePhotoSelect = useCallback((uri: string) => {
    updateField('photoUri', uri);
  }, [updateField]);

  const handlePhotoRemove = useCallback(() => {
    updateField('photoUri', null);
  }, [updateField]);

  const handleSave = useCallback(async () => {
    if (!id || !userId || submitting) return;

    setSubmitting(true);
    try {
      let photoUrl: string | null | undefined;

      if (formData.photoUri && formData.photoUri !== dog?.photo_url) {
        photoUrl = await uploadDogPhoto(userId, formData.photoUri);
      }

      const ageMatch = formData.age.match(/(\d+)/);
      const ageNum = ageMatch ? parseInt(ageMatch[1], 10) : null;

      const weightMatch = formData.weight.match(/(\d+)/);
      const weightNum = weightMatch ? parseInt(weightMatch[1], 10) : null;

      await updateDog(id, {
        name: formData.name,
        breed: formData.breed || null,
        size: formData.size,
        temperament: formData.temperaments,
        age_years: ageNum,
        color: formData.color || null,
        weight_lbs: weightNum,
        notes: formData.bio || null,
        ...(photoUrl !== undefined ? { photo_url: photoUrl } : {}),
      });

      router.back();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update dog';
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  }, [id, userId, formData, dog, submitting]);

  const handleCancel = useCallback(() => {
    router.back();
  }, []);

  const handleDelete = useCallback(() => {
    if (!id || deleting) return;

    Alert.alert(
      'Delete Dog Profile',
      'Are you sure you want to delete this dog profile? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setDeleting(true);
            deleteDog(id)
              .then(() => router.back())
              .catch((error) => {
                const message = error instanceof Error ? error.message : 'Failed to delete dog';
                Alert.alert('Error', message);
              })
              .finally(() => setDeleting(false));
          },
        },
      ]
    );
  }, [id, deleting]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F4F1' }}>
        <ActivityIndicator size="large" color="#3D8A5A" />
      </View>
    );
  }

  if (!dog) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F4F1' }}>
        <Text style={{ fontSize: 16, color: '#6D6C6A' }}>Dog not found</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F4F1' }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#fff',
          paddingTop: insets.top + 8,
          paddingBottom: 8,
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#E5E4E1',
        }}
      >
        <Pressable onPress={handleCancel} style={{ width: 40, height: 40, justifyContent: 'center' }}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </Pressable>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#1A1918' }}>Edit Dog Profile</Text>
        <Pressable onPress={handleSave} disabled={submitting}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#3D8A5A' }}>
            {submitting ? '...' : 'Save'}
          </Text>
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, gap: 32 }}>
        {/* Avatar Section with Moderation */}
        <View style={{ alignItems: 'center', gap: 16 }}>
          <ImagePickerWithModeration
            selectedImage={formData.photoUri}
            onImageSelect={handlePhotoSelect}
            onImageRemove={handlePhotoRemove}
            placeholder="Add Dog Photo"
            size="large"
            shape="circle"
            moderationEnabled={true}
          />
        </View>

        {/* Form Fields */}
        <View style={{ gap: 20 }}>
          <FormField label="Name">
            <TextInput
              value={formData.name}
              onChangeText={(v) => updateField('name', v)}
              placeholder="Dog's name"
              style={{
                borderWidth: 1,
                borderColor: '#E5E4E1',
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 15,
              }}
            />
          </FormField>

          <FormField label="Breed">
            <TextInput
              value={formData.breed}
              onChangeText={(v) => updateField('breed', v)}
              placeholder="e.g. Golden Retriever"
              style={{
                borderWidth: 1,
                borderColor: '#E5E4E1',
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 15,
              }}
            />
          </FormField>

          <FormField label="Age">
            <TextInput
              value={formData.age}
              onChangeText={(v) => updateField('age', v)}
              placeholder="e.g. 3 years"
              style={{
                borderWidth: 1,
                borderColor: '#E5E4E1',
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 15,
              }}
            />
          </FormField>

          <FormField label="Size">
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {DOG_SIZES.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => updateField('size', option.value)}
                  style={{
                    flex: 1,
                    height: 44,
                    borderRadius: 8,
                    borderWidth: formData.size === option.value ? 2 : 1,
                    borderColor: formData.size === option.value ? '#3D8A5A' : '#E5E4E1',
                    backgroundColor: formData.size === option.value ? 'rgba(45, 139, 87, 0.1)' : '#fff',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: formData.size === option.value ? '600' : '500',
                      color: formData.size === option.value ? '#3D8A5A' : '#1A1918',
                    }}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </FormField>

          <FormField label="Temperament">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {DOG_TEMPERAMENTS.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => toggleTemperament(option.value)}
                  style={{
                    height: 44,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                    borderWidth: formData.temperaments.includes(option.value) ? 2 : 1,
                    borderColor: formData.temperaments.includes(option.value) ? '#3D8A5A' : '#E5E4E1',
                    backgroundColor: formData.temperaments.includes(option.value) ? 'rgba(45, 139, 87, 0.1)' : '#fff',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: formData.temperaments.includes(option.value) ? '600' : '500',
                      color: formData.temperaments.includes(option.value) ? '#3D8A5A' : '#1A1918',
                    }}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </FormField>

          <FormField label="Color">
            <TextInput
              value={formData.color}
              onChangeText={(v) => updateField('color', v)}
              placeholder="e.g. Golden"
              style={{
                borderWidth: 1,
                borderColor: '#E5E4E1',
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 15,
              }}
            />
          </FormField>

          <FormField label="Weight">
            <TextInput
              value={formData.weight}
              onChangeText={(v) => updateField('weight', v)}
              placeholder="e.g. 65 lbs"
              style={{
                borderWidth: 1,
                borderColor: '#E5E4E1',
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 15,
              }}
            />
          </FormField>

          <FormField label="Bio">
            <TextInput
              value={formData.bio}
              onChangeText={(v) => updateField('bio', v)}
              placeholder="Tell us about your dog..."
              multiline
              numberOfLines={4}
              style={{
                borderWidth: 1,
                borderColor: '#E5E4E1',
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 15,
                minHeight: 100,
                textAlignVertical: 'top',
              }}
            />
          </FormField>
        </View>

        {/* Delete Button */}
        <Pressable
          onPress={handleDelete}
          disabled={deleting}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#B5725E',
            borderRadius: 8,
            height: 48,
            gap: 8,
            marginTop: 16,
          }}
        >
          {deleting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="trash-outline" size={18} color="#fff" />
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff' }}>Delete Dog Profile</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}
