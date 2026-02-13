import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { CheckIn, Dog } from '../../types/database';
import { Colors } from '../../constants/colors';

interface CheckInButtonProps {
  userCheckIn: CheckIn | null;
  dogs: Dog[];
  onCheckIn: (dogIds: string[]) => void;
  onCheckOut: () => void;
  loading: boolean;
}

export function CheckInButton({
  userCheckIn,
  dogs,
  onCheckIn,
  onCheckOut,
  loading,
}: CheckInButtonProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDogIds, setSelectedDogIds] = useState<string[]>([]);

  const isCheckedIn = userCheckIn !== null;

  const handlePress = () => {
    if (isCheckedIn) {
      onCheckOut();
    } else {
      // Pre-select all dogs by default
      setSelectedDogIds(dogs.map((d) => d.id));
      setModalVisible(true);
    }
  };

  const toggleDog = (dogId: string) => {
    setSelectedDogIds((prev) =>
      prev.includes(dogId)
        ? prev.filter((id) => id !== dogId)
        : [...prev, dogId],
    );
  };

  const handleConfirmCheckIn = () => {
    setModalVisible(false);
    onCheckIn(selectedDogIds);
  };

  return (
    <>
      <Pressable
        style={[
          styles.button,
          isCheckedIn ? styles.checkOutButton : styles.checkInButton,
          loading && styles.disabledButton,
        ]}
        onPress={handlePress}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={isCheckedIn ? Colors.light.error : '#FFFFFF'}
          />
        ) : (
          <Text
            style={[
              styles.buttonText,
              isCheckedIn ? styles.checkOutText : styles.checkInText,
            ]}
          >
            {isCheckedIn ? 'Check Out' : 'Check In'}
          </Text>
        )}
      </Pressable>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Dogs to Bring</Text>
                <Pressable
                  onPress={() => setModalVisible(false)}
                  hitSlop={12}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
              </View>

              {dogs.length === 0 ? (
                <View style={styles.noDogs}>
                  <Text style={styles.noDogsText}>
                    You have not added any dogs yet. Add a dog from your profile
                    first.
                  </Text>
                </View>
              ) : (
                <ScrollView style={styles.dogList}>
                  {dogs.map((dog) => {
                    const isSelected = selectedDogIds.includes(dog.id);
                    return (
                      <Pressable
                        key={dog.id}
                        style={[
                          styles.dogRow,
                          isSelected && styles.dogRowSelected,
                        ]}
                        onPress={() => toggleDog(dog.id)}
                      >
                        <View style={styles.checkbox}>
                          {isSelected && (
                            <View style={styles.checkboxInner} />
                          )}
                        </View>
                        <View style={styles.dogInfo}>
                          <Text style={styles.dogName}>{dog.name}</Text>
                          <Text style={styles.dogDetail}>
                            {dog.breed ? `${dog.breed} \u00B7 ` : ''}
                            {dog.size.replace('_', ' ')}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}

              <Pressable
                style={[
                  styles.confirmButton,
                  selectedDogIds.length === 0 && styles.disabledButton,
                ]}
                onPress={handleConfirmCheckIn}
                disabled={selectedDogIds.length === 0}
              >
                <Text style={styles.confirmButtonText}>
                  Check In{' '}
                  {selectedDogIds.length > 0
                    ? `with ${selectedDogIds.length} dog${selectedDogIds.length !== 1 ? 's' : ''}`
                    : ''}
                </Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  checkInButton: {
    backgroundColor: Colors.light.primary,
  },
  checkOutButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.light.error,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  checkInText: {
    color: '#FFFFFF',
  },
  checkOutText: {
    color: Colors.light.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalContent: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  cancelText: {
    fontSize: 16,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  noDogs: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  noDogsText: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  dogList: {
    maxHeight: 300,
  },
  dogRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  dogRowSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary + '0D',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: Colors.light.primary,
  },
  dogInfo: {
    flex: 1,
  },
  dogName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  dogDetail: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  confirmButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  confirmButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
