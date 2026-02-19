import React, { useState } from 'react';
import { Alert, Image, Modal, Platform, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ParkPhoto, PhotoReportReason } from '../../types/database';

interface ParkPhotoCardProps {
  photo: ParkPhoto;
  onVote: (photoId: string) => void;
  onDelete: (photoId: string, photoUrl: string) => void;
  onReport: (photoId: string, reason: PhotoReportReason) => void;
  isOwner: boolean;
  isAuthenticated: boolean;
  size?: number;
}

const REPORT_REASONS: { label: string; value: PhotoReportReason }[] = [
  { label: 'Spam', value: 'spam' },
  { label: 'Inappropriate', value: 'inappropriate' },
  { label: 'Offensive', value: 'offensive' },
  { label: 'Other', value: 'other' },
];

export default function ParkPhotoCard({
  photo,
  onVote,
  onDelete,
  onReport,
  isOwner,
  isAuthenticated,
  size,
}: ParkPhotoCardProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  function handleReport() {
    if (Platform.OS === 'web') {
      const reason = window.prompt('Why are you reporting this photo?\n(spam, inappropriate, offensive, other)');
      if (reason) {
        const match = REPORT_REASONS.find(r => r.value === reason.trim().toLowerCase());
        onReport(photo.id, match?.value ?? 'other');
      }
      return;
    }
    Alert.alert(
      'Report Photo',
      'Why are you reporting this photo?',
      [
        ...REPORT_REASONS.map((r) => ({
          text: r.label,
          onPress: () => onReport(photo.id, r.value),
        })),
        { text: 'Cancel', style: 'cancel' as const },
      ],
    );
  }

  function handleDelete() {
    if (Platform.OS === 'web') {
      setShowDeleteModal(true);
      return;
    }
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(photo.id, photo.photo_url) },
      ],
    );
  }

  function confirmDelete() {
    setShowDeleteModal(false);
    onDelete(photo.id, photo.photo_url);
  }

  return (
    <View>
      <Image
        source={{ uri: photo.photo_url }}
        style={{
          width: size ?? '100%',
          height: size ?? undefined,
          aspectRatio: size ? 1 : 4 / 3,
          borderRadius: 8,
        }}
        resizeMode="cover"
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          {isAuthenticated && (
            <Pressable
              onPress={() => onVote(photo.id)}
              style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}
            >
              <Ionicons
                name={photo.user_has_voted ? 'heart' : 'heart-outline'}
                size={18}
                color={photo.user_has_voted ? '#E5534B' : '#878685'}
              />
              <Text style={{ fontSize: 13, color: '#6D6C6A', marginLeft: 4, fontWeight: '500' }}>
                {photo.vote_count ?? 0}
              </Text>
            </Pressable>
          )}
          <Text style={{ fontSize: 12, color: '#878685' }} numberOfLines={1}>
            {photo.user?.display_name || 'User'}
          </Text>
        </View>
        {isAuthenticated && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {isOwner && (
              <Pressable onPress={handleDelete}>
                <Ionicons name="trash-outline" size={16} color="#B5725E" />
              </Pressable>
            )}
            {!isOwner && (
              <Pressable onPress={handleReport}>
                <Ionicons name="flag-outline" size={16} color="#878685" />
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <Pressable
          onPress={() => setShowDeleteModal(false)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 24,
              width: 320,
              alignItems: 'center',
            }}
          >
            <Ionicons name="trash-outline" size={32} color="#B5725E" style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#1A1918', marginBottom: 8 }}>
              Delete Photo
            </Text>
            <Text style={{ fontSize: 14, color: '#6D6C6A', textAlign: 'center', marginBottom: 20 }}>
              Are you sure you want to delete this photo? This action cannot be undone.
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              <Pressable
                onPress={() => setShowDeleteModal(false)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 9999,
                  backgroundColor: '#F5F4F2',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#6D6C6A' }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={confirmDelete}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 9999,
                  backgroundColor: '#B5725E',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>Delete</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
