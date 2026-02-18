import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, Image, ActivityIndicator, Linking, useWindowDimensions } from 'react-native';
import Map, { Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SEOHead, StructuredData, placeSchema, breadcrumbSchema } from '@/src/components/seo';
import { getParkByShortId, getParkById, getParksNearby, stateAbbrevToName } from '@/src/services/parks';
import { getActiveCheckIns } from '@/src/services/checkins';
import type { CheckIn } from '@/src/types/database';
import { parseSlugOrId, generateParkSlug } from '@/src/utils/slug';

function extractStateAbbrev(row: { city?: string | null; state?: string | null }): string | null {
  const st = row.state?.trim() ?? '';
  if (/^[A-Z]{2}(\s|$)/.test(st)) return st.slice(0, 2);
  const city = row.city?.trim() ?? '';
  if (/^\d+$/.test(st) && /^[A-Z]{2}$/.test(city)) return city;
  return null;
}
import NavBar from '@/src/components/web/NavBar';
import Footer from '@/src/components/web/Footer';
import type { Park } from '@/src/types/database';

const MAX_WIDTH = 1200;

function Container({ children, style }: { children: React.ReactNode; style?: any }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  return (
    <View
      style={[
        { width: '100%', maxWidth: MAX_WIDTH, marginHorizontal: 'auto', paddingHorizontal: isMobile ? 20 : 32 },
        style,
      ]}
    >
      {children}
    </View>
  );
}

function FeatureTag({ label, icon }: { label: string; icon: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 100,
        backgroundColor: '#F0EFEC',
      }}
    >
      <Ionicons name={icon as any} size={12} color="#6D6C6A" />
      <Text style={{ fontSize: 11, fontWeight: '500', color: '#6D6C6A' }}>{label}</Text>
    </View>
  );
}

