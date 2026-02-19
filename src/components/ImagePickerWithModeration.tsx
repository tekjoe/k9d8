import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  Platform,
  Pressable,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Animated,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import {
  moderateImage,
  initializeModerationModel,
  isModerationModelLoaded,
  getModerationMessage,
  ModerationResult,
} from '@/src/services/moderation';

interface ImagePickerWithModerationProps {
  onImageSelect: (uri: string) => void;
  onImageRemove?: () => void;
  selectedImage?: string | null;
  placeholder?: string;
  moderationEnabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  shape?: 'square' | 'circle';
  aspectRatio?: [number, number];
}

const SIZE_MAP = {
  small: 80,
  medium: 120,
  large: 200,
};

/**
 * Toast Notification Component - Bottom Right
 */
function Toast({ message, type, onHide }: { message: string; type: 'error' | 'success'; onHide: () => void }) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(100));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 100,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => onHide());
    }, 4000);

    return () => clearTimeout(timer);
  }, [fadeAnim, slideAnim, onHide]);

  const isError = type === 'error';
  const title = isError ? 'Something went wrong' : 'Success';

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
        },
      ]}
    >
      <View style={[styles.toastIconWrap, isError ? styles.toastIconWrapError : styles.toastIconWrapSuccess]}>
        <Ionicons
          name={isError ? 'close-circle-outline' : 'checkmark-circle-outline'}
          size={18}
          color={isError ? '#B5725E' : '#3D8A5A'}
        />
      </View>
      <View style={styles.toastContent}>
        <Text style={styles.toastTitle}>{title}</Text>
        <Text style={styles.toastMessage}>{message}</Text>
      </View>
      <Pressable onPress={onHide} style={styles.toastCloseBtn}>
        <Ionicons name="close" size={16} color="#878685" />
      </Pressable>
    </Animated.View>
  );
}

/**
 * Image Picker Component with Built-in NSFW Moderation
 * 
 * This component wraps the standard image picker with automatic
 * content moderation using TensorFlow.js (nsfwjs).
 */
