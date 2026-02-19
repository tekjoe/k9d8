import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, useWindowDimensions, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SEOHead } from '@/src/components/seo';
import NavBar from '@/src/components/web/NavBar';
import Footer from '@/src/components/web/Footer';
import { useAuth } from '@/src/hooks/useAuth';
import { deleteAccount } from '@/src/services/auth';

const MAX_WIDTH = 1200;

function Container({ children, style }: { children: React.ReactNode; style?: any }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  return (
    <View
      style={[
        { width: '100%', maxWidth: MAX_WIDTH, marginHorizontal: 'auto', paddingHorizontal: isMobile ? 24 : 48 },
        style,
      ]}
    >
      {children}
    </View>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{ fontSize: 24, fontWeight: '700', color: '#1A1918', marginTop: 32, marginBottom: 16, letterSpacing: -0.3 }}>
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
    <>
      <SEOHead
        title="Delete Account — k9d8"
        description="Request deletion of your k9d8 account and all associated data."
        url="/delete"
      />
      <ScrollView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <NavBar />

        <Container style={{ paddingTop: 48, paddingBottom: 64 }}>
          <Text style={{ fontSize: 36, fontWeight: '800', color: '#1A1918', letterSpacing: -0.5, marginBottom: 8 }}>
            Delete Your Account
          </Text>
          <Text style={{ fontSize: 17, color: '#6D6C6A', lineHeight: 26, marginBottom: 32 }}>
            We're sorry to see you go. This page explains what happens when you delete your k9d8 account and how to request deletion.
          </Text>

          <SectionTitle>What Gets Deleted</SectionTitle>
          <Paragraph>
            When you delete your account, the following data is permanently removed from our servers:
          </Paragraph>
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
          <BulletPoint>All stored photos (avatar, dog photos, park photos) are removed from our storage.</BulletPoint>
          <BulletPoint>If other users have messaged you, those conversations will show your messages as from a deleted user.</BulletPoint>
          <BulletPoint>Deletion typically completes within a few seconds.</BulletPoint>

          <SectionTitle>How to Delete Your Account</SectionTitle>

          {deleted ? (
            <View style={{ backgroundColor: '#E8F5E9', borderRadius: 12, padding: 24, marginTop: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Ionicons name="checkmark-circle" size={24} color="#3D8A5A" />
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#3D8A5A', marginLeft: 8 }}>
                  Account Deleted
                </Text>
              </View>
              <Paragraph>
                Your account and all associated data have been permanently deleted. You can close this page.
              </Paragraph>
            </View>
          ) : session ? (
            <View style={{ marginTop: 16 }}>
              <Paragraph>
                You are currently signed in. You can delete your account directly by clicking the button below.
              </Paragraph>

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
                    paddingHorizontal: 24,
                    alignSelf: 'flex-start',
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>
                    Delete My Account
                  </Text>
                </Pressable>
              ) : (
                <View style={{ backgroundColor: '#FFF8F6', borderRadius: 12, padding: 24, borderWidth: 1, borderColor: '#B5725E' }}>
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
                        backgroundColor: '#F5F4F2',
                        borderRadius: 12,
                        paddingVertical: 12,
                        paddingHorizontal: 24,
                      }}
                    >
                      <Text style={{ fontSize: 15, fontWeight: '600', color: '#6D6C6A' }}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      onPress={handleDelete}
                      disabled={deleting}
                      style={{
                        backgroundColor: '#B5725E',
                        borderRadius: 12,
                        paddingVertical: 12,
                        paddingHorizontal: 24,
                        opacity: deleting ? 0.7 : 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      {deleting && <ActivityIndicator size="small" color="#fff" />}
                      <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>
                        {deleting ? 'Deleting...' : 'Yes, Delete My Account'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          ) : (
            <View style={{ marginTop: 16 }}>
              <Paragraph>There are two ways to delete your account:</Paragraph>

              <Text style={{ fontSize: 18, fontWeight: '600', color: '#1A1918', marginTop: 16, marginBottom: 12 }}>
                Option 1: In the App
              </Text>
              <Paragraph>
                Sign in to k9d8, go to your Profile tab, tap Settings, then scroll down and tap "Delete Account."
              </Paragraph>

              <Text style={{ fontSize: 18, fontWeight: '600', color: '#1A1918', marginTop: 16, marginBottom: 12 }}>
                Option 2: Email Us
              </Text>
              <Paragraph>
                Send an email to support@k9d8.com with the subject line "Account Deletion Request" and include the email address associated with your account. We will process your request within 48 hours.
              </Paragraph>

              <Pressable
                onPress={() => router.push('/sign-in' as any)}
                style={{
                  backgroundColor: '#3D8A5A',
                  borderRadius: 12,
                  paddingVertical: 14,
                  paddingHorizontal: 24,
                  alignSelf: 'flex-start',
                  marginTop: 8,
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>
                  Sign In to Delete Account
                </Text>
              </Pressable>
            </View>
          )}

          <SectionTitle>Questions?</SectionTitle>
          <Paragraph>
            If you have any questions about account deletion or your data, contact us at support@k9d8.com.
          </Paragraph>
        </Container>

        <Footer />
      </ScrollView>
    </>
  );
}
