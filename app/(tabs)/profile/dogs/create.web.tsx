import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DesktopSidebar from '@/src/components/ui/DesktopSidebar';
import { SEOHead } from '@/src/components/seo';
import { useAuth } from '@/src/hooks/useAuth';
import { createDog, uploadDogPhoto } from '@/src/services/dogs';
import { Colors } from '@/src/constants/colors';
import { ImagePickerWithModeration } from '@/src/components/ImagePickerWithModeration';
import type { DogSize, DogTemperament } from '@/src/types/database';

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
  temperament: DogTemperament[];
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

interface TextFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
}

function TextField({ value, onChangeText, placeholder, multiline, numberOfLines }: TextFieldProps) {
  return (
    <View
      style={{
        borderWidth: 1.5,
        borderColor: '#E5E4E1',
        borderRadius: 8,
        backgroundColor: '#fff',
        minHeight: multiline ? 120 : 48,
        paddingHorizontal: 16,
        paddingVertical: multiline ? 12 : 0,
        justifyContent: multiline ? 'flex-start' : 'center',
      }}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#878685"
        multiline={multiline}
        numberOfLines={numberOfLines}
        style={{
          fontSize: 15,
          color: '#1A1918',
          outlineWidth: 0,
          ...(multiline ? { textAlignVertical: 'top', minHeight: 96 } : {}),
        } as any}
      />
    </View>
  );
}

