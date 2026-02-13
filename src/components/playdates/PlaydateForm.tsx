import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import type { Park } from '@/src/types/database';

const playdateFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional().default(''),
  park_id: z.string().min(1, 'Please select a park'),
  starts_at: z.date({ required_error: 'Start time is required' }),
  ends_at: z.date({ required_error: 'End time is required' }),
  max_dogs: z.string().optional().default(''),
}).refine(
  (data) => data.ends_at > data.starts_at,
  { message: 'End time must be after start time', path: ['ends_at'] },
);

type PlaydateFormValues = z.infer<typeof playdateFormSchema>;

export interface PlaydateFormData {
  title: string;
  description: string;
  park_id: string;
  starts_at: Date;
  ends_at: Date;
  max_dogs: number | null;
}

interface PlaydateFormProps {
  parks: Park[];
  defaultValues?: Partial<PlaydateFormData>;
  onSubmit: (data: PlaydateFormData) => Promise<void>;
  submitLabel?: string;
}

export function PlaydateForm({
  parks,
  defaultValues,
  onSubmit,
  submitLabel = 'Create Play Date',
}: PlaydateFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [showParkPicker, setShowParkPicker] = useState(false);
  const [showStartDate, setShowStartDate] = useState(false);
  const [showStartTime, setShowStartTime] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);
  const [showEndTime, setShowEndTime] = useState(false);

  const defaultStart = defaultValues?.starts_at ?? new Date();
  const defaultEnd =
    defaultValues?.ends_at ??
    new Date(defaultStart.getTime() + 2 * 60 * 60 * 1000);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PlaydateFormValues>({
    resolver: zodResolver(playdateFormSchema),
    defaultValues: {
      title: defaultValues?.title ?? '',
      description: defaultValues?.description ?? '',
      park_id: defaultValues?.park_id ?? '',
      starts_at: defaultStart,
      ends_at: defaultEnd,
      max_dogs:
        defaultValues?.max_dogs != null
          ? String(defaultValues.max_dogs)
          : '',
    },
  });

  const selectedParkId = watch('park_id');
  const selectedPark = parks.find((p) => p.id === selectedParkId);
  const startsAt = watch('starts_at');
  const endsAt = watch('ends_at');

  async function onFormSubmit(values: PlaydateFormValues) {
    setSubmitting(true);
    try {
      const maxDogsNum = values.max_dogs
        ? parseInt(values.max_dogs, 10)
        : null;
      await onSubmit({
        title: values.title,
        description: values.description ?? '',
        park_id: values.park_id,
        starts_at: values.starts_at,
        ends_at: values.ends_at,
        max_dogs: Number.isNaN(maxDogsNum) ? null : maxDogsNum,
      });
    } finally {
      setSubmitting(false);
    }
  }

  const isWeb = Platform.OS === 'web';

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
        {/* Title */}
        <View style={styles.field}>
          <Text style={styles.label}>Title *</Text>
          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.title && styles.inputError]}
                placeholder="e.g. Weekend Puppy Meetup"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="words"
              />
            )}
          />
          {errors.title && (
            <Text style={styles.errorText}>{errors.title.message}</Text>
          )}
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Tell others what to expect..."
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

        {/* Park Picker */}
        <View style={styles.field}>
          <Text style={styles.label}>Park *</Text>
          <Pressable
            style={[styles.input, styles.pickerButton, errors.park_id && styles.inputError]}
            onPress={() => setShowParkPicker(true)}
          >
            <Text
              style={[
                styles.pickerButtonText,
                !selectedPark && styles.placeholderText,
              ]}
            >
              {selectedPark ? selectedPark.name : 'Select a park'}
            </Text>
          </Pressable>
          {errors.park_id && (
            <Text style={styles.errorText}>{errors.park_id.message}</Text>
          )}
        </View>

        {/* Park Selection Modal */}
        <Modal
          visible={showParkPicker}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowParkPicker(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select a Park</Text>
              <Pressable onPress={() => setShowParkPicker(false)}>
                <Text style={styles.modalClose}>Done</Text>
              </Pressable>
            </View>
            <ScrollView style={styles.flex}>
              {parks.map((park) => (
                <Pressable
                  key={park.id}
                  style={[
                    styles.parkOption,
                    park.id === selectedParkId && styles.parkOptionSelected,
                  ]}
                  onPress={() => {
                    setValue('park_id', park.id, { shouldValidate: true });
                    setShowParkPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.parkOptionText,
                      park.id === selectedParkId &&
                        styles.parkOptionTextSelected,
                    ]}
                  >
                    {park.name}
                  </Text>
                  {park.address && (
                    <Text style={styles.parkOptionAddress} numberOfLines={1}>
                      {park.address}
                    </Text>
                  )}
                </Pressable>
              ))}
              {parks.length === 0 && (
                <Text style={styles.emptyText}>No parks available</Text>
              )}
            </ScrollView>
          </View>
        </Modal>

        {/* Starts At */}
        <View style={styles.field}>
          <Text style={styles.label}>Starts At *</Text>
          {isWeb ? (
            <Controller
              control={control}
              name="starts_at"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[styles.input, errors.starts_at && styles.inputError]}
                  // @ts-expect-error -- web-only prop for datetime-local input
                  type="datetime-local"
                  value={toDatetimeLocalString(value)}
                  onChange={(e: any) => {
                    const newDate = new Date(e.target.value);
                    if (!isNaN(newDate.getTime())) {
                      onChange(newDate);
                    }
                  }}
                />
              )}
            />
          ) : (
            <>
              <Pressable
                style={[styles.input, styles.pickerButton, errors.starts_at && styles.inputError]}
                onPress={() => setShowStartDate(true)}
              >
                <Text style={styles.pickerButtonText}>
                  {format(startsAt, 'EEE, MMM d, yyyy  h:mm a')}
                </Text>
              </Pressable>
              {showStartDate && (
                <DateTimePicker
                  value={startsAt}
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
                  onChange={(_event, date) => {
                    setShowStartDate(false);
                    if (date) {
                      const merged = new Date(startsAt);
                      merged.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                      setValue('starts_at', merged, { shouldValidate: true });
                      setShowStartTime(true);
                    }
                  }}
                />
              )}
              {showStartTime && (
                <DateTimePicker
                  value={startsAt}
                  mode="time"
                  display="default"
                  onChange={(_event, date) => {
                    setShowStartTime(false);
                    if (date) {
                      const merged = new Date(startsAt);
                      merged.setHours(date.getHours(), date.getMinutes());
                      setValue('starts_at', merged, { shouldValidate: true });
                    }
                  }}
                />
              )}
            </>
          )}
          {errors.starts_at && (
            <Text style={styles.errorText}>{errors.starts_at.message}</Text>
          )}
        </View>

        {/* Ends At */}
        <View style={styles.field}>
          <Text style={styles.label}>Ends At *</Text>
          {isWeb ? (
            <Controller
              control={control}
              name="ends_at"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[styles.input, errors.ends_at && styles.inputError]}
                  // @ts-expect-error -- web-only prop for datetime-local input
                  type="datetime-local"
                  value={toDatetimeLocalString(value)}
                  onChange={(e: any) => {
                    const newDate = new Date(e.target.value);
                    if (!isNaN(newDate.getTime())) {
                      onChange(newDate);
                    }
                  }}
                />
              )}
            />
          ) : (
            <>
              <Pressable
                style={[styles.input, styles.pickerButton, errors.ends_at && styles.inputError]}
                onPress={() => setShowEndDate(true)}
              >
                <Text style={styles.pickerButtonText}>
                  {format(endsAt, 'EEE, MMM d, yyyy  h:mm a')}
                </Text>
              </Pressable>
              {showEndDate && (
                <DateTimePicker
                  value={endsAt}
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
                  onChange={(_event, date) => {
                    setShowEndDate(false);
                    if (date) {
                      const merged = new Date(endsAt);
                      merged.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                      setValue('ends_at', merged, { shouldValidate: true });
                      setShowEndTime(true);
                    }
                  }}
                />
              )}
              {showEndTime && (
                <DateTimePicker
                  value={endsAt}
                  mode="time"
                  display="default"
                  onChange={(_event, date) => {
                    setShowEndTime(false);
                    if (date) {
                      const merged = new Date(endsAt);
                      merged.setHours(date.getHours(), date.getMinutes());
                      setValue('ends_at', merged, { shouldValidate: true });
                    }
                  }}
                />
              )}
            </>
          )}
          {errors.ends_at && (
            <Text style={styles.errorText}>{errors.ends_at.message}</Text>
          )}
        </View>

        {/* Max Dogs */}
        <View style={styles.field}>
          <Text style={styles.label}>Max Dogs (optional)</Text>
          <Controller
            control={control}
            name="max_dogs"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="No limit"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="number-pad"
              />
            )}
          />
        </View>

        {/* Submit */}
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

/**
 * Convert a Date to the value format expected by an HTML datetime-local input.
 */
function toDatetimeLocalString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
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
  pickerButton: {
    justifyContent: 'center',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#1A1A2E',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  modalClose: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A90D9',
  },
  parkOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  parkOptionSelected: {
    backgroundColor: '#EBF5FF',
  },
  parkOptionText: {
    fontSize: 16,
    color: '#1A1A2E',
    fontWeight: '500',
  },
  parkOptionTextSelected: {
    color: '#4A90D9',
    fontWeight: '600',
  },
  parkOptionAddress: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    padding: 32,
    fontSize: 16,
  },
});