export default function PublicParkDetail({ slugOrId }: { slugOrId: string }) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [park, setPark] = useState<Park | null>(null);
  const [nearbyParks, setNearbyParks] = useState<Park[]>([]);
  const [activeCheckIns, setActiveCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slugOrId) return;
    const parsed = parseSlugOrId(slugOrId);

    const fetchPark = async () => {
      try {
        let result: Park | null = null;
        if (parsed.type === 'uuid') {
          result = await getParkById(parsed.id);
        } else if (parsed.type === 'slug') {
          result = await getParkByShortId(parsed.shortId);
        }
        setPark(result);

        if (result) {
          const [nearby, checkIns] = await Promise.all([
            getParksNearby(result.latitude, result.longitude, 0.5),
            getActiveCheckIns(result.id).catch(() => [] as CheckIn[]),
          ]);
          setNearbyParks(nearby.filter((p) => p.id !== result!.id).slice(0, 3));
          setActiveCheckIns(checkIns);
        }
      } catch {
        // Error loading park
      } finally {
        setLoading(false);
      }
    };
    fetchPark();
  }, [slugOrId]);

  const activeDogs = activeCheckIns.flatMap((ci) => (ci.dogs ?? []).map((dog) => dog));

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F4F1' }}>
        <ActivityIndicator size="large" color="#3D8A5A" />
      </View>
    );
  }

  if (!park) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F4F1', gap: 16 }}>
        <Text style={{ fontSize: 18, color: '#6D6C6A' }}>Park not found</Text>
        <Pressable onPress={() => router.push('/dog-parks' as any)}>
          <Text style={{ fontSize: 16, color: '#3D8A5A', fontWeight: '600' }}>Browse Dog Parks</Text>
        </Pressable>
      </View>
    );
  }

  const stateAbbrev = extractStateAbbrev(park);
  const stateName = stateAbbrev ? stateAbbrevToName(stateAbbrev) : null;
  const stateSlug = stateName ? stateName.toLowerCase().replace(/\s+/g, '-') : '';
  const features: Array<{ label: string; icon: string }> = [];
  if (park.is_fenced) features.push({ label: 'Fenced', icon: 'shield-checkmark-outline' });
  if (park.has_water) features.push({ label: 'Water', icon: 'water-outline' });
  if (park.has_shade) features.push({ label: 'Shaded', icon: 'leaf-outline' });

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${park.latitude},${park.longitude}`;

  // Shared sections
  const aboutSection = (
    <View style={{ gap: isMobile ? 12 : 14 }}>
      <Text
        style={{
          fontSize: isMobile ? 18 : 20,
          fontWeight: '600',
          color: '#1A1918',
          letterSpacing: -0.3,
        }}
      >
        About This Park
      </Text>
      {park.description && (
        <Text style={{ fontSize: 14, color: '#6D6C6A', lineHeight: 22 }}>{park.description}</Text>
      )}
      <View style={{ flexDirection: 'row', gap: isMobile ? 16 : 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: isMobile ? 4 : 6 }}>
          <Ionicons name="sunny-outline" size={isMobile ? 14 : 16} color={isMobile ? '#3D8A5A' : '#9C9B99'} />
          <Text style={{ fontSize: isMobile ? 12 : 13, fontWeight: '500', color: '#6D6C6A' }}>Dawn to dusk</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: isMobile ? 4 : 6 }}>
          <Ionicons name="resize-outline" size={isMobile ? 14 : 16} color={isMobile ? '#3D8A5A' : '#9C9B99'} />
          <Text style={{ fontSize: isMobile ? 12 : 13, fontWeight: '500', color: '#6D6C6A' }}>
            {park.acres ? `${park.acres} acres` : 'Free admission'}
          </Text>
        </View>
      </View>
    </View>
  );

  const featuresSection = features.length > 0 && (
    <View style={{ gap: isMobile ? 12 : 14 }}>
      <Text
        style={{
          fontSize: isMobile ? 18 : 20,
          fontWeight: '600',
          color: '#1A1918',
          letterSpacing: -0.3,
        }}
      >
        Park Features
      </Text>
      <View style={{ flexDirection: 'row', gap: isMobile ? 6 : 8, flexWrap: 'wrap' }}>
        {features.map((f) => (
          <FeatureTag key={f.label} label={f.label} icon={f.icon} />
        ))}
      </View>
    </View>
  );

  const ctaCard = (
    <View
      style={{
        backgroundColor: '#3D8A5A',
        borderRadius: 16,
        padding: isMobile ? 24 : 20,
        gap: isMobile ? 12 : 14,
        alignItems: 'center',
      }}
    >
      <Ionicons name="paw" size={28} color="#FFFFFF" />
      <Text style={{ fontSize: isMobile ? 18 : 17, fontWeight: '600', color: '#FFFFFF', textAlign: 'center' }}>
        Join the Community
      </Text>
      <Text
        style={{
          fontSize: 12,
          color: 'rgba(255,255,255,0.8)',
          textAlign: 'center',
          lineHeight: 18,
        }}
      >
        Check in, see who's here, and schedule play dates.
      </Text>
      <Pressable
        onPress={() => router.push('/(auth)/sign-up')}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 100,
          paddingVertical: isMobile ? 12 : 10,
          paddingHorizontal: isMobile ? 24 : 20,
          width: '100%',
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#3D8A5A' }}>Sign Up Free</Text>
      </Pressable>
    </View>
  );

  const divider = <View style={{ height: 1, backgroundColor: '#E5E4E1', width: '100%' }} />;

  return (
    <>
      <SEOHead
        title={park.name}
        description={
          park.description ||
          `Visit ${park.name}${park.city ? ` in ${park.city}` : ''}. Find directions, park features, and nearby dog parks.`
        }
        url={`/dog-parks/${generateParkSlug(park.name, park.id)}`}
      />
      <StructuredData data={placeSchema(park)} />
      <StructuredData
        data={breadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Dog Parks', url: '/dog-parks' },
          ...(stateName ? [{ name: stateName, url: `/dog-parks/${stateSlug}` }] : []),
        ])}
      />

      <ScrollView style={{ flex: 1, backgroundColor: '#F5F4F1' }} contentContainerStyle={{ minHeight: '100%' }}>
        <NavBar />

        {/* Hero Image */}
        <View
          style={{
            width: '100%',
            height: isMobile ? 240 : 320,
            backgroundColor: '#EDECEA',
            overflow: 'hidden',
          }}
        >
          <Image
            source={{ uri: park.image_url || '/images/dog-park-placeholder.png' }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        </View>

        {/* Park Info Bar */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderBottomWidth: 1,
            borderBottomColor: '#E5E4E1',
            width: '100%',
          }}
        >
          <View style={{ padding: isMobile ? 20 : 24, paddingHorizontal: isMobile ? 20 : 32, gap: isMobile ? 12 : 16, maxWidth: MAX_WIDTH, marginHorizontal: 'auto', width: '100%' }}>
            {/* Breadcrumbs */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: isMobile ? 6 : 8 }}>
              {!isMobile && (
                <>
                  <Pressable onPress={() => router.push('/landing')}>
                    <Text style={{ fontSize: isMobile ? 11 : 13, fontWeight: '500', color: '#9C9B99' }}>Home</Text>
                  </Pressable>
                  <Text style={{ fontSize: isMobile ? 11 : 13, color: '#9C9B99' }}>/</Text>
                </>
              )}
              <Pressable onPress={() => router.push('/dog-parks' as any)}>
                <Text style={{ fontSize: isMobile ? 11 : 13, fontWeight: '500', color: '#9C9B99' }}>Dog Parks</Text>
              </Pressable>
              {stateAbbrev && (
                <>
                  <Text style={{ fontSize: isMobile ? 11 : 13, color: '#9C9B99' }}>/</Text>
                  <Pressable onPress={() => router.push(`/dog-parks/${stateSlug}` as any)}>
                    <Text style={{ fontSize: isMobile ? 11 : 13, fontWeight: '500', color: '#9C9B99' }}>
                      {isMobile ? stateAbbrev : stateName}
                    </Text>
                  </Pressable>
                </>
              )}
              {park.city && (
                <>
                  <Text style={{ fontSize: isMobile ? 11 : 13, color: '#9C9B99' }}>/</Text>
                  <Text style={{ fontSize: isMobile ? 11 : 13, fontWeight: '500', color: '#1A1918' }}>
                    {park.city}
                  </Text>
                </>
              )}
            </View>

            {/* Title + Address */}
            <View style={{ gap: 8 }}>
              <Text
                role="heading"
                aria-level={1}
                style={{
                  fontSize: isMobile ? 20 : 24,
                  fontWeight: '700',
                  color: '#1A1918',
                  letterSpacing: isMobile ? -0.3 : -0.5,
                }}
              >
                {park.name}
              </Text>
              {park.address && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="location-outline" size={isMobile ? 14 : 16} color="#9C9B99" />
                  <Text style={{ fontSize: isMobile ? 13 : 14, color: '#6D6C6A' }}>{park.address}</Text>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            {isMobile ? (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable
                  onPress={() => Linking.openURL(directionsUrl)}
                  style={{
                    flex: 1,
                    borderWidth: 1.5,
                    borderColor: '#D1D0CD',
                    borderRadius: 100,
                    paddingVertical: 14,
                    alignItems: 'center',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#1A1918' }}>Directions</Text>
                </Pressable>
                <Pressable
                  onPress={() => {}}
                  style={{
                    flex: 1,
                    borderWidth: 1.5,
                    borderColor: '#D1D0CD',
                    borderRadius: 100,
                    paddingVertical: 14,
                    alignItems: 'center',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#1A1918' }}>Share</Text>
                </Pressable>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Pressable
                  onPress={() => Linking.openURL(directionsUrl)}
                  style={{
                    borderWidth: 1.5,
                    borderColor: '#D1D0CD',
                    borderRadius: 100,
                    paddingHorizontal: 24,
                    paddingVertical: 14,
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#1A1918' }}>Directions</Text>
                </Pressable>
                <Pressable
                  onPress={() => {}}
                  style={{
                    borderWidth: 1.5,
                    borderColor: '#D1D0CD',
                    borderRadius: 100,
                    paddingHorizontal: 24,
                    paddingVertical: 14,
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#1A1918' }}>Share</Text>
                </Pressable>
                <Pressable
                  onPress={() => router.push('/(auth)/sign-up')}
                  style={{
                    backgroundColor: '#3D8A5A',
                    borderRadius: 100,
                    paddingHorizontal: 24,
                    paddingVertical: 14,
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>Sign Up to Check In</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>

        <View role="main">
          {isMobile ? (
            /* ──── Mobile: Single Column ──── */
            <View style={{ padding: 20, paddingTop: 24, gap: 28 }}>
              {aboutSection}
              {divider}
              {featuresSection}
              {featuresSection && divider}
              {ctaCard}
            </View>
          ) : (
            /* ──── Tablet+: Two Columns ──── */
            <View
              style={{
                maxWidth: MAX_WIDTH,
                marginHorizontal: 'auto',
                width: '100%',
                flexDirection: 'row',
                gap: 24,
                padding: 32,
              }}
            >
              {/* Left Column */}
              <View style={{ flex: 1, gap: 28 }}>
                {aboutSection}
                {divider}
                {featuresSection}
                {featuresSection && divider}

                {/* Location / Map */}
                <View style={{ gap: 14 }}>
                  <Text style={{ fontSize: 20, fontWeight: '600', color: '#1A1918', letterSpacing: -0.3 }}>
                    Location
                  </Text>
                  <Pressable
                    onPress={() => Linking.openURL(directionsUrl)}
                    style={{
                      width: '100%',
                      height: 240,
                      borderRadius: 16,
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    <Map
                      initialViewState={{
                        latitude: park.latitude,
                        longitude: park.longitude,
                        zoom: 14,
                      }}
                      style={{ width: '100%', height: '100%' }}
                      mapStyle="mapbox://styles/mapbox/outdoors-v12"
                      mapboxAccessToken={process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? ''}
                      interactive={false}
                      attributionControl={false}
                    >
                      <Marker latitude={park.latitude} longitude={park.longitude} anchor="center">
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: '#3D8A5A',
                            border: '3px solid #FFFFFF',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <span style={{ color: '#fff', fontSize: 14 }}>🐾</span>
                        </div>
                      </Marker>
                    </Map>
                    <View
                      style={{
                        position: 'absolute',
                        bottom: 16,
                        left: 16,
                        right: 16,
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        borderRadius: 12,
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={{ fontSize: 13, fontWeight: '500', color: '#1A1918' }} numberOfLines={1}>
                          {park.address || `${park.latitude.toFixed(4)}, ${park.longitude.toFixed(4)}`}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 12 }}>
                        <Ionicons name="navigate-outline" size={14} color="#3D8A5A" />
                        <Text style={{ fontSize: 12, color: '#3D8A5A', fontWeight: '500' }}>Directions</Text>
                      </View>
                    </View>
                  </Pressable>
                </View>
              </View>

              {/* Right Column */}
              <View style={{ width: 280, gap: 20 }}>
                {ctaCard}

                {/* Pups at the Park */}
                <View
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 16,
                    padding: 20,
                    gap: 14,
                    shadowColor: '#1A1918',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.03,
                    shadowRadius: 12,
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#1A1918' }}>Pups at the Park Now</Text>
                  {activeDogs.length === 0 ? (
                    <View style={{ alignItems: 'center', gap: 8, paddingVertical: 14 }}>
                      <Ionicons name="paw" size={28} color="#9C9B99" />
                      <Text style={{ fontSize: 12, color: '#9C9B99', textAlign: 'center' }}>
                        Sign up to see who's here!
                      </Text>
                    </View>
                  ) : (
                    <View style={{ gap: 12 }}>
                      {activeDogs.map((dog) => (
                        <View key={dog.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <Image
                            source={{
                              uri:
                                dog.photo_url ||
                                'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=100&h=100&fit=crop',
                            }}
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 18,
                              borderWidth: 2,
                              borderColor: '#E5E4E1',
                            }}
                            resizeMode="cover"
                          />
                          <View style={{ flex: 1, gap: 1 }}>
                            <Text style={{ fontSize: 13, fontWeight: '500', color: '#1A1918' }}>{dog.name}</Text>
                            <Text style={{ fontSize: 11, color: '#9C9B99' }}>{dog.breed || 'Dog'}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                {/* Nearby Parks */}
                {nearbyParks.length > 0 && (
                  <View
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: 16,
                      overflow: 'hidden',
                      shadowColor: '#1A1918',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.03,
                      shadowRadius: 12,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingVertical: 14,
                        paddingHorizontal: 20,
                        borderBottomWidth: 1,
                        borderBottomColor: '#E5E4E1',
                      }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#1A1918' }}>Nearby Parks</Text>
                      <Pressable onPress={() => router.push(`/dog-parks/${stateSlug}` as any)}>
                        <Text style={{ fontSize: 12, fontWeight: '500', color: '#3D8A5A' }}>View All</Text>
                      </Pressable>
                    </View>
                    {nearbyParks.map((np, i) => (
                      <Pressable
                        key={np.id}
                        onPress={() => router.push(`/dog-parks/${generateParkSlug(np.name, np.id)}` as any)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 10,
                          paddingVertical: 12,
                          paddingHorizontal: 20,
                          ...(i < nearbyParks.length - 1 && {
                            borderBottomWidth: 1,
                            borderBottomColor: '#E5E4E1',
                          }),
                        }}
                      >
                        <Ionicons name="location" size={14} color="#9C9B99" />
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text style={{ fontSize: 13, fontWeight: '500', color: '#1A1918' }}>{np.name}</Text>
                          <Text style={{ fontSize: 11, color: '#9C9B99' }}>{np.city || ''}</Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}
        </View>

        <View style={{ flex: 1 }} />
        <Footer />
      </ScrollView>
    </>
  );
}