export default function CreateDogScreenWeb() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const showSidebar = width >= 768;

  const { session } = useAuth();
  const userId = session?.user?.id;

  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    breed: '',
    age: '',
    size: 'medium',
    temperament: ['friendly'],
    color: '',
    weight: '',
    bio: '',
    photoUri: null,
  });

  const updateField = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleTemperament = useCallback((temp: DogTemperament) => {
    setFormData((prev) => {
      const current = prev.temperament;
      if (current.includes(temp)) {
        if (current.length === 1) return prev;
        return { ...prev, temperament: current.filter((t) => t !== temp) };
      }
      return { ...prev, temperament: [...current, temp] };
    });
  }, []);

  const handlePhotoSelect = useCallback((uri: string) => {
    updateField('photoUri', uri);
  }, [updateField]);

  const handlePhotoRemove = useCallback(() => {
    updateField('photoUri', null);
  }, [updateField]);

  const handleSave = useCallback(async () => {
    if (!userId || submitting) return;

    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a name for your dog');
      return;
    }

    setSubmitting(true);
    try {
      let photoUrl: string | null = null;

      if (formData.photoUri) {
        photoUrl = await uploadDogPhoto(userId, formData.photoUri);
      }

      // Parse age from string like "3 years" to number
      const ageMatch = formData.age.match(/(\d+)/);
      const ageNum = ageMatch ? parseInt(ageMatch[1], 10) : null;

      // Parse weight from string like "65 lbs" to number
      const weightMatch = formData.weight.match(/(\d+)/);
      const weightNum = weightMatch ? parseInt(weightMatch[1], 10) : null;

      await createDog({
        owner_id: userId,
        name: formData.name,
        breed: formData.breed || null,
        size: formData.size,
        temperament: formData.temperament,
        age_years: ageNum,
        color: formData.color || null,
        weight_lbs: weightNum,
        photo_url: photoUrl,
        notes: formData.bio || null,
      });

      router.back();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add dog';
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  }, [userId, formData, submitting]);

  const handleCancel = useCallback(() => {
    router.back();
  }, []);

  // Mobile Layout
  if (isMobile) {
    return (
      <>
      <SEOHead title="Add a Dog" description="Add a new dog to your k9d8 profile." url="/profile/dogs/create" />
      <View style={{ flex: 1, backgroundColor: '#F5F4F1' }}>
        {/* Mobile Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#fff',
            height: 56,
            paddingHorizontal: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#E5E4E1',
          }}
        >
          <Pressable onPress={handleCancel} style={{ width: 40, height: 40, justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          </Pressable>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#1A1918' }}>Add Dog</Text>
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
            <FormField label="Name *">
              <TextField value={formData.name} onChangeText={(v) => updateField('name', v)} placeholder="Dog's name" />
            </FormField>

            <FormField label="Breed">
              <TextField value={formData.breed} onChangeText={(v) => updateField('breed', v)} placeholder="e.g. Golden Retriever" />
            </FormField>

            <FormField label="Age">
              <TextField value={formData.age} onChangeText={(v) => updateField('age', v)} placeholder="e.g. 3 years" />
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
                      borderWidth: formData.size === option.value ? 2 : 1.5,
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
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {DOG_TEMPERAMENTS.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => toggleTemperament(option.value)}
                    style={{
                      height: 44,
                      paddingHorizontal: 16,
                      borderRadius: 8,
                      borderWidth: formData.temperament.includes(option.value) ? 2 : 1.5,
                      borderColor: formData.temperament.includes(option.value) ? '#3D8A5A' : '#E5E4E1',
                      backgroundColor: formData.temperament.includes(option.value) ? 'rgba(45, 139, 87, 0.1)' : '#fff',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: formData.temperament.includes(option.value) ? '600' : '500',
                        color: formData.temperament.includes(option.value) ? '#3D8A5A' : '#1A1918',
                      }}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </FormField>

            <FormField label="Color">
              <TextField value={formData.color} onChangeText={(v) => updateField('color', v)} placeholder="e.g. Golden" />
            </FormField>

            <FormField label="Weight">
              <TextField value={formData.weight} onChangeText={(v) => updateField('weight', v)} placeholder="e.g. 65 lbs" />
            </FormField>

            <FormField label="Bio">
              <TextField
                value={formData.bio}
                onChangeText={(v) => updateField('bio', v)}
                placeholder="Tell us about your dog..."
                multiline
                numberOfLines={4}
              />
            </FormField>
          </View>
        </ScrollView>
      </View>
      </>
    );
  }

  // Desktop Layout
  return (
    <>
    <SEOHead title="Add a Dog" description="Add a new dog to your k9d8 profile." url="/profile/dogs/create" />
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#F5F4F1' }}>
      {showSidebar && <DesktopSidebar />}

      <View style={{ flex: 1, flexDirection: 'column' }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#fff',
            paddingVertical: 24,
            paddingHorizontal: 40,
            borderBottomWidth: 1,
            borderBottomColor: '#E5E4E1',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <Pressable
              onPress={handleCancel}
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                backgroundColor: '#EDECEA',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
            </Pressable>
            <Text style={{ fontSize: 24, fontWeight: '600', color: '#1A1918' }}>Add Dog</Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable
              onPress={handleCancel}
              style={{
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 8,
                borderWidth: 1.5,
                borderColor: '#E5E4E1',
                backgroundColor: '#fff',
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#1A1918' }}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={submitting}
              style={{
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 8,
                backgroundColor: '#3D8A5A',
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>Add Dog</Text>
              )}
            </Pressable>
          </View>
        </View>

        {/* Content */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 40 }}>
          <View style={{ flexDirection: 'row', gap: 40 }}>
            {/* Left Column - Avatar with Moderation */}
            <View style={{ width: 400 }}>
              <View
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: '#E5E4E1',
                  padding: 32,
                  alignItems: 'center',
                  gap: 20,
                }}
              >
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
            </View>

            {/* Right Column - Form */}
            <View style={{ flex: 1, gap: 28 }}>
              {/* Form Grid */}
              <View style={{ gap: 24 }}>
                {/* Row 1: Name & Breed */}
                <View style={{ flexDirection: 'row', gap: 24 }}>
                  <View style={{ flex: 1 }}>
                    <FormField label="Name *">
                      <TextField value={formData.name} onChangeText={(v) => updateField('name', v)} placeholder="Dog's name" />
                    </FormField>
                  </View>
                  <View style={{ flex: 1 }}>
                    <FormField label="Breed">
                      <TextField value={formData.breed} onChangeText={(v) => updateField('breed', v)} placeholder="e.g. Golden Retriever" />
                    </FormField>
                  </View>
                </View>

                {/* Row 2: Age & Weight */}
                <View style={{ flexDirection: 'row', gap: 24 }}>
                  <View style={{ flex: 1 }}>
                    <FormField label="Age">
                      <TextField value={formData.age} onChangeText={(v) => updateField('age', v)} placeholder="e.g. 3 years" />
                    </FormField>
                  </View>
                  <View style={{ flex: 1 }}>
                    <FormField label="Weight">
                      <TextField value={formData.weight} onChangeText={(v) => updateField('weight', v)} placeholder="e.g. 65 lbs" />
                    </FormField>
                  </View>
                </View>

                {/* Size */}
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
                          borderWidth: formData.size === option.value ? 2 : 1.5,
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

                {/* Temperament */}
                <FormField label="Temperament">
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8 }}
                  >
                    {DOG_TEMPERAMENTS.map((option) => (
                      <Pressable
                        key={option.value}
                        onPress={() => toggleTemperament(option.value)}
                        style={{
                          height: 44,
                          paddingHorizontal: 16,
                          borderRadius: 8,
                          borderWidth: formData.temperament.includes(option.value) ? 2 : 1.5,
                          borderColor: formData.temperament.includes(option.value) ? '#3D8A5A' : '#E5E4E1',
                          backgroundColor: formData.temperament.includes(option.value) ? 'rgba(45, 139, 87, 0.1)' : '#fff',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: formData.temperament.includes(option.value) ? '600' : '500',
                            color: formData.temperament.includes(option.value) ? '#3D8A5A' : '#1A1918',
                          }}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </FormField>

                {/* Color */}
                <FormField label="Color">
                  <TextField value={formData.color} onChangeText={(v) => updateField('color', v)} placeholder="e.g. Golden" />
                </FormField>

                {/* Bio */}
                <FormField label="Bio">
                  <TextField
                    value={formData.bio}
                    onChangeText={(v) => updateField('bio', v)}
                    placeholder="Tell us about your dog..."
                    multiline
                    numberOfLines={4}
                  />
                </FormField>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
    </>
  );
}
