import { useState, useCallback } from 'react';
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
import { ImagePickerWithModeration } from '@/src/components/ImagePickerWithModeration';
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

export interface DogFormData {
  name: string;
  breed: string;
  size: DogSize;
  temperament: DogTemperament[];
  age_years: number | null;
  color: string | null;
  weight_lbs: number | null;
  notes: string;
  photoUri: string | null;
}

interface FormState {
  name: string;
  breed: string;
  age: string;
  size: DogSize;
  temperaments: DogTemperament[];
  color: string;
  weight: string;
  notes: string;
  photoUri: string | null;
}

interface DogFormProps {
  defaultValues?: Partial<DogFormData>;
  onSubmit: (data: DogFormData) => Promise<void>;
  submitLabel?: string;
}

export function DogForm({ defaultValues, onSubmit, submitLabel = 'Save' }: DogFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formState, setFormState] = useState<FormState>({
    name: defaultValues?.name ?? '',
    breed: defaultValues?.breed ?? '',
    age: defaultValues?.age_years != null ? String(defaultValues.age_years) : '',
    size: defaultValues?.size ?? 'medium',
    temperaments: defaultValues?.temperament?.length ? defaultValues.temperament : ['friendly'],
    color: defaultValues?.color ?? '',
    weight: defaultValues?.weight_lbs != null ? String(defaultValues.weight_lbs) : '',
    notes: defaultValues?.notes ?? '',
    photoUri: defaultValues?.photoUri ?? null,
  });

  const updateField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleTemperament = useCallback((temp: DogTemperament) => {
    setFormState((prev) => {
      const current = prev.temperaments;
      if (current.includes(temp)) {
        // Don't allow deselecting all
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

  const handleSubmit = useCallback(async () => {
    if (!formState.name.trim()) {
      setError('Name is required');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const ageNum = formState.age ? parseInt(formState.age, 10) : null;
      const weightNum = formState.weight ? parseInt(formState.weight, 10) : null;

      await onSubmit({
        name: formState.name.trim(),
        breed: formState.breed.trim(),
        size: formState.size,
        temperament: formState.temperaments, // All selected temperaments
        age_years: ageNum && !Number.isNaN(ageNum) ? ageNum : null,
        color: formState.color.trim() || null,
        weight_lbs: weightNum && !Number.isNaN(weightNum) ? weightNum : null,
        notes: formState.notes.trim(),
        photoUri: formState.photoUri,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  }, [formState, onSubmit]);

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
        {/* Photo Picker with Moderation */}
        <View style={styles.photoContainer}>
          <ImagePickerWithModeration
            selectedImage={formState.photoUri}
            onImageSelect={handlePhotoSelect}
            onImageRemove={handlePhotoRemove}
            placeholder="Add Dog Photo"
            size="large"
            shape="circle"
            moderationEnabled={true}
          />
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Name Field */}
        <View style={styles.field}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Dog's name"
            placeholderTextColor="#878685"
            value={formState.name}
            onChangeText={(v) => updateField('name', v)}
            autoCapitalize="words"
          />
        </View>

        {/* Breed Field */}
        <View style={styles.field}>
          <Text style={styles.label}>Breed</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Golden Retriever"
            placeholderTextColor="#878685"
            value={formState.breed}
            onChangeText={(v) => updateField('breed', v)}
            autoCapitalize="words"
          />
        </View>

        {/* Age Field */}
        <View style={styles.field}>
          <Text style={styles.label}>Age (years)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 3"
            placeholderTextColor="#878685"
            value={formState.age}
            onChangeText={(v) => updateField('age', v)}
            keyboardType="number-pad"
          />
        </View>

        {/* Size Selector */}
        <View style={styles.field}>
          <Text style={styles.label}>Size</Text>
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
                  formState.size === option.value && styles.chipSelected,
                ]}
                onPress={() => updateField('size', option.value)}
              >
                <Text
                  style={[
                    styles.chipText,
                    formState.size === option.value && styles.chipTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Temperament Multi-Select */}
        <View style={styles.field}>
          <Text style={styles.label}>Temperament (select all that apply)</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {DOG_TEMPERAMENTS.map((option) => {
              const isSelected = formState.temperaments.includes(option.value);
              return (
                <Pressable
                  key={option.value}
                  style={[
                    styles.chip,
                    isSelected && styles.chipSelected,
                  ]}
                  onPress={() => toggleTemperament(option.value)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      isSelected && styles.chipTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Color Field */}
        <View style={styles.field}>
          <Text style={styles.label}>Color</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Golden, Black, White"
            placeholderTextColor="#878685"
            value={formState.color}
            onChangeText={(v) => updateField('color', v)}
            autoCapitalize="words"
          />
        </View>

        {/* Weight Field */}
        <View style={styles.field}>
          <Text style={styles.label}>Weight (lbs)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 65"
            placeholderTextColor="#878685"
            value={formState.weight}
            onChangeText={(v) => updateField('weight', v)}
            keyboardType="number-pad"
          />
        </View>

        {/* Notes Field */}
        <View style={styles.field}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any special notes about your dog..."
            placeholderTextColor="#878685"
            value={formState.notes}
            onChangeText={(v) => updateField('notes', v)}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Submit Button */}
        <Pressable
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
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
  photoContainer: {
    alignSelf: 'center',
    marginBottom: 24,
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
    backgroundColor: '#EDECEA',
    borderWidth: 2,
    borderColor: '#E5E4E1',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderIcon: {
    fontSize: 28,
    color: '#878685',
    fontWeight: '300',
  },
  photoPlaceholderText: {
    fontSize: 12,
    color: '#878685',
    marginTop: 2,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1918',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E4E1',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#F5F4F1',
    color: '#1A1918',
  },
  textArea: {
    minHeight: 100,
  },
  errorContainer: {
    backgroundColor: '#F5E8E3',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#EDECEA',
    borderWidth: 1,
    borderColor: '#E5E4E1',
  },
  chipSelected: {
    backgroundColor: '#3D8A5A',
    borderColor: '#3D8A5A',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6D6C6A',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: '#3D8A5A',
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
