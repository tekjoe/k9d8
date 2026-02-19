import React, { useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import DesktopSidebar from '@/src/components/ui/DesktopSidebar';
import ConfirmModal from '@/src/components/ui/ConfirmModal';
import { SEOHead } from '@/src/components/seo';
import { useAuth } from '@/src/hooks/useAuth';
import { deleteAccount } from '@/src/services/auth';
import { Colors } from '@/src/constants/colors';

const DELETED_DATA = [
  'Your profile and personal information',
  'All dog profiles and photos',
  'Messages and conversations',
  'Friend connections and requests',
  'Check-in history',
  'Play date RSVPs and events you organized',
  'Notification preferences and push tokens',
];

export default function DeleteAccountScreenWeb() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const showSidebar = width >= 768;
  const { session } = useAuth();

  const [confirmed, setConfirmed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = useCallback(async () => {
    setShowModal(false);
    setIsDeleting(true);
    try {
      await deleteAccount();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to delete account';
      setError(message);
      setIsDeleting(false);
    }
  }, []);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  return (
    <>
      <SEOHead
        title="Delete Account"
        description="Delete your k9d8 account and all associated data."
        url="/profile/delete"
      />
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#F5F4F1' }}>
        {/* Sidebar - Hidden on mobile */}
        {showSidebar && <DesktopSidebar />}

        {/* Main Content */}
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#fff',
              paddingHorizontal: isMobile ? 16 : 40,
              paddingVertical: isMobile ? 16 : 24,
              borderBottomWidth: 1,
              borderBottomColor: '#E5E4E1',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <Pressable
                onPress={handleBack}
                style={{
                  width: 40,
                  height: 40,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
              </Pressable>
              <Text
                style={{
                  fontSize: isMobile ? 18 : 24,
                  fontWeight: '600',
                  color: '#1A1918',
                }}
              >
                Delete Account
              </Text>
            </View>
          </View>

          {/* Content */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              padding: isMobile ? 20 : 40,
              alignItems: 'center',
            }}
          >
            <View style={{ width: '100%', maxWidth: 640, gap: 24 }}>
              {session?.user?.email && (
                <Text style={{ fontSize: 14, color: '#6D6C6A' }}>
                  Signed in as {session.user.email}
                </Text>
              )}

              {/* Warning Banner */}
              <View
                style={{
                  backgroundColor: '#F5E8E3',
                  borderRadius: 12,
                  padding: 20,
                  flexDirection: 'row',
                  gap: 12,
                  alignItems: 'flex-start',
                }}
              >
                <Ionicons name="warning" size={22} color="#B5725E" />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: '#B5725E',
                      marginBottom: 4,
                    }}
                  >
                    This action is permanent
                  </Text>
                  <Text style={{ fontSize: 14, color: '#8B5A4A', lineHeight: 22 }}>
                    Deleting your account will permanently remove all your data
                    from our servers. This cannot be undone.
                  </Text>
                </View>
              </View>

              {/* What Gets Deleted */}
              <View
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 12,
                  padding: 24,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: '600',
                    color: '#1A1918',
                    marginBottom: 16,
                  }}
                >
                  What gets deleted
                </Text>
                <View style={{ gap: 12 }}>
                  {DELETED_DATA.map((item) => (
                    <View
                      key={item}
                      style={{
                        flexDirection: 'row',
                        gap: 10,
                        alignItems: 'center',
                      }}
                    >
                      <Ionicons name="close-circle" size={18} color="#B5725E" />
                      <Text style={{ fontSize: 14, color: '#6D6C6A', flex: 1 }}>
                        {item}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* What Happens Next */}
              <View
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 12,
                  padding: 24,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: '600',
                    color: '#1A1918',
                    marginBottom: 16,
                  }}
                >
                  What happens next
                </Text>
                <View style={{ gap: 12 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      gap: 10,
                      alignItems: 'center',
                    }}
                  >
                    <Ionicons name="log-out-outline" size={18} color="#6D6C6A" />
                    <Text style={{ fontSize: 14, color: '#6D6C6A', flex: 1 }}>
                      You will be signed out immediately
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: 'row',
                      gap: 10,
                      alignItems: 'center',
                    }}
                  >
                    <Ionicons name="trash-outline" size={18} color="#6D6C6A" />
                    <Text style={{ fontSize: 14, color: '#6D6C6A', flex: 1 }}>
                      Your data will be permanently deleted
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: 'row',
                      gap: 10,
                      alignItems: 'center',
                    }}
                  >
                    <Ionicons
                      name="arrow-undo-outline"
                      size={18}
                      color="#6D6C6A"
                    />
                    <Text style={{ fontSize: 14, color: '#6D6C6A', flex: 1 }}>
                      This action cannot be reversed
                    </Text>
                  </View>
                </View>
              </View>

              {error && (
                <View
                  style={{
                    backgroundColor: '#F5E8E3',
                    padding: 12,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: '#B5725E', fontSize: 14 }}>{error}</Text>
                </View>
              )}

              {/* Confirmation Checkbox */}
              <Pressable
                onPress={() => setConfirmed((prev) => !prev)}
                style={{
                  flexDirection: 'row',
                  gap: 12,
                  alignItems: 'center',
                  paddingVertical: 4,
                  cursor: 'pointer',
                }}
              >
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 4,
                    borderWidth: 2,
                    borderColor: confirmed ? '#B5725E' : '#D1D0CD',
                    backgroundColor: confirmed ? '#B5725E' : 'transparent',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {confirmed && (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  )}
                </View>
                <Text
                  style={{
                    fontSize: 14,
                    color: '#1A1918',
                    flex: 1,
                    lineHeight: 20,
                  }}
                >
                  I understand this action is permanent and cannot be undone
                </Text>
              </Pressable>

              {/* Delete Button */}
              <Pressable
                onPress={() => setShowModal(true)}
                disabled={!confirmed || isDeleting}
                style={{
                  backgroundColor:
                    confirmed && !isDeleting ? '#B5725E' : '#D1D0CD',
                  paddingVertical: 16,
                  borderRadius: 12,
                  alignItems: 'center',
                  marginBottom: 32,
                  cursor: confirmed && !isDeleting ? 'pointer' : 'default',
                }}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text
                    style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}
                  >
                    Delete My Account
                  </Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>

      <ConfirmModal
        visible={showModal}
        title="Are you sure?"
        message="This will permanently delete your account and all associated data. This cannot be undone."
        confirmLabel="Delete Everything"
        cancelLabel="Go Back"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setShowModal(false)}
      />
    </>
  );
}
