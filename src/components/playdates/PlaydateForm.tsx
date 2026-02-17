import { useMemo, useState } from 'react';
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
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addDays, setHours, setMinutes, isSameDay } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import type { Park, Dog } from '@/src/types/database';

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
  dog_ids: string[];
}

interface PlaydateFormProps {
  parks: Park[];
  dogs?: Dog[];
  defaultValues?: Partial<PlaydateFormData>;
  onSubmit: (data: PlaydateFormData) => Promise<void>;
  submitLabel?: string;
}

export function PlaydateForm({
  parks,
  dogs = [],
  defaultValues,
  onSubmit,
  submitLabel = 'Create Play Date',
}: PlaydateFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [showParkPicker, setShowParkPicker] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [selectedDogIds, setSelectedDogIds] = useState<string[]>(
    defaultValues?.dog_ids ?? [],
  );

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

  const [parkSearch, setParkSearch] = useState('');
  const filteredParks = useMemo(() => {
    if (!parkSearch.trim()) return parks;
    const query = parkSearch.toLowerCase();
    return parks.filter(
      (park) =>
        park.name.toLowerCase().includes(query) ||
        (park.address && park.address.toLowerCase().includes(query)),
    );
  }, [parks, parkSearch]);

  const toggleDog = (dogId: string) => {
    setSelectedDogIds((prev) =>
      prev.includes(dogId)
        ? prev.filter((id) => id !== dogId)
        : [...prev, dogId],
    );
  };

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
        dog_ids: selectedDogIds,
      });
    } finally {
      setSubmitting(false);
    }
  }

  const isWeb = Platform.OS === 'web';

  // Web date/time picker modal state
  const [webPickerField, setWebPickerField] = useState<'starts_at' | 'ends_at' | null>(null);
  const [webPickerDate, setWebPickerDate] = useState<Date>(new Date());
  const webPickerValue = webPickerField === 'starts_at' ? startsAt : endsAt;

  const openWebPicker = (field: 'starts_at' | 'ends_at') => {
    setWebPickerDate(field === 'starts_at' ? startsAt : endsAt);
    setWebPickerField(field);
  };

  const confirmWebPicker = () => {
    if (webPickerField) {
      setValue(webPickerField, webPickerDate, { shouldValidate: true });
      setWebPickerField(null);
    }
  };

  // Generate next 14 days for the web picker
  const upcomingDays = useMemo(() => {
    const days: Date[] = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      days.push(addDays(today, i));
    }
    return days;
  }, []);

  // Generate time slots (every 30 min from 6am to 10pm)
  const timeSlots = useMemo(() => {
    const slots: { hour: number; minute: number; label: string }[] = [];
    for (let h = 6; h <= 22; h++) {
      for (const m of [0, 30]) {
        if (h === 22 && m === 30) continue;
        const d = setMinutes(setHours(new Date(), h), m);
        slots.push({ hour: h, minute: m, label: format(d, 'h:mm a') });
      }
    }
    return slots;
  }, []);

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
          onRequestClose={() => { setShowParkPicker(false); setParkSearch(''); }}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select a Park</Text>
              <Pressable onPress={() => { setShowParkPicker(false); setParkSearch(''); }}>
                <Text style={styles.modalClose}>Done</Text>
              </Pressable>
            </View>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search parks..."
                placeholderTextColor="#878685"
                value={parkSearch}
                onChangeText={setParkSearch}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <ScrollView style={styles.flex} keyboardShouldPersistTaps="handled">
              {filteredParks.map((park) => (
                <Pressable
                  key={park.id}
                  style={[
                    styles.parkOption,
                    park.id === selectedParkId && styles.parkOptionSelected,
                  ]}
                  onPress={() => {
                    setValue('park_id', park.id, { shouldValidate: true });
                    setShowParkPicker(false);
                    setParkSearch('');
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
              {filteredParks.length === 0 && (
                <Text style={styles.emptyText}>
                  {parkSearch.trim() ? 'No parks match your search' : 'No parks available'}
                </Text>
              )}
            </ScrollView>
          </View>
        </Modal>

        {/* Dog Selection */}
        {dogs.length > 0 && (
          <View style={styles.field}>
            <Text style={styles.label}>Which dogs are coming?</Text>
            <View style={styles.dogGrid}>
              {dogs.map((dog) => {
                const isSelected = selectedDogIds.includes(dog.id);
                return (
                  <Pressable
                    key={dog.id}
                    style={[
                      styles.dogChip,
                      isSelected && styles.dogChipSelected,
                    ]}
                    onPress={() => toggleDog(dog.id)}
                  >
                    <View
                      style={[
                        styles.dogCheckbox,
                        isSelected && styles.dogCheckboxSelected,
                      ]}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={14} color="#fff" />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.dogChipName,
                        isSelected && styles.dogChipNameSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {dog.name}
                    </Text>
                    {dog.breed && (
                      <Text style={styles.dogChipBreed} numberOfLines={1}>
                        {dog.breed}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Starts At */}
        <View style={styles.field}>
          <Text style={styles.label}>Starts At *</Text>
          <Pressable
            style={[styles.input, styles.pickerButton, errors.starts_at && styles.inputError]}
            onPress={() => isWeb ? openWebPicker('starts_at') : setShowStartPicker(true)}
          >
            <View style={styles.dateTimeButtonRow}>
              <Ionicons name="calendar-outline" size={18} color="#6D6C6A" />
              <Text style={styles.pickerButtonText}>
                {format(startsAt, 'EEE, MMM d, yyyy  \u00B7  h:mm a')}
              </Text>
            </View>
          </Pressable>
          {errors.starts_at && (
            <Text style={styles.errorText}>{errors.starts_at.message}</Text>
          )}
        </View>

        {!isWeb && (
          <DateTimePickerModal
            isVisible={showStartPicker}
            mode="datetime"
            date={startsAt}
            minimumDate={new Date()}
            onConfirm={(date) => {
              setShowStartPicker(false);
              setValue('starts_at', date, { shouldValidate: true });
            }}
            onCancel={() => setShowStartPicker(false)}
          />
        )}

        {/* Ends At */}
        <View style={styles.field}>
          <Text style={styles.label}>Ends At *</Text>
          <Pressable
            style={[styles.input, styles.pickerButton, errors.ends_at && styles.inputError]}
            onPress={() => isWeb ? openWebPicker('ends_at') : setShowEndPicker(true)}
          >
            <View style={styles.dateTimeButtonRow}>
              <Ionicons name="time-outline" size={18} color="#6D6C6A" />
              <Text style={styles.pickerButtonText}>
                {format(endsAt, 'EEE, MMM d, yyyy  \u00B7  h:mm a')}
              </Text>
            </View>
          </Pressable>
          {errors.ends_at && (
            <Text style={styles.errorText}>{errors.ends_at.message}</Text>
          )}
        </View>

        {!isWeb && (
          <DateTimePickerModal
            isVisible={showEndPicker}
            mode="datetime"
            date={endsAt}
            minimumDate={startsAt}
            onConfirm={(date) => {
              setShowEndPicker(false);
              setValue('ends_at', date, { shouldValidate: true });
            }}
            onCancel={() => setShowEndPicker(false)}
          />
        )}

        {/* Web Date/Time Picker Modal */}
        <Modal
          visible={webPickerField !== null}
          animationType="slide"
          transparent
          onRequestClose={() => setWebPickerField(null)}
        >
          <View style={styles.webPickerOverlay}>
            <View style={styles.webPickerContainer}>
              <View style={styles.modalHeader}>
                <Pressable onPress={() => setWebPickerField(null)}>
                  <Text style={styles.modalClose}>Cancel</Text>
                </Pressable>
                <Text style={styles.modalTitle}>
                  {format(webPickerDate, 'EEE, MMM d  \u00B7  h:mm a')}
                </Text>
                <Pressable onPress={confirmWebPicker}>
                  <Text style={[styles.modalClose, { fontWeight: '700' }]}>Done</Text>
                </Pressable>
              </View>

              {/* Date Section */}
              <Text style={styles.webPickerSectionLabel}>Date</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.webPickerDayScroll} contentContainerStyle={styles.webPickerDayContent}>
                {upcomingDays.map((day) => {
                  const isSelected = isSameDay(day, webPickerDate);
                  const isToday = isSameDay(day, new Date());
                  return (
                    <Pressable
                      key={day.toISOString()}
                      style={[styles.webPickerDayChip, isSelected && styles.webPickerDayChipSelected]}
                      onPress={() => {
                        const merged = new Date(webPickerDate);
                        merged.setFullYear(day.getFullYear(), day.getMonth(), day.getDate());
                        setWebPickerDate(merged);
                      }}
                    >
                      <Text style={[styles.webPickerDayLabel, isSelected && styles.webPickerDayLabelSelected]}>
                        {isToday ? 'Today' : format(day, 'EEE')}
                      </Text>
                      <Text style={[styles.webPickerDayNum, isSelected && styles.webPickerDayNumSelected]}>
                        {format(day, 'd')}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Time Section */}
              <Text style={styles.webPickerSectionLabel}>Time</Text>
              <ScrollView style={styles.webPickerTimeScroll} contentContainerStyle={styles.webPickerTimeGrid}>
                {timeSlots.map((slot) => {
                  const isSelected = webPickerDate.getHours() === slot.hour && webPickerDate.getMinutes() === slot.minute;
                  return (
                    <Pressable
                      key={slot.label}
                      style={[styles.webPickerTimeChip, isSelected && styles.webPickerTimeChipSelected]}
                      onPress={() => {
                        const merged = new Date(webPickerDate);
                        merged.setHours(slot.hour, slot.minute, 0, 0);
                        setWebPickerDate(merged);
                      }}
                    >
                      <Text style={[styles.webPickerTimeLabel, isSelected && styles.webPickerTimeLabelSelected]}>
                        {slot.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>

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
  inputError: {
    borderColor: '#B5725E',
  },
  textArea: {
    minHeight: 100,
  },
  dateTimeButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pickerButton: {
    justifyContent: 'center',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#1A1918',
  },
  placeholderText: {
    color: '#878685',
  },
  errorText: {
    color: '#B5725E',
    fontSize: 12,
    marginTop: 4,
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E4E1',
  },
  searchInput: {
    backgroundColor: '#F5F4F1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1A1918',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E4E1',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1918',
  },
  modalClose: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3D8A5A',
  },
  parkOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EDECEA',
  },
  parkOptionSelected: {
    backgroundColor: '#EBF5FF',
  },
  parkOptionText: {
    fontSize: 16,
    color: '#1A1918',
    fontWeight: '500',
  },
  parkOptionTextSelected: {
    color: '#3D8A5A',
    fontWeight: '600',
  },
  parkOptionAddress: {
    fontSize: 13,
    color: '#878685',
    marginTop: 2,
  },
  dogGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  dogChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F4F1',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 8,
  },
  dogChipSelected: {
    backgroundColor: '#E8F0E8',
    borderColor: '#3D8A5A',
  },
  dogCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D0CD',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dogCheckboxSelected: {
    backgroundColor: '#3D8A5A',
    borderColor: '#3D8A5A',
  },
  dogChipName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1918',
  },
  dogChipNameSelected: {
    color: '#15803D',
  },
  dogChipBreed: {
    fontSize: 13,
    color: '#878685',
  },
  emptyText: {
    textAlign: 'center',
    color: '#878685',
    padding: 32,
    fontSize: 16,
  },
  webPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  webPickerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
    maxHeight: '80%',
  },
  webPickerSectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6D6C6A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  webPickerDayScroll: {
    maxHeight: 80,
    paddingHorizontal: 12,
  },
  webPickerDayContent: {
    paddingHorizontal: 8,
    gap: 8,
  },
  webPickerDayChip: {
    width: 56,
    height: 68,
    borderRadius: 14,
    backgroundColor: '#F5F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  webPickerDayChipSelected: {
    backgroundColor: '#EBF5FF',
    borderColor: '#3D8A5A',
  },
  webPickerDayLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6D6C6A',
    marginBottom: 4,
  },
  webPickerDayLabelSelected: {
    color: '#3D8A5A',
    fontWeight: '600',
  },
  webPickerDayNum: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1918',
  },
  webPickerDayNumSelected: {
    color: '#3D8A5A',
  },
  webPickerTimeScroll: {
    maxHeight: 220,
    paddingHorizontal: 20,
  },
  webPickerTimeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 8,
  },
  webPickerTimeChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#F5F4F1',
    minWidth: '22%',
    alignItems: 'center',
  },
  webPickerTimeChipSelected: {
    backgroundColor: '#3D8A5A',
  },
  webPickerTimeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1918',
  },
  webPickerTimeLabelSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
