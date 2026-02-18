import React from 'react';
import { View, Text, Pressable, ScrollView, useWindowDimensions } from 'react-native';
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

interface FeatureCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: 280,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 28,
        gap: 14,
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          backgroundColor: '#E8F0E8',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Ionicons name={icon} size={24} color="#3D8A5A" />
      </View>
      <Text style={{ fontSize: 18, fontWeight: '600', color: '#1A1918' }}>
        {title}
      </Text>
      <Text style={{ fontSize: 15, color: '#6D6C6A', lineHeight: 23 }}>{description}</Text>
    </View>
  );
}

export default function FeaturesPage() {
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
            <Pressable
              onPress={() => router.push('/(auth)/sign-up')}
              style={{ backgroundColor: '#3D8A5A', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 9999 }}
            >
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Sign Up Free</Text>
            </Pressable>
          </View>
        </Container>
      </View>

      {/* Hero */}
      <View style={{ width: '100%', paddingVertical: isMobile ? 40 : 80 }}>
        <Container style={{ alignItems: 'center', gap: 20 }}>
          <Text
            style={{
              fontSize: isMobile ? 36 : 52,
              fontWeight: '700',
              color: '#1A1918',
              textAlign: 'center',
            }}
          >
            Everything you need for dog park adventures
          </Text>
          <Text
            style={{
              fontSize: isMobile ? 16 : 20,
              color: '#6D6C6A',
              textAlign: 'center',
              maxWidth: 600,
            }}
          >
            k9d8 helps dog owners find parks, connect with other owners, and schedule playdates — all in one app.
          </Text>
        </Container>
      </View>

      {/* Feature Grid */}
      <View style={{ width: '100%', paddingBottom: isMobile ? 60 : 100 }}>
        <Container>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 20 }}>
            <FeatureCard
              icon="map"
              title="Interactive Dog Park Map"
              description="Browse dog parks across the US on an interactive map. Filter by amenities like fencing, water fountains, and shade. See real-time activity at each park."
            />
            <FeatureCard
              icon="location"
              title="Real-Time Check-Ins"
              description="Check in when you arrive at a park. See which dogs are there right now so you can find the perfect playmate for your pup."
            />
            <FeatureCard
              icon="calendar"
              title="Playdate Scheduling"
              description="Schedule playdates with dogs you've met. Pick a park, set a time, and invite friends. RSVP tracking keeps everyone in the loop."
            />
            <FeatureCard
              icon="chatbubble"
              title="Direct Messaging"
              description="Message other dog owners directly. Coordinate meetups, share tips, and build lasting friendships for you and your dog."
            />
            <FeatureCard
              icon="paw"
              title="Dog Profiles"
              description="Create detailed profiles for your dogs with breed, size, temperament, and photos. Help other owners find compatible playmates."
            />
            <FeatureCard
              icon="people"
              title="Friend Connections"
              description="Add friends you meet at the park. Build your dog owner network and never lose touch with your pup's favorite playmates."
            />
          </View>
        </Container>
      </View>

      {/* CTA */}
      <View style={{ width: '100%', paddingVertical: isMobile ? 40 : 60 }}>
        <Container>
          <View
            style={{
              backgroundColor: '#3D8A5A',
              borderRadius: 24,
              padding: isMobile ? 32 : 48,
              alignItems: 'center',
              gap: 20,
            }}
          >
            <Text
              style={{ fontSize: isMobile ? 28 : 36, fontWeight: '700', color: '#fff', textAlign: 'center' }}
            >
              Ready to get started?
            </Text>
            <Pressable
              onPress={() => router.push('/(auth)/sign-up')}
              style={{ backgroundColor: '#fff', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 9999 }}
            >
              <Text style={{ color: '#3D8A5A', fontWeight: '600', fontSize: 17 }}>Sign Up Free</Text>
            </Pressable>
          </View>
        </Container>
      </View>

      {/* Footer */}
      <View style={{ borderTopWidth: 1, borderTopColor: '#E5E4E1', backgroundColor: '#fff' }}>
        <Container>
          <View style={{ paddingVertical: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: '#878685' }}>© 2026 k9d8. All rights reserved.</Text>
            <View style={{ flexDirection: 'row', gap: 24 }}>
              <Pressable onPress={() => router.push('/landing')}>
                <Text style={{ fontSize: 14, color: '#878685' }}>Home</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/download' as any)}>
                <Text style={{ fontSize: 14, color: '#878685' }}>Download</Text>
              </Pressable>
            </View>
          </View>
        </Container>
      </View>
    </ScrollView>
  );
}
