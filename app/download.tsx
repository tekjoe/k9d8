import React from 'react';
import { View, Text, Pressable, ScrollView, Linking, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

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

interface StoreButtonProps {
  label: string;
  sublabel: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

function StoreButton({ label, sublabel, icon, onPress }: StoreButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1A1918',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        gap: 12,
        minWidth: 200,
      }}
    >
      <Ionicons name={icon} size={28} color="#fff" />
      <View>
        <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{sublabel}</Text>
        <Text style={{ fontSize: 17, fontWeight: '600', color: '#fff' }}>{label}</Text>
      </View>
    </Pressable>
  );
}

export default function DownloadPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F5F4F1' }} contentContainerStyle={{ minHeight: '100%' }}>
      {/* Header */}
      <View style={{ width: '100%', paddingVertical: 24 }}>
        <Container>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Pressable onPress={() => router.push('/landing')}>
              <Text style={{ fontSize: 24, fontWeight: '700', color: '#1A1918' }}>k9d8</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/features' as any)}>
              <Text style={{ fontSize: 15, fontWeight: '500', color: '#6D6C6A' }}>Features</Text>
            </Pressable>
          </View>
        </Container>
      </View>

      <View>
        {/* Hero */}
        <View style={{ width: '100%', paddingVertical: isMobile ? 60 : 120 }}>
          <Container style={{ alignItems: 'center', gap: 32 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 20,
                backgroundColor: '#3D8A5A',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name="paw" size={40} color="#fff" />
            </View>
            <Text
              style={{
                fontSize: isMobile ? 36 : 52,
                fontWeight: '700',
                color: '#1A1918',
                textAlign: 'center',
                lineHeight: isMobile ? 42 : 60,
              }}
            >
              Get k9d8 for free
            </Text>
            <Text
              style={{
                fontSize: isMobile ? 16 : 20,
                color: '#6D6C6A',
                textAlign: 'center',
                maxWidth: 500,
                lineHeight: isMobile ? 24 : 30,
              }}
            >
              Find dog parks, schedule playdates, and connect with dog owners near you.
            </Text>

            {/* Store Buttons */}
            <View style={{ flexDirection: isMobile ? 'column' : 'row', gap: 16, marginTop: 8 }}>
              <StoreButton
                label="App Store"
                sublabel="Download on the"
                icon="logo-apple"
                onPress={() => Linking.openURL('https://apps.apple.com')}
              />
              <StoreButton
                label="Google Play"
                sublabel="Get it on"
                icon="logo-google-playstore"
                onPress={() => Linking.openURL('https://play.google.com')}
              />
            </View>

            <Text style={{ fontSize: 14, color: '#878685', marginTop: 8 }}>
              Free forever. No credit card required.
            </Text>
          </Container>
        </View>

        {/* Features Summary */}
        <View style={{ width: '100%', backgroundColor: '#fff', paddingVertical: isMobile ? 40 : 60 }}>
          <Container>
            <View style={{ flexDirection: isMobile ? 'column' : 'row', gap: 32 }}>
              {[
                { icon: 'map' as const, text: 'Interactive dog park map' },
                { icon: 'calendar' as const, text: 'Playdate scheduling' },
                { icon: 'chatbubble' as const, text: 'Direct messaging' },
                { icon: 'paw' as const, text: 'Dog profiles' },
              ].map((item) => (
                <View key={item.text} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Ionicons name={item.icon} size={20} color="#3D8A5A" />
                  <Text style={{ fontSize: 15, fontWeight: '500', color: '#1A1918' }}>{item.text}</Text>
                </View>
              ))}
            </View>
          </Container>
        </View>
      </View>

      {/* Footer */}
      <View style={{ flex: 1 }} />
      <View style={{ borderTopWidth: 1, borderTopColor: '#E5E4E1', backgroundColor: '#fff' }}>
        <Container>
          <View style={{ paddingVertical: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: '#878685' }}>© 2026 k9d8. All rights reserved.</Text>
            <View style={{ flexDirection: 'row', gap: 24 }}>
              <Pressable onPress={() => router.push('/landing')}>
                <Text style={{ fontSize: 14, color: '#878685' }}>Home</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/features' as any)}>
                <Text style={{ fontSize: 14, color: '#878685' }}>Features</Text>
              </Pressable>
            </View>
          </View>
        </Container>
      </View>
    </ScrollView>
  );
}
