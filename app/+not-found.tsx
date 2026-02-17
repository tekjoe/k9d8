import React from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SEOHead } from '@/src/components/seo';

export default function NotFoundScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <>
      <SEOHead
        title="Page Not Found"
        description="The page you're looking for doesn't exist. Find dog parks, schedule playdates, and connect with dog owners on k9d8."
      />
      <View
        style={{
          flex: 1,
          backgroundColor: '#F5F4F1',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
        }}
      >
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: '#E8F0E8',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <Ionicons name="paw" size={40} color="#3D8A5A" />
        </View>
        <Text
          role="heading"
          aria-level={1}
          style={{
            fontSize: isMobile ? 32 : 48,
            fontWeight: '700',
            color: '#1A1918',
            textAlign: 'center',
            marginBottom: 12,
          }}
        >
          404
        </Text>
        <Text
          style={{
            fontSize: 18,
            color: '#6D6C6A',
            textAlign: 'center',
            maxWidth: 400,
            lineHeight: 26,
            marginBottom: 32,
          }}
        >
          Looks like this pup wandered off! The page you're looking for doesn't exist.
        </Text>
        <View style={{ flexDirection: isMobile ? 'column' : 'row', gap: 12 }}>
          <Pressable
            onPress={() => router.replace('/')}
            style={{
              backgroundColor: '#3D8A5A',
              paddingHorizontal: 24,
              paddingVertical: 14,
              borderRadius: 9999,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Go Home</Text>
          </Pressable>
          <Pressable
            onPress={() => router.replace('/landing')}
            style={{
              borderWidth: 1.5,
              borderColor: '#E5E4E1',
              backgroundColor: '#fff',
              paddingHorizontal: 24,
              paddingVertical: 14,
              borderRadius: 9999,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#1A1918', fontWeight: '600', fontSize: 15 }}>Explore k9d8</Text>
          </Pressable>
        </View>
      </View>
    </>
  );
}
