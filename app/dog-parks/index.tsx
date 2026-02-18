import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getParkCityCounts } from '@/src/services/parks';

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

interface CityEntry {
  city: string;
  state: string;
  count: number;
}

export default function DogParksDirectoryPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [cities, setCities] = useState<CityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getParkCityCounts()
      .then(setCities)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Group cities by state
  const byState = cities.reduce<Record<string, CityEntry[]>>((acc, entry) => {
    if (!acc[entry.state]) acc[entry.state] = [];
    acc[entry.state].push(entry);
    return acc;
  }, {});

  const sortedStates = Object.keys(byState).sort();

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
      <View style={{ width: '100%', paddingVertical: isMobile ? 40 : 60 }}>
        <Container style={{ gap: 16 }}>
          <Text
            style={{
              fontSize: isMobile ? 36 : 48,
              fontWeight: '700',
              color: '#1A1918',
            }}
          >
            Dog Parks Directory
          </Text>
          <Text style={{ fontSize: isMobile ? 16 : 18, color: '#6D6C6A', maxWidth: 600 }}>
            Find dog parks near you. Browse by city and state to discover off-leash areas, fenced parks, and
            dog-friendly spots.
          </Text>
        </Container>
      </View>

      {/* Content */}
      <View style={{ width: '100%', paddingBottom: 60 }}>
        <Container>
          {loading ? (
            <ActivityIndicator size="large" color="#3D8A5A" style={{ paddingVertical: 60 }} />
          ) : sortedStates.length === 0 ? (
            <Text style={{ fontSize: 16, color: '#6D6C6A', textAlign: 'center', paddingVertical: 60 }}>
              No parks found. Check back soon!
            </Text>
          ) : (
            <View style={{ gap: 32 }}>
              {sortedStates.map((state) => (
                <View key={state} style={{ gap: 12 }}>
                  <Text style={{ fontSize: 22, fontWeight: '700', color: '#1A1918' }}>
                    {state}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                    {byState[state].map((entry) => {
                      const slug = entry.city.toLowerCase().replace(/\s+/g, '-');
                      return (
                        <Pressable
                          key={`${entry.city}-${entry.state}`}
                          onPress={() => router.push(`/dog-parks/${slug}` as any)}
                          style={{
                            backgroundColor: '#fff',
                            borderRadius: 12,
                            paddingHorizontal: 20,
                            paddingVertical: 14,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 10,
                          }}
                        >
                          <Ionicons name="location" size={16} color="#3D8A5A" />
                          <Text style={{ fontSize: 15, fontWeight: '500', color: '#1A1918' }}>
                            {entry.city}
                          </Text>
                          <Text style={{ fontSize: 13, color: '#878685' }}>
                            {entry.count} {entry.count === 1 ? 'park' : 'parks'}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          )}
        </Container>
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
