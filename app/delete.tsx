import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/src/hooks/useAuth';
import { deleteAccount } from '@/src/services/auth';

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{ fontSize: 20, fontWeight: '700', color: '#1A1918', marginTop: 28, marginBottom: 12 }}>
      {children}
    </Text>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{ fontSize: 15, color: '#6D6C6A', lineHeight: 24, marginBottom: 12 }}>
      {children}
    </Text>
  );
}

function BulletPoint({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', marginBottom: 8, paddingLeft: 16 }}>
      <Text style={{ fontSize: 15, color: '#6D6C6A', marginRight: 8 }}>•</Text>
      <Text style={{ fontSize: 15, color: '#6D6C6A', lineHeight: 24, flex: 1 }}>{children}</Text>
    </View>
  );
}

export default function DeleteAccountPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await deleteAccount();
      setDeleted(true);
      setShowConfirm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: '#FFFFFF',
          paddingTop: insets.top + 8,
          paddingBottom: 12,
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#E5E4E1',
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Pressable onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color="#1A1918" />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#1A1918' }}>Delete Account</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}
      >
        <Paragraph>
          We're sorry to see you go. This page explains what happens when you delete your k9d8 account.
        </Paragraph>

        <SectionTitle>What Gets Deleted</SectionTitle>
        <BulletPoint>Your profile information (name, email, avatar)</BulletPoint>
        <BulletPoint>Your dog profiles and photos</BulletPoint>
        <BulletPoint>Check-in history</BulletPoint>
        <BulletPoint>Park photos you've uploaded</BulletPoint>
        <BulletPoint>Reviews and comments</BulletPoint>
        <BulletPoint>Friend connections and play date history</BulletPoint>
        <BulletPoint>Messages and conversations</BulletPoint>
        <BulletPoint>Push notification tokens</BulletPoint>

        <SectionTitle>What You Should Know</SectionTitle>
        <BulletPoint>Account deletion is permanent and cannot be undone.</BulletPoint>
        <BulletPoint>All stored photos are removed from our storage.</BulletPoint>
        <BulletPoint>Deletion typically completes within a few seconds.</BulletPoint>

        {deleted ? (
          <View style={{ backgroundColor: '#E8F5E9', borderRadius: 12, padding: 20, marginTop: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons name="checkmark-circle" size={24} color="#3D8A5A" />
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#3D8A5A', marginLeft: 8 }}>
                Account Deleted
              </Text>
            </View>
            <Paragraph>
              Your account and all associated data have been permanently deleted.
            </Paragraph>
          </View>
        ) : session ? (
          <View style={{ marginTop: 24 }}>
            {error && (
              <View style={{ backgroundColor: '#FFF3F0', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                <Text style={{ fontSize: 14, color: '#B5725E' }}>{error}</Text>
              </View>
            )}

            {!showConfirm ? (
              <Pressable
                onPress={() => setShowConfirm(true)}
                style={{
                  backgroundColor: '#B5725E',
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>
                  Delete My Account
                </Text>
              </Pressable>
            ) : (
              <View style={{ backgroundColor: '#FFF8F6', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#B5725E' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Ionicons name="warning" size={24} color="#B5725E" />
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#B5725E', marginLeft: 8 }}>
                    Are you sure?
                  </Text>
                </View>
                <Paragraph>
                  This will permanently delete your account and all your data. This action cannot be undone.
                </Paragraph>
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                  <Pressable
                    onPress={() => setShowConfirm(false)}
                    disabled={deleting}
                    style={{
                      flex: 1,
                      backgroundColor: '#F5F4F2',
                      borderRadius: 12,
                      paddingVertical: 12,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#6D6C6A' }}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleDelete}
                    disabled={deleting}
                    style={{
                      flex: 1,
                      backgroundColor: '#B5725E',
                      borderRadius: 12,
                      paddingVertical: 12,
                      alignItems: 'center',
                      opacity: deleting ? 0.7 : 1,
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    {deleting && <ActivityIndicator size="small" color="#fff" />}
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>
                      {deleting ? 'Deleting...' : 'Delete'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        ) : (
          <View style={{ marginTop: 24 }}>
            <SectionTitle>How to Delete Your Account</SectionTitle>
            <Paragraph>
              Sign in to k9d8, go to your Profile tab, tap Settings, then scroll down and tap "Delete Account."
            </Paragraph>
            <Paragraph>
              Or email support@k9d8.com with the subject "Account Deletion Request" and the email address associated with your account. We'll process your request within 48 hours.
            </Paragraph>

            <Pressable
              onPress={() => router.push('/sign-in' as any)}
              style={{
                backgroundColor: '#3D8A5A',
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: 'center',
                marginTop: 8,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>
                Sign In to Delete Account
              </Text>
            </Pressable>

            <Pressable
              onPress={() => Linking.openURL('mailto:support@k9d8.com?subject=Account%20Deletion%20Request')}
              style={{
                backgroundColor: '#F5F4F2',
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: 'center',
                marginTop: 12,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#6D6C6A' }}>
                Email Support
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