export function ImagePickerWithModeration({
  onImageSelect,
  onImageRemove,
  selectedImage,
  placeholder = 'Tap to select photo',
  moderationEnabled = true,
  size = 'medium',
  shape = 'square',
  aspectRatio = [1, 1],
}: ImagePickerWithModerationProps) {
  const [loading, setLoading] = useState(false);
  const [modelLoading, setModelLoading] = useState(!isModerationModelLoaded());
  const [modelReady, setModelReady] = useState(isModerationModelLoaded());
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  const dimension = SIZE_MAP[size];
  const borderRadius = shape === 'circle' ? dimension / 2 : 12;

  // Preload moderation model on mount
  useEffect(() => {
    if (moderationEnabled && !modelReady) {
      initializeModerationModel().then((success) => {
        setModelReady(success);
        setModelLoading(false);
      });
    }
  }, [moderationEnabled, modelReady]);

  const showToast = useCallback((message: string, type: 'error' | 'success') => {
    setToast({ message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  const pickImage = useCallback(async () => {
    // On Android, request permission first. iOS PHPicker doesn't need it.
    if (Platform.OS !== 'ios') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant access to your photo library to upload images.',
          [{ text: 'OK' }]
        );
        return;
      }
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: aspectRatio,
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) {
      return;
    }

    const imageUri = result.assets[0].uri;

    // If moderation is disabled, just return the image
    if (!moderationEnabled) {
      onImageSelect(imageUri);
      return;
    }

    // Moderate the image
    setLoading(true);
    try {
      // Ensure model is ready
      if (!modelReady) {
        const initialized = await initializeModerationModel();
        if (!initialized) {
          // Model failed to load, allow upload but warn
          console.warn('[ImagePicker] Moderation model not available, allowing upload');
          onImageSelect(imageUri);
          return;
        }
      }

      // Run moderation check
      const moderationResult = await moderateImage(imageUri);

      if (moderationResult.isSafe) {
        // Image passed moderation
        onImageSelect(imageUri);
      } else {
        // Image failed moderation - show simple toast
        showToast('Please use an appropriate photo', 'error');
      }
    } catch (error) {
      console.error('[ImagePicker] Moderation error:', error);
      // On error, allow upload but log it
      Alert.alert(
        'Check Failed',
        'Could not verify image content. Please try again or select a different image.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Upload Anyway',
            style: 'default',
            onPress: () => onImageSelect(imageUri)
          }
        ]
      );
    } finally {
      setLoading(false);
    }
  }, [moderationEnabled, modelReady, onImageSelect, aspectRatio, showToast]);

  const handleRemovePress = useCallback(() => {
    setShowConfirmRemove(true);
  }, []);

  const handleConfirmRemove = useCallback(() => {
    setShowConfirmRemove(false);
    if (onImageRemove) {
      onImageRemove();
    }
  }, [onImageRemove]);

  const handleCancelRemove = useCallback(() => {
    setShowConfirmRemove(false);
  }, []);

  if (selectedImage) {
    return (
      <View style={styles.container}>
        {/* Toast Notification */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onHide={hideToast}
          />
        )}

        <View style={[styles.imageContainer, { width: dimension, height: dimension, borderRadius }]}>
          <Image
            source={{ uri: selectedImage }}
            style={[styles.image, { borderRadius }]}
          />
          {loading && (
            <View style={[styles.overlay, { borderRadius }]}>
              <ActivityIndicator color="#FFFFFF" />
              <Text style={styles.overlayText}>Checking...</Text>
            </View>
          )}
        </View>
        
        {/* Change/Remove buttons */}
        <View style={styles.buttonRow}>
          <Pressable 
            onPress={pickImage} 
            disabled={loading}
            style={styles.changeButton}
          >
            <Ionicons name="camera-outline" size={14} color="#6D6C6A" />
            <Text style={styles.changeButtonText}>Change Photo</Text>
          </Pressable>
          
          {onImageRemove && !showConfirmRemove && (
            <Pressable onPress={handleRemovePress} style={styles.removeButtonSmall}>
              <Ionicons name="trash-outline" size={14} color="#B5725E" />
              <Text style={styles.removeButtonText}>Remove</Text>
            </Pressable>
          )}

          {/* Inline confirmation */}
          {showConfirmRemove && (
            <View style={styles.confirmRow}>
              <Pressable onPress={handleConfirmRemove} style={styles.confirmRemoveButton}>
                <Text style={styles.confirmRemoveText}>Confirm</Text>
              </Pressable>
              <Pressable onPress={handleCancelRemove} style={styles.cancelButton}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onHide={hideToast}
        />
      )}

      <Pressable
        onPress={pickImage}
        disabled={loading}
        style={[
          styles.pickerButton,
          { 
            width: dimension, 
            height: dimension, 
            borderRadius,
            opacity: loading ? 0.7 : 1 
          }
        ]}
      >
        {loading || modelLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#6D6C6A" />
            <Text style={styles.loadingText}>
              {modelLoading ? 'Loading...' : 'Checking...'}
            </Text>
          </View>
        ) : (
          <>
            <Ionicons name="camera" size={32} color="#9C9B99" />
            <Text style={styles.placeholderText}>{placeholder}</Text>
          </>
        )}
      </Pressable>
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  pickerButton: {
    backgroundColor: '#F5F4F1',
    borderWidth: 2,
    borderColor: '#E5E4E1',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  imageContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: '#6D6C6A',
    marginTop: 8,
  },
  placeholderText: {
    fontSize: 12,
    color: '#9C9B99',
    textAlign: 'center',
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EDECEA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  changeButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6D6C6A',
  },
  removeButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5E8E3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  removeButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#B5725E',
  },
  confirmRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  confirmRemoveButton: {
    backgroundColor: '#B5725E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  confirmRemoveText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  cancelButton: {
    backgroundColor: '#EDECEA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  cancelText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6D6C6A',
  },
  // Toast styles - Bottom Right
  toast: {
    position: 'fixed' as any,
    top: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E4E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 9999,
    maxWidth: 358,
  },
  toastIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastIconWrapError: {
    backgroundColor: '#F5E0DA',
  },
  toastIconWrapSuccess: {
    backgroundColor: '#E8F0E8',
  },
  toastContent: {
    flex: 1,
    gap: 2,
  },
  toastTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1918',
  },
  toastMessage: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6D6C6A',
    lineHeight: 18,
  },
  toastCloseBtn: {
    width: 24,
    height: 24,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
