import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  ActivityIndicator,
  ScrollView,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DesktopSidebar from '@/src/components/ui/DesktopSidebar';
import { SEOHead } from '@/src/components/seo';
import { useAuth } from '@/src/hooks/useAuth';
import {
  getDogById,
  updateDog,
  deleteDog,
  uploadDogPhoto,
} from '@/src/services/dogs';
import { Colors } from '@/src/constants/colors';
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

interface OptionButtonProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

function OptionButton({ label, selected, onPress }: OptionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        height: 44,
        borderRadius: 8,
        borderWidth: selected ? 2 : 1.5,
        borderColor: selected ? '#3D8A5A' : '#E5E4E1',
        backgroundColor: selected ? 'rgba(45, 139, 87, 0.1)' : '#fff',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontSize: 14,
          fontWeight: selected ? '600' : '500',
          color: selected ? '#3D8A5A' : '#1A1918',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
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

export default function EditDogScreenWeb() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const showSidebar = width >= 768;

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
        // Don't allow deselecting all
        if (current.length === 1) return prev;
        return { ...prev, temperaments: current.filter((t) => t !== temp) };
      }
      return { ...prev, temperaments: [...current, temp] };
    });
  }, []);

  const pickPhoto = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      updateField('photoUri', result.assets[0].uri);
    }
  }, [updateField]);

  const handleSave = useCallback(async () => {
    if (!id || !userId || submitting) return;

    setSubmitting(true);
    try {
      let photoUrl: string | null | undefined;

      if (formData.photoUri && formData.photoUri !== dog?.photo_url) {
        photoUrl = await uploadDogPhoto(userId, formData.photoUri);
      }

      // Parse age from string like "3 years" to number
      const ageMatch = formData.age.match(/(\d+)/);
      const ageNum = ageMatch ? parseInt(ageMatch[1], 10) : null;

      // Parse weight from string like "65 lbs" to number
      const weightMatch = formData.weight.match(/(\d+)/);
      const weightNum = weightMatch ? parseInt(weightMatch[1], 10) : null;

      await updateDog(id, {
        name: formData.name,
        breed: formData.breed || null,
        size: formData.size,
        temperament: formData.temperaments, // All selected temperaments
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

    if (confirm('Are you sure you want to delete this dog profile? This action cannot be undone.')) {
      setDeleting(true);
      deleteDog(id)
        .then(() => router.back())
        .catch((error) => {
          const message = error instanceof Error ? error.message : 'Failed to delete dog';
          Alert.alert('Error', message);
        })
        .finally(() => setDeleting(false));
    }
  }, [id, deleting]);

  if (loading) {
    return (
      <>
      <SEOHead title="Dog Profile" description="View and manage your dog's profile on k9d8." url="/profile/dogs" />
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#F5F4F1' }}>
        {showSidebar && <DesktopSidebar />}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#3D8A5A" />
        </View>
      </View>
      </>
    );
  }

  if (!dog) {
    return (
      <>
      <SEOHead title="Dog Profile" description="View and manage your dog's profile on k9d8." url="/profile/dogs" />
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#F5F4F1' }}>
        {showSidebar && <DesktopSidebar />}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 16, color: '#6D6C6A' }}>Dog not found</Text>
        </View>
      </View>
      </>
    );
  }

  // Mobile Layout
  if (isMobile) {
    return (
      <>
      <SEOHead title="Dog Profile" description="View and manage your dog's profile on k9d8." url="/profile/dogs" />
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
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#1A1918' }}>Edit Dog Profile</Text>
          <Pressable onPress={handleSave} disabled={submitting}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#3D8A5A' }}>
              {submitting ? '...' : 'Save'}
            </Text>
          </Pressable>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, gap: 32 }}>
          {/* Avatar Section */}
          <View style={{ alignItems: 'center', gap: 16 }}>
            <Pressable onPress={pickPhoto}>
              <Image
                source={{
                  uri: formData.photoUri || 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop',
                }}
                style={{ width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: '#E5E4E1' }}
              />
            </Pressable>
            <Pressable
              onPress={pickPhoto}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#EDECEA',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8,
                gap: 6,
              }}
            >
              <Ionicons name="camera-outline" size={16} color="#6D6C6A" />
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#6D6C6A' }}>Change Photo</Text>
            </Pressable>
          </View>

          {/* Form Fields */}
          <View style={{ gap: 20 }}>
            <FormField label="Name">
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
                  <OptionButton
                    key={option.value}
                    label={option.label}
                    selected={formData.size === option.value}
                    onPress={() => updateField('size', option.value)}
                  />
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
                      borderWidth: formData.temperaments.includes(option.value) ? 2 : 1.5,
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
              marginTop: 32,
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
      </>
    );
  }

  // Desktop Layout
  return (
    <>
    <SEOHead title="Dog Profile" description="View and manage your dog's profile on k9d8." url="/profile/dogs" />
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
            <Text style={{ fontSize: 24, fontWeight: '600', color: '#1A1918' }}>Edit Dog Profile</Text>
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
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>Save Changes</Text>
              )}
            </Pressable>
          </View>
        </View>

        {/* Content */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 40 }}>
          <View style={{ flexDirection: 'row', gap: 40 }}>
            {/* Left Column - Avatar */}
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
                <Pressable onPress={pickPhoto}>
                  <Image
                    source={{
                      uri: formData.photoUri || 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop',
                    }}
                    style={{
                      width: 160,
                      height: 160,
                      borderRadius: 80,
                      borderWidth: 4,
                      borderColor: '#E5E4E1',
                    }}
                  />
                </Pressable>
                <Pressable
                  onPress={pickPhoto}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#EDECEA',
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderRadius: 8,
                    gap: 8,
                  }}
                >
                  <Ionicons name="camera-outline" size={16} color="#6D6C6A" />
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#6D6C6A' }}>Change Photo</Text>
                </Pressable>
              </View>
            </View>

            {/* Right Column - Form */}
            <View style={{ flex: 1, gap: 28 }}>
              {/* Form Grid */}
              <View style={{ gap: 24 }}>
                {/* Row 1: Name & Breed */}
                <View style={{ flexDirection: 'row', gap: 24 }}>
                  <View style={{ flex: 1 }}>
                    <FormField label="Name">
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
                      <OptionButton
                        key={option.value}
                        label={option.label}
                        selected={formData.size === option.value}
                        onPress={() => updateField('size', option.value)}
                      />
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
                          borderWidth: formData.temperaments.includes(option.value) ? 2 : 1.5,
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

                {/* Color */}
                <FormField label="Color">
                  <TextField value={formData.color} onChangeText={(v) => updateField('color', v)} placeholder="e.g. Golden" />
                </FormField>

                {/* Bio */}
                <FormField label="Bio">
                  <TextField
                    value={formData.bio}
                    onChangeText={(v) => updateField('bio', v)}
                    placeholder="Friendly and energetic golden retriever who loves playing fetch and swimming."
                    multiline
                    numberOfLines={4}
                  />
                </FormField>
              </View>

              {/* Delete Section */}
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 24 }}>
                <Pressable
                  onPress={handleDelete}
                  disabled={deleting}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#B5725E',
                    borderRadius: 24,
                    paddingHorizontal: 24,
                    paddingVertical: 14,
                    gap: 8,
                    opacity: deleting ? 0.6 : 1,
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
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
    </>
  );
}
