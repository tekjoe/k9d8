import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator, Image, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SEOHead, StructuredData, breadcrumbSchema } from '@/src/components/seo';
import { getParksByState } from '@/src/services/parks';
import { generateParkSlug, extractShortIdFromSlug } from '@/src/utils/slug';
import NavBar from '@/src/components/web/NavBar';
import Footer from '@/src/components/web/Footer';
import PublicParkDetail from '@/src/components/web/PublicParkDetail';
import ParkDetailAuth from '@/src/components/web/ParkDetailAuth';
import { useAuth } from '@/src/hooks/useAuth';
import type { Park } from '@/src/types/database';

const MAX_WIDTH = 1200;
const PARKS_PER_PAGE = 12;

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

const FILTER_TAGS = [
  { key: 'all', label: 'All Parks', icon: null },
  { key: 'fenced', label: 'Fenced', icon: 'shield-outline' as const },
  { key: 'water', label: 'Water Fountain', icon: 'water-outline' as const },
  { key: 'shade', label: 'Shaded Areas', icon: 'leaf-outline' as const },
];

function ParkCard({ park, onPress }: { park: Park; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
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
      {/* Park Image */}
      <View style={{ width: '100%', height: 200, backgroundColor: '#EDECEA' }}>
        <Image
          source={{ uri: park.image_url || '/images/dog-park-placeholder.png' }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
        {/* City badge */}
        {park.city && (
          <View
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              backgroundColor: 'rgba(255,255,255,0.9)',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 100,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '500', color: '#6D6C6A' }}>{park.city}</Text>
          </View>
        )}
      </View>

      {/* Card Content */}
      <View style={{ padding: 16, gap: 6 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#1A1918' }} numberOfLines={1}>
          {park.name}
        </Text>
        {/* Address hidden pending data remediation */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <Ionicons name="paw" size={14} color="#3D8A5A" />
          <Text style={{ fontSize: 12, fontWeight: '500', color: '#3D8A5A' }}>View park details</Text>
        </View>
      </View>
    </Pressable>
  );
}

const STATE_SLUGS = ['alabama', 'arizona', 'arkansas', 'california', 'colorado', 'connecticut', 'delaware', 'florida', 'georgia', 'hawaii', 'idaho', 'illinois', 'indiana', 'iowa', 'kansas', 'kentucky', 'louisiana', 'maine', 'maryland', 'massachusetts', 'michigan', 'minnesota', 'mississippi', 'missouri', 'montana', 'nebraska', 'nevada', 'new-hampshire', 'new-jersey', 'new-mexico', 'new-york', 'north-carolina', 'north-dakota', 'ohio', 'oklahoma', 'oregon', 'pennsylvania', 'rhode-island', 'south-carolina', 'south-dakota', 'tennessee', 'texas', 'utah', 'vermont', 'virginia', 'washington', 'west-virginia', 'wisconsin', 'wyoming'];

/** Router: detects park slug vs state slug and renders the right component */
export default function DogParkSlugPage() {
  const { slug } = useLocalSearchParams<{ slug: string | string[] }>();
  const { session } = useAuth();
  
  // Handle both array (catch-all) and string formats
  const slugParts = Array.isArray(slug) ? slug : slug ? [slug] : [];

  // Debug logging
  if (typeof window !== 'undefined') {
    console.log('[DogParkSlugPage] slug:', slug, 'slugParts:', slugParts);
  }

  // Park detail: slug is ["state", "park-slug"] (e.g. ["minnesota", "stoneridge-park"])
  if (slugParts.length >= 2) {
    const stateSlug = slugParts[0];
    const parkSlug = slugParts.slice(1).join('/'); // Handle nested slugs
    if (STATE_SLUGS.includes(stateSlug)) {
      if (typeof window !== 'undefined') {
        console.log('[DogParkSlugPage] Rendering park detail:', { stateSlug, parkSlug });
      }
      if (!session) return <PublicParkDetail slugOrId={parkSlug} state={stateSlug} />;
      return <ParkDetailAuth slugOrId={parkSlug} state={stateSlug} />;
    }
  }

  // State listing: slug is a state name (e.g. ["minnesota"], ["new-york"])
  const stateSlug = slugParts.length > 0 ? slugParts[0] : '';
  return <StateDogParksPage stateSlug={stateSlug} />;
}

/** State listing page component with its own hooks */
const SORT_OPTIONS = [
  { key: 'nearest', label: 'Nearest' },
  { key: 'name-asc', label: 'Name (A–Z)' },
  { key: 'name-desc', label: 'Name (Z–A)' },
] as const;

type SortKey = (typeof SORT_OPTIONS)[number]['key'];

function getDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function StateDogParksPage({ stateSlug }: { stateSlug: string }) {
  const router = useRouter();

  const [parks, setParks] = useState<Park[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortKey>('name-asc');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);

  // Convert slug to state name: "minnesota" → "Minnesota", "new-york" → "New York"
  const stateName = (stateSlug || '')
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  useEffect(() => {
    if (!stateName) return;
    getParksByState(stateName)
      .then(setParks)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [stateName]);

  // Request geolocation when user picks "nearest"
  useEffect(() => {
    if (sortBy !== 'nearest' || userLocation) return;
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => {
          // Geolocation denied/unavailable — fall back to name sort
          setSortBy('name-asc');
        }
      );
    } else {
      setSortBy('name-asc');
    }
  }, [sortBy, userLocation]);

  // Filter and sort parks
  const filteredParks = useMemo(() => {
    let result = parks;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.city?.toLowerCase().includes(q) || p.address?.toLowerCase().includes(q)
      );
    }
    if (activeFilter === 'fenced') result = result.filter((p) => p.is_fenced);
    if (activeFilter === 'water') result = result.filter((p) => p.has_water);
    if (activeFilter === 'shade') result = result.filter((p) => p.has_shade);

    const sorted = [...result];
    if (sortBy === 'name-asc') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'name-desc') {
      sorted.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === 'nearest' && userLocation) {
      sorted.sort(
        (a, b) =>
          getDistanceMiles(userLocation.lat, userLocation.lon, a.latitude, a.longitude) -
          getDistanceMiles(userLocation.lat, userLocation.lon, b.latitude, b.longitude)
      );
    }
    return sorted;
  }, [parks, search, activeFilter, sortBy, userLocation]);

  // Pagination
  const totalPages = Math.ceil(filteredParks.length / PARKS_PER_PAGE);
  const paginatedParks = filteredParks.slice((currentPage - 1) * PARKS_PER_PAGE, currentPage * PARKS_PER_PAGE);
  const startIdx = (currentPage - 1) * PARKS_PER_PAGE + 1;
  const endIdx = Math.min(currentPage * PARKS_PER_PAGE, filteredParks.length);

  // Split into 2 columns
  const leftCol = paginatedParks.filter((_, i) => i % 2 === 0);
  const rightCol = paginatedParks.filter((_, i) => i % 2 === 1);

  const pageTitle = `Dog Parks in ${stateName}`;

  return (
    <>
      <SEOHead
        title={pageTitle}
        description={`Find ${parks.length || ''} dog parks in ${stateName}. Browse off-leash areas, fenced parks, and dog-friendly spots. Schedule a playdate with k9d8.`}
        url={`/dog-parks/${stateSlug}`}
      />
      <StructuredData
        data={breadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Dog Parks', url: '/dog-parks' },
          { name: stateName, url: `/dog-parks/${stateSlug}` },
        ])}
      />
      {filteredParks.length > 0 && (
        <StructuredData
          data={{
            '@type': 'ItemList',
            name: pageTitle,
            numberOfItems: filteredParks.length,
            itemListElement: filteredParks.slice(0, 10).map((park, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              item: { '@type': 'Place', name: park.name, address: park.address },
            })),
          }}
        />
      )}

      <ScrollView style={{ flex: 1, backgroundColor: '#F5F4F1' }} contentContainerStyle={{ minHeight: '100%' }}>
        <NavBar />

        <View role="main">
          {/* Page Header */}
          <View
            style={{
              backgroundColor: '#FAFAF8',
              paddingVertical: 32,
              borderBottomWidth: 1,
              borderBottomColor: '#E5E4E1',
              width: '100%',
            }}
          >
           <Container style={{ gap: 20 }}>
            {/* Breadcrumbs */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Pressable onPress={() => router.push('/landing')}>
                <Text style={{ fontSize: 13, fontWeight: '500', color: '#9C9B99' }}>Home</Text>
              </Pressable>
              <Text style={{ fontSize: 13, color: '#9C9B99' }}>/</Text>
              <Pressable onPress={() => router.push('/dog-parks' as any)}>
                <Text style={{ fontSize: 13, fontWeight: '500', color: '#9C9B99' }}>Dog Parks</Text>
              </Pressable>
              <Text style={{ fontSize: 13, color: '#9C9B99' }}>/</Text>
              <Text style={{ fontSize: 13, fontWeight: '500', color: '#1A1918' }}>{stateName}</Text>
            </View>

            {/* Title Row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 10 }}>
              <View style={{ gap: 8 }}>
                <Text
                  role="heading"
                  aria-level={1}
                  style={{ fontSize: 32, fontWeight: '700', color: '#1A1918', letterSpacing: -1 }}
                >
                  {pageTitle}
                </Text>
                {!loading && (
                  <Text style={{ fontSize: 15, color: '#6D6C6A' }}>
                    {filteredParks.length} parks found across {stateName}
                  </Text>
                )}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, position: 'relative', zIndex: 10 }}>
                <Text style={{ fontSize: 13, fontWeight: '500', color: '#9C9B99' }}>Sort by:</Text>
                <Pressable
                  onPress={() => setSortMenuOpen(!sortMenuOpen)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    borderWidth: 1,
                    borderColor: '#E5E4E1',
                    borderRadius: 8,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '500', color: '#1A1918' }}>
                    {SORT_OPTIONS.find((o) => o.key === sortBy)?.label}
                  </Text>
                  <Ionicons name="chevron-down" size={14} color="#9C9B99" />
                </Pressable>
                {sortMenuOpen && (
                  <View
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: 4,
                      backgroundColor: '#FFFFFF',
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: '#E5E4E1',
                      shadowColor: '#1A1918',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.08,
                      shadowRadius: 16,
                      overflow: 'hidden',
                      minWidth: 160,
                    }}
                  >
                    {SORT_OPTIONS.map((option) => (
                      <Pressable
                        key={option.key}
                        onPress={() => {
                          setSortBy(option.key);
                          setSortMenuOpen(false);
                          setCurrentPage(1);
                        }}
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 10,
                          backgroundColor: sortBy === option.key ? '#F5F4F1' : '#FFFFFF',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: sortBy === option.key ? '600' : '500',
                            color: sortBy === option.key ? '#3D8A5A' : '#1A1918',
                          }}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Search */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#E5E4E1',
                paddingHorizontal: 16,
                height: 48,
                gap: 10,
                width: '100%',
              }}
            >
              <Ionicons name="search" size={18} color="#9C9B99" />
              <TextInput
                value={search}
                onChangeText={(t) => { setSearch(t); setCurrentPage(1); }}
                placeholder={`Search parks in ${stateName}...`}
                placeholderTextColor="#9C9B99"
                style={{ flex: 1, fontSize: 15, color: '#1A1918', outlineStyle: 'none' } as any}
              />
            </View>

            {/* Filter Tags */}
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {FILTER_TAGS.map((tag) => {
                const isActive = activeFilter === tag.key;
                return (
                  <Pressable
                    key={tag.key}
                    onPress={() => { setActiveFilter(tag.key); setCurrentPage(1); }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingVertical: 8,
                      paddingHorizontal: 16,
                      borderRadius: 100,
                      backgroundColor: isActive ? '#3D8A5A' : '#FFFFFF',
                      borderWidth: isActive ? 0 : 1,
                      borderColor: '#E5E4E1',
                    }}
                  >
                    {tag.icon && (
                      <Ionicons name={tag.icon} size={14} color={isActive ? '#FFFFFF' : '#6D6C6A'} />
                    )}
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color: isActive ? '#FFFFFF' : '#6D6C6A',
                      }}
                    >
                      {tag.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
           </Container>
          </View>

          {/* Content Area */}
          <Container style={{ gap: 32, paddingVertical: 40 }}>
            {loading ? (
              <ActivityIndicator size="large" color="#3D8A5A" style={{ paddingVertical: 60 }} />
            ) : filteredParks.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 60, gap: 16 }}>
                <Ionicons name="location-outline" size={40} color="#9C9B99" />
                <Text style={{ fontSize: 16, color: '#6D6C6A', textAlign: 'center' }}>
                  No parks found matching your criteria.
                </Text>
              </View>
            ) : (
              <>
                <Text style={{ fontSize: 13, fontWeight: '500', color: '#9C9B99' }}>
                  Showing {startIdx}–{endIdx} of {filteredParks.length} parks
                </Text>

                {/* 2-column park grid */}
                <View style={{ flexDirection: 'row', gap: 20, width: '100%' }}>
                  <View style={{ flex: 1, gap: 20 }}>
                    {leftCol.map((park) => (
                      <ParkCard
                        key={park.id}
                        park={park}
                        onPress={() => router.push(`/dog-parks/${stateSlug}/${generateParkSlug(park.name)}` as any)}
                      />
                    ))}
                  </View>
                  <View style={{ flex: 1, gap: 20 }}>
                    {rightCol.map((park) => (
                      <ParkCard
                        key={park.id}
                        park={park}
                        onPress={() => router.push(`/dog-parks/${stateSlug}/${generateParkSlug(park.name)}` as any)}
                      />
                    ))}
                  </View>
                </View>

                {/* Pagination */}
                {totalPages > 1 && (
                  <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4, width: '100%' }}>
                    <Pressable
                      onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingVertical: 10,
                        paddingHorizontal: 14,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: '#E5E4E1',
                        opacity: currentPage === 1 ? 0.4 : 1,
                      }}
                    >
                      <Ionicons name="chevron-back" size={16} color="#9C9B99" />
                      <Text style={{ fontSize: 13, fontWeight: '500', color: '#6D6C6A' }}>Previous</Text>
                    </Pressable>

                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      const isActive = pageNum === currentPage;
                      return (
                        <Pressable
                          key={pageNum}
                          onPress={() => setCurrentPage(pageNum)}
                          style={{
                            paddingVertical: 10,
                            paddingHorizontal: 14,
                            borderRadius: 8,
                            backgroundColor: isActive ? '#3D8A5A' : 'transparent',
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 13,
                              fontWeight: isActive ? '600' : '500',
                              color: isActive ? '#FFFFFF' : '#6D6C6A',
                            }}
                          >
                            {pageNum}
                          </Text>
                        </Pressable>
                      );
                    })}

                    <Pressable
                      onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingVertical: 10,
                        paddingHorizontal: 14,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: '#E5E4E1',
                        opacity: currentPage === totalPages ? 0.4 : 1,
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '500', color: '#6D6C6A' }}>Next</Text>
                      <Ionicons name="chevron-forward" size={16} color="#9C9B99" />
                    </Pressable>
                  </View>
                )}
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
