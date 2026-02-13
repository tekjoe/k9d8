import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { DogSize, DogTemperament } from '@/src/types/database';

const DOG_SIZES: { value: DogSize; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'extra_large', label: 'XL' },
];

const DOG_TEMPERAMENTS: { value: DogTemperament; label: string }[] = [
  { value: 'calm', label: 'Calm' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'energetic', label: 'Energetic' },
  { value: 'anxious', label: 'Anxious' },
  { value: 'aggressive', label: 'Aggressive' },
];

const dogFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  breed: z.string().max(100).optional().default(''),
  size: z.enum(['small', 'medium', 'large', 'extra_large']),
  temperament: z.enum(['calm', 'friendly', 'energetic', 'anxious', 'aggressive']),
  age_years: z.string().optional().default(''),
  notes: z.string().max(500).optional().default(''),
});

type DogFormValues = z.infer<typeof dogFormSchema>;

export interface DogFormData {
  name: string;
  breed: string;
  size: DogSize;
  temperament: DogTemperament;
  age_years: number | null;
  notes: string;
  photoUri: string | null;
}

interface DogFormProps {
  defaultValues?: Partial<DogFormData>;
  onSubmit: (data: DogFormData) => Promise<void>;
  submitLabel?: string;
}

export function DogForm({ defaultValues, onSubmit, submitLabel = 'Save' }: DogFormProps) {
  const [photoUri, setPhotoUri] = useState<string | null>(
    defaultValues?.photoUri ?? null,
  );
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DogFormValues>({
    resolver: zodResolver(dogFormSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      breed: defaultValues?.breed ?? '',
      size: defaultValues?.size ?? 'medium',
      temperament: defaultValues?.temperament ?? 'friendly',
      age_years: defaultValues?.age_years != null ? String(defaultValues.age_years) : '',
      notes: defaultValues?.notes ?? '',
    },
  });

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function onFormSubmit(values: DogFormValues) {
    setSubmitting(true);
    try {
      const ageNum = values.age_years ? parseInt(values.age_years, 10) : null;
      await onSubmit({
        name: values.name,
        breed: values.breed ?? '',
        size: values.size,
        temperament: values.temperament,
        age_years: Number.isNaN(ageNum) ? null : ageNum,
        notes: values.notes ?? '',
        photoUri,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.flex}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable style={styles.photoPicker} onPress={pickPhoto}>
          {photoUri ? (
            <Image
              source={{ uri: photoUri }}
              style={styles.photoPreview}
              contentFit="cover"
            />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoPlaceholderIcon}>+</Text>
              <Text style={styles.photoPlaceholderText}>Add Photo</Text>
            </View>
          )}
        </Pressable>

        <View style={styles.field}>
          <Text style={styles.label}>Name *</Text>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                placeholder="Dog's name"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="words"
              />
            )}
          />
          {errors.name ? (
            <Text style={styles.errorText}>{errors.name.message}</Text>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Breed</Text>
          <Controller
            control={control}
            name="breed"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="e.g. Golden Retriever"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="words"
              />
            )}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Size</Text>
          <Controller
            control={control}
            name="size"
            render={({ field: { onChange, value } }) => (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
              >
                {DOG_SIZES.map((option) => (
                  <Pressable
                    key={option.value}
                    style={[
                      styles.chip,
                      value === option.value && styles.chipSelected,
                    ]}
                    onPress={() => onChange(option.value)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        value === option.value && styles.chipTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Temperament</Text>
          <Controller
            control={control}
            name="temperament"
            render={({ field: { onChange, value } }) => (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
              >
                {DOG_TEMPERAMENTS.map((option) => (
                  <Pressable
                    key={option.value}
                    style={[
                      styles.chip,
                      value === option.value && styles.chipSelected,
                    ]}
                    onPress={() => onChange(option.value)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        value === option.value && styles.chipTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Age (years)</Text>
          <Controller
            control={control}
            name="age_years"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="e.g. 3"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="number-pad"
              />
            )}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Notes</Text>
          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Any special notes about your dog..."
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            )}
          />
        </View>

        <Pressable
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit(onFormSubmit)}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>{submitLabel}</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  photoPicker: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderIcon: {
    fontSize: 28,
    color: '#9CA3AF',
    fontWeight: '300',
  },
  photoPlaceholderText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#F7F8FA',
    color: '#1A1A2E',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  textArea: {
    minHeight: 100,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipSelected: {
    backgroundColor: '#4A90D9',
    borderColor: '#4A90D9',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: '#4A90D9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
