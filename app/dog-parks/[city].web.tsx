import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SEOHead, StructuredData } from '@/src/components/seo';
import { getParksByCity } from '@/src/services/parks';
import { generateParkSlug } from '@/src/utils/slug';
import type { Park } from '@/src/types/database';

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

function ParkCard({ park, onPress }: { park: Park; onPress: () => void }) {
  const features: string[] = [];
  if (park.is_fenced) features.push('Fenced');
  if (park.has_water) features.push('Water');
  if (park.has_shade) features.push('Shade');

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        gap: 10,
        shadowColor: '#1A1918',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 12,
      }}
    >
      <Text style={{ fontSize: 17, fontWeight: '600', color: '#1A1918' }}>{park.name}</Text>
      {park.address && (
        <Text style={{ fontSize: 14, color: '#6D6C6A' }}>{park.address}</Text>
      )}
      {features.length > 0 && (
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {features.map((f) => (
            <View
              key={f}
              style={{
                backgroundColor: '#E8F0E8',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 9999,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '500', color: '#3D8A5A' }}>{f}</Text>
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
}

export default function CityDogParksPage() {
  const { city: citySlug } = useLocalSearchParams<{ city: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [parks, setParks] = useState<Park[]>([]);
  const [loading, setLoading] = useState(true);

  // Convert slug back to city name: "madison" → "Madison", "new-york" → "New York"
  const cityName = (citySlug || '')
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  useEffect(() => {
    if (!cityName) return;
    getParksByCity(cityName)
      .then(setParks)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [cityName]);

  const stateName = parks[0]?.state || '';
  const pageTitle = stateName
    ? `Dog Parks in ${cityName}, ${stateName}`
    : `Dog Parks in ${cityName}`;

  return (
    <>
      <SEOHead
        title={pageTitle}
        description={`Find ${parks.length || ''} dog parks in ${cityName}. Browse off-leash areas, fenced parks, and dog-friendly spots. Schedule a playdate with k9d8.`}
        url={`/dog-parks/${citySlug}`}
      />
      {parks.length > 0 && (
        <StructuredData
          data={{
            '@type': 'ItemList',
            name: pageTitle,
            numberOfItems: parks.length,
            itemListElement: parks.slice(0, 10).map((park, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              item: {
                '@type': 'Place',
                name: park.name,
                address: park.address,
              },
            })),
          }}
        />
      )}
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

        <View role="main">
          {/* Breadcrumb */}
          <Container>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 }}>
              <Pressable onPress={() => router.push('/dog-parks' as any)}>
                <Text style={{ fontSize: 14, color: '#3D8A5A', fontWeight: '500' }}>Dog Parks</Text>
              </Pressable>
              <Ionicons name="chevron-forward" size={12} color="#878685" />
              <Text style={{ fontSize: 14, color: '#6D6C6A' }}>{cityName}</Text>
            </View>
          </Container>

          {/* Hero */}
          <View style={{ width: '100%', paddingVertical: isMobile ? 24 : 40 }}>
            <Container style={{ gap: 12 }}>
              <Text
                role="heading"
                aria-level={1}
                style={{
                  fontSize: isMobile ? 32 : 44,
                  fontWeight: '700',
                  color: '#1A1918',
                  lineHeight: isMobile ? 38 : 52,
                }}
              >
                {pageTitle}
              </Text>
              {!loading && (
                <Text style={{ fontSize: 16, color: '#6D6C6A' }}>
                  {parks.length} {parks.length === 1 ? 'park' : 'parks'} found
                </Text>
              )}
            </Container>
          </View>

          {/* Park List */}
          <View style={{ width: '100%', paddingBottom: 60 }}>
            <Container>
              {loading ? (
                <ActivityIndicator size="large" color="#3D8A5A" style={{ paddingVertical: 60 }} />
              ) : parks.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 60, gap: 16 }}>
                  <Ionicons name="location-outline" size={40} color="#878685" />
                  <Text style={{ fontSize: 16, color: '#6D6C6A', textAlign: 'center' }}>
                    No parks found in {cityName}. Try browsing our full directory.
                  </Text>
                  <Pressable
                    onPress={() => router.push('/dog-parks' as any)}
                    style={{ backgroundColor: '#3D8A5A', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 9999 }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '600' }}>Browse All Cities</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={{ gap: 12 }}>
                  {parks.map((park) => (
                    <ParkCard
                      key={park.id}
                      park={park}
                      onPress={() => router.push(`/parks/${generateParkSlug(park.name, park.id)}`)}
                    />
                  ))}
                </View>
              )}
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
                <Pressable onPress={() => router.push('/dog-parks' as any)}>
                  <Text style={{ fontSize: 14, color: '#878685' }}>Dog Parks</Text>
                </Pressable>
                <Pressable onPress={() => router.push('/landing')}>
                  <Text style={{ fontSize: 14, color: '#878685' }}>Home</Text>
                </Pressable>
              </View>
            </View>
          </Container>
        </View>
      </ScrollView>
    </>
  );
}
