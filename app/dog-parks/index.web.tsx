import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SEOHead } from '@/src/components/seo';
import { getParkStateCounts } from '@/src/services/parks';
import NavBar from '@/src/components/web/NavBar';
import Footer from '@/src/components/web/Footer';

const MAX_WIDTH = 1200;

function Container({ children, style }: { children: React.ReactNode; style?: any }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  return (
    <View
      style={[
        { width: '100%', maxWidth: MAX_WIDTH, marginHorizontal: 'auto', paddingHorizontal: isMobile ? 20 : 48 },
        style,
      ]}
    >
      {children}
    </View>
  );
}

interface StateEntry {
  state: string;
  count: number;
}

export default function DogParksDirectoryPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [states, setStates] = useState<StateEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getParkStateCounts()
      .then(setStates)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalParks = states.reduce((sum, s) => sum + s.count, 0);

  // Filter states by search query, or show top states
  const maxPerCol = 5;
  const colCount = isMobile ? 1 : Math.min(3, Math.ceil(states.length / maxPerCol));
  const defaultCount = isMobile ? maxPerCol : colCount * maxPerCol;
  const filteredStates = search
    ? states.filter((s) => s.state.toLowerCase().includes(search.toLowerCase()))
    : states.slice(0, defaultCount);

  // Split into columns with up to 5 states each
  const columns = Array.from({ length: isMobile ? 1 : Math.ceil(filteredStates.length / maxPerCol) }, (_, i) =>
    filteredStates.slice(i * maxPerCol, (i + 1) * maxPerCol)
  ).filter((col) => col.length > 0);

  return (
    <>
      <SEOHead
        title="Dog Parks Directory - Find Dog Parks Across the US"
        description="Browse dog parks by city and state. Find off-leash areas, fenced parks, and dog-friendly spots near you. Powered by k9d8."
        url="/dog-parks"
      />
      <ScrollView style={{ flex: 1, backgroundColor: '#F5F4F1' }} contentContainerStyle={{ minHeight: '100%' }}>
        <NavBar />

        <View role="main">
          {/* Hero Section */}
          <View
            style={{
              alignItems: 'center',
              backgroundColor: '#FAFAF8',
              paddingTop: isMobile ? 32 : 40,
              paddingBottom: isMobile ? 28 : 36,
              width: '100%',
            }}
          >
           <Container style={{ alignItems: 'center', gap: isMobile ? 16 : 20 }}>
            <Text
              role="heading"
              aria-level={1}
              style={{
                fontSize: isMobile ? 26 : 32,
                fontWeight: '700',
                color: '#1A1918',
                letterSpacing: -0.5,
                textAlign: 'center',
              }}
            >
              Dog Parks Directory
            </Text>
            <Text
              style={{
                fontSize: isMobile ? 14 : 15,
                color: '#6D6C6A',
                textAlign: 'center',
                maxWidth: isMobile ? undefined : 500,
                lineHeight: isMobile ? 21 : 23,
              }}
            >
              Find dog parks near you. Browse by city and state to discover off-leash areas
              {!isMobile && ', fenced parks,'} and dog-friendly spots.
            </Text>

            {/* Search */}
            <View
              style={{
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                maxWidth: isMobile ? undefined : 520,
              }}
            >
              <View
                style={{
                  flex: isMobile ? undefined : 1,
                  width: isMobile ? '100%' : undefined,
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#FFFFFF',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#E5E4E1',
                  paddingHorizontal: 16,
                  height: 48,
                  gap: 10,
                }}
              >
                <Ionicons name="search" size={18} color="#9C9B99" />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search parks..."
                  placeholderTextColor="#9C9B99"
                  style={{ flex: 1, fontSize: 15, color: '#1A1918', outlineStyle: 'none' } as any}
                />
              </View>
              {search ? (
                <Pressable
                  onPress={() => setSearch('')}
                  style={{
                    backgroundColor: '#6D6C6A',
                    paddingHorizontal: 24,
                    height: 48,
                    borderRadius: 100,
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: isMobile ? '100%' : undefined,
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Clear</Text>
                </Pressable>
              ) : (
                <Pressable
                  style={{
                    backgroundColor: '#3D8A5A',
                    paddingHorizontal: 24,
                    height: 48,
                    borderRadius: 100,
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: isMobile ? '100%' : undefined,
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Search</Text>
                </Pressable>
              )}
            </View>

            {/* Stats Row - mobile only */}
            {isMobile && !loading && (
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-around',
                  width: '100%',
                }}
              >
                <View style={{ alignItems: 'center', gap: 2 }}>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: '#1A1918' }}>
                    {totalParks.toLocaleString()}
                  </Text>
                  <Text style={{ fontSize: 11, fontWeight: '500', color: '#9C9B99' }}>Parks</Text>
                </View>
                <View style={{ alignItems: 'center', gap: 2 }}>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: '#1A1918' }}>847</Text>
                  <Text style={{ fontSize: 11, fontWeight: '500', color: '#9C9B99' }}>Off-Leash</Text>
                </View>
                <View style={{ alignItems: 'center', gap: 2 }}>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: '#1A1918' }}>
                    {states.length}
                  </Text>
                  <Text style={{ fontSize: 11, fontWeight: '500', color: '#9C9B99' }}>States</Text>
                </View>
              </View>
            )}
           </Container>
          </View>

          {/* Content Area */}
          <Container
            style={{
              gap: isMobile ? 32 : 36,
              paddingTop: isMobile ? 24 : 32,
              paddingBottom: isMobile ? 20 : 32,
            }}
          >
            {loading ? (
              <ActivityIndicator size="large" color="#3D8A5A" style={{ paddingVertical: 60 }} />
            ) : (
              <>
                {/* Browse by State */}
                <View style={{ gap: 16 }}>
                  <Text
                    role="heading"
                    aria-level={2}
                    style={{
                      fontSize: isMobile ? 20 : 22,
                      fontWeight: '600',
                      color: '#1A1918',
                      letterSpacing: -0.3,
                    }}
                  >
                    {search ? `Results for "${search}"` : 'Browse by State'}
                  </Text>

                  {filteredStates.length === 0 ? (
                    <View style={{ alignItems: 'center', paddingVertical: 40, gap: 12 }}>
                      <Ionicons name="search-outline" size={32} color="#9C9B99" />
                      <Text style={{ fontSize: 15, color: '#6D6C6A' }}>
                        No states match &ldquo;{search}&rdquo;
                      </Text>
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      {columns.map((col, colIdx) => (
                        <View
                          key={colIdx}
                          style={{
                            flex: 1,
                            backgroundColor: '#FFFFFF',
                            borderRadius: 16,
                            overflow: 'hidden',
                            shadowColor: '#1A1918',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.03,
                            shadowRadius: 12,
                          }}
                        >
                          {col.map((entry, i) => {
                            const stateSlug = entry.state.toLowerCase().replace(/\s+/g, '-');
                            return (
                              <Pressable
                                key={entry.state}
                                onPress={() => router.push(`/dog-parks/${stateSlug}` as any)}
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  paddingVertical: 14,
                                  paddingHorizontal: 16,
                                  ...(i < col.length - 1 && {
                                    borderBottomWidth: 1,
                                    borderBottomColor: '#E5E4E1',
                                  }),
                                }}
                              >
                                <Text style={{ fontSize: 14, fontWeight: '500', color: '#1A1918' }}>
                                  {entry.state}
                                </Text>
                                <Text style={{ fontSize: 12, fontWeight: '500', color: '#9C9B99' }}>
                                  {isMobile ? `${entry.count} parks` : entry.count}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      ))}
                    </View>
                  )}

                  {/* View all link - mobile */}
                  {isMobile && !search && states.length > filteredStates.length && (
                    <Pressable onPress={() => setSearch(' ')}>
                      <Text style={{ fontSize: 13, fontWeight: '500', color: '#3D8A5A' }}>
                        View all states →
                      </Text>
                    </Pressable>
                  )}
                </View>

                {/* CTA Banner */}
                <View
                  style={{
                    alignItems: 'center',
                    backgroundColor: '#3D8A5A',
                    borderRadius: 20,
                    gap: 14,
                    paddingVertical: isMobile ? 32 : 36,
                    paddingHorizontal: isMobile ? 24 : 32,
                    width: '100%',
                  }}
                >
                  <Text
                    style={{
                      fontSize: isMobile ? 20 : 22,
                      fontWeight: '700',
                      color: '#FFFFFF',
                      letterSpacing: -0.3,
                      textAlign: 'center',
                    }}
                  >
                    Join the k9d8 Community
                  </Text>
                  <Text
                    style={{
                      fontSize: isMobile ? 13 : 14,
                      color: 'rgba(255,255,255,0.8)',
                      textAlign: 'center',
                      maxWidth: isMobile ? undefined : 440,
                      lineHeight: isMobile ? 20 : 21,
                    }}
                  >
                    {isMobile
                      ? 'Track park visits and connect with dog owners.'
                      : 'Track your park visits, connect with other dog owners, and discover new favorite spots.'}
                  </Text>
                  {isMobile ? (
                    <Pressable
                      onPress={() => router.push('/(auth)/sign-up')}
                      style={{
                        backgroundColor: '#FFFFFF',
                        paddingVertical: 12,
                        paddingHorizontal: 24,
                        borderRadius: 100,
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                      }}
                    >
                      <Text style={{ fontSize: 15, fontWeight: '600', color: '#3D8A5A' }}>Sign Up Free</Text>
                    </Pressable>
                  ) : (
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <Pressable
                        onPress={() => router.push('/(auth)/sign-up')}
                        style={{
                          backgroundColor: '#FFFFFF',
                          paddingVertical: 12,
                          paddingHorizontal: 24,
                          borderRadius: 100,
                        }}
                      >
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#3D8A5A' }}>Sign Up Free</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => router.push('/features' as any)}
                        style={{
                          paddingVertical: 12,
                          paddingHorizontal: 24,
                          borderRadius: 100,
                          borderWidth: 1.5,
                          borderColor: 'rgba(255,255,255,0.4)',
                        }}
                      >
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>Learn More</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              </>
            )}
          </Container>
        </View>

        <View style={{ flex: 1 }} />
        <Footer />
      </ScrollView>
    </>
  );
}
