import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useParkPhotos } from '../../hooks/useParkPhotos';
import { moderateImage, initializeModerationModel, isModerationModelLoaded } from '../../services/moderation';
import ParkPhotoCard from './ParkPhotoCard';
import type { PhotoReportReason } from '../../types/database';

const CARD_SIZE = 160;

interface ParkPhotoGridProps {
  parkId: string;
  isAuthenticated: boolean;
  userId?: string;
}

export default function ParkPhotoGrid({
  parkId,
  isAuthenticated,
  userId,
}: ParkPhotoGridProps) {
  const { photos, loading, upload, vote, deletePhoto, report } = useParkPhotos(parkId);
  const [picking, setPicking] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleTap() {
    if (picking || uploading) return;
    setPicking(true);
    try {
      if (Platform.OS !== 'ios') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Please grant access to your photo library to upload images.');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const uri = result.assets[0].uri;

      // Run moderation
      if (!isModerationModelLoaded()) {
        await initializeModerationModel();
      }
      const modResult = await moderateImage(uri);
      if (!modResult.isSafe) {
        Alert.alert('Photo Rejected', 'Please use an appropriate photo.');
        return;
      }

      // Upload
      setUploading(true);
      await upload(uri);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      Alert.alert('Error', message);
    } finally {
      setPicking(false);
      setUploading(false);
    }
  }

  function handleReport(photoId: string, reason: PhotoReportReason) {
    report(photoId, reason)
      .then(() => Alert.alert('Reported', 'Thank you for your report.'))
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'Report failed';
        Alert.alert('Error', message);
      });
  }

  if (loading) {
    return (
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#1A1918', marginBottom: 12 }}>
          Photos
        </Text>
        <ActivityIndicator size="small" color="#3D8A5A" />
      </View>
    );
  }

  const busy = picking || uploading;

  const placeholderCard = (
    <View style={{ width: CARD_SIZE, marginRight: 12 }}>
      {isAuthenticated ? (
        <Pressable
          onPress={handleTap}
          disabled={busy}
          style={{
            width: CARD_SIZE,
            height: CARD_SIZE,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#E5E4E1',
            borderStyle: 'dashed',
            backgroundColor: '#F9F9F8',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: busy ? 0.5 : 1,
          }}
        >
          {busy ? (
            <ActivityIndicator size="small" color="#878685" />
          ) : (
            <>
              <Ionicons name="camera-outline" size={28} color="#AEADAB" style={{ marginBottom: 8 }} />
              <Text style={{ fontSize: 13, color: '#AEADAB', textAlign: 'center', fontWeight: '500' }}>
                Tap to select photo
              </Text>
            </>
          )}
        </Pressable>
      ) : (
        <View
          style={{
            width: CARD_SIZE,
            height: CARD_SIZE,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#E5E4E1',
            borderStyle: 'dashed',
            backgroundColor: '#F9F9F8',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="camera-outline" size={28} color="#AEADAB" style={{ marginBottom: 8 }} />
          <Text style={{ fontSize: 13, color: '#AEADAB', textAlign: 'center', fontWeight: '500' }}>
            Log in to add{'\n'}a photo
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={{ marginBottom: 24 }}>
      <Text style={{ fontSize: 18, fontWeight: '600', color: '#1A1918', marginBottom: 12 }}>
        Photos {photos.length > 0 ? `(${photos.length})` : ''}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 4 }}
      >
        {photos.map((photo) => (
          <View key={photo.id} style={{ width: CARD_SIZE, marginRight: 12 }}>
            <ParkPhotoCard
              photo={photo}
              onVote={vote}
              onDelete={deletePhoto}
              onReport={handleReport}
              isOwner={photo.user_id === userId}
              isAuthenticated={isAuthenticated}
              size={CARD_SIZE}
            />
          </View>
        ))}
        {placeholderCard}
      </ScrollView>
    </View>
  );
}
