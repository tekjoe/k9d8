import React from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';

const MAX_WIDTH = 1200;

export default function Footer() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <View style={{ width: '100%', backgroundColor: '#fff' }}>
      <View
        style={{
          width: '100%',
          maxWidth: MAX_WIDTH,
          marginHorizontal: 'auto',
          paddingHorizontal: isMobile ? 24 : 48,
          paddingVertical: 64,
        }}
      >
        <View
          style={{
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            gap: isMobile ? 40 : 64,
          }}
        >
          <View style={{ gap: 16, maxWidth: 280 }}>
            <Text style={{ fontSize: 24, fontWeight: '700', color: '#1A1918' }}>k9d8</Text>
            <Text style={{ fontSize: 15, color: '#6D6C6A', lineHeight: 24 }}>
              Connecting dogs and their humans to the best parks and communities.
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: isMobile ? 40 : 64, flexWrap: 'wrap' }}>
            <View style={{ gap: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#1A1918' }}>Product</Text>
              <Pressable onPress={() => router.push('/features' as any)}>
                <Text style={{ fontSize: 14, color: '#6D6C6A' }}>Features</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/download' as any)}>
                <Text style={{ fontSize: 14, color: '#6D6C6A' }}>Download</Text>
              </Pressable>
            </View>
            <View style={{ gap: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#1A1918' }}>Explore</Text>
              <Pressable onPress={() => router.push('/dog-parks' as any)}>
                <Text style={{ fontSize: 14, color: '#6D6C6A' }}>Dog Parks</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/blog' as any)}>
                <Text style={{ fontSize: 14, color: '#6D6C6A' }}>Blog</Text>
              </Pressable>
            </View>
            <View style={{ gap: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#1A1918' }}>Legal</Text>
              <Pressable onPress={() => router.push('/privacy' as any)}>
                <Text style={{ fontSize: 14, color: '#6D6C6A' }}>Privacy Policy</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/terms' as any)}>
                <Text style={{ fontSize: 14, color: '#6D6C6A' }}>Terms of Service</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      <View style={{ borderTopWidth: 1, borderTopColor: '#E5E4E1' }}>
        <View
          style={{
            width: '100%',
            maxWidth: MAX_WIDTH,
            marginHorizontal: 'auto',
            paddingHorizontal: isMobile ? 24 : 48,
          }}
        >
          <View
            style={{
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between',
              alignItems: isMobile ? 'flex-start' : 'center',
              paddingVertical: 24,
              gap: isMobile ? 16 : 0,
            }}
          >
            <Text style={{ fontSize: 14, color: '#878685' }}>© 2026 k9d8. All rights reserved.</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
